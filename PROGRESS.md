# Forge — Build Progress

## Phase 1: Foundation — IN PROGRESS

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

### Next Steps (Phase 1 remaining)

1. Install and configure PostgreSQL
2. Run initial Prisma migration
3. Test full auth flow end-to-end
4. Test project CRUD end-to-end
