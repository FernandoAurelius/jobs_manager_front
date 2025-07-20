<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <BarChart3 class="h-5 w-5 text-orange-600" />
          <span>Weekly Statistics & Metrics</span>
        </DialogTitle>
        <DialogDescription>
          Comprehensive statistics for the selected week including staff and job metrics
        </DialogDescription>
      </DialogHeader>

      <div class="mt-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Clock class="h-4 w-4 mr-2 text-blue-600" />
              Total Hours
            </h4>
            <div class="text-2xl font-bold text-blue-700 mb-1">{{ totalHours }}</div>
            <div class="text-xs text-gray-500">{{ staffCount }} staff members</div>
          </div>

          <div class="bg-green-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-green-900 mb-2 flex items-center">
              <TrendingUp class="h-4 w-4 mr-2 text-green-600" />
              Billable %
            </h4>
            <div class="text-2xl font-bold text-green-700 mb-1">{{ billablePercentage }}</div>
            <div class="text-xs text-gray-500">of total hours</div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-purple-900 mb-2 flex items-center">
              <Users class="h-4 w-4 mr-2 text-purple-600" />
              Staff Completion
            </h4>
            <div class="text-2xl font-bold text-purple-700 mb-1">
              {{ completedStaff }}/{{ staffCount }}
            </div>
            <div class="text-xs text-gray-500">{{ completionRate }} complete</div>
          </div>

          <div class="bg-amber-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-amber-900 mb-2 flex items-center">
              <Briefcase class="h-4 w-4 mr-2 text-amber-600" />
              Jobs Active
            </h4>
            <div class="text-2xl font-bold text-amber-700 mb-1">{{ metrics.job_count }}</div>
            <div class="text-xs text-gray-500">open projects</div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Job Metrics</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-orange-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-orange-900 mb-2 flex items-center">
              <Clock class="h-4 w-4 mr-2 text-orange-600" />
              Estimated Hours
            </h4>
            <div class="text-2xl font-bold text-orange-700 mb-1">
              {{ metrics.total_estimated_hours ?? '--' }}
            </div>
            <div class="text-xs text-gray-500">All jobs</div>
          </div>

          <div class="bg-green-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-green-900 mb-2 flex items-center">
              <TrendingUp class="h-4 w-4 mr-2 text-green-600" />
              Actual Hours
            </h4>
            <div class="text-2xl font-bold text-green-700 mb-1">
              {{ metrics.total_actual_hours ?? '--' }}
            </div>
            <div class="text-xs text-gray-500">All jobs</div>
          </div>

          <div class="bg-emerald-50 rounded-lg p-4 flex flex-col items-center">
            <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center">
              <DollarSign class="h-4 w-4 mr-2 text-emerald-600" />
              Total Revenue
            </h4>
            <div class="text-2xl font-bold text-emerald-700 mb-1">
              ${{ metrics.total_revenue ?? '--' }}
            </div>
            <div class="text-xs text-gray-500">All jobs</div>
          </div>
        </div>
      </div>

      <div v-if="metrics.graphic" class="mt-8">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm font-semibold text-gray-700 mb-2">Job Progress Chart</div>
          <div class="w-full overflow-x-auto" v-html="metrics.graphic"></div>
        </div>
      </div>

      <div class="flex justify-end mt-6 pt-4 border-t">
        <Button @click="handleClose" variant="outline"> Close </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BarChart3, Briefcase, Clock, TrendingUp, DollarSign, Users } from 'lucide-vue-next'
import type { JobMetrics } from '@/api/local/schemas'
import { formatHours, formatPercentage } from '@/services/weekly-timesheet.service'

const props = defineProps<{
  open: boolean
  metrics: JobMetrics
  totalHours?: number
  billablePercentage?: number
  staffCount?: number
  completedStaff?: number
}>()
const emit = defineEmits<{ close: [] }>()

const totalHours = computed(() => formatHours(props.totalHours || 0))
const billablePercentage = computed(() => formatPercentage(props.billablePercentage || 0))
const staffCount = computed(() => props.staffCount || 0)
const completedStaff = computed(() => props.completedStaff || 0)
const completionRate = computed(() => {
  if (!props.staffCount || props.staffCount === 0) return '0%'
  return formatPercentage(((props.completedStaff || 0) / props.staffCount) * 100)
})

const handleClose = () => {
  emit('close')
}
</script>
