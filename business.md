# OmniBid: The Complete Business Deep-Dive

## How Government Contracting Actually Works Today (The Painful Truth)

### The Lifecycle of a Single Federal Proposal

Here's what actually happens when a mid-market IT services company decides to bid on a $5M federal contract. This is the flow you're disrupting:

**Week 0: Opportunity Discovery (Ongoing)**
A business development person monitors SAM.gov, GovWin IQ, agency forecast sites, and industry contacts. They spot a solicitation that looks like a fit. This alone requires either a dedicated BD person ($80-150k/year salary) or expensive tools like Deltek GovWin IQ ($15-30k/year subscription).

**Week 0-1: Bid/No-Bid Decision**
The BD lead downloads the RFP — often a 100-400 page PDF with 15+ attachments across multiple zip files hosted on inconsistent portals. A team of 3-5 people spends 8-15 hours reading it. They hold a formal bid/no-bid meeting. Key questions: Do we meet the mandatory requirements? Do we have relevant past performance? Is the incumbent beatable? Can we price competitively? About 60% of opportunities are no-bid at this stage. The ones that proceed represent a significant investment commitment.

**Week 1-2: Compliance Matrix & Outline**
A proposal manager (either in-house or a $100-200/hour consultant) manually reads every page of Section L (Instructions) and Section M (Evaluation Criteria). They extract every single "shall," "must," and "will" statement into a spreadsheet — the compliance matrix. This alone takes 15-30 hours for a complex RFP. A single missed requirement can result in disqualification. The matrix becomes the backbone of the entire proposal.

**Week 2-3: First Draft ("Pink Team")**
Subject matter experts write their assigned sections. The technical lead writes the Technical Approach. The project manager writes the Management Plan. The contracts person pulls together Past Performance narratives. HR assembles resumes and labor categories. The pricing analyst builds the cost volume in Excel. Each person spends 10-30 hours. A graphic designer creates org charts, WBS diagrams, Gantt charts, and system architecture diagrams — typically $2,000-5,000 in design costs. The proposal manager coordinates all of this, chasing people for inputs, resolving conflicts, maintaining formatting consistency.

**Week 3: Review Cycles ("Color Teams")**
The industry-standard Shipley methodology uses color-coded review stages:

- **Pink Team:** Review the outline and early draft. Is the story coherent? Are we addressing all evaluation criteria?
- **Red Team:** The critical review. Senior leaders and outside experts score the proposal using the government's own evaluation criteria. They write "evaluation notices" — essentially simulating the government's review. This often involves 4-8 reviewers spending 3-5 hours each.
- **Gold Team:** Executive review. Is this our best foot forward? Are the win themes compelling?
- **White Glove:** Final formatting check. Font sizes, page limits, header/footer compliance, cross-references, file naming conventions.

**Week 4: Production & Submission**
The final proposal is assembled — often 50-200 pages across 3-4 separate volumes (Technical, Management, Past Performance, Cost/Price). It's submitted through the agency's portal (SAM.gov, eBuy, agency-specific systems) or sometimes still as physical copies.

**Total elapsed time:** 3-6 weeks
**Total labor hours:** 200-500+ hours across the team
**Total cost (internal labor + consultants + design):** $15,000-$80,000+

---

## The Cost Structure: Where the Money Goes

### What Companies Spend Today

Based on industry data, here's the real cost breakdown for a typical mid-complexity federal proposal:

| Role | Hours | Rate | Cost |
|------|-------|------|------|
| Proposal Manager | 60-100 hrs | $100-200/hr | $6,000-$20,000 |
| Technical Writer(s) | 40-80 hrs | $75-150/hr | $3,000-$12,000 |
| Subject Matter Experts (2-4) | 20-40 hrs each | $100-250/hr (opportunity cost) | $4,000-$40,000 |
| Pricing/Cost Analyst | 20-40 hrs | $100-200/hr | $2,000-$8,000 |
| Graphic Designer | 15-30 hrs | $75-150/hr | $1,125-$4,500 |
| Review Team (4-8 people) | 4-8 hrs each | $150-300/hr (senior) | $2,400-$19,200 |
| Production/Admin | 10-20 hrs | $50-75/hr | $500-$1,500 |
| **Total** | **200-500+ hrs** | | **$19,000-$105,000+** |

For SMBs doing it scrappier (fewer consultants, less formal reviews), the minimum viable cost is still $5,000-$15,000 in time and direct expenses. For large primes bidding on $100M+ contracts, individual proposals can cost $250,000-$500,000+.

The critical insight: **companies currently invest 3-6% of the contract value on proposal development.** A $5M contract costs $150k-$300k to pursue. A $50M contract costs $1.5M-$3M.

### Win Rates Tell the Real Story

Industry data paints a clear picture:

- **Average RFP win rate across industries:** ~45%
- **Government-specific non-sole-source win rate:** ~30%
- **Incumbent re-compete win rate:** 50-60%
- **New business (non-incumbent) win rate:** 15-25%
- **Average bids per government solicitation:** only 4.5
- **Solicitations receiving fewer than 3 bids:** 40%

That last statistic is extraordinary. 40% of government solicitations don't even get 3 qualified bids. The government is *desperate* for more competition. The barrier isn't that companies can't do the work — it's that the proposal process is too expensive and too complex for most of them to even try.

---

## The Competitive Landscape: What Exists Today

The GovCon AI tools market is emerging but fragmented. Here's what you're up against:

### Current Players

**GovDash** — End-to-end platform. Capture → proposal → contract management. FedRAMP Moderate equivalent. Parses Section L/M, generates compliance matrices. Claims 50-60% faster proposals. Strong security posture. This is your most direct competitor.

**Sweetspot** — AI-powered discovery + capture + proposal. Unified platform. Claims 20% increase in bid success with <1% cost increase. Strong on opportunity discovery and matching. Users report it as a competitive advantage they don't want competitors to know about.

**Procurement Sciences (Awarded AI)** — Built by military veterans. Claims to have supported billions in AI-assisted awards. Testimonials include winning a $40M contract with only 10 days prep. FedRAMP authorized. Most mature in terms of actual win outcomes.

**Deltek (GovWin IQ + Proposal AI)** — The 800-pound gorilla of GovCon software. Massive market intelligence database. New AI proposal features. The incumbent that everyone already uses for opportunity discovery. Adding AI proposal generation via their "Dela" AI.

**Unanet ProposalAI** — Claims 70% faster drafts. Multi-LLM approach ("Champ"). Private cloud with FAR/DFAR training. Targets SMB contractors.

**DeepRFP** — More self-serve, modular. Individual AI agents for different tasks (reviewer, writer, compliance checker). Instant free trial. Less GovCon-specific.

**AutogenAI** — Enterprise-focused narrative generation. High price point. Strong on content generation but criticized for clunky interface and limited governance.

### What They All Get Wrong (Your Opening)

Every single one of these tools treats AI as a layer on top of existing workflows. They help you write *faster*, but they don't fundamentally change the *architecture* of how a proposal is built. Specifically:

1. **None of them are real-time multiplayer.** They generate a draft and hand it to you. There's no Figma-for-proposals experience where the whole team is in the document simultaneously while AI agents work alongside them. This is your Convex advantage.

2. **None of them have continuous compliance validation.** They generate a compliance matrix upfront and check it at the end. Nobody is watching in real-time as humans edit and warning them *the moment* they break compliance. This is your killer feature.

3. **None of them generate interactive deliverables.** They produce Word docs and PDFs. You're producing a structured workspace where Gantt charts are interactive React components, org charts are draggable, and cost models are live calculators. This is a fundamentally different product experience.

4. **Most of them are enterprise-first.** Long sales cycles, demo-required, $50k+ annual commitments. There's a massive underserved market of 8(a) small businesses, SDVOSBs, and sole proprietors who bid on 3-10 proposals per year and can't justify $50k in tooling. Your pay-per-proposal model ($3-5k) serves them perfectly.

---

## OmniBid's Pricing Model & Revenue Projections

### Pricing Tiers

**Tier 1: Starter (Pay-Per-Proposal)**
- **Target:** 8(a) businesses, SDVOSBs, sole proprietors, companies doing 1-5 bids/year
- **Price:** $3,000-$5,000 per proposal package
- **Includes:** Compliance matrix, first draft of all volumes, generated graphics, basic cost model template
- **Value proposition:** Replaces $15,000-$30,000 in consultant fees. 5-10x ROI even if they only win 1 in 5.

**Tier 2: Pro (Monthly SaaS)**
- **Target:** Mid-market contractors ($10M-$100M revenue), 10-30 bids/year
- **Price:** $5,000-$10,000/month (billed annually)
- **Includes:** Unlimited proposals, company knowledge base, multiplayer collaboration (up to 10 seats), continuous compliance engine, bid/no-bid analyzer, past performance library, win/loss tracking
- **Value proposition:** A dedicated proposal team costs $300k-$500k/year in salaries. This replaces or augments 2-3 full-time proposal professionals.

**Tier 3: Enterprise**
- **Target:** Large primes and major integrators ($100M+ revenue)
- **Price:** $25,000-$50,000+/month
- **Includes:** Everything in Pro, unlimited seats, custom compliance rulesets, API access, SSO/SAML, dedicated customer success, GovCloud deployment option, CMMC-ready infrastructure
- **Value proposition:** Enables a proposal volume team of 5 to produce the output of a team of 20.

**Tier 0: The Wedge Product (Compliance Matrix Only)**
- **Target:** Everyone. GovCon consultants, small businesses, even large primes who want to evaluate an opportunity quickly.
- **Price:** $500-$1,000 per RFP
- **Includes:** Paste a SAM.gov link → get a perfect, structured compliance matrix in minutes instead of 3 days
- **Purpose:** This is your PLG (product-led growth) funnel. Get thousands of users hooked on the compliance matrix tool, then upsell them to full proposal generation.

### Revenue Projections

**Assumptions for Year 1-3 modeling:**
- 400,000+ entities registered in SAM.gov
- ~58,000 small businesses won contract awards in recent years
- Average government solicitation receives only 4.5 bids (massive unmet demand for more bidders)
- $178B+ awarded to small businesses annually

**Year 1: The Wedge**

Focus: Launch the compliance matrix tool (Tier 0) and the per-proposal generator (Tier 1).

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Tier 0 customers (matrix only) | 200 | 500 | 1,000 |
| Tier 0 avg revenue/customer | $2,000 | $2,500 | $3,000 |
| Tier 1 customers (full proposals) | 30 | 75 | 150 |
| Tier 1 avg revenue/customer | $12,000 | $15,000 | $20,000 |
| **Total ARR** | **$760k** | **$2.4M** | **$6.0M** |

**Year 2: SaaS Conversion**

Focus: Convert Tier 0/1 users to Tier 2 Pro subscriptions. Launch multiplayer, knowledge base, and continuous compliance.

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Tier 0 customers | 500 | 1,200 | 2,500 |
| Tier 1 customers | 80 | 200 | 400 |
| Tier 2 customers (Pro SaaS) | 20 | 60 | 120 |
| Tier 2 avg annual contract | $84k | $96k | $108k |
| **Total ARR** | **$3.6M** | **$10.8M** | **$22.6M** |

**Year 3: Enterprise + Expansion**

Focus: Land enterprise accounts. Expand into SLED (State/Local/Education). Launch post-award features.

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| Tier 0 customers | 1,000 | 2,500 | 5,000 |
| Tier 1 customers | 150 | 400 | 800 |
| Tier 2 customers | 60 | 150 | 300 |
| Tier 3 customers (Enterprise) | 5 | 15 | 30 |
| Tier 3 avg annual contract | $400k | $500k | $600k |
| **Total ARR** | **$10.2M** | **$28.5M** | **$62.0M** |

### Unit Economics

**Cost to serve per proposal (your COGS):**

| Component | Cost |
|-----------|------|
| LLM API calls (parsing, generation, review) | $15-$50 per proposal |
| Firecrawl/parsing API calls | $2-$10 |
| Convex compute/storage | $0.50-$2 |
| Vercel edge function compute | $1-$5 |
| **Total marginal cost per proposal** | **~$20-$70** |

At a $3,000 minimum price point per proposal, your **gross margin is 97%+**. This is extremely attractive SaaS economics. Even at scale with enterprise infrastructure, hosting, and support costs, you should maintain 80-90% gross margins.

**Customer Acquisition Cost (CAC) targets:**
- Tier 0/1 (self-serve): Target $200-$500 CAC via content marketing, GovCon conferences, and partner referrals
- Tier 2 (sales-assisted): Target $5,000-$15,000 CAC via inside sales
- Tier 3 (enterprise): Target $25,000-$50,000 CAC via field sales

**LTV:CAC ratios:**
- Tier 1 customer doing 4 proposals/year for 3 years = $36,000-$60,000 LTV → LTV:CAC of 72-120x
- Tier 2 customer at $8k/month for 3 years = $288,000 LTV → LTV:CAC of 19-57x
- Tier 3 customer at $35k/month for 4 years = $1,680,000 LTV → LTV:CAC of 33-67x

These are exceptional ratios. Anything above 3x is considered healthy for SaaS. You're looking at 20-100x.

---

## How OmniBid Changes Each Step of the Flow

Here's a side-by-side of the current workflow vs. OmniBid:

### Step 1: Opportunity Discovery & Bid/No-Bid

**Today:** BD person manually scans SAM.gov. Downloads the RFP. Spends 8-15 hours reading it. Holds a meeting. Makes a gut decision.

**OmniBid:** Paste the SAM.gov link. In 5 minutes, get:
- A structured summary of the opportunity (value, agency, period of performance, set-asides, NAICS)
- Automatic extraction of mandatory requirements vs. desired requirements
- A "Fit Score" comparing the RFP requirements against your company's knowledge base (past performance, certifications, capabilities)
- A win probability estimate based on competition analysis (who's the incumbent? how many similar contracts have been awarded recently? what's the typical competitive set?)
- A cost-to-bid estimate (how complex is this proposal? how many hours would the traditional approach take?)

**Time saved:** 8-15 hours → 5 minutes. **Decision quality:** Dramatically improved with data-driven scoring.

### Step 2: Compliance Matrix

**Today:** A proposal manager manually reads 100-400 pages. Creates a spreadsheet with columns for requirement, RFP reference, proposal section, responsible party, and status. Takes 15-30 hours. Error-prone — humans miss things.

**OmniBid:** The parsing engine reads the full RFP and extracts every "shall," "must," "will," and mandatory requirement. It identifies Section L instructions (formatting, page limits, font requirements), Section M evaluation criteria (what the government cares about most), Section C/PWS requirements (what you actually have to do), and CDRLs (deliverables). All of this becomes a structured, interactive checklist in the UI — not a spreadsheet, but a live compliance dashboard that tracks completion as the proposal is written.

**Time saved:** 15-30 hours → 10 minutes. **Error reduction:** Near-zero missed requirements.

### Step 3: First Draft Generation

**Today:** 4-8 people spend 2-3 weeks writing their sections independently. The proposal manager spends half their time chasing inputs and resolving inconsistencies between sections.

**OmniBid:** Multiple specialized agents work simultaneously:
- The Technical Approach agent draws on the company knowledge base and the SOW/PWS to write a responsive technical narrative
- The Management Plan agent generates org charts, staffing plans, risk registers, and quality assurance approaches
- The Past Performance agent matches the most relevant prior contracts from the knowledge base and writes narratives that map to the evaluation criteria
- The Cost Volume agent generates labor category pricing, material estimates, ODC schedules, and fee calculations based on historical win data
- The Graphics agent generates Gantt charts, WBS diagrams, system architecture diagrams, and process flow charts as interactive React components

All sections are cross-referenced for consistency. Every paragraph traces back to a specific evaluation criterion in Section M.

**Time saved:** 200-400 person-hours → 30-60 minutes of generation + 10-20 hours of human refinement. **Quality:** Structurally superior because every section is algorithmically mapped to evaluation criteria.

### Step 4: Review & Refinement (The Multiplayer Magic)

**Today:** Print the proposal. Hand it to 4-8 reviewers. They mark it up with red pens or tracked changes over 2-3 days. The proposal manager collects all feedback, adjudicates conflicts, and implements changes. Another 2-3 days.

**OmniBid:** The entire team works in the same real-time workspace (powered by Convex). The continuous compliance engine watches every edit:
- A technical writer deletes a paragraph mentioning ISO 27001. The sidebar instantly flags: "Warning: ISO 27001 certification was a mandatory requirement per Section L, page 42. Removing this reference drops your compliance score from 98% to 91%."
- The pricing analyst changes a labor rate. The cost summary recalculates in real-time across all tabs, and the competitive pricing benchmark updates.
- A reviewer adds a comment suggesting a different win theme. The AI "Red Team" agent responds with a counter-analysis of how that theme scored in similar past proposals.

The "Red Team AI" continuously scores the proposal against the evaluation criteria, providing a live "Win Score" that the whole team can see and optimize against.

**Time saved:** 40-80 person-hours of review cycles → 4-8 hours of collaborative refinement. **Quality:** Real-time compliance prevents the #1 reason proposals get disqualified.

### Step 5: Production & Submission

**Today:** 10-20 hours of formatting, cross-referencing, PDF assembly, file naming, portal uploading. A "white glove" review checks font sizes, margins, and page counts.

**OmniBid:** One-click export to the exact format required by the RFP. The system already knows the page limits, font requirements, and file naming conventions because it extracted them from Section L. It flags any violations before export. It generates separate volumes in the required formats. It creates the compliance matrix cross-reference document automatically.

**Time saved:** 10-20 hours → 15 minutes.

---

## Total Value Creation

### For a single proposal on a $5M contract:

| | Traditional | OmniBid | Savings |
|---|---|---|---|
| **Time** | 3-6 weeks | 2-5 days | 80-90% |
| **Labor hours** | 200-500 | 20-50 | 90% |
| **Cost** | $20,000-$80,000 | $3,000-$5,000 | 85-94% |
| **Compliance risk** | High (human error) | Near-zero (continuous validation) | Transformative |

### For a mid-market firm doing 20 proposals/year:

| | Traditional | OmniBid | Savings |
|---|---|---|---|
| **Annual proposal cost** | $400k-$1.6M | $96k-$120k (Pro tier) | $300k-$1.5M |
| **Proposals possible per year** | 15-25 (team capacity limited) | 40-80 (AI-augmented) | 2-3x more bids |
| **Win rate impact** | 30% baseline | 35-45% (better compliance, better scoring) | 5-15 point improvement |
| **Revenue impact at 30% win rate** | $22.5M-$37.5M won | — | — |
| **Revenue impact at 40% win rate on 2x bids** | — | $60M-$100M won | $37.5M-$62.5M incremental |

The math is staggering. If you help a company bid on twice as many proposals *and* win at a higher rate, you're not saving them money on proposals — you're *making* them tens of millions in new revenue. That's why the pricing has so much room.

---

## Go-To-Market: How You Actually Get Customers

### Phase 1: The Trojan Horse (Months 1-6)

**The compliance matrix tool is your wedge product.** This is the single most valuable, most underserved, most universally needed artifact in the entire proposal process. Every single person who bids on a government contract needs a compliance matrix. Currently they build it by hand in Excel over 15-30 hours.

Launch the matrix parser at $500-$1,000 per RFP. Market it as: "Paste a SAM.gov link, get a perfect compliance matrix in 10 minutes."

**Channels:**
- LinkedIn content targeting GovCon professionals (BD managers, proposal managers, capture managers). This is an extremely active community on LinkedIn.
- APEX Accelerators (formerly PTACs) — there are 90+ of these government-funded counseling centers across the country that help small businesses get into government contracting. They would recommend your tool to every client.
- GovCon conferences: AFCEA, GovConWire, National 8(a) Association, NVSBE (National Veteran Small Business Engagement). Live demos are devastating — parse an RFP on stage in real-time.
- Content marketing: Write the definitive guides to compliance matrix creation, Section L/M analysis, and proposal management. Rank for these search terms. This audience googles these topics constantly.

### Phase 2: Consultant Partnerships (Months 3-9)

GovCon consultants are your force multiplier, not your enemy — if you position correctly.

A solo proposal consultant currently handles 4-6 clients per year because each proposal takes 3-6 weeks of their time. With OmniBid, that same consultant can handle 15-25 clients per year. You're not replacing them — you're 3-5x'ing their revenue.

**White-label OmniBid for consultants.** Let them brand it as their own tool. Charge them $2,000-$3,000/month for unlimited use, and they mark up the output to their clients. A consultant who was charging $30k per proposal and doing 5/year ($150k revenue) can now charge $15k per proposal and do 20/year ($300k revenue). Everyone wins.

**Referral program:** Give consultants 20% of first-year revenue for any client they bring directly to OmniBid. A consultant who refers a Tier 2 customer ($96k/year) earns $19.2k in referral fees.

### Phase 3: Direct Sales & Enterprise (Months 6-18)

Once you have case studies and win-rate data from Phase 1-2 customers, you have the ammunition for enterprise sales.

**The pitch to a $50M GovCon firm:** "Your proposal team of 8 people costs you $1.2M/year and produces 20 proposals. With OmniBid Pro, those same 8 people can produce 50 proposals. At your current 30% win rate, that's 15 wins instead of 6. At an average contract value of $5M, that's $45M more in potential revenue. We cost $120k/year."

That's a 375:1 ROI argument. It sells itself.

---

## Your Money: What You Personally Could Make

### As a Bootstrapped Solo Founder

If you build and launch the Tier 0 compliance matrix tool yourself with your proposed tech stack (TanStack Start or Next.js, Convex, Vercel), your costs are minimal:

**Fixed costs:**
- Vercel Pro: $20/month
- Convex: $0-$25/month at low scale
- LLM API costs: ~$15-50 per proposal generated
- Firecrawl: $20-$50/month
- Domain/email: $20/month

**Monthly burn: ~$150-$300/month.** This is a business you can start for essentially nothing.

**Scenario: 100 compliance matrices sold in first 6 months at $750 avg price**
- Revenue: $75,000
- COGS (API costs): ~$2,000
- Marketing costs: $5,000 (LinkedIn ads, conference attendance)
- **Net profit: ~$68,000 in your first 6 months**

**Scenario: Year 1 with 50 full proposals at $4,000 avg + 300 matrices at $750 avg**
- Proposal revenue: $200,000
- Matrix revenue: $225,000
- Total: $425,000
- COGS: ~$10,000
- Marketing/sales: $30,000
- **Net profit: ~$385,000 in year 1**

You could realistically pay yourself $200k-$300k in year 1 while reinvesting the rest in growth. As a solo founder with no employees and near-zero marginal costs, this is an extremely capital-efficient business.

### With a Small Team (2-3 people) Building Toward VC Scale

**Year 2 target: $5-10M ARR**
- Raise a seed round ($1-3M) to hire 2 engineers and 1 GovCon domain expert
- Salary costs: ~$500k-$700k/year
- Infrastructure at scale: ~$50k-$100k/year
- Sales/marketing: $200k-$400k/year
- At $5M ARR with 85% gross margins, you're generating $4.25M in gross profit
- After $1.2-1.5M in operating costs, you're looking at $2.75-$3M in operating income
- **Your equity in a $5M ARR SaaS company at a 10x ARR multiple is worth $50M on paper**

### The Exit / Long-Term Outcome

GovCon-specific SaaS companies have been acquired at significant multiples:

- Deltek (GovCon ERP) was acquired by Roper Technologies for $1.1B
- GovWin IQ is Deltek's crown jewel for market intelligence
- The proposal management space is fragmented and ripe for consolidation

A GovCon AI platform reaching $20-50M ARR would be an extremely attractive acquisition target for Deltek, Palantir, Salesforce (public sector), or any of the large defense primes looking to digitize their proposal operations. Acquisition multiples for high-growth vertical SaaS range from 8-15x ARR.

**$30M ARR × 10x multiple = $300M exit.**

That's the upside case. Even the "small" outcome — a bootstrapped business doing $2-5M ARR with 85% margins — means you're personally earning $1-3M/year from a business you own outright.

---

## The Honest Risks

1. **Incumbents are moving fast.** GovDash, Sweetspot, and Procurement Sciences already have customers and win-rate data. You need to move quickly and differentiate on the real-time collaboration angle.

2. **Security requirements may gate sales.** Defense contractors handling CUI need CMMC compliance. FedRAMP authorization is expensive ($250-500k) and time-consuming (6-12 months). Your Tier 0/1 customers (small businesses, non-defense) don't need this, but your Tier 3 enterprise customers will.

3. **Government proposal quality is nuanced.** The "tone" of government proposals is specific and learned. LLMs tend to write in a marketing-friendly way that government evaluators find fluffy. You'll need extensive prompt engineering and potentially fine-tuning to nail the dry, precise, evidence-heavy tone that scores well.

4. **The data moat takes time.** Your win-rate flywheel only works once you have enough proposals flowing through the system to start correlating approaches with outcomes. The first 6-12 months are about building the flywheel; the compounding effects come in year 2-3.

5. **Political/budget risk.** Government spending priorities shift with administrations. DOGE-style budget cutting efforts could temporarily reduce contract opportunities, though the fundamental need for private sector services isn't going away.

None of these risks are fatal. They're manageable with the right sequencing (start small, expand up-market) and the right technical choices (Convex gives you real-time collaboration that nobody else has).

---

## Bottom Line

You're looking at a business that:
- Can be started for <$500/month in infrastructure costs
- Has 97%+ gross margins on every proposal sold
- Addresses a $700B+ market where 40% of solicitations don't even get 3 bids
- Replaces $20-80k of consulting spend with a $3-5k product
- Has a clear path from $0 to $385k profit in year 1 as a solo founder
- Has a credible path to $30M+ ARR and a $300M+ exit within 5 years
- Gets stronger with every customer (win-rate data flywheel)
- Has a defensible technical moat (real-time compliance validation via Convex)

Build the compliance matrix parser first. Charge for it immediately. Everything else follows.