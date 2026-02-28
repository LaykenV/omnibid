import { mutation, query, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { workflow } from './workflows/manager'

const CURRENT_PIPELINE_VERSION = 1

const proposalStatus = v.union(
  v.literal('created'),
  v.literal('resolving'),
  v.literal('extracting'),
  v.literal('validating'),
  v.literal('matrix_ready'),
  v.literal('error'),
)

const solicitationValidator = v.object({
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
})

const formattingValidator = v.object({
  pageLimit: v.optional(v.number()),
  fontFamily: v.optional(v.string()),
  fontSize: v.optional(v.number()),
  margins: v.optional(v.string()),
  lineSpacing: v.optional(v.string()),
  volumes: v.optional(v.array(v.string())),
})

export const create = mutation({
  args: {
    sessionId: v.string(),
    inputType: v.union(
      v.literal('sam_url'),
      v.literal('solicitation_num'),
      v.literal('pdf_upload'),
    ),
    inputValue: v.string(),
    title: v.optional(v.string()),
    rfpFileIds: v.optional(v.array(v.id('_storage'))),
  },
  handler: async (ctx, args) => {
    if (!args.inputValue.trim()) {
      throw new Error('Input value cannot be empty')
    }
    if (args.inputType === 'sam_url' && !args.inputValue.includes('sam.gov')) {
      throw new Error('Please provide a valid SAM.gov URL')
    }
    if (args.inputType === 'pdf_upload' && !args.rfpFileIds?.length) {
      throw new Error('At least one file must be uploaded')
    }

    const proposalId = await ctx.db.insert('proposals', {
      sessionId: args.sessionId,
      title: args.title || 'New Proposal',
      status: 'created',
      statusMessage: 'Queued for processing',
      pipelineVersion: CURRENT_PIPELINE_VERSION,
      inputType: args.inputType,
      inputValue: args.inputValue,
      rfpFileIds: args.rfpFileIds,
    })

    const workflowId = await workflow.start(
      ctx,
      internal.workflows.ingestRfp.ingestRfpWorkflow,
      { proposalId },
    )

    await ctx.db.patch(proposalId, { workflowId })
    return proposalId
  },
})

export const list = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('proposals')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .collect()
  },
})

export const get = query({
  args: { proposalId: v.id('proposals'), sessionId: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId)
    if (!proposal || proposal.sessionId !== args.sessionId) {
      return null
    }
    return proposal
  },
})

export const getInternal = internalQuery({
  args: { proposalId: v.id('proposals') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.proposalId)
  },
})

export const generateUploadUrl = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionId) {
      throw new Error('sessionId is required')
    }
    return await ctx.storage.generateUploadUrl()
  },
})

export const updateStatus = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    status: proposalStatus,
    statusMessage: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      status: args.status,
      statusMessage: args.statusMessage,
      errorMessage: args.errorMessage,
    })
  },
})

export const patchSolicitation = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    solicitation: solicitationValidator,
    title: v.optional(v.string()),
    resourceLinks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      solicitation: args.solicitation,
      resourceLinks: args.resourceLinks,
    }
    if (args.title !== undefined) {
      patch.title = args.title
    }
    await ctx.db.patch(args.proposalId, patch)
  },
})

export const patchMetadata = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    solicitation: solicitationValidator,
    formatting: formattingValidator,
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId)
    const existingFormatting = proposal?.formatting ?? {}

    await ctx.db.patch(args.proposalId, {
      solicitation: args.solicitation,
      formatting: {
        pageLimit: existingFormatting.pageLimit ?? args.formatting.pageLimit,
        fontFamily: existingFormatting.fontFamily ?? args.formatting.fontFamily,
        fontSize: existingFormatting.fontSize ?? args.formatting.fontSize,
        margins: existingFormatting.margins ?? args.formatting.margins,
        lineSpacing: existingFormatting.lineSpacing ?? args.formatting.lineSpacing,
        volumes: existingFormatting.volumes ?? args.formatting.volumes,
      },
    })
  },
})

export const patchRequirementCount = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    requirementCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      requirementCount: args.requirementCount,
    })
  },
})
