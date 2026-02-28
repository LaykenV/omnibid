import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

const documentStatus = v.union(
  v.literal('downloaded'),
  v.literal('processing'),
  v.literal('processed'),
  v.literal('failed'),
)

export const create = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    fileName: v.string(),
    fileType: v.string(),
    fileId: v.id('_storage'),
    sourceUrl: v.optional(v.string()),
    status: documentStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('rfpDocuments', {
      proposalId: args.proposalId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileId: args.fileId,
      sourceUrl: args.sourceUrl,
      status: args.status,
    })
  },
})

export const get = internalQuery({
  args: {
    documentId: v.id('rfpDocuments'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId)
  },
})

export const listByProposal = internalQuery({
  args: {
    proposalId: v.id('proposals'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('rfpDocuments')
      .withIndex('by_proposal', (q) => q.eq('proposalId', args.proposalId))
      .collect()
  },
})

export const updateStatus = internalMutation({
  args: {
    documentId: v.id('rfpDocuments'),
    status: documentStatus,
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      status: args.status,
      errorMessage: args.errorMessage,
    })
  },
})
