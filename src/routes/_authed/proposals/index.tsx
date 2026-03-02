import { createFileRoute } from '@tanstack/react-router'
import { ProposalsListPage } from './-proposals'

export const Route = createFileRoute('/_authed/proposals/')({
  component: ProposalsListPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 py-12">
      <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Failed to load proposals: {error.message}
      </div>
    </div>
  ),
  head: () => ({
    meta: [{ title: 'OmniBid | Proposals' }],
  }),
})
