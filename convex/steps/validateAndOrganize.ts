'use node'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { internal } from '../_generated/api'
import type { Doc } from '../_generated/dataModel'
import { internalAction } from '../_generated/server'
import { v } from 'convex/values'
import { GEMINI_MODEL } from '../constants'

const validationSchema = z.object({
  duplicateGroups: z.array(
    z.object({
      keepIndex: z.number(),
      removeIndices: z.array(z.number()),
      mergedText: z.string().optional(),
    }),
  ),
  recategorizations: z.array(
    z.object({
      index: z.number(),
      newCategory: z.enum([
        'mandatory',
        'evaluation_factor',
        'formatting',
        'deliverable',
        'certification',
        'personnel',
        'other',
      ]),
      reason: z.string(),
    }),
  ),
  sortedIndices: z.array(z.number()),
})

export const validateAndOrganize = internalAction({
  args: {
    proposalId: v.id('proposals'),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: 'validating',
      statusMessage: 'Deduplicating and organizing requirements...',
    })

    const requirements: Doc<'requirements'>[] = await ctx.runQuery(
      internal.requirements.listByProposalInternal,
      {
        proposalId: args.proposalId,
      },
    )

    if (requirements.length === 0) {
      // Non-RFP or empty docs: mark as ready with zero requirements instead of crashing
      await ctx.runMutation(internal.proposals.patchRequirementCount, {
        proposalId: args.proposalId,
        requirementCount: 0,
      })
      return
    }

    const requirementsForModel = requirements.map((requirement, index) => ({
      index,
      id: requirement._id,
      category: requirement.category,
      text: requirement.text,
      rfpReference: requirement.rfpReference,
      rfpSection: requirement.rfpSection,
      volume: requirement.volume,
      evaluationWeight: requirement.evaluationWeight,
    }))

    const startTime = Date.now()

    const { object, usage } = await generateObject({
      model: google(GEMINI_MODEL),
      schema: validationSchema,
      providerOptions: {
        google: {
          structuredOutputs: true,
        },
      },
      prompt: `You are doing QA on an extracted compliance matrix from a federal solicitation.

Requirements:\n${JSON.stringify(requirementsForModel, null, 2)}

Tasks:
1. Identify true duplicate / near-duplicate requirements.
2. Recategorize misclassified requirements.
3. Return sortedIndices for remaining requirements in this order:
   evaluation_factor (by weight), mandatory, personnel, certification, deliverable, formatting, other.

Be conservative on deduplication and maximize traceability.`,
    })

    await ctx.runMutation(internal.rawExtractions.create, {
      proposalId: args.proposalId,
      model: GEMINI_MODEL,
      extractionType: 'validation',
      rawOutput: JSON.stringify(object),
      tokenUsage: usage
        ? {
            promptTokens: usage.inputTokens ?? 0,
            completionTokens: usage.outputTokens ?? 0,
          }
        : undefined,
      durationMs: Date.now() - startTime,
    })

    for (const recategorization of object.recategorizations) {
      const requirement = requirements[recategorization.index]
      if (!requirement) continue

      await ctx.runMutation(internal.requirements.updateCategory, {
        requirementId: requirement._id,
        category: recategorization.newCategory,
      })
    }

    const indicesToRemove = new Set<number>()

    for (const duplicateGroup of object.duplicateGroups) {
      const keepRequirement = requirements[duplicateGroup.keepIndex]
      if (!keepRequirement) continue

      for (const index of duplicateGroup.removeIndices) {
        // Only mark for removal if in-range and not the kept requirement
        if (index !== duplicateGroup.keepIndex && index >= 0 && index < requirements.length) {
          indicesToRemove.add(index)
        }
      }

      if (duplicateGroup.mergedText) {
        await ctx.runMutation(internal.requirements.updateText, {
          requirementId: keepRequirement._id,
          text: duplicateGroup.mergedText,
        })
      }
    }

    for (const indexToRemove of indicesToRemove) {
      const requirement = requirements[indexToRemove]
      if (!requirement) continue

      await ctx.runMutation(internal.requirements.remove, {
        requirementId: requirement._id,
      })
    }

    let sortOrder = 1
    const seen = new Set<number>()

    for (const index of object.sortedIndices) {
      if (seen.has(index) || indicesToRemove.has(index)) continue
      const requirement = requirements[index]
      if (!requirement) continue

      seen.add(index)
      await ctx.runMutation(internal.requirements.updateSortOrder, {
        requirementId: requirement._id,
        sortOrder,
      })
      sortOrder += 1
    }

    for (let i = 0; i < requirements.length; i += 1) {
      if (seen.has(i) || indicesToRemove.has(i)) continue

      await ctx.runMutation(internal.requirements.updateSortOrder, {
        requirementId: requirements[i]._id,
        sortOrder,
      })
      sortOrder += 1
    }

    // Count actual deletions (sortOrder - 1 tracks how many survived)
    const finalCount = sortOrder - 1
    await ctx.runMutation(internal.proposals.patchRequirementCount, {
      proposalId: args.proposalId,
      requirementCount: finalCount,
    })
  },
})
