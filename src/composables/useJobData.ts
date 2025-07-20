import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useJobsStore } from '../stores/jobs'
import { debugLog } from '../utils/debug'

export function useJobData(jobId: string | Ref<string | null>) {
  const jobsStore = useJobsStore()
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jobEvents = ref<Record<string, unknown>[]>([])

  const jobData = computed(() => {
    const id = typeof jobId === 'string' ? jobId : jobId.value
    return id ? jobsStore.getJobById(id) : null
  })

  async function loadJob() {
    loading.value = true
    error.value = null
    try {
      const id = typeof jobId === 'string' ? jobId : jobId.value
      if (!id) {
        throw new Error('Job ID is required')
      }

      const data = (await jobsStore.fetchJob(id)) as {
        job?: unknown
        events?: Record<string, unknown>[]
      }
      debugLog('[useJobData] fetchJob result:', data)

      if (data && data.job) {
        jobsStore.setDetailedJob(data.job)
        jobEvents.value = data.events || []
        debugLog('[useJobData] Loaded events:', jobEvents.value)
      } else {
        throw new Error('Job data is missing or invalid from fetchJob')
      }
    } catch (err: unknown) {
      const e = err as Error
      error.value = e.message || 'Failed to load job data.'
      debugLog('[useJobData] Error in loadJob:', err)
    } finally {
      loading.value = false
    }
  }
  async function updateJob() {
    if (!jobId || (typeof jobId !== 'string' && !jobId.value)) return
    loading.value = true
    error.value = null
    try {
    } catch (err: unknown) {
      const e = err as Error
      error.value = e?.message || 'Failed to update job'
    } finally {
      loading.value = false
    }
  }

  async function deleteJob() {
    if (!jobId || (typeof jobId !== 'string' && !jobId.value)) return
    loading.value = true
    error.value = null
    try {
    } catch (err: unknown) {
      const e = err as Error
      error.value = e?.message || 'Failed to delete job'
    } finally {
      loading.value = false
    }
  }

  return {
    jobData,
    jobEvents,
    loading,
    error,
    loadJob,
    updateJob,
    deleteJob,
  }
}
