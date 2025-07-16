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

@Injectable({
  providedIn: 'root'
})
export class HoverSystem implements OnDestroy {
  private page?: Page;
  private subscriptions: Subscription[] = [];
  private keyDownListenerMethod = this.onKeyDown.bind(this);
  private keyUpListenerMethod = this.onKeyUp.bind(this);

  private hoverSubjects = new Map<string, Subject<{ isHovered?: boolean, event?: MouseEvent }>>();

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
  // HOVER OBSERVABLE MANAGEMENT (from HoverService)
  // ================================

  private getOrCreateSubject(componentId: string): Subject<{ isHovered?: boolean, event?: MouseEvent }> {
    if (!this.hoverSubjects.has(componentId)) {
      this.hoverSubjects.set(componentId, new Subject());
    }
    return this.hoverSubjects.get(componentId)!;
  }

  public getHoverObservable(componentId: string): Observable<{ isHovered?: boolean, event?: MouseEvent }> {
    return this.getOrCreateSubject(componentId).asObservable();
  }

  public removeHoverObservable(componentId: string) {
    this.hoverSubjects.get(componentId)?.complete();
    this.hoverSubjects.delete(componentId);
  }

  public setHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    const subject = this.getOrCreateSubject(componentId);
    subject.next({ isHovered, event });
  }

  // ================================
  // HOVER HELPER FUNCTIONALITY
  // ================================

  public setupComponentHover(
    fragment: HTMLElement,
    isPreviewHover: boolean,
    componentType: PageComponentNames,
    componentId: string,
    previewMode: PreviewModes,
    containerType?: PageGridComponentNames
  ): Subscription {
    // Original initHoverHelper logic
    const addSecondaryHover = PageComponentNames.detail == componentType && 
                             !(componentType == PageComponentNames.detail && containerType == PageGridComponentNames.detail);

    // Set up event listeners (original listenForHoverRelatedEvents logic)
    if (previewMode == PreviewModes.editor && this.getHoverObservable(componentId)) {
      fragment.addEventListener('mouseenter', (event) => {
        this.onHoverEvent(event, componentId);
      });
      fragment.addEventListener('mouseleave', (event) => {
        this.onUnHoverEvent(event, componentId, isPreviewHover);
      });
    }

    // Set up hover state subscription (original initHoverHelper logic)
    return this.getHoverObservable(componentId).subscribe(result => {
      if (result.isHovered) {
        this.onHover(fragment, isPreviewHover, componentId, result.event, addSecondaryHover);
      } else {
        this.onUnHover(fragment, isPreviewHover);
      }
    });
  }

  // Original onHoverEvent logic
  private onHoverEvent(event: MouseEvent, componentId: string) {
    this.preventEventPropagation(event);
    this.setHoverState(componentId, true, event);
  }

  // Original onUnHoverEvent logic - EXACTLY as in original
  private onUnHoverEvent(event: MouseEvent, componentId: string, isPreviewHover: boolean) {
    this.preventEventPropagation(event);
    this.setHoverState(componentId, false, event);

    // When hovering from inner (children) to outer parts (parents), e.g. from Media to Row in preview editor
    let directlyHoveredComponent = Array.from(document.querySelectorAll(':hover')).filter(
      e => e.hasAttribute('comptype') ||
        e.hasAttribute('editor-comptype') ||
        e.hasAttribute('row-container-editor-comptype') ||
        e.hasAttribute('editor-section-id')
    ).pop() as HTMLElement | undefined;

    // Remove all hover-related attributes from any hovered preview components.
    document.querySelectorAll<HTMLElement>('.hover-overlay.hovered')
      .forEach((overlay) => {
        const component = overlay.parentElement;
        if (component && component.hasAttribute('comptype')) {
          this.removeHoverRelatedAttributesFromElement(component, isPreviewHover);
        }
      });

    if (directlyHoveredComponent) {
      let previewComponent: HTMLElement | undefined = undefined;
      let editorComponent: HTMLElement | undefined = undefined;

      const isEditorRowContainer = directlyHoveredComponent.hasAttribute('row-container-editor-comptype');
      const isEditorSectionContainer = directlyHoveredComponent.hasAttribute('editor-section-id');
      const isEditorComponent = directlyHoveredComponent.hasAttribute('editor-comptype');
      const isPreviewComponent = directlyHoveredComponent.hasAttribute('comptype');

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

      // One of them can be undefined for example when a component is selected and the layout manager
      // does not show the layout of the component that is hovered due to showing the selected component's
      // settings.
      if (previewComponent) this.hoverPreviewComponentAndParents(previewComponent);
      if (editorComponent) this.hoverEditorComponent(editorComponent);
    }
  }

  // Original onHover logic
  private onHover(fragment: HTMLElement, isPreviewHover: boolean, componentId: string, event?: MouseEvent, addSecondaryHover?: boolean) {
    const shiftDown = event?.shiftKey;

    const element = fragment as HTMLElement;
    if (isPreviewHover) {
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        this.hoverDirectParent(element, isPreviewHover);
      } else {
        this.hoverPreviewComponent(element, true, addSecondaryHover && !!event);
      }
    } else {
      this.hoverEditorComponent(element);
      
      // ENHANCEMENT: Also hover the corresponding preview component when hovering editor
      const editorId = element.getAttribute('editor-id') || 
                      element.getAttribute('row-container-editor-id') || 
                      element.getAttribute('editor-section-id') ||
                      componentId;
      
      const previewComponent = document.querySelector(`[id="${editorId}"]`) as HTMLElement;
      if (previewComponent) {
        this.hoverPreviewComponent(previewComponent, true, addSecondaryHover && !!event);
      }
    }

    if (event) {
      this.handleNonTargetElements(event, componentId);
    }
    this.changeIndexOfHoverButton('1022', fragment, isPreviewHover);
  }

  // Original onUnHover logic
  private onUnHover(fragment: HTMLElement, isPreviewHover: boolean) {
    this.removeHoverRelatedAttributesFromElement(fragment as HTMLElement, true);
    
    // ENHANCEMENT: Also remove hover from corresponding preview component when unhover editor
    if (!isPreviewHover) {
      const componentId = fragment.getAttribute('editor-id') || 
                          fragment.getAttribute('row-container-editor-id') || 
                          fragment.getAttribute('editor-section-id');
      
      if (componentId) {
        const previewComponent = document.querySelector(`[id="${componentId}"]`) as HTMLElement;
        if (previewComponent) {
          this.removeHoverRelatedAttributesFromElement(previewComponent, true);
        }
      }
    }
    
    this.changeIndexOfHoverButton('0', fragment, isPreviewHover);
  }

  // Original handleNonTargetElements logic - EXACTLY as in original
  private handleNonTargetElements(event: MouseEvent, componentId?: string) {
    const element = event.target as HTMLElement;
    const targetCompType = element.getAttribute('comptype');

    // Define which component types should be treated as "secondary hovered" (special UI behavior)
    const secondaryHoveredComponentTypes = [
      PageComponentNames.section,
      PageComponentNames.button,
      PageComponentNames.row,
      PageComponentNames.detail,
      PageComponentNames.column,
      PageComponentNames.card
    ];

    const isSecondaryHoveredComponentType = secondaryHoveredComponentTypes.includes(targetCompType as PageComponentNames);

    // Find components that should get secondary hover (avoiding :has for performance)
    const allOverlays = document.querySelectorAll<HTMLElement>('.hover-overlay.hovered');
    const secondaryHoveredComponents: HTMLElement[] = [];
    const allHoveredComponents: HTMLElement[] = [];

    allOverlays.forEach(overlay => {
      const component = overlay.parentElement as HTMLElement;
      if (!component || component.id === componentId) return;
      
      const compType = component.getAttribute('comptype') as PageComponentNames;
      if (secondaryHoveredComponentTypes.includes(compType)) {
        secondaryHoveredComponents.push(component);
      } else {
        allHoveredComponents.push(component);
      }
    });

    // Add hovered editor components
    const hoveredEditorComponents = document.querySelectorAll<HTMLElement>(`[editor-id].hovered:not([editor-id="${componentId}"])`);
    hoveredEditorComponents.forEach(el => allHoveredComponents.push(el));

    const allHoveredEditorSections = document.querySelectorAll<HTMLElement>('.section-content.hovered');

    if (targetCompType && isSecondaryHoveredComponentType) {
      setTimeout(() => {
        this.getHoverOverlayEl(element.id)?.classList.remove('hovered-secondary');
        
        // Show floating label again for component that transitions back to primary hover
        this.toggleFloatingLabel(element, true, false);
      }, 0);
    }

    secondaryHoveredComponents.forEach((element: HTMLElement) => {
      setTimeout(() => {
        const hoverOverlayEl = this.getHoverOverlayEl(element.id);
        hoverOverlayEl?.classList.remove('outlined');
        hoverOverlayEl?.classList.add('hovered-secondary');
        
        // Hide floating label for components that get secondary hover (parents)
        this.toggleFloatingLabel(element, false);
      }, 0);
    });

    allHoveredEditorSections.forEach((el: HTMLElement) => {
      const dragHandleElem = el.children[1];
      if (dragHandleElem && dragHandleElem.getAttribute('editor-id') == componentId) return;

      this.removeHoverRelatedAttributesFromElement(el, false);
    });

    allHoveredComponents.forEach((el: HTMLElement) => {
      if (element == el) return;

      const isPreview = el.hasAttribute('editor-id') ? false : true;
      this.removeHoverRelatedAttributesFromElement(el, isPreview);
    });
  }

  // ================================
  // HOVER SERVICE METHODS - EXACTLY as in original
  // ================================

  public getHoverOverlayEl(id: string) {
    return document.getElementById(`hover-overlay_${id}`);
  }

  public removeHoverRelatedAttributesFromElement(componentElement: HTMLElement, isPreviewHover: boolean) {
    if (!this.page || !this.page.components) return;

    if (isPreviewHover) {
      // Restore original background image
      componentElement.style.backgroundImage = this.page.components.data[componentElement.id]?.styles.backgroundImageOptimizations ? 
        `url(${this.mediaService.getBackground(this.page!.components.data[componentElement.id]?.styles.backgroundImageOptimizations, this.page!.components.data[componentElement.id]?.styles.backgroundImageSize).backgroundSrc})` : '';
    }

    if (componentElement.hasAttribute('comptype')) {
      this.getHoverOverlayEl(componentElement.id)?.classList.remove('hovered', 'outlined', 'hovered-secondary');
    } else {
      componentElement.classList.remove('hovered');
    }

    // ENHANCEMENT: Handle floating label visibility with optimized approach
    this.toggleFloatingLabel(componentElement, false);
  }

  /**
   * Original hoverPreviewComponent logic with floating label enhancement
   */
  public hoverPreviewComponent(componentElement: HTMLElement | null, addOutline?: boolean, addSecondaryHover?: boolean) {
    if (!componentElement) return;

    // Do no display "layout" hover icon buttons when detail dialog is opened (detailsLayout)
    const detailDialog = document.querySelector(".detail-dialog");
    if (detailDialog && !detailDialog.contains(componentElement)) return;

    // Prevent hover effects if the component is inside a carousel slide which isn't active, and
    // if the carousel has a class of "disable-hover-on-inactive-slides".
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

    // ENHANCEMENT: Handle floating label visibility with optimized approach
    this.toggleFloatingLabel(componentElement, true, addSecondaryHover);
  }

  public hoverPreviewComponentAndParents(componentElement: HTMLElement | null) {
    if (!componentElement) return;
    this.hoverPreviewComponent(componentElement, true);
  }

  public hoverDirectParent(componentElement: HTMLElement | null, isPreviewHover: boolean) {
    if (!componentElement) return;

    const parent: HTMLElement | null = componentElement.parentElement;
    if (parent && isPreviewHover) this.hoverPreviewComponent(parent, true);
  }

  public hoverEditorComponent(editorElement: HTMLElement | null) {
    if (!editorElement) return;
    if (editorElement?.classList.contains('drag-handle')) editorElement = editorElement.parentElement!;
    editorElement?.classList.add('hovered');
  }

  // ================================
  // KEYBOARD EVENTS - EXACTLY as in original
  // ================================

  private onKeyDown(e: KeyboardEvent) {
    if (e.repeat || !this.page) return;

    // If the Shift key has been pressed
    if (e.shiftKey) {
      // Get the preview component that is currently hovered
      const directlyHoveredComponent = this.getDirectlyPreviewHoveredComponent();

      if (directlyHoveredComponent) {
        // Find all currently hovered preview components and unhover them.
        document.querySelectorAll<HTMLElement>('.hover-overlay.hovered')
          .forEach((overlay) => {
            const component = overlay.parentElement;
            if (component && component.hasAttribute('comptype')) {
              this.removeHoverRelatedAttributesFromElement(component, true);
            }
          });

        // Hover the direct parent component of the currently hovered component (#10940).
        this.hoverDirectParent(directlyHoveredComponent, true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (!this.page) return;

    // If the Shift key has been released
    if (!e.shiftKey) {
      // Get the preview component that is currently hovered
      const directlyHoveredComponent = this.getDirectlyPreviewHoveredComponent();

      if (directlyHoveredComponent) {
        // Remove all hover-related attributes from any hovered preview components.
        document.querySelectorAll<HTMLElement>('[comptype].hovered')
          .forEach((component) => this.removeHoverRelatedAttributesFromElement(component, true));

        this.hoverPreviewComponentAndParents(directlyHoveredComponent);
        const editorComponent = document.querySelector(`[editor-id="${directlyHoveredComponent.id}"]`) as HTMLElement;
        if (editorComponent) this.hoverEditorComponent(editorComponent);
      }
    }
  }

  // This function is written to search specifically only in the preview and not in the layout manager,
  // which is necessary #10940 to work properly.
  private getDirectlyPreviewHoveredComponent() {
    return Array.from(document.querySelectorAll(':hover'))
      .filter(e => e.hasAttribute('comptype') && !e.hasAttribute('editor-id')).pop() as HTMLElement | undefined;
  }

  // ================================
  // UTILITY METHODS
  // ================================

  // Original changeIndexOfHoverButton logic
  private changeIndexOfHoverButton(value: string, fragment: HTMLElement, isPreviewHover: boolean) {
    if (isPreviewHover) return;

    const targetElement = fragment;
    const editorButtonElement = targetElement.querySelector('#editorButton') as HTMLElement;
    if (editorButtonElement) {
      editorButtonElement.style.zIndex = value;
    }
  }

  // ENHANCEMENT: Optimized floating label toggle with CSS classes
  private toggleFloatingLabel(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover?: boolean) {
    // Only show floating labels for the directly hovered component (not parents with secondary hover)
    // and only when the component is not selected
    const shouldShow = isHovered && !isSecondaryHover && !componentElement.classList.contains('selected');
    
    // Direct ID lookup for maximum performance
    const componentId = componentElement.id;
    const floatingLabel = document.getElementById(`component-label_${componentId}`);
    
    if (floatingLabel) {
      if (shouldShow) {
        floatingLabel.classList.add('visible');
      } else {
        floatingLabel.classList.remove('visible');
      }
    }
  }

  private preventEventPropagation(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    event?.stopPropagation();
  }

  public destroy(componentId: string) {
    let element = document.querySelector<HTMLElement>(`[id="${componentId}"]`) as HTMLElement;
    if (element) return;
    this.removeHoverObservable(componentId);
  }

  // Manual hover triggering for breadcrumbs, etc.
  public triggerHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
    this.setHoverState(componentId, isHovered, event);
  }

  // Alias for setHoverState - commonly used for manual hover control
  public setComponentHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    this.setHoverState(componentId, isHovered, event);
  }

  // Check if component has hover functionality
  public hasHoverFunctionality(componentId: string): boolean {
    return this.hoverSubjects.has(componentId);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    document.removeEventListener("keydown", this.keyDownListenerMethod);
    document.removeEventListener("keyup", this.keyUpListenerMethod);
  }
}