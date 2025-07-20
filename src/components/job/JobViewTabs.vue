<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex-shrink-0 bg-white border-b border-gray-200">
      <div class="md:hidden">
        <div class="flex border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="handleTabChange(tab.key as TabKey)"
            :class="[
              'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="hidden md:block px-6">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="handleTabChange(tab.key as TabKey)"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto min-h-0">
      <div v-if="activeTab === 'estimate'" class="h-full p-4 md:p-6">
        <JobEstimateTab
          v-if="jobData && companyDefaults"
          :job-id="jobData.id"
          :company-defaults="companyDefaults"
          @cost-line-changed="$emit('reload-job')"
        />
      </div>
      <div
        v-if="activeTab === 'quote' && jobData?.pricing_methodology !== 'time_materials'"
        class="h-full p-4 md:p-6"
      >
        <JobQuoteTab
          v-if="jobData"
          :job-id="jobData.id"
          :job-data="jobData"
          @quote-imported="$emit('quote-imported', $event)"
          @cost-line-changed="$emit('reload-job')"
        />
      </div>
      <div v-if="activeTab === 'actual'" class="h-full p-4 md:p-6">
        <JobActualTab
          v-if="jobData"
          :job-id="jobData.id"
          :actual-summary-from-backend="jobData.latest_actual?.summary"
          @cost-line-changed="$emit('reload-job')"
        />
      </div>
      <div v-if="activeTab === 'financial'" class="h-full p-4 md:p-6">
        <JobFinancialTab
          v-if="jobData"
          :job-data="jobData"
          :job-id="jobData.id"
          :latest-pricings="latestPricings || undefined"
          @quote-created="$emit('quote-created')"
          @quote-accepted="$emit('quote-accepted')"
          @invoice-created="$emit('invoice-created')"
        />
      </div>
      <div v-if="activeTab === 'costAnalysis'" class="h-full p-4 md:p-6">
        <JobCostAnalysisTab v-if="jobData" :job-id="jobData.id" :job-data="analysisData" />
      </div>
      <div v-if="activeTab === 'settings'" class="h-full p-4 md:p-6">
        <JobSettingsTab
          v-if="jobData"
          :job-data="jobData"
          @open-settings="$emit('open-settings')"
          @open-workflow="$emit('open-workflow')"
          @open-history="$emit('open-history')"
          @open-attachments="$emit('open-attachments')"
          @open-pdf="$emit('open-pdf')"
          @delete-job="$emit('delete-job')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'
import JobEstimateTab from './JobEstimateTab.vue'
import JobQuoteTab from './JobQuoteTab.vue'
import JobActualTab from './JobActualTab.vue'
import JobFinancialTab from './JobFinancialTab.vue'
import JobCostAnalysisTab from './JobCostAnalysisTab.vue'
import JobSettingsTab from './JobSettingsTab.vue'
import { watch, computed } from 'vue'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// Use generated Job type from Zodios API
type Job = z.infer<typeof schemas.Job>

// Tab key type - frontend specific UI type
type TabKey = 'estimate' | 'quote' | 'actual' | 'financial' | 'costAnalysis'

const emit = defineEmits<{
  (e: 'change-tab', tab: TabKey): void
  (e: 'open-settings'): void
  (e: 'open-workflow'): void
  (e: 'open-history'): void
  (e: 'open-attachments'): void
  (e: 'open-pdf'): void
  (e: 'quote-imported', result: unknown): void
  (e: 'quote-created'): void
  (e: 'quote-accepted'): void
  (e: 'invoice-created'): void
  (e: 'delete-job'): void
  (e: 'reload-job'): void
}>()

const allTabs = [
  { key: 'estimate', label: 'Estimate' },
  { key: 'quote', label: 'Quote' },
  { key: 'actual', label: 'Actual' },
  { key: 'financial', label: 'Financial' },
  { key: 'costAnalysis', label: 'Cost Analysis' },
  { key: 'settings', label: 'Settings' },
] as const

const tabs = computed(() => {
  if (props.jobData?.pricing_methodology === 'time_materials') {
    return allTabs.filter((tab) => tab.key !== 'quote')
  }

  return allTabs
})

function handleTabChange(tab: TabKey) {
  emit('change-tab', tab)
}

const props = defineProps<{
  activeTab: TabKey
  jobData: Job | null
  companyDefaults: Record<string, unknown> | null
  latestPricings: Record<string, unknown> | null
}>()

const analysisData = computed(() => {
  if (!props.jobData) return null

  const hasValidQuote =
    props.jobData.latest_quote &&
    typeof props.jobData.latest_quote === 'object' &&
    Object.keys(props.jobData.latest_quote).length > 0

  return {
    pricing_methodology: props.jobData.pricing_methodology,
    has_quote: hasValidQuote,
    quote: props.jobData.latest_quote || null,
  }
})

watch(
  () => props.jobData,
  (val) => {
    debugLog('[JobViewTabs] jobData prop changed:', val)
  },
)
watch(
  () => props.companyDefaults,
  (val) => {
    debugLog('[JobViewTabs] companyDefaults prop changed:', val)
  },
)
watch(
  () => props.activeTab,
  (val) => {
    debugLog('[JobViewTabs] activeTab changed:', val)
  },
)
</script>
