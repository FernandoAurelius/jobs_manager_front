import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { jobService } from '../services/job.service'
import { useJobsStore } from '../stores/jobs'
import { KanbanCategorizationService } from '../services/kanban-categorization.service'
import { schemas } from '../api/generated/api'
import type { StatusChoice, AdvancedFilters } from '../api/local/schemas'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'

// Type aliases for better readability
type KanbanJob = z.infer<typeof schemas.KanbanJob>
type KanbanJobPerson = z.infer<typeof schemas.KanbanJobPerson>
type FetchAllJobsResponse = z.infer<typeof schemas.FetchAllJobsResponse>
type FetchStatusValuesResponse = z.infer<typeof schemas.FetchStatusValuesResponse>
type AdvancedSearchResponse = z.infer<typeof schemas.AdvancedSearchResponse>

// Interface for jobs that can be used with KanbanCategorizationService
interface JobWithStatus {
  status?: string
  status_key?: string
}

export function useKanban(onJobsLoaded?: () => void) {
  // jobService is already imported directly
  const router = useRouter()
  const jobsStore = useJobsStore()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const showAdvancedSearch = ref(false)
  const showSearchResults = ref(false)
  const showArchived = ref(false)
  const statusChoices = ref<StatusChoice[]>([])
  const selectedMobileStatus = ref('')

  const activeStaffFilters = ref<string[]>([])

  const advancedFilters = ref<AdvancedFilters>({
    job_number: '',
    name: '',
    description: '',
    client_name: '',
    contact_person: '',
    created_by: '',
    status: [],
    created_after: '',
    created_before: '',
    paid: '',
    xero_invoice_params: '',
  })

  const jobs = computed(() =>
    jobsStore.allKanbanJobs.filter((job) => job.status_key !== 'archived'),
  )
  const archivedJobs = computed(() =>
    jobsStore.allKanbanJobs.filter((job) => job.status_key === 'archived'),
  )
  const filteredJobs = ref<KanbanJob[]>([])
  const totalArchivedJobs = computed(() => archivedJobs.value.length)

  const jobMatchesStaffFilters = (job: KanbanJob): boolean => {
    if (activeStaffFilters.value.length === 0) {
      return true
    }

    const assignedStaffIds = job.people?.map((staff: KanbanJobPerson) => staff.id.toString()) || []
    const isAssignedToActiveStaff = assignedStaffIds.some((staffId: string) =>
      activeStaffFilters.value.includes(staffId),
    )

    const isCreatedByActiveStaff = job.created_by_id
      ? activeStaffFilters.value.includes(job.created_by_id.toString())
      : false

    return isAssignedToActiveStaff || isCreatedByActiveStaff
  }

  const getJobsByStatus = computed(() => (columnId: string) => {
    let jobList: KanbanJob[]

    if (columnId === 'archived') {
      jobList = archivedJobs.value
    } else {
      // KanbanJob implements JobWithStatus interface - safe type assertion
      const jobsWithStatus: (KanbanJob & JobWithStatus)[] = jobs.value
      const filteredByColumn = KanbanCategorizationService.getJobsForColumn(
        jobsWithStatus,
        columnId,
      )
      jobList = filteredByColumn as KanbanJob[]
    }

    return jobList.filter((job) => jobMatchesStaffFilters(job))
  })

  const getJobCountByStatus = computed(() => (columnId: string) => {
    if (columnId === 'archived') {
      return archivedJobs.value.length
    }
    return getJobsByStatus.value(columnId).length
  })

  const visibleStatusChoices = computed(() => {
    return KanbanCategorizationService.getAllColumns().map((col) => ({
      key: col.columnId,
      label: col.columnTitle,
      tooltip: `Status: ${col.statusKey
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')}`,
    }))
  })

  const loadJobs = async (): Promise<void> => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      jobsStore.setCurrentContext('kanban')
      jobsStore.setLoadingKanban(true)

      const data: FetchAllJobsResponse = await jobService.getAllJobs()

      // Safely handle the arrays with proper type checking
      const activeJobs = data.active_jobs || []
      const archivedJobs = data.archived_jobs || []

      const kanbanJobs = [...activeJobs, ...archivedJobs].map((job: KanbanJob) => {
        const status_key = job.status_key || ''
        return {
          id: job.id,
          name: job.name,
          description: job.description,
          job_number: job.job_number,
          client_name: job.client_name,
          contact_person: job.contact_person,
          people: job.people || [],
          status: status_key,
          status_key: status_key,
          status_display: job.status || '',
          job_status: status_key,
          paid: job.paid,
          created_by_id: job.created_by_id,
          created_at: job.created_at,
          priority: job.priority,
        }
      })

      jobsStore.setKanbanJobs(kanbanJobs)

      debugLog('Jobs loaded and stored:', {
        activeJobs: activeJobs.length,
        archivedJobs: archivedJobs.length,
        totalArchived: data.total_archived,
      })

      if (onJobsLoaded) {
        onJobsLoaded()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load jobs'
      debugLog('Error loading jobs:', err)
    } finally {
      isLoading.value = false
      jobsStore.setLoadingKanban(false)
    }
  }

  const loadStatusChoices = async (): Promise<void> => {
    try {
      const data: FetchStatusValuesResponse = await jobService.getStatusChoices()

      // Safely handle optional properties
      const statuses = data.statuses || {}
      const tooltips = data.tooltips || {}

      statusChoices.value = Object.entries(statuses).map(([key, label]) => ({
        key,
        label,
        tooltip: tooltips[key] || '',
      }))

      if (!selectedMobileStatus.value && statusChoices.value.length > 0) {
        const firstStatus = statusChoices.value.find((s) => s.key !== 'archived')
        selectedMobileStatus.value = firstStatus?.key || statusChoices.value[0].key
      }
    } catch (err) {
      debugLog('Error loading status choices:', err)

      const columns = KanbanCategorizationService.getAllColumns()
      statusChoices.value = columns.map((col) => ({
        key: col.columnId,
        label: col.columnTitle,
        tooltip: `Status: ${col.statusKey
          .replace(/_/g, ' ')
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}`,
      }))

      if (!selectedMobileStatus.value) {
        selectedMobileStatus.value =
          columns.find((c) => c.columnId !== 'archived')?.columnId || 'draft'
      }
    }
  }

  const handleSearch = (): void => {
    if (!searchQuery.value.trim()) {
      showSearchResults.value = false
      filteredJobs.value = []
      return
    }

    // Client-side search since jobService.searchJobs doesn't take parameters
    const allJobs = [...jobs.value, ...archivedJobs.value]
    const query = searchQuery.value.toLowerCase()

    filteredJobs.value = allJobs.filter((job) => {
      return (
        job.name.toLowerCase().includes(query) ||
        job.job_number.toString().toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.client_name?.toLowerCase().includes(query) ||
        job.contact_person?.toLowerCase().includes(query)
      )
    })

    showSearchResults.value = true
  }

  const handleAdvancedSearch = async (): Promise<void> => {
    try {
      isLoading.value = true
      const response: AdvancedSearchResponse = await jobService.performAdvancedSearch(
        advancedFilters.value,
      )
      filteredJobs.value = response.jobs || []
      showSearchResults.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to perform advanced search'
      debugLog('Error performing advanced search:', err)
    } finally {
      isLoading.value = false
    }
  }

  const clearFilters = (): void => {
    advancedFilters.value = {
      job_number: '',
      name: '',
      description: '',
      client_name: '',
      contact_person: '',
      created_by: '',
      status: [],
      created_after: '',
      created_before: '',
      paid: '',
    }
  }

  const toggleAdvancedSearch = (): void => {
    showAdvancedSearch.value = !showAdvancedSearch.value
  }

  const backToKanban = (): void => {
    showSearchResults.value = false
    searchQuery.value = ''
    filteredJobs.value = []
  }

  const toggleArchive = (): void => {
    showArchived.value = !showArchived.value
  }

  const shouldShowLoadMore = (): boolean => {
    return false
  }

  const loadMoreJobs = (status: string): void => {
    debugLog('Load more jobs for status:', status)
  }

  const viewJob = (job: KanbanJob): void => {
    router.push(`/jobs/${job.id}`)
  }

  const updateJobStatus = async (jobId: string, newStatus: string): Promise<void> => {
    try {
      await jobService.updateJobStatus(jobId, newStatus)

      jobsStore.updateJobStatus(jobId, newStatus)

      await loadJobs()

      debugLog(`✅ Job ${jobId} status updated to ${newStatus}`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update job status'
      debugLog('Error updating job status:', err)

      await loadJobs()
    }
  }

  const reorderJob = async (
    jobId: string,
    beforeId?: string,
    afterId?: string,
    status?: string,
  ): Promise<void> => {
    try {
      await jobService.reorderJob(jobId, beforeId, afterId, status)

      debugLog(`✅ Job ${jobId} reordered`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder job'
      debugLog('Error reordering job:', err)

      await loadJobs()
    }
  }

  const handleStaffFilterChanged = (staffIds: string[]): void => {
    activeStaffFilters.value = staffIds
  }

  const jobsSortedByPriority = computed(() => {
    const arr = jobs.value.slice().sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    debugLog(
      '[KANBAN DEBUG] Jobs sorted by priority:',
      arr.map((j) => ({
        job_number: j.job_number,
        id: j.id,
        priority: j.priority,
        status: j.status,
        job_status: j.job_status,
      })),
    )
    return arr
  })

  onMounted(async () => {
    await Promise.all([loadJobs(), loadStatusChoices()])
  })

  return {
    jobs,
    archivedJobs,
    filteredJobs,
    isLoading,
    error,
    searchQuery,
    showAdvancedSearch,
    showSearchResults,
    showArchived,
    totalArchivedJobs,
    advancedFilters,
    activeStaffFilters,
    selectedMobileStatus,

    statusChoices,
    visibleStatusChoices,

    getJobsByStatus,
    getJobCountByStatus,
    jobsSortedByPriority,

    loadJobs,
    loadStatusChoices,
    handleSearch,
    handleAdvancedSearch,
    clearFilters,
    toggleAdvancedSearch,
    backToKanban,
    toggleArchive,
    shouldShowLoadMore,
    loadMoreJobs,
    viewJob,
    updateJobStatus,
    reorderJob,
    handleStaffFilterChanged,
  }
}
