import type { ComponentType } from 'react';
import { GettingStartedGuide } from './getting-started';
import { ConnectingWebflowGuide } from './connecting-webflow';
import { ConnectingFigmaGuide } from './connecting-figma';
import { FigmaTranslatorGuide } from './figma-translator';
import { AnimationsGuide } from './animations';
import { TemplatesGuide } from './templates';
import { ScalingSystemGuide } from './scaling-system';
import { AuditsGuide } from './audits';

export {
  GettingStartedGuide,
  ConnectingWebflowGuide,
  ConnectingFigmaGuide,
  FigmaTranslatorGuide,
  AnimationsGuide,
  TemplatesGuide,
  ScalingSystemGuide,
  AuditsGuide,
};

/**
 * Map from section+subsection IDs to guide content components.
 * The key format is "sectionId:subsectionId" or "sectionId" for the default subsection.
 */
export const guideContentMap: Record<string, ComponentType> = {
  'getting-started:overview': GettingStartedGuide,
  'getting-started:first-project': GettingStartedGuide,
  'getting-started:connecting-webflow': ConnectingWebflowGuide,
  'getting-started:connecting-figma': ConnectingFigmaGuide,
  'figma-to-webflow:importing': FigmaTranslatorGuide,
  'figma-to-webflow:semantic-html': FigmaTranslatorGuide,
  'figma-to-webflow:heading-hierarchy': FigmaTranslatorGuide,
  'figma-to-webflow:pushing': FigmaTranslatorGuide,
  'animations:how-it-works': AnimationsGuide,
  'animations:css-vs-gsap': AnimationsGuide,
  'animations:parameters': AnimationsGuide,
  'animations:scroll': AnimationsGuide,
  'animations:master-script': AnimationsGuide,
  'css-editor:layout': TemplatesGuide,
  'css-editor:typography': TemplatesGuide,
  'css-editor:spacing': TemplatesGuide,
  'scaling-system:overview': ScalingSystemGuide,
  'scaling-system:configuration': ScalingSystemGuide,
  'seo-speed-aeo:understanding-scores': AuditsGuide,
};
