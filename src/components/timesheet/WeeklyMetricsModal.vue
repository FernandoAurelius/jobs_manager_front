<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent
      class="!max-w-[95vw] sm:!max-w-5xl lg:!max-w-6xl xl:!max-w-7xl max-h-[90vh] w-full overflow-y-auto p-6"
    >
      <!-- Header -->
      <DialogHeader class="mb-6">
        <div class="flex items-center justify-between pr-16">
          <div class="flex items-center space-x-3">
            <BarChart3 class="h-6 w-6 text-gray-600" />
            <DialogTitle class="text-xl font-bold text-gray-900">Weekly Metrics</DialogTitle>
          </div>

          <div class="flex items-center space-x-8">
            <!-- Detailed Mode Switch -->
            <div class="flex items-center space-x-3">
              <span class="text-sm font-medium text-gray-600">Detailed Mode</span>
              <button
                :disabled="isLoading"
                @click="toggleDetailedMode"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  detailedMode ? 'bg-blue-600' : 'bg-gray-200',
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    detailedMode ? 'translate-x-6' : 'translate-x-1',
                  ]"
                ></span>
              </button>
            </div>
          </div>
        </div>
      </DialogHeader>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-center space-y-4">
          <div
            class="h-8 w-8 mx-auto rounded-full border-4 border-gray-300 border-t-gray-600 animate-spin"
          ></div>
          <p class="text-gray-600 text-sm font-medium">Loading weekly metrics...</p>
        </div>
      </div>

      <div v-else-if="!isLoading">
        <!-- Default View: Weekly Summary -->
        <div v-if="!detailedMode" class="space-y-6">
          <!-- Weekly Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Hours -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-600">Total Hours</p>
                  <p class="text-2xl font-bold text-blue-900">
                    {{ weeklyData?.weekly_summary?.total_hours || 0 }}
                  </p>
                </div>
                <Clock class="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <!-- Total Staff -->
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-600">Total Staff</p>
                  <p class="text-2xl font-bold text-green-900">
                    {{ weeklyData?.weekly_summary?.staff_count || 0 }}
                  </p>
                </div>
                <Users class="h-8 w-8 text-green-500" />
              </div>
            </div>

            <!-- Billable Percentage -->
            <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-purple-600">Billable %</p>
                  <p class="text-2xl font-bold text-purple-900">
                    {{ Math.round(weeklyData?.weekly_summary?.billable_percentage || 0) }}%
                  </p>
                </div>
                <TrendingUp class="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <!-- Active Jobs -->
            <div class="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-orange-600">Active Jobs</p>
                  <p class="text-2xl font-bold text-orange-900">{{ activeJobsCount }}</p>
                </div>
                <Briefcase class="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          <!-- Job Metrics Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Total Estimated Profit -->
            <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-amber-600">Estimated Profit (for this week)</p>
                  <p class="text-2xl font-bold text-amber-900">
                    ${{ formatCurrency(totalEstimatedProfit) }}
                  </p>
                </div>
                <Target class="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <!-- Total Actual Profit -->
            <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-indigo-600">Actual Profit (for this week)</p>
                  <p class="text-2xl font-bold text-indigo-900">
                    ${{ formatCurrency(totalActualProfit) }}
                  </p>
                </div>
                <Activity class="h-8 w-8 text-indigo-500" />
              </div>
            </div>

            <!-- Total Profit -->
            <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-emerald-600">Total Profit (for this week)</p>
                  <p class="text-2xl font-bold text-emerald-900">
                    ${{ formatCurrency(totalProfit) }}
                  </p>
                </div>
                <DollarSign class="h-8 w-8 text-emerald-500" />
              </div>
            </div>
          </div>

          <!-- Staff Completion Status -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <UserCheck class="h-5 w-5 mr-2 text-gray-600" />
              Staff Completion Status
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600">{{ staffCompletionStats.complete }}</p>
                <p class="text-sm text-gray-600">Complete</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-yellow-600">{{ staffCompletionStats.partial }}</p>
                <p class="text-sm text-gray-600">Partial</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-red-600">{{ staffCompletionStats.missing }}</p>
                <p class="text-sm text-gray-600">Missing</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed View: Job Progress Analysis -->
        <div v-else class="space-y-6">
          <!-- Legend -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Visual Indicators</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 rounded border border-red-300 bg-red-50"></div>
                <span class="text-gray-700">Critical: No profit + over hours</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 rounded border border-orange-300 bg-orange-50"></div>
                <span class="text-gray-700">Warning: No profit</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 rounded border border-yellow-300 bg-yellow-50"></div>
                <span class="text-gray-700">Caution: Over estimated hours</span>
              </div>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search jobs by name, client, or job number..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search class="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          </div>

          <!-- Jobs Grid -->
          <div v-if="loading" class="flex justify-center py-8">
            <div class="text-gray-500">Loading jobs...</div>
          </div>

          <div v-else-if="filteredJobs.length === 0" class="text-center py-8">
            <FileX class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500">No jobs found matching your search.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="job in filteredJobs"
              :key="job.job_id"
              :class="[
                'bg-white border rounded-lg shadow-sm hover:shadow-md transition-all p-4 relative',
                getJobStatusClass(job),
              ]"
            >
              <!-- Warning Indicators -->
              <div
                v-if="getJobWarnings(job).length > 0"
                class="absolute top-2 right-2 flex space-x-1"
              >
                <div
                  v-for="warning in getJobWarnings(job)"
                  :key="warning"
                  :title="warning"
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-red-500': warning.includes('profit') || warning.includes('loss'),
                    'bg-yellow-500': warning.includes('hours'),
                  }"
                ></div>
              </div>

              <!-- Job Header -->
              <div class="mb-4 pr-6">
                <div class="flex items-start justify-between mb-2">
                  <h4 class="text-lg font-semibold text-gray-900 truncate">{{ job.name }}</h4>
                  <span class="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                    #{{ job.job_number }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-1">{{ job.client || 'No client assigned' }}</p>
                <p class="text-xs text-gray-500 line-clamp-2">
                  {{ job.description || 'No description available' }}
                </p>

                <!-- Warnings Text -->
                <div v-if="getJobWarnings(job).length > 0" class="mt-2">
                  <div
                    v-for="warning in getJobWarnings(job)"
                    :key="warning"
                    class="text-xs px-2 py-1 rounded text-red-700 bg-red-100 mb-1 inline-block mr-1"
                  >
                    ⚠️ {{ warning }}
                  </div>
                </div>
              </div>

              <!-- Metrics Cards -->
              <div class="grid grid-cols-3 gap-2 mb-4">
                <!-- Estimated Hours -->
                <div class="bg-amber-50 p-3 rounded text-center border border-amber-200">
                  <Target class="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <p class="text-xs text-amber-600 font-medium">Estimated</p>
                  <p class="text-sm font-bold text-amber-900">{{ job.estimated_hours }}h</p>
                </div>

                <!-- Actual Hours -->
                <div
                  :class="[
                    'p-3 rounded text-center border transition-colors',
                    getHoursStatusClass(job),
                  ]"
                >
                  <Activity
                    class="h-4 w-4 mx-auto mb-1"
                    :class="
                      job.actual_hours > job.estimated_hours ? 'text-red-500' : 'text-blue-500'
                    "
                  />
                  <p :class="['text-xs font-medium', getHoursTextClass(job)]">Actual</p>
                  <p
                    :class="[
                      'text-sm font-bold',
                      job.actual_hours > job.estimated_hours ? 'text-red-900' : 'text-blue-900',
                    ]"
                  >
                    {{ job.actual_hours }}h
                  </p>
                </div>

                <!-- Total Profitability -->
                <div
                  :class="[
                    'p-3 rounded text-center border transition-colors',
                    getProfitStatusClass(job),
                  ]"
                >
                  <DollarSign
                    class="h-4 w-4 mx-auto mb-1"
                    :class="job.profit <= 0 ? 'text-red-500' : 'text-green-500'"
                  />
                  <p :class="['text-xs font-medium', getProfitTextClass(job)]">Profit</p>
                  <p
                    :class="[
                      'text-sm font-bold',
                      job.profit <= 0 ? 'text-red-900' : 'text-green-900',
                    ]"
                  >
                    ${{ formatCurrency(job.profit) }}
                  </p>
                </div>
              </div>

              <!-- Assigned Staff -->
              <div v-if="job.people && job.people.length > 0">
                <p class="text-xs text-gray-500 mb-2">Assigned Staff:</p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="person in job.people"
                    :key="(person as Record<string, string>).id"
                    class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    {{ person.name }}
                  </span>
                </div>
              </div>
              <div v-else class="text-xs text-gray-400">No staff assigned</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center py-8">
        <svg
          class="animate-spin h-8 w-8 text-blue-500 mb-3"
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
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <div class="text-gray-500">Loading weekly metrics...</div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  Briefcase,
  Target,
  Activity,
  DollarSign,
  UserCheck,
  Search,
  FileX,
} from 'lucide-vue-next'
import Dialog from '../ui/dialog/Dialog.vue'
import DialogContent from '../ui/dialog/DialogContent.vue'
import DialogHeader from '../ui/dialog/DialogHeader.vue'
import DialogTitle from '../ui/dialog/DialogTitle.vue'
import type { TypedWeeklyTimesheetData, IMSWeeklyData } from '../../api/local/schemas'
import { api, schemas } from '../../api/generated/api'
import { z } from 'zod'

type WeeklyJobs = z.infer<typeof schemas.WeeklyMetrics>

interface Props {
  isOpen: boolean
  weeklyData: TypedWeeklyTimesheetData | IMSWeeklyData | null
  weekDate?: string // Week date in YYYY-MM-DD format
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const detailedMode = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const isLoading = ref(false)

const jobs = ref<WeeklyJobs>([])

const filteredJobs = computed(() => {
  if (!searchQuery.value.trim()) return jobs.value

  const query = searchQuery.value.toLowerCase()
  return jobs.value.filter(
    (job) =>
      job.name.toLowerCase().includes(query) ||
      (job.client && job.client.toLowerCase().includes(query)) ||
      (job as Record<string, number>).job_number.toString().toLowerCase().includes(query) ||
      (job.description && job.description.toLowerCase().includes(query)),
  )
})

// Computed properties for metrics
const activeJobsCount = computed(() => jobs.value.length)

// Helper functions for job status analysis
const getJobStatusClass = (job: WeeklyJobs[0]) => {
  const hasNegativeProfit = job.profit <= 0
  const isOverEstimate = job.actual_hours > job.estimated_hours

  if (hasNegativeProfit && isOverEstimate) {
    return 'border-red-300 bg-red-50'
  } else if (hasNegativeProfit) {
    return 'border-orange-300 bg-orange-50'
  } else if (isOverEstimate) {
    return 'border-yellow-300 bg-yellow-50'
  }
  return 'border-gray-200'
}

const getHoursStatusClass = (job: WeeklyJobs[0]) => {
  const isOverEstimate = job.actual_hours > job.estimated_hours
  if (isOverEstimate) {
    return 'bg-red-50 border-red-200'
  }
  return 'bg-blue-50'
}

const getProfitStatusClass = (job: WeeklyJobs[0]) => {
  const hasNegativeProfit = job.profit <= 0
  if (hasNegativeProfit) {
    return 'bg-red-50 border-red-200'
  }
  return 'bg-green-50'
}

const getProfitTextClass = (job: WeeklyJobs[0]) => {
  const hasNegativeProfit = job.profit <= 0
  return hasNegativeProfit ? 'text-red-600' : 'text-green-600'
}

const getHoursTextClass = (job: WeeklyJobs[0]) => {
  const isOverEstimate = job.actual_hours > job.estimated_hours
  return isOverEstimate ? 'text-red-600' : 'text-blue-600'
}

const getJobWarnings = (job: WeeklyJobs[0]) => {
  const warnings = []
  if (job.profit <= 0) {
    warnings.push('No profit or loss')
  }
  if (job.actual_hours > job.estimated_hours) {
    warnings.push('Over estimated hours')
  }
  return warnings
}

const totalEstimatedProfit = computed(() => {
  return (props.weeklyData?.job_metrics?.total_estimated_profit || 0) as number
})

const totalActualProfit = computed(() => {
  return (props.weeklyData?.job_metrics?.total_actual_profit || 0) as number
})

const totalProfit = computed(() => {
  return (props.weeklyData?.job_metrics?.total_profit || 0) as number
})

const staffCompletionStats = computed(() => {
  if (!props.weeklyData?.staff_data) {
    return { complete: 0, partial: 0, missing: 0 }
  }

  let complete = 0
  let partial = 0
  let missing = 0

  props.weeklyData.staff_data.forEach((staff) => {
    const totalHours = staff.weekly_hours?.reduce((sum, day) => sum + day.hours, 0) || 0

    if (totalHours === 0) {
      missing++
    } else if (totalHours >= 40) {
      complete++
    } else {
      partial++
    }
  })

  return { complete, partial, missing }
})

const closeModal = () => {
  emit('close')
}

const handleOpenChange = (open: boolean) => {
  if (!open) {
    closeModal()
  }
}

const toggleDetailedMode = () => {
  detailedMode.value = !detailedMode.value
  if (detailedMode.value && jobs.value.length === 0) {
    loadJobs()
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const loadJobs = async () => {
  isLoading.value = true
  try {
    const params = props.weekDate ? { week: props.weekDate } : undefined
    const response = await api.getWeeklyMetrics(params)
    jobs.value = response || []
    console.log(`📊 Loaded ${jobs.value.length} jobs for week: ${props.weekDate || 'current'}`)
  } catch (error) {
    console.error('❌ Error loading jobs:', error)
    jobs.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for modal opening to load jobs and metrics
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      console.log('🔍 Modal opened - weeklyData structure:', {
        weeklyData: props.weeklyData,
        weekDate: props.weekDate,
        job_metrics: props.weeklyData?.job_metrics,
        weekly_summary: props.weeklyData?.weekly_summary,
        weeklyData_keys: props.weeklyData ? Object.keys(props.weeklyData) : 'No weeklyData',
      })

      if (jobs.value.length === 0) {
        loadJobs()
      }
    }
  },
)

// Watch for week date changes to reload jobs
watch(
  () => props.weekDate,
  (newWeekDate, oldWeekDate) => {
    if (props.isOpen && newWeekDate !== oldWeekDate) {
      console.log(`📅 Week changed from ${oldWeekDate} to ${newWeekDate}, reloading jobs...`)
      loadJobs()
    }
  },
)
</script>
