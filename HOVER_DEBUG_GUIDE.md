# Hover System Debug Guide

## Common Issues & Solutions

### Issue: Inner components not getting hover styles

This typically happens when the hover flow is interrupted. Here's how to debug:

#### 1. Check Console for Errors
```typescript
// Add logging to HoverEventHandler.handleComponentHover
private handleComponentHover(fragment: HTMLElement, componentType: PageComponentNames, isPreviewHover: boolean, hoverState: HoverState, containerType?: PageGridComponentNames): void {
  console.log('🎯 Hover triggered:', {
    componentId: hoverState.componentId,
    isPreviewHover,
    componentType,
    hasEvent: !!hoverState.event,
    fragmentId: fragment.id
  });
  
  // ... rest of method
}
```

#### 2. Verify Hover Setup
```typescript
// In your component's ngOnInit, add logging
ngOnInit() {
  console.log('🔧 Setting up hover for:', this.componentId);
  
  this.hoverSubscription = this.hoverManager.setupComponentHover(
    this.elementRef.nativeElement,
    this.isPreviewHover,
    this.componentType,
    this.componentId,
    this.previewMode
  );
  
  console.log('✅ Hover setup complete for:', this.componentId);
}
```

#### 3. Check DOM Structure
Ensure your component DOM has the correct structure:
```html
<!-- Component element with ID -->
<div id="component-123" comptype="media">
  <!-- Hover overlay -->
  <div id="hover-overlay_component-123" class="hover-overlay">
    <!-- ... -->
  </div>
  
  <!-- Component label for floating labels -->
  <div id="component-label_component-123">
    <div class="floating-label">Label text</div>
  </div>
  
  <!-- Component content -->
  <div class="component-content">
    <!-- ... -->
  </div>
</div>
```

#### 4. Manual Testing
```typescript
// Test manual hover triggering in browser console
const hoverManager = angular.element(document.body).injector().get('HoverManager');

// Trigger hover
hoverManager.setComponentHoverState('your-component-id', true);

// Remove hover
hoverManager.setComponentHoverState('your-component-id', false);
```

#### 5. Check Event Flow
Add this to your component to trace events:
```typescript
ngOnInit() {
  const element = this.elementRef.nativeElement;
  
  element.addEventListener('mouseenter', (e) => {
    console.log('🐭 Mouse enter:', this.componentId, e);
  });
  
  element.addEventListener('mouseleave', (e) => {
    console.log('🐭 Mouse leave:', this.componentId, e);
  });
}
```

## Quick Fixes

### Fix 1: Ensure Component IDs are Correct
```typescript
// Make sure your component element has the correct ID
const element = this.elementRef.nativeElement;
if (element.id !== this.componentId) {
  console.error('❌ Element ID mismatch:', element.id, 'vs', this.componentId);
  element.id = this.componentId; // Fix it
}
```

### Fix 2: Check Hover Overlay Exists
```typescript
// Add this to verify hover overlay exists
ngAfterViewInit() {
  const hoverOverlay = document.getElementById(`hover-overlay_${this.componentId}`);
  if (!hoverOverlay) {
    console.warn('⚠️ No hover overlay found for:', this.componentId);
  }
}
```

### Fix 3: Verify Page Data is Available
```typescript
// In HoverUIManager methods, add checks
public addPreviewComponentHover(componentElement: HTMLElement, page: Page, options = {}): void {
  if (!page || !page.components) {
    console.error('❌ No page data available for hover');
    return;
  }
  
  const component = page.components.data[componentElement.id];
  if (!component) {
    console.warn('⚠️ Component not found in page data:', componentElement.id);
  }
  
  // ... rest of method
}
```

## Testing Scenarios

### Test 1: Basic Hover
```typescript
// Should work: hover over any component
// Expected: 
// - Hover overlay gets 'hovered' and 'outlined' classes
// - Floating label becomes visible
// - Background image changes (if configured)
```

### Test 2: Nested Component Hover
```typescript
// Should work: hover over inner component (e.g., media inside column)
// Expected:
// - Only the inner component gets primary hover
// - Parent components get secondary hover styles
// - Floating label only shows on primary hover
```

### Test 3: Manual Triggering
```typescript
// Test breadcrumb hover
breadcrumbElement.addEventListener('mouseenter', () => {
  this.hoverManager.setComponentHoverState('target-component-id', true);
});
```

## Performance Debugging

### Check Hover Performance
```typescript
// Add to HoverUIManager.toggleFloatingLabels
public toggleFloatingLabels(componentElement: HTMLElement, isHovered: boolean, isSecondaryHover = false): void {
  const start = performance.now();
  
  // ... method logic ...
  
  const end = performance.now();
  if (end - start > 5) {
    console.warn('🐌 Slow hover operation:', end - start, 'ms for', componentElement.id);
  }
}
```

### Monitor Event Frequency
```typescript
// Add to HoverEventHandler.handleMouseEnter
private mouseEnterCount = 0;

private handleMouseEnter(event: MouseEvent, componentId: string): void {
  this.mouseEnterCount++;
  console.log('🐭 Mouse enter #', this.mouseEnterCount, 'for', componentId);
  
  // ... method logic ...
}
```

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Component not found in page data" | Component ID mismatch | Check `componentElement.id` matches `componentId` |
| "No hover overlay found" | Missing DOM structure | Ensure hover overlay div exists |
| "Cannot read property of undefined" | Page data not loaded | Wait for page data before setting up hover |
| "Multiple hover states conflicting" | Event handling conflicts | Check for duplicate event listeners |

## Browser DevTools Tips

### Inspect Hover State
1. Right-click component → Inspect
2. Look for `.hover-overlay.hovered.outlined` 
3. Check if floating label has `visibility: visible`

### Debug CSS
```css
/* Temporarily make hover overlay visible */
.hover-overlay {
  background: rgba(255, 0, 0, 0.2) !important;
  border: 2px solid red !important;
}

/* Debug floating labels */
.floating-label {
  background: yellow !important;
  color: black !important;
}
```

### Network Tab
Check if required assets (hover images) are loading correctly.

## Rollback Plan

If hover issues persist, you can temporarily revert to basic CSS hover:

```css
/* Emergency fallback */
[comptype]:hover > .hover-overlay {
  opacity: 1 !important;
  visibility: visible !important;
}

[comptype]:hover .floating-label {
  visibility: visible !important;
  opacity: 1 !important;
}
```