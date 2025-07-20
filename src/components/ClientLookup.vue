<template>
  <div class="relative">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="flex space-x-2">
      <div class="flex-1 relative">
        <input
          :id="id"
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          :required="required"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          autocomplete="off"
        />

        <div v-if="isLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>

        <div
          v-if="showSuggestions && (suggestions.length > 0 || searchQuery.length >= 3)"
          class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <div
            v-for="client in suggestions"
            :key="client.id"
            class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            @mousedown.prevent="selectClient(client)"
          >
            <div class="font-medium text-gray-900">{{ client.name }}</div>
            <div v-if="client.email" class="text-sm text-gray-500">{{ client.email }}</div>
          </div>

          <div
            v-if="searchQuery.length >= 3"
            class="px-4 py-2 hover:bg-green-50 cursor-pointer border-t border-gray-200 text-green-700 font-medium"
            @mousedown.prevent="handleCreateNew"
          >
            <div class="flex items-center">
              <Plus class="w-4 h-4 mr-2" />
              Add new {{ supplierLookup ? 'supplier' : 'client' }} "{{ searchQuery }}"
            </div>
          </div>

          <div
            v-if="suggestions.length === 0 && searchQuery.length >= 3 && !isLoading"
            class="px-4 py-2 text-gray-500 text-center"
          >
            No clients found
          </div>
        </div>
      </div>

      <div class="flex items-end">
        <div
          v-if="selectedClient"
          :class="[
            'px-3 py-2 rounded-md text-xs font-medium flex items-center space-x-1',
            hasValidXeroId
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200',
          ]"
          :title="hasValidXeroId ? 'Client has Xero ID' : 'Client missing Xero ID'"
        >
          <component :is="hasValidXeroId ? CheckCircle : XCircle" class="w-3 h-3" />
          <span>Xero</span>
        </div>
      </div>
    </div>

    <div v-if="selectedClient" class="mt-2 p-2 bg-blue-50 rounded border">
      <div class="text-sm font-medium text-blue-900">{{ selectedClient.name }}</div>
      <div v-if="selectedClient.email" class="text-xs text-blue-700">
        {{ selectedClient.email }}
      </div>
    </div>

    <CreateClientModal
      :is-open="showCreateModal"
      :initial-name="searchQuery"
      @update:is-open="showCreateModal = $event"
      @client-created="handleClientCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, CheckCircle, XCircle } from 'lucide-vue-next'
import { useClientLookup } from '@/composables/useClientLookup'
import CreateClientModal from '@/components/CreateClientModal.vue'
import type { Client } from '@/composables/useClientLookup'

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    placeholder?: string
    required?: boolean
    modelValue?: string
    supplierLookup?: boolean
  }>(),
  {
    placeholder: 'Search for a client...',
    required: false,
    modelValue: '',
    supplierLookup: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedClient': [client: Client | null]
  'update:selectedId': [id: string]
}>()

const {
  searchQuery,
  suggestions,
  isLoading,
  showSuggestions,
  selectedClient,
  hasValidXeroId,
  handleInputChange,
  selectClient: selectClientFromComposable,
  hideSuggestions,
} = useClientLookup()

const showCreateModal = ref(false)

const blurTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

if (props.modelValue) {
  searchQuery.value = props.modelValue
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  handleInputChange(value)
  emit('update:modelValue', value)
}

const handleFocus = () => {
  if (blurTimeout.value) {
    clearTimeout(blurTimeout.value)
  }

  if (searchQuery.value.length >= 3) {
    showSuggestions.value = true
  }
}

const handleBlur = () => {
  blurTimeout.value = setTimeout(() => {
    hideSuggestions()
  }, 200)
}

const selectClient = (client: Client) => {
  selectClientFromComposable(client)

  emit('update:modelValue', client.name)
  emit('update:selectedClient', client)
  emit('update:selectedId', client.id)
}

const handleCreateNew = () => {
  showCreateModal.value = true
  hideSuggestions()
}

const handleClientCreated = (client: Client) => {
  selectClient(client)
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== searchQuery.value) {
      searchQuery.value = newValue
    }
  },
)

watch(selectedClient, (newClient) => {
  if (newClient) {
    emit('update:selectedClient', newClient)
    emit('update:selectedId', newClient.id)
  } else {
    emit('update:selectedClient', null)
    emit('update:selectedId', '')
  }
})
</script>
