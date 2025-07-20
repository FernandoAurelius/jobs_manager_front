<template>
  <div class="job-actual-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Actual Costs
          <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
        </h2>
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500">
            View and add actual costs from stock consumption and adjustments
          </div>
          <ActualCostDropdown
            :disabled="isLoading"
            @add-material="handleAddMaterial"
            @add-adjustment="handleAddAdjustment"
          />
        </div>
      </div>
    </div>

    <div class="flex-1 flex gap-6 min-h-0">
      <!-- Left side: Cost Lines Grid -->
      <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Actual Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <div class="flex items-center space-x-2 text-gray-500">
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
              <span>Loading cost lines...</span>
            </div>
          </div>
          <div
            v-else-if="!costLines || costLines.length === 0"
            class="flex-1 flex items-center justify-center"
          >
            <div class="text-center py-8">
              <svg
                class="w-12 h-12 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-gray-500">No actual costs recorded yet</p>
            </div>
          </div>
          <div v-else class="h-full overflow-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Kind
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantity
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Unit Cost
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Unit Rev
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Cost
                  </th>
                  <th
                    class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Rev
                  </th>
                  <th
                    class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Source
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="line in costLines" :key="line.id" class="hover:bg-gray-50">
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getKindClasses(line.kind)"
                    >
                      {{ getKindDisplayName(line.kind) }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">{{ line.desc }}</div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatNumber(line.quantity) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{ formatCurrency(line.unit_cost) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{ formatCurrency(line.unit_rev) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{
                      formatCurrency(
                        line.total_cost || Number(line.quantity) * Number(line.unit_cost),
                      )
                    }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${{
                      formatCurrency(
                        line.total_rev || Number(line.quantity) * Number(line.unit_rev),
                      )
                    }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-center">
                    <!-- Material from Delivery Receipt -->
                    <button
                      v-if="
                        line.kind === 'material' &&
                        isDeliveryReceiptMeta(line.meta) &&
                        isDeliveryReceiptExtRefs(line.ext_refs)
                      "
                      @click="navigateToDeliveryReceipt(line.ext_refs.purchase_order_id)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md text-sm font-medium transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {{
                        isDeliveryReceiptMeta(line.meta)
                          ? line.meta.po_number || 'Delivery Receipt'
                          : 'Delivery Receipt'
                      }}
                    </button>

                    <!-- Time from Timesheet -->
                    <button
                      v-else-if="line.kind === 'time' && isTimesheetMeta(line.meta)"
                      @click="navigateToTimesheet(line.meta.staff_id, line.meta.date)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-sm font-medium transition-colors"
                      :title="
                        isTimesheetMeta(line.meta)
                          ? `Staff: ${staffMap[line.meta.staff_id]?.display_name || 'Unknown'} - Date: ${line.meta.date || 'Unknown'}`
                          : 'Timesheet Entry'
                      "
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {{
                        isTimesheetMeta(line.meta)
                          ? staffMap[line.meta.staff_id]?.display_name || 'Timesheet'
                          : 'Timesheet'
                      }}
                    </button>

                    <!-- Adjustment Entry -->
                    <span
                      v-else-if="line.kind === 'adjust'"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 text-pink-800 rounded-md text-sm font-medium"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Adjustment
                    </span>

                    <!-- No source info -->
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="flex-1">
        <CostSetSummaryCard
          title="Actual Summary"
          :summary="props.actualSummaryFromBackend || actualSummary"
          :costLines="costLines"
          :isLoading="isLoading"
          :revision="revision"
        />
      </div>
    </div>

    <!-- Stock Consumption Modal -->
    <StockConsumptionModal
      v-if="showStockModal"
      @close="closeStockModal"
      @submit="submitStockConsumption"
    />

    <!-- Adjustment Modal -->
    <CostLineAdjustmentModal
      v-if="showAdjustmentModal"
      :initial="null"
      mode="create"
      @close="closeAdjustmentModal"
      @submit="submitAdjustment"
    />
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import CostSetSummaryCard from '@/components/shared/CostSetSummaryCard.vue'
import { fetchCostSet } from '@/services/costing.service'
import { costlineService } from '@/services/costline.service'
import { schemas, api } from '../../api/generated/api'
import { z } from 'zod'
import ActualCostDropdown from './ActualCostDropdown.vue'
import StockConsumptionModal from './StockConsumptionModal.vue'
import CostLineAdjustmentModal from './CostLineAdjustmentModal.vue'

type CostLine = z.infer<typeof schemas.CostLine>
type CostSet = z.infer<typeof schemas.CostSet>
type KanbanStaff = z.infer<typeof schemas.KanbanStaff>

// Type guard functions to safely access meta and ext_refs
function isDeliveryReceiptMeta(meta: unknown): meta is { source: string; po_number?: string } {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'source' in meta &&
    typeof (meta as Record<string, unknown>).source === 'string' &&
    (meta as Record<string, unknown>).source === 'delivery_receipt'
  )
}

function isTimesheetMeta(meta: unknown): meta is { staff_id: string; date?: string } {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'staff_id' in meta &&
    typeof (meta as Record<string, unknown>).staff_id === 'string'
  )
}

function isDeliveryReceiptExtRefs(extRefs: unknown): extRefs is { purchase_order_id: string } {
  return (
    typeof extRefs === 'object' &&
    extRefs !== null &&
    'purchase_order_id' in extRefs &&
    typeof (extRefs as Record<string, unknown>).purchase_order_id === 'string'
  )
}

const props = defineProps<{
  jobId: string
  actualSummaryFromBackend?: { cost: number; rev: number; hours: number; created?: string }
}>()

const emit = defineEmits<{
  'cost-line-changed': []
}>()

const router = useRouter()

const costLines = ref<CostLine[]>([])
const staffMap = ref<Record<string, KanbanStaff>>({})
const isLoading = ref(false)
const revision = ref(0)
const showStockModal = ref(false)
const showAdjustmentModal = ref(false)

function formatCurrency(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value || 0
  return num.toFixed(2)
}

function formatNumber(value: number | string | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value || 0
  return num.toFixed(3)
}

function getKindDisplayName(kind: string): string {
  switch (kind) {
    case 'time':
      return 'Labour'
    case 'material':
      return 'Material'
    case 'adjust':
      return 'Adjustment'
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1)
  }
}

function getKindClasses(kind: string): string {
  switch (kind) {
    case 'time':
      return 'bg-blue-100 text-blue-800'
    case 'material':
      return 'bg-green-100 text-green-800'
    case 'adjust':
      return 'bg-pink-100 text-pink-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

async function loadStaff() {
  try {
    const staff: KanbanStaff[] = await api.accounts_api_staff_all_list()
    staffMap.value = staff.reduce(
      (acc: Record<string, KanbanStaff>, s: KanbanStaff) => {
        acc[s.id] = s
        return acc
      },
      {} as Record<string, KanbanStaff>,
    )
  } catch (error) {
    debugLog('Failed to load staff data:', error)
  }
}

async function loadActualCosts() {
  isLoading.value = true
  try {
    const costSet: CostSet = await fetchCostSet(props.jobId, 'actual')

    costLines.value = costSet.cost_lines

    revision.value = costSet.rev || 0
  } catch (error) {
    debugLog('Failed to load actual cost lines:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadStaff(), loadActualCosts()])
})

const actualSummary = computed(() => {
  if (props.actualSummaryFromBackend) {
    return props.actualSummaryFromBackend
  }

  let cost = 0
  let rev = 0
  let hours = 0

  for (const line of costLines.value) {
    const quantity = Number(line.quantity || 0)
    const unitCost = Number(line.unit_cost || 0)
    const unitRev = Number(line.unit_rev || 0)

    cost += quantity * unitCost
    rev += quantity * unitRev

    // Count hours for time entries
    if (line.kind === 'time') {
      hours += quantity
    }

    // For adjustments, the revenue calculation is already included above,
    // but we might want to handle them specially in the future
  }

  return {
    cost,
    rev,
    hours,
    created: undefined,
  }
})

function navigateToDeliveryReceipt(purchaseOrderId: string) {
  router.push({
    name: 'delivery-receipt-form',
    params: { poId: purchaseOrderId },
  })
}

function navigateToTimesheet(staffId: string, date?: string) {
  const routeParams = {
    name: 'timesheet-entry',
    params: { staffId },
  } as { name: string; params: { staffId: string }; query?: { date: string } }

  if (date) {
    routeParams.query = { date }
  }

  router.push(routeParams)
}

// Modal handlers
function handleAddMaterial() {
  showStockModal.value = true
}

function handleAddAdjustment() {
  showAdjustmentModal.value = true
}

function closeStockModal() {
  showStockModal.value = false
}

function closeAdjustmentModal() {
  showAdjustmentModal.value = false
}

async function submitStockConsumption(payload: {
  stockItem: { id: number; description: string }
  quantity: number
  unit_cost: number
  unit_rev: number
}) {
  isLoading.value = true
  toast.info('Consuming stock and adding cost line...', { id: 'add-stock' })
  try {
    // First, consume the stock using the stock consumption endpoint
    const consumeRequest = {
      job_id: props.jobId,
      quantity: payload.quantity.toString(),
    }

    await api.purchasing_rest_stock_consume_create(consumeRequest, {
      params: { stock_id: payload.stockItem.id },
    })

    // Then create the cost line
    const createPayload = {
      kind: 'material' as const,
      desc: `${payload.stockItem.description} (Stock)`,
      quantity: payload.quantity.toString(),
      unit_cost: payload.unit_cost.toString(),
      unit_rev: payload.unit_rev.toString(),
      ext_refs: {
        stock_item_id: payload.stockItem.id,
        source: 'stock_consumption',
      },
      meta: {
        source: 'stock_consumption',
        stock_item_id: payload.stockItem.id,
        stock_description: payload.stockItem.description,
      },
    }

    const created = await costlineService.createCostLine(props.jobId, 'actual', createPayload)
    costLines.value = [...costLines.value, created]
    toast.success('Stock consumption added!')
    emit('cost-line-changed')
    closeStockModal()
  } catch (error) {
    toast.error('Failed to add stock consumption.')
    debugLog('Failed to add stock consumption:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-stock')
  }
}

async function submitAdjustment(payload: CostLine) {
  if (!payload || payload.kind !== 'adjust') return
  isLoading.value = true
  toast.info('Adding adjustment...', { id: 'add-adjustment' })
  try {
    const createPayload = {
      kind: 'adjust' as const,
      desc: payload.desc,
      quantity: payload.quantity.toString(),
      unit_cost: payload.unit_cost?.toString() || '0',
      unit_rev: payload.unit_rev?.toString() || '0',
      ext_refs: {
        source: 'manual_adjustment',
      },
      meta: {
        source: 'manual_adjustment',
      },
    }

    const created = await costlineService.createCostLine(props.jobId, 'actual', createPayload)
    costLines.value = [...costLines.value, created]
    toast.success('Adjustment added!')
    emit('cost-line-changed')
    closeAdjustmentModal()
  } catch (error) {
    toast.error('Failed to add adjustment.')
    debugLog('Failed to add adjustment:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-adjustment')
  }
}
</script>
