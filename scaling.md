# OmniBid: Scaling Plan

Operational roadmap from May 2026 forward. The strategic positioning lives in `business.md`; the architectural decisions live in `TECHNICAL.md`. This doc is what actually gets built and shipped, in what order, to get from "working MVP" to "first paid audit" to "$50k MRR."

---

## Where We Are (May 2026)

### Codebase reality

The MVP works end-to-end for a single user, single owner, single RFP. Concretely:

**Backend (`convex/`)**

- `schema.ts` — four tables: `proposals`, `rfpDocuments`, `rawExtractions`, `requirements`. Indexes by owner, status, proposal, category. No team / client / knowledge-base tables yet.
- `proposals.ts` — `create`, `list`, `get`, `generateUploadUrl`, plus internal mutations for status / metadata patching. All scoped to `identity.subject` from Clerk.
- `workflows/ingestRfp.ts` — three-step durable workflow with retries: resolve → extract → validate → mark `matrix_ready`.
- `steps/resolveAndAcquire.ts` — SAM.gov v2 search by `noticeId` or `solnum`, downloads `resourceLinks` (PDF/DOCX) into Convex storage. SSRF guards on URL hostname and final redirect URL. Falls back to direct upload if input type is `pdf_upload`.
- `steps/extractRequirements.ts` — single Gemini 3 Flash call per document with a Zod schema producing metadata + formatting + categorized requirements with citations. One call per doc, no chunking.
- `steps/validateAndOrganize.ts` — third pass; needs review for what it actually does (likely dedup + ordering, not confidence scoring).
- `rfpDocuments.ts`, `rawExtractions.ts`, `requirements.ts` — supporting domain modules.

**Frontend (`src/`)**

- `routes/index.tsx` — patriotic landing page positioned for "Parse an RFP" self-serve. Will be replaced with audit-offer landing.
- `routes/_authed/proposals/*` — list, detail, new-proposal flow with categorized requirements view.
- `routes/sign-in.tsx` / `sign-up.tsx` — Clerk integration.
- Auth gated on `_authed.tsx` layout.

**Stack**

TanStack Start (React 19) + Convex + Clerk + Vercel AI SDK + Gemini 3 Flash + Tailwind v4. Bun for tooling.

### Business reality

- $0 revenue
- 0 customers
- 0 paid pilots
- No LLC formed
- No E&O insurance
- No MSA / SOW templates
- No outreach list compiled
- No sample packet built
- No outbound emails sent
- Solo operator, veteran, currently on a DOL contract

This isn't bad — it's the honest baseline so the plan below is calibrated to it.

---

## What Works Today

- A SAM.gov URL or a direct PDF upload reliably yields a structured compliance matrix with metadata, formatting rules, and categorized requirements with section/page citations
- Gemini 3 Flash extraction quality on standard federal RFPs (FAR Part 15-style solicitations) is good enough to be the foundation of a paid deliverable, with human review on top
- The Convex workflow is durable: retries on each step, status messages surface to the UI, errors are captured in `errorMessage`
- The owner-scoped data model means we can run multiple clients through one operator account without leakage
- The whole pipeline runs in ~$0.50–$2.00 of API cost per RFP

## What's Broken or Thin

- **No exports.** The matrix only lives in our UI. Clients need Excel and PDF deliverables. This is the single biggest gap to first paid audit.
- **Single-pass extraction.** One Gemini call per doc, no confidence scoring, no second-pass validation against the source. A miss disqualifies a bid; we need a review gate.
- **No client/account model.** Schema is owner-scoped (one Clerk user = one workspace). For retainer delivery to multiple clients we need a `clients` table and per-client knowledge libraries.
- **No knowledge base.** Past performance, capability statements, certs, resumes — none of this can live in the app yet.
- **No opportunity monitoring.** SAM.gov fetch is only on-demand from a notice ID; there's no recurring NAICS-filtered pull for retainer clients.
- **Landing page is for the wrong product.** It sells "Parse an RFP" self-serve, not a $2,500 audit.
- **No payment surface.** No Stripe, no invoicing flow, no Convex Stripe component wired up.

---

## Functionality Gap, Sequenced

Three concentric rings. Don't build ring 2 before ring 1 is shipping work; don't build ring 3 before ring 2 has paying customers.

### Ring 1 — To Send a Sample Packet (week 1–2)

The sample packet is the **landing page artifact**: a polished, public-RFP-based demo of what a $2,500 audit produces, hosted as a downloadable PDF + Excel. One-time build.

App work:

- [ ] **Excel export of compliance matrix** — match Shipley-style traceability matrix layout: `Requirement #`, `Source (Section + Page)`, `Category`, `Mandatory/Eval`, `Requirement Text`, `Owner`, `Status`, `Proposal Reference`, `Notes`. Implementation: Convex action that queries requirements for a proposalId, builds a workbook with `exceljs`, returns a signed download URL.
- [ ] **PDF export of proposal-detail view** — server-rendered React → PDF (or Puppeteer on a Node action). Sections: cover page, solicitation summary, formatting requirements, full categorized requirements list with citations.
- [ ] **Manual artifacts (no app build)** — bid/no-bid scorecard, risk register, evidence checklist, outline, recommendation memo. Build the first sample packet by hand in Word + Google Sheets. Don't automate until we've delivered 2–3 by hand and know what's actually useful.

Content work:

- [ ] **Pick one public RFP** with enough complexity to be representative (target: 100–200 page IT services or professional services solicitation; NAICS 541512 or 541611). Run it through the app, then write the surrounding artifacts manually.
- [ ] **Build the sample packet PDF** — a single bound PDF combining all artifacts, branded, with a cover page and table of contents.

### Ring 2 — To Send Outreach + Take a Paid Audit (week 2–6)

Legal / ops:

- [ ] **Form Louisiana single-member LLC** (~$100, ~1 week)
- [ ] **EIN** (free, same day)
- [ ] **Business bank account** (LLC must be formed first)
- [ ] **E&O / professional liability insurance** ($800–$1,500/yr; quotes from Hiscox, Embroker, Next Insurance). Minimum $1M occurrence is standard for consulting.
- [ ] **Data handling policy** (one page, public): public solicitations only, no CUI, redacted past performance only, retention 90 days post-engagement, encrypted Convex storage, no third-party data sharing
- [ ] **Master Services Agreement template** (use a SaaS-services hybrid template, attorney review optional at this stage)
- [ ] **Audit Statement of Work template** (fixed-scope $2,500, 5 business days, deliverables list, revision policy)
- [ ] **Stripe account + payment link** for $2,500 audit

Sales assets:

- [ ] **Landing page rewrite** (`src/routes/index.tsx`) — repositioned for the audit offer:
  - Hero: "Win more federal bids without hiring another proposal manager"
  - Problem statement focused on small VOSB pain
  - Sample packet preview + download
  - The audit offer: $2,500 / 5 days / fixed scope / credit toward retainer
  - Veteran founder bio + DOL contract credibility
  - Single CTA: "Send me your RFP"
- [ ] **3-minute Loom walkthrough** of the sample packet
- [ ] **Outreach list** — pull from SBA VetCert (LA, TX, MS, AL) filtered by NAICS 541512, 541611, 541330, 236220. Target: 200–500 named SDVOSBs/VOSBs. Enrich with website, LinkedIn of founder/CEO/VP BD where available.
- [ ] **Cold email template** — the "free fit-memo" opener. Per-prospect, takes ~20 minutes per send: pick an active SAM.gov solicitation matching their NAICS, run it through the app, write a one-page fit/risk memo as PDF, attach to a 4-line email.

App work for paid audits:

- [ ] **Confidence flagging** on requirements — second Gemini pass that re-reads the source for each extracted requirement and rates confidence. Surface `low_confidence` items for operator review before export. This is the liability shield.
- [ ] **CSV export** as a stopgap if Excel export isn't shipped yet (less polished but unblocks delivery)

### Ring 3 — To Run Retainer Delivery (months 2–4)

Triggered when the first paid audit converts to a retainer. Don't pre-build.

App work:

- [ ] **`clients` schema** — separate from `proposals`. A client has an `ownerId` (operator), name, NAICS profile, set-aside designations, contact info.
- [ ] **`clientKnowledge` schema** — past performance, capability statements, certs, resumes, boilerplate. Stored as Convex files + extracted text. Used by future RAG-style queries for evidence matching.
- [ ] **Per-client proposal grouping** — filter proposal list by client, multi-tenant operator UI.
- [ ] **Opportunity monitoring** — daily Convex cron action that hits SAM.gov v2 search per client NAICS profile, dedupes against prior runs, emits a digest. Stored in a new `opportunities` table.
- [ ] **Bid/no-bid scoring action** — Gemini call that takes (RFP requirements, client capability profile, past performance) → weighted fit score with reasoning. PDF-exportable.
- [ ] **Required-evidence diff** — given an RFP's mandatory requirements and a client knowledge base, surface gaps (e.g., "RFP requires CMMI Level 3, no evidence of certification in client library").
- [ ] **Slack or email digest delivery** — weekly memo automation per client.

Ops work:

- [ ] **Retainer MSA + scope schedule** template
- [ ] **Recurring invoice setup** (Stripe subscription or manual monthly)
- [ ] **Per-client Slack Connect or shared email channel**

### Ring 4 — To Scale Past $30k MRR (months 6–12)

- [ ] **Subcontractor sourcing** — fractional proposal consultant for QA on Section L/M responses; $75–$125/hr, 10–20 hrs/month. Likely sourced through APMP network or LinkedIn.
- [ ] **Delivery SOPs** — written checklists for matrix QA, bid/no-bid review, fit-memo writing. Encode the "what an operator does" knowledge so a delivery contractor can execute it.
- [ ] **Templated Excel formats** — one master traceability matrix template that handles federal, state, and commercial variants without per-engagement customization.
- [ ] **Internal admin UI** — operator dashboard to manage clients, opportunities, deliverables, status. Currently we'd be running this off the proposals list, which won't scale past ~3 clients.
- [ ] **Analytics on retention and conversion** — track audit→retainer conversion rate, retainer churn, expansion revenue. Decide investment based on data.

---

## How Outreach Actually Works

The mechanic for getting from $0 to first paid audit. This is the operational core of the next 60 days.

### The free fit-memo loop

Per prospect, ~20 minutes:

1. From the outreach list, pick a target whose NAICS profile matches a currently-active SAM.gov solicitation
2. Drop the SAM.gov URL into the OmniBid app, get the matrix
3. Spend 10 minutes writing a one-page "fit/risk memo" PDF: agency, due date, mandatory requirements summary, top 3 risk flags, fit score (high/medium/low), and one specific competitive insight
4. Send a 4-line email with the PDF attached:
   > Hey [Name] — fellow vet in Louisiana. [Agency] dropped solicitation [#] last week which looks aligned with [Company]'s past work on [prior contract from public records]. I ran it through my analysis tool and pulled together a quick fit/risk memo (attached). No pitch — let me know if it's useful.

### Conversion path

- Email sent → 5–15% reply rate (realistic for warm-targeted, free-deliverable outreach)
- Reply → 30-min discovery call
- Discovery call → "Do you do this every week, or is it still mostly manual?" → audit pitch
- Audit close → ~25% of qualified discovery calls
- Audit delivered → ~30–50% convert to retainer

Math at conservative rates: 200 sends → 20 replies → 6–10 calls → 1–2 paid audits → 1 retainer. That's the realistic month-2-to-month-4 funnel.

### Channels in priority

1. APEX Accelerators (in-person meeting → referrals)
2. Veteran business networks (NaVOBA, Bunker Labs, LSU Stephenson Center)
3. Targeted cold email with fit-memo asset (the bulk of volume)
4. LinkedIn DMs to founder/CEO/VP BD titles
5. Proposal consultant partnerships (year-1 stretch goal)

---

## Sequenced Plan from Today

Today is 2026-05-05.

### Sprint 0: Foundations + Sample Packet (May 5 – May 19)

Two weeks. End state: sample packet exists, LLC paperwork filed.

- File LLC, apply for EIN
- Get E&O insurance quotes
- Ship Excel export from the app
- Ship PDF export of proposal detail (or accept Word manual conversion as stopgap)
- Pick one public RFP, run it through the app, write the surrounding sample packet artifacts manually
- Bind the sample packet into a single PDF + Excel pair

### Sprint 1: Outreach Setup (May 19 – June 2)

Two weeks. End state: outreach list ready, landing page repositioned, first 25 emails sent.

- LLC active, E&O bound, bank account open
- MSA + Audit SOW templates drafted
- Data handling policy written and posted
- Stripe account + payment link
- Landing page rewrite (`src/routes/index.tsx`) — audit offer, sample packet preview, single CTA
- Outreach list compiled (target 200+)
- Loom walkthrough recorded
- First 25 free fit-memos sent
- APEX Accelerator counselor in Baton Rouge contacted

### Sprint 2: First Dollar (June 2 – July 7)

Five weeks. End state: 1–2 paid audits closed, first delivery in progress.

- Continue outreach at ~50/week (target 200+ total sends)
- Discovery calls on every reply
- First paid audit closed
- Confidence flagging shipped in the app (delivery quality gate)
- First audit delivered (manual artifacts written by hand)
- Lessons logged: what was actually useful in the deliverable, what was filler

### Sprint 3: First Retainer (July 7 – August 7)

Four weeks. End state: 1 active retainer client, MRR clock started.

- 2nd paid audit delivered
- First retainer signed
- Retainer MSA template finalized
- Per-client folder structure established (Google Drive or similar)
- Begin Ring 3 app work: clients table, knowledge base, opportunity monitoring

### Beyond Sprint 3

- Months 4–6: 2–3 retainers active, $15–25k MRR
- Months 6–9: 4–5 retainers, automation of repeatable delivery patterns
- Months 9–12: 5–7 retainers, $35–50k MRR
- Months 12–15: at or past $50k MRR, decide on subcontractor hire vs. self-serve product launch

---

## Open Questions

These need decisions before they block execution. Assigned to the sprint where they actually matter.

### Sprint 0

- **Which public RFP for the sample packet?** Want enough complexity to look impressive, simple enough to write the surrounding artifacts in 2 days. Candidates: an active GSA Schedule task order, a recent VA IT services solicitation, a state contract. **Decision needed by May 7.**
- **Excel format spec — Shipley standard, GovDash-style, or custom?** Shipley is the proposal-industry default. Use that and brand it lightly with our footer. **Decision needed by May 7.**
- **Does the sample packet name a specific (fictional) client, or is it abstracted?** Fictional client tells a more concrete story; abstracted is faster. Recommend fictional small SDVOSB. **Decision needed by May 10.**
- **What's the LLC name?** Affects domain (currently `omnibid.com`?), email addresses, contracts. Default: "OmniBid LLC" if available; fallback: founder name. **Decision needed by May 6.**

### Sprint 1

- **Audit credit math — flat $2,500 vs percentage of month 1?** $2,500 credit on $5k Tier 1 = 50% off month one (generous, fine). $2,500 credit on $10k Tier 2 = 25% off (less compelling). Consider tiering: full credit toward Tier 1, half credit toward Tier 2. **Decision needed by May 22.**
- **Do we keep the Clerk auth model, or move to magic-link only?** No clients log in. Operator-only auth could be simpler. Recommend keeping Clerk for now (already integrated, low cost). **Decision needed by May 22.**
- **First named outreach target — who?** Pull from veteran network and APEX referrals before generic cold email. One named warm target beats 50 cold ones. **Decision needed by May 25.**

### Sprint 2

- **Refund policy on the audit?** "Refund if the deliverable doesn't give you a clearer bid/no-bid decision and a reusable proposal checklist" is the soft guarantee proposed in `business.md`. Need exact language for the SOW. **Decision needed by June 5.**
- **Delivery format preference — email PDFs, shared Google Drive, or our app?** Cleanest for the client is probably a shared Drive folder per engagement. **Decision needed by first audit close.**

### Sprint 3+

- **Subcontractor sourcing — when, who, and on what basis?** Bandwidth caps at ~$50–60k MRR solo. Decision becomes urgent at 3 active retainers (~month 7).
- **Pricing for revisions and add-ons during the audit?** Default: one revision included, additional billed at $200/hr.
- **What does retainer offboarding look like?** Client owns their knowledge base export; we delete remaining data 30 days post-termination. Codify in MSA.
- **Do we ever publish OmniBid as a public product?** Year-2 question. Re-evaluate at month 12 with real-customer data.

---

## Risks That Could Kill This

In rough order of likelihood:

1. **Outreach doesn't convert.** 200 sends → 0 paid audits would mean ICP, asset, or channel is wrong. Mitigation: day-90 decision point in `business.md`. If 0 paid audits at day 90, revisit before continuing.
2. **Audit delivery quality is below expectations.** First-time proposal services delivery, no GovCon writing experience. Mitigation: 1–3 free pilots before charging, plus reading FAR Part 15 + 10 published winning proposals.
3. **Liability event.** Missed requirement disqualifies a client's bid. Mitigation: confidence flagging shipped before first paid delivery, E&O insurance bound, decision-support disclaimer in MSA.
4. **Solo bandwidth crush at 3 retainers.** Mitigation: don't sign client #4 until subcontractor sourced or delivery patterns are encoded enough to scale.
5. **A funded competitor matches our offer.** GovDash or Procurement Sciences could spin up a similar service tier. Mitigation: be small, be specific, be local. The funded players don't want $5–10k retainer accounts; their unit economics are wrong for it.

---

## Bottom Line

The MVP is feature-complete enough to deliver paid work; the gaps are exports, confidence scoring, legal/operational setup, and outreach assets. Sprint 0 ships the sample packet and starts LLC paperwork. Sprint 1 sets up outreach infrastructure. Sprint 2 closes the first paid audits. Sprint 3 converts the first retainer.

Day 90 has 1 active retainer = on track. Day 365 has 5+ retainers = $50k MRR target reached. Everything else is execution.
