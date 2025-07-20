<template>
  <tr class="group hover:bg-blue-50/30 transition-all duration-200">
    <td class="px-3 py-2">
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0 h-8 w-8">
          <div
            class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <span class="text-xs font-semibold text-white">
              {{ getInitials(staff.name) }}
            </span>
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ staff.name }}
          </p>
          <p
            v-if="imsMode && staff.total_overtime && staff.total_overtime > 0"
            class="text-xs text-orange-600 font-medium"
          >
            OT: {{ formatHours(staff.total_overtime) }}h
          </p>
        </div>
      </div>
    </td>

    <td
      v-for="(day, index) in staff.weekly_hours"
      :key="index"
      class="px-1 py-1 text-center text-xs"
    >
      <div class="flex flex-col items-center space-y-1 min-h-[24px]">
        <div class="flex items-center justify-center min-h-[18px]">
          <span v-if="day.hours > 0" :class="getHoursClass(day) + ' text-xs px-1 py-0.5'">
            {{ formatHours(day.hours) }}
          </span>
          <span v-else class="text-gray-400 text-xs">-</span>
        </div>

        <div class="flex items-center space-x-1">
          <StatusBadge :status="day.status" :leave-type="day.leave_type" />

          <div v-if="imsMode && (day.overtime || day.leave_hours)" class="flex space-x-1">
            <div
              v-if="day.overtime && day.overtime > 0"
              class="h-1.5 w-1.5 bg-orange-500 rounded-full"
              :title="`Overtime: ${formatHours(day.overtime)}h`"
            ></div>
            <div
              v-if="day.leave_hours && day.leave_hours > 0"
              class="h-1.5 w-1.5 bg-blue-500 rounded-full"
              :title="`Leave: ${formatHours(day.leave_hours)}h`"
            ></div>
          </div>
        </div>

        <div v-if="imsMode" class="relative group/cell">
          <div
            class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 z-10 pointer-events-none whitespace-nowrap"
          >
            <div class="space-y-1">
              <div v-if="day.standard_hours">Standard: {{ formatHours(day.standard_hours) }}h</div>
              <div v-if="day.time_and_half_hours">
                Time & Half: {{ formatHours(day.time_and_half_hours) }}h
              </div>
              <div v-if="day.double_time_hours">
                Double Time: {{ formatHours(day.double_time_hours) }}h
              </div>
              <div v-if="day.leave_hours">Leave: {{ formatHours(day.leave_hours) }}h</div>
              <div v-if="day.unpaid_hours">Unpaid: {{ formatHours(day.unpaid_hours) }}h</div>
            </div>

            <div
              class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"
            ></div>
          </div>
        </div>
      </div>
    </td>

    <td class="px-3 py-2 text-center">
      <div class="flex flex-col items-center space-y-1">
        <span class="text-sm font-bold text-gray-900">
          {{ formatHours(staff.total_hours) }}
        </span>
        <div
          v-if="imsMode && staff.total_leave_hours && staff.total_leave_hours > 0"
          class="text-xs text-blue-600"
        >
          Leave: {{ formatHours(staff.total_leave_hours) }}
        </div>
      </div>
    </td>

    <td class="px-3 py-2 text-center">
      <BillablePercentageBadge :percentage="staff.billable_percentage" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import StatusBadge from './StatusBadge.vue'
import BillablePercentageBadge from './BillablePercentageBadge.vue'
import { formatHours } from '@/services/weekly-timesheet.service'
import type { WeeklyStaffData, WeeklyDayData } from '@/api/local/schemas'

interface Props {
  staff: WeeklyStaffData
  imsMode: boolean
  weekDays: Array<{ date: string; name: string; short: string }>
}

defineProps<Props>()

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getHoursClass = (day: WeeklyDayData): string => {
  const baseClass = 'transition-colors duration-200'

  if (day.status === 'Leave') {
    return `${baseClass} bg-blue-100 text-blue-800`
  }

  if (day.hours >= 8) {
    return `${baseClass} bg-green-100 text-green-800`
  } else if (day.hours >= 4) {
    return `${baseClass} bg-yellow-100 text-yellow-800`
  } else if (day.hours > 0) {
    return `${baseClass} bg-red-100 text-red-800`
  }

  return `${baseClass} bg-gray-100 text-gray-600`
}
</script>
