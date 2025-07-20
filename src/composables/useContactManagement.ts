import { ref, computed } from 'vue'
import { api } from '../api/generated/api'
import type { ClientContact } from '@/composables/useClientLookup'
import { debugLog } from '@/utils/debug'
import { type NewContactData } from '@/api/local/schemas'

export function useContactManagement() {
  const isModalOpen = ref(false)
  const contacts = ref<ClientContact[]>([])
  const selectedContact = ref<ClientContact | null>(null)
  const isLoading = ref(false)
  const currentClientId = ref<string>('')
  const currentClientName = ref<string>('')

  const newContactForm = ref<NewContactData>({
    name: '',
    position: '',
    email: '',
    phone: '',
    notes: '',
    is_primary: false,
  })

  const hasContacts = computed(() => contacts.value.length > 0)

  const displayValue = computed(() => {
    if (!selectedContact.value) return ''

    const contact = selectedContact.value
    const parts = [contact.name]

    if (contact.phone) parts.push(contact.phone)
    if (contact.email) parts.push(contact.email)

    return parts.join(' - ')
  })

  const openModal = async (clientId: string, clientName: string) => {
    if (!clientId) {
      debugLog('Cannot open contact modal without client ID')
      return
    }

    currentClientId.value = clientId
    currentClientName.value = clientName
    isModalOpen.value = true

    resetNewContactForm()

    await loadContacts(clientId)
  }

  const closeModal = () => {
    isModalOpen.value = false
    resetNewContactForm()
  }

  const loadContacts = async (clientId: string) => {
    if (!clientId) {
      contacts.value = []
      return
    }

    isLoading.value = true
    try {
      const response = await api.clients_contacts_retrieve({
        params: { client_id: clientId },
      })

      if (response && response.results && Array.isArray(response.results)) {
        contacts.value = response.results
      } else {
        contacts.value = []
      }
    } catch (error) {
      debugLog('Error loading contacts:', error)
      contacts.value = []
    } finally {
      isLoading.value = false
    }
  }

  const loadContactsOnly = async (clientId: string) => {
    await loadContacts(clientId)
  }

  const selectExistingContact = (contact: ClientContact) => {
    selectedContact.value = contact
    closeModal()
  }

  const createNewContact = async (): Promise<boolean> => {
    if (!currentClientId.value) {
      debugLog('Cannot create contact without client ID')
      return false
    }

    if (!newContactForm.value.name.trim()) {
      debugLog('Contact name is required')
      return false
    }

    isLoading.value = true

    try {
      const contactData = {
        client_id: currentClientId.value,
        name: newContactForm.value.name.trim(),
        position: newContactForm.value.position?.trim() || '',
        email: newContactForm.value.email?.trim() || '',
        phone: newContactForm.value.phone?.trim() || '',
        notes: newContactForm.value.notes?.trim() || '',
        is_primary: newContactForm.value.is_primary,
      }

      const response = await api.clients_contacts_create(contactData)

      if (!response) {
        throw new Error('Invalid response from server')
      }

      // The response should be the created contact itself
      const newContact: ClientContact = response as ClientContact

      selectedContact.value = newContact

      await loadContacts(currentClientId.value)

      closeModal()
      return true
    } catch (error) {
      debugLog('Error creating contact:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const resetNewContactForm = () => {
    newContactForm.value = {
      name: '',
      position: '',
      email: '',
      phone: '',
      notes: '',
      is_primary: false,
    }
  }

  const saveContact = async (): Promise<boolean> => {
    const hasNewContactData = newContactForm.value.name.trim().length > 0

    switch (true) {
      case hasNewContactData:
        return await createNewContact()

      case selectedContact.value !== null:
        closeModal()
        return true

      default:
        debugLog('Please select an existing contact or create a new one')
        return false
    }
  }

  const clearSelection = () => {
    selectedContact.value = null
  }

  const updateContactsList = (newContacts: ClientContact[]) => {
    contacts.value = newContacts
  }

  const findPrimaryContact = (): ClientContact | null => {
    if (contacts.value.length === 0) {
      return null
    }

    return contacts.value.find((contact) => contact.is_primary) || null
  }

  return {
    isModalOpen,
    contacts,
    selectedContact,
    isLoading,
    currentClientName,
    newContactForm,

    hasContacts,
    displayValue,

    openModal,
    closeModal,
    loadContacts,
    loadContactsOnly,
    selectExistingContact,
    createNewContact,
    saveContact,
    clearSelection,
    updateContactsList,
    findPrimaryContact,
    resetNewContactForm,
  }
}
