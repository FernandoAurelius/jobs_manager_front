import { api } from '@/api/generated/api'
import type {
  QuoteSpreadsheet,
  PreviewQuoteResponse,
  ApplyQuoteResponse,
  Job,
  LinkQuoteSheetRequest,
  QuoteImportStatusResponse,
} from '@/api/generated/api'
import type { QuoteImportPreviewResponse, QuoteImportResponse } from '@/api/local/schemas'

class QuoteService {
  async linkQuote(jobId: string, templateUrl?: string): Promise<QuoteSpreadsheet> {
    const payload: LinkQuoteSheetRequest = templateUrl ? { template_url: templateUrl } : {}

    await api.job_rest_jobs_quote_link_create(payload, {
      params: {
        pk: jobId,
      },
    })

    // The endpoint only returns { template_url }, but we need to return QuoteSpreadsheet
    // Let's fetch the updated job to get the complete quote_sheet
    const jobResponse = await api.job_rest_jobs_retrieve({}, { params: { job_id: jobId } })
    return jobResponse.quote_sheet
  }

  async previewQuote(jobId: string): Promise<PreviewQuoteResponse> {
    return await api.job_rest_jobs_quote_preview_create(
      {},
      {
        params: {
          pk: jobId,
        },
      },
    )
  }

  async applyQuote(jobId: string): Promise<ApplyQuoteResponse> {
    return await api.job_rest_jobs_quote_apply_create(
      {},
      {
        params: {
          pk: jobId,
        },
      },
    )
  }

  hasLinkedSheet(job: Job): boolean {
    return !!job?.quote_sheet?.sheet_url
  }

  getSheetUrl(job: Job): string | null {
    return job?.quote_sheet?.sheet_url || null
  }

  // File upload endpoints (not available in Zodios API yet)
  async previewQuoteImport(jobId: string, file: File): Promise<QuoteImportPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.axiosInstance.post(
      `/job/rest/jobs/${jobId}/quote/import/preview/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  }

  async importQuote(
    jobId: string,
    file: File,
    skipValidation: boolean = false,
  ): Promise<QuoteImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (skipValidation) {
      formData.append('skip_validation', 'true')
    }

    const response = await api.axiosInstance.post(
      `/job/rest/jobs/${jobId}/quote/import/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  }

  async getQuoteStatus(jobId: string): Promise<QuoteImportStatusResponse> {
    return await api.job_rest_jobs_quote_status_retrieve({ params: { job_id: jobId } })
  }
}

export const quoteService = new QuoteService()
