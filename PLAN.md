# FORGE — Product Architecture & Build Plan

> **Full-pipeline Webflow development accelerator.**
> From Figma design → Structure → Style & Animate → Review & Push to Webflow.

---

## Product Overview

Forge is a web application (with a Phase 2 browser extension) that streamlines every phase of building a Webflow site. It replaces scattered checklists, manual code writing, repetitive copy-pasting, and ad-hoc auditing with a unified, intelligent platform.

### Target User

- **Phase 1:** Solo Webflow developer (Stefan) handling client projects end-to-end.
- **Phase 2:** Webflow developers and agencies via subscription model.

### Core Principles

- **Attribute-first:** Animations and behaviors are driven by HTML `data-` attributes, not Webflow interactions or class-based systems.
- **CSS-first, GSAP-second:** Simple animations use lightweight CSS. GSAP is reserved for complex, scroll-linked, or sequenced animations. The system recommends the right engine.
- **MCP-native:** Deep Webflow MCP integration for pushing structure, reading site state, and monitoring. Not just a code generator — writes directly to Webflow.
- **AI-augmented, not AI-dependent:** Claude API powers intelligent Figma parsing and recommendations. Every AI suggestion is optional and editable. The tool works fully without AI.
- **Client-First aligned:** All generated structure follows Client-First naming convention by default.
- **REM-based:** All sizing and animation values use `rem` units.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React (Vite) | SPA with module-based routing |
| UI Library | Tailwind CSS + shadcn/ui | Consistent, fast UI development |
| Backend | Node.js (Express or Fastify) | API layer, auth, Figma/Webflow proxy |
| Database | PostgreSQL | Projects, templates, audit history, user data |
| Cache | Redis | Session management, audit result caching |
| AI Layer | Anthropic Claude API | Figma file interpretation, structure suggestions |
| Webflow | Webflow MCP + Data API | Push structure, read site, manage CMS |
| Figma | Figma REST API | Read design files, extract tokens, parse layers |
| Speed Audit | Google PageSpeed Insights API | Lighthouse scores, CWV metrics |
| SEO Crawl | Custom Node.js crawler | Site-wide meta, schema, heading, link analysis |
| Auth | Passport.js + JWT | Email/password + Google OAuth |
| Hosting | Vercel (FE) + Railway/Render (BE) | Scalable deployment |

---

## System Architecture

### High-Level Data Flow

```
[Figma API] → Forge Backend → [Claude AI] → Structure Preview UI → [Webflow MCP] → Live Webflow Project
```

### 5-Step Project Workflow

Each project follows a linear pipeline with shared state:

1. **Setup** — Create project, connect Figma/Webflow tokens, configure scaling system
2. **Import** — Paste Figma URL, select pages/frames, run analysis
3. **Structure** — Review/edit element tree, AI suggestions, semantic HTML, audit panel
4. **Style & Animate** — Visual CSS editor, animation presets, timeline, undo/redo
5. **Review & Push** — Responsive preview, class review, image checklist, a11y check, push to Webflow

### Sidebar Navigation

- **Dashboard** — Project cards with step progress indicators
- **Per-project steps** — Setup → Import → Structure → Style → Review (shown when a project is active)
- **Templates** — Section template library (global)
- **Animations** — Animation playground and presets (global)
- **Settings** — Account, appearance, integrations
- **Guide** — In-app documentation

### Module Independence

Each module operates independently but shares data through the project context. A **Forge Project** is the top-level entity:

- A project links to one Webflow site (via MCP)
- A project can link to one or more Figma files
- Templates are global (across all projects) or project-scoped
- Animation configs are per-project (master script generation)

---

## Module 1: Project Setup Wizard

**Purpose:** Interactive, comprehensive checklist that guides every Webflow project from zero to ready-to-build. Combines manual reminders with automated configuration via Webflow MCP.

### Checklist Categories

#### 1.1 SEO Settings
- Turn OFF Webflow subdomain indexing (**CRITICAL** — prevents duplicate content)
- Configure robots.txt
- Enable sitemap auto-generation
- Set canonical tag defaults
- Add default OG image + meta title/description template for all pages

#### 1.2 Publishing & Domain
- Change staging domain to client name
- Turn ON advanced publishing options
- Configure SSL certificate (if custom domain)
- Set up 301 redirect structure (if migrating)

#### 1.3 General Settings
- Upload custom fonts + set `font-display: swap` via embed
- Set favicon & webclip
- Set default language code (en, de, sr, etc.)
- Remove Webflow branding (badge and HTML comment)
- Set timezone if relevant for CMS dates

#### 1.4 Design System Setup
- Add Client-First CSS variables (colors, spacing, typography)
- Build style guide page with all components
- Add global CSS reset/normalize embed
- Set up responsive breakpoint utility classes
- Add `prefers-reduced-motion` base CSS
- Add REM scaling system CSS (Osmo-adapted, four breakpoints)

#### 1.5 Code & Scripts
- Global `<head>`: GTM container placeholder, analytics placeholder
- Global footer: GSAP CDN + plugins (ScrollTrigger, SplitText, Flip, Draggable, Observer)
- Global footer: Lenis smooth scroll (if required)
- Global footer: Forge animation master script (generated per project config)
- Cookie consent system setup
- Security headers via custom code (X-Frame-Options, etc.)

#### 1.6 Pages
- Create and style 404 page
- Create style guide page
- Set up password-protected page (if needed)
- Set up search results page (if applicable)
- Create legal pages (privacy policy, terms, imprint if EU)

#### 1.7 Performance Prep
- Set image compression defaults
- Enable WebP/AVIF serving
- Configure lazy loading for below-fold images
- Preload critical fonts
- Verify no render-blocking custom code in `<head>`

### Automation Levels

Each checklist item is categorized:

- **Auto (MCP):** Forge executes directly via Webflow MCP (code embeds, page creation, variables)
- **Semi-auto:** Forge generates code/config, user confirms (font upload, favicon)
- **Manual:** Reminder with direct link to Webflow setting (domain config, SSL)

### Setup Profiles

Save and reuse setup configurations. Profiles like: Standard Client Site, E-commerce, Landing Page, Portfolio. Each pre-selects relevant items and pre-fills defaults.

---

## Module 2: Figma → Structure Translator

**Purpose:** Takes a Figma design file and translates it into a clean Client-First Webflow class structure, with optional AI-powered interpretation for messy files. Outputs a visual tree that can be edited and pushed to Webflow via MCP.

### 2.1 Input
- Paste Figma file URL or provide Figma file key
- Authenticate via Figma OAuth (one-time setup)
- Select specific page/frame to translate (or entire file)

### 2.2 Figma Audit (Pre-Translation)
Before translating, Forge audits the Figma file and flags:
- Missing auto-layout
- Inconsistent naming (random "Frame 47", "Group 12")
- Rogue fonts outside defined type scale
- Inconsistent spacing values
- Unnecessary nesting
- Missing components (repeated elements that should be instances)

### 2.3 AI Assist (Optional Toggle)
When enabled, Claude API analyzes the Figma JSON and:
- Identifies what each layer represents (hero, nav, card grid, footer, etc.)
- Proposes Client-First class names based on content and purpose
- Suggests proper nesting (section > container > wrapper > content)
- Detects common patterns → maps to known section types
- Flags where animations would typically be applied
- **Cost:** ~$0.01–$0.05 per file analysis (Claude API tokens)

### 2.4 Structure Preview & Editor
Core UI of this module. Displays a visual tree:
- Proposed Webflow element hierarchy
- Client-First class names on each node
- Element type (div, section, heading, image, link, etc.)
- Animation attributes (if pre-assigned)

**Fully editable:** rename classes, re-nest elements, change types, add/remove nodes, assign animation attributes. Drag-and-drop reordering supported.

### 2.5 Push to Webflow
- Choose: push full page or individual sections (per-project preference)
- Webflow MCP creates elements with correct class names, nesting, and attributes
- Elements are empty shells (structure only) — content/styles applied in Designer
- Option to push base styles if template includes them

---

## Module 3: Section Template Library

**Purpose:** Reusable library of section templates with Client-First structure, optional styles, and optional animation attributes. Includes pre-built defaults and custom saved sections.

### 3.1 Pre-Built Templates

| Section | Variants | Notes |
|---------|----------|-------|
| Navbar | Standard, mega-menu, hamburger mobile | Includes mobile toggle logic |
| Hero | Centered, split (text+image), video bg, slider | Animation-ready with data-anim attrs |
| Features/Services | Grid, alternating rows, icon cards | Responsive grid variants |
| Testimonials | Carousel, grid, single featured | Swiper.js integration option |
| FAQ | Accordion, two-column, searchable | Schema-ready structure |
| Pricing | Toggle (monthly/yearly), cards, comparison | GSAP toggle animation included |
| Team | Grid, slider, with popup bios | Splide.js or GSAP slider option |
| CTA | Banner, split, floating | Multiple animation presets |
| Footer | Multi-column, minimal, mega footer | Newsletter form integration |
| Blog List | Grid, list, featured+grid | CMS collection structure included |
| Contact | Form + info, map integration, minimal | Webflow native form or custom |
| Logo Strip | Static grid, infinite marquee | GSAP marquee animation included |

### 3.2 Custom Templates
- Save any section from a Webflow project as a template (via MCP read)
- Save mode: **Skeleton** (structure + attributes only) or **Styled** (structure + attributes + CSS values) — user chooses per template
- Tag with categories, project source, description
- Stored in PostgreSQL with JSON structure data
- Available globally or scoped to specific projects

### 3.3 Animation Pre-Configuration
- Browse and apply animation presets to template elements before pushing
- Preview animations in Forge UI
- Animation attributes pushed alongside structure via MCP

### 3.4 Community Library (Future)
- Publish custom animations and templates to a shared community library
- Other users can browse, preview, and import
- Private by default, publish is explicit opt-in

---

## Module 4: Animation Engine

**Purpose:** Attribute-based animation system that generates CSS and GSAP animations from data attributes on Webflow elements. Includes a master script, visual configurator, recommendation engine, and animation playground.

### 4.1 Two-Tier Architecture

**Tier 1 — CSS Animations (lightweight):**
- fade-in, fade-up, fade-down, fade-left, fade-right
- scale-in, scale-up, scale-down
- slide-up, slide-down, slide-left, slide-right
- rotate-in, blur-in
- Triggered by IntersectionObserver. Uses CSS `@keyframes` + transitions. Sub-1KB per animation. No external dependency.

**Tier 2 — GSAP Animations (complex):**
- Parallax (scroll-linked movement)
- SplitText reveals (char, word, line-level)
- Stagger sequences
- Scroll-scrubbed timelines
- Flip animations (layout transitions)
- Draggable elements
- Pin sections
- Custom timeline sequences

### 4.2 Attribute Schema

| Attribute | Values | Default | Engine |
|-----------|--------|---------|--------|
| `data-anim` | fade-up, scale-in, slide-left... | — | CSS |
| `data-anim-delay` | 0–5 (seconds) | 0 | CSS |
| `data-anim-duration` | 0.1–3 (seconds) | 0.6 | CSS |
| `data-anim-ease` | ease, ease-in, ease-out, cubic-bezier | ease-out | CSS |
| `data-anim-threshold` | 0–1 (intersection ratio) | 0.2 | CSS |
| `data-gsap` | parallax, split-text, stagger, scrub, pin, flip | — | GSAP |
| `data-gsap-start` | ScrollTrigger start value | top 80% | GSAP |
| `data-gsap-end` | ScrollTrigger end value | bottom 20% | GSAP |
| `data-gsap-scrub` | true, false, number (smoothing) | false | GSAP |
| `data-gsap-stagger` | 0–2 (seconds between children) | 0.1 | GSAP |
| `data-gsap-pin` | true, false | false | GSAP |
| `data-gsap-split` | chars, words, lines | words | GSAP |
| `data-hover` | scale-up, lift, glow, underline, color-shift | — | CSS |
| `data-click` | flip, toggle, expand, pulse | — | CSS/GSAP |
| `data-load` | Same as data-anim values | — | CSS |
| `data-anim-parent` | stagger, sequence, cascade | — | Both |
| `data-anim-children` | CSS selector for child targets | > * | Both |

### 4.3 Animation Playground

**Grid View (Browse):**
- All available animations displayed as cards in a searchable, filterable grid
- Each card shows a looping thumbnail preview (auto-plays on hover)
- Filter by: engine (CSS/GSAP), type (scroll/hover/click/load), complexity
- Search by name or keyword

**Canvas View (Configure):**
- Clicking a card opens a full configurator
- Embedded live HTML canvas with real animated elements
- Parameter sliders: duration, delay, ease, distance, stagger, etc.
- Real-time preview updates as you adjust sliders
- "Apply to element" button to assign to a structure tree node
- "Save as custom" to add to personal library
- "Publish to community" option for sharing

**Custom Animations:**
- Create new animations with the canvas configurator
- Save with name, description, tags
- Publishable to community library (opt-in)

### 4.4 Recommendation Engine
When configuring animations:
- Simple visibility-triggered fade/slide/scale → **Recommends CSS**
- Scroll-linked or scrubbed → **Recommends GSAP + ScrollTrigger**
- Text character/word reveals → **Recommends GSAP + SplitText**
- Layout transitions → **Recommends GSAP Flip**
- Staggered children → **Recommends CSS if simple, GSAP if complex easing**
- User can always override the recommendation.

### 4.5 Master Script Generation
Forge generates a single master script per project that:
- Reads all `data-anim` attributes → initializes CSS animations via IntersectionObserver
- Reads all `data-gsap` attributes → initializes GSAP timelines/tweens
- Reads all `data-hover` and `data-click` attributes
- Reads all `data-load` attributes → runs on DOMContentLoaded
- Handles parent/children relationships (`data-anim-parent` + `data-anim-children`)
- Includes `will-change` management (adds before, removes after)
- Includes `prefers-reduced-motion` check (skips/simplifies all animations)
- Includes resize handler with debounce (kills and reinits ScrollTrigger, reverts SplitText)
- Includes Lenis + ScrollTrigger sync (if Lenis enabled in project config)
- Wraps everything in DOMContentLoaded listener

**Deployment:** Generated script can be (a) copied into Webflow global footer code as embed, or (b) hosted on CDN via script tag. User chooses per project.

---

---

## Database Schema

### users
- `id` (UUID, PK)
- `email` (unique)
- `password_hash` (nullable for OAuth)
- `google_id` (nullable)
- `name`, `avatar_url`
- `plan` (free, pro, agency)
- `created_at`, `updated_at`

### projects
- `id` (UUID, PK)
- `user_id` (FK → users)
- `name`, `description`
- `webflow_site_id` (nullable)
- `figma_file_key` (nullable)
- `setup_profile_id` (FK → setup_profiles, nullable)
- `animation_config` (JSON: CDN vs embed, Lenis, GSAP plugins)
- `created_at`, `updated_at`

### setup_profiles
- `id` (UUID, PK), `user_id` (FK)
- `name` (e.g., "Standard Client Site")
- `checklist_config` (JSON: items checked, default values)

### setup_progress
- `id` (UUID, PK), `project_id` (FK)
- `item_key` (e.g., "seo_subdomain_off")
- `status` (pending, completed, skipped)
- `completed_at`

### templates
- `id` (UUID, PK), `user_id` (FK)
- `name`, `description`, `category` (hero, faq, footer, etc.)
- `type` (skeleton, styled)
- `is_preset` (boolean — true for Forge defaults)
- `structure` (JSON: element tree with classes, types, nesting)
- `styles` (JSON, nullable: CSS values for styled templates)
- `animation_attrs` (JSON, nullable: pre-configured data attributes)
- `tags` (text array)
- `source_project_id` (FK, nullable)
- `is_published` (boolean — community library visibility)

### figma_analyses
- `id` (UUID, PK), `project_id` (FK)
- `figma_file_key`, `figma_page_name`
- `raw_structure` (JSON: parsed Figma data)
- `audit_results` (JSON: issues found)
- `ai_suggestions` (JSON, nullable: Claude API response)
- `final_structure` (JSON: approved structure after editing)
- `pushed_to_webflow` (boolean), `pushed_at`

### animation_presets
- `id` (UUID, PK), `user_id` (FK, nullable for system presets)
- `name`, `description`, `category`
- `engine` (css, gsap)
- `trigger` (scroll, hover, click, load)
- `config` (JSON: all attribute values)
- `preview_html` (text: HTML for thumbnail preview)
- `is_system` (boolean)
- `is_published` (boolean — community library)
- `tags` (text array)

### audits
- `id` (UUID, PK), `project_id` (FK)
- `type` (speed, seo, aeo)
- `url_audited`
- `results` (JSON: full audit data)
- `score` (numeric)
- `created_at`

### audit_alerts
- `id` (UUID, PK), `audit_id` (FK), `project_id` (FK)
- `type` (score_drop, issue_found, new_error)
- `message`, `severity` (info, warning, critical)
- `read` (boolean), `created_at`

---

## API Endpoints

### Auth
```
POST /api/auth/register        — Email/password registration
POST /api/auth/login           — Returns JWT
GET  /api/auth/google          — Google OAuth redirect
GET  /api/auth/google/callback — OAuth callback
POST /api/auth/refresh         — Refresh JWT token
```

### Projects
```
GET    /api/projects           — List user projects
POST   /api/projects           — Create project
GET    /api/projects/:id       — Project detail
PUT    /api/projects/:id       — Update project
DELETE /api/projects/:id       — Delete project
```

### Setup
```
GET  /api/projects/:id/setup              — Get setup progress
PUT  /api/projects/:id/setup/:item        — Update item status
POST /api/projects/:id/setup/execute/:item — Auto-execute via MCP
GET  /api/setup-profiles                  — List profiles
POST /api/setup-profiles                  — Create profile
```

### Figma
```
POST /api/figma/analyze              — Parse Figma file, run audit
POST /api/figma/ai-suggest           — Run Claude AI analysis
PUT  /api/figma/analyses/:id         — Save edited structure
POST /api/figma/analyses/:id/push    — Push to Webflow via MCP
```

### Templates
```
GET    /api/templates            — List (filter by category, type)
POST   /api/templates            — Create custom template
GET    /api/templates/:id        — Detail
PUT    /api/templates/:id        — Update
DELETE /api/templates/:id        — Delete
POST   /api/templates/:id/push   — Push to Webflow via MCP
GET    /api/templates/community  — Browse published templates
```

### Animations
```
GET  /api/projects/:id/animations           — Get project animation config
PUT  /api/projects/:id/animations           — Update config
POST /api/projects/:id/animations/generate  — Generate master script
GET  /api/animations/presets                — List presets (system + user)
POST /api/animations/presets                — Create custom preset
PUT  /api/animations/presets/:id            — Update preset
POST /api/animations/presets/:id/publish    — Publish to community
```

---

## Authentication & User Management

**Strategy:** Passport.js with dual strategy (local + Google OAuth). JWT tokens for API auth. Refresh token rotation.

- Registration: email/password with verification, or Google OAuth
- Login: access token (15min) + refresh token (7 day)
- All API routes JWT-protected except auth routes
- Rate limiting on auth endpoints
- Password reset via email link

### Subscription Tiers (Future)

| Feature | Free | Pro | Agency |
|---------|------|-----|--------|
| Projects | 1 | Unlimited | Unlimited + team |
| Templates | Pre-built only | Unlimited custom | Shared team library |
| AI Figma Assist | 5/month | Unlimited | Unlimited |
| Audits | 3/month | Unlimited | Unlimited + monitoring |
| Animation Engine | CSS only | CSS + GSAP | CSS + GSAP + custom |
| MCP Push | Manual copy | Direct push | Direct push + API |

---

## Browser Extension (Phase 2)

**Purpose:** Lightweight companion to Forge web app for direct Webflow Designer DOM interaction.

### Capabilities
- Select element in Designer → apply animation attributes via popup/context menu
- Visual attribute editor: see/add/edit/remove all data-anim/data-gsap attributes
- Preview animations by injecting master script into Webflow preview tab
- Quick-add template sections
- SEO quick-check: scan page for meta, headings, schema → scorecard
- Speed snapshot: trigger Lighthouse audit from extension

### Technical
- Chrome Manifest V3
- Content script for Webflow Designer pages
- Authenticated API calls to Forge backend
- `chrome.storage` for preferences and cache

---

## Phased Build Plan

### Phase 1: Foundation (Weeks 1–2)
- Set up project structure (let best practice dictate monorepo vs separate)
- PostgreSQL + Redis setup
- Authentication (email/password + Google OAuth)
- Project CRUD
- Webflow MCP connection + basic read/write test
- Dashboard UI shell (project list, navigation)

### Phase 2: Project Setup Wizard (Weeks 3–4)
- Full interactive checklist UI with progress tracking
- Setup profiles (create, save, load)
- MCP auto-execute for applicable items
- Expandable item details with instructions and links

### Phase 3: Animation Engine (Weeks 5–7)
- Complete attribute schema definition
- CSS animation tier (IntersectionObserver + @keyframes)
- GSAP animation tier (ScrollTrigger, SplitText, Flip, etc.)
- Master script generator
- Recommendation engine
- Animation playground: grid view with hover previews
- Animation playground: canvas configurator with live preview + sliders
- Custom animation creation and saving
- Resize handler, will-change, prefers-reduced-motion, Lenis sync

### Phase 4: Figma Translator (Weeks 8–10)
- Figma OAuth + file access
- Figma file parser (layers, frames, components, text, images)
- Rule-based structure translator (Figma → Client-First classes)
- Figma audit engine
- AI assist integration (Claude API)
- Structure preview + editor UI (visual tree, drag-and-drop)
- Push to Webflow via MCP

### Phase 5: Template Library (Weeks 11–12)
- Pre-built templates (all section types with variants)
- Template browser UI (category filter, search, preview)
- Custom template save (from Webflow via MCP or manual)
- Skeleton vs styled save modes
- Animation attribute pre-configuration on templates
- Push to Webflow via MCP

### Phase 6: Optimization Modules (Weeks 13–20)
- Page Speed Optimizer (PageSpeed Insights API)
- SEO Audit & Monitor (custom crawler, monitoring, alerts)
- AEO Optimization (on-page analysis, schema validation)
- Browser Extension MVP

### Phase 7: Polish & Launch (Weeks 21–24)
- Subscription billing (Stripe)
- Onboarding flow
- Documentation / help center
- Landing page (**CRITICAL:** SSR/prerender for AI crawlers)
- Beta testing
- Public launch

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Figma → Webflow push granularity | Per-project choice (full page or section-by-section) | Maximum flexibility |
| Animation types | All (scroll, hover, click, load) | Complete coverage |
| Template storage | Both skeleton and styled, choice per template | Flexibility |
| Master script hosting | Both embed and CDN, choice per project | Different client needs |
| Auth | Email/password + Google OAuth | Covers all users |
| Figma AI parsing | Claude API, optional toggle | Powerful but not required |
| Animation attribute prefix | `data-anim` / `data-gsap` / `data-hover` (descriptive) | Clarity over brevity |
| Custom animation sharing | Publishable to community library (opt-in) | Future SaaS value |
| Git workflow | Stage changes, user reviews and commits | Control over codebase |

---

## REVISION 2 — Architecture Additions (March 2026)

The following modules, systems, and architectural changes extend the original plan. All detailed implementation specs are in the expansion prompt (forge-expansion-complete.md). This section provides the high-level architecture overview.

---

## Module 8: Unified Visual Editing Engine

The foundation that powers ALL visual editing across Forge. Built as reusable React components shared by every module.

### Components
- **Visual CSS Editor (Style Panel):** Webflow-style grouped property panel (Layout, Sizing, Spacing, Typography, Backgrounds, Borders, Effects) with code view toggle showing raw CSS. Real-time preview updates with batch mode option. Responsive breakpoint controls. Undo/redo.
- **Visual GSAP/Animation Editor:** Two modes — Preset mode (grid picker + parameter sliders) and Timeline mode (full keyframe editor with draggable blocks, easing curve editor, ScrollTrigger visualization, scrub preview).
- **Live Preview Engine:** Sandboxed iframe rendering with `srcdoc`. Placeholder content for text/images. Responsive preview toggles (desktop/tablet/mobile). Animation preview toggle. Puppeteer-generated thumbnails for grid views.

### Architecture
These are context-aware components — they appear wherever editing is needed (template library, Figma translator, animation playground, section capture). Context-specific panels (animation editor) only show when relevant.

---

## Module 9: Section Capture System

Three capture methods for saving sections from existing projects:

- **URL Crawl:** Paste any URL → Puppeteer fetches + renders → user selects section → Forge extracts HTML/CSS/JS
- **Webflow MCP Capture:** Select elements from connected Designer → extract structure, classes, styles, attributes
- **Manual Code Paste:** Paste HTML, CSS, JS into syntax-highlighted editors

All methods lead to the same post-capture workflow: preview → edit structure → edit CSS → edit animations → assign semantics → choose save type (skeleton/styled/full) → organize (categories, folders, tags).

### Library Organization
- Auto-categorization by section type
- Custom folders/collections (user-created, nestable)
- A section can exist in multiple folders
- Search across name, description, tags, class names
- Filter by category, type, capture method, project source, has-animations

---

## Module 10: Semantic HTML & Accessibility System

Integrated into structure trees across all modules.

- **Auto-detection rules:** Maps layer/class names to semantic HTML tags (nav, section, footer, header, aside, h1-h6, a, button, img, ul/ol/li, form)
- **AI-enhanced detection:** Claude API provides nuanced suggestions (article for cards, nav with aria-label for breadcrumbs, form role="search")
- **Visual indicators:** Color-coded tag badges (green = semantic, gray = generic, amber = suggestion pending, red = accessibility issue)
- **Heading hierarchy checker:** Warns on skipped levels, non-blocking override
- **Pre-push accessibility checklist:** Summary of heading hierarchy, missing alt text, missing aria-labels, form accessibility, color contrast, semantic coverage percentage

---

## Module 11: Unit System (px / rem / em)

- **Global project default:** Set default unit per project (px/rem/em, default rem)
- **Per-input toggle:** Every numeric input has clickable unit badge cycling px/rem/em
- **Conversion dialog:** "Convert 44px to 2.75rem?" with Convert/Keep options
- **Batch conversion:** When changing global default, option to convert all existing values
- **Integration:** Uses scaling system base font size for px↔rem conversion

---

## Module 12: REM Fluid Scaling System

Configurable fluid responsive scaling pushed to Webflow's `<head>` via MCP.

### Configuration
Visual breakpoint editor with 4 cards (Desktop, Tablet, Mobile Landscape, Mobile Portrait). Each card: base font size, ideal width, min width, max width, real-time preview calculation.

### Smart Defaults
- Desktop: base 16, ideal 1440, min 992, max 1920
- Tablet: ideal 834, min 768, max 991
- Mobile Landscape: ideal 550, min 480, max 767
- Mobile Portrait: ideal 375, min 320, max 479

### Figma Integration
Auto-populates desktop ideal width from Figma frame dimensions on import.

### Push to Webflow
Generates complete CSS code block → pushes to `<head>` custom code via MCP Data API.

---

## Module 13: In-App Guide System

Two-layer help system:
- **Tooltip layer:** `?` icon on every control with one-sentence explanation + "Learn more →" link
- **Full guide section:** Dedicated /guide page with: Getting Started, Figma → Webflow (step-by-step), Templates & Sections, Animation Engine, CSS Visual Editor, REM Scaling System, Project Setup, SEO/Speed/AEO guides
- **Contextual help:** First-time module walkthroughs, smart empty states, error troubleshooting

---

## Module 14: Master Script Status System

- **Status bar:** Persistent 32px bar at bottom of project pages. States: hidden (no animations), amber (needs generation), blue (generated not pushed), green (active), amber (outdated)
- **Contextual reminders:** After adding first animation, after push with animation attributes, in pre-push review
- **Scaling system status:** Alongside master script status (configured/pushed/not configured)

---

## Revised Figma → Webflow Pipeline (7 Steps)

1. **Import:** Paste Figma URL → fetch file → select page/frame
2. **Audit + Structure:** Side-by-side view — Figma preview left, proposed Webflow structure right. Audit issues flagged. AI Assist toggle for smart suggestions.
3. **Semantic HTML:** Suggestions with visual indicators. Approve/dismiss per element or batch. Heading hierarchy checker.
4. **Visual Styling (optional):** CSS style panel pre-filled with Figma-extracted values. Real-time preview.
5. **Animation Assignment (optional):** Animation picker + AI recommendations. Timeline editor for complex sequences.
6. **Pre-Push Review:** Full preview with responsive toggles. Class name review list (editable). Image checklist (auto-downloaded from Figma, manual upload to Webflow). Accessibility summary. Push options (scope, styles, animations, text content).
7. **Push:** MCP creates elements with semantic tags, Client-First classes, attributes, text. Batched calls for deep nesting (3-level MCP limit handled transparently). Image placeholders with `data-figma-image` attributes.

### MCP Constraints Handled
- 3-level nesting limit → Forge batches sequential calls, referencing parent IDs
- No inline styles → All styles as named Client-First classes via style_tool
- No image upload → Placeholder elements + image checklist for manual upload
- Designer must be open → Status indicator + auto-reconnect + action blocking
- Class naming → Auto-generated Client-First names with full review/rename before push

---

## Additional Features

### Command Palette (Cmd+K)
Global fuzzy search across navigation, actions, templates, animations, projects, settings. Full keyboard shortcut system.

### Cross-Module Workflow Connections
- Figma → Animation recommendations (AI suggests per section)
- Speed optimizer → Animation engine (performance issue links to configurator)
- SEO audit → Template library (update templates from audit findings)
- Figma push → Setup wizard (auto-create page-specific tasks)
- Audit scores → Dashboard (mini score indicators on project cards)
- Template push → Master script reminder

### AI Enhancements
- Content extraction from Figma (text mapping to structure nodes)
- Animation recommendations (context-aware per section type)
- SEO content suggestions (meta descriptions, alt text, content structure)
- Code review for custom embeds (performance, security, Webflow compatibility)

### Client Handoff Report Generator
Configurable PDF or shareable web link report: project overview, setup completion, structure, animations, speed/SEO/AEO scores, recommendations.

### Site Health Monitoring Dashboard
Aggregated scores across projects, trend charts, issues feed, weekly email digest.

### Animation Engine Upgrades
- Page transition presets (View Transitions API)
- Animation performance profiler (FPS, paint/composite analysis)

### Quality of Life
Clipboard history, bulk attribute application, template diff view, project duplication, favorites, project notes, recently visited, full keyboard shortcut system.

### Activity Log
Per-project chronological feed of all actions. Implemented as middleware utility.

### Settings System
7 tabs: Account (profile, email, password, sessions, delete account), Projects (rename, connections, animation config, archive, delete), Integrations (MCP, Figma, Google, webhooks, API keys), Notifications (alerts, digest, monitoring frequency), Appearance (theme, sidebar, defaults), Data & Export (JSON/CSV export, import, report preferences), Danger Zone.

---

## Revised Database Schema

### New Tables (in addition to original schema)

- **favorites:** userId, entityType, entityId (unique per user+entity)
- **activityLog:** projectId, userId, actionType, actionData (JSON)
- **sessions:** userId, token, deviceInfo, ipAddress, lastActiveAt, expiresAt
- **handoffReports:** projectId, sections (JSON), format, fileUrl, shareToken, sharePassword
- **notificationPreferences:** userId, auditAlerts, thresholds, weeklyDigest, monitoringFrequency
- **capturedSections:** userId, name, category, captureMethod, sourceUrl, html, css, javascript, structure (JSON), styles (JSON), animationAttrs (JSON), saveType, thumbnailUrl, tags, folderId, isPublished
- **sectionFolders:** userId, name, parentId (self-referential nesting)
- **scalingConfigs:** projectId, breakpoints (JSON: desktop/tablet/mobileLandscape/mobilePortrait each with base/ideal/min/max), isPushed, lastPushedAt

### Modified Tables

- **projects:** add notes, isArchived, archivedAt, lastVisitedAt, defaultUnit (px/rem/em)
- **users:** add isDeactivated, deactivatedAt, deletionScheduledAt, companyLogo
- **templates:** add html, css, javascript, thumbnailUrl, folderId

---

## Revised Phased Build Plan

### Phase 8: Unified Visual Editing Engine (Weeks 25-28)
- Visual CSS Editor (style panel component)
- Unit system (px/rem/em toggle, conversion)
- Live Preview Engine (iframe, responsive, animation preview)
- Visual Animation Editor (preset mode)
- Timeline Editor (keyframe mode)

### Phase 9: Core Systems (Weeks 29-32)
- REM Scaling System (config UI, code generator, MCP push)
- Semantic HTML & Accessibility system
- Section Capture (URL crawl, MCP capture, manual paste)
- MCP Connection Management (status, auto-reconnect, blocking)
- Master Script Status System

### Phase 10: Figma Pipeline Upgrade (Weeks 33-35)
- Revised 7-step pipeline
- Image checklist with Figma auto-download
- Class name review before push
- Pre-push accessibility checklist

### Phase 11: Template System Upgrade (Weeks 36-37)
- Visual preview rendering (Puppeteer thumbnails, live iframe)
- Section library organization (folders, tags, search)
- Template CSS/animation visual editing

### Phase 12: Help & Guide (Weeks 38-39)
- In-app guide (MDX content, full guide section)
- Tooltip layer (every control across all editors)
- Parameter explainer content
- First-time walkthroughs

### Phase 13: Features & Polish (Weeks 40-44)
- Settings system (all 7 tabs)
- Command palette + keyboard shortcuts
- Cross-module connections
- AI enhancements
- Activity log
- Quality of life features
- Client handoff reports
- Site health dashboard
- Animation engine upgrades (page transitions, profiler)
