<script setup lang="ts">
import { computed, h, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Package, MapPin, DollarSign, Target, History } from 'lucide-vue-next'
import { useDeliveryReceiptStore } from '@/stores/deliveryReceiptStore'
import { formatMetalType } from '@/utils/metalType'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import type { DeliveryAllocation, DeliveryDataTableRowContext } from '@/api/local/schemas'

// Use generated API types
type PurchaseOrderLine = z.infer<typeof schemas.PurchaseOrderLine>
type Job = z.infer<typeof schemas.Job>
type AllocationItem = z.infer<typeof schemas.AllocationItem>

type Props = {
  lines: PurchaseOrderLine[]
  jobs: Job[]
  allocations: Record<string, DeliveryAllocation[]>
  existingAllocations?: Record<string, AllocationItem[]>
}

type Emits = {
  (e: 'update:allocations', allocations: Record<string, DeliveryAllocation[]>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const deliveryReceiptStore = useDeliveryReceiptStore()

const isModalOpen = ref(false)
const editingLineId = ref<string | null>(null)
const editingAllocationIndex = ref<number | null>(null)
const modalData = ref<DeliveryAllocation>({
  job_id: null,
  stock_location: null,
  quantity: 0,
  retail_rate: 0,
})

const getLineAllocations = (lineId: string): DeliveryAllocation[] => {
  return props.allocations[lineId] || []
}

const getExistingAllocations = (lineId: string): AllocationItem[] => {
  return props.existingAllocations?.[lineId] || []
}

// Get total received from EXISTING (saved) allocations only
// Used for calculating remaining quantity accurately
const getTotalReceivedFromSaved = (lineId: string): number => {
  return getExistingAllocations(lineId).reduce((sum, allocation) => sum + allocation.quantity, 0)
}

// Get total received including CURRENT (unsaved) allocations
// Used for display purposes (showing "This Receipt" total)
const getTotalReceived = (lineId: string): number => {
  return getLineAllocations(lineId).reduce((sum, allocation) => sum + allocation.quantity, 0)
}

const getRemaining = (line: PurchaseOrderLine): number => {
  const remaining = Math.max(0, line.quantity - (line.received_quantity || 0))

  // Use only EXISTING allocations for calculating remaining
  const existingAllocations = getTotalReceivedFromSaved(line.id)

  return Math.max(0, remaining - existingAllocations)
}

const getJobName = (jobId: string | null): string => {
  if (!jobId) return 'Stock'
  const job = props.jobs.find((j) => j.id === jobId)
  return job?.is_stock_holding ? 'Stock' : job?.name || 'Unknown Job'
}

const truncateText = (text: string, maxLength: number = 12): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const openModal = (lineId: string, allocationIndex?: number) => {
  editingLineId.value = lineId
  editingAllocationIndex.value = allocationIndex ?? null

  const line = props.lines.find((l) => l.id === lineId)
  const remaining = line ? getRemaining(line) : 0

  if (allocationIndex !== undefined) {
    const allocation = getLineAllocations(lineId)[allocationIndex]
    modalData.value = { ...allocation }
  } else {
    modalData.value = {
      job_id: props.jobs[0]?.id || null,
      stock_location: null,
      quantity: Math.min(remaining, 1),
      retail_rate: deliveryReceiptStore.getDefaultRetailRate(),
    }
  }

  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingLineId.value = null
  editingAllocationIndex.value = null
  modalData.value = {
    job_id: null,
    stock_location: null,
    quantity: 0,
    retail_rate: deliveryReceiptStore.getDefaultRetailRate(),
  }
}

const saveAllocation = () => {
  if (!editingLineId.value) return

  const newAllocations = { ...props.allocations }
  if (!newAllocations[editingLineId.value]) {
    newAllocations[editingLineId.value] = []
  }

  const allocations = [...newAllocations[editingLineId.value]]

  const allocationData = { ...modalData.value }

  if (allocationData.job_id === null) {
    const stockHolding = props.jobs.find((job) => job.is_stock_holding)
    if (stockHolding) {
      allocationData.job_id = stockHolding.id
    }
  }

  if (editingAllocationIndex.value !== null) {
    allocations[editingAllocationIndex.value] = allocationData
  } else {
    allocations.push(allocationData)
  }

  newAllocations[editingLineId.value] = allocations
  emit('update:allocations', newAllocations)
  closeModal()
}

const removeAllocation = (lineId: string, index: number) => {
  const newAllocations = { ...props.allocations }
  if (newAllocations[lineId]) {
    newAllocations[lineId] = newAllocations[lineId].filter((_, i) => i !== index)
  }
  emit('update:allocations', newAllocations)
}

const columns = computed(() => [
  {
    id: 'description',
    header: 'Description',
    headerClass: 'text-center',
    cell: ({ row }: DeliveryDataTableRowContext) => {
      const line = row.original
      return h('div', { class: 'space-y-1' }, [
        h('div', { class: 'font-medium' }, line.description || '-'),
        line.part_no ? h('div', { class: 'text-sm text-gray-500' }, `Part: ${line.part_no}`) : null,
        line.metal_type || line.alloy
          ? h(
              'div',
              { class: 'text-sm text-gray-500' },
              [formatMetalType(line.metal_type), line.alloy].filter(Boolean).join(' - '),
            )
          : null,
      ])
    },
  },
  {
    id: 'quantities',
    header: 'Quantities',
    headerClass: 'text-center',
    cell: ({ row }: DeliveryDataTableRowContext) => {
      const line = row.original
      const remaining = getRemaining(line)
      const totalReceived = getTotalReceived(line.id)

      return h('div', { class: 'space-y-2 text-center' }, [
        h('div', { class: 'flex items-center justify-center gap-2' }, [
          h(Package, { class: 'w-4 h-4 text-blue-500' }),
          h('span', { class: 'text-sm font-medium' }, 'Ordered:'),
          h('span', { class: 'font-bold' }, Number(line.quantity) || 0),
        ]),
        h('div', { class: 'flex items-center justify-center gap-2' }, [
          h(Package, { class: 'w-4 h-4 text-green-500' }),
          h('span', { class: 'text-sm font-medium' }, 'Previously:'),
          h('span', {}, Number(line.received_quantity) || 0),
        ]),
        h('div', { class: 'flex items-center justify-center gap-2' }, [
          h(Package, { class: 'w-4 h-4 text-orange-500' }),
          h('span', { class: 'text-sm font-medium' }, 'Remaining:'),
          h('span', { class: 'font-bold text-orange-600' }, remaining),
        ]),
        totalReceived > 0
          ? h('div', { class: 'flex items-center justify-center gap-2 mt-2 pt-2 border-t' }, [
              h(Package, { class: 'w-4 h-4 text-purple-500' }),
              h('span', { class: 'text-sm font-medium' }, 'This Receipt:'),
              h('span', { class: 'font-bold text-purple-600' }, totalReceived),
            ])
          : null,
      ])
    },
  },
  {
    id: 'allocations',
    header: 'Delivery Allocations',
    headerClass: 'text-center',
    cell: ({ row }: DeliveryDataTableRowContext) => {
      const allocations = getLineAllocations(row.original.id)
      const existingAllocations = getExistingAllocations(row.original.id)
      const remaining = getRemaining(row.original)

      return h('div', { class: 'space-y-2 max-w-sm' }, [
        existingAllocations.length > 0
          ? h('div', { class: 'p-2 border rounded-lg bg-blue-50 border-blue-200' }, [
              h('div', { class: 'flex items-center gap-1 mb-1' }, [
                h(History, { class: 'w-3 h-3 text-blue-600 flex-shrink-0' }),
                h('span', { class: 'text-xs font-medium text-blue-800' }, 'Previous Allocations'),
              ]),
              h('div', { class: 'text-xs text-blue-700' }, [
                `${existingAllocations.length} allocation${existingAllocations.length > 1 ? 's' : ''} • `,
                `Total: ${existingAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0)} units`,
              ]),
            ])
          : null,

        existingAllocations.length > 0 && allocations.length > 0
          ? h('div', { class: 'border-t border-gray-200 my-2' })
          : null,

        allocations.length > 0
          ? h('div', { class: 'text-xs font-medium text-gray-700 mb-1' }, 'This Receipt:')
          : null,

        ...allocations.map((allocation, index) =>
          h('div', { key: index, class: 'p-2 border rounded-lg bg-gray-50 text-sm' }, [
            h('div', { class: 'flex items-center justify-between' }, [
              h('div', { class: 'flex-1 min-w-0' }, [
                h('div', { class: 'flex items-center gap-1 mb-1' }, [
                  h(Target, { class: 'w-3 h-3 text-blue-500 flex-shrink-0' }),
                  h(
                    'span',
                    { class: 'font-medium text-xs truncate' },
                    truncateText(getJobName(allocation.job_id), 10),
                  ),
                ]),
                h('div', { class: 'text-xs text-gray-600 truncate' }, [
                  `Qty: ${allocation.quantity}`,
                  allocation.job_id && allocation.retail_rate > 0
                    ? ` | ${allocation.retail_rate}%`
                    : '',
                  allocation.stock_location
                    ? ` | ${truncateText(allocation.stock_location, 8)}`
                    : '',
                ]),
              ]),
              h('div', { class: 'flex gap-1 ml-2 flex-shrink-0' }, [
                h(
                  Button,
                  {
                    variant: 'outline',
                    size: 'sm',
                    class: 'h-6 w-6 p-0',
                    onClick: () => openModal(row.original.id, index),
                  },
                  () => h(Edit, { class: 'w-3 h-3' }),
                ),
                h(
                  Button,
                  {
                    variant: 'outline',
                    size: 'sm',
                    class: 'h-6 w-6 p-0 text-red-600 hover:text-red-700',
                    onClick: () => removeAllocation(row.original.id, index),
                  },
                  () => h(Trash2, { class: 'w-3 h-3' }),
                ),
              ]),
            ]),
          ]),
        ),

        remaining > 0
          ? h('div', { class: 'flex justify-center' }, [
              h(
                Button,
                {
                  variant: 'outline',
                  size: 'sm',
                  class: 'border-dashed border-2 hover:border-solid text-xs',
                  onClick: () => openModal(row.original.id),
                },
                () => [h(Plus, { class: 'w-3 h-3 mr-1' }), 'Add'],
              ),
            ])
          : null,

        // Check if current total allocations exceed what's available (ordered - already received)
        (() => {
          const totalCurrentAllocations = getTotalReceived(row.original.id)
          const maxAvailable = Math.max(
            0,
            row.original.quantity - (row.original.received_quantity || 0),
          )
          return totalCurrentAllocations > maxAvailable
            ? h(
                'div',
                { class: 'p-1 bg-red-50 border border-red-200 rounded text-xs text-red-700' },
                ['Warning: Exceeds remaining'],
              )
            : null
        })(),
      ])
    },
    meta: { editable: true },
  },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      class="flex-1 overflow-auto"
      :style="`max-height: ${Math.min(400, Math.max(200, props.lines.length * 120 + 100))}px`"
    >
      <DataTable
        :columns="columns"
        :data="props.lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
        class="w-full"
      />
    </div>

    <!-- Allocation Modal using shadcn-vue Dialog -->
    <Dialog
      :open="isModalOpen"
      @update:open="
        (open) => {
          if (!open) closeModal()
        }
      "
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ editingAllocationIndex !== null ? 'Edit' : 'Add' }} Allocation
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Allocation Target -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Allocation Target </label>
            <Select v-model="modalData.job_id">
              <SelectTrigger>
                <SelectValue placeholder="Select Job or Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="null">
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4 text-gray-500" />
                    Stock Holding
                  </div>
                </SelectItem>
                <SelectItem
                  v-for="job in props.jobs.filter((j) => !j.is_stock_holding)"
                  :key="job.id"
                  :value="job.id"
                >
                  <div class="flex items-center gap-2">
                    <Package class="w-4 h-4 text-blue-500" />
                    {{ job.name }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Quantity -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Quantity Received </label>
            <Input
              v-model.number="modalData.quantity"
              type="number"
              step="1"
              min="0"
              :max="
                editingLineId ? getRemaining(props.lines.find((l) => l.id === editingLineId)!) : 0
              "
              placeholder="Enter quantity"
            />
          </div>

          <!-- Conditional Fields -->
          <div v-if="modalData.job_id">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <div class="flex items-center gap-2">
                <DollarSign class="w-4 h-4" />
                Retail Rate (%)
              </div>
            </label>
            <Input
              v-model.number="modalData.retail_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 20.5"
            />
          </div>

          <div v-if="!modalData.job_id">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <div class="flex items-center gap-2">
                <MapPin class="w-4 h-4" />
                Stock Location
              </div>
            </label>
            <Input
              v-model="modalData.stock_location"
              placeholder="e.g., Pallet 12 - Rack D, Shelf 3 etc."
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeModal"> Cancel </Button>
          <Button @click="saveAllocation">
            {{ editingAllocationIndex !== null ? 'Update' : 'Add' }} Allocation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
