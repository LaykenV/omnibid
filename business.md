# OmniBid: Business Overview

## What We're Building

OmniBid is an AI-native proposal operations platform for government contractors. We turn 200-page federal RFPs into structured, actionable compliance matrices in minutes instead of weeks — and eventually generate complete proposal drafts mapped to every evaluation criterion.

The product starts as a cheap, self-serve tool (compliance matrix parser at $99) and expands up a value ladder through bid intelligence, proposal generation, and real-time team collaboration.

---

## The Problem

### Government Contracting is a $700B Market With a Broken Front Door

The U.S. federal government spends over $700 billion annually on private sector contracts. To win one, a company must respond to a Request for Proposal (RFP) — a 100-400 page document specifying exactly what the government wants, how proposals will be evaluated, and dozens of formatting and compliance rules.

The proposal process is punishingly manual:

**A single $5M contract bid costs $20,000-$80,000 and takes 3-6 weeks.**

Here's where that time and money goes:

| Step | What Happens | Time | Cost |
|------|-------------|------|------|
| RFP Analysis | 3-5 people read 200+ pages, extract every requirement | 8-15 hours | $2,000-$5,000 |
| Compliance Matrix | Proposal manager identifies every "shall," "must," and "will" statement, maps to spreadsheet | 15-30 hours | $6,000-$20,000 |
| First Draft | 4-8 subject matter experts write their sections independently | 100-200 hours | $10,000-$40,000 |
| Review Cycles | Senior reviewers score draft against evaluation criteria, flag gaps | 40-80 hours | $5,000-$20,000 |
| Production | Format, cross-reference, assemble PDFs, submit through portals | 10-20 hours | $1,000-$3,000 |
| **Total** | | **200-500+ hours** | **$19,000-$105,000+** |

The compliance matrix alone — the spreadsheet tracking every single requirement and whether the proposal addresses it — takes 15-30 hours to build by hand. A single missed requirement can disqualify the entire proposal.

### Who Suffers Most

**Small businesses** are locked out entirely. Over 400,000 entities are registered in SAM.gov, but most cannot afford $15,000-$80,000 per bid. The government has set-aside programs (8(a), SDVOSB, WOSB, HUBZone) designed to direct contracts to small businesses, but the proposal barrier means they can't compete even when the playing field is tilted in their favor.

**Mid-market firms** ($10M-$100M revenue) are capacity-constrained. A proposal team of 5-8 people can produce 15-25 proposals per year. Every proposal they don't bid on is potential revenue left on the table.

**The government itself** suffers. 40% of federal solicitations receive fewer than 3 qualified bids. The barrier isn't capability — it's that the proposal process is too expensive and complex for most companies to even try.

### Win Rates Tell the Story

- Average government non-sole-source win rate: ~30%
- New business (non-incumbent) win rate: 15-25%
- Incumbent re-compete win rate: 50-60%
- Average bids per solicitation: only 4.5
- Industry-standard proposal investment: 3-6% of contract value

At a 30% win rate, a company must bid on 3-4 contracts to win one. At $20,000-$80,000 per bid, that's $60,000-$320,000 in proposal costs to land a single contract. For small businesses, this is not viable.

---

## The Competitive Landscape

### The Established Players

The GovCon AI tools market is real and growing. These companies have traction:

- **GovDash** — Raised $30M. End-to-end platform (capture → proposal → contract management). FedRAMP posture. Their customers won $5B in contracts in 2025. Enterprise-first: long sales cycles, $50K+/year.
- **Sweetspot** — AI-powered discovery + capture + proposal. Claims 20% bid success increase. Strong on opportunity matching. Users report it as a competitive advantage.
- **Procurement Sciences (Awarded AI)** — Built by veterans. FedRAMP authorized. Claims billions in AI-assisted awards. Most mature on actual win outcomes.
- **Deltek GovWin IQ** — The 800-pound gorilla. Massive market intelligence database. The incumbent everyone already uses for opportunity discovery. Adding AI proposal via "Dela" AI.
- **Unanet ProposalAI** — Claims 70% faster drafts. Multi-LLM approach. Targets SMB contractors.
- **DeepRFP** — Modular AI agents. Instant free trial. Less GovCon-specific.

### Where We Fit

These are enterprise-first platforms solving the full proposal lifecycle for companies that can justify $50K+/year in tooling. They're not getting it wrong — they're building for a different buyer.

**The gap is the long tail.** There are 400,000+ SAM.gov-registered entities. Maybe 5,000-10,000 of them can afford enterprise proposal software. The rest — the 8(a) small businesses, the SDVOSBs, the solo consultants, the firms doing 3-10 bids per year — have no tool at all. They're still building compliance matrices by hand in Excel.

We start where they don't: **self-serve, pay-per-use, no demo required, no annual commitment.** A $99 compliance matrix is an impulse buy for someone staring down 30 hours of manual work. That's our wedge into a market the enterprise players aren't serving.

### Where We're Going

Our technical foundation (Convex real-time database) is chosen specifically to enable capabilities the current market doesn't offer:

- **Real-time multiplayer editing** — the whole team and AI agents working in the same document simultaneously, like Figma for proposals
- **Continuous compliance validation** — the system watches in real-time as humans edit and warns them the moment they break compliance
- **Interactive deliverables** — Gantt charts, org charts, and cost models as live React components instead of static Word docs

These are Phase 3 ambitions, not current features. But the architecture is being built to support them from day one.

---

## Our Solution: The Value Ladder

### Phase 1: The Compliance Matrix (The Wedge) — $99-$149/RFP

Paste a SAM.gov link or upload an RFP PDF. In minutes, get:

- Structured summary of the opportunity (agency, NAICS, set-asides, deadlines, estimated value)
- Every requirement extracted and categorized: mandatory, evaluation factor, formatting, deliverable, certification, personnel
- Each requirement traced to its exact RFP reference (Section, page)
- Interactive compliance checklist — a live dashboard, not a spreadsheet
- Export to CSV for existing workflows

**Replaces 15-30 hours of manual work with 10 minutes of automated parsing.**

At $99-$149, this is an impulse buy. A proposal manager billing at $150/hour saves 15+ hours — the ROI is 15-20x even at the low end. No demo needed, no procurement approval, no annual contract. Credit card and go.

**This is the PLG funnel.** Get thousands of users hooked on the matrix tool, then move them up the ladder.

### Phase 1.5: Bid Intelligence Package — $299-$499/RFP

Everything in Phase 1, plus:

- **Go/No-Go Score** — AI-powered bid decision analysis: Do we meet mandatory requirements? How strong is the incumbent? What's the competitive landscape for this NAICS code? Recommendation with confidence level.
- **Proposal Outline** — Section-by-section structure mapped to evaluation criteria, with page allocation recommendations based on evaluation weights.
- **Team-Ready Deliverables** — Responsibility matrix (who writes what), kickoff meeting agenda, and a timeline working back from the due date.

This bridges the gap between "I have a matrix" and "I'm ready to start writing." A $299-$499 package that replaces the first 2-3 days of a proposal manager's work. Still self-serve, still an easy purchase decision for any company pursuing a $500K+ contract.

### Phase 2: Full Proposal Draft Generation — $3,000-$5,000/proposal

Upload company past proposals, resumes, capability statements, and past performance into a knowledge base. Then:

- AI agents draft each proposal volume (Technical, Management, Past Performance, Cost/Price)
- Every paragraph maps to specific evaluation criteria from Section M
- System pulls relevant evidence from knowledge base (contract numbers, dollar values, qualifications)
- Sections appear in a collaborative real-time editor
- "Red Team AI" continuously scores against the government's evaluation rubric

**Replaces $15,000-$80,000 in consultant fees.**

### Phase 3: The Multiplayer War Room — $5-50K/month SaaS

- Real-time collaborative editing powered by operational transform
- Continuous compliance engine: edits trigger instant re-validation
- Live "Win Score" the whole team can optimize against
- Team management, enterprise SSO, role-based access

---

## Business Model

### Pricing

| Tier | Target | Price | Value |
|------|--------|-------|-------|
| **Tier 0: Matrix** | Everyone — consultants, small businesses, anyone evaluating an RFP | $99-$149/RFP | Replaces 15-30 hours of manual work. 15-20x ROI. |
| **Tier 0.5: Bid Intel** | Companies deciding whether to bid | $299-$499/RFP | Go/no-go score, outline, team deliverables. Replaces first 2-3 days. |
| **Tier 1: Proposal** | Small businesses, 1-5 bids/year | $3,000-$5,000/proposal | Full draft generation. Replaces $15-30K in consulting. |
| **Tier 2: Pro SaaS** | Mid-market, 10-30 bids/year | $5-10K/month | Unlimited proposals, knowledge base, team collaboration. |
| **Tier 3: Enterprise** | Large primes, $100M+ revenue | $25-50K+/month | 5 people produce output of 20. SSO, SCIM, GovCloud. |

### Unit Economics

Marginal cost per matrix/proposal: ~$0.25-$1.00 (Gemini 3 Flash processes PDFs natively — no separate parsing service needed, and native text in PDFs is extracted for free).

| Component | Cost |
|-----------|------|
| Gemini 3 Flash (extraction + validation) | $0.20-$0.50 per RFP |
| SAM.gov API | Free |
| Convex compute/storage | $0.05-$0.50 |
| **Total marginal cost per RFP** | **~$0.25-$1.00** |

At $99/matrix: **99% gross margin.** At $3,000/proposal: margins are effectively 100%.

Monthly infrastructure at MVP: ~$100-$200/month (Convex, Vercel, domain).

### Revenue Projections

**Year 1: The Wedge + Value Ladder**

Focus: Launch matrix tool (Tier 0), add Bid Intel (Tier 0.5) by month 3, begin Tier 1 by month 6.

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Tier 0 matrices sold | 1,000 | 3,000 | 6,000 |
| Tier 0 avg price | $99 | $119 | $129 |
| Tier 0.5 bid intel packages | 150 | 500 | 1,200 |
| Tier 0.5 avg price | $349 | $399 | $449 |
| Tier 1 full proposals | 10 | 30 | 75 |
| Tier 1 avg price | $3,500 | $4,000 | $4,500 |
| **Year 1 Revenue** | **$187K** | **$677K** | **$1.65M** |

The moderate case puts us at ~$680K year 1. This is lower than the old projections ($2.4M) because Tier 0 is priced as a wedge, not a profit center. The money is in conversion: a user who pays $99 for a matrix, then $399 for bid intel, then $4,000 for a full proposal on their next bid represents $4,500+ in LTV from a $99 entry point.

**Key conversion assumption:** 15-20% of Tier 0 users convert to Tier 0.5 within their first 3 proposals. 5-10% of Tier 0.5 users convert to Tier 1.

**Year 2: SaaS Conversion**

Focus: Convert repeat Tier 1 users to Tier 2 Pro subscriptions. Launch multiplayer, knowledge base.

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Tier 0 + 0.5 (self-serve) | $300K | $900K | $2.0M |
| Tier 1 (per-proposal) | $200K | $600K | $1.5M |
| Tier 2 Pro SaaS (new) | 15 customers × $84K | 40 × $96K | 80 × $108K |
| **Year 2 Revenue** | **$1.8M** | **$5.3M** | **$12.1M** |

**Year 3: Enterprise + Expansion**

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Self-serve + per-proposal | $800K | $2.0M | $5.0M |
| Tier 2 Pro SaaS | 40 × $96K | 100 × $108K | 200 × $120K |
| Tier 3 Enterprise (new) | 3 × $400K | 10 × $500K | 25 × $600K |
| **Year 3 Revenue** | **$5.8M** | **$18.6M** | **$44.0M** |

### The Value Creation Math

For a mid-market firm doing 20 proposals/year:

| | Traditional | With OmniBid |
|---|---|---|
| Annual proposal cost | $400K-$1.6M | $96K-$120K/year |
| Proposals per year | 15-25 | 40-80 |
| Win rate | 30% | 35-45% |
| Contract revenue won | $22.5M-$37.5M | $60M-$100M |

We're not saving money on proposals — we're making companies tens of millions in new contract revenue.

---

## Go-To-Market

### Phase 1: The Trojan Horse (Months 1-6)

The $99 compliance matrix is the wedge. Every person who bids on a government contract needs one. At this price point, there's zero friction — no demo, no procurement, no approval needed.

- **LinkedIn** — GovCon professionals are extremely active. Content marketing + targeted ads. "Parse any RFP in 10 minutes for $99" is an irresistible ad.
- **APEX Accelerators** — 90+ government-funded centers helping small businesses into GovCon. They'd recommend our tool to every client. Free tier or partnership pricing for their cohorts.
- **Conferences** — AFCEA, GovConWire, National 8(a), NVSBE. Live demos are devastating: parse an RFP on stage in real-time.
- **Content marketing** — Definitive guides to compliance matrix creation, Section L/M analysis. This audience searches these topics constantly.
- **Product-led growth** — Every matrix includes a "Generated by OmniBid" footer in the CSV export. Every user who shares their matrix with a team becomes a referral channel.

### Phase 2: Consultant Partnerships (Months 3-9)

Solo consultants handle 4-6 clients/year. With OmniBid, 15-25 clients/year. We 3-5x their revenue, not replace them.

White-label option at $2-3K/month. Referral program at 20% first-year revenue.

### Phase 3: Enterprise Sales (Months 6-18)

With case studies and win-rate data: *"Your team of 8 costs $1.2M/year and produces 20 proposals. With OmniBid, 50 proposals. 15 wins instead of 6. $45M more revenue. We cost $120K/year."* 375:1 ROI.

---

## The Moat

AI models will commoditize. Workflow and data will not.

**Win-Rate Flywheel:** We track which responses actually won contracts. Over time, we learn that DoD prefers specific architectural diagrams while DoE prefers specific pricing tables. No competitor can replicate years of closed-loop win/loss data.

**The value ladder locks in users.** A user who starts with a $99 matrix, builds their company knowledge base in Tier 1, and has their team collaborating in Tier 2 has switching costs that grow with every proposal they run through the platform.

**PLG distribution advantage.** Enterprise competitors need $25K+ in sales costs per customer. Our $99 entry point means customers acquire themselves. By the time they need enterprise features, they're already using us.

---

## Risks

1. **Incumbents are well-funded.** GovDash raised $30M. Their customers have won $5B in contracts. But they're serving a different market segment — we're not competing for the same buyers at launch.
2. **Security requirements gate enterprise.** CMMC/FedRAMP expensive ($250-500K) and slow (6-12 months). Tier 0/1 don't need it; Tier 3 will.
3. **Proposal tone is specific.** LLMs write marketing-style. Government evaluators want dry, precise, evidence-heavy. Requires careful prompt engineering.
4. **Data moat takes time.** Win-rate flywheel compounds in year 2-3.
5. **Political/budget risk.** Spending shifts with administrations, but private sector services aren't going away.
6. **$99 pricing requires volume.** The wedge product is cheap by design. Revenue depends on conversion up the value ladder, not Tier 0 alone.

None fatal. Manageable with right sequencing.

---

## The Outcome

**Bootstrapped:** Solo founder earning $100-200K year 1 from the wedge + early Tier 1. $2-5M ARR at 90%+ margins by year 2-3 = $1-3M/year personal income.

**Venture:** Seed round at $500K-$1M ARR, $5-10M ARR year 2, $20M+ ARR year 3-4. At 10x ARR multiple = $200M+ exit. Likely acquirers: Deltek, Palantir, Salesforce Public Sector.

**Bottom line:** Start for <$300/month. 99%+ gross margins on the wedge product. $700B+ market where 40% of solicitations lack 3 bids. Price the matrix at $99 to make it an impulse buy. Convert up the value ladder. Build the compliance matrix parser first. Charge immediately. Everything else follows.
