import { Injectable } from '@angular/core';
import { Page } from '@common/data/page/Page';
import { HoverUIManager } from './hover-ui-manager';

export interface ComponentPair {
  previewComponent: HTMLElement | null;
  editorComponent: HTMLElement | null;
}

@Injectable({
  providedIn: 'root'
})
export class HoverCoordinator {
  
  constructor(private uiManager: HoverUIManager) {}

  public findDirectlyHoveredComponent(): HTMLElement | null {
    return Array.from(document.querySelectorAll(':hover'))
      .filter(e => 
        e.hasAttribute('comptype') ||
        e.hasAttribute('editor-comptype') ||
        e.hasAttribute('row-container-editor-comptype') ||
        e.hasAttribute('editor-section-id')
      )
      .pop() as HTMLElement | null;
  }

  public findPreviewHoveredComponent(): HTMLElement | null {
    return Array.from(document.querySelectorAll(':hover'))
      .filter(e => e.hasAttribute('comptype') && !e.hasAttribute('editor-id'))
      .pop() as HTMLElement | null;
  }

  public findComponentPair(hoveredElement: HTMLElement): ComponentPair {
    let previewComponent: HTMLElement | null = null;
    let editorComponent: HTMLElement | null = null;

    const isEditorRowContainer = hoveredElement.hasAttribute('row-container-editor-comptype');
    const isEditorSectionContainer = hoveredElement.hasAttribute('editor-section-id');
    const isEditorComponent = hoveredElement.hasAttribute('editor-comptype');
    const isPreviewComponent = hoveredElement.hasAttribute('comptype');

    if (isEditorComponent) {
      editorComponent = hoveredElement;
      const editorId = hoveredElement.getAttribute('editor-id');
      previewComponent = editorId ? document.querySelector(`[id="${editorId}"]`) as HTMLElement : null;
    } else if (isEditorRowContainer) {
      editorComponent = hoveredElement;
      const containerId = hoveredElement.getAttribute('row-container-editor-id');
      previewComponent = containerId ? document.querySelector(`[id="${containerId}"]`) as HTMLElement : null;
    } else if (isEditorSectionContainer) {
      editorComponent = hoveredElement;
      const sectionId = hoveredElement.getAttribute('editor-section-id');
      previewComponent = sectionId ? document.querySelector(`[id="${sectionId}"]`) as HTMLElement : null;
    } else if (isPreviewComponent) {
      previewComponent = hoveredElement;
      editorComponent = document.querySelector(`[editor-id="${hoveredElement.id}"]`) as HTMLElement;
    }

    return { previewComponent, editorComponent };
  }

  public synchronizeHover(componentPair: ComponentPair, page: Page): void {
    if (componentPair.previewComponent) {
      this.hoverPreviewComponentAndParents(componentPair.previewComponent, page);
    }
    if (componentPair.editorComponent) {
      this.uiManager.addEditorComponentHover(componentPair.editorComponent);
    }
  }

  public hoverPreviewComponentAndParents(component: HTMLElement, page: Page): void {
    this.uiManager.addPreviewComponentHover(component, page, { addOutline: true });
  }

  public hoverDirectParent(component: HTMLElement, page: Page, isPreviewHover: boolean): void {
    const parent = component.parentElement;
    if (parent && isPreviewHover) {
      this.uiManager.addPreviewComponentHover(parent, page, { addOutline: true });
    }
  }

  public removeAllHoveredComponentsExcept(excludeComponentId: string, page: Page): void {
    // Remove hover from all preview components except the excluded one
    const hoveredPreviewComponents = document.querySelectorAll<HTMLElement>(
      `[comptype]:has(> .hover-overlay.hovered):not([id="${excludeComponentId}"])`
    );

    hoveredPreviewComponents.forEach(element => {
      this.uiManager.removeComponentHover(element, page, true);
    });

    // Remove hover from all editor components except the excluded one  
    const hoveredEditorComponents = document.querySelectorAll<HTMLElement>(
      `[editor-id].hovered:not([editor-id="${excludeComponentId}"])`
    );

    hoveredEditorComponents.forEach(element => {
      this.uiManager.removeComponentHover(element, page, false);
    });
  }
}