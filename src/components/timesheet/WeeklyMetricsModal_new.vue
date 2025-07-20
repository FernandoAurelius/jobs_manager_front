<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="max-w-7xl h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-xl font-semibold text-gray-900">
          Job Progress Analysis
        </DialogTitle>
      </DialogHeader>

        <!-- Job Progress Analysis (Always Shown) -->
        <div class="space-y-6">
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

          <!-- Summary Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <!-- Total Estimated Hours -->
            <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-amber-600">Est. Hours</p>
                  <p class="text-2xl font-bold text-amber-900">{{ totalEstimatedHours }}</p>
                </div>
                <Target class="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <!-- Total Actual Hours -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-600">Actual Hours</p>
                  <p class="text-2xl font-bold text-blue-900">{{ totalActualHours }}</p>
                </div>
                <Activity class="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <!-- Total Revenue -->
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-600">Revenue</p>
                  <p class="text-2xl font-bold text-green-900">${{ formatCurrency(totalRevenue) }}</p>
                </div>
                <DollarSign class="h-8 w-8 text-green-500" />
              </div>
            </div>

            <!-- Profitability Percentage -->
            <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-purple-600">Profit Margin</p>
                  <p class="text-2xl font-bold text-purple-900">{{ profitMarginPercentage }}%</p>
                </div>
                <TrendingUp class="h-8 w-8 text-purple-500" />
              </div>
            </div>
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
              :key="job.id"
              class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <!-- Job Header -->
              <div class="mb-4">
                <div class="flex items-start justify-between mb-2">
                  <h4 class="text-lg font-semibold text-gray-900 truncate">{{ job.name }}</h4>
                  <span class="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
                    #{{ job.job_number }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-1">{{ job.client_name }}</p>
                <p class="text-xs text-gray-500 line-clamp-2">{{ job.description }}</p>
              </div>

              <!-- Hours Comparison Chart -->
              <div class="mb-4 bg-gray-50 p-3 rounded-lg">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Hours Analysis</h5>
                <div class="space-y-2">
                  <!-- Estimated Hours Bar -->
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-amber-600">Estimated: {{ getJobEstimatedHours(job) }}h</span>
                    <span class="text-amber-600">Target</span>
                  </div>
                  <div class="w-full bg-amber-200 rounded-full h-2">
                    <div
                      class="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      :style="{ width: getEstimatedHoursBarWidth(job) + '%' }"
                    ></div>
                  </div>
                  
                  <!-- Actual Hours Bar -->
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-blue-600">Actual: {{ getJobActualHours(job) }}h</span>
                    <span :class="getHoursVariancePercentage(job) > 0 ? 'text-red-600' : 'text-green-600'">
                      {{ getHoursVariancePercentage(job) > 0 ? 'Over' : 'Under' }} {{ Math.abs(getHoursVariancePercentage(job)) }}%
                    </span>
                  </div>
                  <div class="w-full bg-blue-200 rounded-full h-2">
                    <div
                      class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      :style="{ width: getActualHoursBarWidth(job) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Profitability Metrics -->
              <div class="grid grid-cols-2 gap-2 mb-4">
                <!-- Revenue -->
                <div class="bg-green-50 p-3 rounded text-center">
                  <DollarSign class="h-4 w-4 text-green-500 mx-auto mb-1" />
                  <p class="text-xs text-green-600 font-medium">Revenue</p>
                  <p class="text-sm font-bold text-green-900">${{ formatCurrency(getJobRevenue(job)) }}</p>
                </div>

                <!-- Profit -->
                <div class="bg-emerald-50 p-3 rounded text-center">
                  <TrendingUp class="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                  <p class="text-xs text-emerald-600 font-medium">Profit</p>
                  <p class="text-sm font-bold text-emerald-900">${{ formatCurrency(getJobProfit(job)) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Staff Assignments (Bottom Left Corner) -->
          <div class="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs z-50">
            <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <Users class="h-4 w-4 mr-2 text-gray-600" />
              Staff Assignments
            </h4>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div v-for="staff in allAssignedStaff" :key="staff.id" class="text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-gray-700 truncate">{{ staff.name }}</span>
                  <span class="text-gray-500 text-xs">{{ staff.jobCount }} jobs</span>
                </div>
              </div>
              <div v-if="allAssignedStaff.length === 0" class="text-xs text-gray-400">
                No staff assigned
              </div>
            </div>
          </div>
        </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Target,
  Activity,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  FileX
} from 'lucide-vue-next'
import Dialog from '../ui/dialog/Dialog.vue'
import DialogContent from '../ui/dialog/DialogContent.vue'
import DialogHeader from '../ui/dialog/DialogHeader.vue'
import DialogTitle from '../ui/dialog/DialogTitle.vue'
import { jobService } from '../../services/job.service'
import type { TypedWeeklyTimesheetData, IMSWeeklyData } from '../../api/local/schemas'

interface Props {
  isOpen: boolean
  weeklyData: TypedWeeklyTimesheetData | IMSWeeklyData | null
}

interface JobWithMetrics {
  id: string
  name: string
  job_number: string
  client_name: string
  description: string | null
  status: string
  status_key: string
  priority: number
  total_estimated_hours?: number
  total_actual_hours?: number
  total_revenue?: number
  total_profit?: number
  people: Array<{ id: string; name: string; display_name?: string }>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const searchQuery = ref('')
const loading = ref(false)
const jobs = ref<JobWithMetrics[]>([])

// Filter active jobs only
const activeJobStatuses = ['awaiting_approval', 'approved', 'in_progress', 'unusual']

const activeJobs = computed(() => {
  return jobs.value.filter(job => activeJobStatuses.includes(job.status_key))
})

const filteredJobs = computed(() => {
  if (!searchQuery.value.trim()) return activeJobs.value

  const query = searchQuery.value.toLowerCase()
  return activeJobs.value.filter(job =>
    job.name.toLowerCase().includes(query) ||
    job.client_name.toLowerCase().includes(query) ||
    job.job_number.toLowerCase().includes(query) ||
    (job.description && job.description.toLowerCase().includes(query))
  )
})

// Summary metrics
const totalEstimatedHours = computed(() => {
  if (props.weeklyData?.job_metrics?.total_estimated_hours) {
    return props.weeklyData.job_metrics.total_estimated_hours
  }
  return activeJobs.value.reduce((total, job) => total + getJobEstimatedHours(job), 0)
})

const totalActualHours = computed(() => {
  if (props.weeklyData?.job_metrics?.total_actual_hours) {
    return props.weeklyData.job_metrics.total_actual_hours
  }
  return activeJobs.value.reduce((total, job) => total + getJobActualHours(job), 0)
})

const totalRevenue = computed(() => {
  if (props.weeklyData?.job_metrics?.total_revenue) {
    return props.weeklyData.job_metrics.total_revenue
  }
  return activeJobs.value.reduce((total, job) => total + getJobRevenue(job), 0)
})

const totalProfit = computed(() => {
  if (props.weeklyData?.job_metrics?.total_profit) {
    return props.weeklyData.job_metrics.total_profit
  }
  return activeJobs.value.reduce((total, job) => total + getJobProfit(job), 0)
})

const profitMarginPercentage = computed(() => {
  if (totalRevenue.value === 0) return 0
  return Math.round((totalProfit.value / totalRevenue.value) * 100)
})

// Staff assignments aggregation
const allAssignedStaff = computed(() => {
  const staffMap = new Map()
  
  activeJobs.value.forEach(job => {
    job.people.forEach(person => {
      if (staffMap.has(person.id)) {
        staffMap.get(person.id).jobCount++
      } else {
        staffMap.set(person.id, {
          id: person.id,
          name: person.display_name || person.name || 'Unknown',
          jobCount: 1
        })
      }
    })
  })
  
  return Array.from(staffMap.values()).sort((a, b) => b.jobCount - a.jobCount)
})

const closeModal = () => {
  emit('close')
}

const handleOpenChange = (open: boolean) => {
  if (!open) {
    closeModal()
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const loadJobs = async () => {
  loading.value = true
  try {
    const response = await jobService.getAllJobs()
    console.log('🔍 Raw job service response:', response)
    
    const allJobs = [
      ...(response.active_jobs || []),
    ]

    // Extract job metrics from weeklyData if available
    const jobMetrics = props.weeklyData?.job_metrics || {}

    jobs.value = allJobs.map(job => {
      const jobId = job.id
      const metricsForJob = jobMetrics[jobId] || {}
      
      return {
        id: job.id || '',
        name: job.name || '',
        job_number: job.job_number || '',
        client_name: job.client_name || '',
        description: job.description || null,
        status: job.status || '',
        status_key: job.status_key || '',
        priority: job.priority || 0,
        total_estimated_hours: metricsForJob.total_estimated_hours || job.total_estimated_hours || job.estimated_hours || 0,
        total_actual_hours: metricsForJob.total_actual_hours || job.total_actual_hours || job.actual_hours || 0,
        total_revenue: metricsForJob.total_revenue || job.total_revenue || job.revenue || job.total_value || 0,
        total_profit: metricsForJob.total_profit || job.total_profit || 0,
        people: (job.people || []).map(person => ({
          id: person.id || '',
          name: (person.display_name || person.name || 'Unknown') as string,
          display_name: person.display_name
        }))
      }
    })

    console.log('🔍 Processed jobs with metrics:', jobs.value)
  } catch (error) {
    console.error('❌ Error loading jobs:', error)
    jobs.value = []
  } finally {
    loading.value = false
  }
}

// Job metric functions
const getJobEstimatedHours = (job: JobWithMetrics): number => {
  return job.total_estimated_hours || 0
}

const getJobActualHours = (job: JobWithMetrics): number => {
  return job.total_actual_hours || 0
}

const getJobRevenue = (job: JobWithMetrics): number => {
  return job.total_revenue || 0
}

const getJobProfit = (job: JobWithMetrics): number => {
  return job.total_profit || 0
}

// Hours comparison functions
const getHoursVariancePercentage = (job: JobWithMetrics): number => {
  const estimated = getJobEstimatedHours(job)
  const actual = getJobActualHours(job)
  if (estimated === 0) return 0
  return Math.round(((actual - estimated) / estimated) * 100)
}

const getEstimatedHoursBarWidth = (job: JobWithMetrics): number => {
  const estimated = getJobEstimatedHours(job)
  const actual = getJobActualHours(job)
  const maxHours = Math.max(estimated, actual, 1)
  return (estimated / maxHours) * 100
}

const getActualHoursBarWidth = (job: JobWithMetrics): number => {
  const estimated = getJobEstimatedHours(job)
  const actual = getJobActualHours(job)
  const maxHours = Math.max(estimated, actual, 1)
  return (actual / maxHours) * 100
}

// Load jobs when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    console.log('🔍 Modal opened - weeklyData structure:', {
      weeklyData: props.weeklyData,
      job_metrics: props.weeklyData?.job_metrics,
      weekly_summary: props.weeklyData?.weekly_summary
    })
    
    if (jobs.value.length === 0) {
      loadJobs()
    }
  }
})

// Load jobs when component mounts if modal is already open
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadJobs()
  }
}, { immediate: true })
</script>
