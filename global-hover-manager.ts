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
  syncPartnerId?: string; // ID of the corresponding editor/preview component
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

    // SIMPLIFIED: Determine sync partner ID for bilateral sync
    let syncPartnerId: string | undefined;
    let actualComponentId = componentId;
    
    if (isPreviewHover) {
      // Preview component - find corresponding editor component ID
      const editorElement = document.querySelector(`[editor-id="${componentId}"], [row-container-editor-id="${componentId}"], [editor-section-id="${componentId}"]`) as HTMLElement;
      if (editorElement) {
        if (editorElement.hasAttribute('editor-id')) {
          syncPartnerId = editorElement.id || `editor_${componentId}`;
        } else if (editorElement.hasAttribute('row-container-editor-id')) {
          syncPartnerId = editorElement.id || `row_editor_${componentId}`;
        } else if (editorElement.hasAttribute('editor-section-id')) {
          syncPartnerId = editorElement.id || `section_editor_${componentId}`;
        }
      }
    } else {
      // Editor component - find preview ID from attributes and ensure proper editor ID
      if (element.hasAttribute('editor-id')) {
        syncPartnerId = element.getAttribute('editor-id')!;
        if (!element.id) {
          actualComponentId = `editor_${syncPartnerId}`;
          element.id = actualComponentId;
        } else {
          actualComponentId = element.id;
        }
      } else if (element.hasAttribute('row-container-editor-id')) {
        syncPartnerId = element.getAttribute('row-container-editor-id')!;
        if (!element.id) {
          actualComponentId = `row_editor_${syncPartnerId}`;
          element.id = actualComponentId;
        } else {
          actualComponentId = element.id;
        }
      } else if (element.hasAttribute('editor-section-id')) {
        syncPartnerId = element.getAttribute('editor-section-id')!;
        if (!element.id) {
          actualComponentId = `section_editor_${syncPartnerId}`;
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
      addSecondaryHover,
      syncPartnerId
    };

    // Register component with actual ID
    this.registeredComponents.set(actualComponentId, componentInfo);
    
    console.log(`[Register] ${actualComponentId} (${isPreviewHover ? 'preview' : 'editor'}) ↔ ${syncPartnerId || 'none'}`);

    // Set up SIMPLE bilateral hover events
    if (previewMode == PreviewModes.editor) {
      this.setupBilateralHoverEvents(element, componentInfo);
    }

    // Create observable
    const subject = this.getOrCreateSubject(actualComponentId);
    return subject.asObservable().subscribe(result => {
      // Simple subscription
    });
  }

  // ================================
  // BILATERAL HOVER EVENTS
  // ================================

  private setupBilateralHoverEvents(element: HTMLElement, componentInfo: ComponentHoverInfo): void {
    element.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
      this.handleBilateralHover(componentInfo, event);
    });

    element.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      this.handleBilateralUnhover(componentInfo, event);
    });
  }

  private handleBilateralHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    console.log(`[BilateralHover] ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
    
    // STEP 1: Clear any existing hover
    this.clearCurrentHover();

    // STEP 2: Find sync partner
    const partner = componentInfo.syncPartnerId ? 
      this.registeredComponents.get(componentInfo.syncPartnerId) : undefined;
    
    if (partner) {
      console.log(`[BilateralHover] Found partner: ${partner.componentId}`);
    } else {
      console.log(`[BilateralHover] No partner found for ${componentInfo.syncPartnerId || 'none'}`);
    }

    // STEP 3: Apply hover to BOTH components
    this.applyHoverToComponent(componentInfo, event);
    if (partner) {
      this.applyHoverToComponent(partner, event);
    }

    // STEP 4: Apply secondary hovers to parents
    const secondaryParents = this.applySecondaryHoversToParents(componentInfo, event);

    // STEP 5: Set current hover state
    this.currentHoveredPair = {
      primary: componentInfo,
      partner,
      secondaryParents
    };

    // STEP 6: Notify observers
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
          
          // Apply secondary hover styling
          setTimeout(() => {
            const hoverOverlayEl = this.getHoverOverlayEl(parentComponentId);
            hoverOverlayEl?.classList.remove('outlined');
            hoverOverlayEl?.classList.add('hovered', 'hovered-secondary');
            
            // Hide floating label for secondary hover
            this.toggleFloatingLabel(parentElement, false);
          }, 0);
        }
      }
    });

    // Handle special case: when hovering secondary type, remove its secondary status
    if (targetCompType && this.SECONDARY_HOVER_TYPES.includes(targetCompType)) {
      setTimeout(() => {
        this.getHoverOverlayEl(element.id)?.classList.remove('hovered-secondary');
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
    
    // Remove hover from partner
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

    // Remove hover classes
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