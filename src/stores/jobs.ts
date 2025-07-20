import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { schemas } from '@/api/generated/api'
import {
  JobDetailResponseWithFinancialDataSchema,
  KanbanJobUISchema,
  JobEventSchema,
} from '@/api/local/schemas'
import { debugLog } from '@/utils/debug'
import type { z } from 'zod'

type JobDetail = z.infer<typeof JobDetailResponseWithFinancialDataSchema>['data']
type JobEvent = z.infer<typeof JobEventSchema>
type KanbanJobUI = z.infer<typeof KanbanJobUISchema>
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>

export const useJobsStore = defineStore('jobs', () => {
  const detailedJobs = ref<Record<string, JobDetail>>({})
  const kanbanJobs = ref<Record<string, KanbanJobUI>>({})
  const currentJobId = ref<string | null>(null)
  const isLoadingJob = ref(false)
  const isLoadingKanban = ref(false)
  const currentContext = ref<'kanban' | 'detail' | null>(null)

  const currentJob = computed(() => {
    if (!currentJobId.value) return null
    return detailedJobs.value[currentJobId.value] || null
  })

  const allKanbanJobs = computed(() => {
    return Object.values(kanbanJobs.value)
  })

  const getJobById = computed(() => {
    return (id: string): JobDetail | null => {
      return detailedJobs.value[id] || null
    }
  })

  const getKanbanJobById = computed(() => {
    return (id: string): KanbanJobUI | null => {
      return kanbanJobs.value[id] || null
    }
  })

  const setDetailedJob = (job: JobDetail): void => {
    if (!job) {
      debugLog('🚨 Store - setDetailedJob called with null/undefined job')
      console.trace('Stack trace for undefined job call')
      return
    }

    if (!job.id || typeof job.id !== 'string') {
      debugLog('🚨 Store - setDetailedJob called with invalid job.id:', job.id, 'Full job:', job)
      console.trace('Stack trace for invalid job.id call')
      return
    }

    const existingJob = detailedJobs.value[job.id]
    if (existingJob && JSON.stringify(existingJob) === JSON.stringify(job)) {
      debugLog('🔄 Store - Job data identical, skipping update to prevent loop:', job.id)
      return
    }

    debugLog('🏪 Store - setDetailedJob called with job:', job.id, 'job_status:', job.job_status)
    debugLog(
      '🏪 Store - Before update, current job in store:',
      detailedJobs.value[job.id]?.job_status || 'NOT_FOUND',
    )

    const newJob = { ...job }
    detailedJobs.value = {
      ...detailedJobs.value,
      [job.id]: newJob,
    }

    debugLog('🏪 Store - After update, job in store:', detailedJobs.value[job.id]?.job_status)

    if (kanbanJobs.value[job.id]) {
      debugLog('🏪 Store - Also updating kanban job')
      updateKanbanJobFromDetailed(newJob)
    }
  }

  const updateDetailedJob = (jobId: string, updates: Partial<JobDetail>): void => {
    const existingJob = detailedJobs.value[jobId]
    if (existingJob) {
      const updatedJob = { ...existingJob, ...updates }
      detailedJobs.value = {
        ...detailedJobs.value,
        [jobId]: updatedJob,
      }

      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(updatedJob)
      }
    }
  }

  const removeDetailedJob = (jobId: string): void => {
    delete detailedJobs.value[jobId]
  }

  const setKanbanJobs = (jobs: KanbanJobUI[]): void => {
    kanbanJobs.value = {}
    jobs.forEach((job) => {
      kanbanJobs.value[job.id] = job
    })
  }

  const setKanbanJob = (job: KanbanJobUI): void => {
    kanbanJobs.value[job.id] = job
  }

  const updateKanbanJob = (jobId: string, updates: Partial<KanbanJobUI>): void => {
    const existingJob = kanbanJobs.value[jobId]
    if (existingJob) {
      kanbanJobs.value[jobId] = { ...existingJob, ...updates }
    }
  }

  const removeKanbanJob = (jobId: string): void => {
    delete kanbanJobs.value[jobId]
  }

  const updateKanbanJobFromDetailed = (detailedJob: JobDetail): void => {
    const kanbanJob = kanbanJobs.value[detailedJob.id]
    if (kanbanJob) {
      kanbanJobs.value[detailedJob.id] = {
        ...kanbanJob,
        name: detailedJob.name,
        job_status: detailedJob.job_status,
        client_name: detailedJob.client_name,
        contact_person: detailedJob.contact_name || kanbanJob.contact_person,
        paid: detailedJob.paid || false,
      }
    }
  }

  const setCurrentJobId = (jobId: string | null): void => {
    currentJobId.value = jobId
  }

  const setCurrentContext = (context: 'kanban' | 'detail' | null): void => {
    currentContext.value = context
  }

  const setLoadingJob = (loading: boolean): void => {
    isLoadingJob.value = loading
  }

  const setLoadingKanban = (loading: boolean): void => {
    isLoadingKanban.value = loading
  }

  const clearDetailedJobs = (): void => {
    detailedJobs.value = {}
    currentJobId.value = null
  }

  const clearKanbanJobs = (): void => {
    kanbanJobs.value = {}
  }

  const clearAll = (): void => {
    clearDetailedJobs()
    clearKanbanJobs()
    currentContext.value = null
  }

  const updateJobStatus = (jobId: string, newStatus: string): void => {
    updateDetailedJob(jobId, { job_status: newStatus })

    updateKanbanJob(jobId, { job_status: newStatus })
  }

  const updateJobEvents = (jobId: string, events: JobEvent[]): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, events }
    }
  }

  const addJobEvent = (jobId: string, event: JobEvent): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      const events = job.events || []
      detailedJobs.value[jobId] = { ...job, events: [event, ...events] }
    }
  }

  const updateJobCompanyDefaults = (jobId: string, companyDefaults: CompanyDefaults): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, company_defaults: companyDefaults }
    }
  }

  const updateJobPartialData = (jobId: string, partialData: Partial<JobDetail>): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, ...partialData }

      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(detailedJobs.value[jobId])
      }
    }
  }

  async function fetchJob(jobId: string): Promise<unknown> {
    if (!jobId) return undefined

    try {
      const { jobService } = await import('@/services/job.service')
      const response = await jobService.getJob(jobId)

      if (response.success && response.data?.job) {
        setDetailedJob(response.data.job)
        return { job: response.data.job, events: response.data.events || [] }
      }

      if (response.job) {
        setDetailedJob(response.job)
        return { job: response.job, events: response.events || [] }
      }

      throw new Error('Job not found')
    } catch (error) {
      debugLog('❌ Store - fetchJob error:', error)
      throw error
    }
  }

  return {
    detailedJobs,
    kanbanJobs,
    currentJobId,
    isLoadingJob,
    isLoadingKanban,
    currentContext,

    currentJob,
    allKanbanJobs,
    getJobById,
    getKanbanJobById,

    setDetailedJob,
    updateDetailedJob,
    removeDetailedJob,
    setKanbanJobs,
    setKanbanJob,
    updateKanbanJob,
    removeKanbanJob,
    setCurrentJobId,
    setCurrentContext,
    setLoadingJob,
    setLoadingKanban,
    clearDetailedJobs,
    clearKanbanJobs,

    clearAll,
    updateJobStatus,
    updateJobEvents,
    addJobEvent,
    updateJobCompanyDefaults,
    updateJobPartialData,

    fetchJob,
  }
})
