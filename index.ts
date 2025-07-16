// Main facade - use this for most component interactions
export { HoverManager } from './hover-manager';

// Core system components
export { HoverStateManager, HoverState } from './hover-state-manager';
export { HoverEventHandler } from './hover-event-handler';
export { HoverUIManager } from './hover-ui-manager';
export { HoverCoordinator, ComponentPair } from './hover-coordinator';

// Re-export commonly used types for convenience
export { PageComponentNames } from "@common/data/page/PageComponentNames";
export { PageGridComponentNames } from "@common/data/page/PageGridComponentNames";
export { PreviewModes } from "@common/data/report/enums/PreviewModes";