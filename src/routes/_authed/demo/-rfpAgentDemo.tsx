import { convexQuery } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileSearch,
  ListChecks,
  Play,
  Search,
  Sparkles,
} from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import { cn } from '../../../lib/utils'
import {
  DEMO_INPUT_VALUE,
  DEMO_PROPOSAL_ID,
  categoryLabels,
  categoryOrder,
  demoProposal,
  demoRequirements,
  reviewLabels,
  type DemoRequirement,
  type DemoStatus,
} from './-demoData'

type DemoPhase = 'idle' | 'running' | 'ready'

const workflowSteps = [
  {
    key: 'ingest',
    label: 'Ingest',
    detail: 'Pull the public solicitation package.',
    runningCopy: 'Pulling SAM.gov package…',
    icon: Search,
  },
  {
    key: 'extract',
    label: 'Extract',
    detail: 'Identify clauses, factors, and rules.',
    runningCopy: 'Parsing Sections L, M, C…',
    icon: FileSearch,
  },
  {
    key: 'matrix',
    label: 'Matrix',
    detail: 'Group rows and attach citations.',
    runningCopy: 'Linking each row to its citation…',
    icon: ListChecks,
  },
  {
    key: 'review',
    label: 'Review',
    detail: 'Human verifies before approval.',
    runningCopy: 'Handing off to reviewer…',
    icon: ClipboardCheck,
  },
] as const

const STEP_TIMINGS_MS = [0, 3200, 7200, 11800]
const READY_AT_MS = 15500

export function RfpAgentDemoPage() {
  const [phase, setPhase] = useState<DemoPhase>('idle')
  const [activeStep, setActiveStep] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [localStatuses, setLocalStatuses] = useState<Record<string, DemoStatus>>({})

  const shouldLoadPinnedRun = phase === 'ready' && Boolean(DEMO_PROPOSAL_ID)
  const proposalQuery = useQuery({
    ...convexQuery(api.proposals.get, {
      proposalId: (DEMO_PROPOSAL_ID || 'demo') as Id<'proposals'>,
    }),
    enabled: shouldLoadPinnedRun,
  })
  const requirementsQuery = useQuery({
    ...convexQuery(api.requirements.listByProposal, {
      proposalId: (DEMO_PROPOSAL_ID || 'demo') as Id<'proposals'>,
    }),
    enabled: shouldLoadPinnedRun,
  })

  const liveProposal = shouldLoadPinnedRun ? proposalQuery.data : null
  const liveRequirements = shouldLoadPinnedRun ? requirementsQuery.data : null
  const proposal = liveProposal ?? demoProposal
  const requirements = useMemo<DemoRequirement[]>(() => {
    const rows = liveRequirements?.length ? liveRequirements : demoRequirements
    return rows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((requirement) => ({
        ...requirement,
        status: localStatuses[requirement._id] ?? 'not_started',
      }))
  }, [liveRequirements, localStatuses])

  const groupedRequirements = useMemo(() => {
    return requirements.reduce<Record<string, DemoRequirement[]>>((groups, requirement) => {
      groups[requirement.category] = groups[requirement.category] ?? []
      groups[requirement.category].push(requirement)
      return groups
    }, {})
  }, [requirements])

  useEffect(() => {
    if (phase !== 'running') return

    const startedAt = performance.now()
    const tick = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt)
    }, 60)

    const stepTimers = STEP_TIMINGS_MS.slice(1).map((delay, idx) =>
      window.setTimeout(() => setActiveStep(idx + 1), delay),
    )
    const readyTimer = window.setTimeout(() => {
      setActiveStep(workflowSteps.length - 1)
      setPhase('ready')
    }, READY_AT_MS)

    return () => {
      window.clearInterval(tick)
      stepTimers.forEach(window.clearTimeout)
      window.clearTimeout(readyTimer)
    }
  }, [phase])

  const handleRun = () => {
    setPhase('running')
    setActiveStep(0)
    setElapsedMs(0)
    setLocalStatuses({})
  }

  const resultVisible = phase === 'ready'
  const progressVisible = phase !== 'idle'

  return (
    <div className="demo-shell relative min-h-screen overflow-x-hidden">
      <div className="demo-bg-grid" aria-hidden="true" />
      <div className="demo-bg-glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1280px] flex-col px-6 py-6 lg:px-14 lg:py-9">
        <BrandStrip phase={phase} elapsedMs={elapsedMs} />

        <HeroSection phase={phase} onRun={handleRun} />

        {progressVisible ? (
          <div key={phase} className="demo-animate-in mt-7">
            <HorizontalProgress phase={phase} activeStep={activeStep} elapsedMs={elapsedMs} />
          </div>
        ) : null}

        <main className="mt-6 flex flex-1 flex-col">
          <section className="demo-card min-w-0 flex-1">
            <MatrixHeader
              proposal={proposal}
              requirements={requirements}
              resultVisible={resultVisible}
              phase={phase}
            />
            {resultVisible ? (
              <MatrixTable
                groupedRequirements={groupedRequirements}
                onStatusChange={(requirementId, status) => {
                  setLocalStatuses((current) => ({ ...current, [requirementId]: status }))
                }}
              />
            ) : (
              <WaitingCanvas phase={phase} activeStep={activeStep} />
            )}
          </section>
        </main>

        <FooterStrip />
      </div>
    </div>
  )
}

function BrandStrip({ phase, elapsedMs }: { phase: DemoPhase; elapsedMs: number }) {
  return (
    <header className="flex items-center justify-between gap-6 pb-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-[5px] bg-[var(--text)] text-[13px] font-bold leading-none tracking-[-0.02em] text-[var(--ink)]">
          V
        </span>
        <span className="text-[14.5px] font-semibold tracking-[-0.012em] text-[var(--text)]">
          Varholdt AI
        </span>
        <span className="hidden h-3.5 w-px bg-[var(--line-2)] md:inline-block" />
        <span className="demo-font-mono hidden text-[10.5px] uppercase tracking-[0.18em] text-[var(--faint)] md:inline">
          RFP Response Agent
        </span>
      </div>
      <div className="flex items-center gap-5">
        <span className="hidden items-center gap-2 md:inline-flex">
          <span className="demo-pulse-soft inline-block h-1.5 w-1.5 rounded-full bg-[var(--signal)]" />
          <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Agent online
          </span>
        </span>
        <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--faint)]">
          {phase === 'idle'
            ? 'Idle'
            : phase === 'ready'
              ? `Completed · ${formatSeconds(elapsedMs)}`
              : `Elapsed · ${formatSeconds(elapsedMs)}`}
        </span>
      </div>
    </header>
  )
}

function HeroSection({ phase, onRun }: { phase: DemoPhase; onRun: () => void }) {
  const running = phase === 'running'
  return (
    <section className="grid justify-items-center gap-5 pt-4 text-center lg:pt-8">
      <h1 className="m-0 text-[clamp(30px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--text)]">
        Federal RFP Agent
      </h1>

      <p className="m-0 max-w-[56ch] text-[15px] leading-[1.55] text-[var(--muted)]">
        Reads a public solicitation, extracts every requirement with
        citations, and prepares a compliance matrix ready for human review.
      </p>

      <div className="grid w-full max-w-[640px] gap-2.5 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--line-2)] bg-[var(--ink-2)] px-3.5 py-3 text-left">
          <span className="demo-font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--faint)]">
            SAM.gov
          </span>
          <span className="h-3 w-px bg-[var(--line-2)]" />
          <input
            readOnly
            value={DEMO_INPUT_VALUE}
            aria-label="SAM.gov solicitation number"
            className="demo-font-mono w-full bg-transparent text-[14px] font-medium tracking-wide text-[var(--text)] outline-none"
          />
          <span className="demo-font-mono hidden text-[10px] uppercase tracking-[0.16em] text-[var(--faint)] sm:inline">
            Library of Congress
          </span>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className={cn('demo-btn demo-btn-primary group')}
        >
          {running ? (
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          ) : (
            <Play className="h-3 w-3 fill-current" />
          )}
          <span>{running ? 'Running' : 'Run Agent'}</span>
          {!running ? (
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          ) : null}
        </button>
      </div>
      <p className="demo-font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--faint)]">
        Public RFP only · No CUI, classified, or private client material
      </p>
    </section>
  )
}

function HorizontalProgress({
  phase,
  activeStep,
  elapsedMs,
}: {
  phase: DemoPhase
  activeStep: number
  elapsedMs: number
}) {
  const totalSteps = workflowSteps.length
  const isReady = phase === 'ready'

  return (
    <div className="demo-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[13.5px] font-semibold tracking-[-0.005em] text-[var(--text)]">
            Workflow
          </span>
          <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--faint)]">
            Workflow trace
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 demo-font-mono text-[10px] uppercase tracking-[0.16em]',
              isReady
                ? 'border-[rgba(125,192,154,0.4)] bg-[rgba(125,192,154,0.08)] text-[var(--signal)]'
                : 'border-[rgba(166,200,242,0.4)] bg-[var(--accent-dim)] text-[var(--accent)]',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isReady ? 'bg-[var(--signal)]' : 'demo-pulse-soft bg-[var(--accent)]',
              )}
            />
            {isReady ? 'Matrix ready · awaiting human review' : 'Processing'}
          </span>
          <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]">
            {formatSeconds(elapsedMs)}
          </span>
          <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Step {String(Math.min(activeStep + 1, totalSteps)).padStart(2, '0')} / 0{totalSteps}
          </span>
        </div>
      </div>

      <div className="px-5 pb-6 pt-5">
        <div className="grid grid-cols-[1fr_24px_1fr_24px_1fr_24px_1fr] items-center gap-2">
          {workflowSteps.map((step, idx) => {
            const isDone = isReady ? idx < totalSteps - 1 : idx < activeStep
            const isActive = isReady ? idx === totalSteps - 1 : idx === activeStep
            const Icon = step.icon
            const isLast = idx === totalSteps - 1
            const stepStatus = isDone
              ? 'Complete'
              : isActive && !isReady
                ? 'Running'
                : isActive && isReady
                  ? 'Human queue'
                  : 'Queued'

            return (
              <Fragment key={step.key}>
                <div
                  className={cn(
                    'relative rounded-[10px] border px-3 pb-2.5 pt-3 text-center transition-colors',
                    isActive && !isReady && 'border-[rgba(166,200,242,0.5)] bg-[rgba(166,200,242,0.06)]',
                    isActive && isReady && 'border-[rgba(125,192,154,0.5)] bg-[rgba(125,192,154,0.06)]',
                    isDone && 'border-[var(--line-2)] bg-[var(--ink-2)]',
                    !isDone && !isActive && 'border-[var(--line)] bg-[var(--ink-2)] opacity-70',
                  )}
                >
                  <div className="mx-auto mb-1.5 grid h-7 w-7 place-items-center">
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 text-[var(--signal)]" strokeWidth={2.5} />
                    ) : (
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isActive && !isReady && 'text-[var(--accent)]',
                          isActive && isReady && 'text-[var(--signal)]',
                          !isActive && 'text-[var(--muted)]',
                        )}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-[12px] font-medium tracking-[-0.005em]',
                      isActive || isDone ? 'text-[var(--text)]' : 'text-[var(--muted)]',
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      'demo-font-mono mt-0.5 text-[9.5px] uppercase tracking-[0.14em]',
                      isActive && !isReady && 'text-[var(--accent)]',
                      isActive && isReady && 'text-[var(--signal)]',
                      isDone && 'text-[var(--signal)]',
                      !isDone && !isActive && 'text-[var(--faint)]',
                    )}
                  >
                    {stepStatus}
                  </div>
                </div>

                {!isLast ? (
                  <div
                    className={cn(
                      'demo-flow-track',
                      idx === 0 ? '' : idx === 1 ? 't2' : 't3',
                      (isDone || (isReady && idx < totalSteps - 1)) && 'done',
                    )}
                    aria-hidden="true"
                  />
                ) : null}
              </Fragment>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-dashed border-[var(--line)] pt-3">
          {workflowSteps.map((step, idx) => {
            const isActive = isReady ? idx === workflowSteps.length - 1 : idx === activeStep
            return (
              <p
                key={step.key}
                className={cn(
                  'demo-font-mono text-center text-[10.5px] leading-[1.5] tracking-[0.02em]',
                  isActive ? 'text-[var(--text-2)]' : 'text-[var(--faint)]',
                )}
              >
                {isActive && !isReady ? step.runningCopy : step.detail}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MatrixHeader({
  proposal,
  requirements,
  resultVisible,
  phase,
}: {
  proposal: Doc<'proposals'> | typeof demoProposal
  requirements: DemoRequirement[]
  resultVisible: boolean
  phase: DemoPhase
}) {
  const categoryCounts = categoryOrder
    .map((category) => ({ category, count: requirements.filter((row) => row.category === category).length }))
    .filter((row) => row.count > 0)

  const rawTitle = proposal.solicitation?.title || proposal.title || ''
  const displayTitle = rawTitle.replace(/\s*[-–—·]?\s*IDIQ\s*$/i, '').trim() || 'Public solicitation'
  const agency = proposal.solicitation?.agency ?? 'Federal agency'
  const solNumber = proposal.solicitation?.solicitationNumber ?? '—'
  const dueDate = proposal.solicitation?.responseDeadline ?? 'Pending'

  return (
    <div className="border-b border-[var(--line)] px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="demo-font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--muted)]">
            <span className="text-[var(--text-2)]">{agency}</span>
            <span className="mx-2 text-[var(--faint)]">·</span>
            <span>Sol# {solNumber}</span>
          </div>
          <h2 className="mt-1.5 text-[22px] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--text)]">
            {displayTitle}
          </h2>
          <div className="demo-font-mono mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10.5px] uppercase tracking-[0.14em]">
            <span className="text-[var(--muted)]">
              {resultVisible
                ? 'Compliance matrix · ready for review'
                : phase === 'running'
                  ? 'Building matrix'
                  : 'Awaiting run'}
            </span>
            <span className="text-[var(--faint)]">·</span>
            <span>
              <span className="text-[var(--faint)]">Due </span>
              <span className="text-[var(--warn)]">{dueDate}</span>
            </span>
          </div>
        </div>
        <div className="shrink-0 rounded-[10px] border border-[var(--line-2)] bg-[var(--ink-2)] px-4 py-2.5">
          <div className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">
            Lands in
          </div>
          <div className="mt-0.5 text-[14px] font-medium tracking-[-0.005em] text-[var(--text)]">
            Excel · Word · SharePoint
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-4">
        <Kpi label="Requirements" value={String(proposal.requirementCount ?? requirements.length)} />
        <Kpi label="Categories" value={String(categoryCounts.length || '—')} />
        <Kpi label="With citation" value={resultVisible ? '100' : '—'} unit={resultVisible ? '%' : undefined} delta={resultVisible ? 'every row' : undefined} />
        <Kpi
          label="Reviewer queue"
          value={resultVisible ? String(requirements.length) : '—'}
          accent
          delta={resultVisible ? 'human in the loop' : undefined}
        />
      </div>

      {resultVisible ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {categoryCounts.map(({ category, count }) => (
            <span
              key={category}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.02)] px-2.5 py-1 text-[11.5px] font-medium tracking-[-0.005em] text-[var(--text-2)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {categoryLabels[category]}
              <span className="demo-font-mono text-[10px] text-[var(--faint)]">{count}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Kpi({
  label,
  value,
  unit,
  delta,
  accent,
}: {
  label: string
  value: string
  unit?: string
  delta?: string
  accent?: boolean
}) {
  return (
    <div className="demo-subcard p-4">
      <div className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">
        {label}
      </div>
      <div
        className={cn(
          'mt-2 text-[26px] font-semibold leading-none tracking-[-0.025em]',
          accent ? 'text-[var(--accent)]' : 'text-[var(--text)]',
        )}
      >
        {value}
        {unit ? (
          <span className="demo-font-mono ml-1 text-[13px] font-normal tracking-normal text-[var(--muted)]">
            {unit}
          </span>
        ) : null}
      </div>
      {delta ? (
        <div className="demo-font-mono mt-2 text-[10px] uppercase tracking-[0.12em] text-[var(--signal)]">
          {delta}
        </div>
      ) : null}
    </div>
  )
}

function WaitingCanvas({ phase, activeStep }: { phase: DemoPhase; activeStep: number }) {
  const running = phase === 'running'
  const current = workflowSteps[activeStep]
  const Icon = current.icon

  return (
    <div className="flex min-h-[520px] items-center justify-center p-10">
      <div className="max-w-md text-center">
        <div
          className={cn(
            'mx-auto grid h-16 w-16 place-items-center rounded-[14px] border',
            running
              ? 'border-[rgba(166,200,242,0.5)] bg-[rgba(166,200,242,0.08)] text-[var(--accent)] demo-pulse-ring'
              : 'border-[var(--line-2)] bg-[var(--ink-2)] text-[var(--muted)]',
          )}
        >
          {running ? <Icon className="h-6 w-6 animate-pulse" /> : <Play className="h-5 w-5 fill-current" />}
        </div>

        <div className="demo-font-mono mt-6 text-[10.5px] uppercase tracking-[0.22em] text-[var(--faint)]">
          {running ? `Step 0${activeStep + 1} / 04` : 'Idle'}
        </div>
        <h3 className="mt-3 text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-[var(--text)]">
          {running ? current.label : 'Press Run Agent to begin.'}
        </h3>
        <p className="mt-3 text-[14.5px] leading-[1.55] text-[var(--muted)]">
          {running
            ? current.runningCopy
            : 'A public Library of Congress IT solicitation is queued. One click loads the reviewed compliance matrix.'}
        </p>

        {running ? (
          <div className="demo-shimmer-track mx-auto mt-8 h-[3px] w-56 rounded-full" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  )
}

function MatrixTable({
  groupedRequirements,
  onStatusChange,
}: {
  groupedRequirements: Record<string, DemoRequirement[]>
  onStatusChange: (requirementId: string, status: DemoStatus) => void
}) {
  return (
    <div className="demo-animate-fade max-h-[calc(100vh-440px)] min-h-[520px] overflow-auto">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[52px]" />
          <col />
          <col className="w-[180px]" />
          <col className="w-[140px]" />
          <col className="w-[280px]" />
        </colgroup>
        <thead className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--ink-1)]">
          <tr>
            <th className="px-4 py-3 text-left">
              <span className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">#</span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Requirement</span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Source</span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Category</span>
            </th>
            <th className="px-4 py-3 text-left">
              <span className="demo-font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--faint)]">Human review</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categoryOrder.map((category) => {
            const rows = groupedRequirements[category] ?? []
            if (!rows.length) return null

            return (
              <Fragment key={category}>
                <tr key={`${category}-heading`} className="bg-[rgba(255,255,255,0.015)]">
                  <td colSpan={5} className="border-y border-[var(--line)] px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-2)]">
                        {categoryLabels[category]}
                      </span>
                      <span className="demo-font-mono text-[10.5px] text-[var(--faint)]">· {rows.length}</span>
                    </div>
                  </td>
                </tr>
                {rows.map((requirement) => (
                  <RequirementRow
                    key={requirement._id}
                    requirement={requirement}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RequirementRow({
  requirement,
  onStatusChange,
}: {
  requirement: DemoRequirement
  onStatusChange: (requirementId: string, status: DemoStatus) => void
}) {
  const isApproved = requirement.status === 'addressed'

  const commit = (status: DemoStatus) => {
    onStatusChange(requirement._id, status)
  }

  return (
    <tr
      className={cn(
        'align-top transition-colors',
        isApproved
          ? 'bg-[rgba(125,192,154,0.04)]'
          : 'bg-transparent hover:bg-[rgba(255,255,255,0.025)]',
      )}
    >
      <td className="border-b border-[var(--line)] px-4 py-3.5">
        <span
          className={cn(
            'demo-font-mono text-[11.5px]',
            isApproved ? 'text-[var(--signal)]' : 'text-[var(--faint)]',
          )}
        >
          {String(requirement.sortOrder).padStart(2, '0')}
        </span>
      </td>
      <td className="border-b border-[var(--line)] px-4 py-3.5">
        <p className="m-0 text-[13.5px] font-normal leading-[1.55] text-[var(--text-2)]">
          {requirement.text}
        </p>
        {requirement.evaluationWeight ? (
          <span className="demo-font-mono mt-2 inline-flex rounded-md border border-[rgba(230,185,120,0.35)] bg-[rgba(230,185,120,0.08)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--warn)]">
            {requirement.evaluationWeight}
          </span>
        ) : null}
      </td>
      <td className="border-b border-[var(--line)] px-4 py-3.5">
        <span className="demo-font-mono inline-block rounded-md border border-[var(--line-2)] bg-[var(--ink-2)] px-2 py-1.5 text-[11px] leading-[1.4] text-[var(--text-2)]">
          {requirement.rfpReference}
        </span>
      </td>
      <td className="border-b border-[var(--line)] px-4 py-3.5">
        <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)]">
          {categoryLabels[requirement.category]}
        </span>
      </td>
      <td className="border-b border-[var(--line)] px-4 py-3.5">
        <ReviewControl value={requirement.status} onChange={commit} />
      </td>
    </tr>
  )
}

function ReviewControl({ value, onChange }: { value: DemoStatus; onChange: (status: DemoStatus) => void }) {
  const isApproved = value === 'addressed'

  return (
    <div className="flex items-stretch gap-1.5">
      <button
        type="button"
        onClick={() => onChange(isApproved ? 'not_started' : 'addressed')}
        aria-pressed={isApproved}
        className={cn(
          'demo-font-mono inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] transition',
          isApproved
            ? 'border-[rgba(125,192,154,0.55)] bg-[rgba(125,192,154,0.14)] text-[var(--signal)] shadow-[inset_0_0_0_1px_rgba(125,192,154,0.18)]'
            : 'border-[var(--line-2)] bg-[var(--ink-2)] text-[var(--text-2)] hover:border-[rgba(125,192,154,0.45)] hover:bg-[rgba(125,192,154,0.06)] hover:text-[var(--signal)]',
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
        {isApproved ? 'Approved' : 'Approve'}
      </button>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as DemoStatus)}
        aria-label="Review status"
        className={cn(
          'min-w-0 flex-1 rounded-md border bg-[var(--ink-2)] px-2.5 py-1.5 demo-font-mono text-[10.5px] uppercase tracking-[0.1em] outline-none transition focus:border-[var(--line-3)]',
          statusBorderClass(value),
          statusTextClass(value),
        )}
      >
        {(Object.entries(reviewLabels) as [DemoStatus, string][]).map(([status, label]) => (
          <option key={status} value={status} className="bg-[var(--ink-1)] text-[var(--text)]">
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

function statusBorderClass(status: DemoStatus) {
  switch (status) {
    case 'addressed':
      return 'border-[rgba(125,192,154,0.45)]'
    case 'partially_addressed':
      return 'border-[rgba(230,185,120,0.45)]'
    case 'not_applicable':
      return 'border-[var(--line-2)]'
    default:
      return 'border-[var(--line-2)]'
  }
}

function statusTextClass(status: DemoStatus) {
  switch (status) {
    case 'addressed':
      return 'text-[var(--signal)]'
    case 'partially_addressed':
      return 'text-[var(--warn)]'
    case 'not_applicable':
      return 'text-[var(--faint)]'
    default:
      return 'text-[var(--text-2)]'
  }
}

function FooterStrip() {
  return (
    <footer className="mt-7 flex flex-col items-start justify-between gap-3 border-t border-[var(--line)] pt-5 md:flex-row md:items-center">
      <div className="flex items-center gap-2.5">
        <span className="grid h-5 w-5 place-items-center rounded-[4px] bg-[var(--text)] text-[10.5px] font-bold leading-none tracking-[-0.02em] text-[var(--ink)]">
          V
        </span>
        <span className="demo-font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Varholdt AI · Human-reviewed document workflow agents
        </span>
      </div>
      <div className="demo-font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--faint)]">
        Internal demo · Recorded walkthrough
      </div>
    </footer>
  )
}

function formatSeconds(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const seconds = total % 60
  const minutes = Math.floor(total / 60)
  const tenths = Math.floor((ms % 1000) / 100)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}
