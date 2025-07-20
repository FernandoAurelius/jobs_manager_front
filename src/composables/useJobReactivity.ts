import { useJobsStore } from '@/stores/jobs'
import { jobService } from '@/services/job.service'
import type { JobDetailResponse } from '@/api/generated/api'
import { useJobCache } from './useJobCache'
import { debugLog } from '@/utils/debug'

export function useJobReactivity() {
  const jobsStore = useJobsStore()
  const { setCachedJob, updateCachedJob, withCache } = useJobCache()

  const ongoingReloads = new Set<string>()

  const updateJobReactively = (jobId: string, updates: Partial<JobDetailResponse>) => {
    jobsStore.updateJobPartialData(jobId, updates)
    updateCachedJob(jobId, updates)
    debugLog(`🔄 Job ${jobId} updated reactively:`, Object.keys(updates))
  }

  const addEventReactively = (jobId: string, event: { description: string }) => {
    jobsStore.addJobEvent(jobId, event)
    debugLog(`📝 Event added reactively to job ${jobId}:`, event.description)
  }

  const updateStatusReactively = (jobId: string, newStatus: string) => {
    jobsStore.updateJobStatus(jobId, newStatus)
    debugLog(`📊 Status updated reactively for job ${jobId}:`, newStatus)
  }

  const reloadJobDataReactively = async (jobId: string, forceReload = false): Promise<void> => {
    if (ongoingReloads.has(jobId)) {
      debugLog(`⏳ Job ${jobId} reload already in progress, skipping duplicate request`)
      return
    }

    ongoingReloads.add(jobId)

    try {
      const loadFromAPI = async () => {
        const response = await jobService.getJob(jobId)

        if (!response.success || !response.data) {
          throw new Error('Failed to load job data from API')
        }

        return {
          ...response.data.job,
          latest_pricings: response.data.latest_pricings || {},
          events: response.data.events || [],
          company_defaults: response.data.company_defaults || null,
        }
      }

      let enrichedJob: JobDetailResponse

      if (forceReload) {
        enrichedJob = await loadFromAPI()
      } else {
        enrichedJob = await withCache(jobId, loadFromAPI)
      }

      jobsStore.setDetailedJob(enrichedJob)
      setCachedJob(jobId, enrichedJob)

      debugLog(
        `♻️ Job ${jobId} data reloaded reactively ${forceReload ? '(forced)' : '(with cache)'}`,
      )
    } catch (error) {
      debugLog(`Error reloading job ${jobId}:`, error)
      throw error
    } finally {
      ongoingReloads.delete(jobId)
    }
  }

  return {
    updateJobReactively,
    addEventReactively,
    updateStatusReactively,
    reloadJobDataReactively,
  }
}
