<template>
  <div class="relative">
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div class="relative">
      <select
        :id="id"
        v-model="selectedValue"
        :disabled="isLoading"
        class="w-full p-2 border border-gray-200 rounded-md appearance-none bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
        @change="handleChange"
      >
        <option v-if="isLoading" value="">Loading clients...</option>
        <option v-else value="">{{ placeholder }}</option>
        <option
          v-for="client in clientOptions"
          :key="client.id || client.name"
          :value="client.name"
        >
          {{ client.name }}
        </option>
      </select>
      <div v-if="isLoading" class="absolute top-1/2 right-8 transform -translate-y-1/2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
      <div v-else class="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown class="h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { api, schemas } from '@/api/generated/api'
import { z } from 'zod'

// Use generated types from Zodios API
type Client = z.infer<typeof schemas.Client>

interface Props {
  id: string
  label: string
  placeholder?: string
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Any Client',
})

const emit = defineEmits<Emits>()

const clientOptions = ref<Client[]>([])
const selectedValue = ref<string>(props.modelValue || '')
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadClientOptions = async (): Promise<void> => {
  try {
    isLoading.value = true
    error.value = null
    // Use Zodios API to get all clients
    const data = await api.clients_all_retrieve()
    clientOptions.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load client options'
    console.error('Error loading client options:', err)
  } finally {
    isLoading.value = false
  }
}

const handleChange = (): void => {
  emit('update:modelValue', selectedValue.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    selectedValue.value = newValue || ''
  },
)

onMounted(() => {
  loadClientOptions()
})
</script>
