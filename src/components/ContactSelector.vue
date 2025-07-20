<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="!optional" class="text-red-500">*</span>
      <span v-else class="text-gray-500 text-xs">(Optional)</span>
    </label>

    <div class="flex space-x-2">
      <div class="flex-1">
        <input
          :id="id"
          v-model="displayValue"
          type="text"
          :placeholder="placeholder"
          readonly
          class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @click="handleOpenModal"
        />
      </div>

      <button
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        @click="handleOpenModal"
        :disabled="!clientId"
      >
        <Users class="w-4 h-4" />
      </button>

      <button
        v-if="selectedContact"
        type="button"
        class="px-2 py-2 text-gray-400 hover:text-red-600 transition-colors"
        @click="clearSelection"
        title="Clear selection"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <p v-if="!clientId" class="mt-1 text-xs text-gray-500">Please select a client first</p>
  </div>

  <ContactSelectionModal
    :is-open="isModalOpen"
    :client-id="clientId"
    :client-name="clientName"
    :contacts="contacts"
    :selected-contact="selectedContact"
    :is-loading="isLoading"
    :new-contact-form="newContactForm"
    @close="closeModal"
    @select-contact="selectExistingContact"
    @save-contact="handleSaveContact"
  />
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'
import { toast } from 'vue-sonner'

import { watch } from 'vue'
import { Users, X } from 'lucide-vue-next'
import { useContactManagement } from '@/composables/useContactManagement'
import ContactSelectionModal from './ContactSelectionModal.vue'
import { schemas } from '@/api/generated/api'
import { z } from 'zod'

type ClientContact = z.infer<typeof schemas.ClientContactResult>

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    placeholder?: string
    optional?: boolean
    clientId: string
    clientName: string
    modelValue?: string
    initialContactId?: string
  }>(),
  {
    placeholder: 'No contact selected',
    optional: true,
    modelValue: '',
    initialContactId: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedContact': [contact: ClientContact | null]
}>()

const {
  isModalOpen,
  contacts,
  selectedContact,
  isLoading,
  newContactForm,
  displayValue,
  openModal,
  closeModal,
  loadContactsOnly,
  selectExistingContact: selectFromComposable,
  saveContact,
  clearSelection: clearFromComposable,
  findPrimaryContact,
} = useContactManagement()

const handleOpenModal = async () => {
  debugLog('ContactSelector - handleOpenModal called:', {
    clientId: props.clientId,
    clientName: props.clientName,
    initialContactId: props.initialContactId,
    contacts: contacts.value,
    selectedContact: selectedContact.value,
    newContactForm: newContactForm.value,
  })

  if (!props.clientId) {
    debugLog('Cannot open contact modal without client')
    return
  }

  await openModal(props.clientId, props.clientName)
  debugLog('ContactSelector - after openModal:', {
    isModalOpen: isModalOpen.value,
    contacts: contacts.value,
    selectedContact: selectedContact.value,
    newContactForm: newContactForm.value,
  })
}

const selectExistingContact = (contact: ClientContact) => {
  debugLog('ContactSelector - selectExistingContact:', contact)
  selectFromComposable(contact)
  emitUpdates()
}

const handleSaveContact = async () => {
  debugLog('ContactSelector - handleSaveContact: before save', {
    newContactForm: newContactForm.value,
    selectedContact: selectedContact.value,
  })

  // Validate email format before saving
  if (newContactForm.value.email && !isValidEmail(newContactForm.value.email)) {
    toast.error('Please enter a valid email address')
    return
  }

  toast.info('Creating contact...', { id: 'create-contact' })

  const success = await saveContact()

  toast.dismiss('create-contact')

  debugLog('ContactSelector - handleSaveContact: after save', {
    success,
    newContactForm: newContactForm.value,
    selectedContact: selectedContact.value,
  })
  if (success) {
    toast.success('Contact created successfully!')
    emitUpdates()
  } else {
    toast.error('Failed to create contact. Please check the form and try again.')
  }
}

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const clearSelection = () => {
  debugLog('ContactSelector - clearSelection')
  clearFromComposable()
  emitUpdates()
}

const selectPrimaryContact = async () => {
  debugLog('ContactSelector - selectPrimaryContact called', {
    clientId: props.clientId,
    contactsLength: contacts.value.length,
  })

  if (!props.clientId) {
    debugLog('Cannot select primary contact without client', {
      clientId: props.clientId,
      propsClientId: props.clientId,
    })
    return
  }

  // Load contacts if not already loaded
  if (contacts.value.length === 0) {
    debugLog('Loading contacts for client:', props.clientId)
    await loadContactsOnly(props.clientId)
  }

  // Find and select the primary contact
  const primaryContact = findPrimaryContact()
  if (primaryContact) {
    debugLog('Found primary contact:', primaryContact)
    selectFromComposable(primaryContact)
    emitUpdates()
  } else {
    debugLog('No primary contact found', {
      totalContacts: contacts.value.length,
      contacts: contacts.value,
    })
  }
}

// Expose the method for parent components
defineExpose({
  selectPrimaryContact,
})

const emitUpdates = () => {
  debugLog('ContactSelector - emitUpdates', {
    displayValue: displayValue.value,
    selectedContact: selectedContact.value,
  })
  emit('update:modelValue', displayValue.value)
  emit('update:selectedContact', selectedContact.value)
}

watch(selectedContact, () => {
  debugLog('ContactSelector - selectedContact changed:', selectedContact.value)
  emitUpdates()
})

watch(
  () => props.clientId,
  (newClientId, oldClientId) => {
    if (newClientId !== oldClientId) {
      debugLog('ContactSelector - clientId changed:', { newClientId, oldClientId })
      clearSelection()
    }
  },
)

watch(
  () => [props.clientId, props.initialContactId],
  async ([clientId, contactId]) => {
    debugLog('ContactSelector - watch clientId/initialContactId:', { clientId, contactId })
    if (clientId && contactId && contacts.value.length === 0) {
      await loadContactsOnly(clientId)
      const initialContact = contacts.value.find((contact) => contact.id === contactId)
      if (initialContact) {
        selectFromComposable(initialContact)
      }
    }
  },
  { immediate: true },
)
</script>
