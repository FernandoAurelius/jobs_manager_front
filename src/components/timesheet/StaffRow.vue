<template>
  <div v-if="mobile" class="space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div
          class="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
        >
          <span class="text-white font-medium text-xs">
            {{ staff.staff_initials || getInitials(staff.staff_name) }}
          </span>
        </div>
        <div class="text-sm font-medium text-gray-900">
          {{ staff.staff_name }}
        </div>
      </div>

      <div v-if="staff.status === 'No Entry'" class="relative group">
        <AlertTriangle class="h-4 w-4 text-red-500" />
        <div
          class="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
        >
          <div v-for="alert in staff.alerts" :key="alert" class="text-xs">
            {{ alert }}
          </div>
        </div>
      </div>
      <div v-else>
        <Badge :class="getStatusClass(staff.status_class)" class="text-xs px-2 py-0.5">
          {{ staff.status }}
        </Badge>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2 text-center">
      <div>
        <div class="text-xs text-gray-500">Hours</div>
        <div class="text-sm font-medium">{{ formatHours(staff.actual_hours) }}h</div>
      </div>
      <div>
        <div class="text-xs text-gray-500">Scheduled</div>
        <div class="text-sm font-medium">{{ formatHours(staff.scheduled_hours) }}h</div>
      </div>
      <div>
        <div class="text-xs text-gray-500">Entries</div>
        <div class="text-sm font-medium">{{ staff.entry_count }}</div>
      </div>
    </div>

    <div class="w-full bg-gray-200 rounded-full h-1">
      <div
        class="bg-blue-500 h-1 rounded-full transition-all duration-300"
        :style="{ width: `${Math.min(staff.completion_percentage, 100)}%` }"
      ></div>
    </div>

    <div class="flex justify-center">
      <Button @click="handleViewDetails" variant="outline" size="sm" class="text-xs">
        <Eye class="h-3 w-3 mr-1" />
        View Details
      </Button>
    </div>
  </div>

  <tr v-else class="hover:bg-gray-50 transition-colors duration-150">
    <td class="px-2 py-1.5 whitespace-nowrap">
      <div class="flex items-center space-x-2">
        <div class="flex-shrink-0">
          <div
            class="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
          >
            <span class="text-white font-medium text-xs">
              {{ staff.staff_initials || getInitials(staff.staff_name) }}
            </span>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-gray-900 truncate">
            {{ staff.staff_name }}
          </div>
          <div class="text-xs text-gray-500">
            {{ staff.entry_count }} {{ staff.entry_count === 1 ? 'entry' : 'entries' }}
          </div>
        </div>
      </div>
    </td>

    <td class="px-2 py-1.5 whitespace-nowrap text-center">
      <div class="text-sm">
        <div class="font-medium text-gray-900 leading-tight">
          {{ formatHours(staff.actual_hours) }}<span class="text-xs text-gray-500">h</span>
        </div>
        <div class="text-xs text-gray-500 leading-tight">
          / {{ formatHours(staff.scheduled_hours) }}h
        </div>

        <div class="w-8 bg-gray-200 rounded-full h-0.5 mx-auto mt-0.5">
          <div
            class="bg-blue-500 h-0.5 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min(staff.completion_percentage, 100)}%` }"
          ></div>
        </div>
      </div>
    </td>

    <td class="px-2 py-1.5 whitespace-nowrap">
      <div class="flex flex-col items-center space-y-0.5">
        <div v-if="staff.status === 'No Entry'" class="relative group">
          <div class="flex items-center justify-center cursor-pointer">
            <AlertTriangle class="h-4 w-4 text-red-500" />
          </div>

          <div
            class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10"
          >
            {{ staff.alerts.join(', ') || 'No timesheet entries' }}
          </div>
        </div>

        <span
          v-else
          :class="getStatusBadgeClass(staff.status)"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        >
          <component :is="getStatusIcon(staff.status)" class="h-3 w-3 mr-1" />
          {{ staff.status }}
        </span>

        <div
          v-if="staff.alerts.length > 0 && staff.status !== 'No Entry'"
          class="flex items-center"
        >
          <span
            class="inline-flex items-center px-1 py-0.5 rounded text-xs bg-amber-100 text-amber-800"
          >
            <AlertTriangle class="h-2.5 w-2.5 mr-0.5" />
            {{ staff.alerts.length }}
          </span>
        </div>
      </div>
    </td>

    <td class="px-2 py-1.5 whitespace-nowrap text-center">
      <div class="flex justify-center space-x-1">
        <Button
          @click="openTimesheet"
          variant="outline"
          size="sm"
          class="h-5 px-1.5 text-xs hover:bg-blue-50"
        >
          <Edit class="h-3 w-3" />
        </Button>

        <Button
          @click="viewDetails"
          variant="ghost"
          size="sm"
          class="h-5 px-1.5 text-xs hover:bg-gray-50"
        >
          <Eye class="h-3 w-3" />
        </Button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, AlertTriangle, Clock, Edit, Eye } from 'lucide-vue-next'
import { formatHours } from '@/services/daily-timesheet.service'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// Use generated type from Zodios API
type StaffDailyData = z.infer<typeof schemas.StaffDailyData>

interface Props {
  staff: StaffDailyData
  date: string
  mobile?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewDetails: [staff: StaffDailyData]
}>()

const router = useRouter()

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusBadgeClass = (status: string): string => {
  const statusLower = status.toLowerCase()

  if (statusLower.includes('complete')) {
    return 'bg-green-100 text-green-800'
  }
  if (statusLower.includes('partial') || statusLower.includes('incomplete')) {
    return 'bg-amber-100 text-amber-800'
  }
  if (statusLower.includes('missing') || statusLower.includes('no entry')) {
    return 'bg-red-100 text-red-800'
  }
  if (statusLower.includes('overtime')) {
    return 'bg-blue-100 text-blue-800'
  }

  return 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase()

  if (statusLower.includes('complete')) {
    return CheckCircle
  }
  if (statusLower.includes('missing')) {
    return AlertCircle
  }

  return Clock
}

const getStatusClass = (statusClass: string): string => {
  const classes = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    secondary: 'bg-gray-100 text-gray-800',
  }
  return classes[statusClass as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const handleViewDetails = (): void => {
  emit('viewDetails', props.staff)
}

const openTimesheet = (): void => {
  router.push({
    name: 'timesheet-entry',
    query: {
      date: props.date,
      staffId: props.staff.staff_id,
    },
  })
}

const viewDetails = (): void => {
  emit('viewDetails', props.staff)
}
</script>
