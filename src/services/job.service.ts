import { api, schemas } from '../api/generated/api'
import axios from '@/plugins/axios'
import { z } from 'zod'
import type { AdvancedFilters, JobStatusUpdate, JobReorderPayload } from '../api/local/schemas'

type KanbanJob = z.infer<typeof schemas.KanbanJob>
type JobCreateRequest = z.infer<typeof schemas.JobCreateRequest>
type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type JobUpdateRequest = z.infer<typeof schemas.JobUpdateRequest>
type JobFile = z.infer<typeof schemas.JobFile>
type FetchAllJobsResponse = z.infer<typeof schemas.FetchAllJobsResponse>
type FetchJobsResponse = z.infer<typeof schemas.FetchJobsResponse>
type FetchJobsByColumnResponse = z.infer<typeof schemas.FetchJobsByColumnResponse>
type FetchStatusValuesResponse = z.infer<typeof schemas.FetchStatusValuesResponse>
type AdvancedSearchResponse = z.infer<typeof schemas.AdvancedSearchResponse>
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>
type PaginatedCompleteJobList = z.infer<typeof schemas.PaginatedCompleteJobList>

/**
 * Clean job service using ONLY Zodios API
 */
export const jobService = {
  // Job retrieval
  getAllJobs(): Promise<FetchAllJobsResponse> {
    return api.job_api_jobs_fetch_all_retrieve()
  },

  getJobsByStatus(status: string): Promise<FetchJobsResponse> {
    return api.job_api_jobs_fetch_retrieve({ params: { status } })
  },

  getJobsByColumn(columnId: string): Promise<FetchJobsByColumnResponse> {
    return api.job_api_jobs_fetch_by_column_retrieve({ params: { column_id: columnId } })
  },

  getStatusChoices(): Promise<FetchStatusValuesResponse> {
    return Promise.resolve({
      success: true,
      statuses: {
        draft: 'Draft',
        awaiting_approval: 'Awaiting Approval',
        approved: 'Approved',
        in_progress: 'In Progress',
        unusual: 'Unusual',
        recently_completed: 'Recently Completed',
      },
      tooltips: {
        draft: 'Initial job creation - quote being prepared',
        awaiting_approval: 'Quote submitted and waiting for customer approval',
        approved: 'Quote approved and ready to start work',
        in_progress: 'Work has started on this job',
        unusual: 'Jobs requiring special attention or unusual circumstances',
        recently_completed: 'Work has just finished on this job',
      },
    })
    // return api.job_api_jobs_status_values_retrieve()
  },

  searchJobs(): Promise<AdvancedSearchResponse> {
    return api.job_api_jobs_advanced_search_retrieve()
  },

  // Job CRUD
  createJob(jobData: JobCreateRequest): Promise<Job> {
    return api.job_rest_jobs_create(jobData)
  },

  getJob(jobId: string): Promise<JobDetailResponse> {
    return api.job_rest_jobs_retrieve({ params: { job_id: jobId } })
  },

  deleteJob(jobId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    return api
      .job_rest_jobs_destroy(undefined, { params: { job_id: jobId } })
      .then((response) => ({
        success: response.success,
        message: response.message,
      }))
      .catch((error) => ({
        success: false,
        error: error.message || 'Failed to delete job',
      }))
  },

  // Archive
  getCompletedJobs(): Promise<PaginatedCompleteJobList> {
    return api.job_api_job_completed_list()
  },

  archiveJobs(jobIds: string[]): Promise<{ message: string }> {
    return api.job_api_job_completed_archive_create({ ids: jobIds })
  },

  // Files
  listJobFiles(jobNumber: string): Promise<JobFile[]> {
    const result = api.retrieveJobFilesApi_6({
      params: { job_number: parseInt(jobNumber) },
      queries: { format: 'json' },
    })
    return result.then((r) => (Array.isArray(r) ? r : [r]))
  },

  // PDF
  async getWorkshopPdf(jobId: string): Promise<Blob> {
    try {
      const response = await axios.get(`/job/rest/jobs/${jobId}/workshop-pdf/`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error fetching workshop PDF:', error)
      throw error
    }
  },

  // Settings
  getCompanyDefaults(): Promise<CompanyDefaults> {
    return api.api_company_defaults_retrieve()
  },

  // Quote
  getQuoteStatus(jobId: string): Promise<{ status: string }> {
    return api.job_rest_jobs_quote_status_retrieve({ params: { job_id: jobId } })
  },

  // Local search
  searchJobsLocal(jobs: KanbanJob[], query: string): KanbanJob[] {
    if (!query) return jobs

    const searchTerm = query.toLowerCase()
    return jobs.filter(
      (job) =>
        job.name?.toLowerCase().includes(searchTerm) ||
        job.client_name?.toLowerCase().includes(searchTerm) ||
        job.job_number?.toLowerCase().includes(searchTerm) ||
        job.description?.toLowerCase().includes(searchTerm),
    )
  },

  // Advanced search with filters
  async performAdvancedSearch(filters: AdvancedFilters): Promise<AdvancedSearchResponse> {
    const response = await api.job_api_jobs_advanced_search_retrieve({
      queries: {
        job_number: filters.job_number || undefined,
        name: filters.name || undefined,
        description: filters.description || undefined,
        client_name: filters.client_name || undefined,
        contact_person: filters.contact_person || undefined,
        created_by: filters.created_by || undefined,
        status: filters.status.length > 0 ? filters.status : undefined,
        created_after: filters.created_after || undefined,
        created_before: filters.created_before || undefined,
        paid: filters.paid || undefined,
        xero_invoice_params: filters.xero_invoice_params || undefined, // Xero Invoice Number or ID
      },
    })
    return response
  },

  // Update job status
  updateJobStatus(jobId: string, newStatus: string): Promise<JobStatusUpdate> {
    return api.job_api_jobs_update_status_create(
      { status: newStatus },
      { params: { job_id: jobId } },
    )
  },

  // Update job data
  async updateJob(
    jobId: string,
    jobData: JobUpdateRequest,
  ): Promise<{ success: boolean; data?: JobDetailResponse; error?: string }> {
    try {
      const response = await api.job_rest_jobs_update(jobData, { params: { job_id: jobId } })
      return {
        success: response.success || true,
        data: response.data || response,
      }
    } catch (error) {
      console.error('Error updating job:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating job',
      }
    }
  },

  // Reorder job
  reorderJob(jobId: string, beforeId?: string, afterId?: string, status?: string): Promise<Job> {
    const payload: JobReorderPayload = {}
    if (beforeId) payload.before_id = beforeId
    if (afterId) payload.after_id = afterId
    if (status) payload.status = status

    return api.job_api_jobs_reorder_create(payload, { params: { job_id: jobId } })
  },

  // Add job event
  async addJobEvent(jobId: string, description: string): Promise<unknown> {
    try {
      const response = await api.job_rest_jobs_events_create(
        { description },
        { params: { job_id: jobId } },
      )

      return response
    } catch (error) {
      console.error('Error adding job event:', error)
      throw error
    }
  },

  // Upload job files
  async uploadJobFiles(jobNumber: string, files: File[]): Promise<unknown> {
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await axios.post(`/job/api/job-files/${jobNumber}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          format: 'json',
        },
      })

      return response.data
    } catch (error) {
      console.error('Error uploading job files:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      throw error
    }
  },
}

export default jobService
