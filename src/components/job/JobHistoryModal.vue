<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-2xl p-10">
      <DialogHeader>
        <div class="flex items-center justify-between">
          <DialogTitle>Job History</DialogTitle>
          <button
            @click="showAddEventForm = !showAddEventForm"
            class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add Event
          </button>
        </div>
        <DialogDescription> View and manage the history of events for this job. </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div v-if="showAddEventForm" class="p-4 bg-gray-50 rounded">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-800 mb-2"> Event Description </label>
            <textarea
              v-model="newEventDescription"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe what happened..."
            ></textarea>
          </div>
          <div class="flex space-x-2">
            <button
              @click="addEvent"
              class="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              :disabled="isAdding"
            >
              <span v-if="isAdding">Adding...</span>
              <span v-else>Add Event</span>
            </button>
            <button
              @click="cancelAddEvent"
              class="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="max-h-96 overflow-y-auto space-y-3">
          <div v-for="event in events" :key="event.id" class="p-3 border border-gray-200 rounded">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-sm text-gray-900">{{ event.description }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatDate(event.timestamp) }} by {{ event.staff }}
                </p>
              </div>
              <span class="px-2 py-1 text-xs rounded" :class="getEventTypeClass(event.event_type)">
                {{ getEventTypeLabel(event.event_type) }}
              </span>
            </div>
          </div>

          <div v-if="isLoadingEvents" class="text-center text-gray-500 py-8">
            <div class="flex items-center justify-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Loading job events, please wait
            </div>
          </div>

          <div v-else-if="!events || events.length === 0" class="text-center text-gray-500 py-8">
            No events recorded yet.
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          @click="closeModal"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { JobEvent } from '@/api/local/schemas'

interface Props {
  jobId: string
  events: JobEvent[]
  isOpen: boolean
  loading?: boolean
  isLoadingEvents?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'event-added': [event: JobEvent]
}>()

const showAddEventForm = ref(false)
const newEventDescription = ref('')
const isAdding = computed(() => props.loading)

const closeModal = () => {
  emit('close')
}

const addEvent = async () => {
  if (!newEventDescription.value.trim() || isAdding.value) return
  emit('event-added', { description: newEventDescription.value })
}

const cancelAddEvent = () => {
  newEventDescription.value = ''
  showAddEventForm.value = false
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getEventTypeLabel = (eventType: string) => {
  switch (eventType) {
    case 'job_created':
      return 'Created'
    case 'job_updated':
      return 'Updated'
    case 'setting_changed':
    case 'complex_mode_changed':
      return 'Setting Changed'
    case 'status_changed':
      return 'Status Changed'
    case 'quote_created':
    case 'linked_quote_created':
      return 'Quote Created'
    case 'manual_note':
      return 'Note'
    case 'file_upload':
      return 'File Upload'
    case 'email_sent':
      return 'Email Sent'
    case 'note':
      return 'Note'
    case 'created':
      return 'Created'
    case 'updated':
      return 'Updated'
    case 'status_change':
      return 'Status Change'
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }
}

const getEventTypeClass = (eventType: string) => {
  switch (eventType) {
    case 'job_created':
    case 'created':
      return 'bg-green-100 text-green-800'
    case 'job_updated':
    case 'updated':
      return 'bg-blue-100 text-blue-800'
    case 'setting_changed':
    case 'complex_mode_changed':
    case 'status_changed':
    case 'status_change':
      return 'bg-yellow-100 text-yellow-800'
    case 'quote_created':
    case 'linked_quote_created':
      return 'bg-teal-100 text-teal-800'
    case 'manual_note':
    case 'note':
      return 'bg-purple-100 text-purple-800'
    case 'file_upload':
      return 'bg-indigo-100 text-indigo-800'
    case 'email_sent':
      return 'bg-pink-100 text-pink-800'
    case 'quote_sent':
      return 'bg-orange-100 text-orange-800'
    case 'payment_received':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
