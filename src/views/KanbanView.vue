<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen mt-5 md:mt-15 lg:mt-0">
      <div class="flex-shrink-0 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 md:pt-1 lg:pt-6">
        <div class="mb-2 md:mb-3 space-y-2">
          <div
            class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full"
          >
            <button
              @click="showAdvancedSearchDialog = true"
              class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-all duration-200 flex items-center flex-shrink-0"
            >
              <Search class="mr-1.5 h-3.5 w-3.5" />
              Advanced Search
            </button>

            <div class="w-full max-w-xs sm:max-w-md">
              <div class="relative">
                <Search
                  class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-grey-400"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-grey-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @input="handleSearch"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col px-2 sm:px-4 lg:px-6 py-1 md:py-2">
          <div v-if="!showSearchResults" class="mb-2 md:mb-3 flex justify-center">
            <div class="flex justify-center w-full">
              <StaffPanel
                :active-filters="activeStaffFilters"
                @staff-filter-changed="handleStaffFilterChanged"
              />
            </div>
          </div>

          <div v-if="showSearchResults" class="mb-2 md:mb-3">
            <div class="flex items-centre justify-between mb-4">
              <h2 class="text-lg font-semibold text-grey-900">
                Search Results ({{ filteredJobs.length }} jobs found)
              </h2>
              <button
                @click="backToKanban"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colours flex items-centre text-sm"
              >
                <LayoutGrid class="mr-2 h-4 w-4" />
                Back to Kanban
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <JobCard v-for="job in filteredJobs" :key="job.id" :job="job" @click="viewJob(job)" />
            </div>
          </div>

          <div v-if="!showSearchResults" class="flex-1 flex flex-col space-y-1 md:space-y-2">
            <div class="block md:hidden">
              <select
                v-model="selectedMobileStatus"
                class="w-full p-3 text-base border border-grey-300 rounded-lg bg-white text-grey-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option
                  v-for="status in visibleStatusChoices"
                  :key="status.key"
                  :value="status.key"
                >
                  {{ status.label }} ({{ getJobsByStatus(status.key).length }})
                </option>
              </select>
            </div>

            <div class="block md:hidden">
              <div class="flex justify-centre px-4">
                <KanbanColumn
                  v-if="
                    selectedMobileStatus &&
                    visibleStatusChoices.find((s) => s.key === selectedMobileStatus)
                  "
                  :key="selectedMobileStatus"
                  :status="visibleStatusChoices.find((s) => s.key === selectedMobileStatus)!"
                  :jobs="getSortedJobsByStatus(selectedMobileStatus)"
                  :is-loading="isLoading"
                  :is-dragging="isDragging"
                  @job-click="viewJob"
                  @load-more="loadMoreJobs(selectedMobileStatus)"
                  @sortable-ready="handleSortableReady"
                  class="kanban-column w-full max-w-md mx-auto"
                />
              </div>
            </div>

            <div class="hidden md:flex md:flex-1 md:flex-col">
              <div class="block lg:hidden">
                <div class="w-full mx-auto px-2">
                  <div
                    class="grid gap-3"
                    :class="{
                      'grid-cols-1': visibleStatusChoices.length <= 2,
                      'grid-cols-2':
                        visibleStatusChoices.length <= 4 && visibleStatusChoices.length > 2,
                      'grid-cols-3':
                        visibleStatusChoices.length <= 6 && visibleStatusChoices.length > 4,
                      'grid-cols-4': visibleStatusChoices.length > 6,
                    }"
                  >
                    <KanbanColumn
                      v-for="status in visibleStatusChoices"
                      :key="status.key"
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      class="kanban-column-responsive"
                    />
                  </div>
                </div>
              </div>

              <div class="hidden lg:block">
                <div class="w-full mx-auto px-2">
                  <div
                    class="grid gap-2 xl:gap-3"
                    :style="`grid-template-columns: repeat(${visibleStatusChoices.length}, minmax(0, 1fr))`"
                  >
                    <KanbanColumn
                      v-for="status in visibleStatusChoices"
                      :key="status.key"
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdvancedSearchDialog
      :is-open="showAdvancedSearchDialog"
      :filters="advancedFilters"
      :is-loading="isLoading"
      @close="showAdvancedSearchDialog = false"
      @search="handleAdvancedSearchFromDialog"
      @clear-filters="clearFilters"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted, nextTick } from 'vue'
import { Search, LayoutGrid } from 'lucide-vue-next'
import JobCard from '@/components/JobCard.vue'
import KanbanColumn from '@/components/KanbanColumn.vue'
import AppLayout from '@/components/AppLayout.vue'
import StaffPanel from '@/components/StaffPanel.vue'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'
import { useKanban } from '@/composables/useKanban'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useJobsStore } from '@/stores/jobs'
import { KanbanCategorizationService } from '@/services/kanban-categorization.service'
import type { AdvancedFilters } from '../api/local/schemas'

const jobsStore = useJobsStore()

onMounted(() => {
  jobsStore.setCurrentContext('kanban')
})

onUnmounted(() => {
  if (jobsStore.currentContext === 'kanban') {
    jobsStore.setCurrentContext(null)
  }
})

const {
  jobs,
  filteredJobs,
  isLoading,
  searchQuery,
  showSearchResults,
  advancedFilters,
  activeStaffFilters,
  selectedMobileStatus,

  visibleStatusChoices,

  getJobsByStatus,

  loadJobs,
  handleSearch,
  handleAdvancedSearch,
  clearFilters,
  backToKanban,
  loadMoreJobs,
  viewJob,
  updateJobStatus,
  reorderJob,
  handleStaffFilterChanged,
} = useKanban(() => {
  nextTick(() => {
    initialiseSortableForAllColumns()
  })
})

const showAdvancedSearchDialog = ref(false)

const handleAdvancedSearchFromDialog = async (filters: AdvancedFilters) => {
  try {
    Object.assign(advancedFilters.value, filters)
    await handleAdvancedSearch()
  } catch (error) {
    console.error('Error performing advanced search from dialog:', error)
  }
}

const { isDragging, initializeSortable, destroyAllSortables } = useDragAndDrop((event, payload) => {
  if (event === 'job-moved') {
    const { jobId, fromStatus, toStatus, beforeId, afterId } = payload
    if (fromStatus !== toStatus) {
      const actualStatus = KanbanCategorizationService.getDefaultStatusForColumn(toStatus)
      updateJobStatus(jobId, actualStatus)
    } else {
      reorderJob(jobId, beforeId, afterId, toStatus)
    }
  }
})

const sortableInitialized = ref<Set<string>>(new Set())
const columnsReadyForSortable = ref<Map<string, HTMLElement>>(new Map())

const handleSortableReady = (element: HTMLElement, status: string) => {
  columnsReadyForSortable.value.set(status, element)

  if (jobs.value.length > 0 && !sortableInitialized.value.has(status)) {
    initializeSortableForColumn(status, element)
  }
}

const initializeSortableForColumn = (status: string, element: HTMLElement) => {
  if (sortableInitialized.value.has(status)) {
    return
  }

  nextTick(() => {
    initializeSortable(element, status)
    sortableInitialized.value.add(status)
  })
}

const initialiseSortableForAllColumns = () => {
  columnsReadyForSortable.value.forEach((element, status) => {
    if (!sortableInitialized.value.has(status)) {
      initializeSortableForColumn(status, element)
    }
  })
}

function getSortedJobsByStatus(statusKey: string) {
  // Use the filtered getJobsByStatus from useKanban instead of directly calling KanbanCategorizationService
  return getJobsByStatus.value(statusKey)
}

onMounted(async () => {
  await loadJobs()
})

onUnmounted(() => {
  destroyAllSortables()
  sortableInitialized.value.clear()
  columnsReadyForSortable.value.clear()
})
</script>

<style scoped>
.mobile-column {
  min-width: 320px;
  max-width: 400px;
  width: 100%;
}

@media (max-width: 767px) {
  .mobile-column :deep(.kanban-column) {
    min-width: 320px;
    max-width: 400px;
    width: 100%;
  }

  .mobile-column :deep(.job-card) {
    min-width: 280px;
    width: 100%;
    padding: 16px;
  }

  .mobile-column :deep(.p-1) {
    padding: 12px;
  }

  .mobile-column :deep(.space-y-1 > * + *) {
    margin-top: 8px;
  }
}

.tablet-column {
  min-width: 200px;
  max-width: 280px;
  width: 100%;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column {
    width: calc((100% - 0.75rem) / 4);
    min-width: 160px;
    max-width: 200px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column :deep(.kanban-column) {
    min-width: 160px;
    max-width: 200px;
    width: 100%;
    height: fit-content;
  }
}

[data-is-clone='true'] {
  pointer-events: none !important;
  z-index: 9999;
}

.sortable-ghost,
.staff-sortable-ghost {
  opacity: 0.3 !important;
  pointer-events: none !important;
}

.staff-sortable-chosen {
  opacity: 0.8 !important;
}

.staff-sortable-drag {
  opacity: 0.6 !important;
  transform: rotate(5deg);
}

.staff-list [data-is-clone='true'],
.sortable-chosen[data-is-clone='true'] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

.is-staff-dragging * {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

[style*='position: absolute'][style*='left: -9999px'] {
  display: none !important;
}

/* Staff drag visual feedback on job cards */
.job-card {
  transition: outline 0.2s ease;
}

.job-card:hover {
  cursor: default;
}

/* When staff is being dragged, job cards get visual feedback */
.sortable-fallback {
  display: none !important;
}

/* Drag handle styles */
.drag-handle {
  transition: all 0.2s ease;
  font-size: 8px;
  line-height: 1;
}

.drag-handle:hover {
  transform: scale(1.1);
  background-color: #2563eb !important;
}
</style>
