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

    // Handle hover overlay first (most important for visual feedback)
    const hoverOverlayEl = this.getHoverOverlayElement(componentElement.id);
    if (hoverOverlayEl) {
      // Clear any existing hover classes first
      hoverOverlayEl.classList.remove('hovered', 'outlined', 'hovered-secondary');
      
      const classList: string[] = ['hovered'];

      if (options.addOutline && !componentElement.classList.contains("selected")) {
        classList.push('outlined');
      }

      if (options.addSecondaryHover) {
        classList.push('hovered-secondary');
      }

      hoverOverlayEl.classList.add(...classList);
    }

    // Update background image and related elements
    this.updateBackgroundImageForHover(componentElement, page);
    this.toggleRelatedElements(componentElement, true, options.addSecondaryHover);
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
    if (!componentElement) return;

    if (isPreviewComponent && page?.components) {
      this.restoreOriginalBackgroundImage(componentElement, page);
      
      // Hide related elements
      this.toggleRelatedElements(componentElement, false);
      
      // Remove hover overlay classes
      const hoverOverlay = this.getHoverOverlayElement(componentElement.id);
      if (hoverOverlay) {
        hoverOverlay.classList.remove('hovered', 'outlined', 'hovered-secondary');
      }
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
        
        // Update related elements for secondary hover
        this.toggleRelatedElements(element, true, true);
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
        
        // Hide related elements when removing hover
        this.toggleRelatedElements(el, false);
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

  /**
   * Toggle visibility of related elements like floating labels
   * Replaces expensive CSS selectors like :has() with direct DOM manipulation
   */
  public toggleRelatedElements(
    componentElement: HTMLElement, 
    isHovered: boolean, 
    isSecondaryHover: boolean = false
  ): void {
    // Handle floating labels
    this.toggleFloatingLabels(componentElement, isHovered, isSecondaryHover);
    
    // Handle other related elements
    this.toggleComponentButtons(componentElement, isHovered, isSecondaryHover);
    this.toggleResizeHandles(componentElement, isHovered, isSecondaryHover);
    
    // Add more related element handlers as needed
  }

  /**
   * Toggle floating label visibility by ID
   * Replaces: [comptype]:has(> .hover-overlay.hovered:not(.hovered-secondary)):not(.selected)>component-label div.floating-label
   */
  public toggleFloatingLabels(
    componentElement: HTMLElement, 
    isHovered: boolean, 
    isSecondaryHover: boolean = false
  ): void {
    // Only show floating labels for primary hover (not secondary) and when not selected
    const shouldShow = isHovered && !isSecondaryHover && !componentElement.classList.contains('selected');
    
    // Target the specific floating label by component ID
    const componentId = componentElement.id;
    const floatingLabel = document.getElementById(`component-label_${componentId}`);
    
    if (floatingLabel) {
      floatingLabel.style.visibility = shouldShow ? 'visible' : 'hidden';
      floatingLabel.style.opacity = shouldShow ? '1' : '0';
    }
  }

  /**
   * Toggle component action buttons visibility
   */
  public toggleComponentButtons(
    componentElement: HTMLElement, 
    isHovered: boolean, 
    isSecondaryHover: boolean = false
  ): void {
    const buttons = componentElement.querySelectorAll<HTMLElement>('.component-action-buttons');
    
    buttons.forEach(button => {
      button.style.visibility = isHovered && !isSecondaryHover ? 'visible' : 'hidden';
    });
  }

  /**
   * Toggle resize handles visibility
   */
  public toggleResizeHandles(
    componentElement: HTMLElement, 
    isHovered: boolean, 
    isSecondaryHover: boolean = false
  ): void {
    const handles = componentElement.querySelectorAll<HTMLElement>('.resize-handle');
    
    handles.forEach(handle => {
      handle.style.visibility = isHovered && !isSecondaryHover ? 'visible' : 'hidden';
    });
  }

  /**
   * Add custom element toggles for specific use cases
   */
  public addCustomElementToggle(
    selector: string,
    toggleFunction: (element: HTMLElement, isHovered: boolean, isSecondaryHover: boolean) => void
  ): void {
    // Store custom toggles in a map if needed for dynamic behavior
    // This allows other parts of the application to register custom element behaviors
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