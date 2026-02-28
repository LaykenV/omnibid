'use node'

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { v } from 'convex/values'
import { GEMINI_MODEL } from '../constants'

const extractionSchema = z.object({
  metadata: z.object({
    solicitationNumber: z.string().optional(),
    title: z.string().optional(),
    agency: z.string().optional(),
    responseDeadline: z.string().optional(),
    naicsCode: z.string().optional(),
    setAsideDescription: z.string().optional(),
    contractType: z.string().optional(),
    estimatedValue: z.string().optional(),
    placeOfPerformance: z.string().optional(),
  }),
  formatting: z.object({
    pageLimit: z.number().optional(),
    fontFamily: z.string().optional(),
    fontSize: z.number().optional(),
    margins: z.string().optional(),
    lineSpacing: z.string().optional(),
    volumes: z.array(z.string()).optional(),
  }),
  requirements: z.array(
    z.object({
      category: z.enum([
        'mandatory',
        'evaluation_factor',
        'formatting',
        'deliverable',
        'certification',
        'personnel',
        'other',
      ]),
      text: z.string(),
      rfpReference: z.string(),
      rfpSection: z.string().optional(),
      volume: z.string().optional(),
      evaluationWeight: z.string().optional(),
    }),
  ),
})

function toMimeType(fileType: string): string {
  if (fileType === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  return 'application/pdf'
}

export const extractRequirements = internalAction({
  args: {
    proposalId: v.id('proposals'),
    documentIds: v.array(v.id('rfpDocuments')),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.proposals.updateStatus, {
      proposalId: args.proposalId,
      status: 'extracting',
      statusMessage: 'Extracting metadata and requirements from RFP...',
    })

    // Delete any requirements from prior attempts (makes retries idempotent)
    const existingRequirements = await ctx.runQuery(
      internal.requirements.listByProposalInternal,
      { proposalId: args.proposalId },
    )
    for (const req of existingRequirements) {
      await ctx.runMutation(internal.requirements.remove, {
        requirementId: req._id,
      })
    }

    for (const documentId of args.documentIds) {
      const document = await ctx.runQuery(internal.rfpDocuments.get, {
        documentId,
      })

      if (!document) {
        continue
      }

      const blob = await ctx.storage.get(document.fileId)
      if (!blob) {
        await ctx.runMutation(internal.rfpDocuments.updateStatus, {
          documentId,
          status: 'failed',
          errorMessage: 'Source file missing from storage',
        })
        continue
      }

      await ctx.runMutation(internal.rfpDocuments.updateStatus, {
        documentId,
        status: 'processing',
      })

      const startTime = Date.now()

      try {
        const fileBytes = new Uint8Array(await blob.arrayBuffer())
        const { object, usage } = await generateObject({
          model: google(GEMINI_MODEL),
          schema: extractionSchema,
          providerOptions: {
            google: {
              structuredOutputs: true,
            },
          },
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'file',
                  data: fileBytes,
                  mediaType: toMimeType(document.fileType),
                },
                {
                  type: 'text',
                  text: `You are an expert federal proposal compliance analyst.

Analyze this solicitation document and extract:
1) metadata,
2) formatting instructions, and
3) every requirement that must be tracked in a compliance matrix.

Be exhaustive. Missing a single requirement can disqualify a proposal.
For each requirement, include the most precise citation possible (section/page/paragraph).`,
                },
              ],
            },
          ],
        })

        await ctx.runMutation(internal.rawExtractions.create, {
          proposalId: args.proposalId,
          documentId,
          model: GEMINI_MODEL,
          extractionType: 'requirements',
          rawOutput: JSON.stringify(object),
          tokenUsage: usage
            ? {
                promptTokens: usage.inputTokens ?? 0,
                completionTokens: usage.outputTokens ?? 0,
              }
            : undefined,
          durationMs: Date.now() - startTime,
        })

        const proposal = await ctx.runQuery(internal.proposals.getInternal, {
          proposalId: args.proposalId,
        })

        const existing = proposal?.solicitation ?? {}

        await ctx.runMutation(internal.proposals.patchMetadata, {
          proposalId: args.proposalId,
          solicitation: {
            ...existing,
            solicitationNumber:
              existing.solicitationNumber || object.metadata.solicitationNumber,
            title: existing.title || object.metadata.title,
            agency: existing.agency || object.metadata.agency,
            responseDeadline:
              existing.responseDeadline || object.metadata.responseDeadline,
            naicsCode: existing.naicsCode || object.metadata.naicsCode,
            setAsideDescription:
              existing.setAsideDescription || object.metadata.setAsideDescription,
            contractType: existing.contractType || object.metadata.contractType,
            estimatedValue: existing.estimatedValue || object.metadata.estimatedValue,
            placeOfPerformance:
              existing.placeOfPerformance || object.metadata.placeOfPerformance,
          },
          formatting: object.formatting,
        })

        if (object.requirements.length > 0) {
          await ctx.runMutation(internal.requirements.bulkInsert, {
            proposalId: args.proposalId,
            requirements: object.requirements.map((requirement, index) => ({
              category: requirement.category,
              text: requirement.text,
              rfpReference: requirement.rfpReference,
              rfpSection: requirement.rfpSection,
              volume: requirement.volume,
              evaluationWeight: requirement.evaluationWeight,
              sortOrder: index + 1,
            })),
          })
        }

        await ctx.runMutation(internal.rfpDocuments.updateStatus, {
          documentId,
          status: 'processed',
        })
      } catch (error) {
        await ctx.runMutation(internal.rfpDocuments.updateStatus, {
          documentId,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // If every document failed (storage miss, parse error, etc.), throw so the
    // workflow surfaces an error instead of silently proceeding with 0 requirements.
    const processedDocs = await ctx.runQuery(internal.rfpDocuments.listByProposal, {
      proposalId: args.proposalId,
    })
    const anySucceeded = processedDocs.some((d) => d.status === 'processed')
    if (!anySucceeded) {
      throw new Error(
        'All documents failed to process. Check that the uploaded files are valid PDF or DOCX documents.',
      )
    }
  },
})
