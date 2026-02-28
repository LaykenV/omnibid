import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Star, FileCheck, ArrowRight, Plus } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'
import { getSessionId } from '../../lib/session'
import { cn } from '../../lib/utils'

export const Route = createFileRoute('/proposals/')({
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

function ProposalsListPage() {
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    setSessionId(getSessionId())
  }, [])

  const queryOptions = useMemo(
    () => convexQuery(api.proposals.list, { sessionId }),
    [sessionId],
  )

  const proposalsQuery = useQuery({
    ...queryOptions,
    enabled: Boolean(sessionId),
  })
  const proposals = proposalsQuery.data ?? []

  return (
    <>
      {/* Page header */}
      <section className="bg-blue-900 text-white relative overflow-hidden">
        {/* Stars pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="grid grid-cols-12 gap-8 p-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-white" />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-white fill-white" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Your Proposals</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Compliance Matrices</h1>
              <p className="mt-2 text-blue-200 text-sm sm:text-base max-w-xl">
                Track your RFP extractions and compliance matrices in progress and ready to review.
              </p>
            </div>
            <Link
              to="/proposals/new"
              className="bg-red-700 text-white px-6 py-3 font-bold text-sm hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Proposal
            </Link>
          </div>
        </div>

        {/* Tricolor bottom border */}
        <div className="flex h-1.5">
          <div className="flex-1 bg-red-700" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-blue-900" />
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {!sessionId || proposalsQuery.isLoading ? (
          <ListSkeleton />
        ) : proposalsQuery.isError ? (
          <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Could not load proposals. Refresh and try again.
          </div>
        ) : proposals.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <Link
                key={proposal._id}
                to="/proposals/$proposalId"
                params={{ proposalId: proposal._id }}
                className="group block border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 bg-blue-900 text-white flex items-center justify-center shrink-0 group-hover:bg-red-700 transition-colors">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <StatusBadge status={proposal.status} />
                </div>

                <h2 className="font-bold text-blue-900 mb-1 line-clamp-2">{proposal.title}</h2>
                {proposal.solicitation?.agency ? (
                  <p className="text-sm text-slate-500 truncate">{proposal.solicitation.agency}</p>
                ) : null}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    {proposal.requirementCount != null
                      ? `${proposal.requirementCount} requirement${proposal.requirementCount === 1 ? '' : 's'}`
                      : 'Pending extraction'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-900 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 bg-white p-12 sm:p-16 text-center">
            <div className="w-14 h-14 bg-blue-900 text-white flex items-center justify-center mx-auto mb-5">
              <FileCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-blue-900 mb-2">No proposals yet</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Create your first proposal to generate a compliance matrix from any federal RFP.
            </p>
            <Link
              to="/proposals/new"
              className="bg-red-700 text-white px-6 py-3 font-bold text-sm hover:bg-red-600 transition-colors inline-flex items-center gap-2 shadow-lg shadow-red-700/20"
            >
              Parse an RFP
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>
    </>
  )
}

function StatusBadge({ status }: { status: Doc<'proposals'>['status'] }) {
  const labelByStatus: Record<string, string> = {
    created: 'Created',
    resolving: 'Resolving',
    extracting: 'Extracting',
    validating: 'Validating',
    matrix_ready: 'Ready',
    error: 'Error',
  }

  const classByStatus: Record<string, string> = {
    created: 'bg-slate-100 text-slate-700 border-slate-200',
    resolving: 'bg-amber-50 text-amber-800 border-amber-200',
    extracting: 'bg-blue-50 text-blue-800 border-blue-200',
    validating: 'bg-violet-50 text-violet-800 border-violet-200',
    matrix_ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <span
      className={cn(
        'border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        classByStatus[status] ?? classByStatus.created,
      )}
    >
      {labelByStatus[status] ?? status}
    </span>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse border border-slate-200 bg-slate-50"
        />
      ))}
    </div>
  )
}
