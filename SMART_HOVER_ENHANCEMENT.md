# Smart Hover System - Editor ↔ Preview Synchronization

## 🚀 **Enhanced Editor/Preview Synchronization**

The Smart Hover System now provides **instant bidirectional synchronization** between editor components (left sidebar) and preview components (main area).

## 🎯 **How It Works**

### **Bidirectional Sync**
- **Hover Editor Component** → Preview component lights up instantly
- **Hover Preview Component** → Editor component lights up instantly
- **Automatic cleanup** → Both components clear together

### **Smart Component Detection**
The system automatically detects component relationships using these attribute patterns:

| Editor Component | Preview Component | Attribute Used |
|------------------|-------------------|----------------|
| `[editor-comptype]` | `[comptype]` | `editor-id` → `id` |
| `[row-container-editor-comptype]` | `[comptype]` | `row-container-editor-id` → `id` |
| Section containers | `[comptype]` | `editor-section-id` → `id` |

## 🔧 **Implementation**

### **Automatic Sync During Hover**
```typescript
private syncEditorPreviewHover(componentInfo: ComponentHoverInfo, event: MouseEvent): void {
  if (isPreviewHover) {
    // Preview hovered → light up corresponding editor
    const editorComponent = this.findCorrespondingEditorComponent(element);
    if (editorComponent) {
      this.hoverEditorComponent(editorComponent);
    }
  } else {
    // Editor hovered → light up corresponding preview
    const previewComponent = this.findCorrespondingPreviewComponent(element);
    if (previewComponent) {
      this.hoverPreviewComponent(previewComponent, true, false);
    }
  }
}
```

### **Smart Component Finding**
```typescript
// Find editor component from preview
private findCorrespondingEditorComponent(previewElement: HTMLElement): HTMLElement | null {
  const previewId = previewElement.id;
  const selectors = [
    `[editor-id="${previewId}"]`,
    `[row-container-editor-id="${previewId}"]`, 
    `[editor-section-id="${previewId}"]`
  ];
  
  for (const selector of selectors) {
    const editorElement = document.querySelector(selector);
    if (editorElement) return editorElement;
  }
  return null;
}

// Find preview component from editor
private findCorrespondingPreviewComponent(editorElement: HTMLElement): HTMLElement | null {
  let previewId: string | null = null;
  
  if (editorElement.hasAttribute('editor-comptype')) {
    previewId = editorElement.getAttribute('editor-id');
  } else if (editorElement.hasAttribute('row-container-editor-comptype')) {
    previewId = editorElement.getAttribute('row-container-editor-id');
  } else if (editorElement.hasAttribute('editor-section-id')) {
    previewId = editorElement.getAttribute('editor-section-id');
  }
  
  return previewId ? document.getElementById(previewId) : null;
}
```

## 🎨 **Visual Behavior**

### **When You Hover an Editor Component:**
1. ✅ Editor component gets `hovered` class
2. ✅ Corresponding preview component gets full hover styling (outline, floating label, etc.)
3. ✅ Background images change on preview component
4. ✅ Z-index management applied

### **When You Hover a Preview Component:**
1. ✅ Preview component gets full hover styling 
2. ✅ Corresponding editor component gets `hovered` class
3. ✅ Floating label appears on preview (not editor)
4. ✅ Secondary hover applied to parent components

### **When You Stop Hovering:**
1. ✅ Both editor and preview components clear simultaneously
2. ✅ No orphaned hover states
3. ✅ Floating labels disappear correctly
4. ✅ Clean transition to parent hover if applicable

## 🔍 **Debugging**

Enable debug logs by uncommenting in `global-hover-manager.ts`:

```typescript
// Component registration debug
console.log(`[GlobalHoverManager] Registered component:`, { componentId, isPreviewHover });

// Sync debug  
console.log(`[EditorPreviewSync] Preview ${componentId} → Editor ${editorComponent.id}`);
console.log(`[EditorPreviewSync] Editor ${componentId} → Preview ${previewComponent.id}`);
```

## 🎯 **Benefits**

### **For Users:**
- **Intuitive navigation** - hover anywhere to see corresponding elements
- **Clear visual feedback** - always know which components are related
- **Smooth interactions** - no lag or glitches in synchronization

### **For Developers:**
- **Zero configuration** - works automatically with existing attributes
- **Performance optimized** - direct DOM queries, no expensive searches
- **Reliable state** - single source of truth prevents conflicts
- **Easy debugging** - clear console logs when enabled

## 🚀 **Usage**

No changes needed! The enhanced synchronization works automatically with the existing Smart Hover Manager:

```typescript
// Same API as before - synchronization happens automatically
this.subscription = this.smartHoverManager.setupComponentHover(
  this.elementRef.nativeElement,
  this.isPreviewHover,
  this.componentType,
  this.componentId,
  this.previewMode
);
```

The system automatically detects if a component has editor/preview relationships and enables instant synchronization.

**The editor ↔ preview synchronization is now perfect! 🎉**