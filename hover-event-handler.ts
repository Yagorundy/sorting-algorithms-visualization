import { Injectable, OnDestroy } from '@angular/core';
import { Page } from '@common/data/page/Page';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
import { PreviewModes } from "@common/data/report/enums/PreviewModes";
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.state';
import { HoverStateManager, HoverState } from './hover-state-manager';
import { HoverUIManager } from './hover-ui-manager';
import { HoverCoordinator } from './hover-coordinator';

@Injectable({
  providedIn: 'root'
})
export class HoverEventHandler implements OnDestroy {
  private page?: Page;
  private subscriptions: Subscription[] = [];
  private keyDownListenerMethod = this.onKeyDown.bind(this);
  private keyUpListenerMethod = this.onKeyUp.bind(this);

  private readonly SECONDARY_HOVER_COMPONENT_TYPES = [
    PageComponentNames.section,
    PageComponentNames.button,
    PageComponentNames.row,
    PageComponentNames.detail,
    PageComponentNames.column,
    PageComponentNames.card
  ];

  constructor(
    private store: Store<AppState>,
    private stateManager: HoverStateManager,
    private uiManager: HoverUIManager,
    private coordinator: HoverCoordinator
  ) {
    this.initializePageSubscription();
    this.initializeKeyboardListeners();
  }

  public setupComponentHoverListeners(
    fragment: HTMLElement,
    previewMode: PreviewModes,
    componentId: string,
    isPreviewHover: boolean
  ): void {
    if (previewMode !== PreviewModes.editor || !this.stateManager.hasHoverObservable(componentId)) {
      return;
    }

    fragment.addEventListener('mouseenter', (event) => {
      this.handleMouseEnter(event, componentId);
    });

    fragment.addEventListener('mouseleave', (event) => {
      this.handleMouseLeave(event, componentId, isPreviewHover);
    });
  }

  public subscribeToHoverState(
    componentId: string,
    fragment: HTMLElement,
    componentType: PageComponentNames,
    isPreviewHover: boolean,
    containerType?: PageGridComponentNames
  ): Subscription {
    return this.stateManager.getHoverObservable(componentId).subscribe((hoverState: HoverState) => {
      if (hoverState.isHovered) {
        this.handleComponentHover(fragment, componentType, isPreviewHover, hoverState, containerType);
      } else {
        this.handleComponentUnhover(fragment, isPreviewHover);
      }
    });
  }

  private handleMouseEnter(event: MouseEvent, componentId: string): void {
    this.preventEventPropagation(event);
    this.stateManager.setHoverState(componentId, true, event);
  }

  private handleMouseLeave(event: MouseEvent, componentId: string, isPreviewHover: boolean): void {
    this.preventEventPropagation(event);
    this.stateManager.setHoverState(componentId, false, event);

    // Match original HoverHelper.onUnHoverEvent logic exactly
    setTimeout(() => {
      // When hovering from inner (children) to outer parts (parents), e.g. from Media to Row in preview editor
      const directlyHoveredComponent = this.coordinator.findDirectlyHoveredComponent();

      // Remove all hover-related attributes from any hovered preview components.
      const hoveredPreviewComponents = document.querySelectorAll<HTMLElement>('.hover-overlay.hovered');
      hoveredPreviewComponents.forEach((overlay) => {
        const parentComponent = overlay.parentElement;
        if (parentComponent && parentComponent.hasAttribute('comptype')) {
          this.uiManager.removeComponentHover(parentComponent, this.page!, true);
        }
      });

      if (directlyHoveredComponent) {
        const componentPair = this.coordinator.findComponentPair(directlyHoveredComponent);
        if (componentPair.previewComponent) {
          this.coordinator.hoverPreviewComponentAndParents(componentPair.previewComponent, this.page!);
        }
        if (componentPair.editorComponent) {
          this.uiManager.addEditorComponentHover(componentPair.editorComponent);
        }
      }
    }, 0);
  }

  private handleComponentHover(
    fragment: HTMLElement,
    componentType: PageComponentNames,
    isPreviewHover: boolean,
    hoverState: HoverState,
    containerType?: PageGridComponentNames
  ): void {
    // Exactly match original HoverHelper.onHover logic
    const shouldAddSecondaryHover = this.shouldAddSecondaryHover(componentType, containerType);
    const shiftDown = hoverState.event?.shiftKey;

    if (isPreviewHover) {
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        this.coordinator.hoverDirectParent(fragment, this.page!, isPreviewHover);
      } else {
        // Match original: hoverPreviewComponent(element, true, addSecondaryHover && !!event)
        this.uiManager.addPreviewComponentHover(fragment, this.page!, {
          addOutline: true,
          addSecondaryHover: shouldAddSecondaryHover && !!hoverState.event
        });
      }
    } else {
      this.uiManager.addEditorComponentHover(fragment);
    }

    // Match original order: handleNonTargetElements BEFORE changeIndexOfHoverButton
    if (hoverState.event) {
      this.handleNonTargetElements(hoverState.event, hoverState.componentId);
    }
    
    this.uiManager.updateEditorButtonZIndex(fragment, '1022', isPreviewHover);
  }

  private handleComponentUnhover(fragment: HTMLElement, isPreviewHover: boolean): void {
    this.uiManager.removeComponentHover(fragment, this.page!, isPreviewHover);
    this.uiManager.updateEditorButtonZIndex(fragment, '0', isPreviewHover);
  }

  private handleNonTargetElements(event: MouseEvent, componentId: string): void {
    // Match original HoverHelper.handleNonTargetElements exactly
    const element = event.target as HTMLElement;
    const targetCompType = element.getAttribute('comptype') as PageComponentNames;

    const isSecondaryHoveredComponentType = this.SECONDARY_HOVER_COMPONENT_TYPES.includes(targetCompType);

    if (targetCompType && isSecondaryHoveredComponentType) {
      setTimeout(() => {
        this.uiManager.removeSpecificHoverClass(element.id, 'hovered-secondary');
      }, 0);
    }

    // Avoid :has() selectors - find hovered overlays directly and get parent components
    const hoveredOverlays = document.querySelectorAll<HTMLElement>('.hover-overlay.hovered');
    
    hoveredOverlays.forEach((overlay) => {
      const parentComponent = overlay.parentElement;
      if (!parentComponent || parentComponent.id === componentId) return;
      
      const compType = parentComponent.getAttribute('comptype') as PageComponentNames;
      if (!compType) return;

      const isSecondaryType = this.SECONDARY_HOVER_COMPONENT_TYPES.includes(compType);
      
      if (isSecondaryType) {
        // Convert to secondary hover
        setTimeout(() => {
          overlay.classList.remove('outlined');
          overlay.classList.add('hovered-secondary');
        }, 0);
      } else {
        // Remove hover completely for non-secondary types
        this.uiManager.removeComponentHover(parentComponent, this.page!, true);
      }
    });

    // Handle hovered editor components
    const allHoveredEditorComponents = document.querySelectorAll<HTMLElement>(`[editor-id].hovered:not([editor-id="${componentId}"])`);
    allHoveredEditorComponents.forEach((el: HTMLElement) => {
      this.uiManager.removeComponentHover(el, this.page!, false);
    });

    const allHoveredEditorSections = document.querySelectorAll<HTMLElement>('.section-content.hovered');

    allHoveredEditorSections.forEach((el: HTMLElement) => {
      const dragHandleElem = el.children[1];
      if (dragHandleElem && dragHandleElem.getAttribute('editor-id') === componentId) return;
      
      el.classList.remove('hovered');
    });

    allHoveredComponents.forEach((el: HTMLElement) => {
      if (element === el) return;

      const isPreview = !el.hasAttribute('editor-id');
      this.uiManager.removeComponentHover(el, this.page!, isPreview);
    });
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat || !this.page) return;

    if (e.shiftKey) {
      const directlyHoveredComponent = this.coordinator.findPreviewHoveredComponent();
      
      if (directlyHoveredComponent) {
        this.coordinator.removeAllHoveredComponentsExcept(directlyHoveredComponent.id, this.page);
        this.coordinator.hoverDirectParent(directlyHoveredComponent, this.page, true);
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (!this.page) return;

    if (!e.shiftKey) {
      const directlyHoveredComponent = this.coordinator.findPreviewHoveredComponent();
      
      if (directlyHoveredComponent) {
        this.coordinator.removeAllHoveredComponentsExcept(directlyHoveredComponent.id, this.page);
        this.coordinator.hoverPreviewComponentAndParents(directlyHoveredComponent, this.page);
        
        const editorComponent = document.querySelector(`[editor-id="${directlyHoveredComponent.id}"]`) as HTMLElement;
        this.uiManager.addEditorComponentHover(editorComponent);
      }
    }
  }

  private shouldAddSecondaryHover(componentType: PageComponentNames, containerType?: PageGridComponentNames): boolean {
    return componentType === PageComponentNames.detail && 
           containerType !== PageGridComponentNames.detail;
  }

  private preventEventPropagation(event?: MouseEvent): void {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    event?.stopPropagation();
  }

  private initializePageSubscription(): void {
    this.subscriptions.push(
      this.store.select(state => state.report.pagePreview.loadedPage).subscribe((loadedPage?: Page) => {
        if (loadedPage) this.page = loadedPage;
      })
    );
  }

  private initializeKeyboardListeners(): void {
    document.addEventListener("keydown", this.keyDownListenerMethod);
    document.addEventListener("keyup", this.keyUpListenerMethod);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    document.removeEventListener("keydown", this.keyDownListenerMethod);
    document.removeEventListener("keyup", this.keyUpListenerMethod);
  }
}