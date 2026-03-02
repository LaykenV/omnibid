# OmniBid MVP: Technical Architecture

## MVP Scope

**One thing, done perfectly:** User provides an RFP (SAM.gov URL, solicitation number, or PDF upload) and gets back a structured, interactive compliance matrix.

Clerk auth. No payments. No multiplayer editing. No draft generation. No knowledge base. Just the core ingestion pipeline and compliance matrix UI working end-to-end.

Identity-first model: Convex reads Clerk JWT identity directly via `ctx.auth.getUserIdentity()`. No Convex `users` table is required for MVP.

---

## What Already Exists

```
omnibid/
├── src/
│   ├── routes/
│   │   ├── __root.tsx          # Root layout (configured)
│   │   └── index.tsx           # Landing page (complete)
│   ├── router.tsx              # TanStack Router + Convex + React Query (configured)
│   ├── routeTree.gen.ts        # Auto-generated
│   └── styles.css              # Tailwind imports
├── convex/
│   ├── _generated/             # Auto-generated types
│   └── tsconfig.json           # Configured
├── public/                     # Logo, SVGs, manifest
├── vite.config.ts              # Vite + TanStack Start + Tailwind (configured)
├── package.json                # Core deps installed (React 19, TanStack Start, Convex, Tailwind)
└── .env.local                  # Convex deployment URL
```

**What's ready:** Frontend framework, routing, Convex connection, styling, landing page.
**What's missing:** Everything in `convex/` (schema, functions, workflows) and app routes beyond the landing page.

---

## Current Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Framework | TanStack Start (React 19, file-based routing, SSR) | Installed |
| Backend/DB | Convex (real-time, serverless) | Connected |
| Data bridge | @convex-dev/react-query | Installed |
| Styling | Tailwind CSS v4 | Installed |
| Icons | Lucide React | Installed |
| Build | Vite 7 | Configured |

---

## The Key Architectural Decision: Gemini 3 Flash Replaces Everything

### Why Not LlamaParse + Claude?

The original plan used LlamaParse to convert PDFs to markdown, then Claude to extract requirements from chunks. This required:
- 3 external dependencies (LlamaParse, Anthropic, OpenAI)
- 3 API keys
- An 8-step pipeline with chunking, parallel fan-out, and polling loops
- ~800+ lines of pipeline code
- $1.58-$8.33 per 200-page RFP

### Why Gemini 3 Flash Instead

Gemini 3 Flash (launched Dec 2025) has native PDF understanding. You send the raw PDF bytes directly to the model — no preprocessing, no parsing service, no chunking.

Key facts:
- **1M token context window** — a 200-page RFP is ~100-150K tokens. Fits in a single call.
- **Native text in PDFs is extracted for free** — you're not charged for tokens from embedded text.
- **$0.50/1M input tokens, $3/1M output tokens** — 7-38x cheaper than LlamaParse + Claude.
- **Structured output via Zod schemas** — works through Vercel AI SDK's `generateObject`.
- **Box benchmarked 10-point accuracy improvement** over previous models on PDF field extraction.
- **Tensorlake benchmarked lowest OCR edit distance** (0.115) vs GPT-5.1 (0.147) and Claude Sonnet 4.5.
- **`media_resolution` parameter** — "quality typically saturates at medium" for document understanding, reducing costs further.

### Cost Comparison Per 200-Page RFP

| | LlamaParse + Claude (old) | Gemini 3 Flash (new) |
|---|---|---|
| Parsing | $0.75-$7.50 | $0 (native) |
| Extraction | $0.75 | $0.18 |
| Consolidation | $0.08 | $0.04 |
| **Total** | **$1.58-$8.33** | **~$0.22** |
| External deps | 3 | 1 |
| API keys | 3 | 1 |
| Workflow steps | 8 | 3 |
| Pipeline code | ~800 lines | ~200 lines |

### The Bet

Models are improving at native document understanding. Context windows are expanding. Prices are falling. Building a minimal pipeline that leans on the model means we benefit from every improvement shipped. Swap one model string when the next generation drops.

**Caveat:** Gemini 3 Flash is in preview (rate limits may be tighter). `gemini-2.5-flash` (stable) is the fallback — same architecture, just change the model string.

---

## MVP Dependencies to Add

```bash
# Convex workflow component
bun add @convex-dev/workflow

# AI (Vercel AI SDK + Google provider)
bun add ai @ai-sdk/google zod

# UI components
bun add @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

That's it. Three AI-related packages. One Convex component.

---

## Project Structure (MVP Target)

```
omnibid/
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx                     # Landing page (exists, prerendered)
│   │   ├── _authed.tsx                   # Pathless auth boundary
│   │   ├── sign-in.tsx                   # Clerk SignIn route
│   │   ├── sign-up.tsx                   # Clerk SignUp route
│   │   └── _authed/
│   │       └── proposals/
│   │           ├── index.tsx             # Thin route: proposals list
│   │           ├── -proposals.tsx        # Proposals list UI
│   │           ├── -proposals.data.ts    # Proposals prewarm contract
│   │           ├── new.tsx               # Thin route: new proposal
│   │           ├── -newProposal.tsx      # New proposal UI
│   │           ├── $proposalId.tsx       # Thin route: proposal detail
│   │           ├── -proposalDetail.tsx   # Proposal detail UI
│   │           └── -proposalDetail.data.ts # Detail prewarm contract
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   ├── NewProposalForm.tsx           # URL/upload input form
│   │   ├── IngestionProgress.tsx         # Real-time pipeline progress
│   │   ├── ComplianceMatrix.tsx          # The main matrix view
│   │   ├── RequirementRow.tsx            # Single requirement in the matrix
│   │   ├── RequirementFilters.tsx        # Filter by category, status
│   │   ├── SolicitationSummary.tsx       # Metadata card (agency, NAICS, dates)
│   │   └── ExportButton.tsx              # CSV export
│   ├── lib/
│   │   ├── utils.ts                      # cn() helper
│   │   └── useRoutePrewarmIntent.ts      # One-shot prewarm handlers
│   ├── router.tsx                        # (exists)
│   └── styles.css                        # (exists)
├── convex/
│   ├── _generated/
│   ├── convex.config.ts                  # Component registration
│   ├── schema.ts                         # Database schema
│   ├── http.ts                           # HTTP routes (future: webhooks)
│   │
│   ├── proposals.ts                      # CRUD for proposals
│   ├── requirements.ts                   # Queries/mutations for compliance matrix
│   │
│   ├── workflows/
│   │   ├── manager.ts                    # WorkflowManager instance
│   │   └── ingestRfp.ts                  # The main ingestion workflow (3 steps)
│   │
│   └── steps/
│       ├── resolveAndAcquire.ts          # SAM.gov API + document download
│       ├── extractRequirements.ts        # Gemini 3 Flash: PDF → requirements
│       └── validateAndOrganize.ts        # Gemini 3 Flash: dedup + cross-ref
│
├── vite.config.ts
├── package.json
└── .env.local
```

---

## Database Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==========================================
  // PROPOSALS (the core entity)
  // ==========================================
  proposals: defineTable({
    // Owner is Clerk user ID (identity.subject)
    ownerId: v.string(),

    title: v.string(),
    status: v.union(
      v.literal("created"),        // User submitted URL/file, nothing started
      v.literal("resolving"),      // Looking up SAM.gov API + downloading docs
      v.literal("extracting"),     // Gemini processing the PDF
      v.literal("validating"),     // Cross-referencing and deduplicating
      v.literal("matrix_ready"),   // Compliance matrix is complete
      v.literal("error")
    ),
    statusMessage: v.optional(v.string()),

    // Pipeline versioning (future-proofs workflow evolution)
    pipelineVersion: v.number(),

    // Input source
    inputType: v.union(
      v.literal("sam_url"),
      v.literal("solicitation_num"),
      v.literal("pdf_upload")
    ),
    inputValue: v.string(),
    rfpFileIds: v.optional(v.array(v.id("_storage"))),

    // SAM.gov metadata (populated by resolveAndAcquire step)
    solicitation: v.optional(v.object({
      noticeId: v.optional(v.string()),
      solicitationNumber: v.optional(v.string()),
      title: v.optional(v.string()),
      agency: v.optional(v.string()),
      subAgency: v.optional(v.string()),
      postedDate: v.optional(v.string()),
      responseDeadline: v.optional(v.string()),
      naicsCode: v.optional(v.string()),
      classificationCode: v.optional(v.string()),
      setAsideCode: v.optional(v.string()),
      setAsideDescription: v.optional(v.string()),
      contractType: v.optional(v.string()),
      estimatedValue: v.optional(v.string()),
      placeOfPerformance: v.optional(v.string()),
      pointOfContact: v.optional(v.string()),
      uiLink: v.optional(v.string()),
    })),

    // Formatting rules (extracted by Gemini from Section L)
    formatting: v.optional(v.object({
      pageLimit: v.optional(v.number()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      margins: v.optional(v.string()),
      lineSpacing: v.optional(v.string()),
      volumes: v.optional(v.array(v.string())),
    })),

    // SAM.gov resource links (for document download)
    resourceLinks: v.optional(v.array(v.string())),

    // Scores
    requirementCount: v.optional(v.number()),

    // Workflow
    workflowId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  // ==========================================
  // RFP DOCUMENTS (individual files per proposal)
  // ==========================================
  rfpDocuments: defineTable({
    proposalId: v.id("proposals"),
    fileName: v.string(),
    fileType: v.string(),           // pdf, docx, xlsx, html, zip
    fileId: v.id("_storage"),
    sourceUrl: v.optional(v.string()),
    status: v.union(
      v.literal("downloaded"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  })
    .index("by_proposal", ["proposalId"]),

  // ==========================================
  // RAW EXTRACTIONS (debugging + model comparison)
  // ==========================================
  rawExtractions: defineTable({
    proposalId: v.id("proposals"),
    documentId: v.id("rfpDocuments"),
    model: v.string(),              // "gemini-3-flash", "gemini-2.5-flash", etc.
    extractionType: v.union(
      v.literal("requirements"),
      v.literal("validation")
    ),
    rawOutput: v.string(),          // Full JSON response from Gemini
    tokenUsage: v.optional(v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
    })),
    durationMs: v.optional(v.number()),
  })
    .index("by_proposal", ["proposalId"]),

  // ==========================================
  // REQUIREMENTS (the compliance matrix rows)
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
    rfpReference: v.string(),       // "Section L, Page 42, Para 3.2.1"
    rfpSection: v.optional(v.string()),
    volume: v.optional(v.string()),
    evaluationWeight: v.optional(v.string()),
    status: v.union(
      v.literal("not_started"),
      v.literal("addressed"),
      v.literal("partially_addressed"),
      v.literal("not_applicable")
    ),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_proposal", ["proposalId"])
    .index("by_proposal_category", ["proposalId", "category"])
    .index("by_proposal_status", ["proposalId", "status"]),
});
```

### Schema Design Notes

**No `rfpChunks` table.** Gemini 3 Flash's 1M context window means we send the entire PDF in one call. No chunking needed for typical RFPs (100-400 pages = 50-200K tokens).

**`rawExtractions` table.** Stores the full JSON response from Gemini for every extraction call. Costs nothing, enables debugging, re-running validation without re-extracting, and model A/B comparison later.

**`pipelineVersion` on proposals.** When we change the workflow logic, old proposals still reference the version they were processed with. Prevents determinism violations during rapid iteration.

**`ownerId` on proposals.** Clerk `identity.subject` is stored directly on insert. Every read/write is filtered by owner.

**No `parsedText` field.** We never store the parsed markdown — Gemini handles the PDF directly. This avoids the Convex 1MB document size limit issue entirely.

---

## Component Registration

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import workflow from "@convex-dev/workflow/convex.config.js";

const app = defineApp();
app.use(workflow);

export default app;
```

Only `@convex-dev/workflow` for MVP. RAG, prosemirror-sync, and agents are Phase 2+.

---

## The Ingestion Pipeline (3 Steps)

### Workflow Manager

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

### The Pipeline

```typescript
// convex/workflows/ingestRfp.ts
import { workflow } from "./manager";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const ingestRfpWorkflow = workflow.define({
  args: {
    proposalId: v.id("proposals"),
  },
  handler: async (step, args): Promise<void> => {
    const { proposalId } = args;

    // ─── Step 1: Resolve & Acquire ───
    // If SAM.gov URL/solicitation number:
    //   Call SAM.gov API → get metadata + resourceLinks
    //   Download files from resourceLinks → Convex file storage
    // If PDF upload:
    //   Files already in storage, skip API lookup
    // Returns array of rfpDocument IDs
    const documentIds = await step.runAction(
      internal.steps.resolveAndAcquire,
      { proposalId },
      { retry: { maxAttempts: 3, initialBackoffMs: 3000 } }
    );

    // ─── Step 2: Extract Requirements ───
    // For each document:
    //   Send raw PDF bytes to Gemini 3 Flash
    //   generateObject with full extraction schema
    //   One call gets: metadata, formatting rules, AND all requirements
    // Store raw response in rawExtractions table
    // Store requirements in requirements table
    await step.runAction(
      internal.steps.extractRequirements,
      { proposalId, documentIds },
      { retry: { maxAttempts: 3, initialBackoffMs: 5000 } }
    );

    // ─── Step 3: Validate & Organize ───
    // Pass all extracted requirements to Gemini 3 Flash
    // Cross-reference Section M criteria with Section L instructions
    // Deduplicate overlapping requirements
    // Assign evaluation weights
    // Final logical sort order
    await step.runAction(
      internal.steps.validateAndOrganize,
      { proposalId },
      { retry: { maxAttempts: 2, initialBackoffMs: 3000 } }
    );

    // ─── Done ───
    await step.runMutation(
      internal.proposals.updateStatus,
      { proposalId, status: "matrix_ready", statusMessage: "Compliance matrix ready" }
    );
  },
});
```

### Why 3 Steps Instead of 8

The old pipeline had: resolve → acquire → parse → chunk → extract metadata → extract requirements (parallel) → deduplicate → generate outline.

Gemini 3 Flash eliminates parse, chunk, and parallel extraction entirely. The PDF goes in raw, structured requirements come out. Two AI calls total instead of 50+ parallel chunk extractions.

**Durability still matters.** If SAM.gov is down in step 1, the workflow retries. If Gemini has a transient error in step 2, step 1 results are preserved in the journal. `@convex-dev/workflow` handles this automatically.

---

## SAM.gov API Integration

### Critical Details

**Endpoint:** `https://api.sam.gov/prod/opportunities/v2/search` (note: `/prod/` prefix)

**Required parameters:**
- `api_key` — from SAM.gov registration (takes 1-4 weeks for entity-associated access)
- `postedFrom` / `postedTo` — **required date range parameters** (max 1 year span)
- Either `noticeid`, `solnum`, or search filters (`title`, `ncode`, `ptype`)

**Rate Limits:**
| Tier | Requests/Day | Access |
|------|-------------|--------|
| Public | 10/day | Free registration |
| Entity-associated | 1,000/day | Link to SAM entity |

**Key fields returned:**
- `title`, `solicitationNumber`, `fullParentPathName` (agency)
- `postedDate`, `responseDeadLine`, `naicsCode`, `typeOfSetAside`
- `pointOfContact`, `placeOfPerformance`
- `description` — URL to HTML description (not inline text)
- `resourceLinks[]` — **nullable**, direct download URLs for attached documents
- `uiLink` — link to SAM.gov opportunity page

### Document Acquisition Priority

```
1. resourceLinks[] → Direct HTTP download (~70-80% of solicitations)
2. User PDF upload fallback (when API lacks attachments or docs are behind auth)
```

For MVP, we don't scrape SAM.gov pages (no Firecrawl dependency). If `resourceLinks` is empty and the user didn't upload, we show a clear message asking for manual upload.

### File Types

| Type | Frequency | Gemini Support |
|------|-----------|---------------|
| `.pdf` | ~60% | Native (primary) |
| `.docx` | ~20% | Native support |
| `.xlsx` | ~10% | Not supported — skip for MVP, note for user |
| `.zip` | ~5% | Unzip, process PDF/DOCX contents |
| `.html` | ~3% | Convert to text, process |

### URL Safety

All server-side fetches validate:
- HTTPS scheme only (block `file://`, `ftp://`, etc.)
- Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, ::1)
- Disable automatic redirects, validate redirect targets

---

## Workflow Steps

### Step 1: Resolve & Acquire

```typescript
// convex/steps/resolveAndAcquire.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// URL safety validation
function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname;
    // Block private IPs
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|localhost|::1)/.test(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default internalAction({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args): Promise<string[]> => {
    const proposal = await ctx.runQuery(internal.proposals.get, {
      proposalId: args.proposalId,
    });
    if (!proposal) throw new Error("Proposal not found");

    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: "resolving",
      statusMessage: "Looking up opportunity...",
    });

    const documentIds: string[] = [];

    // ─── Case 1: Direct PDF Upload ───
    if (proposal.inputType === "pdf_upload" && proposal.rfpFileIds?.length) {
      for (const fileId of proposal.rfpFileIds) {
        const docId = await ctx.runMutation(internal.rfpDocuments.create, {
          proposalId: args.proposalId,
          fileName: proposal.inputValue,
          fileType: "pdf",
          fileId,
          status: "downloaded",
        });
        documentIds.push(docId);
      }
      return documentIds;
    }

    // ─── Case 2: SAM.gov API Lookup ───
    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      throw new Error("SAM_GOV_API_KEY not configured. Please upload the RFP PDF directly.");
    }

    let searchParams: Record<string, string> = {};

    if (proposal.inputType === "sam_url") {
      const match = proposal.inputValue.match(/opp\/([a-f0-9-]+)/i);
      if (match) searchParams.noticeid = match[1];
    } else if (proposal.inputType === "solicitation_num") {
      searchParams.solnum = proposal.inputValue;
    }

    // postedFrom/postedTo are REQUIRED — use a 1-year lookback
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    searchParams.postedFrom = formatDate(oneYearAgo);
    searchParams.postedTo = formatDate(now);

    const url = new URL("https://api.sam.gov/prod/opportunities/v2/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("limit", "1");
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`SAM.gov API returned ${response.status}`);
      throw new Error(`SAM.gov API error (${response.status}). Please upload the RFP PDF directly.`);
    }

    const data = await response.json();
    const opp = data.opportunitiesData?.[0];

    if (opp) {
      // Store structured metadata
      await ctx.runMutation(internal.proposals.patchSolicitation, {
        proposalId: args.proposalId,
        solicitation: {
          noticeId: opp.noticeId,
          solicitationNumber: opp.solicitationNumber,
          title: opp.title,
          agency: opp.fullParentPathName,
          subAgency: opp.departmentName,
          postedDate: opp.postedDate,
          responseDeadline: opp.responseDeadLine,
          naicsCode: opp.naicsCode,
          classificationCode: opp.classificationCode,
          setAsideCode: opp.typeOfSetAside,
          setAsideDescription: opp.typeOfSetAsideDescription,
          placeOfPerformance: opp.placeOfPerformance?.streetAddress,
          pointOfContact: opp.pointOfContact?.[0]?.email,
          uiLink: opp.uiLink,
        },
        title: opp.title || proposal.title,
        resourceLinks: opp.resourceLinks || [],
      });

      // Download documents from resourceLinks
      const links: string[] = opp.resourceLinks || [];
      await ctx.runMutation(internal.proposals.updateStatus, {
        proposalId: args.proposalId,
        status: "resolving",
        statusMessage: `Downloading ${links.length} document(s)...`,
      });

      for (const link of links) {
        if (!isUrlSafe(link)) {
          console.warn(`Skipping unsafe URL: ${link}`);
          continue;
        }
        try {
          const fileResponse = await fetch(link, { redirect: "manual" });
          if (!fileResponse.ok) continue;

          const blob = await fileResponse.blob();
          const fileName = decodeURIComponent(link.split("/").pop() || "document");
          const ext = fileName.split(".").pop()?.toLowerCase() || "pdf";

          // Skip unsupported file types for MVP
          if (!["pdf", "docx", "doc"].includes(ext)) {
            console.log(`Skipping unsupported file type: ${ext}`);
            continue;
          }

          // Upload to Convex storage
          const storageId = await ctx.storage.store(blob);

          const docId = await ctx.runMutation(internal.rfpDocuments.create, {
            proposalId: args.proposalId,
            fileName,
            fileType: ext,
            fileId: storageId,
            sourceUrl: link,
            status: "downloaded",
          });
          documentIds.push(docId);
        } catch (error) {
          console.error(`Failed to download ${link}:`, error);
        }
      }
    }

    if (documentIds.length === 0) {
      throw new Error(
        "No downloadable documents found for this opportunity. Please upload the RFP PDF directly."
      );
    }

    return documentIds;
  },
});

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
```

### Step 2: Extract Requirements (Gemini 3 Flash)

This is the core step. The raw PDF bytes go directly to Gemini with a structured output schema. One call extracts metadata, formatting rules, and all requirements.

```typescript
// convex/steps/extractRequirements.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const EXTRACTION_MODEL = "gemini-3-flash";
// Fallback if preview model has issues:
// const EXTRACTION_MODEL = "gemini-2.5-flash";

const extractionSchema = z.object({
  metadata: z.object({
    solicitationNumber: z.string().optional(),
    title: z.string().optional(),
    agency: z.string().optional(),
    responseDeadline: z.string().optional(),
    naicsCode: z.string().optional(),
    setAsideDescription: z.string().optional(),
    contractType: z.string().optional(),
    estimatedValue: z.string().optional(),
    placeOfPerformance: z.string().optional(),
  }),
  formatting: z.object({
    pageLimit: z.number().optional(),
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    margins: z.string().optional(),
    lineSpacing: z.string().optional(),
    volumes: z.array(z.string()).optional(),
  }),
  requirements: z.array(z.object({
    category: z.enum([
      "mandatory",
      "evaluation_factor",
      "formatting",
      "deliverable",
      "certification",
      "personnel",
      "other",
    ]),
    text: z.string().describe("The requirement statement, clear and specific"),
    rfpReference: z.string().describe("Exact location: 'Section L, Page 42, Para 3.2.1'"),
    rfpSection: z.string().optional().describe("Section letter: L, M, C, H, J, B, F"),
    volume: z.string().optional().describe("Which proposal volume should address this"),
    evaluationWeight: z.string().optional().describe("Importance if stated: 'Most Important', 'Important', etc."),
  })),
});

export default internalAction({
  args: {
    proposalId: v.id("proposals"),
    documentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: "extracting",
      statusMessage: "Analyzing RFP with AI...",
    });

    for (const documentId of args.documentIds) {
      const doc = await ctx.runQuery(internal.rfpDocuments.get, {
        documentId: documentId as any,
      });
      if (!doc) continue;

      // Get raw file bytes from Convex storage
      const fileBlob = await ctx.storage.get(doc.fileId);
      if (!fileBlob) {
        console.error(`File not found in storage: ${doc.fileId}`);
        continue;
      }
      const fileBuffer = await fileBlob.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);

      await ctx.runMutation(internal.rfpDocuments.updateStatus, {
        documentId: doc._id,
        status: "processing",
      });

      const startTime = Date.now();

      try {
        // Send the entire PDF to Gemini 3 Flash in one call
        const { object, usage } = await generateObject({
          model: google(EXTRACTION_MODEL, {
            structuredOutputs: true,
          }),
          schema: extractionSchema,
          messages: [{
            role: "user",
            content: [
              {
                type: "file",
                data: fileBytes,
                mimeType: doc.fileType === "docx"
                  ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  : "application/pdf",
              },
              {
                type: "text",
                text: `You are an expert government proposal compliance analyst.

Analyze this federal RFP document and extract:

1. METADATA: Solicitation number, title, agency, due date, NAICS code, set-aside type, contract type, estimated value, place of performance.

2. FORMATTING REQUIREMENTS: Page limits, font family, font size, margins, line spacing, required proposal volumes.

3. ALL REQUIREMENTS: Extract every obligation, requirement, and evaluation criterion. Be exhaustive — missing a single requirement can disqualify a proposal.

For requirements, look for:
- "shall", "must", "will", "is required to" statements → mandatory
- Evaluation factors and subfactors with weights → evaluation_factor
- Page limits, font requirements, formatting rules → formatting
- CDRLs, deliverables, reports → deliverable
- Certifications, clearances, accreditations → certification
- Key personnel, labor categories, qualifications → personnel

For each requirement, include the EXACT location in the document (Section, page number, paragraph number).

Be thorough. This compliance matrix is the backbone of a multi-million dollar proposal.`,
              },
            ],
          }],
        });

        // Store raw extraction for debugging
        await ctx.runMutation(internal.rawExtractions.create, {
          proposalId: args.proposalId,
          documentId: doc._id,
          model: EXTRACTION_MODEL,
          extractionType: "requirements",
          rawOutput: JSON.stringify(object),
          tokenUsage: usage ? {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
          } : undefined,
          durationMs: Date.now() - startTime,
        });

        // Update metadata (supplement, don't overwrite SAM.gov API data)
        const proposal = await ctx.runQuery(internal.proposals.get, {
          proposalId: args.proposalId,
        });
        const existingSol = proposal?.solicitation || {};

        await ctx.runMutation(internal.proposals.patchMetadata, {
          proposalId: args.proposalId,
          solicitation: {
            ...existingSol,
            // Only fill in missing fields (API data is ground truth)
            solicitationNumber: existingSol.solicitationNumber || object.metadata.solicitationNumber,
            title: existingSol.title || object.metadata.title,
            agency: existingSol.agency || object.metadata.agency,
            responseDeadline: existingSol.responseDeadline || object.metadata.responseDeadline,
            naicsCode: existingSol.naicsCode || object.metadata.naicsCode,
            setAsideDescription: existingSol.setAsideDescription || object.metadata.setAsideDescription,
            contractType: existingSol.contractType || object.metadata.contractType,
            estimatedValue: existingSol.estimatedValue || object.metadata.estimatedValue,
            placeOfPerformance: existingSol.placeOfPerformance || object.metadata.placeOfPerformance,
          },
          formatting: object.formatting,
        });

        // Insert requirements
        if (object.requirements.length > 0) {
          await ctx.runMutation(internal.requirements.bulkInsert, {
            proposalId: args.proposalId,
            requirements: object.requirements.map((req, i) => ({
              ...req,
              sortOrder: i + 1,
            })),
          });
        }

        await ctx.runMutation(internal.rfpDocuments.updateStatus, {
          documentId: doc._id,
          status: "processed",
        });
      } catch (error) {
        await ctx.runMutation(internal.rfpDocuments.updateStatus, {
          documentId: doc._id,
          status: "failed",
          errorMessage: String(error),
        });
        throw error;
      }
    }
  },
});
```

### Step 3: Validate & Organize

```typescript
// convex/steps/validateAndOrganize.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const VALIDATION_MODEL = "gemini-3-flash";

export default internalAction({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: "validating",
      statusMessage: "Cross-referencing and organizing requirements...",
    });

    const requirements = await ctx.runQuery(
      internal.requirements.listByProposal,
      { proposalId: args.proposalId }
    );

    if (requirements.length === 0) {
      throw new Error("No requirements were extracted from the RFP. The document may not be a valid federal solicitation.");
    }

    // Format for LLM
    const reqsForValidation = requirements.map((r, i) => ({
      index: i,
      id: r._id,
      category: r.category,
      text: r.text,
      rfpReference: r.rfpReference,
      rfpSection: r.rfpSection,
      volume: r.volume,
      evaluationWeight: r.evaluationWeight,
    }));

    const startTime = Date.now();

    const { object, usage } = await generateObject({
      model: google(VALIDATION_MODEL, { structuredOutputs: true }),
      schema: z.object({
        duplicateGroups: z.array(z.object({
          keepIndex: z.number().describe("Index of the best/most complete version to keep"),
          removeIndices: z.array(z.number()).describe("Indices of duplicates to remove"),
          mergedText: z.string().optional().describe("Improved text if combining info helps clarity"),
        })),
        recategorizations: z.array(z.object({
          index: z.number(),
          newCategory: z.enum([
            "mandatory", "evaluation_factor", "formatting",
            "deliverable", "certification", "personnel", "other",
          ]),
          reason: z.string(),
        })).describe("Requirements that were miscategorized in the initial extraction"),
        sortedIndices: z.array(z.number()).describe(
          "All REMAINING indices (after removing duplicates) in logical order: " +
          "evaluation_factor first (by weight), then mandatory, personnel, certification, " +
          "deliverable, formatting, other"
        ),
      }),
      prompt: `You are reviewing a compliance matrix extracted from a federal RFP. Your job is quality assurance.

REQUIREMENTS:
${JSON.stringify(reqsForValidation, null, 2)}

Tasks:
1. DEDUPLICATION: Identify groups of duplicate or near-duplicate requirements. For each group, keep the most complete version. Be conservative — only mark true duplicates.

2. RECATEGORIZATION: Check if any requirements were miscategorized. Common errors:
   - "evaluation_factor" tagged as "mandatory" (or vice versa)
   - Personnel qualifications tagged as "certification"
   - CDRL deliverables tagged as "mandatory"

3. SORTING: Return sortedIndices with all remaining indices in logical order:
   - Evaluation factors first (by stated weight: "Most Important" > "Important" > "Less Important")
   - Mandatory requirements
   - Personnel requirements
   - Certifications
   - Deliverables
   - Formatting
   - Other

This matrix will be used to write a multi-million dollar federal proposal. Accuracy matters.`,
    });

    // Store raw validation output for debugging
    await ctx.runMutation(internal.rawExtractions.create, {
      proposalId: args.proposalId,
      documentId: requirements[0]?._id as any, // Not ideal, but we need a ref
      model: VALIDATION_MODEL,
      extractionType: "validation",
      rawOutput: JSON.stringify(object),
      tokenUsage: usage ? {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      } : undefined,
      durationMs: Date.now() - startTime,
    });

    // Apply recategorizations
    for (const recat of object.recategorizations) {
      const req = requirements[recat.index];
      if (req) {
        await ctx.runMutation(internal.requirements.updateCategory, {
          requirementId: req._id,
          category: recat.newCategory,
        });
      }
    }

    // Apply deduplication
    const indicesToRemove = new Set<number>();
    for (const group of object.duplicateGroups) {
      for (const idx of group.removeIndices) {
        indicesToRemove.add(idx);
      }
      if (group.mergedText) {
        const kept = requirements[group.keepIndex];
        if (kept) {
          await ctx.runMutation(internal.requirements.updateText, {
            requirementId: kept._id,
            text: group.mergedText,
          });
        }
      }
    }

    // Delete duplicates
    for (const idx of indicesToRemove) {
      const req = requirements[idx];
      if (req) {
        await ctx.runMutation(internal.requirements.remove, {
          requirementId: req._id,
        });
      }
    }

    // Update sort orders
    let newSortOrder = 1;
    for (const idx of object.sortedIndices) {
      if (indicesToRemove.has(idx)) continue;
      const req = requirements[idx];
      if (req) {
        await ctx.runMutation(internal.requirements.updateSortOrder, {
          requirementId: req._id,
          sortOrder: newSortOrder++,
        });
      }
    }

    // Update final count
    const finalCount = object.sortedIndices.filter(
      (idx) => !indicesToRemove.has(idx)
    ).length;
    await ctx.runMutation(internal.proposals.patchRequirementCount, {
      proposalId: args.proposalId,
      requirementCount: finalCount,
    });
  },
});
```

---

## Convex Functions

### Proposals

```typescript
// convex/proposals.ts
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { workflow } from "./workflows/manager";
import { internal } from "./_generated/api";

const CURRENT_PIPELINE_VERSION = 1;

export const create = mutation({
  args: {
    inputType: v.union(
      v.literal("sam_url"),
      v.literal("solicitation_num"),
      v.literal("pdf_upload")
    ),
    inputValue: v.string(),
    title: v.optional(v.string()),
    rfpFileIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const proposalId = await ctx.db.insert("proposals", {
      ownerId: identity.subject,
      title: args.title || "New Proposal",
      status: "created",
      pipelineVersion: CURRENT_PIPELINE_VERSION,
      inputType: args.inputType,
      inputValue: args.inputValue,
      rfpFileIds: args.rfpFileIds,
    });

    // Start the ingestion workflow
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.ingestRfp.ingestRfpWorkflow,
      { proposalId }
    );

    await ctx.db.patch(proposalId, { workflowId });
    return proposalId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("proposals")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.ownerId !== identity.subject) return null;
    return proposal;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── Internal mutations (called by workflow steps) ───

export const updateStatus = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    status: v.string(),
    statusMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      status: args.status as any,
      statusMessage: args.statusMessage,
      errorMessage: args.errorMessage,
    });
  },
});

export const patchSolicitation = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    solicitation: v.any(),
    title: v.string(),
    resourceLinks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      solicitation: args.solicitation,
      title: args.title,
      resourceLinks: args.resourceLinks,
    });
  },
});

export const patchMetadata = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    solicitation: v.any(),
    formatting: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      solicitation: args.solicitation,
      formatting: args.formatting,
    });
  },
});

export const patchRequirementCount = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    requirementCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      requirementCount: args.requirementCount,
    });
  },
});
```

### Requirements

```typescript
// convex/requirements.ts
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ─── Public queries/mutations (frontend) ───

export const listByProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requirements")
      .withIndex("by_proposal", (q) => q.eq("proposalId", args.proposalId))
      .collect();
  },
});

// User marks a requirement as addressed/not applicable
export const updateStatus = mutation({
  args: {
    requirementId: v.id("requirements"),
    status: v.union(
      v.literal("not_started"),
      v.literal("addressed"),
      v.literal("partially_addressed"),
      v.literal("not_applicable")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, {
      status: args.status,
      notes: args.notes,
    });
  },
});

// ─── Internal (called by workflow steps) ───

export const bulkInsert = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    requirements: v.array(v.object({
      category: v.string(),
      text: v.string(),
      rfpReference: v.string(),
      rfpSection: v.optional(v.string()),
      volume: v.optional(v.string()),
      evaluationWeight: v.optional(v.string()),
      sortOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const req of args.requirements) {
      await ctx.db.insert("requirements", {
        proposalId: args.proposalId,
        category: req.category as any,
        text: req.text,
        rfpReference: req.rfpReference,
        rfpSection: req.rfpSection,
        volume: req.volume,
        evaluationWeight: req.evaluationWeight,
        status: "not_started",
        sortOrder: req.sortOrder,
      });
    }
  },
});

export const updateText = internalMutation({
  args: { requirementId: v.id("requirements"), text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, { text: args.text });
  },
});

export const updateCategory = internalMutation({
  args: { requirementId: v.id("requirements"), category: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, { category: args.category as any });
  },
});

export const updateSortOrder = internalMutation({
  args: { requirementId: v.id("requirements"), sortOrder: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, { sortOrder: args.sortOrder });
  },
});

export const remove = internalMutation({
  args: { requirementId: v.id("requirements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.requirementId);
  },
});
```

### Supporting Tables

```typescript
// convex/rfpDocuments.ts
import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    fileName: v.string(),
    fileType: v.string(),
    fileId: v.id("_storage"),
    sourceUrl: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rfpDocuments", {
      ...args,
      status: args.status as any,
    });
  },
});

export const get = internalQuery({
  args: { documentId: v.id("rfpDocuments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const listByProposal = internalQuery({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rfpDocuments")
      .withIndex("by_proposal", (q) => q.eq("proposalId", args.proposalId))
      .collect();
  },
});

export const updateStatus = internalMutation({
  args: {
    documentId: v.id("rfpDocuments"),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      status: args.status as any,
      errorMessage: args.errorMessage,
    });
  },
});
```

```typescript
// convex/rawExtractions.ts
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    documentId: v.any(),
    model: v.string(),
    extractionType: v.string(),
    rawOutput: v.string(),
    tokenUsage: v.optional(v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
    })),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rawExtractions", {
      proposalId: args.proposalId,
      documentId: args.documentId,
      model: args.model,
      extractionType: args.extractionType as any,
      rawOutput: args.rawOutput,
      tokenUsage: args.tokenUsage,
      durationMs: args.durationMs,
    });
  },
});
```

---

## Frontend

### Auth + Prewarm Helper

```typescript
// src/lib/useRoutePrewarmIntent.ts
import { useCallback, useRef } from "react";

export function useRoutePrewarmIntent(prewarmFn: () => void) {
  const hasFired = useRef(false);

  const handler = useCallback(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    prewarmFn();
  }, [prewarmFn]);

  return {
    onMouseEnter: handler,
    onFocus: handler,
    onTouchStart: handler,
  };
}
```

### Proposals List

```typescript
// src/routes/_authed/proposals/-proposals.tsx
import { Link } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";

function ProposalsList() {
  const { data: proposals } = useSuspenseQuery(
    convexQuery(api.proposals.list, {})
  );

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Proposals</h1>
        <Link
          to="/proposals/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          New Proposal
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-2">No proposals yet.</p>
          <Link to="/proposals/new" className="text-blue-600 hover:underline">
            Parse your first RFP
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Link
              key={proposal._id}
              to="/proposals/$proposalId"
              params={{ proposalId: proposal._id }}
              className="block border rounded-lg p-4 hover:border-blue-300 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{proposal.title}</h2>
                  {proposal.solicitation?.agency && (
                    <p className="text-sm text-gray-500 mt-1">
                      {proposal.solicitation.agency}
                    </p>
                  )}
                </div>
                <StatusBadge status={proposal.status} />
              </div>
              {proposal.requirementCount != null && (
                <p className="text-sm text-gray-500 mt-2">
                  {proposal.requirementCount} requirements
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    created: "bg-gray-100 text-gray-600",
    resolving: "bg-yellow-100 text-yellow-700",
    extracting: "bg-blue-100 text-blue-700",
    validating: "bg-purple-100 text-purple-700",
    matrix_ready: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    created: "Created",
    resolving: "Resolving...",
    extracting: "Extracting...",
    validating: "Validating...",
    matrix_ready: "Ready",
    error: "Error",
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || styles.created}`}>
      {labels[status] || status}
    </span>
  );
}
```

### New Proposal Form

```typescript
// src/routes/_authed/proposals/-newProposal.tsx
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";

function NewProposal() {
  const navigate = useNavigate();
  const createProposal = useMutation(api.proposals.create);
  const generateUploadUrl = useMutation(api.proposals.generateUploadUrl);

  const [inputType, setInputType] = useState<"sam_url" | "solicitation_num" | "pdf_upload">("sam_url");
  const [inputValue, setInputValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let rfpFileIds: any[] | undefined;

      if (inputType === "pdf_upload" && file) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await response.json();
        rfpFileIds = [storageId];
      }

      const proposalId = await createProposal({
        inputType,
        inputValue: inputType === "pdf_upload" ? file?.name || "upload.pdf" : inputValue,
        rfpFileIds,
      });

      navigate({
        to: "/proposals/$proposalId",
        params: { proposalId },
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Parse a New RFP</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2">
          {([
            { value: "sam_url" as const, label: "SAM.gov URL" },
            { value: "solicitation_num" as const, label: "Solicitation #" },
            { value: "pdf_upload" as const, label: "Upload PDF" },
          ]).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setInputType(option.value)}
              className={`px-4 py-2 rounded-lg border transition ${
                inputType === option.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 hover:border-blue-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {inputType !== "pdf_upload" ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              inputType === "sam_url"
                ? "https://sam.gov/opp/..."
                : "W911NF-24-R-0001"
            }
            className="w-full border rounded-lg px-4 py-3 text-lg"
            required
          />
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="rfp-upload"
            />
            <label htmlFor="rfp-upload" className="cursor-pointer text-blue-600 hover:underline">
              {file ? file.name : "Click to select RFP file (.pdf, .docx)"}
            </label>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (inputType !== "pdf_upload" && !inputValue) || (inputType === "pdf_upload" && !file)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isSubmitting ? "Starting..." : "Parse RFP"}
        </button>
      </form>
    </div>
  );
}
```

### Proposal Detail (Matrix View)

```typescript
// src/routes/proposals/$proposalId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/proposals/$proposalId")({
  component: ProposalDetail,
});

function ProposalDetail() {
  const { proposalId } = Route.useParams();

  const { data: proposal } = useSuspenseQuery(
    convexQuery(api.proposals.get, { proposalId: proposalId as any })
  );
  const { data: requirements } = useSuspenseQuery(
    convexQuery(api.requirements.listByProposal, {
      proposalId: proposalId as any,
    })
  );

  if (!proposal) return <div className="p-8">Proposal not found</div>;

  // Show progress during processing
  if (!["matrix_ready", "error"].includes(proposal.status)) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Processing RFP</h2>
        <p className="text-gray-500">{proposal.statusMessage || "Starting..."}</p>
        <div className="mt-6 flex justify-center gap-2">
          {["resolving", "extracting", "validating"].map((step, i) => (
            <div
              key={step}
              className={`h-2 w-16 rounded-full ${
                proposal.status === step
                  ? "bg-blue-600 animate-pulse"
                  : ["resolving", "extracting", "validating"].indexOf(proposal.status) > i
                    ? "bg-blue-600"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (proposal.status === "error") {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg">Processing Failed</h2>
          <p className="text-red-600 mt-2">{proposal.errorMessage || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  // ─── Matrix Ready ───

  // Group requirements by category
  const grouped = requirements.reduce((acc, req) => {
    if (!acc[req.category]) acc[req.category] = [];
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, typeof requirements>);

  const categoryLabels: Record<string, string> = {
    evaluation_factor: "Evaluation Factors",
    mandatory: "Mandatory Requirements",
    personnel: "Personnel Requirements",
    certification: "Certifications & Clearances",
    deliverable: "Deliverables (CDRLs)",
    formatting: "Formatting Requirements",
    other: "Other Requirements",
  };

  const categoryOrder = [
    "evaluation_factor", "mandatory", "personnel",
    "certification", "deliverable", "formatting", "other",
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Solicitation Summary */}
      {proposal.solicitation && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h1 className="text-xl font-bold">
            {proposal.solicitation.title || proposal.title}
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            {[
              { label: "Agency", value: proposal.solicitation.agency },
              { label: "Solicitation #", value: proposal.solicitation.solicitationNumber },
              { label: "NAICS", value: proposal.solicitation.naicsCode },
              { label: "Due Date", value: proposal.solicitation.responseDeadline },
              { label: "Set-Aside", value: proposal.solicitation.setAsideDescription },
              { label: "Est. Value", value: proposal.solicitation.estimatedValue },
              { label: "Contract Type", value: proposal.solicitation.contractType },
              { label: "Location", value: proposal.solicitation.placeOfPerformance },
            ]
              .filter((f) => f.value)
              .map((field) => (
                <div key={field.label}>
                  <span className="text-gray-500 block">{field.label}</span>
                  <span className="font-medium">{field.value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stats + Export */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-800 font-semibold">{requirements.length}</span>
            <span className="text-blue-600 ml-1 text-sm">total</span>
          </div>
          {categoryOrder.map((cat) => {
            const count = grouped[cat]?.length;
            if (!count) return null;
            return (
              <div key={cat} className="bg-gray-50 px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">{count}</span>
                <span className="text-gray-500 ml-1">{cat.replace("_", " ")}</span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => exportToCSV(requirements, proposal)}
          className="border px-4 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Compliance Matrix */}
      <div className="space-y-8">
        {categoryOrder.map((category) => {
          const reqs = grouped[category];
          if (!reqs?.length) return null;

          return (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3">
                {categoryLabels[category]}
                <span className="text-gray-400 font-normal ml-2">({reqs.length})</span>
              </h2>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 w-8">#</th>
                      <th className="text-left px-4 py-2">Requirement</th>
                      <th className="text-left px-4 py-2 w-40">RFP Reference</th>
                      <th className="text-left px-4 py-2 w-32">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reqs
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((req, i) => (
                        <RequirementRow key={req._id} req={req} index={i + 1} />
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequirementRow({ req, index }: { req: any; index: number }) {
  const updateStatus = useMutation(api.requirements.updateStatus);

  return (
    <tr className="hover:bg-blue-50/30">
      <td className="px-4 py-3 text-gray-400">{index}</td>
      <td className="px-4 py-3">
        {req.text}
        {req.evaluationWeight && (
          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {req.evaluationWeight}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">{req.rfpReference}</td>
      <td className="px-4 py-3">
        <select
          value={req.status}
          onChange={(e) =>
            updateStatus({
              requirementId: req._id,
              status: e.target.value as any,
            })
          }
          className="text-xs border rounded px-2 py-1"
        >
          <option value="not_started">Not Started</option>
          <option value="addressed">Addressed</option>
          <option value="partially_addressed">Partial</option>
          <option value="not_applicable">N/A</option>
        </select>
      </td>
    </tr>
  );
}

function exportToCSV(requirements: any[], proposal: any) {
  const headers = ["#", "Category", "Requirement", "RFP Reference", "Section", "Volume", "Weight", "Status"];
  const rows = requirements
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r, i) => [
      i + 1,
      r.category,
      `"${r.text.replace(/"/g, '""')}"`,
      r.rfpReference,
      r.rfpSection || "",
      r.volume || "",
      r.evaluationWeight || "",
      r.status,
    ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proposal.solicitation?.solicitationNumber || proposal.title || "matrix"}-compliance-matrix.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## Environment Variables

```bash
# .env.local (frontend — already exists)
VITE_CONVEX_URL=https://enchanted-peccary-641.convex.cloud

# Convex environment variables (set via: npx convex env set KEY VALUE)
SAM_GOV_API_KEY=...           # From api.sam.gov registration
GOOGLE_GENERATIVE_AI_API_KEY=... # From Google AI Studio (for Gemini)
```

Two API keys total. That's it.

---

## Development Workflow

```bash
# Install new dependencies
bun add @convex-dev/workflow ai @ai-sdk/google zod

# Set Convex env vars
npx convex env set SAM_GOV_API_KEY "your-key"
npx convex env set GOOGLE_GENERATIVE_AI_API_KEY "your-key"

# Start dev (Convex backend + Vite frontend)
bun run dev
```

---

## What Ships in MVP

1. Landing page (exists)
2. `/proposals` — List of parsed proposals (scoped by Clerk owner identity)
3. `/proposals/new` — Input form (SAM.gov URL, solicitation #, or PDF upload)
4. `/proposals/$proposalId` — Compliance matrix view with:
   - Solicitation summary header (metadata from SAM.gov API + Gemini extraction)
   - Requirements grouped by category with evaluation weights
   - Interactive status dropdowns (addressed / not started / N/A)
   - Real-time progress bar during ingestion
   - CSV export
5. 3-step durable workflow (resolve → extract → validate)
6. SAM.gov API integration for metadata + document downloads
7. Gemini 3 Flash for native PDF processing (no parsing service)

## What Does NOT Ship in MVP

- Payments / Stripe
- Company knowledge base / RAG
- Draft generation
- Go/no-go scoring, proposal outline (Phase 1.5 — $299-$499 tier)
- Multiplayer editing
- Continuous compliance validation
- Enterprise SSO
- Team management
- Firecrawl / web scraping
- Opportunity discovery / search

## Pricing Context

The MVP compliance matrix is the **$99-$149 wedge product**. It's priced as an impulse buy (15-20x ROI vs manual labor) to drive volume and conversion up the value ladder:

```
$99-$149  Matrix (MVP)
$299-$499 Bid Intel: go/no-go score, outline, team deliverables (Phase 1.5)
$3-5K     Full proposal draft generation (Phase 2)
$5-50K/mo SaaS for teams (Phase 3)
```

Build Phase 1. Ship it. Charge $99. Convert up the ladder. Everything else follows.
