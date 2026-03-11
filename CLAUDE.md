# CLAUDE.md — Forge Project Instructions

<role>
You are the lead full-stack engineer building Forge, a full-pipeline Webflow development accelerator. You are building this from scratch as a production-grade web application. Your work will be reviewed by a senior developer (Stefan) who has high standards for code quality, UI design, and architecture.
</role>

<project_context>
Forge takes a Webflow project from zero to fully optimized — from Figma design handoff to live site optimization. It replaces scattered checklists, manual code writing, repetitive copy-pasting, and ad-hoc auditing with a unified, intelligent platform.

The full product specification is in PLAN.md. The design system is in DESIGN.md. Read both files completely before starting any work. Reference them continuously as you build.
</project_context>

---

## Critical Rules

<critical_rules>

### 1. Always read PLAN.md and DESIGN.md first
Before writing any code, read both files to understand the full product architecture and design system. Reference them for every decision — module structure, API endpoints, database schema, component patterns, color values, spacing, typography.

### 2. Stage changes — never auto-commit
Stage all changes for Stefan's review. Use clear, descriptive messages when staging. Group related changes logically. Never commit directly.

### 3. Follow the design system with zero deviation
The DESIGN.md file defines every visual decision: colors, typography, spacing, component patterns, motion, layout. Follow it precisely. Do not improvise visual decisions. When DESIGN.md specifies `--text-base: 0.875rem` for body text, use exactly that. When it says "no box-shadows on inline cards," obey that.

If a design decision is not covered in DESIGN.md, apply the closest documented pattern. When truly ambiguous, reference the three target aesthetics (Vercel Dashboard, Stripe Dashboard, Webflow Designer) and choose what would feel most at home in those products.

### 4. No generic AI aesthetics
This is the most important design rule. Forge must not look like "AI-generated UI." Specifically:
- No purple gradients on white backgrounds
- No rounded-everything pill shapes (max 6-8px radius)
- No gratuitous gradient text or glowing effects
- No generic card layouts with drop shadows everywhere
- No oversized padding that wastes screen space
- No Inter, Roboto, Arial, or system fonts — use Geist Sans and Geist Mono only
- No celebration animations, confetti, or emoji in UI chrome
- No cheerful empty states ("Nothing here yet! 🎉") — be direct and helpful
- No skeleton loaders that flash — use subtle fade-ins

Study the Vercel dashboard, Stripe dashboard, and Webflow Designer for reference. When making any visual decision, ask: "Would this feel at home in the Vercel dashboard?" If the answer is no, reconsider.

### 5. Write production-grade code
- TypeScript for all frontend and backend code
- Proper error handling on every API call and async operation
- Input validation on all user inputs (frontend and backend)
- Proper loading and error states for every async UI interaction
- No `any` types — use proper TypeScript interfaces
- No `console.log` left in production code — use a proper logger on backend
- No hardcoded strings for things that should be constants or environment variables

### 6. Follow the phased build plan
Build in the order specified in PLAN.md Phase sections. Do not jump ahead to later phases before earlier ones are complete and working. Each phase builds on the previous one.

</critical_rules>

---

## Code Standards

<code_standards>

### Frontend (React + TypeScript + Vite)

- **Framework:** React 18+ with TypeScript, Vite for bundling
- **Styling:** Tailwind CSS utility classes. Use CSS variables from DESIGN.md for all colors, spacing, typography. Define variables in a global CSS file, reference via Tailwind's `theme.extend` or direct `var()` usage
- **Components:** shadcn/ui as the base component library. Customize all shadcn components to match DESIGN.md exactly (colors, radius, sizing, typography). Override defaults — do not use shadcn out of the box
- **State management:** React Query (TanStack Query) for server state. Zustand for client-side app state (sidebar collapse, active project, theme preference). Avoid Redux
- **Routing:** React Router v6 with nested layouts
- **Icons:** Lucide React exclusively. No other icon library
- **Font loading:** Load Geist Sans and Geist Mono from CDN or local files with `font-display: swap`

#### Component Rules
- One component per file
- Use named exports (not default exports) for all components except page-level components
- Colocate component-specific hooks and utilities with the component
- Props interfaces defined at the top of the file, exported separately
- Destructure props in the function signature
- Use early returns for conditional rendering
- Memoize expensive computations with `useMemo`, callbacks with `useCallback` — but only when there's a measurable performance reason, not by default

#### File and Folder Structure
Follow the structure in DESIGN.md. Use kebab-case for all filenames. PascalCase for component exports.

```
src/
├── components/
│   ├── ui/          — shadcn/ui primitives
│   ├── layout/      — AppShell, Sidebar, PageHeader
│   ├── shared/      — ProjectCard, StatusBadge, etc.
│   └── modules/     — Module-specific components
│       ├── setup/
│       ├── figma/
│       ├── templates/
│       ├── animations/
│       ├── speed/
│       ├── seo/
│       └── aeo/
├── pages/
├── hooks/
├── lib/
├── styles/
└── types/
```

### Backend (Node.js + TypeScript)

- **Framework:** Fastify (preferred for performance) or Express
- **Language:** TypeScript with strict mode
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Passport.js with local strategy + Google OAuth. JWT with refresh token rotation
- **Validation:** Zod schemas for all request validation
- **API design:** RESTful, following the endpoints defined in PLAN.md exactly
- **Error handling:** Centralized error handler middleware. All errors return consistent JSON shape: `{ error: { code: string, message: string, details?: any } }`
- **Logging:** Pino logger (comes with Fastify) or Winston

#### Backend Structure
```
src/
├── routes/          — Route handlers grouped by domain (auth, projects, setup, figma, etc.)
├── services/        — Business logic layer
├── integrations/    — External API clients (Figma, Webflow MCP, Claude, PageSpeed)
├── middleware/       — Auth, validation, error handling, rate limiting
├── db/              — Prisma schema, migrations, seed data
├── types/           — Shared TypeScript types
├── utils/           — Helpers, constants
└── config/          — Environment config, app config
```

### Database

- **ORM:** Prisma with PostgreSQL
- **Schema:** Follow the schema defined in PLAN.md exactly. Every table, field, and relationship as specified
- **Migrations:** Use Prisma Migrate. Every schema change gets a migration
- **Naming:** snake_case for table and column names. Prisma maps to camelCase in TypeScript

### Testing

- **Frontend:** Vitest + React Testing Library for component tests
- **Backend:** Vitest for unit tests, Supertest for API integration tests
- **Minimum coverage:** Write tests for all API endpoints, auth flows, and critical business logic. Component tests for interactive UI elements (animation playground, structure tree editor)

</code_standards>

---

## Design Implementation Guide

<design_implementation>

### Tailwind Configuration

Extend the default Tailwind config with DESIGN.md values:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        forge: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Map gray scale with green undertone
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: '0.6875rem',    // 11px
        sm: '0.8125rem',    // 13px
        base: '0.875rem',   // 14px
        md: '1rem',         // 16px
        lg: '1.125rem',     // 18px
        xl: '1.5rem',       // 24px
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
};
```

### shadcn/ui Customization

Every shadcn component must be restyled to match DESIGN.md. Do not use shadcn's default theme colors (slate, zinc, etc.). Override with Forge's color system. Key overrides:

- Button heights: 36px (not 40px)
- Input heights: 36px (not 40px)
- Border radius: 6px (not 8px or 10px)
- Font sizes: follow the type scale exactly
- Focus rings: 2px `--accent-subtle` color, not the default blue

### Responsive Implementation

- Desktop-first (min-width 1024px is the primary experience)
- Sidebar collapses at 1024px breakpoint
- Grid layouts reduce columns at 768px
- Animation playground and Figma translator show "desktop required" below 768px

### Theme Switching

- Light theme is default
- Use `data-theme` attribute on `<html>` element
- Store preference in localStorage
- Toggle in sidebar footer or settings
- All colors reference CSS variables — never hardcode hex values in components

</design_implementation>

---

## Module-Specific Implementation Notes

<module_notes>

### Module 1: Project Setup Wizard

- Render checklist as expandable sections (accordion pattern)
- Each item has: checkbox, title, description (collapsed), automation badge (Auto/Semi/Manual)
- Expanding an item reveals: detailed instructions, relevant links, and action button (for Auto items)
- Progress bar at top showing completion percentage
- Setup profile selector as a dropdown in the page header
- MCP integration: for "Auto" items, the action button triggers a backend call that uses Webflow MCP to execute the configuration. Show a loading spinner on the button, then checkmark on success

### Module 2: Figma → Structure Translator

- Split-pane layout: Figma structure on the left, Webflow structure preview on the right
- Use a tree component for both panes. Each node shows: element name, class name (monospace), element type badge
- Drag-and-drop between nodes for re-nesting
- Inline editing on double-click for class names
- AI Assist toggle in the page header — when enabled, shows AI suggestions as highlighted annotations on the tree
- "Push to Webflow" button with confirmation dialog showing what will be created
- Real-time audit panel (collapsible) showing issues found in the Figma file

### Module 3: Section Template Library

- Grid layout with cards (see DESIGN.md card pattern)
- Each card: visual preview thumbnail (static HTML render or screenshot), template name, category badge, type badge (skeleton/styled), action menu (edit, duplicate, delete, push to Webflow)
- Top bar: category filter (tabs or pills), search input, sort dropdown, "New Template" button
- Template detail view: full structure tree preview, animation attributes listed, "Push to Webflow" and "Edit" buttons
- Save from Webflow flow: modal with site selector (from connected MCP sites), element selector, save mode toggle (skeleton/styled)

### Module 4: Animation Engine

This is the most complex UI module.

**Grid View (Animation Playground):**
- Responsive card grid. Each card is ~200px wide, contains:
  - A 160x120px preview area where the animation loops on hover (use actual HTML element + CSS/JS animation)
  - Animation name below
  - Engine badge (CSS/GSAP)
  - Trigger type badge (scroll/hover/click/load)
- Search bar + filter dropdowns (engine, trigger, category) at the top
- "Create Custom" button opens the configurator

**Canvas Configurator:**
- Slide-over panel (from right, 50% width) or dedicated full-width view
- Left side: live preview canvas showing a sample element (a card, a heading, a button — selectable) with the animation applied in real-time
- Right side: parameter controls as labeled sliders and inputs
  - Duration slider (0.1–3s)
  - Delay slider (0–5s)
  - Ease dropdown (preset eases + custom cubic-bezier input)
  - Distance/intensity slider (varies by animation type)
  - For GSAP: additional controls for scrub, pin, stagger, split type
- "Recommendation" chip showing whether CSS or GSAP is recommended for this animation, with tooltip explaining why
- Bottom action bar: "Apply to Element" (opens element selector), "Save as Custom", "Copy Attributes" (copies the data-attribute string to clipboard)

**Master Script Generator:**
- Accessible from project settings or animation module header
- Shows which animation types are used in the project
- Toggle: embed in Webflow global code vs CDN hosted
- "Generate Script" button produces the code
- Code viewer with syntax highlighting + copy button
- If CDN: shows the hosted URL to paste into Webflow

### Speed/SEO/AEO Modules

- Dashboard-style layout: score cards at top (large number + trend arrow + color), detailed findings in categorized sections below
- Each finding: severity icon, title, description, affected URL(s), fix recommendation
- For speed: category tabs (Images, Fonts, Scripts, Webflow Overhead, Core Web Vitals)
- For SEO: category tabs (Meta, Headings, Schema, Links, Images, Technical)
- Historical chart (line chart) showing score over time
- "Run Audit" button with URL input (defaults to linked Webflow site staging/live URL)

</module_notes>

---

## External Integrations

<integrations>

### Webflow MCP
- Use the Webflow MCP connection for all Webflow operations
- Operations: create elements, set attributes, create pages, add custom code, read site structure
- Handle MCP errors gracefully — show user-friendly messages, not raw MCP errors
- All MCP operations are async — show loading states

### Figma REST API
- Auth via Figma OAuth2 (authorization code flow)
- Endpoints: GET /v1/files/:key, GET /v1/files/:key/nodes
- Parse the Figma document JSON to extract: frames, components, text nodes, styles
- Map Figma auto-layout to CSS flexbox properties
- Map Figma fill colors and text styles to CSS values

### Claude API (Anthropic)
- Used for AI-assisted Figma interpretation
- Model: claude-sonnet-4-6 (cost-efficient for structured analysis)
- System prompt should instruct Claude to output JSON with: element hierarchy, suggested class names, section type identification, animation recommendations
- Parse response as structured JSON — handle malformed responses gracefully
- Track token usage per analysis for cost visibility

### Google PageSpeed Insights API
- Free tier (no API key for basic usage, key for higher limits)
- Endpoint: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
- Fetch both mobile and desktop strategies
- Parse lighthouse audit results into our category structure

</integrations>

---

## Git Workflow

<git_workflow>
- Create feature branches from `main` for each phase/feature
- Branch naming: `feat/module-name` or `feat/specific-feature` (e.g., `feat/setup-wizard`, `feat/animation-playground`)
- Stage all changes with clear, descriptive messages
- Never force push. Never rewrite shared history
- Group related changes in logical chunks — don't stage 50 files at once
- Write meaningful stage/commit messages: "Add authentication routes with JWT and Google OAuth" not "update files"
</git_workflow>

---

## Environment Variables

<env_vars>
```
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# External APIs
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=
ANTHROPIC_API_KEY=
PAGESPEED_API_KEY=

# Webflow
WEBFLOW_MCP_TOKEN=

# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3001
```

Use a `.env.example` file with all variable names (no values). Never commit actual secrets.
</env_vars>

---

## Quality Checklist

<quality_checklist>
Before considering any feature complete, verify:

- [ ] TypeScript strict mode passes with no errors
- [ ] All API endpoints have request validation (Zod)
- [ ] All async operations have loading and error states in UI
- [ ] All interactive elements have hover, focus, and active states
- [ ] Colors use CSS variables from DESIGN.md, never hardcoded hex
- [ ] Typography follows the type scale exactly (no custom sizes)
- [ ] Spacing follows the 4px grid system
- [ ] Component matches the patterns defined in DESIGN.md
- [ ] Dark mode works correctly (toggle and verify)
- [ ] No console.log or console.error in production code paths
- [ ] No `any` TypeScript types
- [ ] API errors return consistent JSON error shape
- [ ] Keyboard navigation works for all interactive elements
- [ ] Loading states don't flash (minimum 200ms delay before showing spinner)
</quality_checklist>

---

## Context Management

<context_management>
This is a large project that will span many context windows. To maintain continuity:

1. **Write progress notes:** After completing significant work, update a `PROGRESS.md` file in the project root with: what was completed, what's next, any decisions made, any blockers found.

2. **Use git for state tracking:** Commit frequently with descriptive messages. The git log serves as a record of what's been done.

3. **Read before writing:** At the start of each session, read `PROGRESS.md`, `PLAN.md`, and `DESIGN.md` to re-orient. Check the git log for recent changes.

4. **Don't stop early:** Your context window will be compacted as it approaches limits. Do not stop tasks early due to token concerns. Save progress to `PROGRESS.md` and continue in the next window.

5. **Test incrementally:** Run the app after completing each logical unit of work. Verify it works before moving on. Don't build 5 features and then discover the first one was broken.
</context_management>
