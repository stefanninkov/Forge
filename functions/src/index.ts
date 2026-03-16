import * as admin from 'firebase-admin';

admin.initializeApp();

// Re-export all cloud functions
export { analyzeFigma, suggestClassNames } from './figma';
export { runSpeedAudit, runSeoAudit, runAeoAudit, getAiRecommendations } from './audits';
export { aiCodeReview } from './ai';
export { analyzeSemanticHtml } from './semantic';
export { captureUrl } from './capture';
export { seedSystemData } from './seed';
