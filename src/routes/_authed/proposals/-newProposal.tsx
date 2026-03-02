import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Star, Upload, Link2, Hash, ArrowRight, ArrowLeft } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { cn } from '../../../lib/utils'

type InputType = 'sam_url' | 'solicitation_num' | 'pdf_upload'

export function NewProposalPage() {
  const navigate = useNavigate()
  const createProposal = useMutation(api.proposals.create)
  const generateUploadUrl = useMutation(api.proposals.generateUploadUrl)

  const [inputType, setInputType] = useState<InputType>('sam_url')
  const [inputValue, setInputValue] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    !isSubmitting &&
    ((inputType === 'pdf_upload' && Boolean(selectedFile)) ||
      (inputType !== 'pdf_upload' && inputValue.trim().length > 0))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!canSubmit) return

    setError(null)
    setIsSubmitting(true)

    try {
      let rfpFileIds: Id<'_storage'>[] | undefined
      let submissionValue = inputValue.trim()

      if (inputType === 'pdf_upload' && selectedFile) {
        const allowedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        const extension = selectedFile.name.split('.').pop()?.toLowerCase()
        const isSupportedExtension = extension === 'pdf' || extension === 'docx'
        const isSupportedMime = allowedFileTypes.includes(selectedFile.type) || selectedFile.type === ''

        if (!isSupportedExtension || !isSupportedMime) {
          throw new Error('Only PDF and DOCX files are supported for MVP.')
        }

        const uploadUrl = await generateUploadUrl({})
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
          body: selectedFile,
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed. Please try again.')
        }

        const uploadResult = (await uploadResponse.json()) as { storageId?: string }

        if (!uploadResult.storageId) {
          throw new Error('Upload succeeded but no storage ID was returned.')
        }

        rfpFileIds = [uploadResult.storageId as Id<'_storage'>]
        submissionValue = selectedFile.name
      }

      const proposalId = await createProposal({
        inputType,
        inputValue: submissionValue,
        rfpFileIds,
      })

      navigate({
        to: '/proposals/$proposalId',
        params: { proposalId: proposalId as string },
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to start proposal processing')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputOptions = [
    { value: 'sam_url' as const, label: 'SAM.gov URL', icon: <Link2 className="w-4 h-4" />, desc: 'Paste a link from SAM.gov' },
    { value: 'solicitation_num' as const, label: 'Solicitation #', icon: <Hash className="w-4 h-4" />, desc: 'Enter a solicitation number' },
    { value: 'pdf_upload' as const, label: 'Upload File', icon: <Upload className="w-4 h-4" />, desc: 'Upload a PDF or DOCX' },
  ]

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

        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 sm:py-14 relative">
          <Link to="/proposals" className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-sm font-semibold mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to proposals
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-white fill-white" />
              ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">New Proposal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Parse an RFP</h1>
          <p className="mt-2 text-blue-200 text-sm sm:text-base max-w-xl">
            Provide a SAM.gov URL, solicitation number, or upload an RFP file to generate a compliance matrix.
          </p>
        </div>

        <div className="flex h-1.5">
          <div className="flex-1 bg-red-700" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-blue-900" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <form onSubmit={onSubmit} className="space-y-8">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 block">Input Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {inputOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setInputType(option.value)
                    setError(null)
                  }}
                  className={cn(
                    'border p-4 text-left transition-all group',
                    inputType === option.value
                      ? 'border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:shadow-sm',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 flex items-center justify-center mb-2 transition-colors',
                    inputType === option.value
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-900',
                  )}>
                    {option.icon}
                  </div>
                  <div className="font-bold text-sm">{option.label}</div>
                  <div className={cn(
                    'text-xs mt-0.5',
                    inputType === option.value ? 'text-blue-200' : 'text-slate-400',
                  )}>
                    {option.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 block">
              {inputType === 'sam_url' ? 'SAM.gov URL' : inputType === 'solicitation_num' ? 'Solicitation Number' : 'RFP Document'}
            </label>

            {inputType === 'pdf_upload' ? (
              <label
                htmlFor="rfp-upload"
                className={cn(
                  'block cursor-pointer border-2 border-dashed p-8 sm:p-10 text-center transition-all',
                  selectedFile
                    ? 'border-blue-900 bg-blue-50'
                    : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50',
                )}
              >
                <input
                  id="rfp-upload"
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(event) => {
                    setSelectedFile(event.target.files?.[0] ?? null)
                    setError(null)
                  }}
                />
                <Upload className={cn(
                  'w-8 h-8 mx-auto mb-3',
                  selectedFile ? 'text-blue-900' : 'text-slate-400',
                )} />
                <div className={cn(
                  'font-bold text-sm',
                  selectedFile ? 'text-blue-900' : 'text-slate-600',
                )}>
                  {selectedFile ? selectedFile.name : 'Click to select a .pdf or .docx file'}
                </div>
                {!selectedFile && (
                  <div className="text-xs text-slate-400 mt-1">Supports PDF and DOCX formats</div>
                )}
              </label>
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value)
                  setError(null)
                }}
                required
                placeholder={
                  inputType === 'sam_url'
                    ? 'https://sam.gov/opp/{noticeId}/view'
                    : 'e.g. W911NF-24-R-0001'
                }
                className="w-full border border-slate-300 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            )}
          </div>

          {error ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-red-700 text-white px-6 py-4 font-bold text-base hover:bg-red-600 transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-red-700/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                Starting workflow...
              </>
            ) : (
              <>
                Create Proposal
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </section>
    </>
  )
}
