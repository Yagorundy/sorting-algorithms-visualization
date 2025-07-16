# Hover System Refactor Guide

## Overview

The hover system has been refactored from 2 tightly coupled classes (`HoverHelper` and `HoverService`) into a more maintainable, modular architecture with clear separation of concerns.

## New Architecture

### 1. **HoverManager** (Main Facade)
- **Purpose**: Provides a simple, clean API for components to use
- **Use this for**: All component interactions with the hover system
- **Replaces**: `HoverHelper` class

### 2. **HoverStateManager** 
- **Purpose**: Manages observables and global hover state
- **Responsibilities**: 
  - Creating/destroying hover observables
  - Broadcasting hover state changes
  - Managing component subscriptions

### 3. **HoverEventHandler**
- **Purpose**: Handles DOM events and coordinates hover behavior
- **Responsibilities**:
  - Mouse enter/leave events
  - Keyboard interactions (Shift key behavior)
  - Component hover/unhover logic

### 4. **HoverUIManager**
- **Purpose**: Manages all DOM manipulation and visual effects
- **Responsibilities**:
  - Adding/removing CSS classes
  - Background image changes
  - Z-index management
  - Hover overlay management

### 5. **HoverCoordinator**
- **Purpose**: Coordinates hover synchronization between preview and editor
- **Responsibilities**:
  - Finding component pairs (preview ↔ editor)
  - Synchronizing hover states
  - Managing parent/child relationships

## Migration from Old System

### Old Usage (HoverHelper)
```typescript
// Old way
constructor(private hoverService: HoverService) {
  this.hoverHelper = new HoverHelper(hoverService);
}

ngOnInit() {
  this.hoverHelper.initHoverHelper(
    this.elementRef.nativeElement,
    this.isPreviewHover,
    this.componentType,
    this.componentId,
    this.containerType
  );
  
  this.hoverHelper.listenForHoverRelatedEvents(
    this.elementRef.nativeElement,
    this.previewMode,
    this.componentId,
    this.isPreviewHover
  );
}

// Manual hover triggering (old way)
breadcrumbElement.addEventListener('mouseenter', (mouseEvent) => {
  this.hoverHelper?.onHover(componentElem as HTMLElement, true, componentId, mouseEvent);
});
breadcrumbElement.addEventListener('mouseleave', () => {
  this.hoverHelper?.onUnHover(componentElem as HTMLElement, true);
});

ngOnDestroy() {
  this.hoverHelper.destroy(this.componentId);
}
```

### New Usage (HoverManager)
```typescript
// New way
constructor(private hoverManager: HoverManager) {}

ngOnInit() {
  // Initialize hover functionality and store subscription
  this.hoverSubscription = this.hoverManager.initializeComponentHover(
    this.elementRef.nativeElement,
    this.isPreviewHover,
    this.componentType,
    this.componentId,
    this.containerType
  );
  
  // Setup event listeners
  this.hoverManager.setupEventListeners(
    this.elementRef.nativeElement,
    this.previewMode,
    this.componentId,
    this.isPreviewHover
  );
}

// Manual hover triggering (new way)
breadcrumbElement.addEventListener('mouseenter', (mouseEvent) => {
  this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);
});
breadcrumbElement.addEventListener('mouseleave', () => {
  this.hoverManager.setComponentHoverState(componentId, false);
});

ngOnDestroy() {
  // Clean up subscription
  this.hoverSubscription?.unsubscribe();
  this.hoverManager.destroyComponentHover(this.componentId);
}
```

## Manual Hover Triggering

### Simple Manual Triggering
```typescript
// Trigger hover on
this.hoverManager.setComponentHoverState(componentId, true, mouseEvent);

// Trigger hover off
this.hoverManager.setComponentHoverState(componentId, false);
```

### Advanced Manual Control
```typescript
// Check if component has hover functionality before triggering
if (this.hoverManager.hasHoverFunctionality(componentId)) {
  this.hoverManager.setComponentHoverState(componentId, true, event);
} else {
  console.warn('Component not initialized for hover');
}

// Bulk operations
this.breadcrumbItems.forEach(item => {
  this.hoverManager.setComponentHoverState(item.id, isHovered);
});

// Clear all hover states
this.hoverManager.clearAllHoverStates();
```

### Direct UI Control (Advanced)
```typescript
// For granular control, inject HoverUIManager
constructor(
  private hoverManager: HoverManager,
  private hoverUIManager: HoverUIManager // Optional for advanced cases
) {}

// Direct UI manipulation
this.hoverUIManager.addPreviewComponentHover(element, page, {
  addOutline: true,
  addSecondaryHover: false
});

this.hoverUIManager.removeComponentHover(element, page, true);
```

## Key Benefits

### 1. **Clear Separation of Concerns**
- Each service has a single, well-defined responsibility
- Easier to understand what each part does
- Better testability

### 2. **Reduced Complexity**
- Complex logic is broken down into smaller, manageable pieces
- No more massive methods with multiple responsibilities
- Clearer data flow

### 3. **Better Maintainability**
- Changes to UI behavior only affect `HoverUIManager`
- Event handling logic is isolated in `HoverEventHandler`
- State management is centralized in `HoverStateManager`

### 4. **Improved Type Safety**
- Better interfaces and type definitions
- More explicit method signatures
- Reduced any types

### 5. **Enhanced Reusability**
- Individual services can be used independently if needed
- Easier to extend with new functionality
- Better dependency injection

## API Reference

### HoverManager Methods

```typescript
// Initialize hover for a component
initializeComponentHover(
  fragment: HTMLElement,
  isPreviewHover: boolean,
  componentType: PageComponentNames,
  componentId: string,
  containerType?: PageGridComponentNames
): Subscription

// Setup DOM event listeners
setupEventListeners(
  fragment: HTMLElement,
  previewMode: PreviewModes,
  componentId: string,
  isPreviewHover: boolean
): void

// Manually trigger hover state
setComponentHoverState(
  componentId: string, 
  isHovered: boolean, 
  event?: MouseEvent
): void

// Clean up component hover
destroyComponentHover(componentId: string): void

// Check if component has hover functionality
hasHoverFunctionality(componentId: string): boolean

// Clear all hover states
clearAllHoverStates(): void
```

## Advanced Usage

### Direct Service Access
If you need more granular control, you can inject individual services:

```typescript
constructor(
  private hoverStateManager: HoverStateManager,
  private hoverUIManager: HoverUIManager,
  private hoverCoordinator: HoverCoordinator,
  private hoverEventHandler: HoverEventHandler
) {}
```

### Custom Hover Behavior
```typescript
// Subscribe to hover state changes directly
this.hoverStateManager.getHoverObservable(componentId).subscribe(state => {
  // Custom logic here
});

// Manually control UI
this.hoverUIManager.addPreviewComponentHover(element, page, {
  addOutline: true,
  addSecondaryHover: false
});
```

## Testing

The new architecture is much easier to test:

```typescript
// Mock individual services for unit testing
const mockHoverStateManager = jasmine.createSpyObj('HoverStateManager', ['setHoverState']);
const mockHoverUIManager = jasmine.createSpyObj('HoverUIManager', ['addPreviewComponentHover']);

// Test specific functionality in isolation
```

## Performance Considerations

- The new system maintains the same performance characteristics as the old system
- Better memory management with proper subscription cleanup
- More efficient DOM operations through the centralized UI manager

## Breaking Changes

- `HoverHelper` class is replaced by `HoverManager`
- Method signatures have changed (see migration examples above)
- Some internal logic has been reorganized, but functionality remains the same