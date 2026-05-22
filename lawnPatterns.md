# Lawn Patterns
## Verified Reference for Building New TanStack Start + Convex + Clerk Apps

> Verified against `pingdotgg/lawn` on GitHub at commit `45792addd7ac3c32c8b0d7989211b1cd18fa4090` on April 17, 2026.
>
> Source repo: `https://github.com/pingdotgg/lawn`
>
> This document is meant to be a reusable architecture reference, not just a comparison note for OmniBid. It captures the current stack, file structure, routing model, auth patterns, data-loading strategy, backend organization, integrations, testing habits, and the reasoning behind each choice so you can build new apps with the same overall approach.

---

## Table of Contents

1. [What Lawn Actually Is](#1-what-lawn-actually-is)
2. [Current Stack](#2-current-stack)
3. [Core Architectural Thesis](#3-core-architectural-thesis)
4. [Repository Shape](#4-repository-shape)
5. [Rendering Strategy: Prerendered Marketing + SPA Product](#5-rendering-strategy-prerendered-marketing--spa-product)
6. [Router Setup and Global Defaults](#6-router-setup-and-global-defaults)
7. [Route File Conventions](#7-route-file-conventions)
8. [Root Shell and Provider Composition](#8-root-shell-and-provider-composition)
9. [SEO and Head Management](#9-seo-and-head-management)
10. [Authentication and Access Control](#10-authentication-and-access-control)
11. [Convex Client and Data Fetching Philosophy](#11-convex-client-and-data-fetching-philosophy)
12. [The Route Data Contract Pattern](#12-the-route-data-contract-pattern)
13. [The Prewarm Pattern](#13-the-prewarm-pattern)
14. [Canonical Route Resolution](#14-canonical-route-resolution)
15. [UI and Design Language Patterns](#15-ui-and-design-language-patterns)
16. [Convex Backend Organization](#16-convex-backend-organization)
17. [Queries vs Mutations vs Actions vs HTTP Routes](#17-queries-vs-mutations-vs-actions-vs-http-routes)
18. [Domain Modeling Patterns](#18-domain-modeling-patterns)
19. [Uploads, Video Processing, and External Media](#19-uploads-video-processing-and-external-media)
20. [Public Sharing Pattern](#20-public-sharing-pattern)
21. [Realtime Presence Pattern](#21-realtime-presence-pattern)
22. [Billing and Convex Components](#22-billing-and-convex-components)
23. [Security Patterns](#23-security-patterns)
24. [Testing and Quality Patterns](#24-testing-and-quality-patterns)
25. [Deployment and Environment Patterns](#25-deployment-and-environment-patterns)
26. [What To Copy Exactly in a New App](#26-what-to-copy-exactly-in-a-new-app)
27. [What Is App-Specific, Not Universal](#27-what-is-app-specific-not-universal)
28. [Starter Blueprint](#28-starter-blueprint)

---

## 1. What Lawn Actually Is

Lawn is not just "a TanStack Start app with Convex." It is a product app with two distinct surfaces:

- A public marketing site that cares about SEO and instant first load.
- An authenticated product surface that cares about realtime data, live collaboration, uploads, and internal navigation speed.

That split drives nearly every decision in the repo:

- Public routes are optimized for prerendering and search.
- Product routes are optimized for client-side boot, Clerk auth, and Convex subscriptions.
- Most application data is fetched directly from Convex on the client, not through TanStack Start server loaders.

This is the most important thing to preserve in a new app. Lawn is not "SSR everywhere." It is "static where possible, client-realtime where valuable."

---

## 2. Current Stack

At the verified commit, Lawn uses:

- `@tanstack/react-start` for app framework and Vite integration.
- `@tanstack/react-router` for file-based routing.
- `convex` for backend, database, auth identity access, actions, realtime queries, and HTTP routes.
- `@clerk/tanstack-react-start` for auth UI and session integration.
- `convex/react-clerk` for passing Clerk auth into Convex subscriptions.
- Bun as the package manager and local task runner.
- Tailwind CSS v4 for styling.
- Radix primitives for reusable UI pieces.
- Mux for video playback and processing.
- AWS S3 presigned uploads for original video storage.
- Stripe via `@convex-dev/stripe`.
- Convex components for Stripe, presence, and rate limiting.

Why this stack makes sense:

- TanStack Start gives file routing, prerendering, and simple Vite-based deployment.
- Convex gives a single backend model for schema, auth-aware data access, actions, and realtime subscriptions.
- Clerk handles identity and auth UI well, while Convex remains the app's authorization layer.
- Tailwind + Radix let the team move fast without inventing low-level components repeatedly.

---

## 3. Core Architectural Thesis

The repo follows a handful of strong opinions:

### 3.1 Keep public and private surfaces architecturally distinct

Marketing pages are content pages. Dashboard pages are app pages. Do not pretend they need the same rendering pipeline.

### 3.2 Put realtime data on the client, not behind SSR loaders

Lawn does not build its core app around TanStack Start loaders. It builds the product around Convex client subscriptions and prewarming.

### 3.3 Keep route entry files thin

Route files should mostly:

- declare path and route metadata,
- validate search params if needed,
- attach head info,
- hand off to a dedicated implementation component.

### 3.4 Centralize cross-cutting concerns

Shared concerns get centralized helpers:

- SEO builder
- auth helper module
- Convex client provider
- route-data utilities
- prewarm intent hook
- route/path helper functions

### 3.5 Use Convex as the domain boundary

Authorization, business rules, persistence, integration side effects, and webhook handling all live in Convex, not in random server files.

---

## 4. Repository Shape

Lawn uses an intentional split:

- `app/`
  The TanStack Start app source directory. Routes, router, route tree, app entrypoints.
- `src/`
  Shared UI components, reusable hooks, shared utilities, client providers, and design helpers.
- `convex/`
  Backend schema, queries, mutations, actions, HTTP routes, auth helpers, integrations, and Convex component config.
- `docs/`
  Setup, deployment, design philosophy.
- `public/`
  Static assets, OG images, robots, sitemap.

Why this matters:

- It keeps TanStack Start route concerns in one place.
- It prevents the route tree from swallowing every other concern.
- It makes reusable app infrastructure feel framework-agnostic even though the app uses TanStack Start.

For new apps:

- Keep `app/` for route-bound code.
- Keep `src/` for shared libraries and components.
- Keep `convex/` as the full backend surface.

---

## 5. Rendering Strategy: Prerendered Marketing + SPA Product

Lawn's `vite.config.ts` uses TanStack Start with:

- `srcDirectory: "app"`
- `spa.enabled: true`
- `prerender.enabled: true`
- explicit `pages` for public routes
- a SPA shell output path and mask path

What this means in practice:

- Public pages like `/`, `/pricing`, and comparison/landing pages are prerendered to static HTML at build time.
- The product app runs as a SPA.
- The app shell is used for non-prerendered routes.

Why Lawn chose this:

- Marketing pages benefit from CDN-served HTML, canonical meta tags, and no auth complexity.
- Authenticated dashboard pages depend on Clerk session state and Convex subscriptions, so server rendering them would add complexity and often little value.

Important subtlety:

- Lawn is not using per-route `ssr: false` everywhere.
- Instead, it sets an app-level SPA posture and explicitly prerenders the routes that should be static.

For new apps:

- Copy this model if your product has a public site plus authenticated realtime product area.
- Do not force SSR on dashboard pages unless you genuinely need server-rendered data.

---

## 6. Router Setup and Global Defaults

Lawn's router is intentionally light:

- `defaultPreload: "intent"`
- `scrollRestoration: true`
- `defaultPendingComponent`
- `defaultNotFoundComponent`

Why this is a pattern:

- `defaultPreload: "intent"` aligns router code preloading with the custom Convex prewarm system.
- A global pending component gives a consistent loading state without repeating boilerplate.
- A global not-found component avoids route-by-route duplication.

Important difference from some other apps:

- Lawn does not wrap TanStack Router with React Query integration.
- It uses plain TanStack Router plus plain Convex client subscriptions.

For new apps:

- Start with the same router defaults.
- Only add React Query router integration if your app truly benefits from that extra abstraction.

---

## 7. Route File Conventions

Lawn's route organization is one of its most reusable patterns.

### 7.1 Thin route entry files

Examples:

- `app/routes/index.tsx`
- `app/routes/sign-in.tsx`
- `app/routes/dashboard/$teamSlug.index.tsx`
- `app/routes/watch.$publicId.tsx`

These files usually only do three things:

- define the route,
- set `head`,
- hand off to another component or shell.

### 7.2 Hyphen-prefixed implementation files

Examples:

- `-home.tsx`
- `-layout.tsx`
- `-team.tsx`
- `-project.tsx`
- `-video.tsx`
- `-sign-in.tsx`

Pattern meaning:

- The actual route file remains thin.
- Bigger implementation code lives in a sibling file that is not itself a route.

### 7.3 Companion `.data.ts` files

Examples:

- `-index.data.ts`
- `-team.data.ts`
- `-project.data.ts`
- `-video.data.ts`
- `-share.data.ts`

Pattern meaning:

- Data contracts live beside route implementations.
- Fetching logic and prewarm declarations are grouped by route concern.

### 7.4 Dedicated shell files for route families

Examples:

- `auth/-layout.tsx`
- `dashboard/-layout.tsx`

This gives each route family its own wrapper and behavior.

Why this whole naming system works:

- The file tree stays understandable as the app grows.
- Route metadata, implementation UI, and data contracts do not pile into one file.
- Non-route helper files can live beside routes without accidentally becoming routes.

For new apps:

- Keep the same naming convention.
- It scales much better than putting 300 lines into each route file.

---

## 8. Root Shell and Provider Composition

Lawn's root route owns document-level concerns:

- `<html>` and `<body>`
- `<HeadContent />`
- global `<Scripts />`
- root `ClerkProvider`
- root `ConvexClientProvider`
- root `ThemeProvider`
- root `TooltipProvider`

Why this matters:

- Providers are initialized once in a predictable place.
- Every route gets access to auth, Convex, theme, and tooltip primitives automatically.
- Document-level concerns stay centralized.

Important implementation details:

- `ClerkProvider` wraps the app near the top.
- `ConvexProviderWithClerk` is defined in a dedicated `src/lib/convex.tsx`.
- Theme initialization uses an inline script in the document to prevent hydration flicker.
- Root route also defines global error and not-found behavior.

For new apps:

- Put global providers in the root route, not in random pages.
- Keep the Convex + Clerk bridge in a dedicated helper file.
- If you support themes, initialize them before client hydration.

---

## 9. SEO and Head Management

Lawn uses a shared `seoHead` helper instead of hand-writing meta tags in each route.

The helper builds:

- title
- description
- OG title/description/image/url/type/site_name
- Twitter card tags
- canonical link
- optional `robots: noindex,nofollow`

Why this is a strong pattern:

- Public routes stay consistent.
- Canonicals are hard to forget.
- OG metadata stays uniform.
- Route files remain clean.

How Lawn applies it:

- Public pages call `seoHead(...)`.
- Auth/private routes often set `noIndex: true`.
- The root route still provides site-wide defaults and preconnect links for Mux.

For new apps:

- Always create a centralized SEO builder.
- Use route-level head declarations for page-specific content.
- Mark product/auth/share flows `noindex` unless you explicitly want them indexed.

---

## 10. Authentication and Access Control

Lawn uses a layered auth model:

### 10.1 Clerk handles identity and auth UI

Clerk is responsible for:

- sign-in and sign-up screens,
- session state on the client,
- publishable/secret key integration,
- prebuilt auth widgets.

### 10.2 Convex handles app authorization

Convex decides:

- whether a user may access a team,
- whether a user may access a project,
- whether a user may access a video,
- which role level is required.

This is implemented through reusable helpers like:

- `requireUser`
- `requireTeamAccess`
- `requireProjectAccess`
- `requireVideoAccess`

Why this split is good:

- Identity and UI stay off your plate.
- Real authorization rules still live near the data.
- Client code never becomes the source of truth for permissions.

### 10.3 Product routes are gated in the dashboard layout

Lawn's private dashboard is guarded in `dashboard/-layout.tsx` using:

- `useAuth()` from Clerk
- redirect logic for unauthenticated users
- a special-case exemption when a private dashboard route can resolve to a public watch route

Why Lawn does it this way:

- The product app is running as a client-oriented SPA.
- Clerk auth state is already readily available on the client.
- Redirecting at the layout level keeps route wrappers simpler.

### 10.4 Auth pages use a dedicated auth shell

`/sign-in` and `/sign-up` are thin route files that:

- call `seoHead`
- validate `redirect_url`
- render a shared `AuthShell`
- render a stylized Clerk component implementation

Why this is useful:

- Auth screens match the app design system instead of feeling bolted on.
- Redirect intent is preserved through search params.

For new apps:

- Preserve the identity/authz split.
- Keep authorization in Convex.
- Use reusable auth helper functions, not duplicated access checks.

---

## 11. Convex Client and Data Fetching Philosophy

Lawn uses the plain Convex React client:

- one singleton `ConvexReactClient`
- wrapped with `ConvexProviderWithClerk`
- route and component reads done via `useQuery`
- writes done via `useMutation`
- side-effecting external work done via `useAction`

Why Lawn prefers this:

- The product is naturally realtime.
- Convex subscriptions are already the canonical data source.
- Adding another client-side query abstraction is not necessary for most of the app.

This is a very important pattern decision.

Lawn is not using:

- TanStack Start loaders as the primary app data layer
- React Query as the main cache abstraction for core Convex reads

Instead, it uses:

- Convex subscriptions directly
- custom prewarming on intent

For new apps built in Lawn's style:

- Default to plain `convex/react`.
- Reach for React Query only if you have a concrete reason that Convex subscriptions do not already solve.

---

## 12. The Route Data Contract Pattern

This is one of the most important patterns in the repo.

Each major route gets a `.data.ts` file that usually contains:

- a function returning the route's "essential" query specs
- a `use...Data()` hook for consuming those queries
- a `prewarm...()` function for priming them before navigation

Examples:

- `getDashboardIndexEssentialSpecs`
- `useDashboardIndexData`
- `prewarmDashboardIndex`

Why this pattern is excellent:

- It makes each route's data dependencies explicit.
- Navigation prewarming and route rendering share the same source of truth.
- You can test the route contract separately from the UI.

Lawn also supports dependent route data:

- `prewarmTeam()` prewarms `resolveContext`, then may query Convex directly to discover dependent ids, then prewarm more queries.
- `useTeamData()` uses `"skip"` until prerequisite data exists.

That combination is one of Lawn's most sophisticated frontend patterns:

- declare essential route data,
- allow dependent query resolution,
- keep rendering and prewarm logic aligned.

For new apps:

- Every non-trivial route should have a `.data.ts`.
- Treat that file as the route's data contract.

---

## 13. The Prewarm Pattern

Lawn's prewarm system is more advanced than the earlier simplified versions many teams copy.

### 13.1 Prewarming is based on route intent

The custom hook listens to:

- `onMouseEnter`
- `onFocus`
- `onTouchStart`
- plus cancelation on `onMouseLeave` and `onBlur`

### 13.2 Prewarming is debounced

This avoids firing costly work the instant a pointer brushes over a link.

### 13.3 Prewarming is deduped

The shared `convexRouteData.ts` utility keeps a short-term memory of recently prewarmed query keys so the app does not repeatedly subscribe to the same data in rapid succession.

### 13.4 Prewarming can extend temporary subscriptions

Lawn uses `extendSubscriptionFor` when calling `convex.prewarmQuery(...)`.

Why this matters:

- Hover/focus intent is noisy.
- Naive prewarming can become wasteful.
- Deduped and debounced prewarming gives most of the speed benefit without excessive extra work.

### 13.5 Prewarming is a first-class navigation primitive

Lawn prewarms:

- dashboard home,
- team pages,
- project pages,
- video pages,
- watch/share flows,
- breadcrumbs and headers,
- not just cards in content grids.

This is the real lesson:

- prewarming is not an isolated trick,
- it is part of the navigation architecture.

For new apps:

- Build a shared prewarm utility layer.
- Do not scatter raw `prewarmQuery()` calls everywhere without dedupe or tests.

---

## 14. Canonical Route Resolution

Lawn introduces a smart backend query, `workspace.resolveContext`, that:

- resolves team/project/video relationships,
- verifies membership,
- returns the canonical path,
- tells the client whether the current URL is canonical.

Then route implementations can:

- render with the resolved domain objects,
- redirect if the incoming URL is stale or non-canonical.

Why this is smart:

- It keeps canonicalization logic in one place.
- It prevents every route from manually reimplementing path normalization.
- It ties authorization and canonical path generation together.

When to copy this:

- Any time your product routes contain nested entities with slugs and ids.
- Especially when there are multiple valid inbound URLs but only one canonical app path.

---

## 15. UI and Design Language Patterns

Lawn's design system is opinionated and documented in `docs/philosophy.md`.

Core style traits:

- brutalist
- typographic
- minimal
- high contrast
- strong borders
- warm cream background
- black text
- green accent
- almost no rounded corners
- heavy use of uppercase mono accents with bold display typography

Important UI patterns:

- Components are styled to feel like part of one visual language, including Clerk widgets.
- Buttons use bold contrast and visible interaction states.
- Cards have strong borders and clear hierarchy.
- Dashboard UI remains product-focused, but still follows the same brand language.

Why this matters architecturally:

- Lawn does not treat design as an afterthought layered on top of generic app scaffolding.
- The design system is a core part of the product identity, and shared shells/components enforce it.

For new apps:

- Preserve the idea, not necessarily Lawn's exact colors.
- Choose a strong visual system and thread it through:
  - marketing pages
  - dashboard layout
  - auth pages
  - third-party UI like Clerk

---

## 16. Convex Backend Organization

Lawn's backend is grouped by domain and infrastructure concern.

Examples:

- `auth.ts`
- `teams.ts`
- `projects.ts`
- `videos.ts`
- `comments.ts`
- `billing.ts`
- `shareLinks.ts`
- `shareAccess.ts`
- `videoActions.ts`
- `mux.ts`
- `muxActions.ts`
- `workspace.ts`
- `http.ts`
- `security.ts`

This is the key pattern:

- domain modules own business logic,
- helper modules own reusable primitives,
- integration modules isolate external systems,
- HTTP/webhook surface is tiny and explicit.

Why this is better than "misc util files":

- Business rules remain discoverable.
- Ownership stays clear.
- External system complexity does not leak across the app.

For new apps:

- Organize Convex by domain plus infrastructure, not by function type alone.

---

## 17. Queries vs Mutations vs Actions vs HTTP Routes

Lawn uses the right Convex primitive for the right job.

### 17.1 Queries

Use queries for:

- reading auth-aware app data
- returning derived domain views
- canonical context resolution
- share and invite lookup

### 17.2 Mutations

Use mutations for:

- state changes inside Convex
- creating teams, projects, videos, comments
- issuing share links
- updating workflow status

### 17.3 Actions

Use actions for:

- talking to Stripe or AWS or Mux
- generating signed URLs
- creating checkout sessions
- fetching playback sessions
- doing work that depends on external services or Node APIs

### 17.4 HTTP routes

Use `http.ts` only for:

- external webhooks
- health checks

Why this split works:

- Queries/mutations stay close to the database and authorization layer.
- Actions isolate networked side effects.
- HTTP routes remain narrow adapters rather than becoming a second app backend.

For new apps:

- Default to query or mutation.
- Use action only when you cross the Convex boundary to external systems or need Node-only APIs.
- Keep HTTP routes tiny.

---

## 18. Domain Modeling Patterns

Lawn's schema models product boundaries directly:

- teams
- teamMembers
- teamInvites
- projects
- videos
- comments
- shareLinks
- shareAccessGrants

Important schema habits:

- use explicit unions for statuses and roles
- define the indexes you actually query by
- model access and public sharing as first-class tables
- keep external ids near the entities they belong to

Examples:

- `teamMembers` stores role information directly.
- `videos` stores both internal workflow status and external Mux references.
- `shareLinks` and `shareAccessGrants` separate durable share configuration from temporary access sessions.

Why this is a good pattern:

- Access control becomes natural to implement.
- External integrations do not require a second shadow schema.
- Public access flows remain auditable and controlled.

For new apps:

- Model collaboration, access, and external system state explicitly in the schema.
- Do not rely on implicit conventions or loose JSON blobs unless there is a clear reason.

---

## 19. Uploads, Video Processing, and External Media

Lawn's upload architecture is another strong reference pattern.

### 19.1 Client flow

The client:

- creates a video record via mutation,
- requests a signed upload URL via action,
- uploads directly to S3,
- marks success or failure via action,
- tracks local progress in a dedicated upload manager hook.

### 19.2 Server flow

Convex actions then handle:

- validating upload request size/type,
- marking upload completion,
- kicking off Mux ingestion and playback state transitions,
- generating download and playback session URLs.

Why this pattern is good:

- Large binary uploads do not flow through your app server.
- Domain state still begins in Convex, not in S3.
- Upload UI can show rich progress while backend state remains authoritative.

For new apps:

- Use a client upload manager hook if uploads are core UX.
- Create the domain entity before upload when possible.
- Let Convex own the final state transitions.

---

## 20. Public Sharing Pattern

Lawn has a robust share system that is worth copying conceptually.

The flow separates:

- durable share links,
- optional password protection,
- optional expiry,
- optional download permission,
- temporary access grants,
- public comments for authorized share viewers.

Why this layered model is better than a single public token:

- Password-protected shares do not expose the full resource directly.
- Temporary grants reduce the amount of durable secret material circulating.
- Expiry and lockout logic remain centralized.

The frontend mirrors this:

- a share page first checks link state,
- then requests an access grant,
- then loads video/comments once that grant exists.

This is a very clean pattern for any semi-public product flow.

For new apps:

- If you support guest/public access, use a grant-based model instead of direct permanent access tokens when possible.

---

## 21. Realtime Presence Pattern

Lawn uses Convex presence to show who is currently watching a video.

Pattern pieces:

- persistent client id in localStorage
- periodic heartbeat mutation
- disconnect mutation on teardown
- `sendBeacon` on unload for best-effort cleanup
- query subscription for current room presence
- support for both member and guest presence

Why this is good:

- Presence is kept out of the main entity tables.
- Online state is treated as ephemeral and refreshed by heartbeat.
- Guest viewers can be handled without breaking the model.

For new apps:

- Use a separate ephemeral presence system.
- Never try to store "online" directly on durable user rows as your primary presence model.

---

## 22. Billing and Convex Components

Lawn uses Convex components as real architecture, not just utilities.

Configured components:

- `@convex-dev/presence`
- `@convex-dev/rate-limiter`
- `@convex-dev/stripe`

Why this matters:

- Convex components let the app compose mature functionality without reimplementing everything.
- Lawn still wraps those components in app-specific domain logic rather than exposing them directly to the frontend.

Billing flow patterns:

- owners only may manage billing
- checkout and portal creation happen in actions
- plan changes are validated against current subscription state
- webhooks are handled in `http.ts`
- Convex mutations synchronize team billing state from Stripe events

For new apps:

- Treat third-party billing as domain logic plus infrastructure, not as raw frontend API calls.
- Use Convex components where they fit, but keep your app's business rules on top.

---

## 23. Security Patterns

Lawn includes several security patterns that are easy to miss when copying only the happy path.

### 23.1 Authorization is backend-enforced

Every sensitive query/mutation checks access in Convex.

### 23.2 Public share flows are rate-limited

Share grant issuance is protected by:

- global rate limiting
- token-specific rate limiting
- password-failure rate limiting

### 23.3 Password-protected shares use hashing

Passwords are stored as hashes, not plaintext.

### 23.4 Upload requests are validated

Actions validate:

- file size
- content type
- storage constraints

### 23.5 Webhooks are verified

Mux signature verification and Stripe webhook handling are explicit.

Why this matters:

- Lawn is not "secure because Clerk exists."
- It adds app-specific protections where public and external surfaces exist.

For new apps:

- Copy the mindset even if your exact features differ.
- Every public or semi-public entrypoint needs its own abuse controls.

---

## 24. Testing and Quality Patterns

Lawn's test coverage is not broad across the whole product, but it is targeted in important architectural places.

Specifically, it tests:

- route-data contracts,
- prewarm deduping behavior,
- prewarm intent debounce/cancel behavior.

Why this is the right kind of testing:

- It protects the custom infrastructure that navigation speed depends on.
- It locks down architecture conventions, not just UI snapshots.

Other quality patterns:

- explicit `typecheck`
- explicit `lint`
- generated OG assets script

For new apps:

- Test your custom architecture primitives, not just leaf UI.
- If you build a prewarm system or route-data layer, give it direct unit tests.

---

## 25. Deployment and Environment Patterns

Lawn documents a simple deployment shape:

- Vercel hosts the web app
- Convex hosts backend/runtime/webhook surface
- `build:vercel` deploys Convex first, then builds the app with the resulting URL wired into `VITE_CONVEX_URL`

Environment surface includes:

- Convex URL and deployment vars
- Clerk keys
- Mux tokens and webhook secret
- Stripe keys and price ids

Why this is a strong pattern:

- The frontend build receives the correct Convex deployment URL.
- Integrations are explicit and documented.
- The deployment shape matches the architectural split in the codebase.

For new apps:

- Document environment variables early.
- Make deployment scripts reflect the true dependency order of your systems.

---

## 26. What To Copy Exactly in a New App

If the goal is "build a new app with the same stack and overall patterns," these are the highest-value pieces to copy as-is conceptually:

- `app/` plus `src/` plus `convex/` repo split
- prerendered public pages plus SPA product surface
- thin route files with hyphen-prefixed implementation files
- companion `.data.ts` files per major route
- shared Convex route-data utility layer
- debounced and deduped intent-based prewarming
- root provider composition with Clerk and Convex
- centralized SEO helper
- centralized Convex auth/access helper module
- backend-enforced role checks
- domain-organized Convex modules
- actions for external side effects
- tiny `http.ts` adapter layer for webhooks
- explicit schema with unions and indexes
- targeted tests for custom architectural infrastructure

---

## 27. What Is App-Specific, Not Universal

Not everything in Lawn should be copied literally into every new app.

These are product-specific:

- video-specific domain model
- Mux integration details
- S3 upload details
- team/project/video naming
- share-link behavior specifics
- Stripe plans and storage limits
- brutalist visual identity

The pattern to copy is the shape:

- domain-first backend modules
- route-data contracts
- prewarm-based navigation
- centralized authz
- explicit infrastructure boundaries

---

## 28. Starter Blueprint

If you want to build a new app in Lawn's style, start here:

1. Create a TanStack Start app with `app/` as the route source directory.
2. Add Convex and Clerk.
3. Set up root providers:
   - `ClerkProvider`
   - `ConvexProviderWithClerk`
   - theme/provider shells as needed
4. Configure Vite for:
   - SPA product area
   - prerendered public pages
5. Build route conventions:
   - thin route files
   - `-implementation.tsx`
   - `-route.data.ts`
6. Create a shared SEO helper.
7. Create a shared Convex auth helper module with role-based access functions.
8. Model your domain explicitly in `convex/schema.ts`.
9. Use plain `convex/react` for core product reads.
10. Build route data contracts:
    - `get...EssentialSpecs()`
    - `use...Data()`
    - `prewarm...()`
11. Build a shared prewarm utility:
    - query-key builder
    - dedupe window
    - debounce and cancel logic
12. Add route-contract tests and prewarm utility tests.
13. Put all external integrations behind Convex actions.
14. Keep `http.ts` minimal and webhook-focused.
15. Document env vars and deployment commands early.

If you follow those steps, you will not just share Lawn's stack. You will share Lawn's actual architecture.

---

## Final Takeaway

The most important Lawn pattern is not any one file. It is the combination of:

- static public pages,
- SPA authenticated product flows,
- direct Convex subscriptions,
- route-level data contracts,
- intent-based prewarming,
- centralized authorization,
- domain-first backend modules,
- and narrow, explicit integration boundaries.

That combination is what makes the repo feel modern, fast, and maintainable. If you want a new app to feel like Lawn architecturally, preserve that combination more than any one code snippet.
