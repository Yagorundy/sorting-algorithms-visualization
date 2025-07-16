import { Injectable, OnDestroy } from '@angular/core';
import { Page } from '@common/data/page/Page';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.state';
import { HoverStateManager } from './hover-state-manager';
import { HoverUIManager } from './hover-ui-manager';

@Injectable({
  providedIn: 'root'
})
export class HoverEventHandler implements OnDestroy {
  private page?: Page;
  private subscriptions: Subscription[] = [];
  private keyDownListenerMethod = this.onKeyDown.bind(this);
  private keyUpListenerMethod = this.onKeyUp.bind(this);

  constructor(
    private store: Store<AppState>,
    private hoverStateManager: HoverStateManager,
    private hoverUIManager: HoverUIManager,
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
  // EVENT HANDLING METHODS
  // ================================

  public setupMouseEvents(
    fragment: HTMLElement,
    componentId: string,
    isPreviewHover: boolean
  ): void {
    fragment.addEventListener('mouseenter', (event) => {
      this.onHoverEvent(event, componentId);
    });
    fragment.addEventListener('mouseleave', (event) => {
      this.onUnHoverEvent(event, componentId, isPreviewHover);
    });
  }

  // Original onHoverEvent logic
  private onHoverEvent(event: MouseEvent, componentId: string) {
    console.log(`[HoverEventHandler] Mouse enter on ${componentId}`);
    this.preventEventPropagation(event);
    this.hoverStateManager.setHoverState(componentId, true, event);
  }

  // Original onUnHoverEvent logic - EXACTLY as in original
  private onUnHoverEvent(event: MouseEvent, componentId: string, isPreviewHover: boolean) {
    this.preventEventPropagation(event);
    this.hoverStateManager.setHoverState(componentId, false, event);

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
          this.hoverUIManager.removeHoverRelatedAttributesFromElement(component, isPreviewHover);
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
      if (previewComponent) this.hoverUIManager.hoverPreviewComponentAndParents(previewComponent);
      if (editorComponent) this.hoverUIManager.hoverEditorComponent(editorComponent);
    }
  }

  // Original handleNonTargetElements logic - EXACTLY as in original
  public handleNonTargetElements(event: MouseEvent, componentId?: string) {
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
        this.hoverUIManager.getHoverOverlayEl(element.id)?.classList.remove('hovered-secondary');
        
        // Show floating label again for component that transitions back to primary hover
        this.hoverUIManager.toggleFloatingLabel(element, true, false);
      }, 0);
    }

    secondaryHoveredComponents.forEach((element: HTMLElement) => {
      setTimeout(() => {
        const hoverOverlayEl = this.hoverUIManager.getHoverOverlayEl(element.id);
        hoverOverlayEl?.classList.remove('outlined');
        hoverOverlayEl?.classList.add('hovered-secondary');
        
        // Hide floating label for components that get secondary hover (parents)
        this.hoverUIManager.toggleFloatingLabel(element, false);
      }, 0);
    });

    allHoveredEditorSections.forEach((el: HTMLElement) => {
      const dragHandleElem = el.children[1];
      if (dragHandleElem && dragHandleElem.getAttribute('editor-id') == componentId) return;

      this.hoverUIManager.removeHoverRelatedAttributesFromElement(el, false);
    });

    allHoveredComponents.forEach((el: HTMLElement) => {
      if (element == el) return;

      const isPreview = el.hasAttribute('editor-id') ? false : true;
      this.hoverUIManager.removeHoverRelatedAttributesFromElement(el, isPreview);
    });
  }

  // ================================
  // KEYBOARD EVENTS - EXACTLY as in original
  // ================================

  private onKeyDown(e: KeyboardEvent) {
    if (e.repeat || !this.page) return;

    // If the Shift key has been pressed
    if (e.shiftKey) {
      // Get the preview component that is currently hovered
      const directlyHoveredComponent = this.hoverUIManager.getDirectlyPreviewHoveredComponent();

      if (directlyHoveredComponent) {
        // Find all currently hovered preview components and unhover them.
        document.querySelectorAll<HTMLElement>('.hover-overlay.hovered')
          .forEach((overlay) => {
            const component = overlay.parentElement;
            if (component && component.hasAttribute('comptype')) {
              this.hoverUIManager.removeHoverRelatedAttributesFromElement(component, true);
            }
          });

        // Hover the direct parent component of the currently hovered component (#10940).
        this.hoverUIManager.hoverDirectParent(directlyHoveredComponent, true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (!this.page) return;

    // If the Shift key has been released
    if (!e.shiftKey) {
      // Get the preview component that is currently hovered
      const directlyHoveredComponent = this.hoverUIManager.getDirectlyPreviewHoveredComponent();

      if (directlyHoveredComponent) {
        // Remove all hover-related attributes from any hovered preview components.
        document.querySelectorAll<HTMLElement>('[comptype].hovered')
          .forEach((component) => this.hoverUIManager.removeHoverRelatedAttributesFromElement(component, true));

        this.hoverUIManager.hoverPreviewComponentAndParents(directlyHoveredComponent);
        const editorComponent = document.querySelector(`[editor-id="${directlyHoveredComponent.id}"]`) as HTMLElement;
        if (editorComponent) this.hoverUIManager.hoverEditorComponent(editorComponent);
      }
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private preventEventPropagation(event?: MouseEvent) {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    event?.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    document.removeEventListener("keydown", this.keyDownListenerMethod);
    document.removeEventListener("keyup", this.keyUpListenerMethod);
  }
}