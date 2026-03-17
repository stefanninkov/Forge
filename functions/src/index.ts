import * as admin from 'firebase-admin';

admin.initializeApp();

// Re-export all cloud functions
export { analyzeFigma, suggestClassNames } from './figma';
export { aiCodeReview } from './ai';
export { captureUrl } from './capture';
export { seedSystemData } from './seed';
export {
  getWebflowSites,
  getWebflowPages,
  pushFigmaToWebflow,
  pushTemplateToWebflow,
  pushMasterScript,
  pushScalingCss,
  executeSetupItem,
} from './webflow';
