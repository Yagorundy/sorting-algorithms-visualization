import { Injectable, OnDestroy } from '@angular/core';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
import { PreviewModes } from "@common/data/report/enums/PreviewModes";
import { Subscription } from 'rxjs';
import { HoverStateManager } from './hover-state-manager';
import { HoverEventHandler } from './hover-event-handler';

/**
 * Main facade for the hover system. Provides a simple API for components to initialize
 * hover behavior and manage their hover subscriptions.
 */
@Injectable({
  providedIn: 'root'
})
export class HoverManager implements OnDestroy {
  
  constructor(
    private stateManager: HoverStateManager,
    private eventHandler: HoverEventHandler
  ) {}

  /**
   * Initialize hover functionality for a component
   * @param fragment - The DOM element to attach hover listeners to
   * @param isPreviewHover - Whether this is a preview component (true) or editor component (false)
   * @param componentType - The type of the component
   * @param componentId - Unique identifier for the component
   * @param containerType - Optional container type for special handling
   * @returns Subscription that should be stored and unsubscribed when component is destroyed
   */
  public initializeComponentHover(
    fragment: HTMLElement,
    isPreviewHover: boolean,
    componentType: PageComponentNames,
    componentId: string,
    containerType?: PageGridComponentNames
  ): Subscription {
    return this.eventHandler.subscribeToHoverState(
      componentId,
      fragment,
      componentType,
      isPreviewHover,
      containerType
    );
  }

  /**
   * Set up DOM event listeners for a component
   * @param fragment - The DOM element to attach listeners to
   * @param previewMode - Current preview mode
   * @param componentId - Unique identifier for the component
   * @param isPreviewHover - Whether this is a preview component
   */
  public setupEventListeners(
    fragment: HTMLElement,
    previewMode: PreviewModes,
    componentId: string,
    isPreviewHover: boolean
  ): void {
    this.eventHandler.setupComponentHoverListeners(fragment, previewMode, componentId, isPreviewHover);
  }

  /**
   * Manually trigger hover state for a component
   * @param componentId - Component to hover
   * @param isHovered - Whether to set hovered or unhovered state
   * @param event - Optional mouse event
   */
  public setComponentHoverState(componentId: string, isHovered: boolean, event?: MouseEvent): void {
    this.stateManager.setHoverState(componentId, isHovered, event);
  }

  /**
   * Clean up hover functionality for a component
   * @param componentId - Component to clean up
   */
  public destroyComponentHover(componentId: string): void {
    this.stateManager.removeHoverObservable(componentId);
  }

  /**
   * Check if a component has hover functionality initialized
   * @param componentId - Component to check
   */
  public hasHoverFunctionality(componentId: string): boolean {
    return this.stateManager.hasHoverObservable(componentId);
  }

  /**
   * Clear all hover states across the application
   */
  public clearAllHoverStates(): void {
    this.stateManager.clearAllHoverStates();
  }

  ngOnDestroy(): void {
    // Cleanup is handled by individual services
  }
}