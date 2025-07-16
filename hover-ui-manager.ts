import { Injectable } from '@angular/core';
import { Page } from '@common/data/page/Page';
import { PageComponentNames } from "@common/data/page/PageComponentNames";
import { ReportFilesService } from '@shared/services/reports/report-files.service';
import { isDisabledCarouselSlide } from '@report-editor-components/helpers/editor-component.helper';

@Injectable({
  providedIn: 'root'
})
export class HoverUIManager {
  
  constructor(private mediaService: ReportFilesService) {}

  public getHoverOverlayElement(componentId: string): HTMLElement | null {
    return document.getElementById(`hover-overlay_${componentId}`);
  }

  public addPreviewComponentHover(
    componentElement: HTMLElement, 
    page: Page,
    options: {
      addOutline?: boolean;
      addSecondaryHover?: boolean;
    } = {}
  ): void {
    if (!componentElement || !this.canHoverComponent(componentElement)) {
      return;
    }

    const hoverOverlayEl = this.getHoverOverlayElement(componentElement.id);
    if (!hoverOverlayEl) return;

    const classList: string[] = ['hovered'];

    if (options.addOutline && !componentElement.classList.contains("selected")) {
      classList.push('outlined');
    }

    if (options.addSecondaryHover) {
      classList.push('hovered-secondary');
    } else {
      hoverOverlayEl.classList.remove('hovered-secondary');
    }

    hoverOverlayEl.classList.add(...classList);

    this.updateBackgroundImageForHover(componentElement, page);
  }

  public addEditorComponentHover(editorElement: HTMLElement | null): void {
    if (!editorElement) return;
    
    // Handle drag-handle case
    if (editorElement.classList.contains('drag-handle')) {
      editorElement = editorElement.parentElement!;
    }
    
    editorElement?.classList.add('hovered');
  }

  public removeComponentHover(componentElement: HTMLElement, page: Page, isPreviewComponent: boolean): void {
    if (!componentElement || !page?.components) return;

    if (isPreviewComponent) {
      this.restoreOriginalBackgroundImage(componentElement, page);
      const hoverOverlay = this.getHoverOverlayElement(componentElement.id);
      hoverOverlay?.classList.remove('hovered', 'outlined', 'hovered-secondary');
    } else {
      componentElement.classList.remove('hovered');
    }
  }

  public updateEditorButtonZIndex(fragment: HTMLElement, zIndex: string, isPreviewHover: boolean): void {
    if (isPreviewHover) return;

    const editorButtonElement = fragment.querySelector('#editorButton') as HTMLElement;
    if (editorButtonElement) {
      editorButtonElement.style.zIndex = zIndex;
    }
  }

  public removeSecondaryHoverFromComponents(
    componentTypes: PageComponentNames[], 
    excludeComponentId?: string
  ): void {
    const selector = componentTypes
      .map(type => `[comptype="${type}"]:has(> .hover-overlay.hovered)${excludeComponentId ? `:not([id="${excludeComponentId}"])` : ''}`)
      .join(',');

    const components = document.querySelectorAll<HTMLElement>(selector);
    
    components.forEach((element: HTMLElement) => {
      setTimeout(() => {
        const hoverOverlayEl = this.getHoverOverlayElement(element.id);
        hoverOverlayEl?.classList.remove('outlined');
        hoverOverlayEl?.classList.add('hovered-secondary');
      }, 0);
    });
  }

  public removeAllHoveredComponents(excludeComponentId?: string, excludeTypes: PageComponentNames[] = []): void {
    const excludeTypeSelectors = excludeTypes.map(type => `:not([comptype="${type}"])`).join('');
    const selector = `[comptype]:has(> .hover-overlay.hovered)${excludeComponentId ? `:not([id="${excludeComponentId}"])` : ''}${excludeTypeSelectors},[editor-id].hovered${excludeComponentId ? `:not([editor-id="${excludeComponentId}"])` : ''}`;
    
    const allHoveredComponents = document.querySelectorAll<HTMLElement>(selector);
    const allHoveredEditorSections = document.querySelectorAll<HTMLElement>('.section-content.hovered');

    allHoveredEditorSections.forEach((el: HTMLElement) => {
      const dragHandleElem = el.children[1];
      if (dragHandleElem && dragHandleElem.getAttribute('editor-id') === excludeComponentId) return;
      
      el.classList.remove('hovered');
    });

    allHoveredComponents.forEach((el: HTMLElement) => {
      const isPreview = !el.hasAttribute('editor-id');
      if (isPreview) {
        const hoverOverlay = this.getHoverOverlayElement(el.id);
        hoverOverlay?.classList.remove('hovered', 'outlined', 'hovered-secondary');
      } else {
        el.classList.remove('hovered');
      }
    });
  }

  public removeSpecificHoverClass(componentId: string, className: string): void {
    setTimeout(() => {
      this.getHoverOverlayElement(componentId)?.classList.remove(className);
    }, 0);
  }

  private canHoverComponent(componentElement: HTMLElement): boolean {
    // Do not display hover when detail dialog is opened
    const detailDialog = document.querySelector(".detail-dialog");
    if (detailDialog && !detailDialog.contains(componentElement)) {
      return false;
    }

    // Prevent hover effects if component is in disabled carousel slide
    if (isDisabledCarouselSlide(componentElement)) {
      return false;
    }

    return true;
  }

  private updateBackgroundImageForHover(componentElement: HTMLElement, page: Page): void {
    const component = page.components.data[componentElement.id];
    
    if (component?.styles.states?.hover.backgroundImageOptimizations) {
      const backgroundSrc = this.mediaService.getBackground(
        component.styles.states.hover.backgroundImageOptimizations
      ).backgroundSrc;
      componentElement.style.backgroundImage = `url(${backgroundSrc})`;
    } else if (component?.styles.backgroundImageOptimizations && 
               component?.styles.states?.hover.removedBackgroundImageForState) {
      componentElement.style.backgroundImage = '';
    }
  }

  private restoreOriginalBackgroundImage(componentElement: HTMLElement, page: Page): void {
    const component = page.components.data[componentElement.id];
    
    if (component?.styles.backgroundImageOptimizations) {
      const backgroundSrc = this.mediaService.getBackground(
        component.styles.backgroundImageOptimizations,
        component.styles.backgroundImageSize
      ).backgroundSrc;
      componentElement.style.backgroundImage = `url(${backgroundSrc})`;
    } else {
      componentElement.style.backgroundImage = '';
    }
  }
}