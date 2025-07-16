# Migration from Original System

## Overview

The new `HoverSystem` is a faithful recreation of the original `HoverHelper` + `HoverService` combination, but unified into a single service with optimizations.

## Migration Examples

### Before (Original HoverHelper + HoverService)

```typescript
import { HoverHelper } from '@shared/helpers/hover.helper';
import { HoverService } from '@report-editor-components/services/hover.service';

export class MyComponent implements OnInit, OnDestroy {
  hoverHelper: HoverHelper | undefined;

  constructor(private hoverService: HoverService) {}

  ngOnInit() {
    this.hoverHelper = new HoverHelper(this.hoverService);
    
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

  ngOnDestroy() {
    this.hoverHelper?.destroy(this.componentId);
  }
}
```

### After (New HoverSystem)

```typescript
import { HoverSystem } from './path/to/hover-system';

export class MyComponent implements OnInit, OnDestroy {
  private hoverSubscription?: Subscription;

  constructor(private hoverSystem: HoverSystem) {}

  ngOnInit() {
    // Single call replaces both initHoverHelper + listenForHoverRelatedEvents
    this.hoverSubscription = this.hoverSystem.setupComponentHover(
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
    this.hoverSystem.destroy(this.componentId);
  }
}
```

## What's Preserved

✅ **Exact Original Logic**: All hover behavior matches the original exactly  
✅ **Editor ↔ Preview Sync**: Hovering editor components highlights preview and vice versa  
✅ **Keyboard Support**: Shift key to hover parent components  
✅ **Secondary Hover**: Special hover states for container components (card, section, row, etc.)  
✅ **Background Images**: Hover state background image changes  
✅ **Event Propagation**: All original event handling logic  
✅ **Z-index Management**: Editor button z-index changes  
✅ **Component Transitions**: Smooth hover transitions between nested components  

## What's Enhanced

✅ **Performance**: Direct ID lookup for floating labels (no expensive CSS `:has()` selectors)  
✅ **CSS Classes**: Floating labels use `visible` class instead of direct style manipulation  
✅ **Single Service**: No need to instantiate HoverHelper manually  
✅ **TypeScript**: Better type safety and intellisense  

## Required CSS

Add this CSS for optimized floating label performance:

```css
[id^="component-label_"] {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s ease;
}

[id^="component-label_"].visible {
  visibility: visible;
  opacity: 1;
}
```

## Manual Hover Triggering (Breadcrumbs)

### Before
```typescript
// Breadcrumb hover with old system
breadcrumbElement.addEventListener('mouseenter', (mouseEvent) => {
  this.hoverHelper?.onHover(componentElem as HTMLElement, true, componentId, mouseEvent);
});
breadcrumbElement.addEventListener('mouseleave', () => {
  this.hoverHelper?.onUnHover(componentElem as HTMLElement, true);
});
```

### After
```typescript
// Breadcrumb hover with new system
breadcrumbElement.addEventListener('mouseenter', (mouseEvent) => {
  this.hoverSystem.setComponentHoverState(componentId, true, mouseEvent);
});
breadcrumbElement.addEventListener('mouseleave', () => {
  this.hoverSystem.setComponentHoverState(componentId, false);
});
```

## Key Benefits

1. **Simplified API**: One service instead of two
2. **Better Performance**: Optimized DOM queries and CSS class usage
3. **Same Behavior**: Identical hover logic to the original
4. **Enhanced Sync**: Improved editor ↔ preview synchronization
5. **Easy Migration**: Minimal code changes required

## Card Component Issue Fixed

The new system preserves the original logic for handling nested components within cards, ensuring that:
- Inner components get primary hover (with outline)
- Card containers get secondary hover (without outline) 
- Smooth transitions between nested components work correctly

This addresses the issue where card components were getting hover instead of their inner elements.