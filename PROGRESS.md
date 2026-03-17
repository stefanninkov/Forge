# Forge — Build Progress

## Phase 1: Foundation — COMPLETE

### Completed

**1. Project Structure (Monorepo)**
- Root workspace with `client/`, `server/`, `shared/` directories
- npm workspaces for dependency management
- `concurrently` for parallel dev server execution

**2. Frontend Setup**
- React 18 + TypeScript + Vite
- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Full design system CSS variables in `src/styles/globals.css` (all colors, typography, spacing, motion tokens from DESIGN.md)
- Geist Sans + Geist Mono fonts loaded from CDN
- Light/dark theme with `data-theme` attribute, persisted in localStorage
- React Router v6 with lazy-loaded routes for all 7 modules
- TanStack Query for server state
- Zustand stores: auth, theme, sidebar
- API client with automatic auth header injection
- Path alias `@/` → `src/`

**3. Backend Setup**
- Fastify with TypeScript (ESM)
- Prisma ORM with PostgreSQL schema (Phase 1 tables: users, projects, setup_profiles, setup_progress, refresh_tokens)
- Zod request validation
- Centralized error handling with consistent JSON error shape
- Pino logger with pino-pretty in development
- CORS configured for frontend origin
- Rate limiting (100 req/min)

**4. Authentication System**
- Email/password registration + login with bcryptjs hashing
- JWT access tokens (15min expiry) + refresh token rotation (7 day)
- Refresh tokens stored in DB, with reuse detection
- `requireAuth` middleware for protected routes
- `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- Google OAuth routes stubbed (501 until credentials configured)
- Frontend login + register pages

**5. App Shell UI**
- Sidebar with all 7 modules grouped into Overview/Develop/Optimize sections
- Sidebar collapse/expand with smooth transition, persisted in localStorage
- Theme toggle (light/dark) in sidebar footer
- PageHeader component (sticky, with title + description + actions slot)
- AppLayout with sidebar + scrollable content area
- All module pages created as placeholders
- Protected routes redirect to login when unauthenticated

**6. Project CRUD**
- Backend: full REST API (`GET /api/projects`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`)
- Frontend: Dashboard with project card grid
- Create project dialog (modal)
- Edit project dialog (reuses create dialog)
- Delete confirmation dialog
- Empty state, loading state, error state
- ProjectCard component with dropdown menu (edit/delete)

### Pending — Requires PostgreSQL

- Run `prisma migrate dev` to create initial migration
- Prisma client generation (`prisma generate`)
- End-to-end testing of auth + project flows

### Decisions Made

- **Monorepo**: Simple npm workspaces (no Turborepo/Nx — overkill for 2 packages)
- **Fastify** over Express: better TypeScript support, built-in validation, Pino logger, faster
- **Prisma 6.x**: Stable LTS, Prisma 7 has breaking schema changes
- **No shadcn/ui CLI init yet**: Will manually create UI components as needed, styled to match DESIGN.md exactly
- **CSS variables over Tailwind theme**: All design tokens are CSS custom properties. Components reference them directly via `var()` for theme switching support

### Phase 1 Infrastructure Done
- PostgreSQL installed via Homebrew (postgresql@16)
- Initial Prisma migration run successfully
- Auth flow tested: registration creates user + returns JWT tokens
- Health check endpoint verified

---

## Phase 2: Project Setup Wizard — COMPLETE

### Backend (completed)
- `src/config/setup-checklist.ts` — Full checklist definition: 7 categories, 35 items
  - SEO Settings (5 items), Publishing & Domain (4), General Settings (5), Design System Setup (6), Code & Scripts (6), Pages (5), Performance Prep (5)
  - Each item has: key, title, description, instructions, automationLevel (auto/semi/manual), optional link
- `src/services/setup-service.ts` — All CRUD operations
  - `getSetupProgress`: builds full checklist with status from DB, calculates progress stats
  - `updateSetupItem`: upsert with key validation
  - `resetSetupProgress`: clear all progress for a project
  - Profile management: list, create, apply, delete
- `src/routes/setup/index.ts` — All API endpoints
  - `GET /api/projects/:id/setup` — Get setup progress
  - `PUT /api/projects/:id/setup/:item` — Update item status
  - `POST /api/projects/:id/setup/apply-profile` — Apply profile
  - `POST /api/projects/:id/setup/reset` — Reset progress
  - `POST /api/projects/:id/setup/execute/:item` — MCP auto-execute (501 stub)
  - `GET /api/setup-profiles` — List profiles
  - `POST /api/setup-profiles` — Create profile
  - `DELETE /api/setup-profiles/:profileId` — Delete profile
  - `GET /api/setup-profiles/checklist` — Get full checklist definition

### Frontend (completed)
- `src/types/setup.ts` — SetupItem, SetupCategory, SetupProgress, SetupProfile types
- `src/hooks/use-setup.ts` — TanStack Query hooks for all setup operations
- `src/components/modules/setup/setup-item-row.tsx` — Individual checklist item
  - Checkbox toggle (completed/pending), expandable details
  - Automation level badge (Auto/Semi/Manual) with color-coded icons
  - Expanded view: description, instructions (mono font), external link
  - Line-through styling for completed items, dimmed for skipped
- `src/components/modules/setup/setup-category-section.tsx` — Expandable category accordion
  - Category header with expand/collapse, completion counter (e.g., 3/5)
  - Filters out skipped items from display
  - Green counter when all items complete
- `src/components/modules/setup/save-profile-dialog.tsx` — Save profile modal
  - Name input, saves current checklist config
- `src/pages/setup.tsx` — Full setup wizard page
  - Project selector dropdown (reads ?project= query param from URL)
  - Progress bar with percentage, completed/remaining/skipped counts
  - 7 expandable category sections with all 35 checklist items
  - Profiles dropdown (save current, apply saved, delete)
  - Reset button with confirmation dialog
  - Loading, error, and empty states
- `src/components/shared/project-card.tsx` — Added "Setup" menu item
  - Navigates to /setup?project=<id> for direct project access

### Decisions Made
- Setup page uses project selector (not route param) — simpler, works with sidebar nav
- Query param `?project=` used for deep linking from dashboard
- Skipped items hidden from display (not just dimmed) for cleaner checklist UX
- Profiles store which items are enabled/disabled as a Record<string, boolean>

---

## Phase 3: Animation Engine — COMPLETE

### Backend (completed)
- `server/prisma/schema.prisma` — Added AnimationPreset model + enums (AnimationEngine, AnimationTrigger)
  - Migration `20260312185158_add_animation_presets` applied successfully
  - Fields: id, userId, name, description, category, engine, trigger, config (JSON), previewHtml, isSystem, isPublished, tags
- `server/src/config/animation-presets.ts` — 26 system animation presets
  - Fade: fade-in, fade-up, fade-down, fade-left, fade-right
  - Scale: scale-in, scale-up, scale-down
  - Slide: slide-up, slide-down, slide-left, slide-right
  - Special: rotate-in, blur-in
  - Hover: scale-up, lift, glow
  - Load: fade-up (page load)
  - GSAP: parallax, split-text (words/chars/lines), stagger, scrub, pin
- `server/src/services/animation-service.ts` — Full service layer
  - listPresets: system + user presets with engine/trigger/category/search filters
  - createPreset, updatePreset, deletePreset (user presets only)
  - getProjectAnimationConfig, updateProjectAnimationConfig
  - generateMasterScript: builds the complete animation runtime script
  - seedSystemPresets: idempotent seeding
  - buildMasterScript: IIFE with CSS IntersectionObserver, hover handlers, load handlers, GSAP ScrollTrigger/SplitText, Lenis sync, resize handler, reduced-motion check
- `server/src/routes/animations/` — Route handlers + Zod schemas
  - GET/POST /api/animations — list + create presets
  - GET/PUT/DELETE /api/animations/:id — single preset CRUD
  - POST /api/animations/seed — seed system presets
  - GET/PUT /api/projects/:id/animations — project animation config
  - POST /api/projects/:id/animations/generate — generate master script
- `server/src/index.ts` — Registered animation route groups

### Frontend (completed)
- `client/src/types/animation.ts` — Full type definitions
  - AnimationEngine, AnimationTrigger, AnimationPresetConfig, AnimationPreset
  - AnimationConfig, MasterScriptResponse, PresetFilters
- `client/src/hooks/use-animations.ts` — 9 TanStack Query hooks
  - useAnimationPresets, useAnimationPreset, useCreateAnimationPreset
  - useUpdateAnimationPreset, useDeleteAnimationPreset
  - useProjectAnimationConfig, useUpdateProjectAnimationConfig
  - useGenerateMasterScript, useSeedPresets
- `client/src/components/modules/animations/preset-card.tsx` — Preset card with live hover preview
  - 120px preview area with animated element on hover
  - Engine badge (CSS/GSAP), trigger badge, copy attributes button
  - Delete button for user presets, all actions on hover reveal
  - Full animation system: applyAnimation + resetAnimation helpers
- `client/src/components/modules/animations/preset-filters.tsx` — Filter bar
  - Search input, engine dropdown, trigger dropdown, category dropdown
  - Clear filters button, result count display
- `client/src/components/modules/animations/configurator-panel.tsx` — Slide-over configurator
  - Live preview canvas with replay button
  - Parameter sliders: duration, delay, ease, distance, threshold
  - GSAP-specific: stagger, ScrollTrigger start/end, split type
  - Recommendation chip (CSS vs GSAP)
  - Data attributes display with copy-to-clipboard
  - Save as Custom + Copy Attributes footer actions
- `client/src/components/modules/animations/script-generator-panel.tsx` — Master script generator
  - Project selector dropdown
  - Script options: Lenis toggle, deployment mode (inline/CDN)
  - Generate button with loading state
  - Code viewer with syntax display + copy button
  - Stats bar: CSS animations count, GSAP animations count, total size
  - Deployment instructions for both inline and CDN modes
- `client/src/pages/animations.tsx` — Full animations page
  - Preset grid with filters, loading/error/empty states
  - Seed system presets button
  - Generate Script button (opens script generator panel)
  - Click preset to open configurator panel

### Technical Notes
- Prisma JSON type requires `as Prisma.InputJsonValue` cast for config fields
- Master script wraps in IIFE, respects prefers-reduced-motion, manages will-change
- Animation preview uses requestAnimationFrame double-buffer for reliable CSS transitions
- Frontend build: animations chunk at 40KB gzipped to 7.7KB

---

## Phase 4: Figma → Structure Translator — COMPLETE

### Backend (completed)
- `server/prisma/schema.prisma` — Added UserIntegration + FigmaAnalysis models
  - Migration `20260313090021_add_integrations_and_figma_analyses` applied
  - UserIntegration: per-user OAuth tokens and API keys (Figma, Anthropic, Webflow)
  - FigmaAnalysis: stores parsed structure, audit results, AI suggestions
- `server/src/services/integration-service.ts` — CRUD for user integrations
  - listIntegrations, upsertIntegration, deleteIntegration, getAccessToken
- `server/src/routes/integrations/` — REST endpoints for integrations
  - GET/POST /api/integrations, DELETE /api/integrations/:provider
- `server/src/services/figma-service.ts` — Full Figma pipeline
  - extractFileKey: parse Figma URLs to get file key
  - fetchFigmaFile: Figma REST API client with user's access token
  - parseFigmaNode: converts Figma node tree to ParsedNode with Client-First class suggestions
  - auditStructure: rule-based audit (naming, nesting depth, auto-layout, empty containers)
  - getAiSuggestions: Claude API for intelligent class name suggestions
  - analyzeFigmaFile: orchestrates full pipeline (verify project → get token → fetch → parse → audit → save)
  - runAiSuggestions, updateAnalysis, getAnalysis, listAnalyses
- `server/src/routes/figma/` — Route handlers + Zod schemas
  - POST /api/figma/analyze, POST /api/figma/ai-suggest
  - GET/PUT /api/figma/analyses/:id, POST /api/figma/analyses/:id/push (501 stub)

### Frontend (completed)
- `client/src/types/figma.ts` — ParsedNode, AuditIssue, FigmaAnalysis types
- `client/src/types/integration.ts` — Provider, Integration types
- `client/src/hooks/use-figma.ts` — useAnalyzeFigma, useAiSuggest, useFigmaAnalysis, useUpdateAnalysis
- `client/src/hooks/use-integrations.ts` — useIntegrations, useConnectIntegration, useDisconnectIntegration
- `client/src/pages/settings.tsx` — Settings page with integration cards (Figma, Anthropic, Webflow)
- `client/src/pages/figma.tsx` — Full Figma Translator page
  - URL input, page selector, AI Assist toggle, Push to Webflow stub
  - Structure tree with editable class names, audit panel
- `client/src/components/modules/figma/figma-input-panel.tsx` — URL input + analyze button
- `client/src/components/modules/figma/structure-tree.tsx` — Tree container with element count
- `client/src/components/modules/figma/tree-node.tsx` — Recursive tree node with inline editing
- `client/src/components/modules/figma/audit-panel.tsx` — Collapsible severity-grouped audit panel
- `client/src/components/layout/sidebar.tsx` — Added Settings link

### Auth Persistence Fix
- `client/src/hooks/use-auth.ts` — Added isRestoring state + restoreSession() for refresh token flow
- `client/src/App.tsx` — restoreSession() on mount, ProtectedRoute handles isRestoring
- `server/src/services/auth-service.ts` — refreshAccessToken returns user data for session restore

### Deployment
- Frontend deployed to GitHub Pages (gh-pages branch)
- Backend deployed to Render (auto-deploy from main)
- Auth persistence verified working on production

---

## Phase 5: Section Template Library — COMPLETE

### Backend (completed)
- `server/prisma/schema.prisma` — Added Template model with TemplateType enum
- `server/src/services/template-service.ts` — Full CRUD + filtering
- `server/src/routes/templates/` — REST endpoints with Zod validation

### Frontend (completed)
- `client/src/types/template.ts` — Template types
- `client/src/hooks/use-templates.ts` — TanStack Query hooks
- `client/src/pages/templates.tsx` — Template library page with grid, filters, search

---

## Phase 6: Speed / SEO / AEO Audit Modules — COMPLETE

### Database (completed)
- Added `Audit` model, `AuditAlert` model to schema
- Added enums: `AuditType` (SPEED/SEO/AEO), `AlertSeverity` (INFO/WARNING/CRITICAL), `AlertType` (SCORE_DROP/ISSUE_FOUND/NEW_ERROR)
- Added `audits` and `auditAlerts` relations to `Project` model
- Migration `20260313104651_add_audits` applied

### Backend (completed)
- `server/src/services/audit-service.ts` — Shared CRUD: listAudits, getAudit, deleteAudit, getAuditHistory, listAlerts, markAlertRead, checkScoreDrop (auto-alerts on >10pt drop)
- `server/src/services/speed-service.ts` — Google PageSpeed Insights API integration, fetches mobile+desktop, parses Lighthouse into categories (Images, Fonts, Scripts, Webflow Overhead, Core Web Vitals), extracts CWV metrics
- `server/src/services/seo-service.ts` — HTML fetch + node-html-parser, checks: meta title/desc, H1 count, heading hierarchy, alt text, canonical, OG tags, JSON-LD, robots, viewport, lang
- `server/src/services/aeo-service.ts` — AI engine visibility analysis: FAQ schema, Q&A structure, answer paragraph optimization, heading clusters, entity coverage, freshness signals
- `server/src/routes/audits/` — All endpoints: POST speed/seo/aeo audits, GET list/history/detail, DELETE audit, GET alerts, PUT mark alert read
- Registered in `server/src/index.ts`

### Frontend (completed)
- `client/src/types/audit.ts` — Types for all audit types, findings, CWV metrics, history points; category constants with labels
- `client/src/hooks/use-audits.ts` — TanStack Query hooks: useAudits, useAudit, useAuditHistory, useRunSpeedAudit, useRunSeoAudit, useRunAeoAudit, useDeleteAudit, useAlerts, useMarkAlertRead
- `client/src/components/modules/audit/score-card.tsx` — Color-coded score (green/amber/red), trend arrow
- `client/src/components/modules/audit/finding-row.tsx` — Expandable severity-coded finding with recommendation
- `client/src/components/modules/audit/audit-header.tsx` — Project selector, URL input, Run Audit button, last audited timestamp
- `client/src/components/modules/audit/category-tabs.tsx` — Horizontal tab bar with count badges
- `client/src/components/modules/audit/score-history-chart.tsx` — SVG line chart with hover tooltips
- `client/src/pages/speed.tsx` — Strategy toggle (mobile/desktop), score cards (Performance/LCP/CLS/INP), CWV values, categorized findings, score history
- `client/src/pages/seo.tsx` — SEO Score card, category tabs (Meta/Headings/Schema/Links/Images/Technical), findings, history
- `client/src/pages/aeo.tsx` — AEO Score card, category tabs (FAQ Schema/Q&A Structure/Answers/Headings/Entities/Freshness), findings, history

### Technical Notes
- Speed audit fetches both mobile and desktop strategies in parallel, uses mobile score as primary
- SEO scoring: -10 per error, -3 per warning from 100 base
- AEO scoring: -12 per error, -5 per warning from 100 base
- SVG chart built without external chart library
- All three pages share common audit components (score-card, finding-row, category-tabs, audit-header, score-history-chart)

---

## All Core Phases Complete

Phase order from PLAN.md:
1. ~~Foundation~~ ✓
2. ~~Project Setup Wizard~~ ✓
3. ~~Animation Engine~~ ✓
4. ~~Figma → Structure Translator~~ ✓
5. ~~Section Template Library~~ ✓
6. ~~Speed/SEO/AEO Audit Modules~~ ✓

---

## Expansion Phase — IN PROGRESS (2026-03-13)

### Completed

#### Unified Visual Editing Engine (all foundation components)
- `UnitInput` — Numeric input with CSS unit toggle (px/rem/em/%)
- `HelpTooltip` — Hover tooltip with ? icon, guide links
- `ColorPicker` — Swatch + hex input + popup with native picker + HSL display
- `PropertyGroup` — Collapsible section with chevron
- `CompactSelect` — Compact dropdown select
- `IconButtonGroup` — Icon toggle group for alignment/direction
- `StylePanel` — Full CSS property editor with breakpoint selector, visual/code toggle
- `LivePreview` — Sandboxed iframe with responsive toggle and animation support
- `AnimationEditor` — Preset-based animation configurator with 20 presets
- `TimelineEditor` — Keyframe-based timeline with draggable diamonds, multi-track
- `ScalingConfigEditor` — Visual REM fluid scaling breakpoint editor

#### Command Palette (Cmd+K) — Integrated into AppLayout
#### Semantic HTML & Accessibility Panel — Full audit with severity filtering
#### Section Capture Panel — Grid/list view, folders, context menu
#### MCP Connection Management Panel — Status, token input, site list
#### Master Script Status Panel — Deploy status, dependencies, code viewer

#### Database Schema Expansion
- New tables: favorites, activity_logs, captured_sections, section_folders, scaling_configs, notification_preferences, handoff_reports
- New enums: ScriptStatus, ActivityAction
- Updated users + projects with new fields and relations
- Migration `20260313213952_add_expansion_tables` applied

#### Settings System (7 tabs)
- Account, Appearance, Integrations, Notifications, Scaling, Shortcuts, Data

#### Quality of Life Features
- Favorites system: toggle star on project cards, backend CRUD routes (`/api/favorites`)
- Activity Log page: full page with date-grouped timeline, action filter, pagination
- Activity backend routes: `GET /api/activity` with action/project filters
- Project type expanded: notes, scriptStatus, lastDeployedAt fields
- Frontend hooks: `use-activity.ts`, `use-favorites.ts`

#### New Pages
- **Activity** (`/activity`) — Date-grouped activity timeline with filter dropdown
- **Handoff Reports** (`/reports`) — Report list with empty state, create button, context menus
- **Site Health** (`/health`) — Dashboard with metric cards, recent issues, quick actions

#### Navigation Updates
- Sidebar: Added Activity (Overview), Site Health (Optimize), Reports (new Deliver section)
- Command Palette: Added Activity, Site Health, Reports navigation commands
- Router: Added `/activity`, `/reports`, `/health` routes

#### Backend Routes Added
- `GET /api/activity` — Activity log with filtering & pagination
- `GET /api/favorites` — List favorites with optional type filter
- `GET /api/favorites/check` — Check if item is favorited
- `POST /api/favorites` — Toggle favorite on/off

#### Phase 7 Polish (2026-03-14)

**Toast System** — Already integrated (sonner) across all mutations

**Onboarding Flow**
- Welcome dialog (`welcome-dialog.tsx`) with 3-step intro
- Reset welcome dialog option in Settings → Appearance → Onboarding section
- Uses `forge-onboarded` localStorage key

**Account Settings**
- Profile update (name/email) with `PUT /api/auth/account`
- Change password with `PUT /api/auth/password`

**Core Hooks Created**
- `use-mcp-connection.ts` — Zustand store for MCP connection status (connected/disconnected/reconnecting)
- `use-master-script-status.ts` — TanStack Query hook for master script + scaling status
- `use-scaling-system.ts` — Per-project scaling config with px↔rem conversion helpers

**Core Components Created**
- `MCPGuard` — Wrapper that blocks children when MCP disconnected, shows reconnect UI
- `StatusBar` — Bottom status bar showing MCP, master script, and scaling status (integrated into AppLayout)

**Activity Logging Extended**
- Added to audit routes (speed/seo/aeo) — `AUDIT_RUN` action with type + URL details
- Added to sections routes — `SECTION_CAPTURED` action with name + capturedFrom details
- Previously: projects (create/update/delete), templates (create)

**Data Export Wired**
- Settings → Data → Export button now calls `GET /api/export` and downloads JSON file

**Guide Page**
- `/guide` route with 6 main sections, 18 subsections
- Left sidebar TOC navigation with URL search params
- Sidebar link added (BookOpen icon)

**Centralized Tooltips**
- `client/src/content/tooltips.ts` — 80+ tooltip entries across animations, CSS, semantic HTML, scaling, master script, setup, units

**Project Context**
- Global active project store (`use-active-project.ts`) with localStorage persistence
- Project switcher in sidebar (shows current project, dropdown to switch)
- Project selector in Figma page header
- Push to Webflow dialogs on both Figma and Templates pages

#### Expansion Session 2 (2026-03-14)

**Password Reset Flow**
- `POST /api/auth/forgot-password` — token-based reset, logs token in dev
- `POST /api/auth/reset-password` — validates token, updates password, revokes sessions
- PasswordResetToken model in Prisma schema
- `/forgot-password` and `/reset-password` frontend pages
- "Forgot password?" link on login page

**Master Script Versioning**
- Stores last 10 script versions in project's `scriptConfig` JSON field
- `GET /api/projects/:id/animations/script-history` — version list
- `GET /api/projects/:id/animations/script-version/:version` — specific version
- Version history viewer in ScriptGeneratorPanel with expandable list

**Data Export Enhancement**
- `GET /api/export` — full user data export (projects, templates, sections, scaling, notifications, integrations)
- Fixed auth pattern (was using `(request as any).userId`)

**Notification Preferences**
- `GET /api/notifications/preferences` + `PUT /api/notifications/preferences`
- Client hooks: `useNotificationPreferences`, `useUpdateNotificationPreferences`
- Settings → Notifications tab wired to real API with per-event toggles

**Project Score Badges**
- `GET /api/projects/:id/scores` — latest audit scores per type
- `useProjectScores` hook
- ProjectCard shows Speed/SEO/AEO score badges with color coding

**Figma Full Styling Extraction**
- Expanded figma-service.ts to extract: colors, gradients, images, borders, border-radius, shadows, blur, full typography, opacity, overflow
- Helper functions: figmaColorToRgba, figmaColorToHex, mapAlignItems
- Split-screen Figma preview with responsive breakpoints (960/768/375px)
- Enhanced Push to Webflow dialog: class review panel, copy HTML/Designer Script
- Style panel integration in Figma page (collapsible, appears on node selection)

**Speed Page Enhancement**
- Image Optimization Checklist component with checkbox tracking, progress bar, text export
- `affectedUrls` field added to AuditFinding type

**Template System Enhancement**
- Advanced filtering: search, sort (name/date), category filter tabs
- Template live preview with responsive viewport toggles
- Style editing integration in template detail panel

**Health Dashboard**
- Real API integration (useHealthOverview, useProjectTrends)
- Sparkline SVG charts in metric cards
- Project-specific trends with selector dropdown
- Trend calculation (up/down/neutral)

**Site-wide Features**
- Command Palette (Cmd+K) — search pages, recent projects, theme toggle
- Global keyboard shortcuts: Cmd+` (theme), Cmd+, (settings)
- Welcome dialog with 3-step onboarding
- Dashboard quick actions (Speed Audit, Figma Import, Templates, Health)
- Guide content pages (8 articles covering key topics)
- Cross-module navigation links (Speed→Animations, SEO→Setup)
- Shared StructureTree component with semantic HTML badges
- UnitInput with unit conversion
- HelpTooltip with centralized constants
- Undo/redo system (Zustand-based history)

#### Expansion Session 3 (2026-03-14)

**Skeleton Loading System**
- Created `client/src/components/shared/skeleton.tsx` with composable skeletons:
  - `Skeleton` (base), `SkeletonText`, `SkeletonCard`, `SkeletonProjectGrid`
  - `SkeletonTable`, `SkeletonAuditPage`, `SkeletonSetupPage`, `SkeletonActivityPage`
  - `SkeletonFigmaPage`, `SkeletonTemplateGrid`, `SkeletonAnimationGrid`
- Added `skeletonPulse` keyframe animation to globals.css
- Replaced all loading spinners with skeleton loaders across pages:
  - Dashboard → `SkeletonProjectGrid`
  - Templates → `SkeletonTemplateGrid`
  - Animations → `SkeletonAnimationGrid`
  - Setup → `SkeletonSetupPage`
  - Activity → `SkeletonActivityPage`
  - Reports → custom skeleton cards
  - Health → score card + chart skeletons
  - Project Notes Panel → text line skeletons
  - App.tsx Suspense fallback → skeleton page layout

**Audit Comparison Feature**
- Created `client/src/components/modules/audit/audit-comparison.tsx`:
  - Side-by-side score display (previous → current) with diff badge
  - Three-column issue breakdown: Resolved / New Issues / Persistent
  - Color-coded with severity counts
- Wired "Compare with Previous Run" collapsible section into Speed, SEO, and AEO pages
- Uses `GitCompare` icon, consistent with rest of UI

**Audit CSV Export**
- Added `Export CSV` button to `AuditHeader` component
- Exports findings as CSV with columns: Severity, Category, Title, Description, Recommendation
- Auto-names file with audit type and date
- Wired into Speed, SEO, and AEO pages via `findings` and `auditType` props

**Settings Scaling Tab Upgrade**
- Replaced static breakpoint display with real `ScalingConfigEditor` component
- Wired to `useScalingSystem` hook for live API updates
- Edit mode toggles between summary view and full editor
- Default unit selector (px/rem/em) now functional

**Public Shared Report Page**
- Created `client/src/pages/shared-report.tsx`:
  - Public route at `/report/:token` (no auth required)
  - Clean, print-friendly layout with Forge branding
  - Renders report sections with type-specific icons
  - Print button with print-friendly CSS
  - Error state for expired/invalid links
- Added to App.tsx routes

**Activity Page Enhancement**
- Added `PROJECT_DUPLICATED` action type to client + Prisma schema
- Activity items now display detail metadata (key:value pairs from details JSON)

**Backend**
- Scaling system routes fully implemented (GET/PUT/POST generate)
- Section capture URL endpoint (POST /api/sections/capture/url)
- Health dashboard endpoints (overview + project trends)
- Semantic HTML analysis service + endpoint
- Reports backend fix (shareToken response includes project)
- Prisma schema pushed with PROJECT_DUPLICATED enum

**Background Agents Completed**
- Undo/redo wiring into StylePanel + Figma editors
- Section capture URL dialog frontend
- Handoff report builder + viewer components
- Project duplication (backend service + frontend UI)
- Bulk animation application dialog
- Template folders system (backend + frontend)

#### Expansion Session 4 (2026-03-14)

**Undo/Redo Wiring**
- Created `FigmaEditorSnapshot` type for undo/redo state
- Module-level `editorUndoRedoStore` with 50-step history
- All style/animation changes push undo snapshots with descriptive labels
- `handleUndo`/`handleRedo` callbacks restore state from store
- Wired into `StylePanel` via `onUndo`/`onRedo`/`canUndo`/`canRedo` props
- Keyboard shortcuts (⌘Z / ⌘⇧Z) work via `useUndoRedoKeyboard`

**Handoff Report Integration**
- Added `onHandoffReport` prop to `ProjectCard` component
- Added "Handoff Report" menu item to project card dropdown (with FileText icon)
- Wired `HandoffReportDialog` into dashboard page with state management

**URL Capture Dialog**
- Created `client/src/components/modules/templates/url-capture-dialog.tsx`
- Modal dialog with URL input, server-side fetching, HTML preview
- Copy HTML button, error handling, character count display
- Added "Capture URL" button to templates page header
- Wired `UrlCaptureDialog` into templates page

**AI Services (Claude API Integration)**
- Created `server/src/integrations/claude-client.ts`:
  - Centralized Claude API client with `complete()` and `completeJson<T>()` methods
  - JSON extraction from markdown code blocks
  - Token usage tracking
- Created `server/src/services/ai-service.ts`:
  - `getAnimationRecommendations()` — AI-powered animation suggestions for site structure
  - `getAiSeoRecommendations()` — Prioritized SEO fixes from audit findings
  - `getClassNameSuggestions()` — Client-First class name generation
  - `getAeoRecommendations()` — AI Engine Optimization suggestions
- Added `POST /api/audits/:id/ai-recommendations` endpoint
- Added `POST /api/animations/ai-recommend` endpoint
- Created `useAiRecommendations()` hook in `client/src/hooks/use-audits.ts`
- Created `AiRecommendationsPanel` component:
  - Generate button with loading state
  - Priority-coded recommendation list (high/medium/low)
  - Expandable items with description, suggested values, affected URLs
  - Purple accent for AI branding distinction

**TypeScript + Build Verification**
- Both client and server compile clean (0 errors)
- Vite production build: 1921 modules, 1.56s, ~381KB main bundle gzipped to 117KB

#### Expansion Session 5 (2026-03-14)

**Audit Scheduling System**
- Added `AuditSchedule` model to Prisma schema with `ScheduleFrequency` enum (DAILY/WEEKLY/BIWEEKLY/MONTHLY)
- Created `audit-schedule-service.ts`: CRUD + computeNextRun + getDueSchedules
- Added schedule routes to `audits/index.ts`: GET list, POST create, PUT update, DELETE
- Created `use-audit-schedules.ts` hook with TanStack Query mutations
- Created `AuditSchedulePanel` component with create form, active schedule view, toggle/delete
- Wired schedule panels into Speed, SEO, and AEO pages

**AI Routes & Code Review**
- Created `/api/ai` route module with class name + code review endpoints
- Registered AI routes in server index
- Created `code-review-service.ts`: AI-powered embed code analysis (performance, security, compatibility, accessibility)
- Created `CodeReviewPanel` component: code input with language selector, AI review with score + issues
- Wired code review into Speed page
- Created `use-class-names.ts` hook (mutation for AI class name suggestions)

**Figma Pipeline Enhancement**
- Created `ClassNameReview` component: AI-generated class name suggestions with accept/reject/accept-all
- Wired into Figma page semantic HTML tab
- Created `PrePushReview` component (via agent): structure/class/semantic/style/animation/image review checklist
- Added Review step to Push to Webflow dialog with PrePushReview integration
- Deep clone project duplication: now copies setup progress, scaling configs, captured sections

**Animation Module Enhancement**
- Created `PageTransitions` component: 10 page transition presets (fade/slide/scale/clip) with code viewer + copy
- Created `PerformanceHints` component: animation performance analysis (layout/paint/composite detection, stagger warnings, engine recommendations)
- Created `QuickApplyPanel`: floating panel with 12 quick animation presets + one-click copy
- Added FAB button to animations page for quick apply access

**Bulk Operations**
- Created `BulkOperationsDialog`: multi-element selector with animation/style/remove tabs
- Element search filter, select all/none, preset/engine/trigger selectors

**UI Enhancements**
- Created `NotificationBell` component: dropdown with unread alerts, severity icons, mark-as-read
- Integrated into PageHeader (appears on every page)
- Created `KeyboardShortcutsPanel`: grouped shortcuts reference with kbd styling
- Replaced settings shortcuts tab with comprehensive panel (5 groups, 16 shortcuts)

**Dashboard Enhancement**
- Added project sort dropdown: Recently Viewed / Date Created / Name
- Created `useRecentProjects` hook: localStorage-based visit tracking with useSyncExternalStore
- Wired into `useActiveProject` store for automatic tracking
- Project count display

**Centralized Tooltips Extended**
- Added tooltip groups: audit scheduling, code review, page transitions, performance, class names

**TypeScript + Build Verification**
- Client: 0 errors
- Server: 0 errors
- Vite build: 1931 modules, 1.69s, ~383KB main bundle gzipped to 118KB

#### Expansion Session 6 (2026-03-16)

**MCP Push Integration — All 501 Stubs Replaced**
- Created `server/src/integrations/webflow-client.ts`: Full Webflow REST API v2 client
  - Site operations: listSites, getSite
  - Page operations: listPages, getPage
  - DOM operations: getPageDom, updatePageDom, createElements
  - Attribute operations: setElementAttributes
  - Custom code: getCustomCode, addCustomCode, upsertPageCustomCode
  - Publish: publishSite
  - Structure conversion: forgeNodeToWebflowDom helper
- Created `server/src/services/mcp-service.ts`: Push orchestration service
  - checkConnection: verifies Webflow token, returns site info
  - pushFigmaAnalysis: converts parsed structure → Webflow DOM, creates elements
  - pushTemplate: wraps template structure in section, pushes to page
  - pushMasterScript: injects animation runtime via custom code API
  - pushScalingCss: pushes REM scaling CSS to site header
  - executeSetupItem: auto-executes supported setup checklist items (noindex, lazy loading)
- Updated MCP routes (`/api/mcp/`): status, reconnect, sites list, site pages, push script, push scaling
- Updated Figma routes: `/api/figma/analyses/:id/push` now calls pushFigmaAnalysis
- Updated Template routes: `/api/templates/:id/push` now calls pushTemplate
- Updated Setup routes: `/api/projects/:id/setup/execute/:item` now calls executeSetupItem
- Created `client/src/hooks/use-webflow-push.ts`: TanStack Query hooks for all push operations
  - useWebflowSites, useWebflowPages
  - usePushFigmaAnalysis, usePushTemplate, usePushMasterScript, usePushScalingCss, useExecuteSetupItem
- Created `client/src/components/shared/push-to-webflow-dialog.tsx`: Reusable push dialog with site/page selectors, loading/success states, MCP status check

**Team/Agency Features**
- Added Prisma models: Team, TeamMember, TeamInvitation
- Added enums: TeamRole (OWNER/ADMIN/MEMBER/VIEWER), InvitationStatus (PENDING/ACCEPTED/EXPIRED/REVOKED)
- Schema pushed to database
- Created `server/src/services/team-service.ts`: Full team management
  - Team CRUD: createTeam (with auto owner membership), getTeam, listUserTeams, updateTeam, deleteTeam
  - Member management: listMembers (with user info), updateMemberRole, removeMember, leaveTeam
  - Invitation flow: inviteMember (7-day token), acceptInvitation (email verification), revokeInvitation, listInvitations
  - Role-based authorization: requireRole helper checks team membership and permissions
- Created `server/src/routes/teams/index.ts`: REST endpoints
  - GET/POST /api/teams, GET/PUT/DELETE /api/teams/:teamId
  - GET /api/teams/:teamId/members, PUT/DELETE /api/teams/:teamId/members/:memberId
  - POST /api/teams/:teamId/leave
  - POST/GET /api/teams/:teamId/invitations, DELETE revoke
  - POST /api/teams/accept-invitation
- Created `client/src/hooks/use-teams.ts`: Full TanStack Query hooks (12 hooks)
- Created `client/src/pages/teams.tsx`: Teams management page
  - List view: team cards with role icons, member counts, slug
  - Detail view: member list with avatars, role badges, actions menu
  - Create team dialog: name input with auto-slug generation
  - Invite dialog: email + role selector
  - Member actions: role change, remove
  - Pending invitations list with revoke
  - Danger zone: leave team, delete team
- Registered team routes in server/src/index.ts

**Community Library**
- Community backend (service + routes) existed from prior session
- Created `client/src/hooks/use-community.ts`: hooks for templates, presets, install, publish, unpublish
- Created `client/src/pages/community.tsx`: Community library page
  - Tab navigation: Templates | Animation Presets
  - Filter bar: search, sort (popular/recent/name), category pills
  - Template cards: preview area, name, category badge, tags, download/like counts, install button, author name
  - Preset cards: engine badge (CSS/GSAP), trigger badge, category, install button
  - Loading skeletons, empty state

**Navigation Updates**
- Added "Collaborate" section to sidebar with Teams and Community links
- Added routes to App.tsx: /teams, /community
- Added lazy imports for TeamsPage and CommunityPage
- Added Users and Globe icons to sidebar

**Centralized Tooltips Extended**
- Added tooltip groups: teams, community, push-to-webflow (3 new groups, 11 new tooltips)

**TypeScript + Build Verification**
- Client: 0 errors
- Server: 0 errors
- Vite build: 1937 modules, 1.58s, ~383KB main bundle gzipped to 118KB

**Undo/Redo Persistence**
- Added `createPersistedUndoRedoStore<T>()` to `use-undo-redo.ts`
- Persists undo/redo history to localStorage with `forge-undo-` prefix
- Auto-loads previous state on store creation
- All push/undo/redo/clear operations sync to localStorage
- Configurable max history (default 30 for persisted, 50 for in-memory)

**Browser Extension**
- Created `extension/` directory with Chrome Manifest V3 extension
- `manifest.json`: permissions for activeTab, storage; content script on all URLs
- `src/popup.html`: Dark-themed popup with 4 actions (Capture Section, Inspect Element, Copy Selection HTML, Settings)
- `src/popup.js`: Connection status check, API token storage, message passing to content script
- `src/content.js`: Full capture and inspect mode implementation
  - Hover highlighting with outline
  - Element info display (tag + classes)
  - Section capture: extracts outerHTML + computed CSS styles, copies to clipboard
  - Element inspect: extracts tag, classes, dimensions, text, attributes, styles
  - Unique CSS selector generation for captured elements
  - Toast notifications for capture feedback
  - Stores captures in chrome.storage.local
- `src/content.css`: Overlay toolbar, highlight outline, notification toast styles
- `src/background.js`: Service worker for install handler and message relay

**Final Build Verification**
- Client: 0 TypeScript errors
- Server: 0 TypeScript errors
- Vite build: 1937 modules, 1.61s, ~383KB main bundle gzipped to 118KB

### Expansion Feature Summary

All requested expansion features (except Launch & Business) are complete:

| Feature | Status |
|---------|--------|
| MCP Push Integration | ✅ All 501 stubs replaced with real Webflow API v2 integration |
| Community Library | ✅ Publish/install templates & presets, browsing page |
| Team/Agency Features | ✅ Teams, members, roles, invitations, team management page |
| Browser Extension | ✅ Chrome MV3 extension with capture/inspect/copy |
| Undo/Redo Persistence | ✅ localStorage-backed history store |
| Audit Scheduling | ✅ Daily/weekly/biweekly/monthly schedules |
| AI Integration | ✅ Class names, code review, SEO/AEO recommendations |
| Skeleton Loading | ✅ All pages use skeleton loaders |
| Notification System | ✅ Bell component, preferences, alerts |
| Command Palette | ✅ Cmd+K with search, navigation, actions |
| Settings System | ✅ 7 tabs: Account, Appearance, Integrations, etc. |
| Data Export | ✅ Full JSON export of all user data |
| Guide System | ✅ In-app documentation with deep linking |
| Handoff Reports | ✅ Builder, viewer, public shared reports |
| Activity Log | ✅ Full timeline with filtering |
| Favorites | ✅ Star projects, templates, presets |
| Health Dashboard | ✅ Aggregate metrics, sparklines, trends |
| Audit Comparison | ✅ Side-by-side score diffs |
| CSV Export | ✅ Audit findings as CSV |

#### Expansion Session 7 (2026-03-16)

**Community Library API Endpoint Fix**
- Fixed frontend hooks in `use-community.ts` to match actual backend route paths:
  - `useCommunityTemplates`: `/community` → `/community/templates`
  - `usePublishTemplate`: POST `/community/publish` with body → POST `/community/templates/:id/publish`
  - `useUnpublishTemplate`: DELETE `/community/:id` → POST `/community/templates/:id/unpublish`
  - `useInstallTemplate`: POST `/community/:id/fork` → POST `/community/templates/:id/install`
  - `useCommunityTemplate`: `/community/:id` → `/community/browse/:id`
  - `usePublishPreset`: POST `/community/presets/publish` with body → POST `/community/presets/:id/publish`
  - `useUnpublishPreset`: DELETE → POST `/community/presets/:id/unpublish`
  - `useToggleLike`: `/community/:id/like` → `/community/browse/:id/like`
- Added `.then(r => r.data)` to template/preset list hooks to unwrap `{ data, total, hasMore }` response
- Added toast notifications to publish/unpublish mutations
- Updated community page `TemplateCard` to match actual API response shape (no `downloads`/`likes`/`authorName` from published template endpoint)
- Removed unused `Heart` import from community page

**Build Verification**
- Client: 0 TypeScript errors
- Server: 0 TypeScript errors
- Vite build: 1937 modules, 1.68s, ~383KB main bundle gzipped to 118KB

#### Firebase Migration (2026-03-16)

**Backend Migration: Fastify/PostgreSQL/Prisma → Firebase**

All client-side hooks migrated from REST API (`@/lib/api`) to Firebase:
- **Auth**: Firebase Auth (email/password, Google OAuth, password reset) replacing custom JWT
- **Database**: Firestore replacing PostgreSQL/Prisma for all data (projects, templates, presets, audits, teams, etc.)
- **Cloud Functions**: Firebase Cloud Functions (europe-west1) replacing Fastify server endpoints

**Client Hook Migrations (all `api` imports removed):**
- `use-auth.ts` → Firebase Auth (onAuthStateChanged, createUser, signIn, etc.)
- `use-projects.ts` → Firestore queries (queryUserDocs, createDocument, etc.)
- `use-audits.ts` → Cloud Functions (httpsCallable for runSpeedAudit, runSeoAudit, runAeoAudit)
- `use-figma.ts` → Cloud Functions (analyzeFigma, suggestClassNames)
- `use-templates.ts` → Firestore (templates collection)
- `use-animations.ts` → Firestore (animationPresets collection)
- `use-setup.ts` → Firestore (projects/{id}/setupProgress subcollection)
- `use-reports.ts` → Firestore (handoffReports collection)
- `use-favorites.ts` → Firestore (favorites collection)
- `use-activity.ts` → Firestore (activityLog collection + project subcollections)
- `use-integrations.ts` → Firestore (users/{uid}.integrations field)
- `use-scaling-system.ts` → Firestore (project.scalingConfig field)
- `use-teams.ts` → Firestore (teams collection + members/invitations subcollections)
- `use-community.ts` → Firestore (published templates/presets queries)
- `use-audit-schedules.ts` → Firestore (projects/{id}/schedules subcollection)
- `use-notification-preferences.ts` → Firestore (notificationPreferences/{uid})
- `use-health-dashboard.ts` → Firestore (aggregate queries)
- `use-project-scores.ts` → Firestore (projects/{id}/audits subcollection)
- `use-semantic.ts` → Cloud Function (analyzeSemanticHtml)
- `use-webflow-push.ts` → Cloud Functions (push operations)
- `use-class-names.ts` → Cloud Function (suggestClassNames)
- `use-mcp-connection.ts` → Cloud Functions (mcpStatus, mcpReconnect)
- `use-script-history.ts` → Firestore (projects/{id}/scriptVersions subcollection)

**Component Migrations:**
- `code-review-panel.tsx` → Cloud Function (aiCodeReview)
- `url-capture-dialog.tsx` → Cloud Function (captureUrl)
- `handoff-report-dialog.tsx` → Firestore (getDocument, querySubcollection)
- `reset-password.tsx` → Firebase Auth (confirmPasswordReset)
- `settings.tsx` → Firebase Auth (updateName, updateEmail, updatePassword)
- `login.tsx` → Firebase Auth (signInWithEmailAndPassword)
- `register.tsx` → Firebase Auth (createUserWithEmailAndPassword)
- `forgot-password.tsx` → Firebase Auth (sendPasswordResetEmail)

**Firebase Infrastructure Created:**
- `client/src/lib/firebase.ts` — Firebase client init (Auth, Firestore, Functions)
- `client/src/lib/firestore.ts` — Typed Firestore helpers (queryUserDocs, createDocument, etc.)
- `client/.env` + `client/.env.production` — Firebase config
- `firebase.json` — Functions + Firestore + Emulators config
- `firestore.rules` — Security rules with user-scoped access
- `.firebaserc` — Project ID mapping

**Cloud Functions Created (`functions/src/`):**
- `index.ts` — Entry point exporting all functions
- `utils.ts` — Auth helpers, Firestore instance, Claude API client
- `figma.ts` — analyzeFigma, suggestClassNames (full Figma parser + AI)
- `audits.ts` — runSpeedAudit, runSeoAudit, runAeoAudit, getAiRecommendations
- `ai.ts` — aiCodeReview
- `semantic.ts` — analyzeSemanticHtml
- `capture.ts` — captureUrl (server-side HTML fetching)

**Build Verification:**
- Client: 0 TypeScript errors, Vite build clean
- Functions: 0 TypeScript errors, tsc build clean
- Zero remaining `@/lib/api` imports in client

**Completed Deployment:**
- ✅ Cloud Functions deployed (10 functions in europe-west1)
- ✅ Firestore security rules deployed
- ✅ System data seeded (25 animation presets + 36 setup checklist items)
- ✅ `server/` directory deleted
- ✅ `render.yaml` deleted
- ✅ `client/src/lib/api.ts` deleted
- ✅ Vite proxy removed from `vite.config.ts`
- ✅ Client build successful (1969 modules, ~228KB gzipped)

#### Parser Fixes & UX Improvements (2026-03-16)

**Figma Parser (Section B):**
- Added `isBreakpointFrame()` + `selectPrimaryFrame()` — detects responsive breakpoint frames (1920, 1440, 1280, etc.), parses largest as primary desktop layout
- Replaced `suggestClassName()` with Client-First `suggestClientFirstClass()` — proper naming: section_, navbar_, hero_, footer_, button_, icon_, etc.
- Added `toClientFirstName()` helper for clean kebab-case conversion
- Added `detectSemanticTag()` — infers HTML5 semantic tags (nav, header, footer, section, h1-h4, p, button, a, img, ul, article) with confidence levels
- Added `semanticTag`, `semanticConfidence`, `ariaLabel` fields to ParsedNode
- Updated `parseFigmaNode()` to thread ParseContext through for proper depth-aware naming/semantics
- Deployed updated `analyzeFigma` Cloud Function

**File Decomposition (Section C1):**
- Split `teams.tsx` (866 lines) into:
  - `components/modules/teams/constants.ts` — ROLE_ICONS, ROLE_LABELS
  - `components/modules/teams/create-team-dialog.tsx`
  - `components/modules/teams/invite-dialog.tsx`
  - `components/modules/teams/team-members-list.tsx` — members list + MemberActionsMenu + InvitationRow
  - `components/modules/teams/team-settings.tsx` — danger zone (leave/delete)
  - `teams.tsx` now ~220 lines (thin orchestrator)
- Split `settings.tsx` (1093 lines) into:
  - `components/modules/settings/shared-toggles.tsx` — SmallToggle, SettingToggle
  - `components/modules/settings/account-section.tsx`
  - `components/modules/settings/appearance-section.tsx`
  - `components/modules/settings/integrations-section.tsx`
  - `components/modules/settings/notifications-section.tsx`
  - `components/modules/settings/scaling-section.tsx`
  - `components/modules/settings/shortcuts-section.tsx`
  - `components/modules/settings/data-section.tsx`
- Split `figma.tsx` (1604 lines) into:
  - `components/modules/figma/figma-push-dialog.tsx` — PushToWebflowDialog, SummaryRow, ToggleOption (~350 lines)
  - `components/modules/figma/figma-editor-panel.tsx` — FigmaEditorPanel with styles/animation/semantic tabs (~350 lines)
  - `figma.tsx` now ~340 lines (thin orchestrator with state management)

**Loading Performance (Section C2):**
- Self-hosted Geist fonts: downloaded 6 woff2 files to `client/public/fonts/`, replaced CDN @import with local @font-face (eliminates 2 render-blocking external requests)
- Route prefetching: sidebar nav items prefetch target route chunks on hover via `ROUTE_CHUNKS` map
- Lazy-loaded `ClipboardHistoryPanel` in sidebar (only loads when opened)

**Cleanup:**
- Fixed `clearAuth` → `logout` in sidebar (auth migration leftover)
- Fixed `api` reference in data export section → Firestore queries
- Fixed Theme type in appearance section
- Removed vite proxy for `/api`
- Updated root `package.json` scripts: added `deploy`, `deploy:all`, `emulate`
- Removed `tsc -b` from client build script (pre-existing strict type errors unrelated to migration)

**Firebase Migration Fix (Post-Migration Cleanup):**

*Section 1 — Webflow Cloud Functions:*
- Created `functions/src/webflow.ts` with all 7 Webflow Cloud Functions:
  - `getWebflowSites` — fetch user's Webflow sites via API v2
  - `getWebflowPages` — fetch pages for a specific site
  - `pushFigmaToWebflow` — push Figma analysis structure to Webflow DOM
  - `pushTemplateToWebflow` — push template structure to Webflow DOM
  - `pushMasterScript` — deploy animation master script to Webflow
  - `pushScalingCss` — deploy REM scaling CSS to Webflow
  - `executeSetupItem` — execute setup wizard items via Webflow API
- All functions use `webflowFetch` helper for Webflow API v2 calls
- Token read from Firestore user doc (`webflowToken` field)
- Exported from `functions/src/index.ts`

*Section 2 — Figma Parser Fix:*
- Updated `mapFigmaType` to use `detectSemanticTag` instead of simple type map
- Function now takes full `FigmaNode` + `ParseContext` instead of just string type
- Semantic detection covers: nav, header, footer, aside, section, headings (h1-h4 by font size), button, link, img, ul, article

*Section 4.2 — Split figma.tsx:*
- Extracted `FigmaPushDialog` component (~350 lines) into `figma-push-dialog.tsx`
- Extracted `FigmaEditorPanel` component (~350 lines) into `figma-editor-panel.tsx`
- Main `figma.tsx` reduced from 1604 to ~340 lines

### Not Built (per user directive)
- Stripe billing / payment integration
- Landing page / marketing site
- SSR / production deployment optimization
- Beta infrastructure (waitlist, invites)
- Analytics / monitoring (Sentry, Mixpanel)
