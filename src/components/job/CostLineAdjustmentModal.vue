<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          <Settings class="w-5 h-5 mr-2 inline-block text-pink-600" />
          {{ mode === 'create' ? 'Add Adjustment' : 'Edit Adjustment' }}
        </DialogTitle>
      </DialogHeader>
      <form @submit.prevent="handleSubmit" class="grid gap-5">
        <div class="grid grid-cols-1 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Description <span class="text-red-500">*</span></span
            >
            <input
              v-model.trim="formData.desc"
              type="text"
              required
              maxlength="120"
              class="input"
              :class="{ 'border-red-500': descError }"
              @blur="validateDesc"
              placeholder="e.g., Additional materials, Labor adjustment..."
            />
            <span v-if="descError" class="text-xs text-red-500 mt-1">This field is required.</span>
          </label>

          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">Quantity</span>
            <input
              v-model.number="formData.quantity"
              type="number"
              min="0.001"
              step="0.001"
              required
              class="input"
              placeholder="1.000"
            />
          </label>

          <div class="flex gap-3">
            <label class="flex-1">
              <span class="block text-sm font-medium text-gray-700 mb-1">Unit cost</span>
              <input
                v-model.number="formData.unit_cost"
                @input="handleUnitCostInput"
                type="number"
                step="0.01"
                required
                class="input"
                placeholder="0.00"
              />
              <span class="text-xs text-gray-500 mt-1"
                >Use negative values for credits/refunds</span
              >
            </label>
            <label class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="block text-sm font-medium text-gray-700">Unit revenue</span>
                <button
                  type="button"
                  @click="resetToCalculated"
                  v-if="formData.manualRevenueOverride"
                  class="text-xs text-blue-600 hover:text-blue-800"
                  title="Reset to calculated value"
                >
                  Reset
                </button>
              </div>
              <input
                v-model.number="formData.unit_rev"
                @input="handleUnitRevenueInput"
                type="number"
                step="0.01"
                class="input"
                :class="{ 'bg-blue-50 border-blue-300': formData.manualRevenueOverride }"
                placeholder="0.00"
              />
              <div class="mt-1 text-xs text-gray-500">
                <span v-if="formData.manualRevenueOverride" class="text-blue-600">
                  Manual override • Auto: ${{ calculatedUnitRevenue.toFixed(2) }}
                </span>
                <span v-else class="text-gray-500">
                  Auto-calculated ({{
                    ((companyDefaultsStore.companyDefaults?.materials_markup || 0) * 100).toFixed(
                      1,
                    )
                  }}% markup)
                </span>
              </div>
            </label>
          </div>
        </div>

        <div
          class="summary-card bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
        >
          <div class="flex items-center justify-center gap-0 text-base font-semibold">
            <span class="flex items-center gap-2 text-pink-700">
              <Settings class="w-7 h-7 text-pink-500" />
              <span>Total cost:</span>
              <span
                class="font-medium"
                :class="totalCost >= 0 ? 'text-pink-700' : 'text-green-600'"
              >
                ${{ formatCurrency(Math.abs(totalCost)) }}{{ totalCost < 0 ? ' (Credit)' : '' }}
              </span>
            </span>
            <span class="mx-6 h-10 border-l border-gray-300"></span>
            <span class="flex items-center gap-2 text-green-700">
              <DollarSign class="w-7 h-7 text-green-500" />
              <span>Total revenue:</span>
              <span
                class="font-medium"
                :class="totalRevenue >= 0 ? 'text-green-700' : 'text-red-600'"
              >
                ${{ formatCurrency(Math.abs(totalRevenue))
                }}{{ totalRevenue < 0 ? ' (Credit)' : '' }}
              </span>
            </span>
          </div>
        </div>

        <DialogFooter class="flex gap-2 justify-end mt-2">
          <Button type="button" variant="outline" @click="$emit('close')"> Cancel </Button>
          <Button type="submit" variant="default" :disabled="descError || !canSubmit">
            <Plus class="w-4 h-4 mr-1" />
            {{ mode === 'create' ? 'Add Adjustment' : 'Update Adjustment' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Plus, Settings, DollarSign } from 'lucide-vue-next'
import { schemas } from '../../api/generated/api'
import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { debugLog } from '../../utils/debug'
import { z } from 'zod'

type CostLine = z.infer<typeof schemas.CostLine>
type CostLineCreateUpdate = z.infer<typeof schemas.CostLineCreateUpdate>

const props = defineProps<{
  initial?: CostLine | null
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CostLine | CostLineCreateUpdate]
}>()

const companyDefaultsStore = useCompanyDefaultsStore()

const formData = ref({
  desc: '',
  quantity: 1,
  unit_cost: 0,
  unit_rev: 0,
  manualRevenueOverride: false,
})

const descError = ref(false)

function validateDesc() {
  descError.value = !formData.value.desc.trim()
}

const canSubmit = computed(() => {
  return formData.value.desc.trim() && formData.value.quantity > 0
})

// For adjustments, use materials markup like stock consumption
const calculatedUnitRevenue = computed(() => {
  const cost = Number(formData.value.unit_cost) || 0
  const markup = Number(companyDefaultsStore.companyDefaults?.materials_markup || 0)

  debugLog('[AdjustmentModal] Calculating unitRevenue', {
    unitCost: cost,
    materialsMarkup: markup,
  })
  return Number((cost * (1 + markup)).toFixed(2))
})

const unitRevenue = computed(() => {
  return formData.value.manualRevenueOverride
    ? formData.value.unit_rev
    : calculatedUnitRevenue.value
})

const totalCost = computed(() => formData.value.quantity * formData.value.unit_cost)
const totalRevenue = computed(() => formData.value.quantity * unitRevenue.value)

function formatCurrency(value: number): string {
  return value.toFixed(2)
}

function handleUnitCostInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.replace(',', '.')
  formData.value.unit_cost = Number(input)

  // If not manually overridden, update the revenue automatically with markup
  if (!formData.value.manualRevenueOverride) {
    formData.value.unit_rev = calculatedUnitRevenue.value
  }
}

function handleUnitRevenueInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.replace(',', '.')
  formData.value.unit_rev = Number(input)
  formData.value.manualRevenueOverride = true
}

function resetToCalculated() {
  formData.value.unit_rev = calculatedUnitRevenue.value
  formData.value.manualRevenueOverride = false
}

// Watch for changes in calculated revenue to update the form when not overridden
watch(calculatedUnitRevenue, (newValue) => {
  if (!formData.value.manualRevenueOverride) {
    formData.value.unit_rev = newValue
  }
})

// Auto-calculate unit_rev based on unit_cost when unit_cost changes (legacy watch)
watch(
  () => formData.value.unit_cost,
  (newCost) => {
    // For adjustments, revenue equals cost by default, but only if not overridden
    if (!formData.value.manualRevenueOverride) {
      formData.value.unit_rev = newCost
    }
  },
)

function handleSubmit() {
  validateDesc()
  if (descError.value || !canSubmit.value) return

  if (props.mode === 'edit' && props.initial?.id) {
    // For editing existing cost lines
    const payload: CostLine = {
      id: props.initial.id,
      kind: 'adjust',
      desc: formData.value.desc,
      quantity: formData.value.quantity.toString(),
      unit_cost: formData.value.unit_cost.toString(),
      unit_rev: unitRevenue.value.toString(),
      total_cost: totalCost.value,
      total_rev: totalRevenue.value,
      ext_refs: props.initial.ext_refs || {},
      meta: props.initial.meta || {},
    }
    emit('submit', payload)
  } else {
    // For creating new cost lines
    const payload: CostLineCreateUpdate = {
      kind: 'adjust',
      desc: formData.value.desc,
      quantity: formData.value.quantity.toString(),
      unit_cost: formData.value.unit_cost.toString(),
      unit_rev: unitRevenue.value.toString(),
      ext_refs: {},
      meta: {},
    }
    emit('submit', payload)
  }
}

onMounted(() => {
  if (props.initial && props.mode === 'edit') {
    formData.value = {
      desc: props.initial.desc || '',
      quantity: Number(props.initial.quantity) || 1,
      unit_cost: Number(props.initial.unit_cost) || 0,
      unit_rev: Number(props.initial.unit_rev) || 0,
      manualRevenueOverride: props.initial.unit_rev ? true : false,
    }
  }
})
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
  background: #fff;
}
.input:focus {
  border-color: #2563eb;
  background: #f0f6ff;
}
.summary-card {
  margin-top: 0.5rem;
}
</style>
