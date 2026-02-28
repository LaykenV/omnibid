# OmniBid MVP: Build Steps

## What We're Building

User pastes a SAM.gov URL, enters a solicitation number, or uploads a PDF → gets an interactive compliance matrix with every requirement extracted, categorized, and traceable to its RFP reference.

No auth. No payments. No multiplayer. Just the pipeline and the UI.

---

## Step 0: Prerequisites

Before writing any code, register for these API keys — they take time to provision:

1. **Google AI Studio** — Go to [aistudio.google.com](https://aistudio.google.com), sign in, generate an API key. Instant.
2. **SAM.gov API** — Go to [api.sam.gov](https://api.sam.gov), click "Sign Up." Public tier (10 req/day) is instant. Entity-associated access (1,000 req/day) requires SAM.gov entity registration and can take **1-4 weeks**. Start with public tier — it's enough for development.

You cannot test Steps 5 or 6 without these keys. Register now.

---

## What Already Exists

- TanStack Start app with React 19, Tailwind v4, Vite 7 — configured and running
- Convex backend connected (deployment: `enchanted-peccary-641`)
- TanStack Router + React Query + Convex bridge wired up in `src/router.tsx`
- Root layout in `src/routes/__root.tsx`
- Landing page at `src/routes/index.tsx` (complete)
- Public assets (logo, SVGs, manifest)

## What We Need to Build

Everything in `convex/` (schema, functions, workflows, steps) and 3 new frontend routes.

---

## Step 1: Install Dependencies

```bash
# Convex workflow component (durable multi-step pipelines)
bun add @convex-dev/workflow

# Vercel AI SDK + Google Gemini provider
bun add ai @ai-sdk/google zod

# UI utilities (for shadcn components)
bun add @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

Set Convex environment variables:

```bash
npx convex env set GOOGLE_GENERATIVE_AI_API_KEY "your-key-from-aistudio.google.com"
npx convex env set SAM_GOV_API_KEY "your-key-from-api.sam.gov"
```

**Note:** SAM.gov API key registration can take 1-4 weeks for entity-associated access (1,000 req/day). Public tier gives 10 req/day — enough for development. Register now if you haven't.

---

## Step 2: Convex Schema + Component Registration

### 2a. Register the workflow component

Create `convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
import workflow from "@convex-dev/workflow/convex.config.js";

const app = defineApp();
app.use(workflow);

export default app;
```

### 2b. Define the database schema

Create `convex/schema.ts` with 4 tables:

- **`proposals`** — the core entity. Fields: `sessionId`, `title`, `status` (created → resolving → extracting → validating → matrix_ready → error), `statusMessage`, `pipelineVersion`, `inputType`, `inputValue`, `rfpFileIds`, `solicitation` (nested object for SAM.gov metadata), `formatting` (nested object for Section L rules), `resourceLinks`, `requirementCount`, `workflowId`, `errorMessage`. Indexes: `by_session`, `by_status`.

- **`rfpDocuments`** — individual files per proposal. Fields: `proposalId`, `fileName`, `fileType`, `fileId` (Convex storage ref), `sourceUrl`, `status`, `errorMessage`. Index: `by_proposal`.

- **`rawExtractions`** — stores full Gemini JSON responses for debugging. Fields: `proposalId`, `documentId`, `model`, `extractionType`, `rawOutput`, `tokenUsage`, `durationMs`. Index: `by_proposal`.

- **`requirements`** — the compliance matrix rows. Fields: `proposalId`, `category` (mandatory / evaluation_factor / formatting / deliverable / certification / personnel / other), `text`, `rfpReference`, `rfpSection`, `volume`, `evaluationWeight`, `status` (not_started / addressed / partially_addressed / not_applicable), `notes`, `sortOrder`. Indexes: `by_proposal`, `by_proposal_category`, `by_proposal_status`.

Full schema code is in `TECHNICAL.md` → "Database Schema" section.

---

## Step 3: Convex Functions (CRUD)

### 3a. `convex/proposals.ts`

Public functions:
- `create` — mutation. Takes `sessionId`, `inputType`, `inputValue`, optional `rfpFileIds`. Inserts proposal with `status: "created"` and `pipelineVersion: 1`. Starts the ingestion workflow via `workflow.start()`. Returns `proposalId`.
- `list` — query. Takes `sessionId`. Returns all proposals for this session, ordered desc.
- `get` — query. Takes `proposalId`. Returns the proposal.
- `generateUploadUrl` — mutation. Returns a Convex storage upload URL for PDF uploads.

Internal functions (called by workflow steps only):
- `updateStatus` — patches `status`, `statusMessage`, `errorMessage`
- `patchSolicitation` — patches `solicitation`, `title`, `resourceLinks`
- `patchMetadata` — patches `solicitation` (supplement) and `formatting`
- `patchRequirementCount` — patches `requirementCount`

### 3b. `convex/requirements.ts`

Public functions:
- `listByProposal` — query. Returns all requirements for a proposal.
- `updateStatus` — mutation. User marks a requirement as addressed / not_applicable / etc. Also accepts optional `notes`.

Internal functions (called by workflow steps):
- `bulkInsert` — inserts an array of requirements for a proposal
- `updateText` — patches text (used during dedup merging)
- `updateCategory` — patches category (used during validation recategorization)
- `updateSortOrder` — patches sortOrder
- `remove` — deletes a requirement (used during dedup)

### 3c. `convex/rfpDocuments.ts`

Internal functions only (not exposed to frontend):
- `create` — inserts a new rfpDocument record
- `get` — returns a document by ID
- `listByProposal` — returns all documents for a proposal
- `updateStatus` — patches status and errorMessage

### 3d. `convex/rawExtractions.ts`

Internal function:
- `create` — inserts a raw extraction record

Full code for all functions is in `TECHNICAL.md` → "Convex Functions" section.

---

## Step 4: The Workflow (Durable Pipeline)

### 4a. Workflow Manager

Create `convex/workflows/manager.ts`:

```typescript
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

### 4b. Ingestion Workflow

Create `convex/workflows/ingestRfp.ts` — a 3-step durable workflow:

```
Step 1: resolveAndAcquire  (retry: 3x)
Step 2: extractRequirements (retry: 3x, backoff: 5s)
Step 3: validateAndOrganize (retry: 2x)
→ Mark proposal as matrix_ready
```

Each step is an `internalAction` reference. If any step fails and exhausts retries, the workflow marks the proposal as `error` with the error message. Steps that succeed are journaled and never re-run.

**Error handling:** Wrap the workflow body in try/catch. On catch, call `updateStatus` with `status: "error"` and the error message. This is critical — without it, failed proposals stay stuck in a processing state with no user-visible feedback. The `@convex-dev/workflow` retry behavior handles transient failures (network timeouts, rate limits), but permanent failures (invalid PDF, no requirements found) must be caught and surfaced.

Full workflow definition is in `TECHNICAL.md` → "The Pipeline" section.

---

## Step 5: Workflow Step 1 — Resolve & Acquire

Create `convex/steps/resolveAndAcquire.ts` (`"use node"` internalAction):

**What it does:**
1. Reads the proposal to get `inputType` and `inputValue`
2. Updates status to `"resolving"`
3. **If PDF upload:** Creates `rfpDocuments` records from the already-uploaded `rfpFileIds`. Done.
4. **If SAM.gov URL:** Extracts `noticeId` from URL pattern (`sam.gov/opp/{noticeId}/view`), calls SAM.gov API
5. **If solicitation number:** Calls SAM.gov API with `solnum` parameter
6. Stores structured metadata in `proposal.solicitation`
7. Downloads each file from `resourceLinks[]` into Convex file storage
8. Creates `rfpDocuments` records for each downloaded file
9. Returns array of document IDs

**Key details:**
- SAM.gov API endpoint: `https://api.sam.gov/prod/opportunities/v2/search`
- Must include `postedFrom`/`postedTo` params (use 1-year lookback)
- `resourceLinks` can be null — handle gracefully
- URL safety: HTTPS only, block private IP ranges, disable redirects
- Only download PDF/DOCX files for MVP (skip XLSX, ZIP, etc.)
- If no documents found, throw with a clear message asking user to upload manually

Full code in `TECHNICAL.md` → "Step 1: Resolve & Acquire" section.

---

## Step 6: Workflow Step 2 — Extract Requirements

Create `convex/steps/extractRequirements.ts` (`"use node"` internalAction):

**What it does:**
1. Updates status to `"extracting"`
2. For each document: gets raw file bytes from Convex storage
3. Sends the entire PDF to Gemini 3 Flash via `generateObject` from Vercel AI SDK
4. Uses a Zod schema that extracts three things in one call:
   - **Metadata:** solicitation number, title, agency, deadline, NAICS, set-aside, contract type, estimated value
   - **Formatting:** page limit, font, font size, margins, line spacing, required volumes
   - **Requirements:** array of `{ category, text, rfpReference, rfpSection, volume, evaluationWeight }`
5. Stores raw JSON response in `rawExtractions` table
6. Supplements (not overwrites) proposal metadata — SAM.gov API data is ground truth
7. Bulk inserts all requirements

**Key details:**
- Model: `google("gemini-3-flash")` with `structuredOutputs: true`
- Fallback model: `google("gemini-2.5-flash")` if preview has issues
- Pass PDF as `{ type: "file", data: fileBytes, mimeType: "application/pdf" }` — for DOCX files from SAM.gov, use `mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"`
- The prompt must emphasize exhaustiveness — "missing a single requirement can disqualify a proposal"
- Track `tokenUsage` and `durationMs` for cost monitoring

Full code in `TECHNICAL.md` → "Step 2: Extract Requirements" section.

---

## Step 7: Workflow Step 3 — Validate & Organize

Create `convex/steps/validateAndOrganize.ts` (`"use node"` internalAction):

**What it does:**
1. Updates status to `"validating"`
2. Reads all extracted requirements from the database
3. Sends them to Gemini 3 Flash asking for:
   - **Deduplication:** groups of duplicate/near-duplicate requirements, which to keep, which to remove
   - **Recategorization:** requirements that were miscategorized (e.g., eval factor tagged as mandatory)
   - **Sorting:** logical order — evaluation factors first (by weight), then mandatory, personnel, certification, deliverable, formatting, other
4. Stores raw response in `rawExtractions`
5. Applies recategorizations
6. Deletes duplicates, optionally merges text from best version
7. Updates sort orders
8. Patches `requirementCount` on the proposal

Full code in `TECHNICAL.md` → "Step 3: Validate & Organize" section.

---

## Step 8: Session ID Helper

Create `src/lib/session.ts`:

```typescript
const SESSION_KEY = "omnibid_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
```

Create `src/lib/utils.ts` (for shadcn `cn()` helper):

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 9: Frontend Route — Proposals List

Create `src/routes/proposals/index.tsx`:

- Uses `convexQuery(api.proposals.list, { sessionId })` for real-time data
- Shows list of proposals as cards with title, agency, status badge, requirement count
- "New Proposal" button linking to `/proposals/new`
- Empty state with CTA when no proposals exist
- Status badges: Created (gray), Resolving (yellow), Extracting (blue), Validating (purple), Ready (green), Error (red)

---

## Step 10: Frontend Route — New Proposal Form

Create `src/routes/proposals/new.tsx`:

- Three input mode tabs: "SAM.gov URL" | "Solicitation #" | "Upload PDF"
- For URL/solicitation: text input with placeholder
- For PDF: file input accepting `.pdf, .docx` with drag-and-drop styling
- On submit:
  - If PDF upload: call `generateUploadUrl()`, upload file via `fetch(POST)`, get `storageId`
  - Call `proposals.create()` with sessionId, inputType, inputValue, rfpFileIds
  - Navigate to `/proposals/$proposalId`
- Disable submit button while processing
- Show error state if creation fails

---

## Step 11: Frontend Route — Proposal Detail (Matrix View)

Create `src/routes/proposals/$proposalId.tsx`:

This is the main product page — the thing we're selling. Build it in sub-steps:

### 11a. Processing State

While `status` is not `matrix_ready` or `error`:
- Animated spinner
- Status message from `proposal.statusMessage`
- 3-step progress bar (resolving → extracting → validating) — highlight the current step, gray out future steps, checkmark completed steps
- This updates in real-time via Convex subscription — no polling needed

### 11b. Error State

Red error card with `proposal.errorMessage`. Include a "Back to proposals" link so the user isn't stranded.

### 11c. Solicitation Summary Header

Grid showing agency, solicitation #, NAICS, due date, set-aside, estimated value, contract type, location. Only render fields that have data — don't show empty rows/cells.

### 11d. Requirements Table

The core of the product:
- Requirements grouped by category, ordered: evaluation factors, mandatory, personnel, certification, deliverable, formatting, other
- Each category is a collapsible section with count badge
- Table columns: #, Requirement text (with evaluation weight badge if present), RFP Reference, Status dropdown
- Status dropdown is a `<select>` calling `requirements.updateStatus` mutation — changes persist instantly via Convex reactivity

### 11e. CSV Export

Button that generates and downloads a CSV with columns: #, Category, Requirement, RFP Reference, Section, Volume, Weight, Status. Use `Blob` + `URL.createObjectURL` + programmatic `<a>` click — no server needed.

### 11f. Stats Bar

Total requirements count + per-category counts as badges/pills. Place between the summary header and the requirements table.

---

## Step 12: Test End-to-End

### Test with PDF upload (no SAM.gov key needed):

1. Find a sample federal RFP PDF (search "federal RFP sample PDF" or use a real one from SAM.gov)
2. Go to `/proposals/new`
3. Select "Upload PDF" tab
4. Upload the PDF
5. Watch the progress bar move through resolving → extracting → validating
6. Verify the compliance matrix shows up with categorized requirements
7. Click status dropdowns — verify they persist
8. Export CSV — verify it downloads with correct data

### Test with SAM.gov URL (needs API key):

1. Go to sam.gov, find an active solicitation
2. Copy the URL (format: `https://sam.gov/opp/{noticeId}/view`)
3. Go to `/proposals/new`
4. Paste the URL
5. Verify metadata is populated from the API
6. Verify documents are downloaded and processed

### Test with solicitation number:

1. Use a known solicitation number (e.g., from sam.gov)
2. Verify lookup and processing works

### Edge cases to test:

- Upload a non-PDF file (should reject or handle gracefully)
- Upload a non-RFP PDF (e.g., a restaurant menu, a resume) — verify it completes without crashing and shows zero or near-zero requirements with a user-facing message like "No requirements found — this may not be an RFP"
- SAM.gov URL with no `resourceLinks` (should show error asking for manual upload)
- Very short RFP (2-5 pages) — verify it still extracts correctly
- Very long RFP (200+ pages) — verify it completes within Gemini's limits
- Network error during processing — verify workflow retries

---

## Step 13: Polish

- [ ] **SSR sessionId hydration fix** — `getSessionId()` returns `""` on the server (no `localStorage`). This means the initial SSR render passes `sessionId: ""` to Convex queries, which returns no data. On hydration, the client gets the real sessionId and re-renders — causing a flash of empty state. Fix: skip rendering the proposals query until `sessionId` is truthy, or show a loading skeleton during the first client render.
- [ ] Error boundaries on all routes (catch rendering errors gracefully)
- [ ] Loading skeletons for proposal list and matrix view
- [ ] Mobile-responsive layout for the matrix (at minimum: readable on tablet)
- [ ] Favicon and page titles per route
- [ ] Link from landing page to `/proposals/new` (CTA button)
- [ ] Link from landing page to `/proposals` (secondary nav)
- [ ] "Back to proposals" link on the detail page

---

## File Checklist

When done, these files should exist:

```
convex/
├── convex.config.ts              ← Step 2a
├── schema.ts                     ← Step 2b
├── proposals.ts                  ← Step 3a
├── requirements.ts               ← Step 3b
├── rfpDocuments.ts               ← Step 3c
├── rawExtractions.ts             ← Step 3d
├── workflows/
│   ├── manager.ts                ← Step 4a
│   └── ingestRfp.ts              ← Step 4b
└── steps/
    ├── resolveAndAcquire.ts      ← Step 5
    ├── extractRequirements.ts    ← Step 6
    └── validateAndOrganize.ts    ← Step 7

src/
├── lib/
│   ├── session.ts                ← Step 8
│   └── utils.ts                  ← Step 8
└── routes/
    └── proposals/
        ├── index.tsx             ← Step 9
        ├── new.tsx               ← Step 10
        └── $proposalId.tsx       ← Step 11
```

---

## Build Order Summary

| Step | What | Files | Depends On |
|------|------|-------|------------|
| 1 | Install deps + set env vars | `package.json` | Nothing |
| 2 | Schema + component registration | `convex.config.ts`, `schema.ts` | Step 1 |
| 3 | Convex CRUD functions | `proposals.ts`, `requirements.ts`, `rfpDocuments.ts`, `rawExtractions.ts` | Step 2 |
| 4 | Workflow manager + definition | `workflows/manager.ts`, `workflows/ingestRfp.ts` | Step 3 |
| 5 | Step 1: Resolve & Acquire | `steps/resolveAndAcquire.ts` | Step 4 |
| 6 | Step 2: Extract Requirements | `steps/extractRequirements.ts` | Step 4 |
| 7 | Step 3: Validate & Organize | `steps/validateAndOrganize.ts` | Step 4 |
| 8 | Session ID + utils | `src/lib/session.ts`, `src/lib/utils.ts` | Nothing |
| 9 | Proposals list page | `src/routes/proposals/index.tsx` | Steps 3, 8 |
| 10 | New proposal form | `src/routes/proposals/new.tsx` | Steps 3, 8 |
| 11 | Matrix view page | `src/routes/proposals/$proposalId.tsx` | Steps 3, 8 |
| 12 | End-to-end testing | — | Steps 1-11 |
| 13 | Polish | Various | Step 12 |

Steps 5, 6, 7 can be built in parallel (they're independent internalActions).
Steps 9, 10, 11 can be built in parallel (they're independent routes).
Step 8 has no dependencies and can be done anytime.

All implementation code is in `TECHNICAL.md`. This doc tells you what to build and in what order. That doc tells you how.

---

## Known Limitations (MVP Scope)

These are intentionally out of scope for MVP. Document them so they don't become surprise bugs:

- **No authentication** — anyone with the URL can create proposals. Session isolation is by localStorage UUID only.
- **No payments** — the product is free during MVP. Stripe integration comes after validation.
- **No XLSX/ZIP/MSG support** — SAM.gov sometimes attaches Excel spreadsheets, ZIP archives, or Outlook messages. MVP only processes PDF and DOCX files. Other file types are silently skipped during download.
- **No retry UI** — if a proposal fails, the user must create a new one. There's no "retry" button. (The backend workflow retries automatically, but if all retries are exhausted, it's a dead end.)
- **No RFP amendments** — SAM.gov solicitations get amended frequently. MVP processes whatever is posted at the time of ingestion. No tracking of amendments or re-processing.
- **Very large RFPs (1,000+ pages)** — Gemini 3 Flash has a 1M token context window (~700K words), so most RFPs fit. But multi-volume procurement packages with 1,000+ pages may hit limits. No chunking strategy in MVP.
- **Single-user only** — no team features, no sharing, no collaboration. One sessionId = one user's proposals.
