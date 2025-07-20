<template>
  <Dialog :open="isOpen" @update:open="handleDialogChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Client</DialogTitle>
        <DialogDescription>
          Create a new client. All fields except name are optional.
        </DialogDescription>
      </DialogHeader>

      <div v-if="errorMessage" class="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <XCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">Error creating client</p>
            <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
            <div v-if="duplicateClientInfo" class="mt-2 text-xs text-gray-700">
              Existing client in Xero: <b>{{ duplicateClientInfo.name }}</b>
              <span
                v-if="duplicateClientInfo.xero_contact_id"
                class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded"
                >Xero</span
              >
            </div>
          </div>
        </div>
      </div>

      <form
        v-if="!blockedNoXeroId && !duplicateClientInfo"
        @submit.prevent="handleSubmit"
        class="space-y-4"
      >
        <div>
          <label for="clientName" class="block text-sm font-medium text-gray-700 mb-1">
            Client Name <span class="text-red-500">*</span>
          </label>
          <input
            id="clientName"
            v-model="formData.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.name }"
            placeholder="Enter client name"
          />
          <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.name }}
          </p>
        </div>

        <div>
          <label for="clientEmail" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="clientEmail"
            v-model="formData.email"
            type="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.email }"
            placeholder="client@example.com"
          />
          <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.email }}
          </p>
        </div>

        <div>
          <label for="clientPhone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            id="clientPhone"
            v-model="formData.phone"
            type="tel"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.phone }"
            placeholder="Phone number"
          />
          <p v-if="fieldErrors.phone" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.phone }}
          </p>
        </div>

        <div>
          <label for="clientAddress" class="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="clientAddress"
            v-model="formData.address"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.address }"
            placeholder="Client address"
          />
          <p v-if="fieldErrors.address" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.address }}
          </p>
        </div>

        <div class="flex items-center">
          <input
            id="isAccountCustomer"
            v-model="formData.is_account_customer"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="isAccountCustomer" class="ml-2 block text-sm text-gray-700">
            Account Customer
          </label>
        </div>

        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="handleCancel" :disabled="isLoading">
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="bg-blue-600 hover:bg-blue-700"
          >
            {{ isLoading ? 'Creating...' : 'Create Client' }}
          </Button>
        </DialogFooter>
      </form>

      <div v-else class="flex flex-col items-center gap-4 py-6">
        <p class="text-sm text-gray-700" v-if="blockedNoXeroId">
          The client was created but does not have a Xero ID. This client cannot be used until it is
          synced with Xero.
        </p>
        <p class="text-sm text-gray-700" v-if="duplicateClientInfo">
          This client already exists in Xero and cannot be created again.
        </p>
        <div class="flex gap-2">
          <Button type="button" variant="outline" @click="handleAddOther">Add other</Button>
          <Button type="button" variant="outline" @click="handleCancel">Cancel</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRaw } from 'vue'
import { XCircle } from 'lucide-vue-next'
import { ZodError } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api, schemas } from '@/api/generated/api'
import { z } from 'zod'
import type { Client } from '@/composables/useClientLookup'

// Use generated types from Zodios API
type ClientCreateRequest = z.infer<typeof schemas.ClientCreateRequest>
type ClientCreateResponse = z.infer<typeof schemas.ClientCreateResponse>

interface Props {
  isOpen: boolean
  initialName?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialName: '',
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'client-created': [client: Client]
}>()

const formData = ref<ClientCreateRequest>({
  name: '',
  email: '',
  phone: '',
  address: '',
  is_account_customer: false,
})

const isLoading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const blockedNoXeroId = ref(false)
const duplicateClientInfo = ref<{ name: string; xero_contact_id: string } | null>(null)

const isFormValid = computed(() => {
  if (!formData.value.name.trim()) return false
  if (Object.keys(fieldErrors.value).length > 0) return false
  return true
})

const handleDialogChange = (open: boolean) => {
  emit('update:isOpen', open)
}

const validateForm = (): boolean => {
  console.log('🔍 validateForm called')
  console.log('📋 formData before validation:', formData.value)

  fieldErrors.value = {}
  try {
    // Convert reactive object to plain object for validation
    const plainFormData = toRaw(formData.value)
    console.log('🔧 Plain object for validation:', plainFormData)

    schemas.ClientCreateRequest.parse(plainFormData)
    console.log('✅ Schema validation passed')
    return true
  } catch (error: unknown) {
    console.log('❌ Schema validation failed:', error)
    if (error instanceof ZodError) {
      console.log('📜 Zod errors:', error.errors)
      error.errors.forEach((err) => {
        const field = err.path[0]
        if (field) {
          fieldErrors.value[String(field)] = err.message
        }
      })
    }
    return false
  }
}

const handleSubmit = async () => {
  console.log('🚀 handleSubmit called')
  console.log('📝 formData.value:', formData.value)
  console.log('📝 formData.value.name:', formData.value.name)
  console.log('📝 typeof formData.value.name:', typeof formData.value.name)
  console.log('📝 formData.value.name.trim():', formData.value.name?.trim())

  if (!validateForm()) {
    console.log('❌ Form validation failed')
    return
  }

  console.log('✅ Form validation passed')

  isLoading.value = true
  errorMessage.value = ''
  blockedNoXeroId.value = false
  duplicateClientInfo.value = null

  try {
    // Convert reactive object to plain object for Zodios
    const plainFormData = toRaw(formData.value)
    console.log('🌐 About to call API with body:', formData.value)
    console.log('🔧 Plain object for API:', plainFormData)
    console.log('🔧 JSON stringified:', JSON.stringify(plainFormData))

    // Validate the data manually first
    try {
      schemas.ClientCreateRequest.parse(plainFormData)
      console.log('✅ Manual validation passed')
    } catch (validationError) {
      console.log('❌ Manual validation failed:', validationError)
      throw validationError
    }

    // Use Zodios API to create client - try direct approach
    const result: ClientCreateResponse = await api.clients_create_create(plainFormData)

    console.log('📡 API response:', result)

    if (!result.success) {
      if (result.existing_client && result.existing_client.xero_contact_id) {
        duplicateClientInfo.value = result.existing_client
        errorMessage.value = result.error || 'Client already exists in Xero.'
        return
      }
      throw new Error(result.error || 'Failed to create client')
    }

    if (result.client) {
      if (!result.client.xero_contact_id) {
        blockedNoXeroId.value = true
        errorMessage.value =
          'Client was created but does not have a Xero ID. Please try again or contact support.'
        return
      }
      const newClient: Client = {
        id: result.client.id,
        name: result.client.name,
        email: result.client.email || '',
        phone: result.client.phone || '',
        address: result.client.address || '',
        xero_contact_id: result.client.xero_contact_id || '',
      }
      emit('client-created', newClient)
      emit('update:isOpen', false)
    }
  } catch (error) {
    console.error('Error creating client:', error)
    errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleAddOther = () => {
  resetForm()
  blockedNoXeroId.value = false
  duplicateClientInfo.value = null
}

const handleCancel = () => {
  emit('update:isOpen', false)
}

const resetForm = () => {
  console.log('🔄 resetForm called')
  console.log('📋 formData before reset:', formData.value)

  formData.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    is_account_customer: false,
  }

  console.log('📋 formData after reset:', formData.value)

  errorMessage.value = ''
  fieldErrors.value = {}
}

watch(
  () => props.isOpen,
  (isOpen) => {
    console.log('👁️ Modal isOpen changed:', isOpen)
    console.log('🏷️ props.initialName:', props.initialName)

    if (isOpen) {
      console.log('🔄 Resetting form...')
      // Reset form first, then set initial name
      resetForm()
      console.log('📋 Form after reset:', formData.value)

      if (props.initialName) {
        console.log('🏷️ Setting initial name:', props.initialName)
        formData.value.name = props.initialName
        console.log('📋 Form after setting name:', formData.value)
      }
    }
  },
)
</script>
