# OmniBid MVP: Technical Plan v2

## Auth Decision: WorkOS AuthKit

### Why WorkOS Over Clerk and Better Auth

| Criteria | Better Auth | Clerk | WorkOS AuthKit |
|----------|-------------|-------|----------------|
| **Cost at 0-1k users** | $0 (open source) | $0 (free tier) | $0 (free to 1M MAUs) |
| **Cost at 10k users** | $0 | ~$25/mo Pro | $0 |
| **Enterprise SSO (SAML)** | DIY plugin setup | $50/connection/mo + $100 add-on | $125/connection/mo |
| **Directory Sync (SCIM)** | Not supported | Not native | $125/connection/mo |
| **Audit Logs** | Not built-in | Not built-in | Built-in ($5/org/mo) |
| **Admin Portal** | Build yourself | Basic org management | Self-serve IT admin portal |
| **Convex integration** | Official component | Official docs (Clerk+TanStack Start) | Official component |
| **Multi-org / tenancy** | Plugin-based | Good (Organizations feature) | Enterprise-grade |
| **Self-serve SSO setup** | No | No (admin configures) | Yes (Admin Portal) |
| **SOC 2 / compliance** | N/A (self-hosted) | SOC 2 Type II | SOC 2 Type II, GDPR, CCPA |
| **TanStack Start support** | Official guide at labs.convex.dev | Official Convex+Clerk guide | Official Convex component |
| **Data ownership** | You own everything | Clerk hosts | WorkOS hosts (or self-serve) |
| **Maturity for B2B SaaS** | Young, community-driven | Consumer-first, B2B added later | Built for B2B from day one |

**The decision comes down to your customer trajectory:**

Your customers are government contractors selling to enterprises. Within 12-18 months you'll have mid-market firms ($50M+ revenue) asking for SAML SSO with their Okta/Azure AD. Within 24 months you'll have defense primes asking for SCIM directory sync and audit logs.

**WorkOS is built for exactly this trajectory.** It's free until your enterprise customers need SSO, then you charge them for your Enterprise tier (which more than covers the $125/connection cost). The self-serve Admin Portal means Lockheed's IT admin can configure their SAML connection without you doing any manual work. Clerk and Better Auth both require you to build that enterprise plumbing yourself.

**Better Auth** is tempting because it's free and open source, and the Convex component integration is clean. But you'd be building your own SSO admin portal, your own SCIM sync, and your own audit log system. For a solo founder, that's weeks of work that doesn't ship proposals.

**Clerk** is great for consumer apps and early B2B, but its enterprise features feel bolted on. SAML is an add-on ($100/mo + $50/connection), it lacks native SCIM, and it doesn't have the self-serve Admin Portal that enterprise IT teams expect. The Convex+Clerk+TanStack Start integration is well-documented, which is a real advantage — but it's not enough to overcome the enterprise gaps.

**The play:** Start with WorkOS AuthKit for free (email/password, Google OAuth, MFA). When an enterprise customer asks for SSO, enable it and charge them $25k+/year for your Enterprise tier. WorkOS costs you $125/mo for that connection. You pocket the rest.

---

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | TanStack Start | SSR, file-based routing, typesafe, React Query integration |
| **Backend** | Convex | Real-time subscriptions, vector search, agents, file storage |
| **Auth** | WorkOS AuthKit (`@convex-dev/workos-authkit`) | Free to 1M MAUs, enterprise SSO/SCIM when needed |
| **Deployment** | Vercel | Edge functions, TanStack Start support, instant deploys |
| **Payments** | Stripe | Per-proposal billing + SaaS subscriptions |
| **Orchestration** | `@convex-dev/workflow` | Durable multi-step RFP processing with retry + parallelism |
| **RAG** | `@convex-dev/rag` | Company knowledge base with namespaced vector search |
| **Collaborative Editor** | `@convex-dev/prosemirror-sync` + Tiptap | OT-based real-time collaborative editing |
| **AI Agents** | `@convex-dev/agents` | LLM orchestration with persistent threads and tool calling |
| **Document Parsing** | LlamaParse (PDF→markdown) | Preserves tables, headers, structure from complex PDFs |
| **LLM** | Anthropic Claude Sonnet (writing/analysis) + OpenAI o3 (structured extraction) | Best-in-class for different tasks |
| **UI** | shadcn/ui + Tailwind | Professional, accessible, fast to build |

---

## Component Registration

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import workflow from "@convex-dev/workflow/convex.config.js";
import rag from "@convex-dev/rag/convex.config.js";
import prosemirrorSync from "@convex-dev/prosemirror-sync/convex.config.js";
import agent from "@convex-dev/agents/convex.config.js";
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";

const app = defineApp();
app.use(workflow);
app.use(rag);
app.use(prosemirrorSync);
app.use(agent);
app.use(workOSAuthKit);

export default app;
```

---

## Project Structure

```
omnibid/
├── app/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout, WorkOS AuthKit + Convex providers
│   │   ├── index.tsx               # Landing / marketing page
│   │   ├── dashboard/
│   │   │   ├── index.tsx           # Proposals list
│   │   │   ├── new.tsx             # New proposal wizard
│   │   │   └── $proposalId/
│   │   │       ├── index.tsx       # Proposal workspace (3-panel layout)
│   │   │       ├── matrix.tsx      # Compliance matrix standalone view
│   │   │       └── export.tsx      # Export / download
│   │   ├── settings/
│   │   │   ├── company.tsx         # Company profile + NAICS/CAGE codes
│   │   │   ├── documents.tsx       # Knowledge base management
│   │   │   └── team.tsx            # Team + invitations
│   │   └── api/
│   │       └── webhooks/
│   │           └── stripe.tsx      # Stripe webhook handler
│   ├── router.tsx                  # TanStack router config
│   ├── components/
│   │   ├── proposal/
│   │   │   ├── ComplianceMatrix.tsx
│   │   │   ├── ProposalEditor.tsx      # Tiptap + prosemirror-sync
│   │   │   ├── RequirementItem.tsx
│   │   │   ├── WinScoreGauge.tsx
│   │   │   ├── GenerationProgress.tsx
│   │   │   └── SectionSidebar.tsx
│   │   ├── ui/                     # shadcn components
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   └── lib/
│       └── stripe.ts
├── convex/
│   ├── _generated/
│   ├── convex.config.ts            # Component registration (above)
│   ├── schema.ts                   # Database schema
│   ├── http.ts                     # WorkOS webhooks + Stripe webhooks
│   │
│   ├── # --- Auth ---
│   ├── auth.ts                     # WorkOS AuthKit setup + event handlers
│   │
│   ├── # --- Core Data ---
│   ├── users.ts
│   ├── companies.ts
│   ├── proposals.ts
│   ├── requirements.ts
│   ├── sections.ts
│   │
│   ├── # --- RAG Knowledge Base ---
│   ├── knowledgeBase.ts            # @convex-dev/rag instance + add/search
│   │
│   ├── # --- Collaborative Editor ---
│   ├── editor.ts                   # @convex-dev/prosemirror-sync instance
│   │
│   ├── # --- Workflows ---
│   ├── workflows/
│   │   ├── manager.ts              # WorkflowManager instance
│   │   ├── ingestRfp.ts            # RFP parsing pipeline
│   │   ├── generateDraft.ts        # Multi-section draft generation
│   │   └── ingestDocument.ts       # Company doc → RAG pipeline
│   │
│   ├── # --- Workflow Steps ---
│   ├── steps/
│   │   ├── fetchRfp.ts             # Download/scrape RFP content
│   │   ├── parseDocument.ts        # LlamaParse PDF→markdown
│   │   ├── chunkDocument.ts        # Semantic chunking
│   │   ├── extractMetadata.ts      # LLM: solicitation metadata
│   │   ├── extractRequirements.ts  # LLM: requirements from chunk
│   │   ├── deduplicateReqs.ts      # LLM: merge/dedup requirements
│   │   ├── generateOutline.ts      # LLM: proposal section structure
│   │   ├── writeSection.ts         # LLM: write one section with RAG
│   │   ├── scoreSection.ts         # LLM: red-team score a section
│   │   └── embedChunks.ts          # Embed + store in RAG component
│   │
│   ├── # --- Agents ---
│   ├── agents/
│   │   └── reviewAgent.ts          # AI red-team reviewer
│   │
│   └── crons.ts                    # Stale job cleanup
│
├── vite.config.ts
├── app.config.ts
└── package.json
```

---

## Database Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==========================================
  // USERS & COMPANIES
  // ==========================================
  users: defineTable({
    // WorkOS fields (synced via @convex-dev/workos-authkit events)
    authId: v.string(),         // WorkOS user ID
    email: v.string(),
    name: v.string(),

    // App fields
    companyId: v.optional(v.id("companies")),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    stripeCustomerId: v.optional(v.string()),
    proposalCredits: v.number(),
  })
    .index("by_auth_id", ["authId"])
    .index("by_email", ["email"])
    .index("by_company", ["companyId"]),

  companies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    naicsCodes: v.optional(v.array(v.string())),
    cageCodes: v.optional(v.array(v.string())),
    setAsides: v.optional(v.array(v.string())),
    // RAG namespace is the company ID (auto-generated)
    createdBy: v.id("users"),
  }),

  companyDocuments: defineTable({
    companyId: v.id("companies"),
    title: v.string(),
    type: v.union(
      v.literal("past_proposal"),
      v.literal("resume"),
      v.literal("capability_statement"),
      v.literal("past_performance"),
      v.literal("technical_manual"),
      v.literal("other")
    ),
    fileId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("uploading"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
    chunkCount: v.optional(v.number()),
    uploadedBy: v.id("users"),
  })
    .index("by_company", ["companyId"])
    .index("by_company_type", ["companyId", "type"]),

  // ==========================================
  // PROPOSALS
  // ==========================================
  proposals: defineTable({
    companyId: v.id("companies"),
    createdBy: v.id("users"),
    title: v.string(),
    status: v.union(
      v.literal("ingesting"),
      v.literal("matrix_ready"),
      v.literal("generating"),
      v.literal("draft_ready"),
      v.literal("in_review"),
      v.literal("final"),
      v.literal("submitted"),
      v.literal("error")
    ),

    // RFP source
    rfpSource: v.union(v.literal("url"), v.literal("upload")),
    rfpUrl: v.optional(v.string()),
    rfpFileId: v.optional(v.id("_storage")),

    // Extracted metadata
    solicitation: v.optional(v.object({
      number: v.optional(v.string()),
      title: v.optional(v.string()),
      agency: v.optional(v.string()),
      office: v.optional(v.string()),
      dueDate: v.optional(v.string()),
      setAside: v.optional(v.string()),
      naicsCode: v.optional(v.string()),
      contractType: v.optional(v.string()),
      estimatedValue: v.optional(v.string()),
      periodOfPerformance: v.optional(v.string()),
    })),

    formatting: v.optional(v.object({
      pageLimit: v.optional(v.number()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      margins: v.optional(v.string()),
      lineSpacing: v.optional(v.string()),
      volumes: v.optional(v.array(v.string())),
    })),

    // Scoring
    winScore: v.optional(v.number()),
    complianceScore: v.optional(v.number()),

    // Workflow tracking
    workflowId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),

    // Parsed RFP stored as chunks for context retrieval
    // (indexed in @convex-dev/rag under namespace: `rfp:{proposalId}`)
  })
    .index("by_company", ["companyId"])
    .index("by_creator", ["createdBy"])
    .index("by_status", ["status"]),

  // Parsed RFP chunks (stored in Convex for reference, also indexed in RAG)
  rfpChunks: defineTable({
    proposalId: v.id("proposals"),
    chunkIndex: v.number(),
    text: v.string(),
    section: v.optional(v.string()),   // "Section L", "Section M", "Section C", etc.
    pageRange: v.optional(v.string()), // "42-48"
    tokenCount: v.number(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_proposal_section", ["proposalId", "section"]),

  // ==========================================
  // REQUIREMENTS (compliance matrix)
  // ==========================================
  requirements: defineTable({
    proposalId: v.id("proposals"),
    category: v.union(
      v.literal("mandatory"),
      v.literal("evaluation_factor"),
      v.literal("formatting"),
      v.literal("deliverable"),
      v.literal("certification"),
      v.literal("personnel"),
      v.literal("other")
    ),
    text: v.string(),
    rfpReference: v.string(),
    volume: v.optional(v.string()),
    evaluationWeight: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("addressed"),
      v.literal("partially_addressed"),
      v.literal("not_applicable")
    ),
    mappedSectionId: v.optional(v.id("sections")),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_proposal_category", ["proposalId", "category"])
    .index("by_proposal_status", ["proposalId", "status"]),

  // ==========================================
  // SECTIONS (proposal document)
  // ==========================================
  sections: defineTable({
    proposalId: v.id("proposals"),
    volume: v.string(),
    title: v.string(),
    parentId: v.optional(v.id("sections")),
    sortOrder: v.number(),
    depth: v.number(),

    // prosemirror-sync document ID for this section's editor content
    editorDocId: v.optional(v.string()),

    contentType: v.union(
      v.literal("text"),
      v.literal("graphic"),
      v.literal("table"),
      v.literal("placeholder")
    ),

    generationStatus: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("generated"),
      v.literal("human_edited"),
      v.literal("error")
    ),

    addressedRequirementIds: v.optional(v.array(v.id("requirements"))),
    complianceScore: v.optional(v.number()),
    qualityScore: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_proposal_volume", ["proposalId", "volume"])
    .index("by_parent", ["parentId"]),
});
```

---

## Auth Setup: WorkOS AuthKit

```typescript
// convex/auth.ts
import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

const authFunctions: AuthFunctions = internal.auth;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
});

// Sync WorkOS user events → our users table
export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    await ctx.db.insert("users", {
      authId: event.data.id,
      email: event.data.email,
      name: `${event.data.firstName} ${event.data.lastName}`,
      role: "owner",
      plan: "free",
      proposalCredits: 1, // one free parse to try the product
    });
  },

  "user.updated": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", event.data.id))
      .unique();
    if (!user) return;
    await ctx.db.patch(user._id, {
      email: event.data.email,
      name: `${event.data.firstName} ${event.data.lastName}`,
    });
  },

  "user.deleted": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", event.data.id))
      .unique();
    if (!user) return;
    await ctx.db.delete(user._id);
  },
});
```

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { authKit } from "./auth";

const http = httpRouter();

// WorkOS webhook routes (user sync)
authKit.registerRoutes(http);

// Stripe webhook route would go here too

export default http;
```

```typescript
// convex/users.ts
import { query } from "./_generated/server";
import { authKit } from "./auth";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const workosUser = await authKit.getAuthUser(ctx);
    if (!workosUser) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", workosUser.id))
      .unique();

    return user;
  },
});
```

---

## RAG Knowledge Base Setup

```typescript
// convex/knowledgeBase.ts
"use node";

import { components, internal } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

// Filter types for searching different content categories
type FilterTypes = {
  docType: string;     // "past_proposal", "resume", "capability_statement", etc.
  source: string;      // "company_doc" or "rfp"
};

export const rag = new RAG<FilterTypes>(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
  filterNames: ["docType", "source"],
});

// Add company document chunks to RAG
export const addCompanyContent = internalAction({
  args: {
    companyId: v.string(),
    text: v.string(),
    title: v.string(),
    docType: v.string(),
  },
  handler: async (ctx, args) => {
    await rag.add(ctx, {
      namespace: `company:${args.companyId}`,
      text: args.text,
      title: args.title,
      filterValues: [
        { name: "docType", value: args.docType },
        { name: "source", value: "company_doc" },
      ],
    });
  },
});

// Add RFP chunks to RAG (for cross-referencing during writing)
export const addRfpContent = internalAction({
  args: {
    proposalId: v.string(),
    text: v.string(),
    section: v.string(),
  },
  handler: async (ctx, args) => {
    await rag.add(ctx, {
      namespace: `rfp:${args.proposalId}`,
      text: args.text,
      title: args.section,
      filterValues: [
        { name: "source", value: "rfp" },
      ],
    });
  },
});

// Search company knowledge base for relevant content
export const searchCompanyDocs = internalAction({
  args: {
    companyId: v.string(),
    query: v.string(),
    docType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const filters = args.docType
      ? [{ name: "docType" as const, value: args.docType }]
      : undefined;

    const { results, text } = await rag.search(ctx, {
      namespace: `company:${args.companyId}`,
      query: args.query,
      filters,
      limit: args.limit ?? 10,
      chunkContext: { before: 2, after: 1 }, // surrounding context for better writing
    });

    return { results, text };
  },
});
```

---

## Workflow Manager Setup

```typescript
// convex/workflows/manager.ts
import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "../_generated/api";

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10,
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 2000,
      base: 2,
    },
    retryActionsByDefault: true,
  },
});
```

---

## The Ingestion Pipeline (Durable Workflow)

This is the most critical technical piece. A 400-page RFP goes through a durable,
resumable pipeline that survives server restarts and retries failed LLM calls.

```typescript
// convex/workflows/ingestRfp.ts
import { workflow } from "./manager";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const ingestRfpWorkflow = workflow.define({
  args: {
    proposalId: v.id("proposals"),
    rfpUrl: v.optional(v.string()),
    rfpFileId: v.optional(v.id("_storage")),
  },
  handler: async (step, args): Promise<void> => {
    const { proposalId } = args;

    // ─── Step 1: Fetch & Parse RFP into Markdown ───
    // Uses LlamaParse. Returns the ID of a stored parsedDoc.
    // Retries automatically on LlamaParse API failures.
    const parsedDocId = await step.runAction(
      internal.steps.fetchRfp,
      { proposalId, rfpUrl: args.rfpUrl, rfpFileId: args.rfpFileId },
      { retry: { maxAttempts: 3, initialBackoffMs: 3000 } }
    );

    // ─── Step 2: Semantic Chunking ───
    // Splits the markdown into logical chunks at section boundaries.
    // Stores chunks in rfpChunks table AND indexes them in RAG.
    // Returns an array of chunk IDs.
    const chunkIds = await step.runAction(
      internal.steps.chunkDocument,
      { proposalId, parsedDocId }
    );

    // ─── Step 3: Extract Solicitation Metadata ───
    // Single LLM call on the first ~30k tokens.
    // Extracts: solicitation number, agency, due date, NAICS, set-aside, etc.
    await step.runAction(
      internal.steps.extractMetadata,
      { proposalId, chunkIds: chunkIds.slice(0, 5) } // first 5 chunks for metadata
    );

    // ─── Step 4: Extract Requirements from Each Chunk (PARALLEL) ───
    // This is where we solve the context limit problem.
    // Each chunk is processed independently with a focused extraction prompt.
    // ~5-8k tokens per LLM call. All chunks run in parallel.
    const extractionResults = await Promise.all(
      chunkIds.map((chunkId) =>
        step.runAction(
          internal.steps.extractRequirements,
          { proposalId, chunkId }
        )
      )
    );

    // ─── Step 5: Deduplicate & Cross-Reference ───
    // All extracted requirements fit in one LLM call (~20-30k tokens).
    // Merges duplicates, cross-references Section M criteria with Section L,
    // assigns evaluation weights.
    await step.runAction(
      internal.steps.deduplicateReqs,
      { proposalId }
    );

    // ─── Step 6: Extract Formatting Rules ───
    await step.runAction(
      internal.steps.extractFormatting,
      { proposalId, chunkIds }
    );

    // ─── Step 7: Generate Proposal Outline ───
    // Creates section structure mapped to requirements.
    // Also creates prosemirror-sync documents for each section.
    await step.runAction(
      internal.steps.generateOutline,
      { proposalId }
    );

    // ─── Step 8: Mark Complete ───
    await step.runMutation(
      internal.proposals.updateStatus,
      { proposalId, status: "matrix_ready" }
    );
  },
});
```

### Why Workflow Solves the Reliability Problem

Without `@convex-dev/workflow`, if LlamaParse fails on step 1 or if the server
restarts during step 4, the entire pipeline is lost. With Workflow:

- Each step's result is persisted in the journal. If the server restarts after
  step 3, steps 1-3 are skipped and execution resumes at step 4.
- Each step has independent retry with exponential backoff. If Claude's API
  returns a 529 (overloaded) during requirement extraction, that single chunk
  retries 3 times while all other chunks continue.
- The `Promise.all` in step 4 processes all chunks in parallel. A 100-chunk
  RFP with 10 max parallelism finishes in 10 batches instead of 100 sequential calls.
- The user can cancel the workflow mid-parse via `workflow.cancel()`.
- The frontend observes workflow status via `workflow.status()` — live-updating
  progress without a custom jobs table.

---

## How Context Limits Are Actually Solved

### The Core Problem

A complex federal RFP: 100-400+ pages = 50,000-200,000+ tokens.
A company knowledge base: 50-500+ documents = 500,000+ tokens.
Claude's context window: 200k tokens.
A single section-writing call needs: requirements + evaluation criteria +
company context + formatting rules + system prompt + generation space.

**You never need the entire RFP in context at once.**

### The Architecture: Five Layers

```
Layer 1: Parse & Chunk (at ingestion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  400-page PDF
    → LlamaParse → Structured Markdown (tables, headers preserved)
    → Semantic Chunker → 50-100 chunks of ~2,000-4,000 tokens each
    → Each chunk → Convex rfpChunks table (for direct access)
    → Each chunk → @convex-dev/rag namespace `rfp:{proposalId}` (for search)

  Key: Split at logical boundaries (Section L, Section M, Section C,
  individual SOW paragraphs, CDRL tables), NOT arbitrary token counts.

Layer 2: Per-Chunk Extraction (parallel, independent)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  For each chunk independently:
    System prompt: "Extract every shall/must/will requirement" (~500 tokens)
    + Chunk context metadata: "Section L, pages 42-48"              (~100 tokens)
    + The chunk itself                                              (~3,000 tokens)
    + Output: JSON array of requirements                            (~1,000 tokens)
    ─────────────────────────────────────────────────────────────────
    Total per call: ~5,000 tokens (trivial for any model)

  50 chunks × 5k tokens = 50 parallel LLM calls
  Wall-clock time: ~30-60 seconds (all parallel via Workflow)

Layer 3: Consolidation (single focused call)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  After extraction, 400 pages compress to:
    100-300 structured requirements × ~100 tokens each = ~15,000-30,000 tokens

  One deduplication/cross-reference call:
    System prompt                                                   (~1,000 tokens)
    + All extracted requirements as JSON                            (~20,000 tokens)
    + Section M evaluation criteria (already extracted)             (~2,000 tokens)
    + Output: merged, weighted compliance matrix                    (~15,000 tokens)
    ─────────────────────────────────────────────────────────────────
    Total: ~40,000 tokens (well within 200k context)

Layer 4: Section-Level Writing (per section, RAG-augmented)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  For each proposal section independently:
    System prompt + tone guidance                                   (~1,000 tokens)
    + Requirements mapped to THIS section (2-10 reqs)               (~500-2,000 tokens)
    + Evaluation criteria for this section                          (~200-500 tokens)
    + rag.search() results from company knowledge base              (~3,000-5,000 tokens)
      (past proposals, resumes, past performance)
    + rag.search() results from RFP for additional context          (~1,000-2,000 tokens)
    + Formatting constraints (page limit, font, etc.)               (~200 tokens)
    + Output: the section narrative                                 (~2,000-5,000 tokens)
    ─────────────────────────────────────────────────────────────────
    Total per section: ~8,000-15,000 tokens (trivial)

  20 sections × 12k avg tokens = 20 parallel LLM calls
  Wall-clock time: ~60-90 seconds

Layer 5: Cross-Section Review (summaries only)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  After all sections are written:
    System prompt                                                   (~1,000 tokens)
    + Summary of each section (first paragraph + addressed reqs)    (~10,000 tokens)
    + Full compliance matrix                                        (~15,000 tokens)
    + Output: consistency check, gap analysis, win score            (~3,000 tokens)
    ─────────────────────────────────────────────────────────────────
    Total: ~30,000 tokens
```

### How @convex-dev/rag Makes This Work

The RAG component handles two namespaces per proposal:

1. **`company:{companyId}`** — The company's knowledge base. Past proposals,
   resumes, capability statements, past performance. Added once when the user
   uploads documents. Searched during section writing to find relevant evidence.

2. **`rfp:{proposalId}`** — The RFP itself, chunked and embedded. Searched during
   section writing when the agent needs to reference specific RFP language
   (e.g., "the RFP states in Section C.3.2 that...").

The `chunkContext: { before: 2, after: 1 }` parameter is critical. When the RAG
search returns a chunk about "Key Personnel Requirements," it also returns the
2 preceding chunks and 1 following chunk. This gives the writer agent enough
surrounding context to write accurately without needing the full document.

### How @convex-dev/workflow Makes This Reliable

The 1 MiB step data limit is never an issue because:

- Steps pass **IDs** between each other, not full text content.
- `fetchRfp` returns a `parsedDocId` (a Convex document ID, ~30 bytes).
- `chunkDocument` returns an array of `chunkId`s (~2KB for 100 chunks).
- `extractRequirements` reads its chunk from the database and writes results
  to the database. The step return value is just a count.
- The actual text content lives in Convex tables and the RAG component.

If any step fails (LLM API error, timeout, rate limit), the Workflow retries
that specific step without re-running completed steps. A 400-page RFP that
takes 8 minutes to fully process can survive multiple server restarts.

---

## The Draft Generation Workflow

```typescript
// convex/workflows/generateDraft.ts
import { workflow } from "./manager";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const generateDraftWorkflow = workflow.define({
  args: {
    proposalId: v.id("proposals"),
    companyId: v.id("companies"),
  },
  handler: async (step, args): Promise<void> => {
    const { proposalId, companyId } = args;

    // Get all sections that need generation
    const sectionIds = await step.runQuery(
      internal.sections.getPendingSectionIds,
      { proposalId }
    );

    // Generate all sections in parallel
    // Each section: query requirements → RAG search → LLM write → prosemirror-sync insert
    await Promise.all(
      sectionIds.map((sectionId) =>
        step.runAction(
          internal.steps.writeSection,
          { sectionId, proposalId, companyId },
          { retry: { maxAttempts: 2, initialBackoffMs: 2000 } }
        )
      )
    );

    // Score all sections (parallel)
    await Promise.all(
      sectionIds.map((sectionId) =>
        step.runAction(
          internal.steps.scoreSection,
          { sectionId, proposalId }
        )
      )
    );

    // Cross-section consistency check
    await step.runAction(
      internal.steps.crossSectionReview,
      { proposalId }
    );

    // Mark complete
    await step.runMutation(
      internal.proposals.updateStatus,
      { proposalId, status: "draft_ready" }
    );
  },
});
```

---

## Section Writing Step (RAG + prosemirror-sync)

```typescript
// convex/steps/writeSection.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

export const writeSection = internalAction({
  args: {
    sectionId: v.id("sections"),
    proposalId: v.id("proposals"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, args) => {
    // 1. Load the section and its mapped requirements
    const section = await ctx.runQuery(internal.sections.get, {
      sectionId: args.sectionId,
    });
    const requirements = await ctx.runQuery(
      internal.requirements.getBySectionId,
      { sectionId: args.sectionId }
    );
    const proposal = await ctx.runQuery(internal.proposals.get, {
      proposalId: args.proposalId,
    });

    // 2. RAG search: find relevant company content
    const companyContext = await ctx.runAction(
      internal.knowledgeBase.searchCompanyDocs,
      {
        companyId: args.companyId as string,
        query: `${section.title} ${requirements.map((r) => r.text).join(" ")}`,
        limit: 8,
      }
    );

    // 3. RAG search: find relevant RFP context (for specific references)
    const rfpContext = await ctx.runAction(
      internal.knowledgeBase.searchRfpContent,
      {
        proposalId: args.proposalId as string,
        query: section.title,
        limit: 5,
      }
    );

    // 4. Build the focused prompt (~8-15k tokens total)
    const systemPrompt = `You are an expert government proposal writer.
Write the "${section.title}" section of a proposal for ${proposal.solicitation?.title || "this solicitation"}.

EVALUATION CRITERIA THIS SECTION MUST ADDRESS:
${requirements.map((r) => `- [${r.category}] ${r.text} (${r.rfpReference})`).join("\n")}

COMPANY EVIDENCE TO USE:
${companyContext.text}

RELEVANT RFP CONTEXT:
${rfpContext.text}

FORMATTING: ${JSON.stringify(proposal.formatting)}

RULES:
- Address EVERY requirement listed above. Use the exact language from the evaluation criteria.
- Cite specific company past performance with contract numbers and dollar values.
- Write in precise, evidence-based government proposal tone. No marketing language.
- Use action verbs: "will provide", "shall deliver", "has demonstrated".
- Every claim must be substantiated with evidence from the company's history.
- Structure with clear headings that mirror the RFP requirements.`;

    // 5. Generate content
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Write the "${section.title}" section now. Be thorough and specific.`,
        },
      ],
    });

    const generatedText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 6. Insert into the collaborative editor via prosemirror-sync
    // This makes the content appear live in any connected client
    if (section.editorDocId) {
      await ctx.runAction(internal.editor.insertGeneratedContent, {
        docId: section.editorDocId,
        content: generatedText,
      });
    }

    // 7. Update section status
    await ctx.runMutation(internal.sections.updateGenerationStatus, {
      sectionId: args.sectionId,
      status: "generated",
    });
  },
});
```

---

## Collaborative Editor Setup

```typescript
// convex/editor.ts
"use node";

import { components, internal } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorState } from "@tiptap/pm/state";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

// Expose the sync API for the frontend
export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi({});

// Server-side: Insert AI-generated content into a section's editor
export const insertGeneratedContent = internalAction({
  args: {
    docId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { docId, content }) => {
    const extensions = [StarterKit];
    const schema = getSchema(extensions);

    await prosemirrorSync.transform(ctx, docId, schema, (doc) => {
      const tr = EditorState.create({ doc }).tr;
      // Convert markdown to ProseMirror nodes and insert
      // (using a markdown parser or inserting as text)
      tr.insertText(content, 0);
      return tr;
    });
  },
});
```

```typescript
// Frontend: app/components/proposal/ProposalEditor.tsx
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { EditorContent, EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { api } from "../../../convex/_generated/api";

export function SectionEditor({ sectionDocId }: { sectionDocId: string }) {
  const sync = useTiptapSync(api.editor, sectionDocId);

  if (sync.isLoading) return <div className="animate-pulse h-64 bg-muted rounded" />;
  if (!sync.initialContent) return null;

  return (
    <EditorProvider
      content={sync.initialContent}
      extensions={[StarterKit, sync.extension]}
    >
      <EditorContent editor={null} />
    </EditorProvider>
  );
}
```

This means:
- When the AI writer agent finishes a section, it calls `prosemirrorSync.transform()`
  server-side, and the content appears live in every connected browser.
- When a human edits the text, changes sync via OT to all other clients.
- In Phase 2, multiple team members can edit the same section simultaneously.
- The AI and humans use the exact same sync mechanism — no separate "AI draft"
  and "editor" states to reconcile.

---

## Router Setup

```typescript
// app/router.tsx
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";

export function createRouter() {
  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;

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

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      defaultPreload: "intent",
      context: { queryClient, convexClient: convex, convexQueryClient },
      scrollRestoration: true,
      Wrap: ({ children }) => (
        // WorkOS AuthKit handles auth at the page level,
        // not as a provider wrapper (unlike Clerk).
        // See WorkOS TanStack Start docs for the auth middleware pattern.
        <ConvexProvider client={convexQueryClient.convexClient}>
          {children}
        </ConvexProvider>
      ),
    }),
    queryClient
  );

  return router;
}
```

---

## Frontend: The Proposal Workspace

```typescript
// app/routes/dashboard/$proposalId/index.tsx
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/dashboard/$proposalId/")({
  loader: async (opts) => {
    const { proposalId } = opts.params;
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.proposals.get, { proposalId })
    );
  },
  component: ProposalWorkspace,
});

function ProposalWorkspace() {
  const { proposalId } = Route.useParams();

  // All live-updating via Convex subscriptions
  const { data: proposal } = useSuspenseQuery(
    convexQuery(api.proposals.get, { proposalId })
  );
  const { data: requirements } = useSuspenseQuery(
    convexQuery(api.requirements.listByProposal, { proposalId })
  );
  const { data: sections } = useSuspenseQuery(
    convexQuery(api.sections.listByProposal, { proposalId })
  );

  // Show live progress if ingestion/generation is running
  if (proposal.status === "ingesting" || proposal.status === "generating") {
    return <GenerationProgress proposalId={proposalId} />;
  }

  // Three-panel workspace
  return (
    <div className="flex h-screen">
      {/* Left: Compliance Matrix */}
      <div className="w-80 border-r overflow-y-auto">
        <ComplianceMatrix
          requirements={requirements}
          sections={sections}
        />
      </div>

      {/* Center: Section Editor (Tiptap + prosemirror-sync) */}
      <div className="flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section._id} className="border-b p-6">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            {section.editorDocId ? (
              <SectionEditor sectionDocId={section.editorDocId} />
            ) : (
              <p className="text-muted-foreground italic">
                {section.generationStatus === "generating"
                  ? "Writing..."
                  : "Pending generation"}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Right: Win Score + Compliance Status */}
      <div className="w-72 border-l p-4">
        <WinScoreGauge score={proposal.winScore} />
        <ComplianceStatus requirements={requirements} />
      </div>
    </div>
  );
}
```

---

## Deployment

```
# Vercel Environment Variables
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_WORKOS_CLIENT_ID=client_...
WORKOS_API_KEY=sk_...

# Convex Environment Variables (set via npx convex env set)
WORKOS_WEBHOOK_SECRET=whsec_...
WORKOS_API_KEY=sk_...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
LLAMA_PARSE_API_KEY=llx-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Execution Roadmap

### Phase 1: Compliance Matrix Parser (Weeks 1-4) → $500-$1,000/parse

**Week 1-2: Foundation**
- [ ] Scaffold TanStack Start + Convex project
- [ ] Register all 5 components in convex.config.ts
- [ ] Set up WorkOS AuthKit (sign up, sign in, user sync)
- [ ] Build Convex schema (users, companies, proposals, requirements, rfpChunks)
- [ ] Build "New Proposal" page — URL input + PDF upload
- [ ] Implement Convex file storage for PDF uploads

**Week 3-4: The Parser Pipeline**
- [ ] Build `ingestRfpWorkflow` using @convex-dev/workflow
- [ ] Implement all workflow steps:
  - `fetchRfp` (LlamaParse integration)
  - `chunkDocument` (semantic chunking at section boundaries)
  - `extractMetadata` (single LLM call)
  - `extractRequirements` (per-chunk, parallel)
  - `deduplicateReqs` (consolidation pass)
  - `generateOutline` (section structure)
- [ ] Build real-time progress UI (observe workflow status)
- [ ] Build ComplianceMatrix component (interactive checklist)
- [ ] Export: compliance matrix → CSV download
- [ ] Add Stripe: charge per matrix parse

**Ship it. Start selling immediately.**

### Phase 2: First Draft Generator (Weeks 5-10) → $3,000-$5,000/proposal

**Week 5-6: Knowledge Base**
- [ ] Company document upload flow
- [ ] Document ingestion workflow: PDF → parse → chunk → @convex-dev/rag
- [ ] Document management UI (list, status, delete)

**Week 7-9: Draft Generation**
- [ ] `generateDraftWorkflow` using @convex-dev/workflow
- [ ] `writeSection` step with RAG integration
- [ ] Tiptap editor + @convex-dev/prosemirror-sync per section
- [ ] AI content inserted via server-side `prosemirrorSync.transform()`
- [ ] `scoreSection` step (red-team evaluation)
- [ ] WinScore gauge and compliance status components
- [ ] Three-panel workspace layout

**Week 10: Polish + Payment**
- [ ] Export to DOCX (docx-js in a Convex action)
- [ ] Stripe: per-proposal payment
- [ ] Landing page

### Phase 3: Multiplayer + Enterprise (Weeks 11-16) → $5-50k/mo SaaS

- [ ] Multi-user editing via prosemirror-sync (already wired up)
- [ ] Continuous compliance engine (section edits trigger re-scoring)
- [ ] Team invitations via WorkOS organizations
- [ ] Enterprise SSO via WorkOS (SAML/OIDC) — enable for Enterprise tier
- [ ] SCIM directory sync for large teams
- [ ] Monthly SaaS billing (Pro/Enterprise tiers)
- [ ] Bid/No-Bid decision engine
- [ ] Proposal pipeline dashboard with audit logs (WorkOS Audit Logs)

---

## How the Components Work Together

```
User signs in (WorkOS AuthKit)
  → WorkOS webhook → Convex user created
  → User creates company → uploads past proposals
  → Company docs → ingestDocument workflow → @convex-dev/rag (company namespace)

User pastes SAM.gov URL
  → ingestRfpWorkflow starts (@convex-dev/workflow)
    → LlamaParse → semantic chunks → @convex-dev/rag (rfp namespace)
    → Parallel requirement extraction (per chunk, retries on failure)
    → Consolidation → compliance matrix in Convex DB
    → prosemirror-sync documents created for each section
  → User sees live progress (workflow.status() subscription)
  → Matrix renders with real-time Convex queries

User clicks "Generate Draft"
  → generateDraftWorkflow starts (@convex-dev/workflow)
    → For each section in parallel:
      → Query mapped requirements (Convex DB)
      → rag.search() company knowledge base (RAG component)
      → rag.search() RFP context (RAG component)
      → LLM generates section (~10k tokens per call)
      → prosemirrorSync.transform() inserts content (prosemirror-sync)
      → Content appears live in user's Tiptap editor
    → Cross-section review + win scoring
  → User edits sections in Tiptap (synced via prosemirror-sync)
  → Team members join and co-edit (same prosemirror-sync)
  → Every edit → re-score compliance (Phase 3)

Enterprise customer needs SSO
  → Enable WorkOS SSO connection for their organization
  → Their IT admin self-configures via WorkOS Admin Portal
  → You charge them $25k+/year for Enterprise tier
```

Five Convex components. One coherent architecture. Each component handles
exactly one concern, and they compose naturally through Convex's real-time
transactional model.

Build Phase 1 in 4 weeks. Charge for it. Everything else follows.