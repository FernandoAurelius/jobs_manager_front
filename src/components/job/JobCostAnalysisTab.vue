<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Cost Analysis</h2>
        <p class="text-sm text-gray-500">
          <span v-if="props.jobData?.pricing_methodology === 'time_materials'">
            Compare Estimate and Actual cost sets for this Time & Materials job
          </span>
          <span v-else-if="!showQuoteColumn">
            Compare Estimate and Actual cost sets for this job (no quote available)
          </span>
          <span v-else>
            Compare Estimate, Quote, and Actual cost sets with visual performance indicators
          </span>
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
        ></div>
        <p class="text-gray-500">Loading cost data...</p>
      </div>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white rounded-lg border border-gray-200 text-sm">
        <thead>
          <tr class="bg-gray-50">
            <th class="py-3 px-4 text-left font-semibold text-gray-700">Metric</th>
            <th class="py-3 px-4 text-center font-semibold text-blue-700">Estimate</th>
            <th v-if="showQuoteColumn" class="py-3 px-4 text-center font-semibold text-green-700">
              Quote
            </th>
            <th class="py-3 px-4 text-center font-semibold text-orange-700">Actual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="py-2 px-4 font-medium">Total Cost</td>
            <td class="py-2 px-4 text-center">{{ formatCurrency(estimate.cost) }}</td>
            <td v-if="showQuoteColumn" class="py-2 px-4 text-center">
              {{ formatCurrency(quote.cost) }}
            </td>
            <td class="py-2 px-4 text-center">
              <span :class="costClass">
                {{ formatCurrency(actual.cost) }}
                <span v-if="costDiff !== 0">
                  <component :is="costIcon" class="inline w-4 h-4 align-text-bottom ml-1" />
                  <span :class="costDiff > 0 ? 'text-red-600' : 'text-green-600'">
                    {{ formatPercent(costDiff) }}
                  </span>
                </span>
              </span>
            </td>
          </tr>
          <tr>
            <td class="py-2 px-4 font-medium">Total Revenue</td>
            <td class="py-2 px-4 text-center">{{ formatCurrency(estimate.rev) }}</td>
            <td v-if="showQuoteColumn" class="py-2 px-4 text-center">
              {{ formatCurrency(quote.rev) }}
            </td>
            <td class="py-2 px-4 text-center">
              <span :class="revenueClass">
                {{ formatCurrency(actual.rev) }}
                <span v-if="revenueDiff !== 0">
                  <component :is="revenueIcon" class="inline w-4 h-4 align-text-bottom ml-1" />
                  <span :class="revenueDiff > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatPercent(revenueDiff) }}
                  </span>
                </span>
              </span>
            </td>
          </tr>
          <tr>
            <td class="py-2 px-4 font-medium">Profit Margin</td>
            <td class="py-2 px-4 text-center">{{ formatPercent(estimate.profitMargin) }}</td>
            <td v-if="showQuoteColumn" class="py-2 px-4 text-center">
              {{ formatPercent(quote.profitMargin) }}
            </td>
            <td class="py-2 px-4 text-center">
              <span :class="profitClass">
                {{ formatPercent(actual.profitMargin) }}
                <span v-if="profitDiff !== 0">
                  <component :is="profitIcon" class="inline w-4 h-4 align-text-bottom ml-1" />
                  <span :class="profitDiff > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatPercent(profitDiff) }}
                  </span>
                </span>
              </span>
            </td>
          </tr>
          <tr>
            <td class="py-2 px-4 font-medium">Total Hours</td>
            <td class="py-2 px-4 text-center">{{ formatNumber(estimate.hours) }}</td>
            <td v-if="showQuoteColumn" class="py-2 px-4 text-center">
              {{ formatNumber(quote.hours) }}
            </td>
            <td class="py-2 px-4 text-center">
              <span :class="hoursClass">
                {{ formatNumber(actual.hours) }}
                <span v-if="hoursDiff !== 0">
                  <component :is="hoursIcon" class="inline w-4 h-4 align-text-bottom ml-1" />
                  <span :class="hoursDiff < 0 ? 'text-green-600' : 'text-red-600'">
                    {{ formatPercent(hoursDiff) }}
                  </span>
                </span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="showQuoteColumn" class="mt-6 flex flex-col md:flex-row gap-4">
        <div
          v-if="hasValidQuoteData && (quote.rev > 0 || actual.rev > 0)"
          class="flex-1 bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3"
        >
          <Smile v-if="happyFace" class="w-8 h-8 text-green-500" />
          <Frown v-else class="w-8 h-8 text-red-500" />
          <div>
            <div class="font-semibold text-gray-900">Quote Accuracy</div>
            <div class="text-lg font-bold" :class="happyFace ? 'text-green-600' : 'text-red-600'">
              {{ formatPercent(quoteAccuracy) }}
            </div>
            <div class="text-xs text-gray-500">How close the quote was to the actual result</div>
          </div>
        </div>
        <div
          v-else
          class="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center gap-3"
        >
          <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span class="text-gray-500 text-sm">?</span>
          </div>
          <div>
            <div class="font-semibold text-gray-500">Quote Accuracy</div>
            <div class="text-sm text-gray-500">
              {{ !quote.rev ? 'No quote data available' : 'No actual data available' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Smile, Frown, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { useCostingStore } from '../../stores/costing'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import type { CostSetSummary } from '@/api/local/schemas'

type CostSet = z.infer<typeof schemas.CostSet>

const props = defineProps<{
  jobId: string
  jobData?: {
    pricing_methodology?: 'fixed_price' | 'time_materials'
    has_quote?: boolean
    quote: CostSet | null
  }
}>()
const costingStore = useCostingStore()
const loading = ref(true)

// Reactive flag to track if we have valid quote data
const hasValidQuoteData = ref(false)

// Computed to determine if quote column should be shown
const showQuoteColumn = computed(() => {
  // Don't show quote column for time_materials jobs
  if (props.jobData?.pricing_methodology === 'time_materials') {
    return false
  }

  // Show quote column if we have actual quote data with cost/revenue OR the hasValidQuoteData flag
  const hasQuoteData = quote.value.cost > 0 || quote.value.rev > 0 || hasValidQuoteData.value

  return hasQuoteData
})

const estimate = ref<CostSetSummary>({ cost: 0, rev: 0, hours: 0, profitMargin: 0 })
const quote = ref<CostSetSummary>({ cost: 0, rev: 0, hours: 0, profitMargin: 0 })
const actual = ref<CostSetSummary>({ cost: 0, rev: 0, hours: 0, profitMargin: 0 })

async function loadAll() {
  loading.value = true

  await costingStore.load(props.jobId, 'estimate')
  const est = costingStore.costSet

  await costingStore.load(props.jobId, 'quote')
  const quo = costingStore.costSet

  // Check if we have valid quote data
  hasValidQuoteData.value = !!(quo && quo.cost_lines && quo.cost_lines.length > 0)

  await costingStore.load(props.jobId, 'actual')
  const act = costingStore.costSet

  estimate.value = summarise(est)
  quote.value = summarise(quo)
  actual.value = summarise(act)

  loading.value = false
}

onMounted(loadAll)

function summarise(costSet: CostSet | undefined): CostSetSummary {
  if (!costSet || !costSet.cost_lines) {
    return { cost: 0, rev: 0, hours: 0, profitMargin: 0 }
  }

  let cost = 0,
    rev = 0,
    hours = 0

  for (const line of costSet.cost_lines) {
    const quantity = typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity
    const lineCost = quantity * Number(line.unit_cost)
    const lineRev = quantity * Number(line.unit_rev)

    cost += lineCost
    rev += lineRev
    if (line.kind === 'time') hours += quantity
  }

  const profitMargin = rev === 0 ? 0 : ((rev - cost) / rev) * 100
  const summary = { cost, rev, hours, profitMargin }

  return summary
}

const costDiff = computed(() => {
  const referenceValue =
    props.jobData?.pricing_methodology === 'time_materials' || !showQuoteColumn.value
      ? estimate.value.cost
      : quote.value.cost
  return percentDiff(actual.value.cost, referenceValue)
})
const revenueDiff = computed(() => {
  const referenceValue =
    props.jobData?.pricing_methodology === 'time_materials' || !showQuoteColumn.value
      ? estimate.value.rev
      : quote.value.rev
  return percentDiff(actual.value.rev, referenceValue)
})
const profitDiff = computed(() => {
  const referenceValue =
    props.jobData?.pricing_methodology === 'time_materials' || !showQuoteColumn.value
      ? estimate.value.profitMargin
      : quote.value.profitMargin
  return percentDiff(actual.value.profitMargin, referenceValue)
})
const hoursDiff = computed(() => {
  const referenceValue =
    props.jobData?.pricing_methodology === 'time_materials' || !showQuoteColumn.value
      ? estimate.value.hours
      : quote.value.hours
  return percentDiff(actual.value.hours, referenceValue)
})

function percentDiff(actual: number, ref: number): number {
  if (!ref || ref === 0) return 0
  return ((actual - ref) / ref) * 100
}

const costClass = computed(() =>
  costDiff.value > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold',
)
const costIcon = computed(() =>
  costDiff.value > 0 ? ArrowUp : costDiff.value < 0 ? ArrowDown : null,
)
const revenueClass = computed(() =>
  revenueDiff.value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold',
)
const revenueIcon = computed(() =>
  revenueDiff.value > 0 ? ArrowUp : revenueDiff.value < 0 ? ArrowDown : null,
)
const profitClass = computed(() =>
  profitDiff.value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold',
)
const profitIcon = computed(() =>
  profitDiff.value > 0 ? ArrowUp : profitDiff.value < 0 ? ArrowDown : null,
)
const hoursClass = computed(() =>
  hoursDiff.value <= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold',
)
const hoursIcon = computed(() =>
  hoursDiff.value < 0 ? ArrowDown : hoursDiff.value > 0 ? ArrowUp : null,
)

const happyFace = computed(() => {
  console.log('[JobCostAnalysisTab] happyFace check:', {
    showQuoteColumn: showQuoteColumn.value,
    hasValidQuoteData: hasValidQuoteData.value,
    quoteRev: quote.value.rev,
    actualRev: actual.value.rev,
    quoteCost: quote.value.cost,
    actualCost: actual.value.cost,
  })

  if (!showQuoteColumn.value || !hasValidQuoteData.value) return false
  if (!quote.value.rev && !actual.value.rev) return false

  return actual.value.rev >= quote.value.rev && actual.value.cost <= quote.value.cost
})

const quoteAccuracy = computed(() => {
  console.log('[JobCostAnalysisTab] quoteAccuracy check:', {
    showQuoteColumn: showQuoteColumn.value,
    hasValidQuoteData: hasValidQuoteData.value,
    quoteRev: quote.value.rev,
    actualRev: actual.value.rev,
  })

  if (!showQuoteColumn.value || !hasValidQuoteData.value) return 0
  if (!quote.value.rev && !actual.value.rev) return 0

  // If one is zero but not both, accuracy is very low
  if ((quote.value.rev === 0) !== (actual.value.rev === 0)) return 0

  const diff = Math.abs(percentDiff(actual.value.rev, quote.value.rev))
  const accuracy = Math.max(0, 100 - Math.min(diff, 100))

  console.log('[JobCostAnalysisTab] calculated accuracy:', { diff, accuracy })
  return accuracy
})

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}
function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
</script>

<style scoped>
table {
  border-collapse: separate;
  border-spacing: 0;
}
th,
td {
  border-bottom: 1px solid #e5e7eb;
}
th:last-child,
td:last-child {
  border-right: none;
}
</style>
