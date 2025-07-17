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

  // SIMPLIFIED: Single source of truth for ALL hover state
  private hoveredComponents = new Set<string>(); // Just track component IDs
  
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

    // Determine sync partner ID and ensure proper component ID for editor components
    let syncPartnerId: string | undefined;
    let actualComponentId = componentId;
    
    if (isPreviewHover) {
      // Preview component - sync partner is editor component with same ID
      syncPartnerId = componentId; // Editor will be registered with same ID
    } else {
      // Editor component - find preview ID from attributes and ensure proper editor ID
      if (element.hasAttribute('editor-id')) {
        syncPartnerId = element.getAttribute('editor-id')!;
        // Ensure editor component has a proper ID for registration
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
    
    console.log(`[Register] ${actualComponentId} (${isPreviewHover ? 'preview' : 'editor'}) sync→${syncPartnerId || 'none'}`);

    // Set up SIMPLE event listeners with strict event isolation
    if (previewMode == PreviewModes.editor) {
      this.setupSimpleEventListeners(element, componentInfo);
    }

    // Create observable
    const subject = this.getOrCreateSubject(actualComponentId);
    return subject.asObservable().subscribe(result => {
      // Simple subscription - no complex logic here
    });
  }

  // ================================
  // SIMPLIFIED EVENT HANDLING
  // ================================

  private setupSimpleEventListeners(element: HTMLElement, componentInfo: ComponentHoverInfo): void {
    element.addEventListener('mouseenter', (event) => {
      // CRITICAL: Stop propagation to prevent automatic parent hovers
      event.stopPropagation();
      this.handleSimpleHover(componentInfo, true, event);
    });

    element.addEventListener('mouseleave', (event) => {
      // CRITICAL: Stop propagation but check for parent hover
      event.stopPropagation();
      this.handleSimpleUnhover(componentInfo, false, event);
    });
  }

  private handleSimpleHover(componentInfo: ComponentHoverInfo, isHovered: boolean, event: MouseEvent): void {
    console.log(`[SimpleHover] ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
    
    // STEP 1: Clear ALL existing hovers first (clean slate)
    this.clearAllHoversCompletely();

    // STEP 2: Apply hover to this component
    this.applyHoverToComponent(componentInfo, event);

    // STEP 3: Apply hover to sync partner (if exists)
    if (componentInfo.syncPartnerId) {
      const syncPartner = this.registeredComponents.get(componentInfo.syncPartnerId);
      if (syncPartner) {
        console.log(`[SimpleHover] Syncing to partner: ${syncPartner.componentId}`);
        this.applyHoverToComponent(syncPartner, event);
      }
    }

    // STEP 4: Apply secondary hovers to parents
    this.applySecondaryHoversToParents(componentInfo, event);

    // STEP 5: Notify observers
    this.notifyHoverChange(componentInfo.componentId, true, event);
  }

  private handleSimpleUnhover(componentInfo: ComponentHoverInfo, isHovered: boolean, event: MouseEvent): void {
    console.log(`[SimpleUnhover] ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
    
    // FIXED: Check if mouse moved to a parent component
    const parentComponentInfo = this.detectParentHoverFromEvent(event);
    if (parentComponentInfo) {
      console.log(`[SimpleUnhover] Mouse moved to parent: ${parentComponentInfo.componentId}`);
      // Trigger hover on parent instead of clearing
      this.handleSimpleHover(parentComponentInfo, true, event);
      return;
    }
    
    // SIMPLIFIED: Just clear everything cleanly if no parent found
    this.clearAllHoversCompletely();
    
    // Notify observers
    this.notifyHoverChange(componentInfo.componentId, false, event);
  }

  // ================================
  // PARENT HOVER DETECTION
  // ================================

  private detectParentHoverFromEvent(event: MouseEvent): ComponentHoverInfo | null {
    // Use relatedTarget to find where mouse moved to
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget) {
      console.log(`[ParentDetection] No relatedTarget found`);
      return null;
    }

    // Find the closest component with comptype or editor attributes
    const targetComponent = relatedTarget.closest('[comptype], [editor-comptype], [row-container-editor-comptype], [editor-section-id]') as HTMLElement;
    if (!targetComponent) {
      console.log(`[ParentDetection] No component found in relatedTarget`);
      return null;
    }

    // Get component ID based on type - USE SAME LOGIC AS REGISTRATION
    let componentId: string | null = null;
    if (targetComponent.hasAttribute('comptype')) {
      // Preview component
      componentId = targetComponent.id;
    } else if (targetComponent.hasAttribute('editor-comptype')) {
      // Editor component - use actual ID or create consistent ID
      if (targetComponent.id) {
        componentId = targetComponent.id;
      } else {
        const previewId = targetComponent.getAttribute('editor-id');
        componentId = previewId ? `editor_${previewId}` : null;
      }
    } else if (targetComponent.hasAttribute('row-container-editor-comptype')) {
      // Row container editor
      if (targetComponent.id) {
        componentId = targetComponent.id;
      } else {
        const previewId = targetComponent.getAttribute('row-container-editor-id');
        componentId = previewId ? `row_editor_${previewId}` : null;
      }
    } else if (targetComponent.hasAttribute('editor-section-id')) {
      // Section editor
      if (targetComponent.id) {
        componentId = targetComponent.id;
      } else {
        const previewId = targetComponent.getAttribute('editor-section-id');
        componentId = previewId ? `section_editor_${previewId}` : null;
      }
    }

    if (!componentId) {
      console.log(`[ParentDetection] No component ID found for target`);
      return null;
    }

    const componentInfo = this.registeredComponents.get(componentId);
    if (componentInfo) {
      console.log(`[ParentDetection] Found registered parent component: ${componentId}`);
      return componentInfo;
    } else {
      console.log(`[ParentDetection] Component not registered: ${componentId}, available:`, Array.from(this.registeredComponents.keys()));
      return null;
    }
  }

  // ================================
  // SIMPLIFIED HOVER APPLICATION
  // ================================

  private applyHoverToComponent(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    const { element, componentId, componentType, isPreviewHover, addSecondaryHover } = componentInfo;
    
    // Track as hovered
    this.hoveredComponents.add(componentId);
    console.log(`[ApplyHover] Adding ${componentId} to hovered set`);
    
    // Apply visual hover effects
    if (isPreviewHover) {
      const shiftDown = event?.shiftKey;
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        this.hoverDirectParent(element, true);
      } else {
        this.hoverPreviewComponent(element, true, addSecondaryHover);
      }
    } else {
      console.log(`[ApplyHover] Hovering editor component: ${componentId}`);
      this.hoverEditorComponent(element);
    }

    // Apply other original rules
    this.changeIndexOfHoverButton('1022', element, isPreviewHover);
  }

  private applySecondaryHoversToParents(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    const { element, componentId } = componentInfo;
    const targetCompType = element.getAttribute('comptype') as PageComponentNames;

    // Find all parent components that should get secondary hover
    const parentComponents = this.findParentComponents(element);
    
    parentComponents.forEach(parentElement => {
      const parentCompType = parentElement.getAttribute('comptype') as PageComponentNames;
      const parentComponentId = parentElement.id;
      
      if (this.SECONDARY_HOVER_TYPES.includes(parentCompType) && parentComponentId !== componentId) {
        // Track as hovered
        this.hoveredComponents.add(parentComponentId);
        
        // Apply secondary hover styling
        setTimeout(() => {
          const hoverOverlayEl = this.getHoverOverlayEl(parentComponentId);
          hoverOverlayEl?.classList.remove('outlined');
          hoverOverlayEl?.classList.add('hovered', 'hovered-secondary');
          
          // Hide floating label for secondary hover
          this.toggleFloatingLabel(parentElement, false);
        }, 0);
      }
    });

    // Handle special case: when hovering secondary type, remove its secondary status
    if (targetCompType && this.SECONDARY_HOVER_TYPES.includes(targetCompType)) {
      setTimeout(() => {
        this.getHoverOverlayEl(element.id)?.classList.remove('hovered-secondary');
        this.toggleFloatingLabel(element, true, false);
      }, 0);
    }
  }

  // ================================
  // SIMPLIFIED CLEANUP
  // ================================

  private clearAllHoversCompletely(): void {
    console.log(`[ClearAll] Clearing ${this.hoveredComponents.size} hovered components:`, Array.from(this.hoveredComponents));
    
    // Clear all tracked hovered components
    this.hoveredComponents.forEach(componentId => {
      const componentInfo = this.registeredComponents.get(componentId);
      if (componentInfo) {
        console.log(`[ClearAll] Clearing: ${componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
        this.removeHoverFromComponent(componentInfo);
      } else {
        console.log(`[ClearAll] WARNING: Component ${componentId} not found in registry`);
      }
    });

    // Reset state
    this.hoveredComponents.clear();
    console.log(`[ClearAll] All hovers cleared`);
  }

  private removeHoverFromComponent(componentInfo: ComponentHoverInfo): void {
    const { element, componentId, isPreviewHover } = componentInfo;
    
    console.log(`[RemoveHover] Removing hover from ${componentId} (isPreview: ${isPreviewHover}, hasCompType: ${element.hasAttribute('comptype')}, hasEditorCompType: ${element.hasAttribute('editor-comptype')})`);
    
    // Remove background image for preview components
    if (isPreviewHover && this.page?.components) {
      element.style.backgroundImage = this.page.components.data[element.id]?.styles.backgroundImageOptimizations ? 
        `url(${this.mediaService.getBackground(this.page!.components.data[element.id]?.styles.backgroundImageOptimizations, this.page!.components.data[element.id]?.styles.backgroundImageSize).backgroundSrc})` : '';
    }

    // Remove hover classes
    if (element.hasAttribute('comptype')) {
      // Preview component - remove from hover overlay
      console.log(`[RemoveHover] Removing hover overlay classes for preview component ${componentId}`);
      this.getHoverOverlayEl(element.id)?.classList.remove('hovered', 'outlined', 'hovered-secondary');
    } else {
      // Editor component - remove hovered class directly
      console.log(`[RemoveHover] Removing hovered class for editor component ${componentId}`, {
        beforeRemoval: element.classList.contains('hovered'),
        classList: Array.from(element.classList)
      });
      element.classList.remove('hovered');
      console.log(`[RemoveHover] After removal - still has hovered class:`, element.classList.contains('hovered'));
    }

    // Clear floating label (only remove .visible class)
    this.toggleFloatingLabel(element, false);
    
    // Reset button z-index
    this.changeIndexOfHoverButton('0', element, isPreviewHover);
    
    console.log(`[RemoveHover] Completed removal for ${componentId}`);
  }

  // ================================
  // UTILITY METHODS (simplified)
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

  // All the original UI methods (simplified)
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
    if (!editorElement) {
      console.log(`[HoverEditor] No editor element provided`);
      return;
    }
    
    // Handle drag-handle case
    if (editorElement?.classList.contains('drag-handle')) {
      console.log(`[HoverEditor] Element is drag-handle, using parent`);
      editorElement = editorElement.parentElement!;
    }
    
    if (!editorElement) {
      console.log(`[HoverEditor] No valid editor element after drag-handle check`);
      return;
    }
    
    console.log(`[HoverEditor] Adding hovered class to editor element ${editorElement.id || 'no-id'}`, {
      beforeAdd: editorElement.classList.contains('hovered'),
      classList: Array.from(editorElement.classList)
    });
    
    editorElement.classList.add('hovered');
    
    console.log(`[HoverEditor] After adding - has hovered class:`, editorElement.classList.contains('hovered'));
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
    // Selected components are handled purely by CSS
    const componentId = componentElement.id;
    const floatingLabel = document.getElementById(`component-label_${componentId}`);
    
    if (floatingLabel) {
      // Only show floating label for hovered components (not secondary hovers)
      // Selected components will always show via CSS automatically
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

    if (e.shiftKey) {
      // SIMPLIFIED: Find any currently hovered preview component
      const hoveredPreviewComponents = Array.from(this.hoveredComponents)
        .map(id => this.registeredComponents.get(id))
        .filter(info => info?.isPreviewHover);
      
      if (hoveredPreviewComponents.length > 0) {
        const componentInfo = hoveredPreviewComponents[0];
        this.clearAllHoversCompletely();
        this.hoverDirectParent(componentInfo!.element, true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (!this.page) return;

    if (!e.shiftKey) {
      // SIMPLIFIED: Find any currently hovered preview component
      const hoveredPreviewComponents = Array.from(this.hoveredComponents)
        .map(id => this.registeredComponents.get(id))
        .filter(info => info?.isPreviewHover);
      
      if (hoveredPreviewComponents.length > 0) {
        const componentInfo = hoveredPreviewComponents[0];
        this.clearAllHoversCompletely();
        this.hoverPreviewComponent(componentInfo!.element, true);
        
        // Re-apply sync if available
        if (componentInfo!.syncPartnerId) {
          const syncPartner = this.registeredComponents.get(componentInfo!.syncPartnerId);
          if (syncPartner) {
            this.hoverEditorComponent(syncPartner.element);
          }
        }
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
        this.handleSimpleHover(componentInfo, true, event || new MouseEvent('mouseenter'));
      } else {
        this.handleSimpleUnhover(componentInfo, false, event || new MouseEvent('mouseleave'));
      }
    }
  }

  public hasHoverFunctionality(componentId: string): boolean {
    return this.registeredComponents.has(componentId);
  }

  public destroyComponent(componentId: string) {
    const componentInfo = this.registeredComponents.get(componentId);
    if (componentInfo) {
      // Clear hover if it's currently hovered
      if (this.hoveredComponents.has(componentId)) {
        this.removeHoverFromComponent(componentInfo);
        this.hoveredComponents.delete(componentId);
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