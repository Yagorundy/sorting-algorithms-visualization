import { Injectable } from '@angular/core';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
import { PreviewModes } from "@common/data/report/enums/PreviewModes";
import { Subscription } from 'rxjs';
import { HoverStateManager } from './hover-state-manager';
import { HoverEventHandler } from './hover-event-handler';
import { HoverUIManager } from './hover-ui-manager';
import { HoverCoordinator } from './hover-coordinator';

@Injectable({
  providedIn: 'root'
})
export class HoverManager {

  constructor(
    private hoverStateManager: HoverStateManager,
    private hoverEventHandler: HoverEventHandler,
    private hoverUIManager: HoverUIManager,
    private hoverCoordinator: HoverCoordinator,
  ) {}

  // ================================
  // MAIN API - Complete hover setup in one call
  // ================================

  /**
   * Complete hover setup - faithful recreation of original HoverHelper + HoverService
   * Combines both initHoverHelper + listenForHoverRelatedEvents functionality
   */
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

    // DEBUG: Log what's happening
    console.log(`[HoverManager] Setting up component ${componentId}, previewMode: ${previewMode}, isPreviewHover: ${isPreviewHover}`);
    
    // CRITICAL: Match original order exactly - condition check FIRST creates the observable
    const hasObservable = this.hoverStateManager.getHoverObservable(componentId);
    const shouldSetupEvents = previewMode == PreviewModes.editor && hasObservable;
    
    console.log(`[HoverManager] hasObservable: ${!!hasObservable}, shouldSetupEvents: ${shouldSetupEvents}`);
    
    if (shouldSetupEvents) {
      console.log(`[HoverManager] Setting up mouse events for ${componentId}`);
      this.hoverEventHandler.setupMouseEvents(fragment, componentId, isPreviewHover);
    }

    // Then set up subscription using the already-created observable
    return this.hoverStateManager.getHoverObservable(componentId).subscribe(result => {
      console.log(`[HoverManager] Hover state change for ${componentId}: isHovered=${result.isHovered}`);
      if (result.isHovered) {
        this.onHover(fragment, isPreviewHover, componentId, result.event, addSecondaryHover);
      } else {
        this.onUnHover(fragment, isPreviewHover);
      }
    });
  }

  // ================================
  // HOVER STATE CONTROL
  // ================================

  /**
   * Manual hover triggering for breadcrumbs, external controls, etc.
   */
  public setComponentHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    this.hoverStateManager.setHoverState(componentId, isHovered, event);
  }

  /**
   * Alternative method name for manual hover triggering
   */
  public triggerHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
    this.hoverStateManager.setHoverState(componentId, isHovered, event);
  }

  /**
   * Check if component has hover functionality
   */
  public hasHoverFunctionality(componentId: string): boolean {
    return this.hoverStateManager.hasHoverFunctionality(componentId);
  }

  /**
   * Clean up hover functionality for a component
   */
  public destroyComponentHover(componentId: string) {
    this.hoverStateManager.destroy(componentId);
  }

  // ================================
  // INTERNAL HOVER LOGIC (from original onHover/onUnHover)
  // ================================

  private onHover(fragment: HTMLElement, isPreviewHover: boolean, componentId: string, event?: MouseEvent, addSecondaryHover?: boolean) {
    console.log(`[HoverManager] onHover called for ${componentId}, isPreviewHover=${isPreviewHover}, addSecondaryHover=${addSecondaryHover}`);
    
    const shiftDown = event?.shiftKey;

    const element = fragment as HTMLElement;
    if (isPreviewHover) {
      if (shiftDown && !document.querySelector('#editorButtonContainer:hover')) {
        console.log(`[HoverManager] Hovering direct parent for ${componentId}`);
        this.hoverUIManager.hoverDirectParent(element, isPreviewHover);
      } else {
        console.log(`[HoverManager] Hovering preview component ${componentId}`);
        this.hoverUIManager.hoverPreviewComponent(element, true, addSecondaryHover && !!event);
      }
    } else {
      console.log(`[HoverManager] Hovering editor component ${componentId}`);
      this.hoverUIManager.hoverEditorComponent(element);
    }

    if (event) {
      this.hoverEventHandler.handleNonTargetElements(event, componentId);
    }
    this.hoverUIManager.changeIndexOfHoverButton('1022', fragment, isPreviewHover);
  }

  private onUnHover(fragment: HTMLElement, isPreviewHover: boolean) {
    this.hoverUIManager.removeHoverRelatedAttributesFromElement(fragment as HTMLElement, true);
    this.hoverUIManager.changeIndexOfHoverButton('0', fragment, isPreviewHover);
  }
}