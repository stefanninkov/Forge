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

## Next: Phase 4+ (Pending)

Phase order from PLAN.md:
1. ~~Foundation~~ ✓
2. ~~Project Setup Wizard~~ ✓
3. ~~Animation Engine~~ ✓
4. Figma → Structure Translator
5. Section Template Library
6. Speed/SEO/AEO Audit Modules
