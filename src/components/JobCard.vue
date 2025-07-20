<template>
  <div
    ref="jobCardRef"
    class="job-card"
    :class="{
      'cursor-grabbing': isDragging,
      'opacity-50': isDragging && false,
      'ring-2 ring-blue-500 bg-blue-50': isMovementModeActive && isJobSelectedForMovement,
      'border-blue-400 hover:border-blue-500': isMovementModeActive && !isJobSelectedForMovement,
      'cursor-pointer': isMovementModeActive,
      'cursor-grab': !isDragging && !isMovementModeActive,
      'staff-drop-target': isStaffDragOver,
    }"
    :data-id="job.id || ''"
    :data-job-id="job.id || ''"
    @click="handleClick"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <div
      v-if="isMovementModeActive"
      class="absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-200"
      :class="isJobSelectedForMovement ? 'bg-blue-500' : 'bg-blue-300 opacity-60'"
    ></div>

    <div class="flex justify-between items-center mb-1">
      <span class="text-xs font-semibold text-blue-600">#{{ job.job_number }}</span>
      
      <!-- Staff avatars moved next to job number -->
      <div
        ref="jobStaffContainerRef"
        class="flex gap-1 items-center min-h-[20px] p-1 rounded transition-colors"
        :class="{
          'bg-blue-50 border border-blue-300': isStaffDragTarget,
          'bg-gray-50 border border-dashed border-gray-300': (!job.people || job.people.length === 0) && !isStaffDragTarget,
        }"
      >
        <StaffAvatar
          v-for="staff in job.people || []"
          :key="staff.id"
          :staff="staff"
          size="sm"
          :title="staff.display_name"
          :data-staff-id="staff.id"
        />
        <div
          v-if="!job.people || job.people.length === 0"
          class="text-[10px] text-gray-400 px-1"
        >
          +
        </div>
      </div>
    </div>

    <h4 class="font-medium text-gray-900 text-xs mb-1 leading-tight">
      {{ truncatedJobName }}
    </h4>

    <p class="text-xs text-gray-600 mb-1 line-clamp-1 leading-tight">{{ job.description }}</p>

    <div class="text-xs text-gray-500 mb-2 truncate font-medium">{{ job.client_name }}</div>

    <StatusBadge
      :label="friendlyStatusName"
      :status="job.status_key || ''"
      size="xs"
      class="mb-2 text-[10px]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import StaffAvatar from '@/components/StaffAvatar.vue'
import StatusBadge from '@/components/kanban/StatusBadge.vue'
import { useJobCard } from '@/composables/useJobCard'
import { statusNameMap } from '@/utils/statusMappings'
import { api, schemas } from '@/api/generated/api'
import { z } from 'zod'

type KanbanJob = z.infer<typeof schemas.KanbanJob>

const props = withDefaults(
  defineProps<{
    job: KanbanJob
    isDragging?: boolean
    isStaffDragTarget?: boolean
    isMovementModeActive?: boolean
    isJobSelectedForMovement?: boolean
  }>(),
  {
    isDragging: false,
    isStaffDragTarget: false,
    isMovementModeActive: false,
    isJobSelectedForMovement: false,
  },
)

const emit = defineEmits<{
  click: [job: KanbanJob]
  'job-ready': [payload: { jobId: string; element: HTMLElement }]
  'job-selected-for-movement': [job: KanbanJob]
  'card-ready': [payload: { jobId: string; element: HTMLElement }]
  'staff-assigned': [payload: { staffId: string; jobId: string }]
}>()

const jobStaffContainerRef = ref<HTMLElement>()
const jobCardRef = ref<HTMLElement>()
const isStaffDragOver = ref(false)

// Staff drag and drop handlers
const handleDragOver = (event: DragEvent): void => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleDragEnter = (event: DragEvent): void => {
  event.preventDefault()
  isStaffDragOver.value = true
}

const handleDragLeave = (event: DragEvent): void => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isStaffDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent): Promise<void> => {
  event.preventDefault()
  event.stopPropagation()
  isStaffDragOver.value = false
  
  const staffId = event.dataTransfer?.getData('text/plain')
  
  if (staffId && props.job.id) {
    try {
      await api.job_api_job_assignment_create({
        job_id: props.job.id,
        staff_id: staffId
      }, {
        params: {
          job_id: props.job.id
        }
      })
      
      emit('staff-assigned', { staffId, jobId: props.job.id })
    } catch (error) {
      console.error('Error assigning staff to job:', error)
    }
  }
}

const { handleClick } = useJobCard(props.job, emit)

const friendlyStatusName = computed(() => {
  return statusNameMap[props.job.status_key || ''] || props.job.status_key || ''
})

const truncatedJobName = computed(() => {
  return props.job.name.length > 12 ? props.job.name.substring(0, 12) + '...' : props.job.name
})

onMounted(() => {
  // Emitir evento para o sistema de drag and drop do job (staff container)
  if (jobStaffContainerRef.value) {
    emit('job-ready', {
      jobId: props.job.id.toString(),
      element: jobStaffContainerRef.value,
    })
  }
  
  // Emitir evento para o sistema de drag and drop do card inteiro
  if (jobCardRef.value) {
    emit('card-ready', {
      jobId: props.job.id.toString(),
      element: jobCardRef.value,
    })
  }
})
</script>

<style scoped>
.job-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #fff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  padding: 0.75rem 0.75rem 0.5rem 0.75rem;
  margin: 0;
  max-height: 210px;
  min-height: 120px;
  height: auto;
  align-self: start;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
  cursor: pointer;
  overflow: hidden;
}

.job-card:active {
  cursor: grabbing;
}

.job-card .text-xs {
  font-size: 0.78rem;
  line-height: 1.1;
}

.job-card h4 {
  font-size: 0.92rem;
  font-weight: 500;
  margin-bottom: 0.15rem;
  line-height: 1.15;
}

.job-card .mb-2 {
  margin-bottom: 0.3rem !important;
}

.job-card .mb-1 {
  margin-bottom: 0.18rem !important;
}

.job-card .p-1 {
  padding: 0.18rem !important;
}

.job-card .h-4 {
  height: 1.1rem !important;
}

.job-card .rounded {
  border-radius: 0.35rem !important;
}

.job-card .border-dashed {
  border-style: dashed !important;
}

.staff-drop-target {
  background-color: #eff6ff !important;
  border-color: #3b82f6 !important;
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.staff-item {
  cursor: grab;
  user-select: none;
}

.staff-item:active {
  cursor: grabbing;
}

.staff-item * {
  pointer-events: none;
}

.job-card .gap-1 {
  gap: 0.18rem !important;
}

.job-card .font-medium {
  font-weight: 500 !important;
}

.job-card .font-semibold {
  font-weight: 600 !important;
}

.job-card .truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-card .line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(.job-card.sortable-chosen) {
  opacity: 0.8 !important;
  transform: scale(1.02) !important;
}
:global(.job-card.sortable-drag) {
  opacity: 0.6 !important;
}
:global(.job-card.sortable-ghost) {
  opacity: 0.3 !important;
  background: #e3f2fd !important;
  border: 2px dashed #2196f3 !important;
}

.job-card:hover {
  box-shadow: 0 2px 8px 0 rgb(0 0 0 / 0.08);
  border-color: #60a5fa;
  cursor: grab !important;
}

.job-card:active {
  cursor: grabbing !important;
}
</style>
