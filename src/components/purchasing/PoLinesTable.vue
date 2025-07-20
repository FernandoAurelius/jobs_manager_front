<script setup lang="ts">
import { computed, h, ref } from 'vue'
import DataTable from '@/components/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DialogContent from '@/components/ui/dialog/DialogContent.vue'
import DialogDescription from '@/components/ui/dialog/DialogDescription.vue'
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue'
import DialogTitle from '@/components/ui/dialog/DialogTitle.vue'
import { Trash2, Settings2 } from 'lucide-vue-next'
import { metalTypeOptions } from '@/utils/metalType'
import ItemSelect from '@/views/purchasing/ItemSelect.vue'
import JobSelect from './JobSelect.vue'
import { schemas } from '@/api/generated/api'
import { DataTableRowContextSchema, PoLineUISchema, type XeroItemUI } from '@/api/local/schemas'
import { z } from 'zod'

type PoLineUI = z.infer<typeof PoLineUISchema>
type DataTableRowContext = z.infer<typeof DataTableRowContextSchema>
type JobForPurchasing = z.infer<typeof schemas.JobForPurchasing>

type Props = {
  lines: PoLineUI[]
  items: XeroItemUI[]
  jobs: JobForPurchasing[]
  readOnly?: boolean
  jobsReadOnly?: boolean
}

type Emits = {
  (e: 'update:lines', lines: PoLineUI[]): void
  (e: 'add-line'): void
  (e: 'delete-line', id: string | number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showAdditionalFieldsModal = ref(false)
const editingLineIndex = ref<number>(-1)
const additionalFields = ref({
  metal_type: '',
  alloy: '',
  specifics: '',
  location: '',
  dimensions: '',
})

const openAdditionalFieldsModal = (lineIndex: number) => {
  if (props.readOnly) return

  editingLineIndex.value = lineIndex
  const line = props.lines[lineIndex]

  additionalFields.value = {
    metal_type: line.metal_type || '',
    alloy: line.alloy || '',
    specifics: line.specifics || '',
    location: line.location || '',
    dimensions: line.dimensions || '',
  }

  showAdditionalFieldsModal.value = true
}

const saveAdditionalFields = () => {
  if (editingLineIndex.value === -1) return

  const updated = props.lines.map((line, idx) =>
    idx === editingLineIndex.value
      ? {
          ...line,
          metal_type: additionalFields.value.metal_type || undefined,
          alloy: additionalFields.value.alloy || undefined,
          specifics: additionalFields.value.specifics || undefined,
          location: additionalFields.value.location || undefined,
          dimensions: additionalFields.value.dimensions || undefined,
        }
      : line,
  )

  emit('update:lines', updated)
  closeAdditionalFieldsModal()
}

const closeAdditionalFieldsModal = () => {
  showAdditionalFieldsModal.value = false
  editingLineIndex.value = -1
  additionalFields.value = {
    metal_type: '',
    alloy: '',
    specifics: '',
    location: '',
    dimensions: '',
  }
}

const handleAddLine = () => {
  if (props.readOnly) {
    return
  }

  emit('add-line')
}

const columns = computed(() => [
  {
    id: 'item_code',
    header: 'Item',
    cell: ({ row }: DataTableRowContext) =>
      h(ItemSelect, {
        modelValue: row.original.item_code,
        items: props.items,
        clearable: true,
        disabled: props.readOnly,
        'onUpdate:modelValue': props.readOnly
          ? undefined
          : (val: string) => {
              const found = props.items.find((i) => i.id === val)
              const updated = props.lines.map((l, idx) =>
                idx === row.index
                  ? {
                      ...l,
                      item_code: found ? found.code : val,
                      description: found ? found.name : l.description,
                      unit_cost: found && found.unit_cost != null ? found.unit_cost : l.unit_cost,
                    }
                  : l,
              )
              emit('update:lines', updated)
            },
      }),
    meta: { editable: !props.readOnly },
  },
  {
    id: 'description',
    header: 'Description',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        modelValue: row.original.description,
        disabled: props.readOnly,
        class: 'w-full',
        onClick: (e: Event) => e.stopPropagation(),
        'onUpdate:modelValue': props.readOnly
          ? undefined
          : (val: string) => {
              const updated = props.lines.map((l, idx) =>
                idx === row.index ? { ...l, description: val } : l,
              )
              emit('update:lines', updated)
            },
      }),
  },
  {
    id: 'job_id',
    header: 'Job',
    cell: ({ row }: DataTableRowContext) =>
      h(JobSelect, {
        modelValue: row.original.job_id || '',
        required: false,
        placeholder: 'Select Job (Optional)',
        jobs: props.jobs,
        disabled: props.jobsReadOnly ?? props.readOnly,
        'onUpdate:modelValue':
          (props.jobsReadOnly ?? props.readOnly)
            ? undefined
            : (val: string) => {
                const updated = props.lines.map((l, idx) =>
                  idx === row.index ? { ...l, job_id: val || undefined } : l,
                )
                emit('update:lines', updated)
              },
        onJobSelected:
          (props.jobsReadOnly ?? props.readOnly)
            ? undefined
            : (job: { id: string; job_number: string; name: string; client_name: string }) => {
                if (job) {
                  const updated = props.lines.map((l, idx) =>
                    idx === row.index
                      ? {
                          ...l,
                          job_id: job.id,
                          job_number: job.job_number,
                          job_name: job.name,
                          client_name: job.client_name,
                        }
                      : l,
                  )
                  emit('update:lines', updated)
                }
              },
      }),
    meta: { editable: !(props.jobsReadOnly ?? props.readOnly) },
  },
  {
    id: 'quantity',
    header: 'Qty',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '1',
        min: '0',
        modelValue: row.original.quantity,
        disabled: props.readOnly,
        class: 'w-20 text-right',
        onClick: (e: Event) => e.stopPropagation(),
        'onUpdate:modelValue': props.readOnly
          ? undefined
          : (val: string | number) => {
              const num = Number(val)
              if (!Number.isNaN(num)) {
                const updated = props.lines.map((l, idx) =>
                  idx === row.index ? { ...l, quantity: num } : l,
                )
                emit('update:lines', updated)
              }
            },
      }),
  },
  {
    id: 'unit_cost',
    header: 'Unit Cost',
    cell: ({ row }: DataTableRowContext) =>
      h(Input, {
        type: 'number',
        step: '0.01',
        min: '0',
        modelValue: row.original.unit_cost ?? '',
        disabled: !!row.original.item_code || row.original.price_tbc || props.readOnly,
        class: 'w-24 text-right',
        onClick: (e: Event) => e.stopPropagation(),
        'onUpdate:modelValue': props.readOnly
          ? undefined
          : (val: string | number) => {
              const cost = val === '' ? null : Number(val)
              const updated = props.lines.map((l, idx) =>
                idx === row.index ? { ...l, unit_cost: cost } : l,
              )
              emit('update:lines', updated)
            },
      }),
  },
  {
    id: 'price_tbc',
    header: 'Price TBC',
    cell: ({ row }: DataTableRowContext) =>
      h(Checkbox, {
        modelValue: row.original.price_tbc,
        disabled:
          (row.original.unit_cost !== null && Number(row.original.unit_cost) > 0) || props.readOnly,
        'onUpdate:modelValue': props.readOnly
          ? undefined
          : (checked: boolean) => {
              const updated = props.lines.map((l, idx) =>
                idx === row.index ? { ...l, price_tbc: checked } : l,
              )
              emit('update:lines', updated)
            },
        class: 'mx-auto',
      }),
    meta: { editable: !props.readOnly },
  },
  {
    id: 'additional_fields',
    header: 'Additional Fields',
    cell: ({ row }: DataTableRowContext) => {
      const hasAdditionalData = !!(
        row.original.metal_type ||
        row.original.alloy ||
        row.original.specifics ||
        row.original.location ||
        row.original.dimensions
      )

      return h(
        Button,
        {
          variant: hasAdditionalData ? 'default' : 'outline',
          size: 'sm',
          disabled: props.readOnly,
          onClick: props.readOnly ? undefined : () => openAdditionalFieldsModal(row.index),
        },
        () => [h(Settings2, { class: 'w-4 h-4 mr-1' }), hasAdditionalData ? 'Edit' : 'Add'],
      )
    },
    meta: { editable: !props.readOnly },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: DataTableRowContext) =>
      h(
        Button,
        {
          variant: 'destructive',
          size: 'icon',
          disabled: props.readOnly,
          onClick: props.readOnly
            ? undefined
            : () => {
                if (row.original.id) {
                  emit('delete-line', row.original.id)
                } else {
                  emit('delete-line', row.index)
                }
              },
        },
        () => h(Trash2, { class: 'w-4 h-4' }),
      ),
    meta: { editable: !props.readOnly },
  },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto max-h-[60vh]">
      <DataTable
        :columns="columns"
        :data="props.lines"
        @rowClick="() => {}"
        :page-size="1000"
        :hide-footer="true"
      />
    </div>
    <div class="sticky bottom-0 bg-white z-10 p-2 border-t">
      <Button class="w-full" :disabled="readOnly" @click="handleAddLine"> ＋ Add line </Button>
    </div>

    <!-- Additional Fields Modal using Dialog component -->
    <Dialog v-model:open="showAdditionalFieldsModal">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Additional Fields</DialogTitle>
          <DialogDescription>
            Fill in additional details for this purchase order line.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- Metal Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Metal Type </label>
            <select
              v-model="additionalFields.metal_type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select metal type...</option>
              <option v-for="option in metalTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Alloy -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Alloy </label>
            <Input v-model="additionalFields.alloy" type="text" placeholder="e.g., 304, 6061" />
          </div>

          <!-- Specifics -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Specifics </label>
            <Input
              v-model="additionalFields.specifics"
              type="text"
              placeholder="e.g., m8 countersunk socket screw"
            />
          </div>

          <!-- Location -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Location </label>
            <Input
              v-model="additionalFields.location"
              type="text"
              placeholder="Where this item will be stored"
            />
          </div>

          <!-- Dimensions -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Dimensions </label>
            <Input
              v-model="additionalFields.dimensions"
              type="text"
              placeholder="Product dimensions"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <Button variant="outline" @click="closeAdditionalFieldsModal"> Cancel </Button>
          <Button @click="saveAdditionalFields"> Save </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
