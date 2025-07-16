import { Injectable } from '@angular/core';
import { HoverUIManager } from './hover-ui-manager';

export interface ComponentPair {
  previewComponent?: HTMLElement;
  editorComponent?: HTMLElement;
}

@Injectable({
  providedIn: 'root'
})
export class HoverCoordinator {

  constructor(private hoverUIManager: HoverUIManager) {}

  // ================================
  // COMPONENT COORDINATION
  // ================================

  /**
   * Find preview and editor component pair for synchronization
   */
  public findComponentPair(hoveredComponent: HTMLElement): ComponentPair {
    let previewComponent: HTMLElement | undefined = undefined;
    let editorComponent: HTMLElement | undefined = undefined;

    const isEditorRowContainer = hoveredComponent.hasAttribute('row-container-editor-comptype');
    const isEditorSectionContainer = hoveredComponent.hasAttribute('editor-section-id');
    const isEditorComponent = hoveredComponent.hasAttribute('editor-comptype');
    const isPreviewComponent = hoveredComponent.hasAttribute('comptype');

    if (isEditorComponent) {
      editorComponent = hoveredComponent;
      previewComponent = document.querySelector(`[id="${hoveredComponent.getAttribute('editor-id')}"]`) as HTMLElement | undefined;
    } else if (isEditorRowContainer) {
      editorComponent = hoveredComponent;
      previewComponent = document.querySelector(`[id="${hoveredComponent.getAttribute('row-container-editor-id')}"]`) as HTMLElement | undefined;
    } else if (isEditorSectionContainer) {
      editorComponent = hoveredComponent;
      previewComponent = document.querySelector(`[id="${hoveredComponent.getAttribute('editor-section-id')}"]`) as HTMLElement | undefined;
    } else if (isPreviewComponent) {
      editorComponent = document.querySelector(`[editor-id="${hoveredComponent.id}"]`) as HTMLElement | undefined;
      previewComponent = hoveredComponent;
    }

    return { previewComponent, editorComponent };
  }

  /**
   * Synchronize hover between preview and editor components
   */
  public synchronizeHover(componentPair: ComponentPair): void {
    // One of them can be undefined for example when a component is selected and the layout manager
    // does not show the layout of the component that is hovered due to showing the selected component's
    // settings.
    if (componentPair.previewComponent) {
      this.hoverUIManager.hoverPreviewComponentAndParents(componentPair.previewComponent);
    }
    if (componentPair.editorComponent) {
      this.hoverUIManager.hoverEditorComponent(componentPair.editorComponent);
    }
  }

  /**
   * Find the currently hovered component in preview area
   */
  public findDirectlyHoveredComponent(): HTMLElement | undefined {
    return Array.from(document.querySelectorAll(':hover')).filter(
      e => e.hasAttribute('comptype') ||
        e.hasAttribute('editor-comptype') ||
        e.hasAttribute('row-container-editor-comptype') ||
        e.hasAttribute('editor-section-id')
    ).pop() as HTMLElement | undefined;
  }
}