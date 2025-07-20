<script setup lang="ts">
import { computed, h } from 'vue'
import DataTable from '../DataTable.vue'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ArrowUp, ArrowUpToLine } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { schemas } from '../../api/generated/api'
import type { z } from 'zod'

// Use generated types from API schema
type Job = z.infer<typeof schemas.Job>

// Extend DeliveryReceiptLine with additional fields used in the UI
type ReceivedLine = z.infer<typeof schemas.DeliveryReceiptLine> & {
  id: string
  job_name?: string
  description: string
  quantity: number
  received_quantity: number
  unit_cost: number | null
  job_allocation: number
  stock_allocation: number
  allocated_job_id: string
  retail_rate: number
  selected?: boolean
}

interface DataTableRowContext {
  row: {
    original: ReceivedLine
    index: number
  }
}

type Props = {
  lines: ReceivedLine[]
  selectedLines: string[]
  jobs: Job[]
  stockHoldingJob: Job | null
  isLoading?: boolean
}

type Emits = {
  (e: 'update:selected-lines', lineIds: string[]): void
  (e: 'update:line', lineId: string, field: string, value: string | number): void
  (e: 'move-selected-to-pending'): void
  (e: 'move-all-to-pending'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const allSelected = computed(
  () =>
    props.lines.length > 0 && props.lines.every((line) => props.selectedLines.includes(line.id)),
)

const jobOptions = computed(() => {
  const options = props.jobs.map((job) => ({ value: job.id, label: job.name }))
  if (props.stockHoldingJob) {
    options.unshift({
      value: props.stockHoldingJob.id,
      label: `${props.stockHoldingJob.name} (Stock)`,
    })
  }
  return options
})

const columns = computed(() => [
  {
    id: 'select',
    header: () =>
      h(Checkbox, {
        modelValue: allSelected.value,
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') => {
          if (checked === true) {
            emit(
              'update:selected-lines',
              props.lines.map((line) => line.id),
            )
          } else {
            emit('update:selected-lines', [])
          }
        },
        class: 'mx-auto',
      }),
    cell: ({ row }: DataTableRowContext) =>
      h(Checkbox, {
        modelValue: props.selectedLines.includes(row.original.id),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') => {
          const newSelection =
            checked === true
              ? [...props.selectedLines, row.original.id]
              : props.selectedLines.filter((id) => id !== row.original.id)
          emit('update:selected-lines', newSelection)
        },
        class: 'mx-auto',
      }),
    meta: { editable: true },
  },
  {
    id: 'job_name',
    header: 'Original Job',
    accessorKey: 'job_name',
    cell: ({ row }: DataTableRowContext) => row.original.job_name || 'N/A',
  },
  {
    id: 'description',
    header: 'Description',
    accessorKey: 'description',
  },
  {
    id: 'remaining_quantity',
    header: 'Remaining',
    cell: ({ row }: DataTableRowContext) => {
      const remaining = row.original.quantity - row.original.received_quantity
      return remaining.toFixed(2)
    },
  },
  {
    id: 'total_received',
    header: 'Total Received',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '0.01',
        min: '0',
        max: row.original.quantity - row.original.received_quantity,
        modelValue: row.original.total_received,
        class: 'w-24 text-right',
        'onUpdate:modelValue': (val: string | number) => {
          const num = Number(val)
          if (!Number.isNaN(num) && num >= 0) {
            emit('update:line', row.original.id, 'total_received', num)
          }
        },
      }),
    meta: { editable: true },
  },
  {
    id: 'allocated_job',
    header: 'Allocate To',
    cell: ({ row }: DataTableRowContext) =>
      h(
        Select,
        {
          modelValue: row.original.allocated_job_id,
          'onUpdate:modelValue': (val: string | undefined) => {
            emit('update:line', row.original.id, 'allocated_job_id', String(val || ''))
          },
        },
        {
          default: () => [
            h(
              SelectTrigger,
              { class: 'w-40' },
              {
                default: () => h(SelectValue, { placeholder: 'Select job...' }),
              },
            ),
            h(
              SelectContent,
              {},
              {
                default: () =>
                  jobOptions.value.map((option) =>
                    h(
                      SelectItem,
                      {
                        key: option.value,
                        value: option.value,
                      },
                      () => option.label,
                    ),
                  ),
              },
            ),
          ],
        },
      ),
    meta: { editable: true },
  },
  {
    id: 'job_allocation',
    header: 'Job Portion',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '0.01',
        max: row.original.total_received,
        modelValue: row.original.job_allocation,
        class: 'w-24 text-right',
        'onUpdate:modelValue': (val: string | number) => {
          const num = Number(val)
          if (!Number.isNaN(num)) {
            if (num < 0) {
              toast.warning(`Warning: Job allocation cannot be negative. Setting to 0.`)
              emit('update:line', row.original.id, 'job_allocation', 0)
              const stockAllocation = parseFloat(row.original.total_received) - 0
              emit('update:line', row.original.id, 'stock_allocation', stockAllocation)
            } else {
              emit('update:line', row.original.id, 'job_allocation', num)
              const totalReceived =
                typeof row.original.total_received === 'string'
                  ? parseFloat(row.original.total_received)
                  : row.original.total_received
              const stockAllocation = totalReceived - num
              emit('update:line', row.original.id, 'stock_allocation', stockAllocation)

              if (stockAllocation < 0) {
                toast.warning(`Warning: This will put stock allocation to ${stockAllocation}`)
              }
            }
          }
        },
      }),
    meta: { editable: true },
  },
  {
    id: 'unit_cost',
    header: 'Unit Cost',
    cell: ({ row }: DataTableRowContext) =>
      row.original.unit_cost ? `$${row.original.unit_cost.toFixed(2)}` : 'N/A',
  },
  {
    id: 'retail_rate',
    header: 'Retail Rate %',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '1',
        min: '0',
        max: '100',
        modelValue: row.original.retail_rate,
        class: 'w-20 text-right',
        'onUpdate:modelValue': (val: string | number) => {
          const num = Number(val)
          if (!Number.isNaN(num) && num >= 0 && num <= 100) {
            emit('update:line', row.original.id, 'retail_rate', num)
          }
        },
      }),
    meta: { editable: true },
  },
])
</script>

<template>
  <div class="space-y-4">
    <!-- Action Buttons -->
    <div class="flex gap-2 justify-center">
      <Button
        @click="emit('move-selected-to-pending')"
        :disabled="selectedLines.length === 0"
        variant="secondary"
        class="flex items-center gap-2"
      >
        <ArrowUp class="w-4 h-4" />
        Move Selected to Pending
      </Button>
      <Button
        @click="emit('move-all-to-pending')"
        variant="secondary"
        :disabled="lines.length === 0"
        class="flex items-center gap-2"
      >
        <ArrowUpToLine class="w-4 h-4" />
        Move All to Pending
      </Button>
    </div>

    <!-- Data Table -->
    <div class="border rounded-lg">
      <DataTable
        :columns="columns"
        :data="lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
        class="min-h-[200px]"
      />

      <!-- Loading State -->
      <div v-if="lines.length === 0 && isLoading" class="p-8 text-center text-gray-500">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <div class="text-lg font-medium">Loading received items</div>
        </div>
        <div class="text-sm">Please wait while we fetch the data</div>
      </div>

      <!-- Empty State -->
      <div v-if="lines.length === 0 && !isLoading" class="p-8 text-center text-gray-500">
        <div class="text-lg font-medium">No received items</div>
        <div class="text-sm">Move items from pending to configure allocation</div>
      </div>
    </div>
  </div>
</template>
