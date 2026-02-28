# Production TanStack Start + Convex Patterns
## Lessons from Lawn (pingdotgg/lawn) for OmniBid

> **Context:** Lawn is a video review platform built by Theo Browne (t3.gg) using TanStack Start + Convex + Clerk. It is open source, in daily production use by his team, and represents a battle-tested reference architecture for this stack. This document breaks down each key pattern Lawn uses, explains the reasoning behind it, and shows how to implement it in OmniBid.

---

## Table of Contents

1. [The Prerender + SPA Split](#1-the-prerender--spa-split)
2. [The `.data.ts` + Prewarm Pattern](#2-the-datats--prewarm-pattern)
3. [Thin Route Files](#3-thin-route-files)
4. [Auth: Clerk Identity-First Model](#4-auth-clerk-identity-first-model)
5. [Convex Backend Patterns](#5-convex-backend-patterns)
6. [Putting It All Together](#6-putting-it-all-together)

---

## 1. The Prerender + SPA Split

### The Problem

In a typical TanStack Start app, every page is server-side rendered on every request. This means your server runs the full React render pipeline for every visitor — even for pages like your landing page that are completely static, and even for dashboard pages where the server can't access auth tokens and ends up rendering an empty skeleton anyway.

OmniBid currently SSR's everything with `__root.tsx` rendering the shell (nav, footer, `<head>`) on first load. The homepage is static JSX so it happens to SSR fully, but data-driven pages behind auth just SSR an empty skeleton — which means the server is doing work for no benefit.

### What Lawn Does

Lawn splits its rendering strategy in `vite.config.ts` into two distinct modes:

**Marketing pages** (`/`, `/pricing`, comparison pages) are **prerendered at build time**. This means during `vite build`, TanStack Start actually renders these pages to static HTML files. They get served directly from Vercel's CDN as static assets — no server involved, instant load, perfect SEO.

**The dashboard** (`/dashboard/*`) runs in **SPA mode**. There is no server-side rendering for these routes at all. The browser receives the app shell (the HTML skeleton from `__root.tsx`), boots React, establishes the Convex WebSocket, and streams data in. This is a deliberate choice: because the dashboard requires Clerk authentication and Convex delivers data over a live WebSocket, server-rendering the dashboard would mean fetching data via HTTP on the server, serializing it, sending it to the client, and then re-establishing a WebSocket connection to take over reactivity. That round trip is pure waste.

### How to Configure It

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      // SPA mode for the entire app shell
      // Dashboard routes will render client-side only
      spa: {
        enabled: true,
      },

      // Prerender marketing pages at build time
      // These become static HTML served from CDN
      prerender: {
        enabled: true,
        // List every public/marketing page explicitly
        pages: ["/", "/pricing", "/about", "/contact"],
        crawlLinks: true, // Also discover and prerender linked pages
      },
    }),
  ],
});
```

### How It Works Under the Hood

When you run `vite build` with this configuration:

1. **Build phase:** TanStack Start compiles your entire app as normal.
2. **Prerender phase:** It spins up a local server, visits each page in `pages`, renders the full HTML (including any data from loaders on those routes), and saves the output as static `.html` files.
3. **SPA shell phase:** It renders `__root.tsx` without any route content (just the `<html>`, `<head>`, nav, footer) and saves that as `_shell.html`.
4. **At runtime:**
   - A request for `/` serves the prerendered `index.html` — instant, no server work.
   - A request for `/pricing` serves the prerendered `pricing.html` — same deal.
   - A request for `/proposals` (or any non-prerendered route) serves `_shell.html`. The browser loads React, the router matches the URL, and the page renders client-side.

### Selective SSR (Alternative Approach)

TanStack Start also supports **Selective SSR**, which lets you control SSR on a per-route basis without committing to full SPA mode. This can be useful if you want some routes to still SSR while others opt out:

```typescript
// src/routes/proposals/index.tsx
export const Route = createFileRoute("/proposals/")({
  // This route won't be server-rendered
  // beforeLoad and loader won't run on the server either
  ssr: false,
  component: ProposalsPage,
});
```

```typescript
// src/routes/index.tsx
export const Route = createFileRoute("/")({
  // This route WILL be server-rendered (default behavior)
  ssr: true,
  component: LandingPage,
});
```

The `ssr` property accepts three values:
- `true` (default): Full SSR — loaders run on server, component renders on server.
- `"data-only"`: Loaders run on server (data is prefetched), but the component only renders on the client.
- `false`: No server involvement — everything happens client-side.

Child routes inherit their parent's SSR setting and can only make it **more** restrictive (e.g., a child can't set `ssr: true` if its parent has `ssr: false`).

### Why This Matters for OmniBid

Your landing page (`/`) is purely static marketing content. There's zero reason for a server to render it on every request. Prerendering it means:
- First visit loads in ~50ms from CDN (vs hundreds of ms for SSR).
- Zero server cost for marketing traffic.
- Perfect SEO — crawlers see fully rendered HTML.

Your data pages (`/proposals`, `/proposals/$id`) can't meaningfully SSR anyway because the server doesn't have the session. Running them in SPA mode removes the pretense and avoids wasted server cycles.

---

## 2. The `.data.ts` + Prewarm Pattern

### The Problem

This is the single biggest architectural difference between OmniBid and Lawn, and the most impactful change you can make.

OmniBid's current data fetching flow:

```
User clicks link
  → TanStack Router navigates to new route
  → New route component mounts
  → useEffect runs, gets sessionId from localStorage
  → useQuery fires over WebSocket
  → Loading skeleton shows (200-500ms+ depending on data)
  → Data arrives, page renders
```

That skeleton flash on every navigation feels slow. And here's the frustrating part: your `defaultPreload: 'intent'` setting in `router.tsx` is configured to trigger prefetching on hover — but it's doing nothing because there are no loaders to trigger.

### What Lawn Does (The Prewarm Pattern)

Lawn made a deliberate architectural choice: **instead of using TanStack Start's loader functions (which fetch data via HTTP on the server), keep everything on the WebSocket and prewarm queries on user intent.**

The prewarm pattern has three parts:

#### Part 1: Data Contracts (`.data.ts` files)

Every route has a companion `.data.ts` file that exports the Convex queries that route needs. This is purely a declaration — it doesn't fetch anything by itself.

```typescript
// src/routes/proposals/-proposals.data.ts
import { api } from "~/convex/_generated/api";
import type { ConvexReactClient } from "convex/react";

// Declare what queries this route needs
export function prewarmProposalsList(convex: ConvexReactClient, sessionId: string) {
  // prewarmQuery subscribes via WebSocket and caches the result
  // It's essentially "start loading this data now, I'll need it soon"
  convex.prewarmQuery(api.proposals.list, { sessionId });
}
```

```typescript
// src/routes/proposals/-proposalDetail.data.ts
import { api } from "~/convex/_generated/api";
import type { ConvexReactClient } from "convex/react";

export function prewarmProposalDetail(
  convex: ConvexReactClient,
  proposalId: string,
  sessionId: string
) {
  // Prewarm all the queries this page will need
  convex.prewarmQuery(api.proposals.get, { proposalId, sessionId });
  convex.prewarmQuery(api.requirements.listByProposal, { proposalId, sessionId });
}
```

#### Part 2: Intent Hook (`useRoutePrewarmIntent`)

A custom hook that binds to `onMouseEnter`, `onFocus`, and `onTouchStart` events. When a user shows intent to navigate (hovering over a link, tabbing to it, or touching it on mobile), it fires the prewarm function.

```typescript
// src/lib/useRoutePrewarmIntent.ts
import { useCallback, useRef } from "react";

/**
 * Returns event handlers that fire a prewarm callback when the user
 * shows intent to interact (hover, focus, touch).
 *
 * The callback only fires once per mount to avoid redundant WebSocket
 * subscriptions. Convex's prewarmQuery is idempotent, but there's no
 * reason to call it repeatedly.
 */
export function useRoutePrewarmIntent(prewarmFn: () => void) {
  const hasFired = useRef(false);

  const handler = useCallback(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      prewarmFn();
    }
  }, [prewarmFn]);

  return {
    onMouseEnter: handler,
    onFocus: handler,
    onTouchStart: handler,
  };
}
```

#### Part 3: Wiring It Together

On components that link to data-heavy pages, spread the intent handlers onto the `<Link>`:

```tsx
// src/components/ProposalCard.tsx
import { Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { useRoutePrewarmIntent } from "~/lib/useRoutePrewarmIntent";
import { prewarmProposalDetail } from "~/routes/proposals/-proposalDetail.data";
import { getSessionId } from "~/lib/session";

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const convex = useConvex();

  // Set up prewarm handlers for this specific proposal
  const prewarmHandlers = useRoutePrewarmIntent(() =>
    prewarmProposalDetail(convex, proposal._id, getSessionId())
  );

  return (
    <Link
      to="/proposals/$proposalId"
      params={{ proposalId: proposal._id }}
      preload="intent" // TanStack preloads the JS bundle on hover
      {...prewarmHandlers} // Custom hook preloads the Convex data on hover
    >
      <div className="proposal-card">
        <h3>{proposal.name}</h3>
        <p>{proposal.status}</p>
      </div>
    </Link>
  );
}
```

### The Result: What Happens on Navigation

```
User hovers over link
  → TanStack Router preloads the JS bundle for the target route (preload="intent")
  → useRoutePrewarmIntent fires prewarmQuery over WebSocket
  → Convex starts fetching data server-side, subscribes to updates

User clicks link (200-400ms after hover)
  → TanStack Router navigates to new route
  → New route component mounts
  → useQuery fires — but the data is ALREADY in the Convex cache
  → Page renders instantly with data, no skeleton
```

This is what the document describing Lawn means by "WebSocket-first, aggressive client-side prewarming." Two things happen in parallel on hover:

1. **TanStack** preloads the JavaScript code for the target page.
2. **Convex** starts fetching and caching the data that page will need.

By the time the user clicks (humans take ~200-400ms between hover and click), both the code and data are ready. The page renders instantly.

### Understanding `prewarmQuery`

`ConvexReactClient.prewarmQuery()` is a method on the Convex React client that indicates likely future interest in a query. From Convex's documentation:

> The implementation currently immediately subscribes to a query. In the future this method may prioritize some queries over others, fetch the query result without subscribing, or do nothing in slow network connections or high load scenarios.

Key properties:
- It uses the **existing WebSocket connection** — no new HTTP requests.
- The subscription is temporary and will clean up after `gcTime` (default 5 minutes in React Query).
- It's **idempotent** — calling it multiple times for the same query is harmless.
- When a `useQuery` for the same query/args fires later, it resolves **synchronously** from cache.

### Why Not Just Use TanStack Loaders?

You might wonder why Lawn doesn't use the "official" TanStack Start approach of loaders + `ensureQueryData`. The reason is the **HTTP→WebSocket handoff problem:**

1. **Loader approach:** Server fetches data via HTTP → serializes to HTML → client receives HTML → client establishes WebSocket → WebSocket takes over reactivity. The data is fetched twice: once via HTTP (for the initial render) and once via WebSocket (for live updates).

2. **Prewarm approach:** Client establishes WebSocket once on app load → all data flows through that single connection → prewarmQuery just starts a subscription early. The data is fetched once, through the channel that will also deliver updates.

For an app like OmniBid where real-time updates matter (your proposal processing workflow updates live as steps complete), the prewarm approach is strictly better. You never have stale HTTP-fetched data that needs to be reconciled with WebSocket data.

### Prewarm for Dashboard/Index Pages

You can also prewarm the data for your main dashboard from the navigation header:

```tsx
// src/components/AppNav.tsx
import { Link } from "@tanstack/react-router";
import { useConvex } from "convex/react";
import { useRoutePrewarmIntent } from "~/lib/useRoutePrewarmIntent";
import { prewarmProposalsList } from "~/routes/proposals/-proposals.data";

function AppNav() {
  const convex = useConvex();

  const prewarmProposalsHandlers = useRoutePrewarmIntent(() =>
    prewarmProposalsList(convex, getSessionId())
  );

  return (
    <nav>
      <Link
        to="/proposals"
        preload="intent"
        {...prewarmProposalsHandlers}
      >
        My Proposals
      </Link>
    </nav>
  );
}
```

---

## 3. Thin Route Files

### The Problem

Coming from Next.js, you're probably used to putting everything in `page.tsx` — data fetching, state management, UI rendering. In TanStack Start, this creates bloated route files that mix routing concerns with application logic.

### What Lawn Does

Lawn uses a three-file pattern per route, which it calls "Thick Client / Thin Router":

```
src/routes/proposals/
  index.tsx              → Route definition (thin, ~10 lines)
  -proposals.tsx         → UI component (all the React rendering)
  -proposals.data.ts     → Data contract (Convex queries this view needs)
```

The `-` prefix is a TanStack Router convention: **files prefixed with `-` are ignored by the file-based router.** They won't generate routes. This lets you co-locate UI components and data files alongside route files without creating accidental routes.

### The Three Files

#### File 1: Route File (`index.tsx`) — The Thin Part

This file does almost nothing. It reads URL params, reads router context, and renders the UI component. That's it.

```typescript
// src/routes/proposals/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ProposalsPage } from "./-proposals";

export const Route = createFileRoute("/proposals/")({
  component: ProposalsPage,
});
```

For routes with params:

```typescript
// src/routes/proposals/$proposalId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ProposalDetailPage } from "./-proposalDetail";

export const Route = createFileRoute("/proposals/$proposalId")({
  component: ProposalDetailPage,
});
```

That's it. 5-8 lines. The route file's only job is to map a URL pattern to a component.

#### File 2: UI Component (`-proposals.tsx`) — The Thick Part

All your actual React code lives here. This is a normal React component — hooks, state, rendering, everything.

```tsx
// src/routes/proposals/-proposals.tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "~/convex/_generated/api";
import { getSessionId } from "~/lib/session";
import { ProposalCard } from "~/components/ProposalCard";

export function ProposalsPage() {
  const sessionId = getSessionId();

  const { data: proposals, isPending } = useQuery(
    convexQuery(api.proposals.list, { sessionId })
  );

  if (isPending) return <ProposalsSkeleton />;

  return (
    <div>
      <h1>Your Proposals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proposals?.map((proposal) => (
          <ProposalCard key={proposal._id} proposal={proposal} />
        ))}
      </div>
    </div>
  );
}
```

#### File 3: Data Contract (`-proposals.data.ts`) — The Prewarm Part

Exports the prewarm function that other components use to preload this route's data on hover.

```typescript
// src/routes/proposals/-proposals.data.ts
import { api } from "~/convex/_generated/api";
import type { ConvexReactClient } from "convex/react";

export function prewarmProposalsList(
  convex: ConvexReactClient,
  sessionId: string
) {
  convex.prewarmQuery(api.proposals.list, { sessionId });
}
```

### Why This Separation Matters

1. **Route files are stable.** Once you set up a route, you almost never touch it. URL changes are rare. But UI changes happen constantly. Separating them means your git history is clean and refactoring is safe.

2. **Data contracts are importable.** The `.data.ts` file can be imported by any component that links to this route. Your navigation header, your sidebar, a "recent proposals" widget — they all import `prewarmProposalsList` and use it. If the data file lived inside the route file, you'd have circular dependency issues.

3. **UI components are reusable.** The `-proposals.tsx` component is just a React component. You could render it in a modal, in a different layout, or in a test harness. It has no coupling to TanStack Router's file conventions.

4. **It mirrors the Next.js mental model, but cleaner.** In Next.js App Router, you have `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` — all co-located but with specific framework roles. Lawn's pattern is similar but gives you explicit control over the separation.

### Full Directory Structure Example

Here's what a complete OmniBid route structure could look like with this pattern:

```
src/routes/
  __root.tsx                              → App shell (nav, footer, providers)
  index.tsx                               → / (landing page, prerendered)
  pricing.tsx                             → /pricing (prerendered)
  proposals/
    index.tsx                             → /proposals (route definition, thin)
    -proposals.tsx                        → Proposals list UI component
    -proposals.data.ts                    → Prewarm: api.proposals.list
    new.tsx                               → /proposals/new (route definition, thin)
    -newProposal.tsx                      → Upload + create UI component
    $proposalId.tsx                       → /proposals/:id (route definition, thin)
    -proposalDetail.tsx                   → Proposal detail UI component
    -proposalDetail.data.ts              → Prewarm: api.proposals.get + api.requirements.list
```

---

## 4. Auth: Clerk Identity-First Model

### The Problem

OmniBid currently uses a random UUID stored in `localStorage` as a session identifier. This works for MVP, but it has architectural consequences: the server can't access `localStorage`, so you can't prefetch data on the server, and there's no real user identity for access control.

### What Lawn Does

Lawn uses **Clerk** for authentication with what they call an "Identity-First" model. The key architectural decision is: **no `users` table in Convex.**

#### The Traditional Approach (What Lawn Avoided)

Most tutorials show this pattern:

1. User signs up with Clerk.
2. Clerk fires a webhook to your Convex HTTP endpoint.
3. The webhook handler creates a row in a `users` table in Convex.
4. Your app queries the `users` table to get user data.

The problem: **race conditions.** A user signs up, Clerk redirects them to your app, and your app tries to query their user row — but the webhook hasn't arrived yet. The user sees an error or empty state on their first visit. You end up writing retry logic, loading states, and polling to paper over the gap.

#### The Identity-First Approach (What Lawn Uses)

1. User authenticates with Clerk.
2. Clerk issues a JWT token.
3. The Convex client sends this JWT with every request via the `ConvexProviderWithClerk` provider.
4. On the backend, `ctx.auth.getUserIdentity()` extracts the user's identity directly from the JWT.
5. Domain tables (like `teamMembers`, `projects`) store the Clerk user ID directly — no foreign key to a `users` table.

```typescript
// convex/proposals.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get user identity directly from the JWT — no database lookup
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Query proposals using the Clerk user ID directly
    return await ctx.db
      .query("proposals")
      .withIndex("by_owner", (q) =>
        q.eq("ownerId", identity.subject) // identity.subject = Clerk user ID
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    // ... other fields
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("proposals", {
      ...args,
      ownerId: identity.subject, // Store Clerk ID directly, no users table needed
      ownerName: identity.name ?? "Unknown",
      ownerEmail: identity.email ?? "",
      createdAt: Date.now(),
    });
  },
});
```

#### The Convex Schema (No Users Table)

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // NO users table — identity comes from Clerk JWT

  proposals: defineTable({
    name: v.string(),
    status: v.string(),
    ownerId: v.string(), // This IS the Clerk user ID (identity.subject)
    ownerName: v.string(),
    ownerEmail: v.string(),
    fileId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  requirements: defineTable({
    proposalId: v.id("proposals"),
    text: v.string(),
    section: v.string(),
    complianceStatus: v.string(),
  }).index("by_proposal", ["proposalId"]),
});
```

#### Frontend Setup: TanStack Start + Clerk + Convex

The wiring happens in three places:

**1. Router setup (`router.tsx`):**

```typescript
// src/router.tsx
import { createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexReactClient } from "convex/react";
import { routeTree } from "./routeTree.gen";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

const convex = new ConvexReactClient(CONVEX_URL);
const convexQueryClient = new ConvexQueryClient(convex);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

export function createRouter() {
  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      context: {
        queryClient,
        convexClient: convex,
        convexQueryClient,
      },
      scrollRestoration: true,
    }),
    queryClient
  );
}
```

**2. Root route (`__root.tsx`) — Clerk + Convex providers:**

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { getAuth } from "@clerk/tanstack-start/server";
import { getWebRequest } from "vinxi/http";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/tanstack-start";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider } from "convex/react";
import type { QueryClient } from "@tanstack/react-query";

// Server function to get Clerk auth state during SSR
const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await getAuth(getWebRequest()!);
  return { userId };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  // Check auth state before loading any route
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth();
    return { userId };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <ClerkProvider>
      {/* ConvexProviderWithClerk automatically passes Clerk JWTs to Convex */}
      <ConvexProviderWithClerk useAuth={useAuth}>
        <div className="min-h-screen flex flex-col">
          <header>
            <nav>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton />
              </SignedOut>
            </nav>
          </header>
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

**3. Protected route layout (`_authed.tsx`):**

TanStack Router supports **layout routes** (prefixed with `_`). These don't create a URL segment but wrap child routes. Lawn uses this to create an auth boundary:

```typescript
// src/routes/_authed.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context }) => {
    // context.userId was set in __root.tsx's beforeLoad
    if (!context.userId) {
      // Redirect to sign-in if not authenticated
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
```

Then, all authenticated routes are nested under `_authed/`:

```
src/routes/
  __root.tsx                    → App shell, Clerk + Convex providers
  index.tsx                     → / (public landing page)
  pricing.tsx                   → /pricing (public)
  _authed.tsx                   → Auth boundary (redirects if not logged in)
  _authed/
    proposals/
      index.tsx                 → /proposals (protected)
      $proposalId.tsx           → /proposals/:id (protected)
```

The underscore prefix (`_authed`) means this directory creates a **pathless layout route** — it doesn't add `/authed/` to the URL. Routes inside `_authed/proposals/` are still accessed at `/proposals`, but they're protected by the `beforeLoad` auth check.

#### Why Identity-First is Better

1. **No race conditions.** The user's identity is in the JWT, available immediately. No waiting for webhooks.
2. **No extra table.** One fewer table to query, one fewer thing to keep in sync.
3. **No webhook infrastructure.** No Clerk webhook endpoint to maintain, no signature verification for user events.
4. **Clerk handles the UI.** User profile, avatar, email — all managed by Clerk's components (`<UserButton />`). You don't need to replicate this data.
5. **Simpler Convex functions.** Every function just calls `ctx.auth.getUserIdentity()` instead of doing a database lookup for the user.

#### When You DO Need a Users Table

The identity-first model works great when you only need to know *who* the current user is. If you need to store user-specific settings, preferences, or app-level profile data that Clerk doesn't manage, you can add a lightweight table later — but it should be created lazily (on first use) rather than eagerly (via webhook on signup).

```typescript
// convex/userSettings.ts — create-on-first-use pattern
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) return existing;

    // Create settings on first access — no webhook needed
    const id = await ctx.db.insert("userSettings", {
      clerkId: identity.subject,
      theme: "system",
      emailNotifications: true,
    });

    return await ctx.db.get(id);
  },
});
```

---

## 5. Convex Backend Patterns

### Public vs. Internal Functions

Lawn enforces a strict separation between functions the browser can call and functions that only the server can call.

```typescript
// convex/proposals.ts
import { query, mutation } from "./_generated/server";
import { internalMutation, internalAction } from "./_generated/server";

// PUBLIC: Browser can call this
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.query("proposals").collect();
  },
});

// INTERNAL: Only other Convex functions can call this
// A user CANNOT call this from the browser console
export const updateProcessingStatus = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    status: v.string(),
    step: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      status: args.status,
      currentStep: args.step,
    });
  },
});
```

For OmniBid, your AI workflow steps (resolving, extracting, validating) should all be `internalAction` or `internalMutation`. The only public-facing mutation should be `create` (to kick off the workflow). This prevents a user from calling `api.proposals.updateProcessingStatus` from the browser console and manually marking a proposal as complete.

### HTTP Router for Webhooks

When you integrate external services (payment processors, AI model callbacks, etc.), use Convex's HTTP router with the internal function pattern:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate webhook signature
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Signature validation logic here...

    // Hand off to internal function — browser can't call this
    await ctx.runAction(internal.stripe.processWebhook, {
      body,
      signature: signature!,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

---

## 6. Putting It All Together

### Migration Path for OmniBid

Here's the recommended order to adopt these patterns, from quickest win to most involved:

#### Phase 1: Prerender + SPA Split (30 minutes)

Update `vite.config.ts` to prerender your landing page and run app routes as SPA. This is a config-only change — no code modifications needed.

#### Phase 2: Thin Route Files + Data Contracts (2-4 hours)

For each route:
1. Create a `-routeName.tsx` file and move all UI code there.
2. Create a `-routeName.data.ts` file with the prewarm function.
3. Slim the route file down to just `createFileRoute` + component import.

#### Phase 3: Prewarm Hook (1 hour)

1. Create `useRoutePrewarmIntent.ts`.
2. Update your `<Link>` components (navigation, proposal cards, etc.) to spread the prewarm handlers.
3. The `preload="intent"` you already have handles JS preloading; the prewarm hook handles data preloading.

#### Phase 4: Clerk Auth (4-8 hours)

1. Set up Clerk account and JWT template for Convex.
2. Replace `ConvexProvider` with `ConvexProviderWithClerk` in `__root.tsx`.
3. Add `_authed.tsx` layout route for protected pages.
4. Update Convex functions to use `ctx.auth.getUserIdentity()` instead of `sessionId` args.
5. Remove `getSessionId()` / localStorage logic entirely.
6. Update your schema to use `ownerId` (Clerk subject) instead of `sessionId`.

#### Phase 5: Internal Functions (1-2 hours)

1. Identify all Convex functions that should only be called server-side (workflow steps, status updates, admin operations).
2. Change their exports from `mutation`/`action` to `internalMutation`/`internalAction`.
3. Update callers to use `internal.moduleName.functionName` instead of `api.moduleName.functionName`.

### Reference Links

- [Lawn GitHub Repository](https://github.com/pingdotgg/lawn)
- [Convex + TanStack Start Docs](https://docs.convex.dev/client/tanstack/tanstack-start/)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)
- [TanStack Start + Clerk + Convex Guide](https://docs.convex.dev/client/tanstack/tanstack-start/clerk)
- [TanStack Start SPA Mode Docs](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode)
- [TanStack Start Selective SSR Docs](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr)
- [TanStack Start Static Prerendering Docs](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
- [Convex `prewarmQuery` API Reference](https://docs.convex.dev/api/classes/react.ConvexReactClient#prewarmquery)
- [Convex Internal Functions](https://docs.convex.dev/functions/internal-functions)
- [Convex HTTP Router](https://docs.convex.dev/functions/http-actions)