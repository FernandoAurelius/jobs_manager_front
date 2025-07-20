import { ref, computed, watch } from 'vue'
import { useJobsStore } from '@/stores/jobs'
import type { JobEvent } from '@/schemas/job.schemas'
import { useJobData } from '@/composables/useJobData'
import type { Ref } from 'vue'
import { debugLog } from '@/utils/debug'
import { api } from '../api/generated/api'

export function useJobEvents(jobId: string | Ref<string | null>) {
  const jobsStore = useJobsStore()
  const { jobData, jobEvents: dataEvents, loadJob } = useJobData(jobId)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jobEvents = ref<JobEvent[]>([])

  const getJobId = () => (typeof jobId === 'string' ? jobId : jobId.value)

  function loadEvents() {
    const id = getJobId()
    debugLog('[useJobEvents] loadEvents called. jobId:', id)
    if (dataEvents.value && Array.isArray(dataEvents.value)) {
      jobEvents.value = [...dataEvents.value]
      debugLog('[useJobEvents] Loaded events from useJobData:', jobEvents.value)
    } else if (jobData.value && Array.isArray(jobData.value.events)) {
      jobEvents.value = [...jobData.value.events]
      debugLog('[useJobEvents] Loaded events from jobData:', jobEvents.value)
    } else {
      const job = id ? jobsStore.getJobById(id) : null
      jobEvents.value = job?.events ? [...job.events] : []
      debugLog('[useJobEvents] Loaded events from store:', jobEvents.value)
    }
  }

  // Função para inicializar carregamento dos eventos
  async function initializeEvents() {
    const id = getJobId()
    if (id && (!dataEvents.value || dataEvents.value.length === 0)) {
      debugLog('[useJobEvents] Initializing events by loading job data')
      await loadJob()
    }
  }

  watch(
    [() => jobData.value, () => dataEvents.value],
    () => {
      debugLog('[useJobEvents] jobData or dataEvents changed')
      loadEvents()
    },
    { immediate: true, deep: true },
  )

  // Inicializar eventos na primeira execução
  watch(
    () => getJobId(),
    async (id) => {
      if (id) {
        debugLog('[useJobEvents] JobId changed, initializing events:', id)
        await initializeEvents()
      }
    },
    { immediate: true },
  )

  async function addEvent(description: string) {
    const id = getJobId()
    if (!id || !description) {
      debugLog('[useJobEvents] addEvent called with missing id or description', {
        id,
        description,
      })
      return
    }
    loading.value = true
    error.value = null
    try {
      debugLog('[useJobEvents] Adding event via API:', { id, description })

      const response = await api.job_rest_jobs_events_create(
        { description },
        {
          params: { job_id: id },
        },
      )
      debugLog('[useJobEvents] API response:', response)
      if (response.success) {
        // Recarregar os dados do job para obter os eventos atualizados
        await loadJob()
        debugLog('[useJobEvents] Event added and job data reloaded.')
      } else {
        debugLog('[useJobEvents] Failed to add event:', response.error)
        throw new Error(response.error || 'Failed to add event')
      }
    } catch (err: unknown) {
      const e = err as Error
      error.value = e?.message || 'Failed to add event'
      debugLog('[useJobEvents] Error adding event:', error.value)
    } finally {
      loading.value = false
      debugLog('[useJobEvents] addEvent finished. loading:', loading.value)
    }
  }

  return {
    jobEvents: computed(() => jobEvents.value),
    loading,
    error,
    addEvent,
  }
}
