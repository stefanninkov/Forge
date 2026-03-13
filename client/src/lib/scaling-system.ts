export interface BreakpointConfig {
  name: string;
  baseFontSize: number;
  idealWidth: number;
  minWidth: number;
  maxWidth: number;
}

export interface ScalingConfig {
  desktop: BreakpointConfig;
  tablet: BreakpointConfig;
  mobileLandscape: BreakpointConfig;
  mobilePortrait: BreakpointConfig;
}

export const DEFAULT_SCALING_CONFIG: ScalingConfig = {
  desktop: {
    name: 'Desktop',
    baseFontSize: 16,
    idealWidth: 1440,
    minWidth: 992,
    maxWidth: 1920,
  },
  tablet: {
    name: 'Tablet',
    baseFontSize: 16,
    idealWidth: 834,
    minWidth: 768,
    maxWidth: 991,
  },
  mobileLandscape: {
    name: 'Mobile Landscape',
    baseFontSize: 16,
    idealWidth: 550,
    minWidth: 480,
    maxWidth: 767,
  },
  mobilePortrait: {
    name: 'Mobile Portrait',
    baseFontSize: 16,
    idealWidth: 375,
    minWidth: 320,
    maxWidth: 479,
  },
};

export function calculateFontSize(bp: BreakpointConfig, viewportWidth: number): number {
  const ratio = viewportWidth / bp.idealWidth;
  return Math.round(bp.baseFontSize * ratio * 10) / 10;
}

export function generateScalingCSS(config: ScalingConfig): string {
  const { desktop, tablet, mobileLandscape, mobilePortrait } = config;

  return `/* Forge Fluid Scaling System — REM */

/* Desktop */
:root {
  --size-unit: ${desktop.baseFontSize};
  --size-container-ideal: ${desktop.idealWidth};
  --size-container-min: ${desktop.minWidth}px;
  --size-container-max: ${desktop.maxWidth}px;
  --size-container: clamp(var(--size-container-min), 100vw, var(--size-container-max));
  --size-font: calc(var(--size-container) / (var(--size-container-ideal) / var(--size-unit)));
}
html { font-size: var(--size-font); }
body { font-size: 1rem; }

/* Tablet */
@media screen and (max-width: ${tablet.maxWidth}px) {
  :root {
    --size-container-ideal: ${tablet.idealWidth};
    --size-container-min: ${tablet.minWidth}px;
    --size-container-max: ${tablet.maxWidth}px;
  }
}

/* Mobile Landscape */
@media screen and (max-width: ${mobileLandscape.maxWidth}px) {
  :root {
    --size-container-ideal: ${mobileLandscape.idealWidth};
    --size-container-min: ${mobileLandscape.minWidth}px;
    --size-container-max: ${mobileLandscape.maxWidth}px;
  }
}

/* Mobile Portrait */
@media screen and (max-width: ${mobilePortrait.maxWidth}px) {
  :root {
    --size-container-ideal: ${mobilePortrait.idealWidth};
    --size-container-min: ${mobilePortrait.minWidth}px;
    --size-container-max: ${mobilePortrait.maxWidth}px;
  }
}`;
}
