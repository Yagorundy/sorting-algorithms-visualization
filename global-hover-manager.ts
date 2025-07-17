import { Injectable, OnDestroy } from '@angular/core';
import { Page } from '@common/data/page/Page';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
import { PreviewModes } from "@common/data/report/enums/PreviewModes";
import { Store } from '@ngrx/store';
import { isDisabledCarouselSlide } from '@report-editor-components/helpers/editor-component.helper';
import { ReportFilesService } from '@shared/services/reports/report-files.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { AppState } from 'src/app/app.state';

export interface HoverState {
  isHovered?: boolean;
  event?: MouseEvent;
}

interface ComponentHoverInfo {
  element: HTMLElement;
  componentId: string;
  componentType: PageComponentNames;
  isPreviewHover: boolean;
  addSecondaryHover: boolean;
  // Removed syncPartnerId - we'll find it dynamically
}

@Injectable({
  providedIn: 'root'
})
export class GlobalHoverManager implements OnDestroy {
  private page?: Page;
  private subscriptions: Subscription[] = [];
  private keyDownListenerMethod = this.onKeyDown.bind(this);
  private keyUpListenerMethod = this.onKeyUp.bind(this);

  // ULTRA SIMPLE: Track currently hovered pair
  private currentHoveredPair: {
    primary: ComponentHoverInfo;
    partner?: ComponentHoverInfo;
    secondaryParents: ComponentHoverInfo[];
  } | null = null;
  
  // EVENT HANDLING PROTECTION
  private isProcessingHover = false;
  
  // Component registration and observables
  private registeredComponents = new Map<string, ComponentHoverInfo>();
  private hoverSubjects = new Map<string, Subject<HoverState>>();

  // Secondary hover component types (from original logic)
  private readonly SECONDARY_HOVER_TYPES = [
    PageComponentNames.section,
    PageComponentNames.button,
    PageComponentNames.row,
    PageComponentNames.detail,
    PageComponentNames.column,
    PageComponentNames.card
  ];

  constructor(
    private mediaService: ReportFilesService,
    private store: Store<AppState>,
  ) {
    this.subscriptions.push(
      this.store.select(state => state.report.pagePreview.loadedPage).subscribe((loadedPage?: Page) => {
        if (loadedPage) this.page = loadedPage;
      }),
    );

    document.addEventListener("keydown", this.keyDownListenerMethod);
    document.addEventListener("keyup", this.keyUpListenerMethod);
  }

  // ================================
  // SIMPLIFIED COMPONENT REGISTRATION
  // ================================

  public registerComponent(
    element: HTMLElement,
    componentType: PageComponentNames,
    componentId: string,
    isPreviewHover: boolean,
    previewMode: PreviewModes,
    containerType?: PageGridComponentNames
  ): Subscription {
    // Calculate addSecondaryHover (original logic)
    const addSecondaryHover = PageComponentNames.detail == componentType && 
                             !(componentType == PageComponentNames.detail && containerType == PageGridComponentNames.detail);

    // SIMPLIFIED: No more sync partner caching - we'll find them dynamically
    let actualComponentId = componentId;
    
    if (!isPreviewHover) {
      // Editor component - ensure proper editor ID
      if (element.hasAttribute('editor-id')) {
        if (!element.id) {
          actualComponentId = `editor_${element.getAttribute('editor-id')}`;
          element.id = actualComponentId;
        } else {
          actualComponentId = element.id;
        }
      } else if (element.hasAttribute('row-container-editor-id')) {
        if (!element.id) {
          actualComponentId = `row_editor_${element.getAttribute('row-container-editor-id')}`;
          element.id = actualComponentId;
        } else {
          actualComponentId = element.id;
        }
      } else if (element.hasAttribute('editor-section-id')) {
        if (!element.id) {
          actualComponentId = `section_editor_${element.getAttribute('editor-section-id')}`;
          element.id = actualComponentId;
        } else {
          actualComponentId = element.id;
        }
      }
    }

    const componentInfo: ComponentHoverInfo = {
      element,
      componentId: actualComponentId,
      componentType,
      isPreviewHover,
      addSecondaryHover
    };

    // Register component with actual ID
    this.registeredComponents.set(actualComponentId, componentInfo);
    
    console.log(`[Register] ${actualComponentId} (${isPreviewHover ? 'preview' : 'editor'})`);

    // Set up bilateral hover events with spam protection
    if (previewMode == PreviewModes.editor) {
      this.setupProtectedHoverEvents(element, componentInfo);
    }

    // Create observable
    const subject = this.getOrCreateSubject(actualComponentId);
    return subject.asObservable().subscribe(result => {
      // Simple subscription
    });
  }

  // ================================
  // DYNAMIC SYNC PARTNER DETECTION
  // ================================

  private findSyncPartner(componentInfo: ComponentHoverInfo): ComponentHoverInfo | null {
    const { element, componentId, isPreviewHover } = componentInfo;
    
    if (isPreviewHover) {
      // Preview component - find corresponding editor component
      console.log(`[FindSync] Looking for editor partner for preview ${componentId}`);
      
      const editorSelectors = [
        `[editor-id="${componentId}"]`,
        `[row-container-editor-id="${componentId}"]`, 
        `[editor-section-id="${componentId}"]`
      ];
      
      for (const selector of editorSelectors) {
        const editorElement = document.querySelector(selector) as HTMLElement;
        if (editorElement) {
          // Determine the editor component ID
          let editorComponentId = editorElement.id;
          if (!editorComponentId) {
            if (editorElement.hasAttribute('editor-id')) {
              editorComponentId = `editor_${componentId}`;
            } else if (editorElement.hasAttribute('row-container-editor-id')) {
              editorComponentId = `row_editor_${componentId}`;
            } else if (editorElement.hasAttribute('editor-section-id')) {
              editorComponentId = `section_editor_${componentId}`;
            }
          }
          
          const editorComponentInfo = this.registeredComponents.get(editorComponentId);
          if (editorComponentInfo) {
            console.log(`[FindSync] Found editor partner: ${editorComponentId}`);
            return editorComponentInfo;
          } else {
            console.log(`[FindSync] Editor element found but not registered: ${editorComponentId}`);
          }
        }
      }
      
      // GRACEFUL HANDLING: Editor component might not be available when menu changes
      console.log(`[FindSync] No editor partner found for preview ${componentId} - this is normal when editor menu has changed`);
      return null;
      
    } else {
      // Editor component - find corresponding preview component
      console.log(`[FindSync] Looking for preview partner for editor ${componentId}`);
      
      let previewId: string | null = null;
      if (element.hasAttribute('editor-id')) {
        previewId = element.getAttribute('editor-id');
      } else if (element.hasAttribute('row-container-editor-id')) {
        previewId = element.getAttribute('row-container-editor-id');
      } else if (element.hasAttribute('editor-section-id')) {
        previewId = element.getAttribute('editor-section-id');
      }
      
      if (previewId) {
        const previewComponentInfo = this.registeredComponents.get(previewId);
        if (previewComponentInfo) {
          console.log(`[FindSync] Found preview partner: ${previewId}`);
          return previewComponentInfo;
        } else {
          console.log(`[FindSync] Preview component not registered: ${previewId}`);
        }
      } else {
        console.log(`[FindSync] No preview ID found in editor attributes`);
      }
      
      return null;
    }
  }

  // ================================
  // PROTECTED HOVER EVENTS (Anti-spam)
  // ================================

  private setupProtectedHoverEvents(element: HTMLElement, componentInfo: ComponentHoverInfo): void {
    element.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
      this.handleProtectedHover(componentInfo, event);
    });

    element.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      this.handleProtectedUnhover(componentInfo, event);
    });
  }

  private handleProtectedHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    // SPAM PROTECTION: Prevent concurrent hover operations
    if (this.isProcessingHover) {
      console.log(`[ProtectedHover] BLOCKED - already processing hover for ${componentInfo.componentId}`);
      return;
    }
    
    this.isProcessingHover = true;
    
    try {
      this.handleBilateralHover(componentInfo, event);
    } finally {
      // Always release the lock
      this.isProcessingHover = false;
    }
  }

  private handleProtectedUnhover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    // SPAM PROTECTION: Prevent concurrent hover operations  
    if (this.isProcessingHover) {
      console.log(`[ProtectedUnhover] BLOCKED - already processing hover for ${componentInfo.componentId}`);
      return;
    }
    
    this.isProcessingHover = true;
    
    try {
      this.handleBilateralUnhover(componentInfo, event);
    } finally {
      // Always release the lock
      this.isProcessingHover = false;
    }
  }

  private handleBilateralHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    console.log(`[BilateralHover] ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
    
    // STEP 1: Clear any existing hover
    this.clearCurrentHover();

    // STEP 2: Find sync partner DYNAMICALLY (might not exist)
    const partner = this.findSyncPartner(componentInfo);

    // STEP 3: Apply hover to primary component (always works)
    this.applyHoverToComponent(componentInfo, event);
    
    // STEP 4: Apply hover to partner component (if available)
    if (partner) {
      this.applyHoverToComponent(partner, event);
    }

    // STEP 5: Apply secondary hovers to parents (simplified logic)
    const secondaryParents = this.applySecondaryHoversToParents(componentInfo, event);

    // STEP 6: Set current hover state
    this.currentHoveredPair = {
      primary: componentInfo,
      partner,
      secondaryParents
    };

    // STEP 7: Notify observers
    this.notifyHoverChange(componentInfo.componentId, true, event);
  }

  private handleBilateralUnhover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    console.log(`[BilateralUnhover] ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
    
    // SIMPLE: Check if mouse moved to a parent component
    const parentComponentInfo = this.detectParentHoverFromEvent(event);
    if (parentComponentInfo) {
      console.log(`[BilateralUnhover] Mouse moved to parent: ${parentComponentInfo.componentId}`);
      // Trigger parent hover
      this.handleBilateralHover(parentComponentInfo, event);
      return;
    }
    
    // SIMPLE: Clear current hover completely
    this.clearCurrentHover();
    
    // Notify observers
    this.notifyHoverChange(componentInfo.componentId, false, event);
  }

  // ================================
  // PARENT HOVER DETECTION
  // ================================

  private detectParentHoverFromEvent(event: MouseEvent): ComponentHoverInfo | null {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget) return null;

    // Find the closest component
    const targetComponent = relatedTarget.closest('[comptype], [editor-comptype], [row-container-editor-comptype], [editor-section-id]') as HTMLElement;
    if (!targetComponent) return null;

    // Get component ID - CONSISTENT with registration logic
    let componentId: string | null = null;
    if (targetComponent.hasAttribute('comptype')) {
      componentId = targetComponent.id;
    } else if (targetComponent.hasAttribute('editor-comptype')) {
      if (targetComponent.id) {
        componentId = targetComponent.id;
      } else {
        const previewId = targetComponent.getAttribute('editor-id');
        componentId = previewId ? `editor_${previewId}` : null;
      }
    } else if (targetComponent.hasAttribute('row-container-editor-comptype')) {
      if (targetComponent.id) {
        componentId = targetComponent.id;
      } else {
        const previewId = targetComponent.getAttribute('row-container-editor-id');
        componentId = previewId ? `row_editor_${previewId}` : null;
      }
    } else if (targetComponent.hasAttribute('editor-section-id')) {
      if (targetComponent.id) {
        componentId = targetComponent.id;
      } else {
        const previewId = targetComponent.getAttribute('editor-section-id');
        componentId = previewId ? `section_editor_${previewId}` : null;
      }
    }

    if (!componentId) return null;

    const componentInfo = this.registeredComponents.get(componentId);
    if (componentInfo) {
      console.log(`[ParentDetection] Found registered parent: ${componentId}`);
      return componentInfo;
    } else {
      console.log(`[ParentDetection] Parent not registered: ${componentId}`);
      return null;
    }
  }

  // ================================
  // HOVER APPLICATION
  // ================================

  private applyHoverToComponent(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    const { element, componentId, isPreviewHover, addSecondaryHover } = componentInfo;
    
    console.log(`[ApplyHover] Applying hover to ${componentId} (${isPreviewHover ? 'preview' : 'editor'})`);
    
    // Apply visual hover effects
    if (isPreviewHover) {
      const shiftDown = event?.shiftKey;
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        this.hoverDirectParent(element, true);
      } else {
        this.hoverPreviewComponent(element, true, addSecondaryHover);
      }
    } else {
      this.hoverEditorComponent(element);
    }

    // Apply other original rules
    this.changeIndexOfHoverButton('1022', element, isPreviewHover);
  }

  private applySecondaryHoversToParents(componentInfo: ComponentHoverInfo, event: MouseEvent): ComponentHoverInfo[] {
    const { element, componentId } = componentInfo;
    const targetCompType = element.getAttribute('comptype') as PageComponentNames;
    const secondaryParents: ComponentHoverInfo[] = [];

    // Find all parent components that should get secondary hover
    const parentComponents = this.findParentComponents(element);
    
    parentComponents.forEach(parentElement => {
      const parentCompType = parentElement.getAttribute('comptype') as PageComponentNames;
      const parentComponentId = parentElement.id;
      
      if (this.SECONDARY_HOVER_TYPES.includes(parentCompType) && parentComponentId !== componentId) {
        const parentInfo = this.registeredComponents.get(parentComponentId);
        if (parentInfo) {
          secondaryParents.push(parentInfo);
          
          // ORIGINAL LOGIC: Apply secondary hover styling to PARENTS only
          setTimeout(() => {
            const hoverOverlayEl = this.getHoverOverlayEl(parentComponentId);
            hoverOverlayEl?.classList.remove('outlined');
            hoverOverlayEl?.classList.add('hovered', 'hovered-secondary');
            
            // Hide floating label for secondary hover (parents)
            this.toggleFloatingLabel(parentElement, false);
          }, 0);
        }
      }
    });

    // ORIGINAL LOGIC: If the directly hovered component is a secondary type, 
    // remove its secondary status (so it shows as primary hover)
    if (targetCompType && this.SECONDARY_HOVER_TYPES.includes(targetCompType)) {
      setTimeout(() => {
        this.getHoverOverlayEl(element.id)?.classList.remove('hovered-secondary');
        // Show floating label for the directly hovered component (primary hover)
        this.toggleFloatingLabel(element, true, false);
      }, 0);
    }

    return secondaryParents;
  }

  // ================================
  // CLEANUP
  // ================================

  private clearCurrentHover(): void {
    if (!this.currentHoveredPair) {
      console.log(`[ClearHover] No current hover to clear`);
      return;
    }

    const { primary, partner, secondaryParents } = this.currentHoveredPair;
    
    console.log(`[ClearHover] Clearing bilateral hover - primary: ${primary.componentId}, partner: ${partner?.componentId || 'none'}, parents: ${secondaryParents.length}`);

    // Remove hover from primary
    this.removeHoverFromComponent(primary);
    
    // Remove hover from partner (if it exists)
    if (partner) {
      this.removeHoverFromComponent(partner);
    }
    
    // Remove hover from secondary parents
    secondaryParents.forEach(parentInfo => {
      this.removeHoverFromComponent(parentInfo);
    });

    // Reset state
    this.currentHoveredPair = null;
    console.log(`[ClearHover] Bilateral hover cleared`);
  }

  private removeHoverFromComponent(componentInfo: ComponentHoverInfo): void {
    const { element, componentId, isPreviewHover } = componentInfo;
    
    console.log(`[RemoveHover] Removing hover from ${componentId} (${isPreviewHover ? 'preview' : 'editor'})`);
    
    // Remove background image for preview components
    if (isPreviewHover && this.page?.components) {
      element.style.backgroundImage = this.page.components.data[element.id]?.styles.backgroundImageOptimizations ? 
        `url(${this.mediaService.getBackground(this.page!.components.data[element.id]?.styles.backgroundImageOptimizations, this.page!.components.data[element.id]?.styles.backgroundImageSize).backgroundSrc})` : '';
    }

    // Remove hover classes (including hovered-secondary for parents)
    if (element.hasAttribute('comptype')) {
      // Preview component - remove from hover overlay
      this.getHoverOverlayEl(element.id)?.classList.remove('hovered', 'outlined', 'hovered-secondary');
    } else {
      // Editor component - remove hovered class directly
      element.classList.remove('hovered');
    }

    // Clear floating label (only remove .visible class)
    this.toggleFloatingLabel(element, false);
    
    // Reset button z-index
    this.changeIndexOfHoverButton('0', element, isPreviewHover);
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private findParentComponents(element: HTMLElement): HTMLElement[] {
    const parents: HTMLElement[] = [];
    let current = element.parentElement;
    
    while (current) {
      if (current.hasAttribute('comptype')) {
        parents.push(current);
      }
      current = current.parentElement;
    }
    
    return parents;
  }

  // All the original UI methods
  private getHoverOverlayEl(id: string) {
    return document.getElementById(`hover-overlay_${id}`);
  }

  private hoverPreviewComponent(componentElement: HTMLElement | null, addOutline?: boolean, addSecondaryHover?: boolean) {
    if (!componentElement) return;

    const detailDialog = document.querySelector(".detail-dialog");
    if (detailDialog && !detailDialog.contains(componentElement)) return;

    if (isDisabledCarouselSlide(componentElement)) return;

    const hoverOverlayEl = this.getHoverOverlayEl(componentElement.id);
    const classList: string[] = ['hovered'];

    if (addOutline && !componentElement.classList.contains("selected")) {
      classList.push('outlined');
    }

    if (addSecondaryHover) {
      classList.push('hovered-secondary');
    } else {
      hoverOverlayEl?.classList.remove('hovered-secondary');
    }

    hoverOverlayEl?.classList.add(...classList);

    const component = this.page!.components.data[componentElement.id];
    if (component?.styles.states?.hover.backgroundImageOptimizations)
      componentElement.style.backgroundImage = `url(${this.mediaService.getBackground(component.styles.states.hover.backgroundImageOptimizations).backgroundSrc})`;
    else if (component?.styles.backgroundImageOptimizations && component?.styles.states?.hover.removedBackgroundImageForState)
      componentElement.style.backgroundImage = '';

    this.toggleFloatingLabel(componentElement, true, addSecondaryHover);
  }

  private hoverDirectParent(componentElement: HTMLElement | null, isPreviewHover: boolean) {
    if (!componentElement) return;
    const parent: HTMLElement | null = componentElement.parentElement;
    if (parent && isPreviewHover) this.hoverPreviewComponent(parent, true);
  }

  private hoverEditorComponent(editorElement: HTMLElement | null) {
    if (!editorElement) return;
    
    // Handle drag-handle case
    if (editorElement?.classList.contains('drag-handle')) {
      editorElement = editorElement.parentElement!;
    }
    
    if (!editorElement) return;
    
    console.log(`[HoverEditor] Adding hovered class to ${editorElement.id || 'no-id'}`);
    editorElement.classList.add('hovered');
  }

  private changeIndexOfHoverButton(value: string, fragment: HTMLElement, isPreviewHover: boolean) {
    if (isPreviewHover) return;
    const editorButtonElement = fragment.querySelector('#editorButton') as HTMLElement;
    if (editorButtonElement) {
      editorButtonElement.style.zIndex = value;
    }
  }

  private toggleFloatingLabel(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover?: boolean) {
    // SIMPLIFIED: Only manage .visible class for hover states
    const componentId = componentElement.id;
    const floatingLabel = document.getElementById(`component-label_${componentId}`);
    
    if (floatingLabel) {
      // Only show floating label for hovered components (not secondary hovers)
      if (isHovered && !isSecondaryHover) {
        floatingLabel.classList.add('visible');
      } else {
        floatingLabel.classList.remove('visible');
      }
    }
  }

  // ================================
  // OBSERVABLE MANAGEMENT
  // ================================

  private getOrCreateSubject(componentId: string): Subject<HoverState> {
    if (!this.hoverSubjects.has(componentId)) {
      this.hoverSubjects.set(componentId, new Subject());
    }
    return this.hoverSubjects.get(componentId)!;
  }

  private notifyHoverChange(componentId: string, isHovered: boolean, event?: MouseEvent): void {
    const subject = this.hoverSubjects.get(componentId);
    if (subject) {
      subject.next({ isHovered, event });
    }
  }

  // ================================
  // KEYBOARD EVENTS (simplified)
  // ================================

  private onKeyDown(e: KeyboardEvent) {
    if (e.repeat || !this.page) return;

    if (e.shiftKey && this.currentHoveredPair) {
      const componentInfo = this.currentHoveredPair.primary;
      if (componentInfo.isPreviewHover) {
        this.clearCurrentHover();
        this.hoverDirectParent(componentInfo.element, true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (!this.page) return;

    if (!e.shiftKey && this.currentHoveredPair) {
      const componentInfo = this.currentHoveredPair.primary;
      if (componentInfo.isPreviewHover) {
        this.clearCurrentHover();
        this.handleBilateralHover(componentInfo, new MouseEvent('mouseenter'));
      }
    }
  }

  // ================================
  // PUBLIC API
  // ================================

  public setComponentHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    const componentInfo = this.registeredComponents.get(componentId);
    if (componentInfo) {
      if (isHovered) {
        this.handleBilateralHover(componentInfo, event || new MouseEvent('mouseenter'));
      } else {
        this.handleBilateralUnhover(componentInfo, event || new MouseEvent('mouseleave'));
      }
    }
  }

  public hasHoverFunctionality(componentId: string): boolean {
    return this.registeredComponents.has(componentId);
  }

  public destroyComponent(componentId: string) {
    const componentInfo = this.registeredComponents.get(componentId);
    if (componentInfo) {
      // Clear hover if it's currently part of hovered pair
      if (this.currentHoveredPair && 
          (this.currentHoveredPair.primary === componentInfo || 
           this.currentHoveredPair.partner === componentInfo)) {
        this.clearCurrentHover();
      }
      
      // Clean up
      this.registeredComponents.delete(componentId);
      this.hoverSubjects.get(componentId)?.complete();
      this.hoverSubjects.delete(componentId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    document.removeEventListener("keydown", this.keyDownListenerMethod);
    document.removeEventListener("keyup", this.keyUpListenerMethod);
    
    this.hoverSubjects.forEach(subject => subject.complete());
    this.hoverSubjects.clear();
    this.registeredComponents.clear();
  }
}