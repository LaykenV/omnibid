import { createFileRoute } from '@tanstack/react-router'
import { NewProposalPage } from './-newProposal'

export const Route = createFileRoute('/_authed/proposals/new')({
  component: NewProposalPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 sm:px-8 py-12">
      <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Page failed to render: {error.message}
      </div>
    </div>
  ),
  head: () => ({
    meta: [{ title: 'OmniBid | New Proposal' }],
  }),
})
