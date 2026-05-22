# OmniBid Loom Demo Page Plan

## Goal

Create a purpose-built OmniBid demo page for the Varholdt AI Loom.

This page should package the existing RFP parsing workflow as a clean, buyer-facing proof moment. It is not a new product surface, not a replacement for the authenticated proposal workspace, and not a public SaaS launch page.

The demo page should help the recording say:

> Here is one working example of a human-reviewed document workflow agent.

## Route

Use the demo URL:

```txt
/demo/rfp-agent
```

Implementation detail: the route file lives under the authenticated route tree at `src/routes/_authed/demo/rfp-agent.tsx`, but TanStack exposes the browser path as `/demo/rfp-agent`.

Reasoning: `api.proposals.get` and `api.requirements.listByProposal` both call `requireIdentity` and throw on unauthenticated callers. Building public-facing equivalents costs ~half a day of backend work that the Loom does not need. Sign in once before recording, then open `/demo/rfp-agent`.

Hide all navigation chrome on this route. The Loom must not show the existing app shell, proposal list, account UI, login UI, or product claims from the older OmniBid marketing page. The demo canvas is the only thing on screen.

Revisit a public `/demo/rfp-agent` route only if the Varholdt AI marketing page later wants a clickable, self-serve "watch it run" surface.

## Experience Shape

The page should feel like a controlled workflow console, not a generic app dashboard.

Use one screen with four visible zones:

1. Header: "RFP Response Agent"
2. Input panel: prefilled SAM.gov URL or solicitation number
3. Workflow rail: Ingest → Extract → Review → Output
4. Results panel: compliance matrix with citations and human-review controls

## Demo Script Mapping

The UI should support these exact recording beats:

### Beat 1 — Input

Visible text:

```txt
RFP Response Agent
Reads a public solicitation, extracts requirements with citations, and prepares a human-reviewed compliance matrix.
```

Input:

- Prefilled SAM.gov URL or solicitation number
- Primary button: "Run RFP Agent"
- Secondary text: "Public solicitation only. No CUI or private client data."

Avoid:

- "Create Proposal"
- "Start free trial"
- "Sign up"
- Anything that makes OmniBid look like the thing being sold

### Beat 2 — Workflow Progress

After clicking "Run RFP Agent," show a compact progress rail:

```txt
Ingest source document
Extract requirements
Prepare review matrix
Human approval
```

Use the existing proposal statuses underneath:

- `resolving` → Ingest source document
- `extracting` → Extract requirements
- `validating` → Prepare review matrix
- `matrix_ready` → Human approval

If live processing is too slow or unreliable for recording, support a "Replay completed run" mode that animates these steps for 6-8 seconds and then loads a known completed proposal.

### Beat 3 — Matrix

Results should prioritize scanability:

- Total requirement count
- Category counts
- Due date
- Agency
- Solicitation number
- A table grouped by category
- A destination chip near the matrix header reading **"Lands in: Excel · Word · SharePoint"**. Non-functional badge. Its job is to visually close the "lives in your tools" story so the proof moment does not end inside the app shell. Do not wire export to it; it is a label.

Suggested table columns:

```txt
#
Requirement
Source
Category
Human Review
```

Keep the "Source" column visually prominent. This is the proof point.

Human Review can use the existing requirement statuses:

- Needs review (`not_started`)
- Approved (`addressed`)
- Partial (`partially_addressed`)
- Not applicable (`not_applicable`)

For the Loom, status controls can be dropdowns or segmented pills. The key is that the buyer sees the workflow requires human approval.

### Beat 4 — Citation Focus

Add a citation-friendly interaction for the recording.

Before building, confirm what the data layer actually stores on each requirement. Grep `convex/requirements.ts`, `convex/rawExtractions.ts`, and `convex/schema.ts` for the citation fields. The drawer's contents must match what is actually persisted.

- If only a section/page reference is stored (e.g. "Section L.3.2(a), page 14"), design the drawer around just that.
- If a verbatim source excerpt is stored, include it as a quoted block.
- Do not render an "Excerpt" section that resolves empty or fakes content. The reference alone is sufficient traceability proof.

Drawer contents (use only what exists):

- Requirement text
- Source reference (section, page)
- Source excerpt, only if persisted
- "Reviewer verifies against source document before approval"

Do not fake a PDF jump unless it actually works.

### Beat 5 — Pattern Transfer

Add a small, non-dominant side panel or footer strip. Keep this list to **three** items so it matches the Loom script cadence (the script names three segments verbally — four items on screen while three are named reads as a sync mismatch):

```txt
Same pattern, different documents
Resume screening
Claims prep
Client source-doc intake
```

This gives the Loom a visual anchor for the "pattern, not product" section without turning the video into a portfolio tour.

## Data Strategy

Use a known-good completed proposal for the final recording.

Recommended modes:

### Mode A — Live Run

Use the existing Convex workflow:

1. User clicks "Run RFP Agent."
2. Page calls `api.proposals.create`.
3. Page navigates or stays subscribed to that proposal.
4. Results render when status becomes `matrix_ready`.

Pros:

- Honest live proof.

Cons:

- SAM.gov/API/model latency can break the take.

### Mode B — Replay Completed Run

Create a demo fixture pointer:

```ts
const DEMO_PROPOSAL_ID = "..."
```

Flow:

1. User clicks "Run RFP Agent."
2. UI animates the progress rail for 6-8 seconds.
3. Page loads the known completed proposal and requirements.

Pros:

- Reliable for Loom.
- Still uses real extracted data.

Cons:

- Not a live parse. Do not claim it is live in narration unless using Mode A.

Recommended for the first Loom: Mode B, using real completed output. The video can say "this example uses a real public solicitation" without claiming a fresh live model run.

## Implementation Notes

Reuse existing pieces where practical:

- Data queries from `src/routes/_authed/proposals/-proposalDetail.tsx`
- `api.proposals.get`
- `api.requirements.listByProposal`
- Existing category labels/order, but rename for buyer clarity where useful

**Do not wire CSV/Excel export on this page.** Export is forbidden in the Loom (see `loom.md` recording rules). The destination chip in Beat 3 is a label, not a control.

Build a dedicated presentation component instead of trying to stretch the current proposal detail page. The existing page is fine for operator use, but the Loom needs fewer distractions and a clearer story.

Files:

```txt
src/routes/_authed/demo/rfp-agent.tsx
src/routes/_authed/demo/-rfpAgentDemo.tsx
src/routes/_authed/demo/-demoData.ts
```

In `-demoData.ts`, pin the chosen SAM.gov solicitation as a named constant with a comment recording why it was picked (clean parse, good requirement count, no CUI, public). Future re-records will need this — present-you knows which RFP held up under the parser; six-months-from-now-you will not.

## Visual Direction

Tone:

- Clean
- Operational
- Federal-document credible
- Less patriotic than the current OmniBid homepage
- More like a review console than a marketing site

Avoid:

- Big landing-page hero sections
- Portfolio language
- "OmniBid helps you win contracts"
- Excess red/white/blue styling
- Dense product navigation
- Pricing, trials, or SaaS CTAs

Use:

- Neutral document-workflow palette
- Compact labels
- Clear status chips
- Source/citation pills
- A single confident primary action

## Copy

Header:

```txt
RFP Response Agent
```

Subhead:

```txt
Reads a public solicitation, extracts requirements with citations, and prepares a human-reviewed compliance matrix.
```

Input helper:

```txt
Public RFP only. No CUI, classified, or private client material.
```

Primary CTA:

```txt
Run RFP Agent
```

Progress labels:

```txt
Ingest source
Extract requirements
Prepare matrix
Human review
```

Result headline:

```txt
Compliance matrix ready for review
```

Citation drawer title:

```txt
Source trace
```

Human-review note:

```txt
AI prepares the matrix. A human verifies requirements, assumptions, and response strategy.
```

Pattern strip:

```txt
Same pattern for resumes, claims, source-doc intake, and internal knowledge search.
```

## Recording Guardrails

- Do not show auth screens.
- Do not show proposal list screens.
- Do not show code or admin tools.
- Do not expose personal accounts, API keys, Convex dashboard, or logs.
- Do not show a broken export button or unfinished feature.
- Do not imply the demo was a paid client engagement.
- Do not claim Excel/PDF export unless the recording shows a working export.
- Do not claim confidence scoring unless it is implemented or clearly marked as a future sprint capability.

## Definition Of Done

The demo page is ready when:

- The page can be opened directly before recording.
- One click starts a reliable workflow or replay.
- The results view appears within 10 seconds for recording.
- Requirement count, categories, source references, and review status are visible without scrolling too much.
- At least one source/citation interaction is easy to show.
- The page contains no SaaS-buying CTA.
- The page visually supports the Varholdt AI offer: human-reviewed document workflow agents.
- The full demo can be performed in one continuous take after sign-in, without showing auth, reloading the page, or switching context.
- No element on the page acts like an Excel/PDF export, confidence scoring control, or any feature not visually present and working. The "Excel · Word · SharePoint" destination chip is allowed as a non-functional label.
