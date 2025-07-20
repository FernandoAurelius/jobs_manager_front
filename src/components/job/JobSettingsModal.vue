<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Job Settings</DialogTitle>
        <DialogDescription> Configure the job details and settings. </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div class="space-y-4 md:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Job Information</h3>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Job Name </label>
            <input
              v-model="localJobData.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
            <textarea
              v-model="localJobData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Job description..."
            ></textarea>
          </div>
        </div>

        <div class="space-y-4 md:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Client Information</h3>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Client </label>

            <div class="space-y-2">
              <div v-if="!isChangingClient" class="space-y-2">
                <input
                  v-model="localJobData.client_name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  readonly
                />

                <div class="flex flex-col md:flex-col xl:flex-row gap-2 xl:gap-2">
                  <button
                    @click="startClientChange"
                    type="button"
                    class="flex-1 xl:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-600"
                  >
                    Change
                  </button>
                  <button
                    @click="editCurrentClient"
                    type="button"
                    class="flex-1 xl:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm bg-green-50 hover:bg-green-100 text-green-600"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div v-else class="space-y-2">
                <ClientLookup
                  id="clientChange"
                  label=""
                  placeholder="Search for a new client..."
                  :required="false"
                  v-model="newClientName"
                  @update:selected-id="handleNewClientSelected"
                  @update:selected-client="handleClientLookupSelected"
                />

                <div class="flex space-x-2">
                  <button
                    @click="confirmClientChange"
                    type="button"
                    class="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    :disabled="!newClientId"
                  >
                    Confirm Change
                  </button>
                  <button
                    @click="cancelClientChange"
                    type="button"
                    class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <p class="text-xs text-gray-500">
                {{
                  isChangingClient
                    ? 'Select a new client for this job'
                    : 'Change or edit client information'
                }}
              </p>
            </div>
          </div>

          <div>
            <ContactSelector
              id="contact"
              label="Contact"
              :optional="true"
              :client-id="currentClientId"
              :client-name="currentClientName"
              :initial-contact-id="safeContactId"
              v-model="contactDisplayValue"
              @update:selected-contact="handleContactSelected"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Order Number </label>
            <input
              v-model="localJobData.order_number"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Customer order number"
            />
          </div>
        </div>

        <div class="space-y-4 md:col-span-2 xl:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Settings & Notes</h3>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Pricing Type </label>
            <select
              v-model="localJobData.pricing_methodology"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="time_materials">Time & Materials</option>
              <option value="fixed_price">Fixed Price</option>
            </select>
          </div>

          <div>
            <RichTextEditor
              v-model="jobNotesComputed"
              label="Notes"
              placeholder="Internal notes..."
              :required="false"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          @click="closeModal"
          type="button"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          @click="saveSettings"
          type="button"
          :disabled="isLoading"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="flex items-center">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </span>
          <span v-else>Save</span>
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, watch, computed, onMounted } from 'vue'
import type { JobDetailResponse, JobCreateRequest } from '@/api/generated/api'
import { jobService } from '@/services/job.service'
import { useJobsStore } from '@/stores/jobs'
import RichTextEditor from '@/components/RichTextEditor.vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelector from '@/components/ContactSelector.vue'
import type { Client, ClientContact } from '@/composables/useClientLookup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Props = {
  jobData: JobDetailResponse | null
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'job-updated': [job: JobDetailResponse]
}>()

const jobsStore = useJobsStore()

const localJobData = ref<Partial<JobDetailResponse & { status?: string }>>({})
const isLoading = ref(false)
const errorMessages = ref<string[]>([])

const isChangingClient = ref(false)
const newClientId = ref('')
const newClientName = ref('')
const selectedNewClient = ref<Client | null>(null)

const contactDisplayValue = ref('')

const jobStatusChoices = ref<{ value: string; label: string }[]>([])

onMounted(async () => {
  try {
    const statusMap = await jobService.getStatusChoices()
    jobStatusChoices.value = Object.entries(statusMap).map(([value, label]) => ({
      value,
      label: String(label),
    }))
  } catch {
    jobStatusChoices.value = [
      { value: 'quoting', label: 'Quoting' },
      { value: 'accepted_quote', label: 'Accepted Quote' },
      { value: 'awaiting_materials', label: 'Awaiting Materials' },
      { value: 'awaiting_staff', label: 'Awaiting Staff' },
      { value: 'awaiting_site_availability', label: 'Awaiting Site Availability' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'special', label: 'Special' },
      { value: 'recently_completed', label: 'Recently Completed' },
      { value: 'completed', label: 'Completed' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'archived', label: 'Archived' },
    ]
  }
})

const currentClientId = computed(() => {
  const clientId =
    isChangingClient.value && newClientId.value
      ? newClientId.value
      : localJobData.value.client_id || ''

  debugLog('JobSettingsModal - currentClientId computed:', {
    isChangingClient: isChangingClient.value,
    newClientId: newClientId.value,
    localJobDataClientId: localJobData.value.client_id,
    result: clientId,
  })

  return clientId
})

const currentClientName = computed(() => {
  return isChangingClient.value && newClientName.value
    ? newClientName.value
    : localJobData.value.client_name || ''
})

const safeContactId = computed(() => {
  return localJobData.value.contact_id || undefined
})

const jobNotesComputed = computed({
  get: () => localJobData.value.notes || '',
  set: (value: string) => {
    localJobData.value.notes = value || null
  },
})

const resetClientChangeState = () => {
  isChangingClient.value = false
  newClientId.value = ''
  newClientName.value = ''
  selectedNewClient.value = null
}

watch(
  () => props.jobData,
  (newJobData) => {
    debugLog('JobSettingsModal - jobData watcher triggered. New jobData:', newJobData)
    if (!newJobData) {
      debugLog(
        '🚫 JobSettingsModal - Watcher: Received null/undefined jobData, skipping initialization.',
      )

      return
    }
    debugLog(
      '✅ JobSettingsModal - Watcher: Received valid jobData, initializing. ID:',
      newJobData.id,
    )

    localJobData.value = {
      ...newJobData,
      client_id:
        newJobData.client_id === undefined || newJobData.client_id === null
          ? ''
          : newJobData.client_id,
    }
  },
  { immediate: true, deep: true },
)

const sanitizeJobData = (data: Record<string, unknown>): Partial<JobCreateRequest> => {
  if (!data) return {}

  const sanitized: Record<string, unknown> = { ...data }

  const nullableFields = ['description', 'notes', 'contact_id', 'contact_name', 'order_number']

  nullableFields.forEach((field) => {
    if (sanitized[field] === null) {
      sanitized[field] = undefined
    }
  })

  if (
    !sanitized.pricing_methodology ||
    (sanitized.pricing_methodology !== 'fixed_price' &&
      sanitized.pricing_methodology !== 'time_materials')
  ) {
    sanitized.pricing_methodology = 'time_materials'
  }

  return sanitized
}

const closeModal = () => {
  emit('close')
}

const startClientChange = () => {
  isChangingClient.value = true
}

const cancelClientChange = () => {
  resetClientChangeState()
}

const handleNewClientSelected = (clientId: string) => {
  newClientId.value = clientId
}

const handleClientLookupSelected = (client: Client | null) => {
  selectedNewClient.value = client

  if (client) {
    newClientName.value = client.name
  }
}

const confirmClientChange = () => {
  if (!newClientId.value || !selectedNewClient.value) {
    debugLog('No new client selected')
    return
  }

  localJobData.value.client_id = newClientId.value
  localJobData.value.client_name = selectedNewClient.value.name

  localJobData.value.contact_id = undefined
  localJobData.value.contact_name = undefined
  contactDisplayValue.value = ''

  resetClientChangeState()
}

const editCurrentClient = () => {
  if (!props.jobData?.client_id) {
    debugLog('No current client to edit')
    return
  }

  const url = `/clients/${props.jobData.client_id}/edit`
  window.open(url, '_blank')
}

const handleContactSelected = (contact: ClientContact | null) => {
  if (contact) {
    localJobData.value.contact_id = contact.id
    localJobData.value.contact_name = contact.name
    contactDisplayValue.value = contact.name
  } else {
    localJobData.value.contact_id = undefined
    localJobData.value.contact_name = undefined
    contactDisplayValue.value = ''
  }
}

const saveSettings = async () => {
  if (!props.jobData || !props.jobData.id) {
    debugLog(
      'JobSettingsModal - saveSettings - Error: props.jobData or props.jobData.id is missing.',
    )
    errorMessages.value = ['Job data is missing, cannot save.']
    return
  }
  isLoading.value = true
  errorMessages.value = []
  try {
    debugLog(
      'JobSettingsModal - saveSettings - Collecting form data:',
      JSON.parse(JSON.stringify(localJobData.value)),
    )
    const sanitizedData = sanitizeJobData(localJobData.value)

    debugLog(
      `JobSettingsModal - saveSettings - Sanitized data for job ID: ${props.jobData.id}:`,
      JSON.parse(JSON.stringify(sanitizedData)),
    )

    // Call the real job update API
    const result = await jobService.updateJob(props.jobData.id, sanitizedData)

    debugLog(
      'JobSettingsModal - saveSettings - API call result:',
      JSON.parse(JSON.stringify(result)),
    )

    if (result.success) {
      debugLog(
        'JobSettingsModal - saveSettings - API call successful. result.data:',
        JSON.parse(JSON.stringify(result.data)),
      )
      if (result.data !== null && result.data !== undefined) {
        handleSuccessfulSettingsUpdate(result.data)
      } else {
        debugLog(
          'JobSettingsModal - saveSettings - API call successful but result.data is null or undefined. Calling handleFallbackSettingsUpdate.',
        )

        errorMessages.value.push(
          'Update seemed successful, but no data was returned from the server.',
        )
      }
    } else {
      debugLog('JobSettingsModal - saveSettings - API call failed:', result.message)
      errorMessages.value.push(result.message || 'Failed to update job settings.')
    }
  } catch (e: unknown) {
    debugLog('JobSettingsModal - saveSettings - Unexpected error during save:', e)
    const errorMessage =
      e instanceof Error ? e.message : 'An unexpected error occurred while saving.'
    errorMessages.value.push(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const handleSuccessfulSettingsUpdate = (apiData: unknown) => {
  debugLog(
    'JobSettingsModal - handleSuccessfulSettingsUpdate - About to update store with:',
    JSON.parse(JSON.stringify(apiData)),
  )

  debugLog(
    'JobSettingsModal - handleSuccessfulSettingsUpdate - Entry. Raw apiData:',
    JSON.parse(JSON.stringify(apiData)),
  )
  debugLog(
    `JobSettingsModal - handleSuccessfulSettingsUpdate - Type of apiData: ${typeof apiData}, IsArray: ${Array.isArray(apiData)}`,
  )

  if (apiData === null || apiData === undefined) {
    debugLog(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Error: apiData is null or undefined at entry.',
    )
    return
  }

  const jobDataToStore = extractJobDataFromApiResponse(apiData)

  if (!jobDataToStore) {
    debugLog(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Error: Could not extract valid job data from API response.',
    )
    return
  }

  updateJobInStore(jobDataToStore)
}

const extractJobDataFromApiResponse = (apiData: unknown): Record<string, unknown> | null => {
  if (typeof apiData !== 'object' || apiData === null) {
    return null
  }

  const data = apiData as Record<string, unknown>

  if (isValidJobObject(data.job)) {
    debugLog(
      'JobSettingsModal - extractJobDataFromApiResponse - Path 1: Extracted from apiData.job',
    )
    return data.job as Record<string, unknown>
  }

  if (hasValidId(data)) {
    debugLog('JobSettingsModal - extractJobDataFromApiResponse - Path 2: Direct apiData object')
    return data
  }

  if (isValidJobObject((data.data as Record<string, unknown>)?.job)) {
    debugLog(
      'JobSettingsModal - extractJobDataFromApiResponse - Path 3: Extracted from apiData.data.job',
    )
    return (data.data as Record<string, unknown>).job as Record<string, unknown>
  }

  if (Array.isArray(apiData) && apiData.length > 0 && hasValidId(apiData[0])) {
    debugLog('JobSettingsModal - extractJobDataFromApiResponse - Path 4: Array with job objects')
    return apiData[0] as Record<string, unknown>
  }

  return null
}

const isValidJobObject = (obj: unknown): boolean => {
  return typeof obj === 'object' && obj !== null && hasValidId(obj)
}

const hasValidId = (obj: unknown): boolean => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    (typeof (obj as Record<string, unknown>).id === 'string' ||
      typeof (obj as Record<string, unknown>).id === 'number')
  )
}

const updateJobInStore = (apiData: unknown) => {
  let jobDataToStore: Partial<JobDetailResponse> | undefined = undefined

  if (typeof apiData === 'object' && apiData !== null) {
    const keys = Object.keys(apiData)
    debugLog(
      `JobSettingsModal - handleSuccessfulSettingsUpdate - apiData is object. Keys: ${keys.join(', ')}`,
    )

    if (
      apiData !== null &&
      typeof apiData === 'object' &&
      'job' in apiData &&
      typeof (apiData as Record<string, unknown> & { job?: Record<string, unknown> }).job ===
        'object' &&
      (apiData as Record<string, unknown> & { job?: Record<string, unknown> }).job !== null &&
      'id' in (apiData as Record<string, unknown> & { job?: Record<string, unknown> }).job!
    ) {
      debugLog(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 1: Extracted from apiData.job',
      )
      jobDataToStore = { ...(apiData as { job: object }).job }
    } else if ('id' in (apiData as Record<string, unknown>)) {
      debugLog(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 2: Extracted from apiData (root)',
      )
      jobDataToStore = { ...(apiData as object) }
    } else if (
      'data' in (apiData as Record<string, unknown>) &&
      typeof (apiData as Record<string, unknown> & { data?: Record<string, unknown> }).data ===
        'object' &&
      (apiData as Record<string, unknown> & { data?: Record<string, unknown> }).data !== null &&
      'id' in (apiData as Record<string, unknown> & { data?: Record<string, unknown> }).data!
    ) {
      debugLog(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 3: Extracted from apiData.data',
      )
      jobDataToStore = { ...(apiData as { data: object }).data }
    } else if (
      'data' in (apiData as Record<string, unknown>) &&
      typeof (apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } })
        .data === 'object' &&
      (apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } }).data !==
        null &&
      'job' in
        (apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } }).data! &&
      (() => {
        const dataObj = (
          apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } }
        ).data
        if (!dataObj || typeof dataObj !== 'object') return false
        const jobObj = (dataObj as { job?: Record<string, unknown> }).job
        return (
          jobObj !== undefined && jobObj !== null && typeof jobObj === 'object' && 'id' in jobObj
        )
      })()
    ) {
      debugLog(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 4: Extracted from apiData.data.job',
      )
      jobDataToStore = { ...(apiData as { data: { job: object } }).data.job }
    } else {
      debugLog(
        `JobSettingsModal - handleSuccessfulSettingsUpdate - Could not extract job data using standard object paths. apiData (stringified): ${JSON.stringify(apiData, null, 2)}`,
      )
    }
  } else if (
    Array.isArray(apiData) &&
    apiData.length > 0 &&
    apiData[0] &&
    typeof apiData[0] === 'object' &&
    apiData[0].id
  ) {
    debugLog(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 5: apiData is an array, using first element.',
    )
    jobDataToStore = { ...apiData[0] }
  } else {
    debugLog(
      `JobSettingsModal - handleSuccessfulSettingsUpdate - apiData is not a processable object or array. Value: ${String(apiData)}`,
    )
  }

  if (!jobDataToStore || !jobDataToStore.id) {
    debugLog(
      `JobSettingsModal - handleSuccessfulSettingsUpdate - FINAL ERROR: Could not derive valid jobDataToStore with an ID. jobDataToStore (stringified): ${JSON.stringify(jobDataToStore, null, 2)}. Original apiData (stringified): ${JSON.stringify(apiData, null, 2)}`,
    )
    errorMessages.value.push(
      'Failed to process server response. Job data might not be updated correctly. Check console.',
    )

    throw new Error(
      'Failed to process server response. Job data might not be updated correctly. Check console for details.',
    )
  } else {
    debugLog(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Successfully derived jobDataToStore:',
      JSON.parse(JSON.stringify(jobDataToStore)),
    )

    if (
      props.jobData &&
      props.jobData.client_id &&
      (jobDataToStore.client_id === undefined ||
        jobDataToStore.client_id === null ||
        jobDataToStore.client_id === '')
    ) {
      if (props.jobData.client_id !== '') {
        debugLog(
          `JobSettingsModal - Enriching client_id from props.jobData (${props.jobData.client_id}) as it was missing or empty in jobDataToStore.`,
        )
        jobDataToStore.client_id = props.jobData.client_id
      }
    } else if (
      jobDataToStore.client_id === undefined ||
      jobDataToStore.client_id === null ||
      jobDataToStore.client_id === ''
    ) {
      debugLog(
        'JobSettingsModal - jobDataToStore is missing client_id or it is empty, and props.jobData.client_id is also unavailable or empty for enrichment.',
      )
    }

    if (jobDataToStore.client_id === undefined || jobDataToStore.client_id === null) {
      jobDataToStore.client_id = ''
    }

    if (!jobDataToStore.id) {
      jobDataToStore.id = ''
    } else {
      jobDataToStore.id = String(jobDataToStore.id)
    }
    jobsStore.setDetailedJob(jobDataToStore as JobDetailResponse)
    debugLog(`JobSettingsModal - Called jobsStore.setDetailedJob with job ID: ${jobDataToStore.id}`)

    // Emit job-updated event for parent component
    emit('job-updated', jobDataToStore as JobDetailResponse)

    closeModal()
    debugLog('JobSettingsModal - Settings saved, store updated, event emitted, and modal closed.')
  }
}

defineExpose({ jobStatusChoices })
</script>
