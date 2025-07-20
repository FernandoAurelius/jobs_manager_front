<template>
  <AppLayout>
    <div class="sticky top-0 bg-white backdrop-blur-md border-b border-gray-200">
      <div class="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        <div class="flex items-center justify-center pt-2">
          <div class="flex items-center space-x-6 sm:space-x-8 lg:space-x-12">
            <!-- Left: Title and Date -->
            <div class="flex items-center space-x-4">
              <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Daily Timesheet
              </h1>
              <div class="flex items-center space-x-2 text-gray-600">
                <Calendar class="h-4 w-4 sm:h-5 sm:w-5" />
                <span class="text-xs sm:text-sm">{{ formatDisplayDate(selectedDate) }}</span>
              </div>
            </div>

            <!-- Right: Action Buttons -->
            <div class="flex items-center space-x-2 sm:space-x-3">
              <Button
                @click="openMetricsModal"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 text-xs sm:text-sm"
              >
                <BarChart3 class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span class="hidden sm:inline">Metrics</span>
              </Button>

              <Button
                @click="refreshData"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 text-xs sm:text-sm"
                :disabled="loading"
              >
                <RefreshCw
                  class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2"
                  :class="{ 'animate-spin': loading }"
                />
                <span class="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                @click="goToToday"
                variant="default"
                size="sm"
                class="bg-gray-600 hover:bg-gray-700 text-white border-gray-500 font-medium text-xs sm:text-sm"
              >
                <Home class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span class="hidden sm:inline">Today</span>
              </Button>
            </div>
          </div>
        </div>

        <!-- Navigation Row -->
        <div class="flex items-center justify-center space-x-2 sm:space-x-4 mt-3">
          <Button
            @click="navigateDate(-1)"
            variant="ghost"
            size="sm"
            class="text-gray-600 hover:bg-gray-100 px-2 sm:px-4"
          >
            <ChevronLeft class="h-4 w-4 sm:h-5 sm:w-5" />
            <span class="hidden sm:inline ml-1">Previous</span>
          </Button>

          <div class="flex items-center space-x-2">
            <input
              type="date"
              v-model="selectedDate"
              @change="loadData"
              class="px-2 sm:px-3 py-1 sm:py-2 bg-white border border-gray-300 rounded-md text-gray-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 w-32 sm:w-auto"
            />
          </div>

          <Button
            @click="navigateDate(1)"
            variant="ghost"
            size="sm"
            class="text-gray-600 hover:bg-gray-100 px-2 sm:px-4"
          >
            <span class="hidden sm:inline mr-1">Next</span>
            <ChevronRight class="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>

    <div class="flex-1 p-2 sm:p-4 lg:p-1 space-y-3 sm:space-y-4 lg:space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-8 sm:py-12">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-gray-600 mx-auto mb-4"
          ></div>
          <p class="text-gray-600 text-sm sm:text-base">Loading timesheet data...</p>
        </div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
        <div class="flex items-start space-x-3">
          <AlertCircle class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <h3 class="text-base sm:text-lg font-semibold text-red-900">Error Loading Data</h3>
            <p class="text-red-700 text-sm sm:text-base mt-1">{{ error }}</p>
            <Button @click="refreshData" class="mt-3" variant="outline" size="sm">
              <RefreshCw class="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>

      <div v-else-if="summary" class="space-y-4">
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-18rem)] lg:h-[calc(100vh-10rem)]"
        >
          <div class="flex-1 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    class="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Staff Member
                  </th>
                  <th
                    class="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hours
                  </th>
                  <th
                    class="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    class="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <StaffRow
                  v-for="staff in summary.staff_data"
                  :key="staff.staff_id"
                  :staff="staff"
                  :date="selectedDate"
                  @view-details="openStaffModal"
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <StaffDetailModal
      v-if="selectedStaff"
      :staff="selectedStaff"
      :date="selectedDate"
      :open="showStaffModal"
      @close="closeStaffModal"
    />

    <MetricsModal
      v-if="summary"
      :summary="summary"
      :open="showMetricsModal"
      @close="closeMetricsModal"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home,
  AlertCircle,
  BarChart3,
} from 'lucide-vue-next'

import StaffRow from '@/components/timesheet/StaffRow.vue'
import StaffDetailModal from '@/components/timesheet/StaffDetailModal.vue'
import MetricsModal from '@/components/timesheet/MetricsModal.vue'

import {
  getDailyTimesheetSummary,
  type DailyTimesheetSummary,
  type StaffDailyData,
} from '@/services/daily-timesheet.service'
import { dateService, today, navigateDay } from '@/services/date.service'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<DailyTimesheetSummary | null>(null)

const initialDate = (route.query.date as string) || today()
const selectedDate = ref(initialDate)

const selectedStaff = ref<StaffDailyData | null>(null)
const showStaffModal = ref(false)
const showMetricsModal = ref(false)

debugLog('🔗 DailyTimesheetView URL params:', { date: route.query.date })
debugLog('📊 Using initial date:', initialDate)

const formatDisplayDate = (date: string): string => {
  return dateService.formatDisplayDate(date, {
    weekday: true,
    year: true,
    month: 'long',
  })
}

const loadData = async (): Promise<void> => {
  if (!selectedDate.value) return

  try {
    loading.value = true
    error.value = null

    debugLog('Loading daily timesheet data for:', selectedDate.value)

    summary.value = await getDailyTimesheetSummary(selectedDate.value)

    debugLog('Loaded summary:', summary.value)
  } catch (err) {
    debugLog('Error loading timesheet data:', err)
    error.value = 'Failed to load timesheet data. Please try again.'
  } finally {
    loading.value = false
  }
}

const refreshData = (): void => {
  loadData()
}

const navigateDate = (days: number): void => {
  selectedDate.value = navigateDay(selectedDate.value, days)
  updateRoute()
  loadData()
}

const goToToday = (): void => {
  selectedDate.value = today()
  updateRoute()
  loadData()
}

const updateRoute = () => {
  router.push({
    query: {
      date: selectedDate.value,
    },
  })
}

const openStaffModal = (staff: StaffDailyData): void => {
  selectedStaff.value = staff
  showStaffModal.value = true
}

const closeStaffModal = (): void => {
  selectedStaff.value = null
  showStaffModal.value = false
}

const openMetricsModal = (): void => {
  showMetricsModal.value = true
}

const closeMetricsModal = (): void => {
  showMetricsModal.value = false
}

onMounted(() => {
  loadData()
})

watch(
  () => route.query.date,
  (newDate) => {
    if (newDate && newDate !== selectedDate.value) {
      debugLog('📅 Updating date from URL:', newDate)
      selectedDate.value = newDate as string
      loadData()
    }
  },
  { immediate: false },
)

watch(selectedDate, (newDate) => {
  if (newDate && newDate !== route.query.date) {
    debugLog('📅 Updating URL from date change:', newDate)
    updateRoute()
  }
})
</script>
