<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogDescription> Edit job details, client information, and contact </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label for="jobName" class="block text-sm font-medium text-gray-700 mb-1">
              Job Name <span class="text-red-500">*</span>
            </label>
            <input
              id="jobName"
              v-model="localJobData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter job name"
            />
          </div>

          <div>
            <label for="orderNumber" class="block text-sm font-medium text-gray-700 mb-1">
              Order Number
            </label>
            <input
              id="orderNumber"
              v-model="localJobData.order_number"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer order number"
            />
          </div>

          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              v-model="localJobData.job_status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="quoting">Quoting</option>
              <option value="accepted_quote">Accepted Quote</option>
              <option value="awaiting_materials">Awaiting Materials</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="special">Special</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Client Information</h3>

          <div class="space-y-4">
            <div>
              <ClientLookup
                id="client"
                label="Client"
                placeholder="Search for a client..."
                :required="true"
                v-model="clientDisplayName"
                @update:selected-id="handleClientChange"
                @update:selected-client="handleClientSelected"
              />

              <div
                v-if="localJobData.client_name && !isClientChanged"
                class="mt-2 p-3 bg-blue-50 rounded border border-blue-200"
              >
                <div class="text-sm font-medium text-blue-900">
                  Current: {{ localJobData.client_name }}
                </div>
                <div class="text-xs text-blue-700 mt-1">
                  To change client, search and select a new one above
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contact</label>

              <div class="space-y-2">
                <div class="flex space-x-2">
                  <input
                    v-model="contactDisplayName"
                    type="text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    readonly
                    placeholder="No contact selected"
                  />

                  <button
                    @click="handleOpenContactModal"
                    type="button"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-600"
                    :disabled="!currentClientId"
                  >
                    {{ localJobData.contact_name ? 'Change' : 'Select' }}
                  </button>

                  <button
                    v-if="localJobData.contact_name"
                    @click="clearContact"
                    type="button"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-red-50 hover:bg-red-100 text-red-600"
                  >
                    Clear
                  </button>
                </div>

                <p class="text-xs text-gray-500">
                  {{
                    currentClientId
                      ? 'Select or manage contacts for this client'
                      : 'Please select a client first'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Job Details</h3>

          <div class="space-y-4">
            <div>
              <RichTextEditor
                id="description"
                label="Description (for invoice)"
                v-model="jobDescription"
                placeholder="Enter job description..."
                help-text="This description will appear on the invoice"
              />
            </div>

            <div>
              <RichTextEditor
                id="notes"
                label="Job Notes"
                v-model="jobNotes"
                placeholder="Enter internal notes about this job..."
                help-text="Internal notes - not shown on invoice"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="$emit('close')"
        >
          Cancel
        </button>

        <button
          type="button"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSave"
          :disabled="isLoading || !isFormValid"
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
          <span v-else>Save Changes</span>
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ContactSelectionModal
    :is-open="showContactModal"
    :client-id="currentClientId"
    :client-name="currentClientName"
    :contacts="contacts"
    :selected-contact="selectedContact"
    :is-loading="isContactLoading"
    :new-contact-form="newContactForm"
    @close="handleCloseContactModal"
    @select-contact="handleContactSelected"
    @save-contact="handleSaveContact"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelectionModal from '@/components/ContactSelectionModal.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useContactManagement } from '@/composables/useContactManagement'
import { api, schemas } from '@/api/generated/api'
import { z } from 'zod'
import type { Client, ClientContact } from '@/composables/useClientLookup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Use generated types from Zodios API
type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type JobUpdateRequest = z.infer<typeof schemas.JobUpdateRequest>

interface Props {
  jobData: JobDetailResponse | null
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'job-updated': [job: JobDetailResponse]
}>()

const localJobData = ref<Partial<JobDetailResponse>>({})
const isLoading = ref(false)
const isClientChanged = ref(false)
const selectedClient = ref<Client | null>(null)

const {
  isModalOpen: showContactModal,
  contacts,
  selectedContact,
  isLoading: isContactLoading,
  newContactForm,
  openModal: openContactModal,
  closeModal: closeContactModal,
  selectExistingContact,
  saveContact,
} = useContactManagement()

const currentClientId = computed(() => {
  return isClientChanged.value && selectedClient.value
    ? selectedClient.value.id
    : localJobData.value.client_id || ''
})

const currentClientName = computed(() => {
  return isClientChanged.value && selectedClient.value
    ? selectedClient.value.name
    : localJobData.value.client_name || ''
})

const clientDisplayName = computed({
  get: () => currentClientName.value,
  set: () => {},
})

const contactDisplayName = computed(() => {
  if (localJobData.value.contact_name) {
    return localJobData.value.contact_name
  }
  return ''
})

const jobDescription = computed({
  get: () => localJobData.value.description || '',
  set: (value: string) => {
    localJobData.value.description = value || null
  },
})

const jobNotes = computed({
  get: () => localJobData.value.notes || '',
  set: (value: string) => {
    localJobData.value.notes = value || null
  },
})

const isFormValid = computed(() => {
  if (!localJobData.value) return false

  const hasName = Boolean(localJobData.value.name?.trim())
  const hasClient = Boolean(localJobData.value.client_id)

  return hasName && hasClient
})

watch(
  () => props.jobData,
  (newJobData) => {
    if (newJobData) {
      localJobData.value = { ...newJobData }
      isClientChanged.value = false
      selectedClient.value = null
    }
  },
  { immediate: true },
)

const handleClientChange = (clientId: string) => {
  if (clientId !== localJobData.value.client_id) {
    isClientChanged.value = true
    localJobData.value.client_id = clientId
    clearContact()
  }
}

const handleClientSelected = (client: Client | null) => {
  selectedClient.value = client
  if (client) {
    localJobData.value.client_name = client.name
  }
}

const handleOpenContactModal = async () => {
  if (!currentClientId.value) {
    console.log('Cannot open contact modal without client')
    return
  }
  await openContactModal(currentClientId.value, currentClientName.value)
}

const handleCloseContactModal = () => {
  closeContactModal()
}

const handleContactSelected = (contact: ClientContact) => {
  localJobData.value.contact_id = contact.id
  localJobData.value.contact_name = contact.name
  selectExistingContact(contact)
}

const handleSaveContact = async () => {
  const success = await saveContact()
  if (success && selectedContact.value) {
    localJobData.value.contact_id = selectedContact.value.id
    localJobData.value.contact_name = selectedContact.value.name
  }
}

const clearContact = () => {
  localJobData.value.contact_id = undefined
  localJobData.value.contact_name = undefined
}

const handleSave = async () => {
  if (!isFormValid.value || !props.jobData) {
    return
  }

  isLoading.value = true

  try {
    const updateData: JobUpdateRequest = {
      name: localJobData.value.name?.trim() || '',
      client_id: currentClientId.value,
      contact_id: localJobData.value.contact_id || null,
      order_number: localJobData.value.order_number || null,
      job_status: localJobData.value.job_status || 'draft',
      description: localJobData.value.description || null,
      notes: localJobData.value.notes || null,
    }

    // Use Zodios API to update the job
    const updatedJob = await api.job_rest_jobs_update({
      params: { job_id: props.jobData.id },
      body: updateData,
    })

    emit('job-updated', updatedJob)
    emit('close')
  } catch (error) {
    console.error('Error saving job:', error)
    alert('Failed to save job. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
