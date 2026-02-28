import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { workflow } from './manager'

export const ingestRfpWorkflow = workflow.define({
  args: {
    proposalId: v.id('proposals'),
  },
  handler: async (step, args): Promise<void> => {
    try {
      const { proposalId } = args

      const documentIds = await step.runAction(
        internal.steps.resolveAndAcquire.resolveAndAcquire,
        { proposalId },
        { retry: { maxAttempts: 3, initialBackoffMs: 3000, base: 2 } },
      )

      await step.runAction(
        internal.steps.extractRequirements.extractRequirements,
        { proposalId, documentIds },
        { retry: { maxAttempts: 3, initialBackoffMs: 5000, base: 2 } },
      )

      await step.runAction(
        internal.steps.validateAndOrganize.validateAndOrganize,
        { proposalId },
        { retry: { maxAttempts: 2, initialBackoffMs: 3000, base: 2 } },
      )

      await step.runMutation(internal.proposals.updateStatus, {
        proposalId,
        status: 'matrix_ready',
        statusMessage: 'Compliance matrix ready',
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Workflow failed unexpectedly'
      await step.runMutation(internal.proposals.updateStatus, {
        proposalId: args.proposalId,
        status: 'error',
        statusMessage: 'Processing failed',
        errorMessage: message,
      })
      throw error
    }
  },
})
