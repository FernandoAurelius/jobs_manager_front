<template>
  <div class="w-full flex-shrink-0" :class="{ 'w-full': isArchive }">
    <div v-if="!isArchive" class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-3 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">
            {{ friendlyStatusLabel }} ({{ jobs.length }})
          </h3>
          <div v-if="status.tooltip" class="group relative" :title="status.tooltip">
            <svg
              class="w-4 h-4 text-gray-400 hover:text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      <div
        ref="jobListRef"
        :data-status="status.key"
        class="p-3 transition-colors duration-200"
        :class="{
          'bg-blue-50 border-blue-200': isDragging,
          // Single column layout with Tailwind - option to toggle back to 2-column by changing 'grid-cols-1' to 'grid-cols-2'
          'space-y-3': jobs.length > 0,
        }"
        style="height: calc(90vh - 12.5rem); overflow-y: auto"
      >
        <JobCard
          v-for="job in jobs"
          :key="job.id"
          :job="job"
          :is-dragging="isDragging"
          :is-movement-mode-active="isMovementModeActive"
          :is-job-selected-for-movement="isJobSelectedForMovement?.(job.id.toString()) ?? false"
          @click="$emit('job-click', job)"
          @job-ready="$emit('job-ready', $event)"
          @card-ready="$emit('card-ready', $event)"
          @job-selected-for-movement="$emit('job-selected-for-movement', $event)"
          @staff-assigned="$emit('staff-assigned', $event)"
        />

        <div
          v-if="jobs.length === 0 && !isLoading"
          class="flex items-center justify-center text-gray-500 h-32"
        >
          <div class="text-center">
            <div v-if="isLoading" class="text-sm">
              Still loading jobs {{ status.label.toLowerCase() }}
            </div>
            <div v-else class="text-sm">No jobs in {{ status.label.toLowerCase() }}</div>
            <div v-if="!isLoading" class="text-xs mt-1">Drag jobs here to update status</div>
          </div>
        </div>

        <div
          v-if="jobs.length === 0 && isLoading"
          class="flex items-center justify-center text-gray-500 h-32"
        >
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"
            ></div>
            <div class="text-sm">
              Jobs in {{ status.label.toLowerCase() }} status are still loading, please wait
            </div>
          </div>
        </div>

        <div
          v-if="showLoadMore && !isLoading"
          :class="jobs.length > 0 ? 'col-span-2' : ''"
          class="mt-4 text-center"
        >
          <button
            @click="$emit('load-more')"
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
          >
            Load More
          </button>
        </div>

        <div
          v-if="isLoading && jobs.length > 0"
          :class="jobs.length > 0 ? 'col-span-2' : ''"
          class="mt-4 text-center"
        >
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>

    <div v-else class="w-full">
      <div
        ref="jobListRef"
        :data-status="status.key"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="job in jobs"
          :key="job.id"
          :data-id="job.id"
          class="job-item bg-gray-50 p-3 rounded-md border border-gray-200 opacity-75"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-medium text-gray-500">#{{ job.job_number }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600"
              >Archived</span
            >
          </div>
          <h4 class="font-medium text-gray-700 text-sm mb-1">{{ job.name }}</h4>
          <p class="text-xs text-gray-500 mb-2">{{ job.description }}</p>
          <div class="text-xs text-gray-400">
            <p>{{ job.client_name }}</p>
            <p>{{ job.contact_person }}</p>
          </div>
        </div>

        <div v-if="jobs.length === 0" class="col-span-full text-center py-8">
          <div class="text-xs text-gray-500">No archived jobs</div>
        </div>

        <div v-if="showLoadMore && !isLoading" class="col-span-full text-center">
          <button
            @click="$emit('load-more')"
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
          >
            Load More Archived
          </button>
        </div>

        <div v-if="isLoading" class="col-span-full text-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import JobCard from '@/components/JobCard.vue'
import { schemas } from '@/api/generated/api'
import { StatusChoiceSchema } from '@/api/local/schemas'
import { z } from 'zod'

type Job = z.infer<typeof schemas.Job>
type StatusChoice = z.infer<typeof StatusChoiceSchema>

interface KanbanColumnProps {
  status: StatusChoice
  jobs: Job[]
  showLoadMore?: boolean
  isLoading?: boolean
  isDragging?: boolean
  isArchive?: boolean
  isMovementModeActive?: boolean
  isJobSelectedForMovement?: (jobId: string) => boolean
}

interface KanbanColumnEmits {
  (e: 'job-click', job: Job): void
  (e: 'load-more'): void
  (e: 'sortable-ready', element: HTMLElement, status: string): void
  (e: 'job-ready', payload: { jobId: string; element: HTMLElement }): void
  (e: 'card-ready', payload: { jobId: string; element: HTMLElement }): void
  (e: 'job-selected-for-movement', job: Job): void
  (e: 'staff-assigned', payload: { staffId: string; jobId: string }): void
}

const props = withDefaults(defineProps<KanbanColumnProps>(), {
  showLoadMore: false,
  isLoading: false,
  isDragging: false,
  isArchive: false,
  isMovementModeActive: false,
  isJobSelectedForMovement: () => false,
})

const emit = defineEmits<KanbanColumnEmits>()

const jobListRef = ref<HTMLElement>()

const friendlyStatusLabel = computed(() => {
  if (!props.status || !props.status.label) {
    return ''
  }
  const originalLabel = props.status.label
  const formattedLabel = originalLabel
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  debugLog(`Original status label: ${originalLabel}, Formatted label: ${formattedLabel}`)
  return formattedLabel
})

const handleArchivedJobDrop = (event: CustomEvent) => {
  debugLog('KanbanColumn received archived job drop:', event.detail)

  const dropEvent = new CustomEvent('archived-job-drop', {
    detail: event.detail,
    bubbles: true,
  })
  document.dispatchEvent(dropEvent)
}

onMounted(async () => {
  await nextTick()

  if (jobListRef.value) {
    debugLog(`🔧 Column ${props.status.key} ready, emitting sortable-ready`)
    emit('sortable-ready', jobListRef.value, props.status.key)

    jobListRef.value.addEventListener('archived-job-drop', handleArchivedJobDrop as EventListener)
  }
})

onUnmounted(() => {
  if (jobListRef.value) {
    jobListRef.value.removeEventListener(
      'archived-job-drop',
      handleArchivedJobDrop as EventListener,
    )
  }
})
</script>
