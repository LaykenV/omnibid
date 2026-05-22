import type { Doc, Id } from '../../../../convex/_generated/dataModel'

export type DemoCategory = Doc<'requirements'>['category']
export type DemoStatus = Doc<'requirements'>['status']

export type DemoRequirement = Pick<
  Doc<'requirements'>,
  'category' | 'text' | 'rfpReference' | 'rfpSection' | 'volume' | 'evaluationWeight' | 'status' | 'sortOrder'
> & {
  _id: Id<'requirements'> | `demo-${number}`
}

export type DemoProposal = Pick<
  Doc<'proposals'>,
  'title' | 'inputValue' | 'solicitation' | 'requirementCount'
>

// Picked for the first Loom because it is a public Library of Congress solicitation,
// has a completed matrix_ready parse in Convex, includes clean section/page citations,
// and contains no CUI or private client material.
export const DEMO_INPUT_VALUE =
  '030ADV26R0008'

export const DEMO_PROPOSAL_ID =
  'j5799m5xtp953bmpd9ny43h1nd825zvj' as Id<'proposals'>

export const demoProposal: DemoProposal = {
  title: 'RFP Response Agent Demo',
  inputValue: DEMO_INPUT_VALUE,
  requirementCount: 19,
  solicitation: {
    solicitationNumber: '030ADV26R0008',
    title: 'IT Operational Support Services IDIQ',
    agency: 'Library of Congress',
    responseDeadline: '12-30-2025 12:00 PM EST',
    naicsCode: 'Not explicitly stated on SF1449',
    contractType: 'Indefinite Delivery/Indefinite Quantity (IDIQ)',
    setAsideDescription: 'Unrestricted',
    estimatedValue: '$150,000,000.00',
    placeOfPerformance: 'Remote and Library of Congress Capitol Hill Campus',
    uiLink: DEMO_INPUT_VALUE,
  },
}

export const categoryOrder: DemoCategory[] = [
  'mandatory',
  'evaluation_factor',
  'personnel',
  'deliverable',
  'formatting',
  'certification',
  'other',
]

export const categoryLabels: Record<DemoCategory, string> = {
  mandatory: 'Mandatory',
  evaluation_factor: 'Evaluation',
  personnel: 'Personnel',
  deliverable: 'Deliverables',
  formatting: 'Format',
  certification: 'Certifications',
  other: 'Other',
}

export const reviewLabels: Record<DemoStatus, string> = {
  not_started: 'Needs review',
  addressed: 'Approved',
  partially_addressed: 'Partial',
  not_applicable: 'Not applicable',
}

export const demoRequirements: DemoRequirement[] = [
  {
    _id: 'demo-1',
    sortOrder: 1,
    category: 'evaluation_factor',
    text: 'Factor 1: Corporate Experience and Factor 2: Technical Approach are of equal importance. Both are more important than Past Performance. All non-price factors, when combined are significantly more important than Price.',
    rfpReference: 'Section M.1.2, Page 65',
    rfpSection: 'Section M',
    status: 'not_started',
  },
  {
    _id: 'demo-2',
    sortOrder: 2,
    category: 'evaluation_factor',
    text: 'Phase 1 - Factor 1: Corporate Experience; Phase 2 - Factor 2: Technical Approach (IDIQ), Factor 3: Past Performance, and Factor 4: Price (IDIQ).',
    rfpReference: 'Section M.1.2, Page 65',
    rfpSection: 'Section M',
    status: 'not_started',
  },
  {
    _id: 'demo-3',
    sortOrder: 3,
    category: 'evaluation_factor',
    text: 'Volume I shall not exceed 2 pages in length per project and 2 pages in length for the narrative response. Offerors shall submit descriptions of three complete and/or ongoing projects performed in the past five years.',
    rfpReference: 'Section L.2.6(b), Page 61-62',
    rfpSection: 'Section L',
    volume: 'Volume I',
    status: 'not_started',
  },
  {
    _id: 'demo-4',
    sortOrder: 4,
    category: 'evaluation_factor',
    text: 'Volume II shall not exceed 20 pages in length. Offerors shall submit a narrative that describes their approach to fulfill the requirements in Section C and provide an organizational chart.',
    rfpReference: 'Section L.2.6(b), Page 62',
    rfpSection: 'Section L',
    volume: 'Volume II',
    status: 'not_started',
  },
  {
    _id: 'demo-5',
    sortOrder: 5,
    category: 'evaluation_factor',
    text: 'Volume V shall not exceed 20 pages. Offerors shall submit a narrative that describes their approach to fulfill the requirements in the task order provided in Attachment J4.',
    rfpReference: 'Section L.2.6(b), Page 63',
    rfpSection: 'Section L',
    volume: 'Volume V',
    status: 'not_started',
  },
  {
    _id: 'demo-6',
    sortOrder: 6,
    category: 'evaluation_factor',
    text: 'Offerors shall complete and return a copy of Attachment J1 - IT Operational IDIQ Labor Categories and Pricing as a part of their price proposal.',
    rfpReference: 'Section L.2.6(b), Page 63',
    rfpSection: 'Section L',
    volume: 'Volume IV',
    status: 'not_started',
  },
  {
    _id: 'demo-7',
    sortOrder: 7,
    category: 'evaluation_factor',
    text: 'Offerors shall complete tab 2 of Attachment J5 - Initial Order Pricing Sheet for the initial task order.',
    rfpReference: 'Section L.2.6(b), Page 64',
    rfpSection: 'Section L',
    volume: 'Volume VI',
    status: 'not_started',
  },
  {
    _id: 'demo-8',
    sortOrder: 8,
    category: 'mandatory',
    text: 'The total minimum amount of this IDIQ contract is: $10,000.00 per contract.',
    rfpReference: 'Section B.3, Page 5',
    rfpSection: 'Section B',
    status: 'not_started',
  },
  {
    _id: 'demo-9',
    sortOrder: 9,
    category: 'mandatory',
    text: 'The contractor shall provide program management of this contract and all task orders issued hereunder including Quality control, Project planning, and detailed invoicing.',
    rfpReference: 'Section C, 4.1, Page 10',
    rfpSection: 'Section C',
    status: 'not_started',
  },
  {
    _id: 'demo-10',
    sortOrder: 10,
    category: 'mandatory',
    text: 'The Contractor shall ensure that all contractor employees who will need regular, unescorted access to Library facilities obtain Library-issued photo identification badges.',
    rfpReference: 'Section G.2(a), Page 16',
    rfpSection: 'Section G',
    status: 'not_started',
  },
  {
    _id: 'demo-11',
    sortOrder: 11,
    category: 'mandatory',
    text: 'The Contractor must prepare and submit invoices electronically to: https://www.ipp.gov.',
    rfpReference: 'Section G.3, Page 17',
    rfpSection: 'Section G',
    status: 'not_started',
  },
  {
    _id: 'demo-12',
    sortOrder: 12,
    category: 'mandatory',
    text: 'All ICT supplies, information, documentation, and services developed, acquired, maintained or delivered under this contract or order must comply with the Americans with Disabilities Act (ADA) and Section 508.',
    rfpReference: 'Section H.14(a), Page 27',
    rfpSection: 'Section H',
    status: 'not_started',
  },
  {
    _id: 'demo-13',
    sortOrder: 13,
    category: 'mandatory',
    text: 'The contractor shall not use generative AI to create or produce any deliverables under this contract without specific written authorization.',
    rfpReference: 'Section H.16, Page 27',
    rfpSection: 'Section H',
    status: 'not_started',
  },
  {
    _id: 'demo-14',
    sortOrder: 14,
    category: 'personnel',
    text: 'The contractor shall provide a Program Manager who shall be responsible for the performance of the work. Requirements include U.S. Citizenship, ability to communicate with senior level executives, and expertise in oversight of major federal IT programs.',
    rfpReference: 'Section C, 4.2, Page 10-11',
    rfpSection: 'Section C',
    status: 'not_started',
  },
  {
    _id: 'demo-15',
    sortOrder: 15,
    category: 'certification',
    text: 'Contractor staff must successfully complete mandatory information systems security training and access forms prior to use of or access to any of the Library digital assets.',
    rfpReference: 'Section H.5(4), Page 20',
    rfpSection: 'Section H',
    status: 'not_started',
  },
  {
    _id: 'demo-16',
    sortOrder: 16,
    category: 'certification',
    text: 'The Contractor shall ensure that all Contractor personnel sign nondisclosure agreements (NDAs).',
    rfpReference: 'Section H.10(n), Page 24',
    rfpSection: 'Section H',
    status: 'not_started',
  },
  {
    _id: 'demo-17',
    sortOrder: 17,
    category: 'deliverable',
    text: 'The Contractor will provide a Quarterly Status Report (QSR) to the COR regarding performance on each active order.',
    rfpReference: 'Section C, 4.1, Page 10',
    rfpSection: 'Section C',
    status: 'not_started',
  },
  {
    _id: 'demo-18',
    sortOrder: 18,
    category: 'formatting',
    text: 'All proposals shall be submitted electronically via email to the Contracting Officer and Contract Specialist. The maximum size file allowed is 20MB.',
    rfpReference: 'Section L.2.5(a)-(b), Page 61',
    rfpSection: 'Section L',
    status: 'not_started',
  },
  {
    _id: 'demo-19',
    sortOrder: 19,
    category: 'formatting',
    text: 'Format for all documents must be 8.5 x 11-inch pages, single-spaced 1-inch margins, Times New Roman 10 to 12-point font. Font size for tables/graphics shall be no smaller than 8-point.',
    rfpReference: 'Section L.2.5(c), Page 61',
    rfpSection: 'Section L',
    status: 'not_started',
  },
]
