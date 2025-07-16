import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ComponentLayout } from '@common/data/page/ComponentsLayout';
import { PageComponent } from '@common/data/page/PageComponent';
import { PageComponentNames } from '@common/data/page/PageComponentNames';
import { PageDetail } from '@common/data/page/PageDetail';
import { ParentMap } from '@common/data/page/ParentMap';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { detailsLayoutAppSelector } from '@page-preview/selectors/page-preview.selectors';
import { addNewComponent } from '@report-editor-components/actions/report-editor-components.actions';
import { getAncestorOfType } from '@report-editor-components/helpers/editor-component.helper';
import { deselectAllComponents, editSingleComponent, switchView } from '@report-editor/actions/report-editor.actions';
import { editedComponentsAndParentsAppSelector, getParentByIdSelector, templateTypeAppSelector } from '@report-editor/reducers/report-editor.reducer';
import { Subscription, combineLatest, lastValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { AppState } from 'src/app/app.state';
// NEW: Import the new hover system
import { HoverManager, HoverUIManager } from './path/to/hover-system';
import { GridComponent } from '@common/data/page/GridComponent';

@Component({
  selector: 'breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  standalone: false,
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  constructor(
    private store: Store<AppState>,
    private actions: Actions,
    private dialog: MatDialog,
    private cd: ChangeDetectorRef,
    // NEW: Inject the new hover system instead of old HoverService
    private hoverManager: HoverManager,
    private hoverUIManager: HoverUIManager, // Optional: for more granular control
  ) { }

  // REMOVED: hoverHelper property no longer needed
  @Input() useBreadcrumbInFloatingLabel = false;
  modifiedBreadcrumbContent: PageComponent[] = [];
  @Input() selectedTab?: number;
  multipleSelected = false;
  singleSelectedComponent?: PageComponent;
  editedComponentIds: Set<string> = new Set();
  orphanedIds: Set<string> = new Set();
  breadcrumb: PageComponent[] = [];
  subscriptions: Subscription[] = [];
  templateType?: PageComponentNames;
  PageComponentNames = PageComponentNames;

  selectedComponentIds?: Set<string>;
  detailLayout: ComponentLayout[] | undefined;
  detailComponents: (PageComponent | undefined)[];
  components: (PageComponent | undefined)[];
  detailPane: PageComponent | undefined;
  selectedDetailPaneId: string = '';
  baseName: string = 'Page';
  columnId?: string;
  parentIsColumn?: PageComponent;
  private parentMap: ParentMap;
  @ViewChild("breadcrumbMenu") breadcrumbMenu!: TemplateRef<any>;
  popoverRef: MatDialogRef<any> | null = null;
  popoverOpened: boolean = false;
  showHomeInBreadcrumbContent: boolean = true;

  ngOnInit() {
    this.subscriptions.push(
      this.store.select(templateTypeAppSelector).subscribe(type => this.templateType = type),
      this.store.select(editedComponentsAndParentsAppSelector).subscribe(async ({ ids, components }) => {
        if (this.editedComponentIds == ids && this.orphanedIds.size == 0) return;

        this.editedComponentIds = ids;
        if (ids.size > 1) return this.selectMultiple();
        if (ids.size == 1) {
          let component = components.getComponent(ids.values().next().value);
          if (!component) {
            this.orphanedIds.add(ids.values().next().value);
            return this.selectNone();
          }
          this.orphanedIds.delete(ids.values().next().value);
          return setTimeout(async () => await this.selectSingle(component), 0);
        }
        this.editedComponentIds = new Set();
        this.orphanedIds.clear();
        return this.selectNone();
      }),
      this.store.select(state => state.report.editor.selectedComponentIds).subscribe(selectedComponentIds => {
        this.selectedComponentIds = selectedComponentIds;
      }),
      this.actions.pipe(ofType(addNewComponent)).subscribe(async (props) => {
        if (props.parentId == this.columnId && this.parentIsColumn) {
          this.columnId = undefined;
          const component = this.parentIsColumn;
          this.parentIsColumn = undefined;
          return await this.selectSingle(component);
        }
      }),
      combineLatest([
        this.store.select(state => state.report.pagePreview.loadedPage?.components),
        this.store.select(detailsLayoutAppSelector),
        this.store.select(state => state.report.pagePreview)
      ]).subscribe(([components, detailsLayout, { layoutMap, parentMap }]) => {
        this.detailLayout = detailsLayout;
        this.parentMap = parentMap;

        if (components) {
          let id;
          if (this.selectedDetailPaneId) id = this.selectedDetailPaneId;

          this.components = Object.values(components.data).filter(component => {
            return component && layoutMap.getLayout(component.uniqueId);
          });

          const detailsAndDescendants = detailsLayout?.map(layout => [
            layout.componentId,
            ...parentMap.findDescendants(layout.componentId)
          ]).flat() || [];

          this.detailComponents = Object.values(components.data).filter(component => {
            return component && detailsAndDescendants.includes(component.uniqueId);
          });

          if (id && !components.getComponent(id)) {
            this.selectedDetailPaneId = '';
            this.store.dispatch(deselectAllComponents({}));
          }
        }
      })
    );

    // REMOVED: No longer need to create HoverHelper instance
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedTab']) {
      this.getBaseName();
    }
  }

  // NEW: Simplified manual hover for home page icon using HoverManager
  listenForHoverOnPageHomeIcon(pageElemFromBreadcrumb: HTMLElement, inFloatingLabel: boolean) {
    if (inFloatingLabel === false) return;

    const pageElem = document.querySelector('#page-editor .card #preview') as HTMLElement;
    const footerElem = document.querySelector('.report-footer') as HTMLElement;

    if (!pageElem || !footerElem) return;

    const addHomePageHoverClass = () => {
      pageElem.classList.add("hovered-home-page");
      footerElem.classList.add("hovered-home-page");
    };

    const removeHomePageHoverClass = () => {
      pageElem.classList.remove("hovered-home-page");
      footerElem.classList.remove("hovered-home-page");
    };

    // Using setTimeout to ensure the event listeners are added after the initial class addition
    setTimeout(() => {
      pageElemFromBreadcrumb.addEventListener('mouseenter', () => {
        addHomePageHoverClass();
      });
    }, 0);

    pageElemFromBreadcrumb.addEventListener('mouseleave', () => {
      removeHomePageHoverClass();
    });

    pageElemFromBreadcrumb.addEventListener('click', () => {
      removeHomePageHoverClass();
    });
  }

  // NEW: Simplified manual hover for breadcrumb elements using HoverManager
  listenForHoverOnFloatingLabelBreadcrumbElems(componentId: string, breadcrumbElement: HTMLElement, inFloatingLabel: boolean) {
    if (inFloatingLabel === false) return;

    const componentElem = document.querySelector(`[id="${componentId}"]`) as HTMLElement;
    
    breadcrumbElement.addEventListener('mouseenter', (mouseEvent) => {
      if (componentElem) {
        // NEW: Use HoverManager for manual triggering
        this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);
      }
    });
    
    breadcrumbElement.addEventListener('mouseleave', () => {
      if (componentElem) {
        // NEW: Use HoverManager for manual triggering
        this.hoverManager.setComponentHoverState(componentId, false);
      }
    });
  }

  // NEW: Alternative method using HoverUIManager directly for more control
  listenForHoverOnFloatingLabelBreadcrumbElemsAdvanced(componentId: string, breadcrumbElement: HTMLElement, inFloatingLabel: boolean) {
    if (inFloatingLabel === false) return;

    const componentElem = document.querySelector(`[id="${componentId}"]`) as HTMLElement;
    if (!componentElem) return;

    breadcrumbElement.addEventListener('mouseenter', (mouseEvent) => {
      // Option 1: Use HoverManager (recommended for most cases)
      this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);
      
      // Option 2: Direct UI control for custom behavior
      // this.hoverUIManager.addPreviewComponentHover(componentElem, this.page, {
      //   addOutline: true,
      //   addSecondaryHover: false
      // });
    });
    
    breadcrumbElement.addEventListener('mouseleave', () => {
      // Option 1: Use HoverManager (recommended)
      this.hoverManager.setComponentHoverState(componentId, false);
      
      // Option 2: Direct UI control
      // this.hoverUIManager.removeComponentHover(componentElem, this.page, true);
    });
  }

  // NEW: Bulk hover operations for multiple breadcrumb items
  hoverAllBreadcrumbItems(isHovered: boolean) {
    this.modifiedBreadcrumbContent.forEach(component => {
      this.hoverManager.setComponentHoverState(component.uniqueId, isHovered);
    });
  }

  // NEW: Custom hover behavior for specific breadcrumb scenarios
  triggerCustomBreadcrumbHover(componentId: string, event: MouseEvent) {
    // Check if component has hover functionality initialized
    if (!this.hoverManager.hasHoverFunctionality(componentId)) {
      console.warn(`Component ${componentId} doesn't have hover functionality initialized`);
      return;
    }

    // Trigger hover with event context
    this.hoverManager.setComponentHoverState(componentId, true, event);
    
    // You can also add custom logic here
    this.addCustomBreadcrumbVisualEffects(componentId);
  }

  private addCustomBreadcrumbVisualEffects(componentId: string) {
    // Custom visual effects specific to breadcrumb interactions
    const breadcrumbItem = document.querySelector(`[data-breadcrumb-id="${componentId}"]`);
    breadcrumbItem?.classList.add('breadcrumb-highlighted');
    
    // Remove after a delay
    setTimeout(() => {
      breadcrumbItem?.classList.remove('breadcrumb-highlighted');
    }, 2000);
  }

  generateFloatingLabelBreadcrumbContent(): void {
    if (!this.useBreadcrumbInFloatingLabel) {
      this.modifiedBreadcrumbContent = this.breadcrumb;
      return;
    }
    const withoutSelectedComponent = this.breadcrumb.slice(0, -1);
    this.modifiedBreadcrumbContent =
      this.breadcrumb.length > 3 ? withoutSelectedComponent.slice(-3) : withoutSelectedComponent;
  }

  getFloatingLabelBreadcrumbItemsClasses(item: GridComponent): { [key: string]: boolean } {
    if (this.useBreadcrumbInFloatingLabel) {
      const typeClass = 'type-' + (item.type).toLowerCase();
      return {
        [typeClass]: true,
        'type-detail-pane': item.uniqueId === this.selectedDetailPaneId,
        'type-filter-bar': item.type === PageComponentNames.filterBar
      };
    } else {
      return {};
    }
  }

  selectMultiple() {
    this.singleSelectedComponent = undefined;
    this.multipleSelected = true;
    this.breadcrumb = [];
    this.modifiedBreadcrumbContent = [];
  }

  async selectSingle(component: PageComponent) {
    this.popoverOpened = false;
    this.breadcrumb = [];
    this.modifiedBreadcrumbContent = [];
    this.selectNone();
    this.orphanedIds.clear();
    this.multipleSelected = false;
    this.singleSelectedComponent = component;
    this.detailPane = undefined;

    this.breadcrumb = [component];

    await this.updateBreadcrumb(component);
    const isOpenedInDialog = document.querySelector(".detail-dialog") !== null;
    if (isOpenedInDialog) this.selectedTab = 3;

    if (!isOpenedInDialog) {
      if (component.type == PageComponentNames.detail)
        await this.checkAndUpdateForDetail(component);
      else
        await this.checkAndUpdateForDetailPane(component);
    }
    this.showHomeInBreadcrumbContent = (this.useBreadcrumbInFloatingLabel === false) || (this.useBreadcrumbInFloatingLabel === true && this.breadcrumb.length <= 3);
    this.getBaseName();
    this.generateFloatingLabelBreadcrumbContent();
  }

  // ... rest of the methods remain the same ...
  async updateBreadcrumb(component: PageComponent, firstComponentToInclude?: PageComponent) {
    let previous = await lastValueFrom(this.store.select(getParentByIdSelector(component.uniqueId)).pipe(take(1)));
    let editingDetails = await lastValueFrom(this.store.select(state => state.report.editor.editingDetails).pipe(take(1)));
    if (firstComponentToInclude) previous = firstComponentToInclude;
    if (!previous) return;

    while (!!previous && !!previous.uniqueId) {
      if (this.breadcrumb.length === 0 || this.breadcrumb[0].type !== previous.type) {
        this.breadcrumb.unshift(previous);
      }

      if (this.breadcrumb.find(item => item.type === PageComponentNames.detail) && !editingDetails) {
        this.store.dispatch(switchView({ editingDetails: true }));
      }

      previous = await lastValueFrom(this.store.select(getParentByIdSelector(previous.uniqueId)).pipe(take(1)));

      if (!previous) {
        if (this.breadcrumb.length > 0 && this.breadcrumb[0].type == PageComponentNames.column) {
          this.columnId = this.breadcrumb[0].uniqueId;
          this.parentIsColumn = component;
          this.breadcrumb = [];
          this.modifiedBreadcrumbContent = [];
          return await this.selectSingle(component);
        }
        break;
      }
    }
    this.cd.markForCheck();
  }

  async updateDetailPaneInBreadcrumb(component: PageComponent) {
    const detailPaneBreadcrumb: PageComponent[] = [];
    if (!detailPaneBreadcrumb.find(breadCumbcomp => breadCumbcomp == component))
      detailPaneBreadcrumb.push(component);
    else return;

    let previous = await lastValueFrom(this.store.select(getParentByIdSelector(component?.uniqueId)).pipe(take(1)));

    while (!!previous && !!previous.uniqueId) {
      detailPaneBreadcrumb.push(previous);
      previous = await lastValueFrom(this.store.select(getParentByIdSelector(previous.uniqueId)).pipe(take(1)));
      if (!previous) break;
    }

    this.breadcrumb.unshift(...detailPaneBreadcrumb.reverse());
  }

  async checkAndUpdateForDetailPane(component: PageComponent) {
    const reportState = await lastValueFrom(this.store.select(state => state.report).pipe(take(1)));
    const detailParent = getAncestorOfType(component.uniqueId, PageComponentNames.detail, reportState);

    if (detailParent instanceof PageComponent) {
      const detailPane = this.components.find(component => {
        if (component?.type == PageComponentNames.detail)
          return (component as PageDetail).detailsToRender?.find(detail => detail == detailParent.uniqueId);
      });
      this.detailPane = detailPane;
      if (this.detailPane) this.selectedDetailPaneId = this.detailPane.uniqueId;
    }

    if (!!this.detailPane && !!detailParent) {
      const editingDetails = await lastValueFrom(this.store.select(state => state.report.editor.editingDetails).pipe(take(1)));
      if (!editingDetails) this.store.dispatch(switchView({ editingDetails: true }));
      await this.updateDetailPaneInBreadcrumb(this.detailPane);
    }
  }

  async checkAndUpdateForDetail(component: PageComponent) {
    const findDetailComponent = (layouts: ComponentLayout[] | undefined, uniqueId: string) => {
      return layouts?.find(
        layout => layout.componentId === uniqueId || this.parentMap.isChildOf(uniqueId, layout.componentId)
      );
    };
    this.detailPane = this.components.find(detailPane => {
      const detailComponent = findDetailComponent(this.detailLayout, component.uniqueId);
      if (detailComponent && (detailPane as PageDetail).detailsToRender?.includes(detailComponent.componentId)) {
        return true;
      }
    });
    if (this.detailPane) {
      this.selectedDetailPaneId = this.detailPane.uniqueId;
      await this.updateBreadcrumb(this.detailPane, this.detailPane);
    }
  }

  selectNone() {
    this.popoverRef?.close();
    this.popoverOpened = false;
    this.multipleSelected = false;
    this.singleSelectedComponent = undefined;
    this.breadcrumb = [];
    this.modifiedBreadcrumbContent = [];
  }

  goBase() {
    this.popoverRef?.close();
    this.popoverOpened = false;
    this.store.dispatch(deselectAllComponents({}));
  }

  editItem(id: string) {
    this.popoverOpened = false;
    this.popoverRef?.close();
    this.cd.markForCheck();
    if (this.breadcrumb.find((item) => item.type == PageComponentNames.detail))
      this.store.dispatch(switchView({ editingDetails: true }));
    this.store.dispatch(editSingleComponent({ componentId: id, inDetailPane: !!this.detailPane }));
  }

  getBaseName() {
    this.baseName = this.selectedTab == 3 ? !!this.detailPane && this.breadcrumb.length > 0 ? "Page" : "Details" : "Page";
    return this.baseName;
  }

  isSelected(componentId: string) {
    const selectedIds = this.selectedComponentIds?.values();
    if (selectedIds) return [...selectedIds].includes(componentId);
    return false;
  }

  openHiddenBreadcrumbs(event: MouseEvent) {
    this.popoverRef = this.dialog.open(this.breadcrumbMenu, {
      panelClass: "breadcrumb-dialog",
      position: {
        top: `${event.clientY + 15}px`,
        left: `${event.clientX - 25}px`,
      },
      hasBackdrop: true,
      backdropClass: "transparent-backdrop",
      width: "fit-content",
      minWidth: "0px",
    });

    this.popoverOpened = true;
    this.popoverRef.backdropClick().subscribe(() => {
      this.popoverOpened = false;
      this.cd.markForCheck();
      this.popoverRef?.close();
    });
  }

  ngOnDestroy(): void {
    this.popoverOpened = false;
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}