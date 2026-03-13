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

### Next Up
- Cross-module connections (event bus pattern)
- AI enhancements (Claude API integrations for Figma, templates, audits)
- Animation Engine upgrades (page transitions, performance profiler)
- Figma Pipeline upgrade (enhanced import, component mapping)
- Template Visual Preview (live HTML preview in iframe)
- Section Capture frontend wiring to backend
- Client Handoff Report PDF generation
- Site Health monitoring with trend charts
- Clipboard History Panel
- Bulk Attribute Application
- Template Diff View
- Project Duplication
- Project Notes (rich text)
- Recently Visited tracking
