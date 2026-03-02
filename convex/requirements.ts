import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server'
import { v } from 'convex/values'

const requirementCategory = v.union(
  v.literal('mandatory'),
  v.literal('evaluation_factor'),
  v.literal('formatting'),
  v.literal('deliverable'),
  v.literal('certification'),
  v.literal('personnel'),
  v.literal('other'),
)

const requirementStatus = v.union(
  v.literal('not_started'),
  v.literal('addressed'),
  v.literal('partially_addressed'),
  v.literal('not_applicable'),
)

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity
}

export const listByProposal = query({
  args: { proposalId: v.id('proposals') },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    const proposal = await ctx.db.get(args.proposalId)

    if (!proposal || proposal.ownerId !== identity.subject) {
      return []
    }

    const requirements = await ctx.db
      .query('requirements')
      .withIndex('by_proposal', (q) => q.eq('proposalId', args.proposalId))
      .collect()

    return requirements.sort((a, b) => a.sortOrder - b.sortOrder)
  },
})

export const listByProposalInternal = internalQuery({
  args: { proposalId: v.id('proposals') },
  handler: async (ctx, args) => {
    const requirements = await ctx.db
      .query('requirements')
      .withIndex('by_proposal', (q) => q.eq('proposalId', args.proposalId))
      .collect()

    return requirements.sort((a, b) => a.sortOrder - b.sortOrder)
  },
})

export const updateStatus = mutation({
  args: {
    requirementId: v.id('requirements'),
    status: requirementStatus,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    const requirement = await ctx.db.get(args.requirementId)
    if (!requirement) throw new Error('Requirement not found')

    const proposal = await ctx.db.get(requirement.proposalId)
    if (!proposal || proposal.ownerId !== identity.subject) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.requirementId, {
      status: args.status,
      notes: args.notes,
    })
  },
})

export const bulkInsert = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    requirements: v.array(
      v.object({
        category: requirementCategory,
        text: v.string(),
        rfpReference: v.string(),
        rfpSection: v.optional(v.string()),
        volume: v.optional(v.string()),
        evaluationWeight: v.optional(v.string()),
        sortOrder: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const requirement of args.requirements) {
      await ctx.db.insert('requirements', {
        proposalId: args.proposalId,
        category: requirement.category,
        text: requirement.text,
        rfpReference: requirement.rfpReference,
        rfpSection: requirement.rfpSection,
        volume: requirement.volume,
        evaluationWeight: requirement.evaluationWeight,
        status: 'not_started',
        sortOrder: requirement.sortOrder,
      })
    }
  },
})

export const updateText = internalMutation({
  args: {
    requirementId: v.id('requirements'),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, {
      text: args.text,
    })
  },
})

export const updateCategory = internalMutation({
  args: {
    requirementId: v.id('requirements'),
    category: requirementCategory,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, {
      category: args.category,
    })
  },
})

export const updateSortOrder = internalMutation({
  args: {
    requirementId: v.id('requirements'),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requirementId, {
      sortOrder: args.sortOrder,
    })
  },
})

export const remove = internalMutation({
  args: {
    requirementId: v.id('requirements'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.requirementId)
  },
})
