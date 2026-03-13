/**
 * Centralized tooltip content for all controls, parameters, and features.
 * Every interactive control across Forge references this file.
 */

export interface TooltipContent {
  text: string;
  guideLink?: string;
}

// ─── Animation Parameters ───────────────────────────────────────

export const animationTooltips: Record<string, TooltipContent> = {
  duration: { text: 'How long the animation takes from start to finish.', guideLink: '/guide/animations/parameters#duration' },
  delay: { text: 'Time to wait before the animation begins. Use to sequence multiple elements.', guideLink: '/guide/animations/parameters#delay' },
  easing: { text: 'Controls the acceleration curve — how the animation speeds up and slows down.', guideLink: '/guide/animations/easing' },
  distance: { text: 'How far the element moves in the animation direction.', guideLink: '/guide/animations/parameters#distance' },
  threshold: { text: 'How visible the element must be in the viewport to trigger. 1.0 = fully visible, 0.2 = 20%.', guideLink: '/guide/animations/parameters#threshold' },
  direction: { text: 'Which direction the element animates from (up, down, left, right).', guideLink: '/guide/animations/parameters#direction' },
  scrub: { text: 'Links animation progress to scroll position instead of playing automatically.', guideLink: '/guide/animations/scroll#scrub' },
  pin: { text: 'Locks the element in place while the scroll animation plays, then releases it.', guideLink: '/guide/animations/scroll#pin' },
  stagger: { text: 'Delay between each child element starting its animation. Creates a wave effect.', guideLink: '/guide/animations/stagger' },
  splitType: { text: "How text is split for animation: 'chars' = each letter, 'words' = each word, 'lines' = each line.", guideLink: '/guide/animations/split-text' },
  scrollStart: { text: 'When the animation begins relative to scroll position.', guideLink: '/guide/animations/scroll#triggers' },
  scrollEnd: { text: 'When the animation completes relative to scroll position.', guideLink: '/guide/animations/scroll#triggers' },
  keyframe: { text: 'A point in time where you define property values. The animation interpolates between keyframes.', guideLink: '/guide/animations/timeline#keyframes' },
  timelinePosition: { text: 'Where this animation sits in a multi-step sequence.', guideLink: '/guide/animations/timeline' },
};

// ─── CSS Properties ─────────────────────────────────────────────

export const cssTooltips: Record<string, TooltipContent> = {
  display: { text: "How the element participates in layout flow. 'flex' for rows/columns, 'grid' for 2D layouts.", guideLink: '/guide/css-editor/layout#display' },
  flexDirection: { text: 'Whether flex children arrange horizontally (row) or vertically (column).', guideLink: '/guide/css-editor/layout#flex-direction' },
  justifyContent: { text: 'How children are spaced along the main axis — start, center, space-between.', guideLink: '/guide/css-editor/layout#justify-content' },
  alignItems: { text: 'How children are aligned on the cross axis — stretch, center, start, end.', guideLink: '/guide/css-editor/layout#align-items' },
  gap: { text: 'Space between flex/grid children. Only applies between items, not on outer edges.', guideLink: '/guide/css-editor/layout#gap' },
  position: { text: "'relative' for offset, 'absolute' for parent-relative, 'fixed' for viewport-locked.", guideLink: '/guide/css-editor/layout#position' },
  zIndex: { text: 'Stacking order. Higher numbers appear on top. Only works on positioned elements.', guideLink: '/guide/css-editor/layout#z-index' },
  width: { text: "Element width. 'auto' lets content determine size. Use %, vw for responsive.", guideLink: '/guide/css-editor/sizing#width' },
  height: { text: "Element height. 'auto' lets content determine size.", guideLink: '/guide/css-editor/sizing#height' },
  margin: { text: 'Space outside the element, pushing other elements away.', guideLink: '/guide/css-editor/spacing#margin' },
  padding: { text: 'Space inside the element, between the border and content.', guideLink: '/guide/css-editor/spacing#padding' },
  fontSize: { text: 'Text size. Use rem for scalable sizing with the fluid scaling system.', guideLink: '/guide/css-editor/typography#font-size' },
  lineHeight: { text: 'Vertical space between lines. Unitless values (like 1.5) scale with font-size.', guideLink: '/guide/css-editor/typography#line-height' },
  letterSpacing: { text: 'Space between characters. Negative tightens, positive loosens.', guideLink: '/guide/css-editor/typography#letter-spacing' },
  fontFamily: { text: 'The typeface used for text. Choose from project fonts or system fonts.', guideLink: '/guide/css-editor/typography#font-family' },
  fontWeight: { text: 'Text thickness from 100 (thin) to 900 (black). 400 = normal, 700 = bold.', guideLink: '/guide/css-editor/typography#font-weight' },
  textAlign: { text: 'Horizontal text alignment within the element.', guideLink: '/guide/css-editor/typography#text-align' },
  textTransform: { text: "'uppercase' makes all caps, 'capitalize' capitalizes first letters.", guideLink: '/guide/css-editor/typography#text-transform' },
  opacity: { text: 'Transparency. 1 = fully visible, 0 = invisible. Affects entire element including children.', guideLink: '/guide/css-editor/effects#opacity' },
  transform: { text: 'Moves, scales, rotates, or skews without affecting layout. GPU-accelerated for animations.', guideLink: '/guide/css-editor/effects#transform' },
  transition: { text: 'Smoothly animates property changes. Specify property, duration, and easing.', guideLink: '/guide/css-editor/effects#transition' },
  boxShadow: { text: "Shadow effects outside (or inside with 'inset') the element. Multiple shadows can stack.", guideLink: '/guide/css-editor/borders#box-shadow' },
  borderRadius: { text: 'Rounds corners. 50% creates a circle on square elements.', guideLink: '/guide/css-editor/borders#border-radius' },
  overflow: { text: "What happens when content exceeds element size. 'hidden' clips, 'scroll' adds scrollbar.", guideLink: '/guide/css-editor/layout#overflow' },
  willChange: { text: "Hints browser to optimize for upcoming changes. Use 'transform' for animations.", guideLink: '/guide/css-editor/effects#will-change' },
  backgroundColor: { text: "Fill color behind the element's content and padding.", guideLink: '/guide/css-editor/backgrounds#background-color' },
  borderWidth: { text: "Thickness of the element's border.", guideLink: '/guide/css-editor/borders#border-width' },
  borderStyle: { text: 'Visual style of the border line: solid, dashed, dotted, or none.', guideLink: '/guide/css-editor/borders#border-style' },
  borderColor: { text: "Color of the element's border.", guideLink: '/guide/css-editor/borders#border-color' },
  filter: { text: 'Visual effects like blur, brightness, contrast applied to the element.', guideLink: '/guide/css-editor/effects#filter' },
  cursor: { text: 'Mouse cursor style when hovering over the element.', guideLink: '/guide/css-editor/effects#cursor' },
  aspectRatio: { text: 'Maintains proportional width-to-height relationship (e.g., 16/9).', guideLink: '/guide/css-editor/sizing#aspect-ratio' },
};

// ─── Semantic HTML Tags ─────────────────────────────────────────

export const semanticTooltips: Record<string, TooltipContent> = {
  section: { text: 'Thematic content grouping, typically with a heading. Use for major page blocks.', guideLink: '/guide/figma-to-webflow/semantic-html#section' },
  nav: { text: 'Navigation links. Screen readers let users jump directly here.', guideLink: '/guide/figma-to-webflow/semantic-html#nav' },
  header: { text: 'Introductory content — typically the site header with logo and navigation.', guideLink: '/guide/figma-to-webflow/semantic-html#header' },
  footer: { text: 'Footer content — contact info, links, copyright.', guideLink: '/guide/figma-to-webflow/semantic-html#footer' },
  main: { text: 'Primary content of the page. Only one per page. Screen readers use it to skip navigation.', guideLink: '/guide/figma-to-webflow/semantic-html#main' },
  article: { text: 'Self-contained content that could stand alone — blog posts, product cards.', guideLink: '/guide/figma-to-webflow/semantic-html#article' },
  aside: { text: 'Content tangentially related to surrounding content — sidebars, callouts.', guideLink: '/guide/figma-to-webflow/semantic-html#aside' },
  h1: { text: 'Page title — one per page. Screen readers and SEO rely on heading hierarchy.', guideLink: '/guide/figma-to-webflow/heading-hierarchy' },
  h2: { text: 'Section heading. Use for major content sections within the page.', guideLink: '/guide/figma-to-webflow/heading-hierarchy' },
  h3: { text: 'Sub-section heading. Nests under H2 headings.', guideLink: '/guide/figma-to-webflow/heading-hierarchy' },
  h4: { text: 'Fourth-level heading. Nests under H3.', guideLink: '/guide/figma-to-webflow/heading-hierarchy' },
  h5: { text: 'Fifth-level heading. Rarely needed in most page structures.', guideLink: '/guide/figma-to-webflow/heading-hierarchy' },
  h6: { text: 'Sixth-level heading. Consider simplifying your heading hierarchy.', guideLink: '/guide/figma-to-webflow/heading-hierarchy' },
  ul: { text: 'Unordered (bullet) list. Proper semantics help screen readers announce item counts.', guideLink: '/guide/figma-to-webflow/semantic-html#lists' },
  ol: { text: 'Ordered (numbered) list. Use when sequence matters.', guideLink: '/guide/figma-to-webflow/semantic-html#lists' },
  a: { text: 'A hyperlink. Always needs an href. Use for navigation between pages.', guideLink: '/guide/figma-to-webflow/semantic-html#links' },
  button: { text: 'Interactive button for actions that don\'t navigate (toggles, submits, opens modals).', guideLink: '/guide/figma-to-webflow/semantic-html#buttons' },
  img: { text: 'An image. Always needs alt text for accessibility.', guideLink: '/guide/figma-to-webflow/semantic-html#images' },
  form: { text: 'Groups form inputs. Use with proper label-input associations for accessibility.', guideLink: '/guide/figma-to-webflow/semantic-html#forms' },
  div: { text: 'Generic container with no semantic meaning. Use only when no semantic tag fits.', guideLink: '/guide/figma-to-webflow/semantic-html#generic' },
  span: { text: 'Generic inline container. Use for styling text portions when no semantic tag fits.', guideLink: '/guide/figma-to-webflow/semantic-html#generic' },
  ariaLabel: { text: 'Accessible name for elements without visible text. Announced by screen readers.', guideLink: '/guide/figma-to-webflow/semantic-html#aria' },
  role: { text: "Defines the element's purpose for assistive technology. Usually implied by semantic tags.", guideLink: '/guide/figma-to-webflow/semantic-html#aria' },
};

// ─── Scaling System ─────────────────────────────────────────────

export const scalingTooltips: Record<string, TooltipContent> = {
  baseFontSize: { text: 'Root font size at the ideal viewport width. All rem values scale relative to this.', guideLink: '/guide/scaling-system/configuration#base-font-size' },
  idealWidth: { text: 'Viewport width where the base font size is exactly as configured.', guideLink: '/guide/scaling-system/configuration#ideal-width' },
  minWidth: { text: 'Narrowest viewport width for this breakpoint range.', guideLink: '/guide/scaling-system/configuration#min-width' },
  maxWidth: { text: 'Widest viewport width for this breakpoint range.', guideLink: '/guide/scaling-system/configuration#max-width' },
  fluidScaling: { text: 'Automatically adjusts root font size based on viewport, making all rem values responsive.', guideLink: '/guide/scaling-system/overview' },
};

// ─── Master Script ──────────────────────────────────────────────

export const masterScriptTooltips: Record<string, TooltipContent> = {
  masterScript: { text: 'A single JavaScript file that powers all animations on your Webflow site.', guideLink: '/guide/animations/master-script' },
  lenis: { text: 'Smooth scrolling library. Enhances scroll-based animations with buttery scroll.', guideLink: '/guide/animations/master-script#lenis' },
  cdnMode: { text: 'Host script on a CDN. Better caching, easier updates.', guideLink: '/guide/animations/master-script#deployment' },
  embedMode: { text: "Paste directly into Webflow's global custom code. Simpler but harder to update.", guideLink: '/guide/animations/master-script#deployment' },
};

// ─── Setup Wizard ───────────────────────────────────────────────

export const setupTooltips: Record<string, TooltipContent> = {
  autoItem: { text: 'Forge can configure this automatically via the Webflow Designer connection.', guideLink: '/guide/project-setup/auto-execution' },
  semiItem: { text: 'Forge provides the code or config — you paste it into Webflow.', guideLink: '/guide/project-setup/checklist' },
  manualItem: { text: 'Requires manual configuration in the Webflow Designer.', guideLink: '/guide/project-setup/checklist' },
  setupProfile: { text: 'Save your current checklist configuration as a reusable profile for future projects.', guideLink: '/guide/project-setup/profiles' },
};

// ─── Unit System ────────────────────────────────────────────────

export const unitTooltips: Record<string, TooltipContent> = {
  px: { text: 'Pixels — fixed size that doesn\'t scale with the fluid scaling system.', guideLink: '/guide/scaling-system/units#px' },
  rem: { text: 'Relative to root font size. Scales automatically with the fluid scaling system.', guideLink: '/guide/scaling-system/units#rem' },
  em: { text: "Relative to the parent element's font size. Useful for proportional spacing.", guideLink: '/guide/scaling-system/units#em' },
  percent: { text: "Relative to the parent element's size. 100% = full parent width/height.", guideLink: '/guide/scaling-system/units#percent' },
  unitConversion: { text: "Convert between units using the project's base font size for accurate px↔rem math.", guideLink: '/guide/scaling-system/units#conversion' },
};
