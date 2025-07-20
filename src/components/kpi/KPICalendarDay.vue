<template>
  <div class="kpi-calendar-day" :class="dayClass" @click="$emit('click', dayData)">
    <div class="kpi-calendar-day__number">
      {{ dayData.day }}
    </div>

    <div v-if="!dayData.holiday" class="kpi-calendar-day__content">
      <div class="kpi-calendar-day__hours">
        <span class="kpi-calendar-day__label">{{ formatHours(dayData.billable_hours) }}</span>
        <span class="kpi-calendar-day__hours-total">{{ formatHours(dayData.total_hours) }}</span>
      </div>

      <div class="kpi-calendar-day__profit">
        {{ formatCurrency(dayData.gross_profit) }}
      </div>

      <div class="kpi-calendar-day__metrics">
        <div class="kpi-calendar-day__metric">
          <span class="kpi-calendar-day__metric-label">{{ utilizationPercentage }}%</span>
        </div>
        <div class="kpi-calendar-day__metric">
          <span class="kpi-calendar-day__metric-label">{{ profitPercentage }}%</span>
        </div>
        <div class="kpi-calendar-day__metric">
          <span class="kpi-calendar-day__metric-label">{{ formatHours(dayData.shop_hours) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="kpi-calendar-day__holiday">Holiday</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { schemas } from '@/api/generated/api'
import { z } from 'zod'

type DayKPI = z.infer<typeof schemas.KPIDayData>
type Thresholds = z.infer<typeof schemas.KPIThresholds>

const props = defineProps<{
  dayData: DayKPI
  thresholds: Thresholds
}>()

defineEmits<{
  click: [dayData: DayKPI]
}>()

const dayClass = computed(() => {
  return {
    'kpi-calendar-day--green': props.dayData.color === 'green',
    'kpi-calendar-day--amber': props.dayData.color === 'amber',
    'kpi-calendar-day--red': props.dayData.color === 'red',
    'kpi-calendar-day--holiday': props.dayData.holiday,
    'kpi-calendar-day--clickable': true,
  }
})

const utilizationPercentage = computed(() => {
  if (props.dayData.total_hours === 0) return 0
  return Math.round((props.dayData.billable_hours / props.dayData.total_hours) * 100)
})

const profitPercentage = computed(() => {
  if (props.thresholds.daily_gp_target === 0) return 0
  return Math.round((props.dayData.gross_profit / props.thresholds.daily_gp_target) * 100)
})

function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  if (minutes === 0) return `${wholeHours}h`
  return `${wholeHours}.${minutes < 10 ? '0' : ''}${Math.round(minutes / 6)}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<style scoped>
@reference 'tailwindcss';

.kpi-calendar-day {
  @apply min-h-[120px] p-2 border border-gray-200 bg-white relative;
  display: flex;
  flex-direction: column;
  font-size: 11px;
}

.kpi-calendar-day--clickable {
  @apply cursor-pointer transition-all duration-200 hover:shadow-md;
}

.kpi-calendar-day--green {
  @apply bg-green-50 border-green-200;
}

.kpi-calendar-day--amber {
  @apply bg-yellow-50 border-yellow-200;
}

.kpi-calendar-day--red {
  @apply bg-red-50 border-red-200;
}

.kpi-calendar-day--holiday {
  @apply bg-gray-50 border-gray-200;
}

.kpi-calendar-day__number {
  @apply font-semibold text-gray-900 mb-1;
  font-size: 13px;
}

.kpi-calendar-day__content {
  @apply flex-1 space-y-1;
}

.kpi-calendar-day__hours {
  @apply flex items-center justify-between;
}

.kpi-calendar-day__label {
  @apply font-medium text-gray-900;
}

.kpi-calendar-day__hours-total {
  @apply text-gray-500;
}

.kpi-calendar-day__profit {
  @apply font-semibold text-gray-900;
  font-size: 12px;
}

.kpi-calendar-day__metrics {
  @apply space-y-0.5;
}

.kpi-calendar-day__metric {
  @apply flex items-center;
}

.kpi-calendar-day__metric-label {
  @apply text-gray-600;
}

.kpi-calendar-day__holiday {
  @apply flex items-center justify-center text-gray-400 font-medium flex-1;
}

.kpi-calendar-day--green .kpi-calendar-day__number {
  @apply text-green-800;
}

.kpi-calendar-day--amber .kpi-calendar-day__number {
  @apply text-yellow-800;
}

.kpi-calendar-day--red .kpi-calendar-day__number {
  @apply text-red-800;
}

.kpi-calendar-day--green .kpi-calendar-day__label,
.kpi-calendar-day--green .kpi-calendar-day__profit {
  @apply text-green-900;
}

.kpi-calendar-day--amber .kpi-calendar-day__label,
.kpi-calendar-day--amber .kpi-calendar-day__profit {
  @apply text-yellow-900;
}

.kpi-calendar-day--red .kpi-calendar-day__label,
.kpi-calendar-day--red .kpi-calendar-day__profit {
  @apply text-red-900;
}
</style>
