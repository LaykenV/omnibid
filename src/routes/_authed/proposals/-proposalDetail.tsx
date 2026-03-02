import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useMemo } from 'react'
import { Star, ArrowLeft, Download, Shield, CheckCircle, FileCheck, AlertTriangle } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import { cn } from '../../../lib/utils'

const categoryOrder = [
  'evaluation_factor',
  'mandatory',
  'personnel',
  'certification',
  'deliverable',
  'formatting',
  'other',
] as const

const categoryLabels: Record<(typeof categoryOrder)[number], string> = {
  evaluation_factor: 'Evaluation Factors',
  mandatory: 'Mandatory Requirements',
  personnel: 'Personnel Requirements',
  certification: 'Certifications',
  deliverable: 'Deliverables',
  formatting: 'Formatting Requirements',
  other: 'Other Requirements',
}

const categoryIcons: Record<(typeof categoryOrder)[number], React.ReactNode> = {
  evaluation_factor: <Star className="w-3.5 h-3.5" />,
  mandatory: <Shield className="w-3.5 h-3.5" />,
  personnel: <Star className="w-3.5 h-3.5" />,
  certification: <CheckCircle className="w-3.5 h-3.5" />,
  deliverable: <FileCheck className="w-3.5 h-3.5" />,
  formatting: <FileCheck className="w-3.5 h-3.5" />,
  other: <Star className="w-3.5 h-3.5" />,
}

const processingSteps = ['resolving', 'extracting', 'validating'] as const

export function ProposalDetailPage() {
  const { proposalId } = useParams({ from: '/_authed/proposals/$proposalId' })

  const typedProposalId = proposalId as Id<'proposals'>

  const proposalQueryOptions = useMemo(
    () => convexQuery(api.proposals.get, { proposalId: typedProposalId }),
    [typedProposalId],
  )
  const requirementsQueryOptions = useMemo(
    () => convexQuery(api.requirements.listByProposal, { proposalId: typedProposalId }),
    [typedProposalId],
  )

  const proposalQuery = useQuery(proposalQueryOptions)
  const requirementsQuery = useQuery(requirementsQueryOptions)

  if (proposalQuery.isLoading || requirementsQuery.isLoading) {
    return <DetailSkeleton />
  }

  if (proposalQuery.isError || requirementsQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-12">
        <div className="border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Could not load proposal details.
        </div>
      </div>
    )
  }

  const proposal = proposalQuery.data
  const requirements = requirementsQuery.data ?? []

  if (!proposal) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-8 py-12">
        <div className="border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Proposal not found.
        </div>
      </div>
    )
  }

  if (proposal.status === 'error') {
    return <ErrorState proposal={proposal} />
  }

  if (proposal.status !== 'matrix_ready') {
    return <ProcessingState proposal={proposal} />
  }

  const groupedRequirements = requirements.reduce<Record<string, typeof requirements>>(
    (accumulator, requirement) => {
      if (!accumulator[requirement.category]) {
        accumulator[requirement.category] = []
      }
      accumulator[requirement.category].push(requirement)
      return accumulator
    },
    {},
  )

  return (
    <>
      {/* Header */}
      <section className="bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="grid grid-cols-12 gap-8 p-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-white" />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <Link to="/proposals" className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-sm font-semibold mb-3">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to proposals
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {proposal.solicitation?.title || proposal.title}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => exportToCsv(requirements, proposal)}
              className="bg-white/10 border border-white/20 text-white px-4 py-2.5 font-bold text-sm hover:bg-white/20 transition-colors inline-flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Metadata grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              ['Agency', proposal.solicitation?.agency],
              ['Solicitation #', proposal.solicitation?.solicitationNumber],
              ['NAICS', proposal.solicitation?.naicsCode],
              ['Due Date', proposal.solicitation?.responseDeadline],
              ['Set-Aside', proposal.solicitation?.setAsideDescription],
              ['Estimated Value', proposal.solicitation?.estimatedValue],
              ['Contract Type', proposal.solicitation?.contractType],
              ['Location', proposal.solicitation?.placeOfPerformance],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label} className="min-w-0 bg-white/10 border border-white/10 px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300">{label}</div>
                  <div className="truncate text-sm text-white font-medium mt-0.5">{value}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex h-1.5">
          <div className="flex-1 bg-red-700" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-blue-900" />
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar requirements={requirements} groupedRequirements={groupedRequirements} />

      {/* Requirements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-8 sm:pb-12 space-y-4">
        {requirements.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="w-12 h-12 bg-blue-900 text-white flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-blue-900">No requirements found</h2>
            <p className="mt-1 text-sm text-slate-500">
              This document may not be a federal RFP, or it may not contain extractable requirements.
            </p>
          </div>
        )}
        {categoryOrder.map((category) => {
          const rows = groupedRequirements[category] ?? []
          if (!rows.length) return null

          return (
            <details key={category} open className="border border-slate-200 bg-white group">
              <summary className="cursor-pointer select-none px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="w-7 h-7 bg-blue-900 text-white flex items-center justify-center shrink-0 group-open:bg-red-700 transition-colors">
                  {categoryIcons[category]}
                </div>
                <span className="font-bold text-sm text-blue-900">{categoryLabels[category]}</span>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5">{rows.length}</span>
              </summary>

              <div className="overflow-x-auto border-t border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-12">#</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Requirement</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-40">RFP Reference</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-44">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((requirement, index) => (
                        <RequirementRow
                          key={requirement._id}
                          index={index + 1}
                          requirement={requirement}
                        />
                      ))}
                  </tbody>
                </table>
              </div>
            </details>
          )
        })}
      </section>
    </>
  )
}

function ErrorState({ proposal }: { proposal: Doc<'proposals'> }) {
  return (
    <>
      <section className="bg-blue-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 relative">
          <Link to="/proposals" className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-sm font-semibold mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to proposals
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Processing Failed</h1>
        </div>
        <div className="flex h-1.5">
          <div className="flex-1 bg-red-700" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-blue-900" />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="border border-red-200 bg-red-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-700 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-red-800 text-lg">Workflow Error</h2>
              <p className="mt-2 text-sm text-red-700 leading-relaxed">
                {proposal.errorMessage || 'The workflow failed. Create a new proposal to retry.'}
              </p>
              <Link
                to="/proposals/new"
                className="mt-4 inline-flex items-center gap-2 bg-red-700 text-white px-5 py-2.5 font-bold text-sm hover:bg-red-600 transition-colors"
              >
                Try Again
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function ProcessingState({ proposal }: { proposal: Doc<'proposals'> }) {
  const currentStepIndex = processingSteps.indexOf(
    proposal.status as (typeof processingSteps)[number],
  )

  return (
    <>
      <section className="bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="grid grid-cols-12 gap-8 p-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-white" />
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14 relative text-center">
          <Link to="/proposals" className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-sm font-semibold mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to proposals
          </Link>

          <div className="mx-auto h-12 w-12 animate-spin border-2 border-white border-t-transparent rounded-full mb-5" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Building Compliance Matrix</h1>
          <p className="mt-2 text-blue-200 text-sm">{proposal.statusMessage || 'Processing your RFP...'}</p>
        </div>

        <div className="flex h-1.5">
          <div className="flex-1 bg-red-700" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-blue-900" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {processingSteps.map((step, index) => {
            const isDone = currentStepIndex > index
            const isCurrent = currentStepIndex === index
            return (
              <div
                key={step}
                className={cn(
                  'border p-5 transition-all',
                  isDone && 'border-emerald-200 bg-emerald-50',
                  isCurrent && 'border-blue-900 bg-blue-50 shadow-lg shadow-blue-900/10',
                  !isDone && !isCurrent && 'border-slate-200 bg-slate-50',
                )}
              >
                <div className={cn(
                  'w-8 h-8 flex items-center justify-center mb-3 text-sm font-black',
                  isDone && 'bg-emerald-600 text-white',
                  isCurrent && 'bg-blue-900 text-white',
                  !isDone && !isCurrent && 'bg-slate-200 text-slate-400',
                )}>
                  {isDone ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <div className={cn(
                  'text-[10px] font-bold uppercase tracking-widest mb-1',
                  isDone && 'text-emerald-600',
                  isCurrent && 'text-blue-900',
                  !isDone && !isCurrent && 'text-slate-400',
                )}>
                  Step {index + 1}
                </div>
                <div className={cn(
                  'font-bold text-sm',
                  isDone && 'text-emerald-700',
                  isCurrent && 'text-blue-900',
                  !isDone && !isCurrent && 'text-slate-400',
                )}>
                  {stepLabel(step)}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

function RequirementRow({ requirement, index }: { requirement: Doc<'requirements'>; index: number }) {
  const updateRequirementStatus = useMutation(api.requirements.updateStatus)

  return (
    <tr className="align-top hover:bg-blue-50/30 transition-colors">
      <td className="px-3 py-3 text-xs font-bold text-slate-400">{index}</td>
      <td className="px-3 py-3 text-slate-800">
        {requirement.text}
        {requirement.evaluationWeight ? (
          <span className="ml-2 inline-block bg-amber-100 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            {requirement.evaluationWeight}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 text-xs text-slate-500 font-medium">{requirement.rfpReference}</td>
      <td className="px-3 py-3">
        <select
          value={requirement.status}
          onChange={(event) => {
            void updateRequirementStatus({
              requirementId: requirement._id,
              status: event.target.value as Doc<'requirements'>['status'],
            })
          }}
          className="w-full border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-900 focus:outline-none"
        >
          <option value="not_started">Not started</option>
          <option value="addressed">Addressed</option>
          <option value="partially_addressed">Partially addressed</option>
          <option value="not_applicable">Not applicable</option>
        </select>
      </td>
    </tr>
  )
}

function StatsBar({
  requirements,
  groupedRequirements,
}: {
  requirements: Doc<'requirements'>[]
  groupedRequirements: Record<string, Doc<'requirements'>[]>
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      <div className="border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-blue-900 text-white px-3 py-1 text-xs font-bold">
            {requirements.length} total
          </span>

          {categoryOrder.map((category) => {
            const count = groupedRequirements[category]?.length ?? 0
            if (!count) return null

            return (
              <span
                key={category}
                className="border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {categoryLabels[category]}: {count}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <>
      <div className="bg-blue-900 h-48 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-4">
        <div className="h-16 animate-pulse border border-slate-200 bg-slate-50" />
        <div className="h-96 animate-pulse border border-slate-200 bg-slate-50" />
      </div>
    </>
  )
}

function stepLabel(step: (typeof processingSteps)[number]) {
  if (step === 'resolving') return 'Resolving RFP'
  if (step === 'extracting') return 'Extracting Requirements'
  return 'Validating Matrix'
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function exportToCsv(requirements: Doc<'requirements'>[], proposal: Doc<'proposals'>) {
  const headers = [
    '#',
    'Category',
    'Requirement',
    'RFP Reference',
    'Section',
    'Volume',
    'Weight',
    'Status',
  ]

  const rows = requirements
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((requirement, index) => [
      String(index + 1),
      requirement.category,
      csvEscape(requirement.text || ''),
      csvEscape(requirement.rfpReference || ''),
      csvEscape(requirement.rfpSection || ''),
      csvEscape(requirement.volume || ''),
      csvEscape(requirement.evaluationWeight || ''),
      requirement.status,
    ])

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const baseName = proposal.solicitation?.solicitationNumber || proposal.title || 'matrix'

  link.href = url
  link.download = `${baseName}-compliance-matrix.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
