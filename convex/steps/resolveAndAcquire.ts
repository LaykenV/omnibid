'use node'

import type { Id } from '../_generated/dataModel'
import { isIP } from 'node:net'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { v } from 'convex/values'

function normalizeHost(hostname: string): string {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1)
  }
  return hostname
}

function isPrivateIpv4(ip: string): boolean {
  const octets = ip.split('.').map((part) => Number(part))
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
    return false
  }

  const [first, second] = octets
  if (first === 10) return true
  if (first === 127) return true
  if (first === 0) return true
  if (first === 192 && second === 168) return true
  if (first === 172 && second >= 16 && second <= 31) return true
  if (first === 169 && second === 254) return true
  if (first === 100 && second >= 64 && second <= 127) return true

  return false
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::' || normalized === '::1') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true
  }
  if (normalized.startsWith('::ffff:')) return true

  return false
}

function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false

    const hostname = normalizeHost(parsed.hostname.toLowerCase())
    if (
      hostname === 'localhost' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    ) {
      return false
    }

    const ipVersion = isIP(hostname)
    if (ipVersion === 4 && isPrivateIpv4(hostname)) {
      return false
    }

    if (ipVersion === 6 && isPrivateIpv6(hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function fileTypeFromName(name: string): string {
  const cleanName = name.split('?')[0]
  const extension = cleanName.split('.').pop()?.toLowerCase()

  if (extension === 'pdf') return 'pdf'
  if (extension === 'docx') return 'docx'
  return ''
}

function safeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function extractNoticeId(input: string): string | undefined {
  const match = input.match(/\/opp\/([^/]+)\/view/i)
  return match?.[1]
}

export const resolveAndAcquire = internalAction({
  args: {
    proposalId: v.id('proposals'),
  },
  handler: async (ctx, args): Promise<Array<Id<'rfpDocuments'>>> => {
    const proposal = await ctx.runQuery(internal.proposals.getInternal, {
      proposalId: args.proposalId,
    })

    if (!proposal) {
      throw new Error('Proposal not found')
    }

    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: 'resolving',
      statusMessage: 'Resolving solicitation and acquiring documents...',
    })

    const documentIds: Array<Id<'rfpDocuments'>> = []

    if (proposal.inputType === 'pdf_upload') {
      if (!proposal.rfpFileIds?.length) {
        throw new Error(
          'No files were uploaded. Please select a PDF or DOCX file and try again.',
        )
      }

      for (const fileId of proposal.rfpFileIds) {
        const fileType = fileTypeFromName(proposal.inputValue) || 'pdf'
        const documentId = await ctx.runMutation(internal.rfpDocuments.create, {
          proposalId: args.proposalId,
          fileName: proposal.inputValue,
          fileType,
          fileId,
          status: 'downloaded',
        })

        documentIds.push(documentId)
      }

      return documentIds
    }

    const apiKey = process.env.SAM_GOV_API_KEY
    if (!apiKey) {
      throw new Error(
        'SAM_GOV_API_KEY is not configured. Upload a PDF manually or set the API key in Convex env.',
      )
    }

    const params = new URLSearchParams({
      limit: '1',
    })

    if (proposal.inputType === 'sam_url') {
      const noticeId = extractNoticeId(proposal.inputValue)
      if (!noticeId) {
        throw new Error(
          'Could not parse SAM.gov notice ID from URL. Use format https://sam.gov/opp/{noticeId}/view or upload a PDF.',
        )
      }
      params.set('noticeid', noticeId)
    }

    if (proposal.inputType === 'solicitation_num') {
      params.set('solnum', proposal.inputValue)
    }

    const now = new Date()
    const fiveYearsAgo = new Date(now)
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

    params.set('postedFrom', formatDate(fiveYearsAgo))
    params.set('postedTo', formatDate(now))

    const searchUrl = `https://api.sam.gov/prod/opportunities/v2/search?${params.toString()}`
    const searchResponse = await fetch(searchUrl, {
      headers: { 'X-Api-Key': apiKey },
    })

    if (!searchResponse.ok) {
      throw new Error(
        `SAM.gov API request failed (${searchResponse.status}). Upload the RFP manually if this persists.`,
      )
    }

    const searchJson = (await searchResponse.json()) as {
      opportunitiesData?: Array<Record<string, unknown>>
    }

    const opportunity = searchJson.opportunitiesData?.[0]
    if (!opportunity) {
      throw new Error(
        'No matching SAM.gov opportunity found. Verify the URL/solicitation number or upload the RFP manually.',
      )
    }

    const resourceLinks = Array.isArray(opportunity.resourceLinks)
      ? opportunity.resourceLinks.filter((link): link is string => typeof link === 'string')
      : []

    await ctx.runMutation(internal.proposals.patchSolicitation, {
      proposalId: args.proposalId,
      solicitation: {
        noticeId: safeString(opportunity.noticeId),
        solicitationNumber: safeString(opportunity.solicitationNumber),
        title: safeString(opportunity.title),
        agency: safeString(opportunity.fullParentPathName),
        subAgency: safeString(opportunity.departmentName),
        postedDate: safeString(opportunity.postedDate),
        responseDeadline: safeString(opportunity.responseDeadLine),
        naicsCode: safeString(opportunity.naicsCode),
        classificationCode: safeString(opportunity.classificationCode),
        setAsideCode: safeString(opportunity.typeOfSetAside),
        setAsideDescription: safeString(opportunity.typeOfSetAsideDescription),
        contractType: safeString(opportunity.type),
        placeOfPerformance: safeString(
          (opportunity.placeOfPerformance as { streetAddress?: string } | undefined)
            ?.streetAddress,
        ),
        pointOfContact: safeString(
          (opportunity.pointOfContact as Array<{ email?: string }> | undefined)?.[0]
            ?.email,
        ),
        uiLink: safeString(opportunity.uiLink),
      },
      title: safeString(opportunity.title) || proposal.title,
      resourceLinks,
    })

    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: 'resolving',
      statusMessage: `Downloading ${resourceLinks.length} linked file(s)...`,
    })

    for (const link of resourceLinks) {
      if (!isUrlSafe(link)) {
        continue
      }

      const fileType = fileTypeFromName(link)
      if (!['pdf', 'docx'].includes(fileType)) {
        continue
      }

      try {
        const response = await fetch(link, { redirect: 'follow' })
        if (!response.ok) {
          continue
        }

        // Validate final URL after redirects to prevent SSRF
        if (response.url && !isUrlSafe(response.url)) {
          continue
        }

        const blob = await response.blob()
        const fileName = decodeURIComponent(
          link.split('/').pop()?.split('?')[0] || `document.${fileType}`,
        )

        const storageId = await ctx.storage.store(blob)
        const documentId = await ctx.runMutation(internal.rfpDocuments.create, {
          proposalId: args.proposalId,
          fileName,
          fileType,
          fileId: storageId,
          sourceUrl: link,
          status: 'downloaded',
        })

        documentIds.push(documentId)
      } catch {
        // Ignore single-link failures and continue with remaining documents.
      }
    }

    if (documentIds.length === 0) {
      throw new Error(
        'No downloadable PDF/DOCX files found for this opportunity. Upload the RFP manually to continue.',
      )
    }

    return documentIds
  },
})
