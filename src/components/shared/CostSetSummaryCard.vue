<template>
  <div
    class="costset-summary-card bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <div v-if="typedSummary && revision !== undefined" class="text-right text-sm text-gray-600">
        <div class="font-medium">Snapshot #{{ revision }}</div>
        <div v-if="typedSummary.created">{{ formatDate(typedSummary.created) }}</div>
      </div>
    </div>
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
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
    </div>
    <div v-else-if="typedSummary" class="flex-1 flex flex-col">
      <div class="flex-1 grid grid-cols-3 gap-4">
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Costs</h4>
          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Cost</span>
              <span class="text-lg font-semibold text-red-600"
                >${{ formatCurrency(breakdown.material.cost) }}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Cost</span>
              <span class="text-lg font-semibold text-red-600"
                >${{ formatCurrency(breakdown.labour.cost) }}</span
              >
            </div>
            <div v-if="breakdown.other.cost > 0" class="flex flex-col">
              <span class="text-xs text-gray-500">Other Cost</span>
              <span class="text-lg font-semibold text-red-600"
                >${{ formatCurrency(breakdown.other.cost) }}</span
              >
            </div>
            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Cost</span>
              <span class="text-xl font-bold text-red-600"
                >${{ formatCurrency(typedSummary.cost) }}</span
              >
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Revenue</h4>
          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Revenue</span>
              <span class="text-lg font-semibold text-green-600"
                >${{ formatCurrency(breakdown.material.revenue) }}</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Revenue</span>
              <span class="text-lg font-semibold text-green-600"
                >${{ formatCurrency(breakdown.labour.revenue) }}</span
              >
            </div>
            <div v-if="breakdown.other.revenue > 0" class="flex flex-col">
              <span class="text-xs text-gray-500">Other Revenue</span>
              <span class="text-lg font-semibold text-green-600"
                >${{ formatCurrency(breakdown.other.revenue) }}</span
              >
            </div>
            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Revenue</span>
              <span class="text-xl font-bold text-green-600"
                >${{ formatCurrency(typedSummary.rev) }}</span
              >
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Metrics</h4>
          <div class="space-y-3">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Profit Margin</span>
              <span
                :class="[
                  'text-lg font-semibold',
                  profitMargin >= 0 ? 'text-green-600' : 'text-red-600',
                ]"
                >{{ formatPercentage(profitMargin) }}%</span
              >
            </div>
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Total Hours</span>
              <span class="text-lg font-semibold text-blue-600"
                >{{ formatNumber(typedSummary.hours) }} hrs</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center justify-center w-full">
        <FileX class="w-12 h-12 text-gray-300 mb-4" />
        <p class="text-gray-500 text-base font-medium">No cost lines available</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileX } from 'lucide-vue-next'
import { schemas } from '../../api/generated/api'
import { z } from 'zod'

type CostLine = z.infer<typeof schemas.CostLine>
type CostSet = z.infer<typeof schemas.CostSet>

const props = defineProps<{
  title?: string
  summary?: CostSet['summary'] | null
  costLines?: CostLine[]
  isLoading?: boolean
  revision?: number
}>()

const typedSummary = computed(() => {
  console.log('[CostSetSummaryCard] typedSummary computing with:', {
    summary: props.summary,
    summaryType: typeof props.summary,
    isLoading: props.isLoading,
  })

  if (!props.summary || typeof props.summary !== 'object') {
    console.log('[CostSetSummaryCard] No summary or not object, returning null')
    return null
  }

  const summary = props.summary as Record<string, unknown>
  console.log('[CostSetSummaryCard] Summary object keys:', Object.keys(summary))

  // Type guard to check if summary has the expected properties
  if (
    typeof summary.cost === 'number' &&
    typeof summary.rev === 'number' &&
    typeof summary.hours === 'number'
  ) {
    const result = summary as {
      cost: number
      rev: number
      hours: number
      created?: string
    }
    console.log('[CostSetSummaryCard] Valid summary found:', result)
    return result
  }

  console.log('[CostSetSummaryCard] Summary does not have expected number properties:', {
    cost: summary.cost,
    costType: typeof summary.cost,
    rev: summary.rev,
    revType: typeof summary.rev,
    hours: summary.hours,
    hoursType: typeof summary.hours,
  })
  return null
})

const profitMargin = computed(() => {
  if (!typedSummary.value?.rev || typedSummary.value.rev === 0) return 0
  return ((typedSummary.value.rev - typedSummary.value.cost) / typedSummary.value.rev) * 100
})

const breakdown = computed(() => {
  console.log('[CostSetSummaryCard] breakdown computing with costLines:', props.costLines)

  if (!props.costLines || !Array.isArray(props.costLines)) {
    console.log('[CostSetSummaryCard] No costLines or not array, returning empty breakdown')
    return {
      labour: { count: 0, cost: 0, revenue: 0 },
      material: { count: 0, cost: 0, revenue: 0 },
      other: { count: 0, cost: 0, revenue: 0 },
    }
  }

  const parseNumber = (value: string | number | undefined): number => {
    return typeof value === 'string' ? parseFloat(value) || 0 : value || 0
  }

  console.log('[CostSetSummaryCard] Processing costLines count:', props.costLines.length)

  const labour = props.costLines
    .filter((line) => line.kind === 'time')
    .reduce(
      (acc, line) => {
        const quantity = parseNumber(line.quantity)
        const unitCost = parseNumber(line.unit_cost)
        const unitRev = parseNumber(line.unit_rev)
        return {
          count: acc.count + 1,
          cost: acc.cost + quantity * unitCost,
          revenue: acc.revenue + quantity * unitRev,
        }
      },
      { count: 0, cost: 0, revenue: 0 },
    )
  const material = props.costLines
    .filter((line) => line.kind === 'material')
    .reduce(
      (acc, line) => {
        const quantity = parseNumber(line.quantity)
        const unitCost = parseNumber(line.unit_cost)
        const unitRev = parseNumber(line.unit_rev)
        return {
          count: acc.count + 1,
          cost: acc.cost + quantity * unitCost,
          revenue: acc.revenue + quantity * unitRev,
        }
      },
      { count: 0, cost: 0, revenue: 0 },
    )
  const other = props.costLines
    .filter((line) => line.kind !== 'time' && line.kind !== 'material')
    .reduce(
      (acc, line) => {
        const quantity = parseNumber(line.quantity)
        const unitCost = parseNumber(line.unit_cost)
        const unitRev = parseNumber(line.unit_rev)
        return {
          count: acc.count + 1,
          cost: acc.cost + quantity * unitCost,
          revenue: acc.revenue + quantity * unitRev,
        }
      },
      { count: 0, cost: 0, revenue: 0 },
    )

  const result = { labour, material, other }
  console.log('[CostSetSummaryCard] breakdown result:', result)
  return result
})

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped></style>
