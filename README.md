# Hover System

A modular, maintainable hover system for synchronizing hover states between the editor sidebar and preview components in the microsite builder.

## Quick Start

```typescript
import { HoverManager } from './path/to/hover-system';

constructor(private hoverManager: HoverManager) {}

ngOnInit() {
  // Initialize hover functionality
  this.hoverSubscription = this.hoverManager.initializeComponentHover(
    this.elementRef.nativeElement,
    this.isPreviewHover,
    this.componentType,
    this.componentId
  );
  
  // Setup event listeners
  this.hoverManager.setupEventListeners(
    this.elementRef.nativeElement,
    this.previewMode,
    this.componentId,
    this.isPreviewHover
  );
}

ngOnDestroy() {
  this.hoverSubscription?.unsubscribe();
  this.hoverManager.destroyComponentHover(this.componentId);
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

## Files

- `hover-manager.ts` - Main facade API
- `hover-state-manager.ts` - State management
- `hover-event-handler.ts` - Event handling
- `hover-ui-manager.ts` - DOM manipulation
- `hover-coordinator.ts` - Preview/editor synchronization
- `index.ts` - Exports
- `HOVER_REFACTOR_GUIDE.md` - Migration guide

## Migration

See `HOVER_REFACTOR_GUIDE.md` for detailed migration instructions from the old `HoverHelper`/`HoverService` system.
