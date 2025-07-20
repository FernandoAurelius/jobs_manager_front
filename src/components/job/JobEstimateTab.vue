<template>
  <div class="job-estimate-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Job Estimate
          <span v-if="isLoading" class="ml-2 text-sm text-gray-500">Loading...</span>
        </h2>
        <CostLineDropdown
          :disabled="isLoading"
          :wageRate="wageRate"
          :chargeOutRate="chargeOutRate"
          :materialsMarkup="materialsMarkup"
          @add-material="handleAddMaterial"
          @add-time="handleAddTime"
          @add-adjustment="handleAddAdjustment"
        />
      </div>
    </div>
    <div class="flex-1 flex gap-6 min-h-0">
      <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Estimate Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <CostLinesGrid
            :costLines="costLines"
            :showActions="true"
            @edit="handleEditCostLine"
            @delete="handleDeleteCostLine"
          />
        </div>
      </div>
      <div class="flex-1">
        <CostSetSummaryCard
          title="Estimate Summary"
          :summary="props.estimateSummaryFromBackend || estimateSummary"
          :costLines="costLines"
          :isLoading="isLoading"
          :revision="revision"
        />
      </div>
    </div>
    <CostLineMaterialModal
      v-if="showEditModal && editingCostLine && editingCostLine.kind === 'material'"
      :materialsMarkup="materialsMarkup"
      :initial="editingCostLine"
      mode="edit"
      @close="closeEditModal"
      @submit="submitEditCostLine"
    />
    <CostLineTimeModal
      v-if="showEditModal && editingCostLine && editingCostLine.kind === 'time'"
      :wageRate="wageRate"
      :chargeOutRate="chargeOutRate"
      :initial="editingCostLine"
      mode="edit"
      @close="closeEditModal"
      @submit="submitEditCostLine"
    />
    <CostLineAdjustmentModal
      v-if="showEditModal && editingCostLine && editingCostLine.kind === 'adjust'"
      :initial="editingCostLine"
      mode="edit"
      @close="closeEditModal"
      @submit="submitEditCostLine"
    />
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { onMounted, ref, computed } from 'vue'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import CostLineDropdown from './CostLineDropdown.vue'
import CostLinesGrid from '@/components/shared/CostLinesGrid.vue'
import CostSetSummaryCard from '@/components/shared/CostSetSummaryCard.vue'
import { costlineService } from '@/services/costline.service'
import { fetchCostSet } from '@/services/costing.service'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import { toast } from 'vue-sonner'
import CostLineMaterialModal from './CostLineMaterialModal.vue'
import CostLineTimeModal from './CostLineTimeModal.vue'
import CostLineAdjustmentModal from './CostLineAdjustmentModal.vue'

// Use generated API types
type CostLine = z.infer<typeof schemas.CostLine>
type CostSet = z.infer<typeof schemas.CostSet>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>

type Props = {
  jobId: string
  estimateSummaryFromBackend?: { cost: number; rev: number; hours: number; created?: string }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'cost-line-changed': []
}>()

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)
const chargeOutRate = computed(() => {
  const rate = companyDefaults.value?.charge_out_rate
  return rate ? parseFloat(rate) : 0
})
const wageRate = computed(() => {
  const rate = companyDefaults.value?.wage_rate
  return rate ? parseFloat(rate) : 0
})
const materialsMarkup = computed(() => {
  const markup = companyDefaults.value?.materials_markup
  return markup ? parseFloat(markup) : 0
})

const costLines = ref<CostLine[]>([])
const isLoading = ref(false)
const revision = ref(0)

async function loadEstimate() {
  isLoading.value = true
  try {
    const costSet: CostSet = await fetchCostSet(props.jobId, 'estimate')
    costLines.value = costSet.cost_lines.map((line) => ({
      ...line,
      quantity: typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity,
      unit_cost: typeof line.unit_cost === 'string' ? Number(line.unit_cost) : line.unit_cost,
      unit_rev: typeof line.unit_rev === 'string' ? Number(line.unit_rev) : line.unit_rev,
    }))
    revision.value = costSet.rev || 0
  } catch (error) {
    debugLog('Failed to load estimate cost lines:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadEstimate()
})

const estimateSummary = computed(() => {
  if (props.estimateSummaryFromBackend) {
    return props.estimateSummaryFromBackend
  }
  let cost = 0
  let rev = 0
  let hours = 0
  for (const line of costLines.value) {
    const quantity = typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity
    if (line.kind === 'time') {
      cost += quantity * Number(line.unit_cost)
      rev += quantity * Number(line.unit_rev)
      hours += quantity
    } else if (line.kind === 'material') {
      cost += quantity * Number(line.unit_cost)
      rev += quantity * Number(line.unit_rev)
    } else if (line.kind === 'adjust') {
      cost += quantity * Number(line.unit_cost)
      rev += quantity * Number(line.unit_rev)
    }
  }
  return {
    cost,
    rev,
    hours,
    created: undefined,
  }
})

const editingCostLine = ref<CostLine | null>(null)
const showEditModal = ref(false)

function handleEditCostLine(line: CostLine) {
  editingCostLine.value = line
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingCostLine.value = null
}

async function submitEditCostLine(payload: CostLine) {
  if (!payload || !payload.id) return
  isLoading.value = true
  toast.info('Updating cost line...', { id: 'update-cost-line' })
  try {
    const updated = await costlineService.updateCostLine(payload.id, payload)
    costLines.value = costLines.value.map((l) => (l.id === updated.id ? { ...updated } : l))
    toast.success('Cost line updated!')
    emit('cost-line-changed')
    closeEditModal()
  } catch (error) {
    toast.error('Failed to update cost line.')
    debugLog('Failed to update cost line:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('update-cost-line')
  }
}

async function handleDeleteCostLine(line: CostLine) {
  if (!line.id) return
  isLoading.value = true
  toast.info('Deleting cost line...', { id: 'delete-cost-line' })
  try {
    await costlineService.deleteCostLine(line.id)
    costLines.value = costLines.value.filter((l) => l.id !== line.id)
    toast.success('Cost line deleted successfully!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to delete cost line.')
    debugLog('Failed to delete cost line:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('delete-cost-line')
  }
}

async function handleAddMaterial(payload: CostLine) {
  if (!isCompanyDefaultsReady.value) {
    toast.error('Company defaults not loaded yet.')
    return
  }
  if (!payload || payload.kind !== 'material') return
  isLoading.value = true
  toast.info('Adding material cost line...', { id: 'add-material' })
  try {
    const createPayload: CostLineCreateUpdate = {
      kind: 'material',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost ?? 0,
      unit_rev: payload.unit_rev ?? 0,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
    toast.success('Material cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add material cost line.')
    debugLog('Failed to add material:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-material')
  }
}

async function handleAddTime(payload: CostLine) {
  if (!isCompanyDefaultsReady.value) {
    toast.error('Company defaults not loaded yet.')
    return
  }
  if (!payload || payload.kind !== 'time') return
  isLoading.value = true
  toast.info('Adding time cost line...', { id: 'add-time' })
  try {
    const createPayload: CostLineCreateUpdate = {
      kind: 'time',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost ?? wageRate.value,
      unit_rev: payload.unit_rev ?? chargeOutRate.value,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
    toast.success('Time cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add time cost line.')
    debugLog('Failed to add time:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-time')
  }
}

async function handleAddAdjustment(payload: CostLine) {
  if (!isCompanyDefaultsReady.value) {
    toast.error('Company defaults not loaded yet.')
    return
  }
  if (!payload || payload.kind !== 'adjust') return
  isLoading.value = true
  toast.info('Adding adjustment cost line...', { id: 'add-adjustment' })
  try {
    const createPayload: CostLineCreateUpdate = {
      kind: 'adjust',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost ?? 0,
      unit_rev: payload.unit_rev ?? 0,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'estimate', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
    toast.success('Adjustment cost line added!')
    toast.dismiss('add-adjustment')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add adjustment cost line.')
    debugLog('Failed to add adjustment:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('add-adjustment')
  }
}

const isCompanyDefaultsReady = computed(
  () => !!companyDefaults.value && companyDefaultsStore.isLoaded,
)
</script>

<style scoped>
:deep(.ag-theme-custom) {
  font-size: 13px;
  font-family:
    'Segoe UI',
    system-ui,
    -apple-system,
    sans-serif;
}

:deep(.ag-theme-custom .ag-header-cell) {
  font-weight: 700;
  background: #181f2a !important;
  color: #f3f4f6 !important;
  border-bottom: 1.5px solid #334155 !important;
  padding: 0 8px;
}

:deep(.ag-theme-custom .ag-cell) {
  border-right: 1px solid rgb(226, 232, 240);
  display: flex;
  align-items: center;
  padding: 0 8px;
}

:deep(.ag-theme-custom .ag-row:nth-child(odd)) {
  background-color: rgb(248, 250, 252);
}

:deep(.ag-theme-custom .ag-row:hover) {
  background-color: rgb(241, 245, 249);
}

:deep(.ag-theme-custom .ag-row-selected) {
  background-color: rgb(219, 234, 254) !important;
  border: 1px solid rgb(59, 130, 246);
}

:deep(.ag-theme-custom .ag-body-horizontal-scroll) {
  height: 14px !important;
}

:deep(.ag-theme-custom .ag-body-vertical-scroll) {
  width: 14px !important;
}

:deep(.text-center) {
  justify-content: center;
}

:deep(.ag-theme-custom .ag-selection-checkbox),
:deep(.ag-theme-custom .ag-checkbox),
:deep(.ag-theme-custom .ag-checkbox-input-wrapper),
:deep(.ag-theme-custom .ag-header-cell-menu-button),
:deep(.ag-theme-custom .ag-icon-menu),
:deep(.ag-theme-custom .ag-sort-indicator-container),
:deep(.ag-theme-custom .ag-icon),
:deep(.ag-theme-custom .ag-header-cell-filter-button),
:deep(.ag-theme-custom .ag-side-button),
:deep(.ag-theme-custom .ag-panel-title-bar-button),
:deep(.ag-theme-custom .ag-column-select-checkbox),
:deep(.ag-theme-custom .ag-group-checkbox) {
  display: none !important;
  visibility: hidden !important;
}

:deep(.ag-theme-custom .ag-header-cell-label) {
  justify-content: flex-start;
  padding-left: 0;
  width: 100%;
}

@media (max-width: 1024px) {
  :deep(.ag-theme-custom) {
    font-size: 12px;
  }

  :deep(.ag-theme-custom .ag-header-cell),
  :deep(.ag-theme-custom .ag-cell) {
    padding: 0 4px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='meta.labour_minutes']),
  :deep(.ag-theme-custom .ag-cell[col-id='meta.labour_minutes']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='meta.item_cost']),
  :deep(.ag-theme-custom .ag-cell[col-id='meta.item_cost']) {
    display: none;
  }
}

@media (max-width: 640px) {
  :deep(.ag-theme-custom) {
    font-size: 11px;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='category']),
  :deep(.ag-theme-custom .ag-cell[col-id='category']) {
    display: none;
  }

  :deep(.ag-theme-custom .ag-header-cell[col-id='actions']),
  :deep(.ag-theme-custom .ag-cell[col-id='actions']) {
    display: none;
  }
}
</style>
