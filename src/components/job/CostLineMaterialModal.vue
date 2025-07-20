<template>
  <Dialog :open="true" @update:open="$emit('close')">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>
          <Package class="w-5 h-5 mr-2 inline-block text-blue-600" /> Add Material Cost Line
        </DialogTitle>
      </DialogHeader>
      <form @submit.prevent="submit" class="grid gap-5">
        <div class="grid grid-cols-1 gap-3">
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1">Quantity</span>
            <input
              v-model.number="form.quantity"
              type="number"
              min="0"
              step="0.01"
              required
              class="input"
            />
          </label>
          <label class="block">
            <span class="block text-sm font-medium text-gray-700 mb-1"
              >Description <span class="text-red-500">*</span></span
            >
            <input
              v-model.trim="form.desc"
              type="text"
              required
              maxlength="120"
              class="input"
              :class="{ 'border-red-500': descError }"
              @blur="validateDesc"
            />
            <span v-if="descError" class="text-xs text-red-500 mt-1">This field is required.</span>
          </label>
          <div class="flex gap-3">
            <label class="flex-1">
              <span class="block text-sm font-medium text-gray-700 mb-1">Unit cost</span>
              <input
                v-model.number="form.unitCost"
                @input="handleUnitCostInput"
                type="number"
                min="0"
                step="0.01"
                required
                class="input"
              />
            </label>
            <label class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="block text-sm font-medium text-gray-700">Unit revenue</span>
                <button
                  type="button"
                  @click="resetToCalculated"
                  v-if="form.manualRevenueOverride"
                  class="text-xs text-blue-600 hover:text-blue-800"
                  title="Reset to calculated value"
                >
                  Reset
                </button>
              </div>
              <input
                v-model.number="form.unitRevenue"
                @input="handleUnitRevenueInput"
                type="number"
                min="0"
                step="0.01"
                class="input"
                :class="{ 'bg-blue-50 border-blue-300': form.manualRevenueOverride }"
                placeholder="Enter unit revenue"
              />
              <div class="mt-1 text-xs text-gray-500">
                <span v-if="form.manualRevenueOverride" class="text-blue-600">
                  Manual override • Auto: ${{ calculatedUnitRevenue.toFixed(2) }}
                </span>
                <span v-else class="text-gray-500">
                  Auto-calculated ({{ ((props.materialsMarkup || 0) * 100).toFixed(1) }}% markup)
                </span>
              </div>
            </label>
          </div>
        </div>
        <div
          class="summary-card bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
        >
          <div class="flex items-center justify-center gap-0 text-base font-semibold">
            <span class="flex items-center gap-2 text-blue-700">
              <Package class="w-7 h-7 text-blue-500" />
              <span>Total cost:</span>
              <span class="text-blue-700">${{ totalCost.toFixed(2) }}</span>
            </span>
            <span class="mx-6 h-10 border-l border-gray-300"></span>
            <span class="flex items-center gap-2 text-green-700">
              <DollarSign class="w-7 h-7 text-green-500" />
              <span>Total revenue:</span>
              <span class="text-green-700">${{ totalRevenue.toFixed(2) }}</span>
            </span>
          </div>
        </div>
        <DialogFooter class="flex gap-2 justify-end mt-2">
          <Button type="button" variant="outline" @click="$emit('close')"> Cancel </Button>
          <Button type="submit" variant="default" :disabled="descError">
            <Plus class="w-4 h-4 mr-1" /> Add
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { debugLog } from '@/utils/debug'

import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Package, DollarSign } from 'lucide-vue-next'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'

const props = defineProps({
  materialsMarkup: Number,
  initial: Object,
  mode: { type: String, default: 'add' },
})
const emit = defineEmits(['close', 'submit'])

const form = ref({
  desc: '',
  unitCost: 0,
  quantity: 1,
  unitRevenue: 0,
  manualRevenueOverride: false,
})
const descError = ref(false)

watch(
  () => props.initial,
  (val) => {
    if (val) {
      form.value.desc = val.desc || ''
      form.value.unitCost = val.unit_cost || 0
      form.value.quantity = val.quantity || 1
      form.value.unitRevenue = val.unit_rev || 0
      form.value.manualRevenueOverride = val.unit_rev ? true : false
    }
  },
  { immediate: true },
)

function validateDesc() {
  descError.value = !form.value.desc.trim()
}

const companyDefaultsStore = useCompanyDefaultsStore()

debugLog('[MaterialModal] Store companyDefaults:', companyDefaultsStore.companyDefaults)

const calculatedUnitRevenue = computed(() => {
  const cost = Number(form.value.unitCost) || 0
  const markup = typeof props.materialsMarkup === 'number' ? props.materialsMarkup : 0

  debugLog('[MaterialModal] Calculating unitRevenue', {
    unitCost: cost,
    materialsMarkup: markup,
  })
  return Number((cost * (1 + markup)).toFixed(2))
})

const unitRevenue = computed(() => {
  return form.value.manualRevenueOverride ? form.value.unitRevenue : calculatedUnitRevenue.value
})

const totalRevenue = computed(() => unitRevenue.value * form.value.quantity)
const totalCost = computed(() => form.value.unitCost * form.value.quantity)

// Watch for changes in calculated revenue to update the form when not overridden
watch(calculatedUnitRevenue, (newValue) => {
  if (!form.value.manualRevenueOverride) {
    form.value.unitRevenue = newValue
  }
})

function handleUnitCostInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.replace(',', '.')
  form.value.unitCost = Number(input)

  // If not manually overridden, update the revenue automatically
  if (!form.value.manualRevenueOverride) {
    form.value.unitRevenue = calculatedUnitRevenue.value
  }
}

function handleUnitRevenueInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.replace(',', '.')
  form.value.unitRevenue = Number(input)
  form.value.manualRevenueOverride = true
}

function resetToCalculated() {
  form.value.unitRevenue = calculatedUnitRevenue.value
  form.value.manualRevenueOverride = false
}

function submit() {
  validateDesc()
  if (descError.value) return
  emit('submit', {
    desc: form.value.desc,
    unit_cost: String(form.value.unitCost),
    quantity: String(form.value.quantity),
    unit_rev: String(unitRevenue.value),
    total_rev: totalRevenue.value,
    total_cost: totalCost.value,
    kind: 'material',
    id: props.initial?.id,
  })
}
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
