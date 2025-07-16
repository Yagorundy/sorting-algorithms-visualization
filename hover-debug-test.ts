// Simple debug test for hover functionality
// Add this to browser console or component to test basic hover

export function debugHoverSystem() {
  console.log('🔍 Starting hover system debug...');
  
  // Test 1: Check if hover manager is available
  try {
    const hoverManager = (window as any).hoverManager; // Adjust based on how you expose it
    console.log('✅ HoverManager found:', !!hoverManager);
  } catch (e) {
    console.error('❌ HoverManager not found:', e);
  }

  // Test 2: Find all components with hover setup
  const componentsWithHover = document.querySelectorAll('[comptype]');
  console.log('📊 Components found:', componentsWithHover.length);
  
  componentsWithHover.forEach((component, index) => {
    const id = component.id;
    const comptype = component.getAttribute('comptype');
    const hoverOverlay = document.getElementById(`hover-overlay_${id}`);
    const floatingLabel = document.getElementById(`component-label_${id}`);
    
    console.log(`Component ${index + 1}:`, {
      id,
      comptype,
      hasHoverOverlay: !!hoverOverlay,
      hasFloatingLabel: !!floatingLabel,
      element: component
    });
  });

  // Test 3: Manual hover test
  const firstComponent = componentsWithHover[0] as HTMLElement;
  if (firstComponent) {
    console.log('🧪 Testing manual hover on first component:', firstComponent.id);
    
    // Simulate hover
    const hoverOverlay = document.getElementById(`hover-overlay_${firstComponent.id}`);
    if (hoverOverlay) {
      console.log('Adding hover classes...');
      hoverOverlay.classList.add('hovered', 'outlined');
      
      setTimeout(() => {
        console.log('Removing hover classes...');
        hoverOverlay.classList.remove('hovered', 'outlined');
      }, 2000);
    } else {
      console.warn('No hover overlay found for:', firstComponent.id);
    }

    // Test floating label
    const floatingLabel = document.getElementById(`component-label_${firstComponent.id}`);
    if (floatingLabel) {
      console.log('Testing floating label...');
      floatingLabel.style.visibility = 'visible';
      floatingLabel.style.opacity = '1';
      
      setTimeout(() => {
        floatingLabel.style.visibility = 'hidden';
        floatingLabel.style.opacity = '0';
      }, 2000);
    } else {
      console.warn('No floating label found for:', firstComponent.id);
    }
  }

  // Test 4: Check for event listeners
  const elementsWithMouseEvents = Array.from(componentsWithHover).filter(el => {
    // This is a rough check - actual event listeners are harder to detect
    return el.hasAttribute('ng-hover') || el.onclick || el.onmouseenter;
  });
  
  console.log('🐭 Elements with mouse events:', elementsWithMouseEvents.length);

  console.log('🔍 Debug complete. Check console output above.');
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  (window as any).debugHoverSystem = debugHoverSystem;
  console.log('💡 Run debugHoverSystem() in console to test hover functionality');
}

// Quick CSS test - add temporary visible hover overlay
export function showAllHoverOverlays() {
  const style = document.createElement('style');
  style.textContent = `
    .hover-overlay {
      background: rgba(255, 0, 0, 0.2) !important;
      border: 2px solid red !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: none !important;
    }
    
    .floating-label {
      background: yellow !important;
      color: black !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
  console.log('🎨 Added debug CSS - all hover overlays and labels should now be visible');
  
  // Remove after 5 seconds
  setTimeout(() => {
    document.head.removeChild(style);
    console.log('🎨 Removed debug CSS');
  }, 5000);
}

// Check hover state
export function checkHoverState(componentId: string) {
  const component = document.getElementById(componentId);
  const hoverOverlay = document.getElementById(`hover-overlay_${componentId}`);
  const floatingLabel = document.getElementById(`component-label_${componentId}`);
  
  console.log(`Hover state for ${componentId}:`, {
    componentExists: !!component,
    hoverOverlay: {
      exists: !!hoverOverlay,
      classes: hoverOverlay?.className || 'none',
      visible: hoverOverlay?.classList.contains('hovered') || false
    },
    floatingLabel: {
      exists: !!floatingLabel,
      visibility: floatingLabel?.style.visibility || 'default',
      opacity: floatingLabel?.style.opacity || 'default'
    }
  });
}

// Debug card component hover specifically
export function debugCardHover() {
  console.log('🃏 Debugging card component hover...');
  
  const cardComponents = document.querySelectorAll('[comptype="card"]');
  console.log(`Found ${cardComponents.length} card components`);
  
  cardComponents.forEach((card, index) => {
    const childComponents = card.querySelectorAll('[comptype]');
    console.log(`Card ${index + 1} (${card.id}):`, {
      card: card,
      children: Array.from(childComponents).map(child => ({
        id: child.id,
        type: child.getAttribute('comptype'),
        element: child
      }))
    });
    
    // Add temporary visual indicators
    (card as HTMLElement).style.border = '2px solid blue';
    childComponents.forEach(child => {
      (child as HTMLElement).style.border = '1px solid red';
    });
  });
  
  console.log('💡 Blue border = card, Red border = children');
  console.log('💡 Check console output above for component hierarchy');
}

// Test hover event propagation
export function testHoverPropagation(componentId: string) {
  const component = document.getElementById(componentId);
  if (!component) {
    console.error('Component not found:', componentId);
    return;
  }
  
  console.log('🧪 Testing hover propagation for:', componentId);
  
  // Add event listeners to trace propagation
  component.addEventListener('mouseenter', (e) => {
    console.log('📥 mouseenter on:', componentId, e.target);
  }, true); // Capture phase
  
  component.addEventListener('mouseenter', (e) => {
    console.log('📤 mouseenter bubbling:', componentId, e.target);
  }, false); // Bubble phase
  
  // Check current hover state
  const isHovered = Array.from(document.querySelectorAll(':hover')).includes(component);
  console.log('Current hover state:', isHovered);
}

if (typeof window !== 'undefined') {
  (window as any).showAllHoverOverlays = showAllHoverOverlays;
  (window as any).checkHoverState = checkHoverState;
  (window as any).debugCardHover = debugCardHover;
  (window as any).testHoverPropagation = testHoverPropagation;
  
  console.log('💡 Available debug functions:');
  console.log('  - debugHoverSystem() - General hover system debug');
  console.log('  - debugCardHover() - Specific card component debug');
  console.log('  - testHoverPropagation(componentId) - Test event propagation');
  console.log('  - showAllHoverOverlays() - Visual overlay test');
  console.log('  - checkHoverState(componentId) - Check specific component state');
}