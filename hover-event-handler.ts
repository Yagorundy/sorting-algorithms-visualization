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

    // Handle hover transition from inner to outer components
    setTimeout(() => {
      const directlyHoveredComponent = this.coordinator.findDirectlyHoveredComponent();

      if (directlyHoveredComponent) {
        const componentPair = this.coordinator.findComponentPair(directlyHoveredComponent);
        this.coordinator.synchronizeHover(componentPair, this.page!);
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
    const shouldAddSecondaryHover = this.shouldAddSecondaryHover(componentType, containerType);
    const shiftDown = hoverState.event?.shiftKey;

    if (isPreviewHover) {
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        this.coordinator.hoverDirectParent(fragment, this.page!, isPreviewHover);
      } else {
        // Apply hover directly to this component
        this.uiManager.addPreviewComponentHover(fragment, this.page!, {
          addOutline: true,
          addSecondaryHover: shouldAddSecondaryHover && !!hoverState.event
        });
      }
    } else {
      this.uiManager.addEditorComponentHover(fragment);
    }

    this.uiManager.updateEditorButtonZIndex(fragment, '1022', isPreviewHover);

    // Handle non-target elements AFTER applying hover (only for mouse events, not programmatic)
    if (hoverState.event && hoverState.event.type === 'mouseenter') {
      this.handleNonTargetElements(hoverState.event, hoverState.componentId);
    }
  }

  private handleComponentUnhover(fragment: HTMLElement, isPreviewHover: boolean): void {
    this.uiManager.removeComponentHover(fragment, this.page!, isPreviewHover);
    this.uiManager.updateEditorButtonZIndex(fragment, '0', isPreviewHover);
  }

  private handleNonTargetElements(event: MouseEvent, componentId: string): void {
    const element = event.target as HTMLElement;
    const targetCompType = element.getAttribute('comptype') as PageComponentNames;

    const isSecondaryHoveredComponentType = this.SECONDARY_HOVER_COMPONENT_TYPES.includes(targetCompType);

    // Remove 'hovered-secondary' from the current target if it's a secondary hover type
    if (targetCompType && isSecondaryHoveredComponentType) {
      setTimeout(() => {
        this.uiManager.removeSpecificHoverClass(element.id, 'hovered-secondary');
      }, 0);
    }

    // Convert secondary hover components to 'hovered-secondary' state
    setTimeout(() => {
      this.uiManager.removeSecondaryHoverFromComponents([
        PageComponentNames.row,
        PageComponentNames.detail,
        PageComponentNames.column,
        PageComponentNames.card,
        PageComponentNames.section,
        PageComponentNames.filterBar,
        PageComponentNames.button
      ], componentId);
    }, 0);

    // Remove hover from all other components (excluding secondary hover types)
    setTimeout(() => {
      this.uiManager.removeAllHoveredComponents(componentId, this.SECONDARY_HOVER_COMPONENT_TYPES);
    }, 0);
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