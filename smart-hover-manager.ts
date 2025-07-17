import { Injectable } from '@angular/core';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
import { PreviewModes } from "@common/data/report/enums/PreviewModes";
import { Subscription } from 'rxjs';
import { GlobalHoverManager } from './global-hover-manager';

/**
 * Smart Hover Manager - maintains the same API as the original system
 * but uses the optimized GlobalHoverManager internally
 */
@Injectable({
  providedIn: 'root'
})
export class SmartHoverManager {

  constructor(private globalHoverManager: GlobalHoverManager) {}

  // ================================
  // MAIN API - Same as original but much smarter internally
  // ================================

  /**
   * Complete hover setup - now uses smart global hover management
   * Same API as before, but much more efficient internally
   */
  public setupComponentHover(
    fragment: HTMLElement,
    isPreviewHover: boolean,
    componentType: PageComponentNames,
    componentId: string,
    previewMode: PreviewModes,
    containerType?: PageGridComponentNames
  ): Subscription {
    // Delegate to the smart global manager
    return this.globalHoverManager.registerComponent(
      fragment,
      componentType,
      componentId,
      isPreviewHover,
      previewMode,
      containerType
    );
  }

  // ================================
  // HOVER STATE CONTROL - Same API
  // ================================

  /**
   * Manual hover triggering - same API as before
   */
  public setComponentHoverState(componentId: string, isHovered: boolean, event?: MouseEvent) {
    this.globalHoverManager.setComponentHoverState(componentId, isHovered, event);
  }

  /**
   * Alternative method name for manual hover triggering
   */
  public triggerHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
    this.globalHoverManager.setComponentHoverState(componentId, isHovered, event);
  }

  /**
   * Check if component has hover functionality
   */
  public hasHoverFunctionality(componentId: string): boolean {
    return this.globalHoverManager.hasHoverFunctionality(componentId);
  }

  /**
   * Clean up hover functionality for a component
   */
  public destroyComponentHover(componentId: string) {
    this.globalHoverManager.destroyComponent(componentId);
  }
}