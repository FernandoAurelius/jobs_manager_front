<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen">
      <div class="sticky top-0 bg-white backdrop-blur-md border-b border-gray-200 p-1">
        <div class="px-3 sm:px-4 lg:px-6 py-1 sm:py-2">
          <div class="space-y-2 lg:space-y-0 pt-2">
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div
                class="flex flex-col sm:flex-row sm:items-end sm:space-x-4 text-center sm:text-left"
              >
                <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  Weekly Timesheet Overview
                </h1>
                <div
                  class="flex items-center justify-center sm:justify-start space-x-2 text-gray-600 mt-1 sm:mt-0"
                >
                  <Calendar class="h-4 w-4 sm:h-5 sm:w-5" />
                  <span class="text-xs sm:text-sm">{{ formatDisplayDateRange() }}</span>
                </div>
              </div>

              <div
                class="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-3 mt-2 sm:mt-0"
              >
                <div class="flex items-center space-x-2">
                  <button
                    @click="toggleIMSMode(!imsMode)"
                    :class="[
                      'relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                      imsMode ? 'bg-gray-600' : 'bg-gray-200',
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform',
                        imsMode ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1',
                      ]"
                    ></span>
                  </button>
                  <Label class="text-gray-700 text-xs sm:text-sm font-medium">Payroll View</Label>
                </div>

                <Button
                  @click="openWeeklyMetricsModal"
                  variant="ghost"
                  size="sm"
                  class="text-gray-600 hover:bg-gray-100 text-xs sm:text-sm"
                >
                  <BarChart3 class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span class="hidden sm:inline">Job Metrics</span>
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
                  @click="goToCurrentWeek"
                  variant="default"
                  size="sm"
                  class="bg-gray-600 hover:bg-gray-700 text-white border-gray-500 font-medium text-xs sm:text-sm"
                >
                  <Home class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span class="hidden sm:inline">This Week</span>
                </Button>
              </div>
            </div>

            <div class="flex items-center justify-center space-x-2 sm:space-x-4">
              <Button
                @click="navigateWeek(-1)"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 px-2 sm:px-4"
              >
                <ChevronLeft class="h-4 w-4 sm:h-5 sm:w-5" />
                <span class="hidden sm:inline ml-1">Previous</span>
              </Button>

              <Button
                @click="openWeekPicker"
                variant="ghost"
                size="sm"
                class="text-gray-600 hover:bg-gray-100 px-3 sm:px-4"
              >
                <CalendarDays class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span class="text-xs sm:text-sm">Change Week</span>
              </Button>

              <Button
                @click="navigateWeek(1)"
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
      </div>

      <div class="flex-1 p-2 sm:p-4 lg:p-1 space-y-3 sm:space-y-4 lg:space-y-6">
        <!-- Loading Spinner -->
        <div v-if="loading" class="flex-1 flex items-center justify-center bg-gray-50">
          <div class="text-center space-y-4 p-8">
            <div
              class="h-12 w-12 mx-auto rounded-full border-4 border-gray-300 border-t-gray-600 animate-spin"
            ></div>
            <p class="text-gray-600 text-lg font-medium">Loading weekly timesheet data...</p>
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

        <div v-else-if="weeklyData" class="space-y-4">
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
                      v-for="day in displayDays"
                      :key="day.date"
                      class="px-1 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      <button
                        @click="goToDailyViewHeader(day.date)"
                        class="transition text-gray-700 hover:text-white hover:bg-gray-600 px-1 py-1 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs"
                        style="min-width: 36px"
                      >
                        <div class="flex flex-col items-center">
                          <span>{{ day.name }}</span>
                          <span class="text-xs text-gray-400 normal-case">{{ day.short }}</span>
                        </div>
                      </button>
                    </th>
                    <th
                      class="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {{ imsMode ? 'Weekly Total' : 'Total' }}
                    </th>
                    <th
                      class="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {{ imsMode ? 'Billable Hours' : 'Billable %' }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <StaffWeekRow
                    v-for="staff in weeklyData.staff_data"
                    :key="staff.staff_id"
                    :staff="staff"
                    :ims-mode="imsMode"
                    :week-days="displayDays"
                    class="hover:bg-gray-50 transition-colors duration-150"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <WeeklyMetricsModal
        :is-open="showWeeklyMetricsModal"
        :weekly-data="weeklyData"
        :week-date="formatToLocalString(selectedWeekStart)"
        @close="closeWeeklyMetricsModal"
      />

      <WeekPickerModal
        :is-open="showWeekPicker"
        :initial-week-start="selectedWeekStart.toISOString().split('T')[0]"
        @close="closeWeekPicker"
        @week-selected="handleWeekSelect"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, onMounted, computed, nextTick } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Home,
  AlertCircle,
  BarChart3,
} from 'lucide-vue-next'

import StaffWeekRow from '@/components/timesheet/StaffWeekRow.vue'
import WeeklyMetricsModal from '@/components/timesheet/WeeklyMetricsModal.vue'
import WeekPickerModal from '@/components/timesheet/WeekPickerModal.vue'

import {
  getWeeklyTimesheetOverview,
  type WeeklyTimesheetData,
  type IMSWeeklyData,
} from '@/services/weekly-timesheet.service'
import {
  dateService,
  createLocalDate,
  formatToLocalString,
  getCurrentWeekStart,
  navigateWeek as navigateWeekDate,
} from '@/services/date.service'
import { useRouter, useRoute } from 'vue-router'

const loading = ref(false)
const error = ref<string | null>(null)
const weeklyData = ref<WeeklyTimesheetData | IMSWeeklyData | null>(null)

const router = useRouter()
const route = useRoute()

const initialWeekStart = route.query.week ? createLocalDate(route.query.week as string) : new Date()
const selectedWeekStart = ref(initialWeekStart)

const imsMode = ref(false)

const showWeeklyMetricsModal = ref(false)
const showWeekPicker = ref(false)

debugLog('🔗 WeeklyTimesheetView URL params:', { week: route.query.week })
debugLog('📊 Using initial week start:', formatToLocalString(selectedWeekStart.value))

const displayDays = computed(() => {
  if (!weeklyData.value) return []

  const days = weeklyData.value.week_days || []

  if (!imsMode.value) {
    debugLog('displayDays raw:', days)
    return days
      .map((dateStr) => {
        return {
          date: dateStr,
          name: dateService.getDayName(dateStr, true),
          short: dateService.getDayNumber(dateStr),
          dayOfWeek: createLocalDate(dateStr).getDay(),
        }
      })
      .filter((day) => day.dayOfWeek >= 1 && day.dayOfWeek <= 5)
  } else {
    return days.map((dateStr) => {
      return {
        date: dateStr,
        name: dateService.getDayName(dateStr, true),
        short: dateService.getDayNumber(dateStr),
      }
    })
  }
})

const formatDisplayDateRange = (): string => {
  if (!weeklyData.value) return ''
  return dateService.formatDateRange(weeklyData.value.start_date, weeklyData.value.end_date)
}

const loadData = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null

    const weekRange = dateService.getWeekRange(selectedWeekStart.value)
    debugLog('Loading weekly timesheet data for:', weekRange.startDate, 'IMS Mode:', imsMode.value)

    weeklyData.value = await getWeeklyTimesheetOverview(weekRange.startDate, imsMode.value)

    debugLog('Loaded weekly data:', weeklyData.value)
  } catch (err) {
    debugLog('Error loading weekly timesheet data:', err)
    error.value = 'Failed to load weekly timesheet data. Please try again.'
  } finally {
    loading.value = false
  }
}

const refreshData = (): void => {
  loadData()
}

const navigateWeek = (direction: number): void => {
  const newWeekStart = navigateWeekDate(formatToLocalString(selectedWeekStart.value), direction)
  selectedWeekStart.value = createLocalDate(newWeekStart)
  updateRoute()
  loadData()
}

const goToCurrentWeek = (): void => {
  const currentWeekStart = getCurrentWeekStart()
  selectedWeekStart.value = createLocalDate(currentWeekStart)
  updateRoute()
  loadData()
}

const updateRoute = () => {
  router.push({
    query: {
      week: formatToLocalString(selectedWeekStart.value),
    },
  })
}

const toggleIMSMode = async (checked: boolean): Promise<void> => {
  debugLog('🔄 IMS Mode toggled:', checked)
  imsMode.value = checked
  debugLog('🔄 IMS Mode state updated to:', imsMode.value)

  await nextTick()
  debugLog('🔄 About to reload data in IMS mode:', imsMode.value)
  await loadData()
}

const goToDailyViewHeader = (date: string) => {
  debugLog('🔗 Navigating to daily view for date:', date)
  router.push({ name: 'timesheet-daily', query: { date } })
}

const openWeeklyMetricsModal = (): void => {
  showWeeklyMetricsModal.value = true
}

const closeWeeklyMetricsModal = (): void => {
  showWeeklyMetricsModal.value = false
}

const openWeekPicker = (): void => {
  showWeekPicker.value = true
}

const closeWeekPicker = (): void => {
  showWeekPicker.value = false
}

const handleWeekSelect = (date: string): void => {
  selectedWeekStart.value = createLocalDate(date)
  updateRoute()
  loadData()
  closeWeekPicker()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.group:hover .transform {
  transform: scale(1.05);
}

tbody tr:hover {
  background-color: rgba(249, 250, 251, 0.5);
  transition: background-color 0.15s ease-in-out;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7);
  }
  50% {
    opacity: 0.5;
    box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s infinite;
}

.ims-data-cell {
  min-width: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafafa;
}

.ims-data-cell .border-t {
  border-top: 1px solid #d1d5db;
}

.text-amber-600 {
  color: #d97706;
}

.text-red-600 {
  color: #dc2626;
}

.text-blue-600 {
  color: #2563eb;
}

.text-green-600 {
  color: #059669;
}

.text-orange-600 {
  color: #ea580c;
}

/* Backgrounds para seções */
.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-green-50 {
  background-color: #f0fdf4;
}

.bg-orange-100 {
  background-color: #fed7aa;
}

.text-orange-800 {
  color: #9a3412;
}
</style>
