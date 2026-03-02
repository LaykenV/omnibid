import type { ConvexReactClient } from 'convex/react'
import { api } from '../../../../convex/_generated/api'

export function prewarmProposalsList(convex: ConvexReactClient) {
  convex.prewarmQuery({ query: api.proposals.list, args: {} })
}
