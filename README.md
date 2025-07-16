# Hover System

A modular, maintainable hover system for synchronizing hover states between the editor sidebar and preview components in the microsite builder.

## Quick Start

```typescript
import { HoverManager } from './path/to/hover-system';

constructor(private hoverManager: HoverManager) {}

ngOnInit() {
  // Complete hover setup in one call
  this.hoverSubscription = this.hoverManager.setupComponentHover(
    this.elementRef.nativeElement,
    this.isPreviewHover,
    this.componentType,
    this.componentId,
    this.previewMode
  );
}

ngOnDestroy() {
  this.hoverSubscription?.unsubscribe();
  this.hoverManager.destroyComponentHover(this.componentId);
}
```

### Alternative: Separate Calls (for special cases)

```typescript
ngOnInit() {
  // If you need separate control over initialization and event listeners
  this.hoverSubscription = this.hoverManager.initializeComponentHover(
    this.elementRef.nativeElement,
    this.isPreviewHover,
    this.componentType,
    this.componentId
  );
  
  this.hoverManager.setupEventListeners(
    this.elementRef.nativeElement,
    this.previewMode,
    this.componentId,
    this.isPreviewHover
  );
}
```

## Architecture

```
HoverManager (Facade)
    ├── HoverStateManager (State & Observables)
    ├── HoverEventHandler (DOM Events & Coordination)
    ├── HoverUIManager (Visual Effects & DOM Manipulation)
    └── HoverCoordinator (Preview ↔ Editor Synchronization)
```

### Core Services

- **`HoverManager`**: Main facade - use this for most interactions
- **`HoverStateManager`**: Manages hover state observables and subscriptions
- **`HoverEventHandler`**: Handles mouse/keyboard events and hover logic
- **`HoverUIManager`**: Manages visual effects, CSS classes, and DOM manipulation
- **`HoverCoordinator`**: Synchronizes hover between preview and editor components

## Key Features

✅ **Synchronized Hover**: Hovering in editor highlights preview and vice versa  
✅ **Keyboard Support**: Shift key to hover parent components  
✅ **Secondary Hover**: Special hover states for container components  
✅ **Background Images**: Hover state background image changes  
✅ **Carousel Support**: Disabled hover for inactive carousel slides  
✅ **Detail Dialog**: Context-aware hover behavior  
✅ **Performance Optimized**: Direct DOM manipulation replaces expensive CSS `:has()` selectors  
✅ **Related Element Control**: Automatic toggling of floating labels, buttons, handles  
✅ **Simple API**: Single method for complete hover setup, separate methods for advanced control  

## Files

- `hover-manager.ts` - Main facade API
- `hover-state-manager.ts` - State management
- `hover-event-handler.ts` - Event handling
- `hover-ui-manager.ts` - DOM manipulation
- `hover-coordinator.ts` - Preview/editor synchronization
- `index.ts` - Exports
- `HOVER_REFACTOR_GUIDE.md` - Migration guide
- `PERFORMANCE_GUIDE.md` - Performance optimization guide
- `MANUAL_HOVER_GUIDE.md` - Manual hover triggering guide
- `USAGE_PATTERNS.md` - Quick reference for different usage patterns

## Performance Benefits

Replace expensive CSS selectors with direct DOM manipulation:

```css
/* Old (causes reflow) */
[comptype]:has(> .hover-overlay.hovered:not(.hovered-secondary)):not(.selected)>component-label div.floating-label {
  visibility: visible;
}
```

```typescript
// New (no reflow, ~20x faster with direct ID lookup)
// Automatic via HoverUIManager.toggleFloatingLabels()
const floatingLabel = document.getElementById(`component-label_${componentId}`);
floatingLabel.style.visibility = shouldShow ? 'visible' : 'hidden';
```

## Manual Hover Triggering

Perfect for breadcrumbs, external controls, or custom interactions:

```typescript
// Simple manual triggering
this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);
this.hoverManager.setComponentHoverState(componentId, false);

// Breadcrumb example
breadcrumbElement.addEventListener('mouseenter', (event) => {
  this.hoverManager.setComponentHoverState(componentId, true, event);
});

// Bulk operations
this.breadcrumbItems.forEach(item => {
  this.hoverManager.setComponentHoverState(item.id, isHovered);
});

// Safety checks
if (this.hoverManager.hasHoverFunctionality(componentId)) {
  this.hoverManager.setComponentHoverState(componentId, true);
}
```

## Adding Custom Related Elements

```typescript
// In your HoverUIManager, add:
public toggleMyCustomElements(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover: boolean = false): void {
  const elements = componentElement.querySelectorAll('.my-custom-selector');
  elements.forEach(el => {
    el.style.visibility = isHovered ? 'visible' : 'hidden';
  });
}

// Then add to toggleRelatedElements():
public toggleRelatedElements(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover: boolean = false): void {
  this.toggleFloatingLabels(componentElement, isHovered, isSecondaryHover);
  this.toggleComponentButtons(componentElement, isHovered, isSecondaryHover);
  this.toggleResizeHandles(componentElement, isHovered, isSecondaryHover);
  this.toggleMyCustomElements(componentElement, isHovered, isSecondaryHover); // Add this
}
```

## Usage Patterns

See `USAGE_PATTERNS.md` for complete examples of different usage scenarios.

## Migration

See `HOVER_REFACTOR_GUIDE.md` for detailed migration instructions from the old `HoverHelper`/`HoverService` system.
