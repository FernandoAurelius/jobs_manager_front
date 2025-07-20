<template>
  <div
    class="quote-summary-card bg-white rounded-lg border border-gray-200 p-6 h-full flex flex-col"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Quote Summary</h3>
      <div v-if="quoteData" class="text-right text-sm text-gray-600">
        <div class="font-medium">Rev #{{ quoteData.rev }}</div>
        <div>{{ formatDate(quoteData.created) }}</div>
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

    <div v-else-if="quoteData" class="flex-1 flex flex-col">
      <div class="mb-4 flex gap-2">
        <Button
          v-if="!hasLinkedSheet"
          @click="handleLinkQuote"
          :disabled="isLinking"
          class="flex-1"
        >
          <LinkIcon class="w-4 h-4 mr-2" />
          {{ isLinking ? 'Linking...' : 'Link Quote' }}
        </Button>

        <template v-else>
          <Button variant="outline" @click="handleGoToSpreadsheet" class="flex-1">
            <ExternalLinkIcon class="w-4 h-4 mr-2" />
            Go to Spreadsheet
          </Button>
          <Button @click="handleRefreshSpreadsheet" :disabled="isRefreshing" class="flex-1">
            <RefreshCwIcon class="w-4 h-4 mr-2" />
            {{ isRefreshing ? 'Refreshing...' : 'Refresh Spreadsheet' }}
          </Button>
        </template>
      </div>

      <div class="flex-1 grid grid-cols-3 gap-4">
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Costs</h4>

          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Cost</span>
              <span class="text-lg font-semibold text-red-600">
                ${{ formatCurrency(breakdown.material.cost) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Cost</span>
              <span class="text-lg font-semibold text-red-600">
                ${{ formatCurrency(breakdown.labour.cost) }}
              </span>
            </div>

            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Cost</span>
              <span class="text-xl font-bold text-red-600">
                ${{ formatCurrency(quoteData.summary.cost) }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">Revenue</h4>

          <div class="space-y-2">
            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Material Revenue</span>
              <span class="text-lg font-semibold text-green-600">
                ${{ formatCurrency(breakdown.material.revenue) }}
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Time Revenue</span>
              <span class="text-lg font-semibold text-green-600">
                ${{ formatCurrency(breakdown.labour.revenue) }}
              </span>
            </div>

            <div class="flex flex-col pt-2 border-t border-gray-200">
              <span class="text-xs text-gray-500">Total Revenue</span>
              <span class="text-xl font-bold text-green-600">
                ${{ formatCurrency(quoteData.summary.rev) }}
              </span>
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
              >
                {{ formatPercentage(profitMargin) }}%
              </span>
            </div>

            <div class="flex flex-col">
              <span class="text-xs text-gray-500">Total Hours</span>
              <span class="text-lg font-semibold text-blue-600">
                {{ formatNumber(quoteData.summary.hours) }} hrs
              </span>
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

    <Dialog :open="showPreviewModal" @update:open="showPreviewModal = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Quote Refresh Preview</DialogTitle>
          <DialogDescription>
            Review the changes that will be applied to your quote
          </DialogDescription>
        </DialogHeader>

        <div v-if="previewData" class="space-y-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-3">Summary of Changes</h4>
            <div
              v-if="previewData.diff_preview.total_changes > 0"
              class="grid grid-cols-3 gap-4 text-sm"
            >
              <div class="text-center">
                <div class="text-lg font-bold text-green-600">
                  {{ previewData.diff_preview.additions_count }}
                </div>
                <div class="text-gray-600">Additions</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600">
                  {{ previewData.diff_preview.updates_count }}
                </div>
                <div class="text-gray-600">Updates</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-red-600">
                  {{ previewData.diff_preview.deletions_count }}
                </div>
                <div class="text-gray-600">Deletions</div>
              </div>
            </div>
            <div v-else class="text-center">
              <div class="text-lg font-bold text-gray-600">0</div>
              <div class="text-gray-600">No changes detected</div>
              <div class="text-sm text-gray-500 mt-1">
                The spreadsheet is in sync with the system
              </div>
            </div>
          </div>

          <div class="max-h-96 overflow-y-auto space-y-4">
            <div v-if="previewData.diff_preview.additions_count > 0">
              <h5 class="font-medium text-green-700 mb-2 flex items-center">
                <span class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Items to be Added ({{ previewData.diff_preview.additions_count }})
              </h5>
              <div class="space-y-2">
                <div
                  v-for="(item, index) in previewData.draft_lines.slice(
                    0,
                    previewData.diff_preview.additions_count,
                  )"
                  :key="`add-${index}`"
                  class="border border-green-200 bg-green-50 rounded-lg p-3"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium">{{ item.desc }}</div>
                      <div class="text-sm text-gray-600">
                        {{ item.kind }} • Qty: {{ item.quantity }} • Cost: ${{
                          formatCurrency(item.unit_cost)
                        }}
                        • Total: ${{ formatCurrency(item.total_cost) }}
                      </div>
                    </div>
                    <span class="text-green-600 font-bold text-xs px-2 py-1 bg-green-100 rounded"
                      >+ADD</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div v-if="previewData.diff_preview.updates_count > 0">
              <h5 class="font-medium text-blue-700 mb-2 flex items-center">
                <span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Items to be Updated ({{ previewData.diff_preview.updates_count }})
              </h5>
              <div class="space-y-2">
                <div
                  v-for="(item, index) in previewData.draft_lines.slice(
                    previewData.diff_preview.additions_count,
                    previewData.diff_preview.additions_count +
                      previewData.diff_preview.updates_count,
                  )"
                  :key="`update-${index}`"
                  class="border border-blue-200 bg-blue-50 rounded-lg p-3"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium">{{ item.desc }}</div>
                      <div class="text-sm text-gray-600">
                        {{ item.kind }} • Qty: {{ item.quantity }} • Cost: ${{
                          formatCurrency(item.unit_cost)
                        }}
                        • Total: ${{ formatCurrency(item.total_cost) }}
                      </div>
                    </div>
                    <span class="text-blue-600 font-bold text-xs px-2 py-1 bg-blue-100 rounded"
                      >~UPD</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <div v-if="previewData.diff_preview.deletions_count > 0">
              <h5 class="font-medium text-red-700 mb-2 flex items-center">
                <span class="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Items to be Deleted ({{ previewData.diff_preview.deletions_count }})
              </h5>
              <div class="space-y-2">
                <div class="border border-red-200 bg-red-50 rounded-lg p-3">
                  <div class="text-sm text-red-700">
                    {{ previewData.diff_preview.deletions_count }} existing items will be removed
                    from the quote
                  </div>
                </div>
              </div>
            </div>

            <div v-if="previewData.diff_preview.total_changes === 0" class="text-center py-4">
              <div class="text-gray-500 mb-2">No changes detected</div>
              <div class="text-sm text-gray-400">
                The spreadsheet is already in sync with the system
              </div>
            </div>
          </div>

          <div
            v-if="
              previewData.validation_report?.warnings?.length ||
              previewData.validation_report?.errors?.length
            "
            class="space-y-2"
          >
            <div
              v-if="previewData.validation_report.errors?.length"
              class="bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <h5 class="font-medium text-red-800 mb-2">Errors</h5>
              <ul class="text-sm text-red-700 space-y-1">
                <li v-for="error in previewData.validation_report.errors" :key="error">
                  • {{ error }}
                </li>
              </ul>
            </div>
            <div
              v-if="previewData.validation_report.warnings?.length"
              class="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
            >
              <h5 class="font-medium text-yellow-800 mb-2">Warnings</h5>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li v-for="warning in previewData.validation_report.warnings" :key="warning">
                  • {{ warning }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showPreviewModal = false"> Cancel </Button>
          <Button
            @click="confirmRefresh"
            :disabled="!previewData || previewData.diff_preview.total_changes === 0"
            :class="
              previewData?.diff_preview.total_changes === 0 ? 'opacity-50 cursor-not-allowed' : ''
            "
          >
            {{
              previewData?.diff_preview.total_changes === 0
                ? 'No Changes to Apply'
                : `Apply ${previewData?.diff_preview.total_changes} Changes`
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { LinkIcon, ExternalLinkIcon, RefreshCwIcon, FileX } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { quoteService } from '@/services/quote.service'
import type { QuotePreview, QuoteApplyResult } from '@/services/quote.service'
import type { QuoteSheet } from '@/schemas/job.schemas'
import { extractQuoteErrorMessage, logError } from '@/utils/error-handler'
import { schemas } from '@/api/generated/api'
import { QuoteDataSchema } from '@/api/local/schemas'
import { z } from 'zod'

type Job = z.infer<typeof schemas.Job>
type QuoteData = z.infer<typeof QuoteDataSchema>

const props = withDefaults(
  defineProps<{
    quoteData?: QuoteData | null
    isLoading?: boolean
    job?: Job | null
  }>(),
  {
    isLoading: false,
  },
)

const emit = defineEmits<{
  'quote-refreshed': [data: QuoteApplyResult | (QuoteSheet & { shouldReloadJob: boolean })]
}>()

const isLinking = ref(false)
const isRefreshing = ref(false)
const showPreviewModal = ref(false)
const previewData = ref<QuotePreview | null>(null)

const hasLinkedSheet = computed(() => {
  return props.job ? quoteService.hasLinkedSheet(props.job) : false
})

const sheetUrl = computed(() => {
  return props.job ? quoteService.getSheetUrl(props.job) : null
})

const profitMargin = computed(() => {
  if (!props.quoteData?.summary.rev || props.quoteData.summary.rev === 0) return 0
  return (
    ((props.quoteData.summary.rev - props.quoteData.summary.cost) / props.quoteData.summary.rev) *
    100
  )
})

const breakdown = computed(() => {
  if (!props.quoteData?.cost_lines) {
    return {
      labour: { count: 0, cost: 0, revenue: 0 },
      material: { count: 0, cost: 0, revenue: 0 },
    }
  }

  const labour = props.quoteData.cost_lines
    .filter((line) => line.kind === 'time')
    .reduce(
      (acc, line) => ({
        count: acc.count + 1,
        cost: acc.cost + line.quantity * line.unit_cost,
        revenue: acc.revenue + line.quantity * line.unit_rev,
      }),
      { count: 0, cost: 0, revenue: 0 },
    )

  const material = props.quoteData.cost_lines
    .filter((line) => line.kind === 'material')
    .reduce(
      (acc, line) => ({
        count: acc.count + 1,
        cost: acc.cost + line.quantity * line.unit_cost,
        revenue: acc.revenue + line.quantity * line.unit_rev,
      }),
      { count: 0, cost: 0, revenue: 0 },
    )

  return { labour, material }
})

async function handleLinkQuote() {
  if (!props.job?.id) return

  debugLog('🔗 handleLinkQuote - Starting quote link process')
  isLinking.value = true

  debugLog('🍞 Showing loading toast for quote link')
  toast.info('Linking spreadsheet...', {
    description: 'Creating and configuring quote spreadsheet',
    id: 'quote-link',
  })

  try {
    debugLog('📞 Calling quoteService.linkQuote with job ID:', props.job.id)
    const result = await quoteService.linkQuote(props.job.id)
    debugLog('✅ Quote link result:', result)

    debugLog('🍞 Showing success toast for quote link')
    toast.success('Spreadsheet linked successfully!', {
      description: 'The spreadsheet has been created and is now accessible',
      id: 'quote-link',
      action: result.sheet_url
        ? {
            label: 'Open Spreadsheet',
            onClick: () => window.open(result.sheet_url, '_blank'),
          }
        : undefined,
    })

    if (result.sheet_url) {
      debugLog('🌐 Opening spreadsheet in new tab:', result.sheet_url)
      window.open(result.sheet_url, '_blank')
    }

    emit('quote-refreshed', { ...result, shouldReloadJob: true })
  } catch (error) {
    logError('handleLinkQuote', error, { jobId: props.job?.id })

    const errorMessage = extractQuoteErrorMessage(error)

    debugLog('🍞 Showing error toast for quote link:', errorMessage)
    toast.error('Error linking spreadsheet', {
      description: errorMessage,
      id: 'quote-link',
      duration: 6000,
    })
  } finally {
    isLinking.value = false
    debugLog('🔗 handleLinkQuote - Process completed')
  }
}

function handleGoToSpreadsheet() {
  const url = sheetUrl.value
  if (url) {
    window.open(url, '_blank')
  }
}

async function handleRefreshSpreadsheet() {
  if (!props.job?.id) return

  debugLog('🔄 handleRefreshSpreadsheet - Starting refresh process')
  isRefreshing.value = true

  debugLog('🍞 Showing loading toast for quote refresh')
  toast.info('Checking for updates...', {
    description: 'Verifying spreadsheet changes',
    id: 'quote-refresh',
  })

  try {
    debugLog('📞 Calling quoteService.previewQuote with job ID:', props.job.id)

    const preview = await quoteService.previewQuote(props.job.id)
    debugLog('✅ Quote preview result:', preview)
    previewData.value = preview
    showPreviewModal.value = true

    debugLog('🍞 Dismissing loading toast for quote refresh')
    toast.dismiss('quote-refresh')
  } catch (error) {
    logError('handleRefreshSpreadsheet', error, { jobId: props.job?.id })

    const errorMessage = extractQuoteErrorMessage(error)

    debugLog('🍞 Showing error toast for quote refresh:', errorMessage)
    toast.error('Error checking for updates', {
      description: errorMessage,
      id: 'quote-refresh',
      duration: 6000,
    })
  } finally {
    isRefreshing.value = false
    debugLog('🔄 handleRefreshSpreadsheet - Process completed')
  }
}

async function confirmRefresh() {
  if (!props.job?.id) return

  debugLog('✅ confirmRefresh - Starting apply process')

  try {
    debugLog('📞 Calling quoteService.applyQuote with job ID:', props.job.id)
    const result = await quoteService.applyQuote(props.job.id)
    debugLog('✅ Quote apply result:', result)

    if (result.success) {
      let changesCount = 0
      if (result.draft_lines) {
        changesCount = result.draft_lines.length
      }

      debugLog('📊 Changes count:', changesCount)

      if (changesCount > 0) {
        debugLog('🍞 Showing success toast with changes count')
        toast.success('Quote updated!', {
          description: `${changesCount} changes have been applied`,
          id: 'quote-refresh',
        })
      } else {
        debugLog('🍞 Showing info toast - no changes')
        toast.info('No changes found', {
          description: 'The spreadsheet is in sync with the system',
          id: 'quote-refresh',
        })
      }

      emit('quote-refreshed', result)
      showPreviewModal.value = false
    } else {
      throw new Error(result.error || 'Apply failed')
    }
  } catch (error) {
    logError('confirmRefresh', error, { jobId: props.job?.id })

    const errorMessage = extractQuoteErrorMessage(error)

    debugLog('🍞 Showing error toast for confirm refresh:', errorMessage)
    toast.error('Error applying changes', {
      description: errorMessage,
      id: 'quote-refresh',
      duration: 6000,
    })
  }
  debugLog('✅ confirmRefresh - Process completed')
}

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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped></style>
