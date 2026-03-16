# FORGE — Design System & UI/UX Brief

> This document defines the visual identity, design system, and UI/UX patterns for Forge.
> Claude Code must follow this brief for ALL frontend work. No generic AI aesthetics.

---

## Brand Identity

**Name:** Forge
**Tagline:** Build Webflow sites at full speed.
**Metaphor:** A forge is where raw materials become refined tools through heat, precision, and craft. The UI should feel like a precision instrument — engineered, not decorated.

---

## Design Philosophy

Forge follows a **refined minimalist** aesthetic inspired by Vercel, Stripe, and the Webflow Designer. The design should feel:

- **Engineered:** Every pixel has a purpose. No decorative elements without function.
- **Precise:** Exact spacing, consistent alignment, sharp typography.
- **Fast:** The UI should feel instant. Transitions are subtle and quick (150-200ms), never slow or bouncy.
- **Quiet confidence:** The design doesn't shout. It communicates competence through restraint.
- **Tool-like:** This is a professional instrument, not a consumer app. Information density matters.

### Anti-Patterns (NEVER do these)

- No purple gradients on white backgrounds
- No rounded-everything pill shapes (use subtle 6px–8px radius max)
- No gratuitous gradient text or glowing effects
- No generic card layouts with drop shadows everywhere
- No emoji in UI chrome (data content is fine)
- No "hero sections" inside the app — this is a tool, not a marketing site
- No Inter, Roboto, Arial, or system font stacks
- No large padding that wastes screen space in a productivity tool
- No skeleton loaders that flash — use subtle fade-ins
- No confetti or celebration animations
- No overly cheerful empty states ("Nothing here yet! 🎉")

---

## Color System

### Primary Palette

The brand color is **dark emerald/forest green** — distinctive in the dev tools space, grounded, and tied to the "forge" metaphor (creation, growth, precision).

```css
:root {
  /* Brand greens — dark emerald family */
  --forge-50: #ecfdf5;
  --forge-100: #d1fae5;
  --forge-200: #a7f3d0;
  --forge-300: #6ee7b7;
  --forge-400: #34d399;
  --forge-500: #10b981;
  --forge-600: #059669;
  --forge-700: #047857;
  --forge-800: #065f46;
  --forge-900: #064e3b;
  --forge-950: #022c22;

  /* Neutrals — cool gray with slight green undertone */
  --gray-50: #f8fafb;
  --gray-100: #f1f5f4;
  --gray-200: #e2e8e6;
  --gray-300: #cdd5d3;
  --gray-400: #9ca3a1;
  --gray-500: #6b7270;
  --gray-600: #4b5251;
  --gray-700: #3a403f;
  --gray-800: #2a2f2e;
  --gray-900: #1a1f1e;
  --gray-950: #0d1110;

  /* Semantic colors */
  --success: #059669;
  --warning: #d97706;
  --error: #dc2626;
  --info: #0284c7;
}
```

### Light Theme (Default)

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: var(--gray-50);
  --bg-tertiary: var(--gray-100);
  --bg-elevated: #ffffff;
  --bg-overlay: rgba(0, 0, 0, 0.5);

  --text-primary: var(--gray-950);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-400);
  --text-inverse: #ffffff;

  --border-default: var(--gray-200);
  --border-subtle: var(--gray-100);
  --border-strong: var(--gray-300);

  --accent: var(--forge-700);
  --accent-hover: var(--forge-800);
  --accent-subtle: var(--forge-50);
  --accent-text: var(--forge-700);

  --surface-hover: var(--gray-50);
  --surface-active: var(--gray-100);
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --bg-primary: var(--gray-950);
  --bg-secondary: var(--gray-900);
  --bg-tertiary: var(--gray-800);
  --bg-elevated: var(--gray-900);
  --bg-overlay: rgba(0, 0, 0, 0.7);

  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-400);
  --text-tertiary: var(--gray-500);
  --text-inverse: var(--gray-950);

  --border-default: var(--gray-800);
  --border-subtle: var(--gray-850);
  --border-strong: var(--gray-700);

  --accent: var(--forge-500);
  --accent-hover: var(--forge-400);
  --accent-subtle: rgba(16, 185, 129, 0.1);
  --accent-text: var(--forge-400);

  --surface-hover: var(--gray-800);
  --surface-active: var(--gray-700);
}
```

### Color Usage Rules

1. **Accent color is used sparingly.** Only for: primary CTA buttons, active nav states, interactive element focus states, and important status indicators. Never as large background fills inside the app.
2. **Borders over shadows.** Use 1px borders (`--border-default`) to define surfaces, not box-shadows. Shadows only on elevated overlays (modals, dropdowns) and should be subtle.
3. **Text hierarchy through weight and color, not size.** Primary text is `--text-primary`, secondary is `--text-secondary`. Avoid creating hierarchy by making things bigger — instead, make them bolder or change color.
4. **Background hierarchy:** `--bg-primary` for main content, `--bg-secondary` for sidebar/nav, `--bg-tertiary` for nested sections.

---

## Typography

### Font Stack

**Primary:** Geist Sans (Vercel's geometric sans-serif)
**Monospace:** Geist Mono (for code, attribute names, API endpoints)

```css
:root {
  --font-sans: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', 'SF Mono', 'Fira Code', monospace;
}
```

### Type Scale

Follow a restrained, precise type scale. This is a developer tool — information density matters.

```css
:root {
  --text-xs: 0.6875rem;    /* 11px — labels, badges, metadata */
  --text-sm: 0.8125rem;    /* 13px — secondary text, table cells, sidebar items */
  --text-base: 0.875rem;   /* 14px — primary body text (NOT 16px — this is a tool, not a blog) */
  --text-md: 1rem;         /* 16px — section headings, important labels */
  --text-lg: 1.125rem;     /* 18px — page titles */
  --text-xl: 1.5rem;       /* 24px — dashboard headlines */

  --leading-tight: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;

  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
}
```

### Typography Rules

1. **Base font size is 14px**, not 16px. Developer tools use denser type. 16px body text wastes space.
2. **Headings are understated.** Page titles at 18px, section headings at 16px. No giant 32px+ headings inside the app. The content structure provides hierarchy, not type size.
3. **Use font weight for hierarchy:** 400 (regular) for body, 500 (medium) for labels/nav, 600 (semibold) for headings. Avoid bold (700) except for emphasis within text.
4. **Monospace for technical content:** All attribute names (`data-anim`), class names (`.section_hero`), API endpoints, code snippets, and file paths use `--font-mono`.
5. **Letter-spacing:** Slightly tight (`-0.01em`) on headings, normal on body. Never add wide letter-spacing to body text.
6. **Line-height:** 1.3 for headings, 1.5 for body text. Never go above 1.6.

---

## Spacing System

Use a 4px base unit. All spacing is multiples of 4.

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Spacing Rules

1. **Compact, not cramped.** This is a productivity tool. Padding inside components: 8-12px. Padding around page sections: 24-32px. No 64px padding on anything inside the app.
2. **Consistent gaps.** Flex/grid gaps: 8px for tight groups (buttons, tags), 12px for list items, 16px for card grids, 24px for section separation.
3. **Sidebar width:** 240px collapsed label view, 60px icon-only. Never wider than 280px.

---

## Component Patterns

### Buttons

```
Primary:   bg --accent, text white, border none, radius 6px, height 36px, padding 0 14px
Secondary: bg transparent, text --text-primary, border 1px --border-default, radius 6px, height 36px
Ghost:     bg transparent, text --text-secondary, border none, radius 6px, height 36px
Danger:    bg transparent, text --error, border 1px --error, radius 6px, height 36px

Hover: darken bg by 1 step (primary) or add --surface-hover bg (secondary/ghost)
Active: scale(0.98) transform, 100ms
Disabled: opacity 0.5, cursor not-allowed
```

- Button text is 13px, font-weight 500, no uppercase, no letter-spacing.
- Icon + text buttons: icon is 16px, gap 6px.
- Icon-only buttons: 32x32px, icon centered at 16px.

### Inputs

```
Height: 36px
Padding: 0 12px
Border: 1px --border-default
Radius: 6px
Font: --text-base (14px)
Focus: border --accent, ring 2px --accent-subtle
Placeholder: --text-tertiary
```

- Labels are 13px, font-weight 500, color `--text-secondary`, margin-bottom 6px.
- Error text is 12px, color `--error`, margin-top 4px.
- No floating labels. Label above input, always visible.

### Cards / Surfaces

```
Background: --bg-primary (or --bg-elevated for overlays)
Border: 1px --border-default
Radius: 8px
Padding: 16px
```

- No box-shadows on inline cards. Only on elevated surfaces (dropdowns, modals, popovers).
- Elevated shadow: `0 4px 12px rgba(0, 0, 0, 0.08)` (light), `0 4px 12px rgba(0, 0, 0, 0.3)` (dark).
- Hover state on interactive cards: `--surface-hover` background, `--border-strong` border.

### Navigation (Sidebar)

```
Width: 240px (expanded), 60px (collapsed)
Background: --bg-secondary
Border-right: 1px --border-default
```

- Nav items: height 36px, padding 0 12px, radius 6px, font 13px weight 500.
- Active state: `--accent-subtle` background, `--accent-text` color.
- Hover state: `--surface-hover` background.
- Section headers: 11px, uppercase, letter-spacing 0.05em, color `--text-tertiary`, margin 24px 0 8px 0.
- Collapsible with smooth 200ms transition.

### Tables

```
Header: bg --bg-secondary, text --text-secondary, font 12px weight 500, uppercase, tracking wide
Rows: height 44px, border-bottom 1px --border-subtle
Row hover: --surface-hover
Cell padding: 0 12px
```

- No alternating row colors. Use hover highlight only.
- Sort indicators: subtle chevron icons, 12px.
- Sticky header on scroll.

### Modals / Dialogs

```
Overlay: --bg-overlay
Container: --bg-elevated, radius 12px, border 1px --border-default
Shadow: 0 8px 24px rgba(0, 0, 0, 0.12)
Width: 480px (small), 640px (medium), 800px (large)
Padding: 24px
```

- Title: 16px, weight 600. Close button top-right, icon-only, 32x32.
- Animate in: fade + translateY(-8px) → 0, 200ms ease-out.
- Animate out: fade + translateY(8px), 150ms ease-in.

### Badges / Tags

```
Height: 22px
Padding: 0 8px
Font: 11px, weight 500
Radius: 4px
Background: contextual color at 10% opacity
Text: contextual color at full
```

- Status badges: green (success/active), amber (warning/pending), red (error), gray (inactive).
- Category tags: `--accent-subtle` bg, `--accent-text` color.
- Monospace font for technical tags (class names, attribute names).

### Empty States

- Minimal illustration (single-line SVG icon, 48px, color `--text-tertiary`).
- Title: 14px, weight 500, `--text-primary`.
- Description: 13px, `--text-secondary`, max-width 320px, centered.
- CTA button below.
- **No emoji, no cheerful language, no "Nothing here yet! 🎉"**. Tone is helpful and direct: "No projects yet. Create your first project to get started."

### Loading States

- Inline spinners: 16px SVG, animate rotate 1s linear infinite, color `--text-tertiary`.
- Page-level: centered spinner with subtle fade-in (200ms delay before showing).
- Skeleton loaders: NOT used. Prefer instant content with fade-in.
- Button loading: replace text with spinner, keep button width, disable.

---

## Layout Patterns

### App Shell

```
┌──────────────────────────────────────────────┐
│ Sidebar (240px) │ Main Content               │
│                 │ ┌────────────────────────┐  │
│ Logo            │ │ Page Header            │  │
│ ─────────────── │ │ (title + actions)      │  │
│ Nav items       │ ├────────────────────────┤  │
│                 │ │                        │  │
│                 │ │ Content Area           │  │
│                 │ │ (scrollable)           │  │
│                 │ │                        │  │
│                 │ │                        │  │
│ ─────────────── │ │                        │  │
│ User/Settings   │ │                        │  │
└──────────────────────────────────────────────┘
```

- Sidebar is fixed, does not scroll with content.
- Main content scrolls independently.
- Page header sticks to top of content area.
- Max content width: 1200px, centered with auto margins. Never full-bleed inside the app.

### Dashboard / Project View

- Project cards in a grid (3 columns on desktop, 2 on tablet, 1 on mobile).
- Cards show: project name, linked Webflow site, last updated, setup progress bar, quick-action icons.

### Module Views

Each module occupies the full content area. Modules can have their own sub-navigation (tabs or secondary sidebar):

- **Setup Wizard:** Vertical checklist in main content, expandable sections.
- **Figma Translator:** Split view — Figma tree left, Webflow structure preview right.
- **Template Library:** Grid of template cards with filters in a top bar.
- **Animation Playground:** Grid of animation cards, clicking opens canvas configurator in a slide-over panel or dedicated view.
- **Speed/SEO/AEO:** Dashboard with score overview cards at top, detailed findings below.

---

## Motion & Transitions

### Principles
- **Fast and functional.** No animations longer than 300ms inside the app.
- **Ease-out for entrances, ease-in for exits.** `cubic-bezier(0.16, 1, 0.3, 1)` for spring-like enters.
- **Transform and opacity only.** Never animate layout properties.
- **Respect `prefers-reduced-motion`.** Skip all non-essential animations.

### Standard Durations
```css
:root {
  --duration-fast: 100ms;     /* hover states, active states */
  --duration-normal: 200ms;   /* most transitions */
  --duration-slow: 300ms;     /* modal enter/exit, page transitions */
}
```

### Specific Animations
- **Page transitions:** Content area fade + subtle translateY(4px), 200ms.
- **Sidebar collapse/expand:** Width transition, 200ms ease-out.
- **Dropdown/popover:** fade + translateY(-4px) → 0, 150ms.
- **Toast notifications:** Slide in from bottom-right, 250ms, auto-dismiss after 5s.
- **Checklist item complete:** Checkbox fills with accent color, subtle scale(1.1) → 1, 200ms.
- **Animation playground previews:** These are the exception — they can be longer/more expressive since they're showcasing animations.

---

## Responsive Behavior

While Forge is primarily a desktop tool, ensure:
- **Minimum supported width:** 1024px for full experience.
- **Tablet (768-1023px):** Sidebar collapses to icon-only by default. Grid layouts go to 2 columns.
- **Mobile (<768px):** Simplified view. Setup wizard and audits work. Figma translator and animation playground are desktop-only with a "Use desktop for full experience" message.

---

## Iconography

- Use **Lucide icons** (lucide-react). Consistent, clean, 24px default grid, 1.5px stroke.
- Icons in nav: 20px.
- Icons in buttons: 16px.
- Icons in tables/lists: 16px.
- Color: `--text-secondary` by default, `--text-primary` on hover/active, `--accent-text` for active nav.

---

## Reference Aesthetic

The UI should feel like a hybrid of:
1. **Vercel Dashboard** — The information architecture, sidebar navigation, clean tables, and overall layout density.
2. **Stripe Dashboard** — The typography quality, the precise component design, the way information is presented without clutter.
3. **Webflow Designer** — The panel-based layout for the Figma translator and animation configurator views. The idea that tools panels slide in and out.

Study these three products. When in doubt about a design decision, ask: "Would this feel at home in the Vercel dashboard?" If no, reconsider.

---

## File Naming Convention for Frontend

```
src/
├── components/
│   ├── ui/          — shadcn/ui primitives (Button, Input, Dialog, etc.)
│   ├── layout/      — AppShell, Sidebar, PageHeader, ContentArea
│   ├── shared/      — Reusable composed components (ProjectCard, StatusBadge, etc.)
│   └── modules/     — Module-specific components
│       ├── setup/
│       ├── figma/
│       ├── templates/
│       ├── animations/
│       ├── speed/
│       ├── seo/
│       └── aeo/
├── pages/           — Route-level page components
├── hooks/           — Custom React hooks
├── lib/             — Utilities, API client, helpers
├── styles/          — Global styles, CSS variables, Geist font imports
└── types/           — TypeScript type definitions
```

All files use **kebab-case** for filenames. Components use **PascalCase** for exports.

---

## REVISION 2 — Additional Component Patterns

---

## Visual CSS Editor (Style Panel)

```
Width: 320px fixed, right-side panel
Background: --bg-primary
Border-left: 1px --border-default
```

### Property Groups
- Collapsible sections with header: 13px, weight 500, --text-secondary, uppercase, tracking-wide
- Expand/collapse chevron: 12px icon, right-aligned
- Group padding: 12px horizontal, 8px vertical between groups
- Divider between groups: 1px --border-subtle

### Property Inputs
- Label: 11px, weight 500, --text-tertiary
- Value input: height 28px (compact), font-size 13px, --font-mono, border 1px --border-default, radius 4px, padding 0 8px
- Unit badge: 11px, --font-mono, --text-tertiary, clickable, hover --text-primary, padding 2px 4px, radius 3px, bg --surface-hover on hover
- Slider: track height 4px, --border-default, thumb 14px circle, --accent fill for active portion
- Color picker trigger: 20x20px square, border 1px --border-default, radius 4px, shows current color as fill
- Dropdown: same height as inputs (28px), 13px font, --font-mono for values

### Code View Toggle
- Toggle button in panel header: "Visual" | "Code" text toggle, 12px, weight 500
- Active state: --accent-text color, underline
- Code view: Monaco editor or CodeMirror, font-size from Appearance settings (default 14px), --font-mono, dark theme matching app theme

### Responsive Breakpoint Bar
- Above style panel content: horizontal bar with 5 device icons (xxl/desktop/tablet/mobile-landscape/mobile)
- Each icon: 16px, --text-tertiary default, --accent-text when active
- Active breakpoint has a subtle bottom border in --accent
- Spacing: 8px gap between icons

---

## Animation Timeline Editor

```
Full-width component (takes the content area)
Background: --bg-secondary
Min-height: 300px
```

### Time Ruler
- Top bar: height 32px, --bg-tertiary
- Tick marks every 0.1s (small), 0.5s (medium), 1.0s (large with label)
- Label font: 11px, --font-mono, --text-tertiary
- Playhead: vertical line 1px --accent, with triangle handle at top (8px)

### Element Rows
- Row height: 40px, border-bottom 1px --border-subtle
- Row label: 13px, --font-mono, --text-secondary, left-aligned in a 180px label column
- Background: alternating subtle --bg-primary / --bg-secondary for readability

### Animation Blocks
- Rounded rectangles: height 28px, radius 4px
- CSS engine blocks: fill --forge-900 with --forge-500 left border (2px)
- GSAP engine blocks: fill rgba(2, 132, 199, 0.15) with --info left border (2px)
- Selected block: ring 2px --accent
- Drag cursor: grab → grabbing
- Resize handles: visible on hover, 4px wide zones on left/right edges, cursor col-resize

### Keyframe Markers
- Diamond shape: 8px, --accent fill
- Hover: scale 1.2, glow effect
- Selected: ring 2px --accent, brighter fill

### Easing Curve Editor
- Popup panel: 200x200px, --bg-elevated, border 1px --border-default, radius 8px, shadow
- Bezier curve: 2px stroke, --accent
- Control points: 8px circles, --accent, draggable
- Grid lines: 1px --border-subtle
- Preset buttons below: small pills with ease names (11px)

### Transport Controls
- Bottom bar: height 40px, --bg-tertiary, border-top 1px --border-default
- Play/Pause: 24px icon button, --accent
- Time display: --font-mono, 13px, --text-primary
- Speed selector: 0.5x / 1x / 2x dropdown

---

## Status Bar (Master Script + Scaling System)

```
Position: fixed bottom, full width of content area (not sidebar)
Height: 32px
Z-index: above content, below modals
```

### States

**No animations (hidden):** Bar not rendered.

**Warning (amber):**
```
Background: rgba(217, 119, 6, 0.08)
Border-top: 1px rgba(217, 119, 6, 0.2)
Text: 13px, --warning color
Icon: ⚡ or lightning bolt lucide icon, 14px
Action button: text button, --warning color, underline on hover
```

**Ready (blue):**
```
Background: rgba(2, 132, 199, 0.08)
Border-top: 1px rgba(2, 132, 199, 0.2)
Text: 13px, --info color
```

**Active (green):**
```
Background: transparent (minimal)
Border-top: 1px --border-subtle
Text: 13px, --text-tertiary
Green dot: 6px circle, --success, inline before text
```

### Layout
- Flex row, center-aligned vertically
- Left: status icon + text
- Right: action buttons (if any)
- Padding: 0 16px
- When both master script and scaling status show: separate with a `•` divider, --text-tertiary

---

## Help Tooltips

```
Background: --gray-900 (always dark, even in light theme)
Text: --gray-50, 12px, --font-sans
Max-width: 280px
Padding: 8px 12px
Radius: 6px
Shadow: 0 4px 12px rgba(0, 0, 0, 0.2)
Arrow: 6px triangle pointing toward trigger
```

- Appears on hover with 200ms delay
- "Learn more →" link: 12px, --forge-400 color, underline on hover, displayed on its own line below the tooltip text
- `?` trigger icon: 12px circle, --text-tertiary, hover --text-secondary, positioned right of label or inline after label text
- Tooltip position: prefer top, fall back to right/bottom if clipped

---

## REM Scaling System Configuration

### Breakpoint Card
```
Background: --bg-primary
Border: 1px --border-default
Radius: 8px
Padding: 16px
Margin-bottom: 12px
```

- **Header:** breakpoint name (e.g., "Desktop"), 14px, weight 600. Lucide icon left (Monitor, Tablet, Smartphone).
- **Input rows:** label (11px, --text-tertiary) on left, input (height 32px, width 120px, --font-mono, text-right) on right. Unit label "px" as static suffix (not editable).
- **Preview line:** 12px, --font-mono, --text-tertiary, italic. "At 1440px → 16px, At 1200px → 13.3px"
- **Between cards:** subtle connecting line (1px --border-subtle, vertical, centered, 12px height) indicating breakpoint cascade.

### Code Preview
```
Below breakpoint cards
Background: --gray-900 (always dark)
Border: 1px --border-default
Radius: 8px
Padding: 16px
Font: --font-mono, 13px
Max-height: 300px, overflow-y scroll
```

- Syntax highlighting: CSS keywords in --forge-400, values in --gray-300, comments in --gray-500
- "Copy" button: top-right, ghost button, 12px text
- "Push to Webflow" button: below code block, primary button style

---

## Section Capture UI

### URL Capture View
- URL input bar at top: full width, height 40px, placeholder "Paste a URL to capture a section..."
- Below: iframe preview of the fetched page (full width, scrollable)
- Selection mode: cursor changes to crosshair, click to select a top-level element, selected element gets a dashed 2px --accent border overlay
- Bottom action bar: "Capture Selected" primary button, "Cancel" secondary button, captured element name shown

### MCP Capture View
- Page list from connected site: table with page name, slug, last modified
- Click a page → structure tree loads
- Multi-select on tree nodes → "Capture Selected" button

### Manual Paste View
- Three-tab editor: HTML | CSS | JavaScript
- Each tab: syntax-highlighted code editor (Monaco/CodeMirror), full width
- "Preview" button renders the combined code in iframe below
- "Save to Library" button

---

## Unit Toggle Input

```
┌─────────────┬──────┐
│   44        │ px ▾ │
└─────────────┴──────┘
```

- Input area: standard input styling per DESIGN.md (height 28px for compact/style panel, 36px for forms)
- Unit badge: right section, 24px wide, --bg-secondary, border-left 1px --border-default, --font-mono 11px, --text-secondary
- Hover on unit badge: --surface-hover background, --text-primary color, cursor pointer
- Click opens dropdown: 3 options (px, rem, em), active has checkmark, default has small dot indicator
- Conversion dialog: inline below input, 12px text, --bg-tertiary, radius 4px, padding 6px 10px, fade-in 150ms. "[Convert] [Keep value]" as small text buttons.

---

## Template Library Cards (with Visual Preview)

```
Width: auto (grid-based, ~280px in 4-col grid)
Background: --bg-primary
Border: 1px --border-default
Radius: 8px
Overflow: hidden (thumbnail bleeds to edges)
```

- **Thumbnail area:** top, aspect-ratio 16/10, background --bg-secondary. Shows generated screenshot (WebP). Lazy loaded.
- **Hover state:** thumbnail scales 1.02 (overflow hidden clips), action overlay fades in at bottom (gradient from transparent to --bg-primary, 48px height), containing icon buttons (Use, Preview, Edit, Delete) at 16px, --text-secondary, spaced 8px apart.
- **Info area:** padding 12px. Template name: 13px, weight 500, --text-primary. Below: category badge + type badge (skeleton/styled/full) + variant count if >1.
- **Star (favorite) icon:** top-right of thumbnail, 16px, appears on hover, --text-tertiary, click toggles --warning color fill.

---

## MCP Connection Indicator

```
Position: app header, right side, next to user avatar
```

- **Connected:** 8px circle, --success fill, subtle pulse animation (opacity 0.6→1, 2s infinite)
- **Disconnected:** 8px circle, --error fill, no animation
- **Reconnecting:** 8px circle, --warning fill, pulse animation faster (1s)
- **Hover:** tooltip showing status text + site name
- **Click:** popover (240px wide, --bg-elevated, radius 8px, border, shadow) with: site name, connection duration, last activity, Disconnect button, troubleshooting link
