import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  proposals: defineTable({
    ownerId: v.string(),
    title: v.string(),
    status: v.union(
      v.literal('created'),
      v.literal('resolving'),
      v.literal('extracting'),
      v.literal('validating'),
      v.literal('matrix_ready'),
      v.literal('error'),
    ),
    statusMessage: v.optional(v.string()),
    pipelineVersion: v.number(),
    inputType: v.union(
      v.literal('sam_url'),
      v.literal('solicitation_num'),
      v.literal('pdf_upload'),
    ),
    inputValue: v.string(),
    rfpFileIds: v.optional(v.array(v.id('_storage'))),
    solicitation: v.optional(
      v.object({
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
      }),
    ),
    formatting: v.optional(
      v.object({
        pageLimit: v.optional(v.number()),
        fontFamily: v.optional(v.string()),
        fontSize: v.optional(v.number()),
        margins: v.optional(v.string()),
        lineSpacing: v.optional(v.string()),
        volumes: v.optional(v.array(v.string())),
      }),
    ),
    resourceLinks: v.optional(v.array(v.string())),
    requirementCount: v.optional(v.number()),
    workflowId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index('by_owner', ['ownerId'])
    .index('by_status', ['status']),

  rfpDocuments: defineTable({
    proposalId: v.id('proposals'),
    fileName: v.string(),
    fileType: v.string(),
    fileId: v.id('_storage'),
    sourceUrl: v.optional(v.string()),
    status: v.union(
      v.literal('downloaded'),
      v.literal('processing'),
      v.literal('processed'),
      v.literal('failed'),
    ),
    errorMessage: v.optional(v.string()),
  }).index('by_proposal', ['proposalId']),

  rawExtractions: defineTable({
    proposalId: v.id('proposals'),
    documentId: v.optional(v.id('rfpDocuments')),
    model: v.string(),
    extractionType: v.union(v.literal('requirements'), v.literal('validation')),
    rawOutput: v.string(),
    tokenUsage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
      }),
    ),
    durationMs: v.optional(v.number()),
  }).index('by_proposal', ['proposalId']),

  requirements: defineTable({
    proposalId: v.id('proposals'),
    category: v.union(
      v.literal('mandatory'),
      v.literal('evaluation_factor'),
      v.literal('formatting'),
      v.literal('deliverable'),
      v.literal('certification'),
      v.literal('personnel'),
      v.literal('other'),
    ),
    text: v.string(),
    rfpReference: v.string(),
    rfpSection: v.optional(v.string()),
    volume: v.optional(v.string()),
    evaluationWeight: v.optional(v.string()),
    status: v.union(
      v.literal('not_started'),
      v.literal('addressed'),
      v.literal('partially_addressed'),
      v.literal('not_applicable'),
    ),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index('by_proposal', ['proposalId'])
    .index('by_proposal_category', ['proposalId', 'category'])
    .index('by_proposal_status', ['proposalId', 'status']),
})
