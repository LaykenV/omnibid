import type { ConvexReactClient } from 'convex/react'
import type { Id } from '../../../../convex/_generated/dataModel'
import { api } from '../../../../convex/_generated/api'

export function prewarmProposalDetail(
  convex: ConvexReactClient,
  proposalId: Id<'proposals'>,
) {
  convex.prewarmQuery({ query: api.proposals.get, args: { proposalId } })
  convex.prewarmQuery({
    query: api.requirements.listByProposal,
    args: { proposalId },
  })
}
