// Smart facade - RECOMMENDED for new implementations
export { SmartHoverManager } from './smart-hover-manager';

// Alternative facades
export { HoverManager } from './hover-manager'; // Modular system
export { HoverSystem } from './hover-system'; // Legacy unified system

// Core system components (for advanced use cases)
export { GlobalHoverManager } from './global-hover-manager';
export { HoverStateManager, HoverState } from './hover-state-manager';
export { HoverEventHandler } from './hover-event-handler';
export { HoverUIManager } from './hover-ui-manager';
export { HoverCoordinator, ComponentPair } from './hover-coordinator';

// Re-export commonly used types for convenience
export { PageComponentNames } from "@common/data/page/PageComponentNames";
export { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
export { PreviewModes } from "@common/data/report/enums/PreviewModes";