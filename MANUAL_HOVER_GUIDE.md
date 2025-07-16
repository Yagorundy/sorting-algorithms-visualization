# Manual Hover Triggering Guide

## Overview

The new hover system makes manual hover triggering much simpler and more reliable. Perfect for breadcrumbs, tooltips, external controls, and custom interactions.

## Quick Reference

### Basic Manual Triggering
```typescript
// Hover on
this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);

// Hover off  
this.hoverManager.setComponentHoverState(componentId, false);
```

### Migration from Old System

**Before (HoverHelper):**
```typescript
this.hoverHelper?.onHover(componentElem as HTMLElement, true, componentId, mouseEvent);
this.hoverHelper?.onUnHover(componentElem as HTMLElement, true);
```

**After (HoverManager):**
```typescript
this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);
this.hoverManager.setComponentHoverState(componentId, false);
```

## Common Use Cases

### 1. Breadcrumb Navigation
```typescript
// When hovering over breadcrumb items to highlight the actual component
listenForHoverOnBreadcrumbItem(componentId: string, breadcrumbElement: HTMLElement) {
  breadcrumbElement.addEventListener('mouseenter', (event) => {
    this.hoverManager.setComponentHoverState(componentId, true, event);
  });
  
  breadcrumbElement.addEventListener('mouseleave', () => {
    this.hoverManager.setComponentHoverState(componentId, false);
  });
}
```

### 2. External Component Lists
```typescript
// Component tree, layer panel, etc.
onComponentListItemHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
  // Check if component is hover-enabled first
  if (this.hoverManager.hasHoverFunctionality(componentId)) {
    this.hoverManager.setComponentHoverState(componentId, isHovered, event);
  }
}
```

### 3. Keyboard Navigation
```typescript
// Arrow key navigation highlighting components
onKeyboardNavigation(componentId: string, direction: 'up' | 'down') {
  // Clear previous hover
  this.hoverManager.clearAllHoverStates();
  
  // Hover new component
  this.hoverManager.setComponentHoverState(componentId, true);
}
```

### 4. Bulk Operations
```typescript
// Hover multiple related components
hoverComponentGroup(componentIds: string[], isHovered: boolean) {
  componentIds.forEach(id => {
    this.hoverManager.setComponentHoverState(id, isHovered);
  });
}

// Example: Hover all breadcrumb ancestors
hoverBreadcrumbPath(breadcrumbItems: PageComponent[]) {
  breadcrumbItems.forEach(item => {
    this.hoverManager.setComponentHoverState(item.uniqueId, true);
  });
}
```

### 5. Conditional Hover Logic
```typescript
// Smart hover with conditions
smartHover(componentId: string, event: MouseEvent) {
  // Only hover if conditions are met
  if (this.shouldAllowHover(componentId)) {
    this.hoverManager.setComponentHoverState(componentId, true, event);
    
    // Add custom visual effects
    this.addCustomEffects(componentId);
  }
}

private shouldAllowHover(componentId: string): boolean {
  return this.hoverManager.hasHoverFunctionality(componentId) &&
         !this.isComponentLocked(componentId) &&
         !this.isInEditMode();
}
```

## Advanced Manual Control

### Direct UI Manipulation
```typescript
// Inject HoverUIManager for granular control
constructor(
  private hoverManager: HoverManager,
  private hoverUIManager: HoverUIManager
) {}

// Custom hover behavior bypassing state management
customHoverEffect(element: HTMLElement, page: Page) {
  this.hoverUIManager.addPreviewComponentHover(element, page, {
    addOutline: true,
    addSecondaryHover: false
  });
  
  // Add custom styling
  element.style.transform = 'scale(1.02)';
  element.style.transition = 'transform 0.2s ease';
}
```

### Custom Hover States
```typescript
// Create custom hover behavior for special cases
createCustomHoverBehavior(componentId: string, element: HTMLElement) {
  // Method 1: Use HoverManager for standard behavior + custom additions
  this.hoverManager.setComponentHoverState(componentId, true);
  element.classList.add('custom-hover-effect');
  
  // Method 2: Full custom control
  this.hoverUIManager.addPreviewComponentHover(element, this.page, {
    addOutline: false,
    addSecondaryHover: true
  });
  this.addCustomAnimations(element);
}
```

## Error Handling

### Safe Manual Triggering
```typescript
// Always check if component exists and is hover-enabled
safeHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
  try {
    if (!this.hoverManager.hasHoverFunctionality(componentId)) {
      console.warn(`Component ${componentId} not hover-enabled`);
      return;
    }
    
    this.hoverManager.setComponentHoverState(componentId, isHovered, event);
  } catch (error) {
    console.error('Hover operation failed:', error);
  }
}
```

### Cleanup Manual Hovers
```typescript
// Clean up manual hovers when component unmounts
ngOnDestroy() {
  // Remove any manually triggered hovers
  this.myComponentIds.forEach(id => {
    this.hoverManager.setComponentHoverState(id, false);
  });
  
  // Standard cleanup
  this.hoverSubscription?.unsubscribe();
}
```

## Performance Tips

### 1. Debounce Rapid Hover Changes
```typescript
private hoverDebounceTimeout: any;

debouncedHover(componentId: string, isHovered: boolean) {
  clearTimeout(this.hoverDebounceTimeout);
  this.hoverDebounceTimeout = setTimeout(() => {
    this.hoverManager.setComponentHoverState(componentId, isHovered);
  }, 50); // 50ms debounce
}
```

### 2. Batch Multiple Updates
```typescript
// Better performance for multiple simultaneous changes
batchHoverUpdates(updates: Array<{id: string, hovered: boolean}>) {
  // Clear all first
  this.hoverManager.clearAllHoverStates();
  
  // Apply new states
  updates.forEach(update => {
    this.hoverManager.setComponentHoverState(update.id, update.hovered);
  });
}
```

## Integration Examples

### With Angular Template
```html
<!-- Breadcrumb item -->
<div 
  *ngFor="let item of breadcrumbItems"
  (mouseenter)="onBreadcrumbHover(item.id, true, $event)"
  (mouseleave)="onBreadcrumbHover(item.id, false)"
  class="breadcrumb-item">
  {{ item.name }}
</div>
```

```typescript
onBreadcrumbHover(componentId: string, isHovered: boolean, event?: MouseEvent) {
  this.hoverManager.setComponentHoverState(componentId, isHovered, event);
}
```

### With RxJS
```typescript
// Stream-based hover control
breadcrumbHover$ = new Subject<{id: string, hovered: boolean, event?: MouseEvent}>();

ngOnInit() {
  this.breadcrumbHover$.pipe(
    debounceTime(50),
    distinctUntilChanged((a, b) => a.id === b.id && a.hovered === b.hovered)
  ).subscribe(({id, hovered, event}) => {
    this.hoverManager.setComponentHoverState(id, hovered, event);
  });
}

// Usage
onBreadcrumbItemHover(id: string, hovered: boolean, event?: MouseEvent) {
  this.breadcrumbHover$.next({id, hovered, event});
}
```

## Benefits of New Manual Triggering

✅ **Simpler API** - Single method for all manual hover needs  
✅ **Better Performance** - No need to find DOM elements manually  
✅ **Automatic Sync** - Preview and editor automatically synchronized  
✅ **Error Safety** - Built-in checks for component existence  
✅ **Event Context** - Can pass mouse events for advanced behavior  
✅ **Bulk Operations** - Easy to hover multiple components  
✅ **State Tracking** - Can check if component is hover-enabled  