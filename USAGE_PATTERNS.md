# Hover System Usage Patterns

## 1. Standard Component Hover (Most Common)

**Use `setupComponentHover()` for complete automatic hover behavior:**

```typescript
export class MyComponent implements OnInit, OnDestroy {
  private hoverSubscription?: Subscription;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private hoverManager: HoverManager
  ) {}

  ngOnInit() {
    // One call sets up everything: state management + event listeners
    this.hoverSubscription = this.hoverManager.setupComponentHover(
      this.elementRef.nativeElement,
      this.isPreviewHover,
      this.componentType,
      this.componentId,
      this.previewMode,
      this.containerType
    );
  }

  ngOnDestroy() {
    this.hoverSubscription?.unsubscribe();
    this.hoverManager.destroyComponentHover(this.componentId);
  }
}
```

## 2. Manual Triggering Only (Breadcrumbs, External Controls)

**No setup needed - just trigger when you need it:**

```typescript
export class BreadcrumbComponent {
  constructor(private hoverManager: HoverManager) {}

  onBreadcrumbItemHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
    // Direct manual triggering - no setup required
    this.hoverManager.setComponentHoverState(componentId, isHovered, event);
  }

  // Bulk operations
  hoverAllBreadcrumbItems(isHovered: boolean) {
    this.breadcrumbItems.forEach(item => {
      this.hoverManager.setComponentHoverState(item.id, isHovered);
    });
  }
}
```

## 3. Custom Event Handling (Advanced)

**Use `initializeComponentHover()` for state management with custom events:**

```typescript
export class CustomComponent implements OnInit, OnDestroy {
  private hoverSubscription?: Subscription;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private hoverManager: HoverManager
  ) {}

  ngOnInit() {
    // Initialize state management only
    this.hoverSubscription = this.hoverManager.initializeComponentHover(
      this.elementRef.nativeElement,
      this.isPreviewHover,
      this.componentType,
      this.componentId,
      this.containerType
    );

    // Custom event handling
    this.setupCustomEventListeners();
  }

  private setupCustomEventListeners() {
    const element = this.elementRef.nativeElement;
    
    element.addEventListener('mouseenter', (event) => {
      if (this.shouldAllowHover()) {
        this.hoverManager.setComponentHoverState(this.componentId, true, event);
        this.addCustomEffects();
      }
    });

    element.addEventListener('mouseleave', () => {
      this.hoverManager.setComponentHoverState(this.componentId, false);
      this.removeCustomEffects();
    });
  }

  ngOnDestroy() {
    this.hoverSubscription?.unsubscribe();
    this.hoverManager.destroyComponentHover(this.componentId);
  }
}
```

## 4. Hybrid Approach (State + Manual)

**Automatic hover with additional manual triggers:**

```typescript
export class HybridComponent implements OnInit, OnDestroy {
  private hoverSubscription?: Subscription;

  ngOnInit() {
    // Standard automatic hover setup
    this.hoverSubscription = this.hoverManager.setupComponentHover(
      this.elementRef.nativeElement,
      this.isPreviewHover,
      this.componentType,
      this.componentId,
      this.previewMode
    );
  }

  // Additional manual triggers for special cases
  onKeyboardNavigation() {
    this.hoverManager.setComponentHoverState(this.componentId, true);
  }

  onExternalTrigger() {
    this.hoverManager.setComponentHoverState(this.componentId, true);
  }

  ngOnDestroy() {
    this.hoverSubscription?.unsubscribe();
    this.hoverManager.destroyComponentHover(this.componentId);
  }
}
```

## 5. Direct UI Control (Expert Level)

**Bypass hover system for complete custom control:**

```typescript
export class ExpertComponent {
  constructor(
    private hoverUIManager: HoverUIManager,
    private store: Store<AppState>
  ) {}

  customHoverEffect() {
    const element = this.elementRef.nativeElement;
    const page = this.getCurrentPage();

    // Direct UI manipulation
    this.hoverUIManager.addPreviewComponentHover(element, page, {
      addOutline: true,
      addSecondaryHover: false
    });

    // Custom visual effects
    element.style.transform = 'scale(1.02)';
    element.style.transition = 'transform 0.2s ease';
    
    // Manual related element control
    this.hoverUIManager.toggleFloatingLabels(element, true, false);
  }

  removeCustomHover() {
    const element = this.elementRef.nativeElement;
    const page = this.getCurrentPage();
    
    this.hoverUIManager.removeComponentHover(element, page, true);
    element.style.transform = '';
  }
}
```

## Quick Decision Guide

| Use Case | Method | Setup Required |
|----------|--------|----------------|
| **Standard component hover** | `setupComponentHover()` | ✅ Once |
| **Manual triggering only** | `setComponentHoverState()` | ❌ None |
| **Custom event handling** | `initializeComponentHover()` | ✅ State only |
| **Mixed auto + manual** | `setupComponentHover()` + `setComponentHoverState()` | ✅ Auto setup |
| **Complete custom control** | `HoverUIManager` directly | ❌ None |

## Error Handling Best Practices

```typescript
// Always check if component is hover-enabled for manual triggering
safeManualHover(componentId: string, isHovered: boolean) {
  if (this.hoverManager.hasHoverFunctionality(componentId)) {
    this.hoverManager.setComponentHoverState(componentId, isHovered);
  } else {
    console.warn(`Component ${componentId} not set up for hover`);
  }
}

// Clean up properly
ngOnDestroy() {
  // Clear any manual hovers
  this.componentIds.forEach(id => {
    this.hoverManager.setComponentHoverState(id, false);
  });
  
  // Unsubscribe from automatic hover
  this.hoverSubscription?.unsubscribe();
  
  // Remove hover observables
  this.hoverManager.destroyComponentHover(this.componentId);
}
```