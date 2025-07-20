<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :disabled="disabled" variant="outline" class="gap-2">
        <Plus class="w-4 h-4" />
        Add entry
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="openMaterialModal">
        <Package class="w-4 h-4 mr-2 text-blue-600" /> Material
      </DropdownMenuItem>
      <DropdownMenuItem @click="openTimeModal">
        <Clock class="w-4 h-4 mr-2 text-green-600" /> Time
      </DropdownMenuItem>
      <DropdownMenuItem @click="openAdjustmentModal">
        <Settings class="w-4 h-4 mr-2 text-pink-600" /> Adjustment
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <MaterialModal
    v-if="showMaterialModal"
    :wageRate="wageRate"
    :chargeOutRate="chargeOutRate"
    :materialsMarkup="materialsMarkup"
    @close="closeMaterialModal"
    @submit="onMaterialSubmit"
  />
  <TimeModal
    v-if="showTimeModal"
    :wageRate="wageRate"
    :chargeOutRate="chargeOutRate"
    @close="closeTimeModal"
    @submit="onTimeSubmit"
  />
  <AdjustmentModal
    v-if="showAdjustmentModal"
    mode="create"
    @close="closeAdjustmentModal"
    @submit="onAdjustmentSubmit"
  />
</template>

<script lang="ts" setup>
import { debugLog } from '@/utils/debug'

import { ref, defineEmits, defineProps } from 'vue'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Plus, Package, Clock, Settings } from 'lucide-vue-next'
import MaterialModal from './CostLineMaterialModal.vue'
import TimeModal from './CostLineTimeModal.vue'
import AdjustmentModal from './CostLineAdjustmentModal.vue'

const emit = defineEmits(['add-material', 'add-time', 'add-adjustment'])

const props = defineProps({
  wageRate: { type: Number, required: true },
  chargeOutRate: { type: Number, required: true },
  materialsMarkup: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})

const showMaterialModal = ref(false)
const showTimeModal = ref(false)
const showAdjustmentModal = ref(false)

function openMaterialModal() {
  debugLog('[AddCostLineDropdown] Opening MaterialModal with props:', {
    wageRate: props.wageRate,
    chargeOutRate: props.chargeOutRate,
    materialsMarkup: props.materialsMarkup,
  })
  showMaterialModal.value = true
}
function openTimeModal() {
  debugLog('[AddCostLineDropdown] Opening TimeModal with props:', {
    wageRate: props.wageRate,
    chargeOutRate: props.chargeOutRate,
    materialsMarkup: props.materialsMarkup,
  })
  showTimeModal.value = true
}
function openAdjustmentModal() {
  debugLog('[AddCostLineDropdown] Opening AdjustmentModal')
  showAdjustmentModal.value = true
}
function closeMaterialModal() {
  showMaterialModal.value = false
}
function closeTimeModal() {
  showTimeModal.value = false
}
function closeAdjustmentModal() {
  showAdjustmentModal.value = false
}
function onMaterialSubmit(payload: Record<string, unknown>) {
  emit('add-material', payload)
  closeMaterialModal()
}
function onTimeSubmit(payload: Record<string, unknown>) {
  emit('add-time', payload)
  closeTimeModal()
}
function onAdjustmentSubmit(payload: Record<string, unknown>) {
  emit('add-adjustment', payload)
  closeAdjustmentModal()
}
</script>

<style scoped>
.add-entry-btn {
  min-width: 120px;
}
</style>
