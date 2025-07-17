import { Injectable, OnDestroy } from '@angular/core';
import { Page } from '@common/data/page/Page';
import { Store } from '@ngrx/store';
import { isDisabledCarouselSlide } from '@report-editor-components/helpers/editor-component.helper';
import { ReportFilesService } from '@shared/services/reports/report-files.service';
import { Subscription } from 'rxjs';
import { AppState } from 'src/app/app.state';

@Injectable({
  providedIn: 'root'
})
export class HoverUIManager implements OnDestroy {
  private page?: Page;
  private subscriptions: Subscription[] = [];

  constructor(
    private mediaService: ReportFilesService,
    private store: Store<AppState>,
  ) {
    this.subscriptions.push(
      this.store.select(state => state.report.pagePreview.loadedPage).subscribe((loadedPage?: Page) => {
        if (loadedPage) this.page = loadedPage;
      }),
    );
  }

  // ================================
  // DOM MANIPULATION METHODS
  // ================================

  public getHoverOverlayEl(id: string) {
    return document.getElementById(`hover-overlay_${id}`);
  }

  public removeHoverRelatedAttributesFromElement(componentElement: HTMLElement, isPreviewHover: boolean) {
    if (!this.page || !this.page.components) return;

    if (isPreviewHover) {
      // Restore original background image
      componentElement.style.backgroundImage = this.page.components.data[componentElement.id]?.styles.backgroundImageOptimizations ? 
        `url(${this.mediaService.getBackground(this.page!.components.data[componentElement.id]?.styles.backgroundImageOptimizations, this.page!.components.data[componentElement.id]?.styles.backgroundImageSize).backgroundSrc})` : '';
    }

    if (componentElement.hasAttribute('comptype')) {
      this.getHoverOverlayEl(componentElement.id)?.classList.remove('hovered', 'outlined', 'hovered-secondary');
    } else {
      componentElement.classList.remove('hovered');
    }

    // Handle floating label visibility with optimized approach
    this.toggleFloatingLabel(componentElement, false);
  }

  /**
   * Original hoverPreviewComponent logic with floating label enhancement
   */
  public hoverPreviewComponent(componentElement: HTMLElement | null, addOutline?: boolean, addSecondaryHover?: boolean) {
    if (!componentElement) return;

    // Do no display "layout" hover icon buttons when detail dialog is opened (detailsLayout)
    const detailDialog = document.querySelector(".detail-dialog");
    if (detailDialog && !detailDialog.contains(componentElement)) return;

    // Prevent hover effects if the component is inside a carousel slide which isn't active, and
    // if the carousel has a class of "disable-hover-on-inactive-slides".
    if (isDisabledCarouselSlide(componentElement)) return;

    const hoverOverlayEl = this.getHoverOverlayEl(componentElement.id);

    const classList: string[] = ['hovered'];

    if (addOutline && !componentElement.classList.contains("selected")) {
      classList.push('outlined');
    }

    if (addSecondaryHover) {
      classList.push('hovered-secondary');
    } else {
      hoverOverlayEl?.classList.remove('hovered-secondary');
    }

    hoverOverlayEl?.classList.add(...classList);

    const component = this.page!.components.data[componentElement.id];

    if (component?.styles.states?.hover.backgroundImageOptimizations)
      componentElement.style.backgroundImage = `url(${this.mediaService.getBackground(component.styles.states.hover.backgroundImageOptimizations).backgroundSrc})`;
    else if (component?.styles.backgroundImageOptimizations && component?.styles.states?.hover.removedBackgroundImageForState)
      componentElement.style.backgroundImage = '';

    // Handle floating label visibility with optimized approach
    this.toggleFloatingLabel(componentElement, true, addSecondaryHover);
  }

  public hoverPreviewComponentAndParents(componentElement: HTMLElement | null) {
    if (!componentElement) return;
    this.hoverPreviewComponent(componentElement, true);
  }

  public hoverDirectParent(componentElement: HTMLElement | null, isPreviewHover: boolean) {
    if (!componentElement) return;

    const parent: HTMLElement | null = componentElement.parentElement;
    if (parent && isPreviewHover) this.hoverPreviewComponent(parent, true);
  }

  public hoverEditorComponent(editorElement: HTMLElement | null) {
    if (!editorElement) return;
    if (editorElement?.classList.contains('drag-handle')) editorElement = editorElement.parentElement!;
    editorElement?.classList.add('hovered');
  }

  // Change zIndex of hovered editor-button of a child component inside a Column container in the Layout manager
  public changeIndexOfHoverButton(value: string, fragment: HTMLElement, isPreviewHover: boolean) {
    if (isPreviewHover) return;

    const targetElement = fragment;
    const editorButtonElement = targetElement.querySelector('#editorButton') as HTMLElement;
    if (editorButtonElement) {
      editorButtonElement.style.zIndex = value;
    }
  }

  // ================================
  // FLOATING LABEL MANAGEMENT
  // ================================

  // ENHANCEMENT: Optimized floating label toggle with CSS classes
  public toggleFloatingLabel(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover?: boolean) {
    const isSelected = componentElement.classList.contains('selected');
    
    // Show floating labels if:
    // 1. Component is selected (always show for selected components)
    // 2. Component is directly hovered (not secondary hover from parent)
    const shouldShow = isSelected || (isHovered && !isSecondaryHover);
    
    // Direct ID lookup for maximum performance
    const componentId = componentElement.id;
    const floatingLabel = document.getElementById(`component-label_${componentId}`);
    
    console.log(`[FloatingLabel] ${componentId}: isHovered=${isHovered}, isSecondaryHover=${isSecondaryHover}, isSelected=${isSelected}, shouldShow=${shouldShow}`);
    
    if (floatingLabel) {
      if (shouldShow) {
        console.log(`[FloatingLabel] Showing label for ${componentId}`);
        floatingLabel.classList.add('visible');
      } else {
        console.log(`[FloatingLabel] Hiding label for ${componentId}`);
        floatingLabel.classList.remove('visible');
      }
    } else {
      console.log(`[FloatingLabel] No floating label found for ${componentId}`);
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  // This function is written to search specifically only in the preview and not in the layout manager,
  // which is necessary #10940 to work properly.
  public getDirectlyPreviewHoveredComponent() {
    return Array.from(document.querySelectorAll(':hover'))
      .filter(e => e.hasAttribute('comptype') && !e.hasAttribute('editor-id')).pop() as HTMLElement | undefined;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}