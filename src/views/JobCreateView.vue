<template>
  <AppLayout>
    <div class="flex flex-col h-screen max-h-screen overflow-hidden">
      <div class="flex-shrink-0 p-4 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-900">Create New Job</h1>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="max-w-2xl mx-auto">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="space-y-6">
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                    Job Name *
                  </label>
                  <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    :class="{ 'border-red-500': errors.name }"
                    placeholder="Enter job name"
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                    {{ errors.name }}
                  </p>
                </div>

                <div>
                  <ClientLookup
                    id="client"
                    v-model="formData.client_name"
                    @update:selected-id="formData.client_id = $event"
                    @update:selected-client="handleClientSelection"
                    label="Client"
                    :required="true"
                    placeholder="Search for a client..."
                  />
                  <p v-if="errors.client_id" class="mt-1 text-sm text-red-600">
                    {{ errors.client_id }}
                  </p>
                </div>

                <div>
                  <ContactSelector
                    id="contact"
                    v-model="formData.contact_person"
                    :client-id="formData.client_id"
                    :client-name="formData.client_name || ''"
                    label="Contact (Optional)"
                    placeholder="Search or add contact person"
                    :optional="true"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      for="estimatedMaterials"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Estimated materials ($)
                    </label>
                    <input
                      id="estimatedMaterials"
                      type="number"
                      step="0.01"
                      min="0"
                      v-model.number="formData.estimatedMaterials"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :class="{ 'border-red-500': errors.estimatedMaterials }"
                      placeholder="0.00"
                    />
                    <p v-if="errors.estimatedMaterials" class="mt-1 text-sm text-red-600">
                      {{ errors.estimatedMaterials }}
                    </p>
                  </div>
                  <div>
                    <label for="estimatedTime" class="block text-sm font-medium text-gray-700 mb-2">
                      Estimated time (hours)
                    </label>
                    <input
                      id="estimatedTime"
                      type="number"
                      step="0.01"
                      min="0.01"
                      v-model.number="formData.estimatedTime"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      :class="{ 'border-red-500': errors.estimatedTime }"
                      placeholder="0.00"
                    />
                    <p v-if="errors.estimatedTime" class="mt-1 text-sm text-red-600">
                      {{ errors.estimatedTime }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                    Description (for invoice)
                  </label>
                  <textarea
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Job description for invoice"
                  />
                </div>

                <div>
                  <label for="order_number" class="block text-sm font-medium text-gray-700 mb-2">
                    Order Number
                  </label>
                  <input
                    id="order_number"
                    v-model="formData.order_number"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PO/Order number"
                  />
                </div>

                <div>
                  <RichTextEditor
                    v-model="formData.notes"
                    label="Job Notes"
                    placeholder="Internal notes about the job"
                    :required="false"
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                @click="navigateBack"
                class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                :disabled="isSubmitting"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting || !canSubmit"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="isSubmitting" class="flex items-center">
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
                  Creating...
                </span>
                <span v-else>Create Job</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelector from '@/components/ContactSelector.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { jobService, type JobCreateData } from '@/services/job.service'
import { costlineService } from '@/services/costline.service'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import { schemas } from '@/api/generated/api'
import { z } from 'zod'

type ClientSearchResult = z.infer<typeof schemas.ClientSearchResult>
import { toast } from 'vue-sonner'

const router = useRouter()
const companyDefaultsStore = useCompanyDefaultsStore()

const formData = ref<JobCreateData & { estimatedMaterials: number; estimatedTime: number }>({
  name: '',
  client_id: '',
  client_name: '',
  description: '',
  order_number: '',
  notes: '',
  contact_person: '',
  estimatedMaterials: 0,
  estimatedTime: 0,
})

const selectedClient = ref<ClientSearchResult | null>(null)

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

const handleClientSelection = (client: ClientSearchResult | null) => {
  selectedClient.value = client
  if (client) {
    formData.value.client_name = client.name
    formData.value.client_id = client.id
  } else {
    formData.value.client_name = ''
    formData.value.client_id = ''
  }
}

const canSubmit = computed(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.client_id !== '' &&
    formData.value.estimatedMaterials >= 0 &&
    formData.value.estimatedTime > 0
  )
})

const navigateBack = () => {
  router.push({ name: 'kanban' })
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = 'Job name is required'
    return false
  }

  if (!formData.value.client_id) {
    errors.value.client_id = 'Client selection is required'
    return false
  }

  if (formData.value.estimatedMaterials < 0) {
    errors.value.estimatedMaterials = 'Estimated materials must be 0 or greater'
    return false
  }

  if (formData.value.estimatedTime < 0.01) {
    errors.value.estimatedTime = 'Estimated time must be at least 0.01 hours'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  toast.info('Creating job…', { id: 'create-job' })

  try {
    const result = await jobService.createJob(formData.value)

    if (result.success && result.job_id) {
      const job_id = result.job_id
      try {
        await costlineService.createCostLine(job_id, 'estimate', {
          kind: 'material',
          desc: 'Estimated materials',
          quantity: '1',
          unit_cost: formData.value.estimatedMaterials.toFixed(2),
          unit_rev: (
            formData.value.estimatedMaterials *
            (1 + (companyDefaultsStore.companyDefaults?.materials_markup ?? 0))
          ).toFixed(2),
        })
      } catch (error: unknown) {
        toast.error((error as Error).message)
      }
      try {
        await costlineService.createCostLine(job_id, 'estimate', {
          kind: 'time',
          desc: 'Estimated time',
          quantity: formData.value.estimatedTime.toFixed(2),
          unit_cost: (companyDefaultsStore.companyDefaults?.wage_rate ?? 0).toFixed(2),
          unit_rev: (companyDefaultsStore.companyDefaults?.charge_out_rate ?? 0).toFixed(2),
        })
      } catch (error: unknown) {
        toast.error((error as Error).message)
      }
      toast.success('Job created!')
      toast.dismiss('create-job')
      router.push({ name: 'job-edit', params: { id: job_id } })
    } else {
      throw new Error(result.error || 'Failed to create job')
    }
  } catch (error: unknown) {
    toast.error('Failed to create job: ' + ((error as Error).message || error))
    toast.dismiss('create-job')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = key === 'estimatedMaterials' ? 0 : key === 'estimatedTime' ? 0 : ''
  })
})
</script>
