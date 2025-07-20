<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div
      class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
        @click="closeModal"
      ></div>

      <div
        class="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900">🏖️ Add Paid Absence</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="submitAbsence" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Staff Member * </label>
            <select
              v-model="form.staffId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select staff member...</option>
              <option v-for="staff in availableStaff" :key="staff.id" :value="staff.id">
                {{ staff.name }} ({{ staff.initials }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Absence Type * </label>
            <select
              v-model="form.absenceType"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select absence type...</option>
              <option value="vacation">🏖️ Vacation</option>
              <option value="sick">🤒 Sick Leave</option>
              <option value="personal">👤 Personal Day</option>
              <option value="bereavement">💐 Bereavement</option>
              <option value="jury_duty">⚖️ Jury Duty</option>
              <option value="training">📚 Training</option>
              <option value="other">📝 Other</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Start Date * </label>
              <input
                v-model="form.startDate"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> End Date * </label>
              <input
                v-model="form.endDate"
                type="date"
                required
                :min="form.startDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Hours per Day * </label>
            <select
              v-model="form.hoursPerDay"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select hours...</option>
              <option value="4">4 hours (Half Day)</option>
              <option value="8">8 hours (Full Day)</option>
              <option value="custom">Custom Hours</option>
            </select>
          </div>

          <div v-if="form.hoursPerDay === 'custom'">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Custom Hours * </label>
            <input
              v-model.number="form.customHours"
              type="number"
              min="0.5"
              max="12"
              step="0.5"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter hours (e.g., 6.5)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional: Add additional details about the absence..."
            ></textarea>
          </div>

          <div v-if="absenceSummary" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 class="font-medium text-blue-900 mb-2">Summary</h4>
            <div class="text-sm text-blue-700 space-y-1">
              <p><strong>Duration:</strong> {{ absenceSummary.duration }}</p>
              <p><strong>Total Hours:</strong> {{ absenceSummary.totalHours }}</p>
              <p><strong>Working Days:</strong> {{ absenceSummary.workingDays }}</p>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 p-4 rounded-lg border border-red-200">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ loading ? 'Adding...' : 'Add Absence' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { StaffMemberUI, AbsenceForm, AbsenceSummary } from '@/api/local/schemas'

defineProps<{
  isOpen: boolean
  availableStaff: StaffMemberUI[]
}>()

const emit = defineEmits<{
  close: []
  absenceAdded: [absence: AbsenceForm]
}>()

const loading = ref(false)
const error = ref('')

const form = ref<AbsenceForm>({
  staffId: '',
  absenceType: '',
  startDate: '',
  endDate: '',
  hoursPerDay: '',
  customHours: undefined,
  description: '',
})

const isFormValid = computed(() => {
  const basic =
    form.value.staffId &&
    form.value.absenceType &&
    form.value.startDate &&
    form.value.endDate &&
    form.value.hoursPerDay

  if (form.value.hoursPerDay === 'custom') {
    return basic && form.value.customHours && form.value.customHours > 0
  }

  return basic
})

const absenceSummary = computed((): AbsenceSummary | null => {
  if (!form.value.startDate || !form.value.endDate || !form.value.hoursPerDay) {
    return null
  }

  const startDate = new Date(form.value.startDate)
  const endDate = new Date(form.value.endDate)

  if (endDate < startDate) {
    return null
  }

  const workingDays = getWorkingDaysBetween(startDate, endDate)
  const hoursPerDay =
    form.value.hoursPerDay === 'custom'
      ? form.value.customHours || 0
      : parseInt(form.value.hoursPerDay)

  const totalHours = workingDays * hoursPerDay

  return {
    duration: formatDateRange(startDate, endDate),
    totalHours,
    workingDays,
  }
})

function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let workingDays = 0
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return workingDays
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  }

  if (startDate.getTime() === endDate.getTime()) {
    return startDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })
  }

  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
  }

  return `${startDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
}

async function submitAbsence() {
  if (!isFormValid.value) return

  loading.value = true
  error.value = ''

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    emit('absenceAdded', { ...form.value })
    resetForm()
    closeModal()
  } catch (err) {
    error.value = 'Failed to add paid absence. Please try again.'
    debugLog('Error adding absence:', err)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    staffId: '',
    absenceType: '',
    startDate: '',
    endDate: '',
    hoursPerDay: '',
    customHours: undefined,
    description: '',
  }
  error.value = ''
}

function closeModal() {
  emit('close')
  resetForm()
}

watch(
  () => form.value.startDate,
  (newStartDate) => {
    if (
      newStartDate &&
      form.value.endDate &&
      new Date(newStartDate) > new Date(form.value.endDate)
    ) {
      form.value.endDate = newStartDate
    }
  },
)

watch(
  () => form.value.hoursPerDay,
  (newHours) => {
    if (newHours !== 'custom') {
      form.value.customHours = undefined
    }
  },
)
</script>
