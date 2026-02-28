import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const create = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('rawExtractions', {
      proposalId: args.proposalId,
      documentId: args.documentId,
      model: args.model,
      extractionType: args.extractionType,
      rawOutput: args.rawOutput,
      tokenUsage: args.tokenUsage,
      durationMs: args.durationMs,
    })
  },
})
