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
}

@Injectable({
  providedIn: 'root'
})
export class GlobalHoverManager implements OnDestroy {
  private page?: Page;
  private subscriptions: Subscription[] = [];
  private keyDownListenerMethod = this.onKeyDown.bind(this);
  private keyUpListenerMethod = this.onKeyUp.bind(this);

  // Single source of truth for hover state
  private currentHoveredComponent: ComponentHoverInfo | null = null;
  private secondaryHoveredComponents = new Set<ComponentHoverInfo>();
  
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
  // COMPONENT REGISTRATION
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

    const componentInfo: ComponentHoverInfo = {
      element,
      componentId,
      componentType,
      isPreviewHover,
      addSecondaryHover
    };

    // Register component
    this.registeredComponents.set(componentId, componentInfo);
    
    // Debug: Component registration
    // console.log(`[GlobalHoverManager] Registered component:`, { componentId, componentType, isPreviewHover });

    // Set up event listeners with smart hover management
    if (previewMode == PreviewModes.editor) {
      this.setupSmartEventListeners(element, componentInfo);
    }

    // Create observable
    const subject = this.getOrCreateSubject(componentId);
    return subject.asObservable().subscribe(result => {
      // The subscription will be triggered by our smart hover management
      // No need for complex logic here - it's all handled globally
    });
  }

  // ================================
  // SMART EVENT HANDLING
  // ================================

  private setupSmartEventListeners(element: HTMLElement, componentInfo: ComponentHoverInfo): void {
    element.addEventListener('mouseenter', (event) => {
      // CRITICAL: Stop propagation to prevent parent hovers
      event.stopPropagation();
      this.handleSmartHover(componentInfo, true, event);
    });

    element.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      this.handleSmartHover(componentInfo, false, event);
    });
  }

  private handleSmartHover(componentInfo: ComponentHoverInfo, isHovered: boolean, event: MouseEvent): void {
    if (isHovered) {
      this.setGlobalHover(componentInfo, event);
    } else {
      this.clearGlobalHover(componentInfo, event);
    }
  }

  // ================================
  // GLOBAL HOVER STATE MANAGEMENT
  // ================================

  private setGlobalHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    // Debug: Global hover state
    // console.log(`[GlobalHoverManager] Setting global hover for ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);

    // 1. Clear all current hovers
    this.clearAllHovers();

    // 2. Apply original custom rules
    this.applyHoverWithRules(componentInfo, event);

    // 3. Trigger observables
    this.notifyHoverChange(componentInfo.componentId, true, event);
  }

  private clearGlobalHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    // Smart parent detection when mouse leaves child
    const parentComponent = this.findParentComponentFromEvent(event);
    
    if (parentComponent) {
      // Mouse moved to parent - hover the parent
      this.setGlobalHover(parentComponent, event);
      return;
    }
    
    // Check for editor/preview synchronization
    const syncTarget = this.handleEditorPreviewSync(event);
    if (syncTarget) {
      // Found sync target - hover it instead of clearing
      this.setGlobalHover(syncTarget, event);
      return;
    }
    
    // FIXED: Always clear all hovers when no parent or sync target found
    // This ensures editor components get properly unhovered
    this.clearAllHovers();
    this.notifyHoverChange(componentInfo.componentId, false, event);
  }

  private handleEditorPreviewSync(event: MouseEvent): ComponentHoverInfo | null {
    // Original onUnHoverEvent logic for editor/preview sync
    let directlyHoveredComponent = Array.from(document.querySelectorAll(':hover')).filter(
      e => e.hasAttribute('comptype') ||
        e.hasAttribute('editor-comptype') ||
        e.hasAttribute('row-container-editor-comptype') ||
        e.hasAttribute('editor-section-id')
    ).pop() as HTMLElement | undefined;

    console.log(`[EditorPreviewSync] Looking for sync target. Found hovered component:`, directlyHoveredComponent?.id || 'none');

    if (directlyHoveredComponent) {
      let previewComponent: HTMLElement | undefined = undefined;
      let editorComponent: HTMLElement | undefined = undefined;

      const isEditorRowContainer = directlyHoveredComponent.hasAttribute('row-container-editor-comptype');
      const isEditorSectionContainer = directlyHoveredComponent.hasAttribute('editor-section-id');
      const isEditorComponent = directlyHoveredComponent.hasAttribute('editor-comptype');
      const isPreviewComponent = directlyHoveredComponent.hasAttribute('comptype');

      console.log(`[EditorPreviewSync] Component type detection:`, { isEditorRowContainer, isEditorSectionContainer, isEditorComponent, isPreviewComponent });

      if (isEditorComponent) {
        editorComponent = directlyHoveredComponent;
        previewComponent = document.querySelector(`[id="${directlyHoveredComponent.getAttribute('editor-id')}"]`) as HTMLElement | undefined;
      } else if (isEditorRowContainer) {
        editorComponent = directlyHoveredComponent;
        previewComponent = document.querySelector(`[id="${directlyHoveredComponent.getAttribute('row-container-editor-id')}"]`) as HTMLElement | undefined;
      } else if (isEditorSectionContainer) {
        editorComponent = directlyHoveredComponent;
        previewComponent = document.querySelector(`[id="${directlyHoveredComponent.getAttribute('editor-section-id')}"]`) as HTMLElement | undefined;
      } else if (isPreviewComponent) {
        editorComponent = document.querySelector(`[editor-id="${directlyHoveredComponent.id}"]`) as HTMLElement | undefined;
        previewComponent = directlyHoveredComponent;
      }

      // Return sync target if found
      if (previewComponent) {
        const previewComponentInfo = this.registeredComponents.get(previewComponent.id);
        console.log(`[EditorPreviewSync] Found preview sync target: ${previewComponent.id}`, previewComponentInfo ? 'registered' : 'not registered');
        if (previewComponentInfo) {
          return previewComponentInfo;
        }
      }
      
      if (editorComponent) {
        const editorComponentInfo = this.registeredComponents.get(editorComponent.id);
        console.log(`[EditorPreviewSync] Found editor sync target: ${editorComponent.id}`, editorComponentInfo ? 'registered' : 'not registered');
        if (editorComponentInfo) {
          return editorComponentInfo;
        }
      }
    }
    
    console.log(`[EditorPreviewSync] No sync target found`);
    return null;
  }

  private applyHoverWithRules(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    const { element, componentId, componentType, isPreviewHover, addSecondaryHover } = componentInfo;
    const shiftDown = event?.shiftKey;

    // Apply primary hover
    if (isPreviewHover) {
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        this.hoverDirectParent(element, true);
      } else {
        this.hoverPreviewComponent(element, true, addSecondaryHover);
      }
    } else {
      this.hoverEditorComponent(element);
    }

    // CRITICAL: Apply editor ↔ preview synchronization
    this.syncEditorPreviewHover(componentInfo, event);

    // Apply secondary hovers to parents (original handleNonTargetElements logic)
    this.applySecondaryHoversToParents(componentInfo, event);

    // Apply other original rules
    this.changeIndexOfHoverButton('1022', element, isPreviewHover);
    
    // Set current state
    this.currentHoveredComponent = componentInfo;
  }

  // ================================
  // EDITOR ↔ PREVIEW SYNCHRONIZATION
  // ================================

  private syncEditorPreviewHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
    const { element, componentId, isPreviewHover } = componentInfo;

    if (isPreviewHover) {
      // Preview component hovered → find and hover corresponding editor component
      const editorComponent = this.findCorrespondingEditorComponent(element);
      if (editorComponent) {
        console.log(`[EditorPreviewSync] Preview ${componentId} → Editor ${editorComponent.id}`);
        this.hoverEditorComponent(editorComponent);
        // CRITICAL: Add to secondary hovers so it gets cleaned up properly
        const editorComponentInfo = this.registeredComponents.get(editorComponent.id);
        if (editorComponentInfo) {
          this.secondaryHoveredComponents.add(editorComponentInfo);
        }
      } else {
        console.log(`[EditorPreviewSync] No editor component found for preview ${componentId}`);
      }
    } else {
      // Editor component hovered → find and hover corresponding preview component
      const previewComponent = this.findCorrespondingPreviewComponent(element);
      if (previewComponent) {
        console.log(`[EditorPreviewSync] Editor ${componentId} → Preview ${previewComponent.id}`);
        this.hoverPreviewComponent(previewComponent, true, false);
        // CRITICAL: Add to secondary hovers so it gets cleaned up properly
        const previewComponentInfo = this.registeredComponents.get(previewComponent.id);
        if (previewComponentInfo) {
          this.secondaryHoveredComponents.add(previewComponentInfo);
        }
      } else {
        console.log(`[EditorPreviewSync] No preview component found for editor ${componentId}`);
      }
    }
  }

  private findCorrespondingEditorComponent(previewElement: HTMLElement): HTMLElement | null {
    const previewId = previewElement.id;
    if (!previewId) {
      console.log(`[EditorPreviewSync] Preview element has no ID`);
      return null;
    }

    // Try different editor attribute patterns
    const selectors = [
      `[editor-id="${previewId}"]`,
      `[row-container-editor-id="${previewId}"]`,
      `[editor-section-id="${previewId}"]`
    ];

    // Debug: Searching for editor component
    // console.log(`[EditorPreviewSync] Looking for editor component for preview ${previewId}`);

    for (const selector of selectors) {
      const editorElement = document.querySelector(selector) as HTMLElement;
      if (editorElement) {
        // console.log(`[EditorPreviewSync] Found editor component using selector: ${selector}`);
        return editorElement;
      }
    }

    // console.log(`[EditorPreviewSync] No editor component found for preview ${previewId}`);
    return null;
  }

  private findCorrespondingPreviewComponent(editorElement: HTMLElement): HTMLElement | null {
    // Get the preview component ID from editor attributes
    let previewId: string | null = null;
    let attributeUsed: string = '';

    if (editorElement.hasAttribute('editor-comptype')) {
      previewId = editorElement.getAttribute('editor-id');
      attributeUsed = 'editor-id';
    } else if (editorElement.hasAttribute('row-container-editor-comptype')) {
      previewId = editorElement.getAttribute('row-container-editor-id');
      attributeUsed = 'row-container-editor-id';
    } else if (editorElement.hasAttribute('editor-section-id')) {
      previewId = editorElement.getAttribute('editor-section-id');
      attributeUsed = 'editor-section-id';
    }

    // Debug: Editor element analysis
    // console.log(`[EditorPreviewSync] Editor element analysis:`, { previewId, attributeUsed });

    if (!previewId) {
      // console.log(`[EditorPreviewSync] No preview ID found in editor element attributes`);
      return null;
    }

    // Find the preview component by ID
    const previewElement = document.getElementById(previewId);
    // if (previewElement) {
    //   console.log(`[EditorPreviewSync] Found preview component: ${previewId}`);
    // } else {
    //   console.log(`[EditorPreviewSync] Preview component not found: ${previewId}`);
    // }
    
    return previewElement;
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
        const parentInfo = this.registeredComponents.get(parentComponentId);
        if (parentInfo) {
          this.secondaryHoveredComponents.add(parentInfo);
          
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
  }

  private clearAllHovers(): void {
    // Clear current primary hover
    if (this.currentHoveredComponent) {
      console.log(`[ClearHovers] Clearing primary hover: ${this.currentHoveredComponent.componentId} (${this.currentHoveredComponent.isPreviewHover ? 'preview' : 'editor'})`);
      this.removeHoverRelatedAttributesFromElement(this.currentHoveredComponent.element, this.currentHoveredComponent.isPreviewHover);
      this.changeIndexOfHoverButton('0', this.currentHoveredComponent.element, this.currentHoveredComponent.isPreviewHover);
    }

    // Clear all secondary hovers (including editor/preview sync hovers)
    this.secondaryHoveredComponents.forEach(componentInfo => {
      console.log(`[ClearHovers] Clearing secondary hover: ${componentInfo.componentId} (${componentInfo.isPreviewHover ? 'preview' : 'editor'})`);
      this.removeHoverRelatedAttributesFromElement(componentInfo.element, componentInfo.isPreviewHover);
      this.changeIndexOfHoverButton('0', componentInfo.element, componentInfo.isPreviewHover);
    });

    // Reset state
    this.currentHoveredComponent = null;
    this.secondaryHoveredComponents.clear();
    
    console.log(`[ClearHovers] All hovers cleared`);
  }

  // ================================
  // UTILITY METHODS (from original system)
  // ================================

  private findParentComponentFromEvent(event: MouseEvent): ComponentHoverInfo | null {
    // Use relatedTarget to find where mouse moved to
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget) return null;

    // Find the closest component with comptype
    const parentElement = relatedTarget.closest('[comptype]') as HTMLElement;
    if (!parentElement) return null;

    const parentComponentId = parentElement.id;
    return this.registeredComponents.get(parentComponentId) || null;
  }

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

  // All the original UI methods (copied from HoverUIManager)
  private getHoverOverlayEl(id: string) {
    return document.getElementById(`hover-overlay_${id}`);
  }

  private removeHoverRelatedAttributesFromElement(componentElement: HTMLElement, isPreviewHover: boolean) {
    if (!this.page || !this.page.components) return;

    console.log(`[RemoveHover] Removing hover from ${componentElement.id || 'no-id'} (isPreview: ${isPreviewHover}, hasCompType: ${componentElement.hasAttribute('comptype')})`);

    if (isPreviewHover) {
      componentElement.style.backgroundImage = this.page.components.data[componentElement.id]?.styles.backgroundImageOptimizations ? 
        `url(${this.mediaService.getBackground(this.page!.components.data[componentElement.id]?.styles.backgroundImageOptimizations, this.page!.components.data[componentElement.id]?.styles.backgroundImageSize).backgroundSrc})` : '';
    }

    if (componentElement.hasAttribute('comptype')) {
      // Preview component - remove from hover overlay
      console.log(`[RemoveHover] Removing hover overlay classes for preview component ${componentElement.id}`);
      this.getHoverOverlayEl(componentElement.id)?.classList.remove('hovered', 'outlined', 'hovered-secondary');
    } else {
      // Editor component - remove hovered class directly
      console.log(`[RemoveHover] Removing hovered class for editor component ${componentElement.id || componentElement.className}`);
      componentElement.classList.remove('hovered');
    }

    this.toggleFloatingLabel(componentElement, false);
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
    if (editorElement?.classList.contains('drag-handle')) editorElement = editorElement.parentElement!;
    editorElement?.classList.add('hovered');
  }

  private changeIndexOfHoverButton(value: string, fragment: HTMLElement, isPreviewHover: boolean) {
    if (isPreviewHover) return;
    const editorButtonElement = fragment.querySelector('#editorButton') as HTMLElement;
    if (editorButtonElement) {
      editorButtonElement.style.zIndex = value;
    }
  }

  private toggleFloatingLabel(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover?: boolean) {
    // FIXED: Only manage .visible class for hover states
    // Selected components are now handled purely by CSS with different styling
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
  // KEYBOARD EVENTS (original logic)
  // ================================

  private onKeyDown(e: KeyboardEvent) {
    if (e.repeat || !this.page) return;

    if (e.shiftKey) {
      const directlyHoveredComponent = this.getDirectlyPreviewHoveredComponent();
      if (directlyHoveredComponent) {
        this.clearAllHovers();
        this.hoverDirectParent(directlyHoveredComponent, true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (!this.page) return;

    if (!e.shiftKey) {
      const directlyHoveredComponent = this.getDirectlyPreviewHoveredComponent();
      if (directlyHoveredComponent) {
        this.clearAllHovers();
        this.hoverPreviewComponent(directlyHoveredComponent, true);
        const editorComponent = document.querySelector(`[editor-id="${directlyHoveredComponent.id}"]`) as HTMLElement;
        if (editorComponent) this.hoverEditorComponent(editorComponent);
      }
    }
  }

  private getDirectlyPreviewHoveredComponent() {
    return Array.from(document.querySelectorAll(':hover'))
      .filter(e => e.hasAttribute('comptype') && !e.hasAttribute('editor-id')).pop() as HTMLElement | undefined;
  }

  // ================================
  // PUBLIC API
  // ================================

  public setComponentHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    const componentInfo = this.registeredComponents.get(componentId);
    if (componentInfo) {
      if (isHovered) {
        this.setGlobalHover(componentInfo, event || new MouseEvent('mouseenter'));
      } else {
        this.clearGlobalHover(componentInfo, event || new MouseEvent('mouseleave'));
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
      if (this.currentHoveredComponent === componentInfo) {
        this.clearAllHovers();
      }
      
      // Remove from secondary hovers
      this.secondaryHoveredComponents.delete(componentInfo);
      
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