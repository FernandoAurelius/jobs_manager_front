<script lang="ts" setup>
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Check,
  AlertCircle,
  UploadCloud,
  ExternalLink,
  Printer,
  Mail,
  CalendarIcon,
} from 'lucide-vue-next'
import ClientLookup from '@/components/ClientLookup.vue'
import { schemas } from '@/api/generated/api'
import { z } from 'zod'

type Status = z.infer<typeof schemas.PurchaseOrderDetailStatusEnum>
type PurchaseOrder = z.infer<typeof schemas.PurchaseOrderDetail>

defineProps<{
  po: PurchaseOrder
  isCreateMode?: boolean
  showActions?: boolean
  syncEnabled?: boolean
  supplierReadonly?: boolean
}>()

const emit = defineEmits<{
  'update:supplier': [v: string]
  'update:supplier_id': [v: string]
  'update:reference': [v: string]
  'update:expected_delivery': [v: string]
  'update:status': [v: Status]
  save: []
  'sync-xero': []
  'view-xero': []
  print: []
  email: []
}>()

function onExpectedDeliveryUpdate(value: string) {
  emit('update:expected_delivery', value)
}

function onStatusUpdate(value: Status) {
  emit('update:status', value)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const statusOptions: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted to Supplier' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'fully_received', label: 'Fully Received' },
  { value: 'deleted', label: 'Deleted' },
]
</script>

<template>
  <Card class="max-w-[420px] w-full">
    <CardHeader v-if="!isCreateMode">
      <h2 class="font-semibold">PO #{{ po.po_number }}</h2>
    </CardHeader>

    <CardContent>
      <div class="flex flex-col gap-1">
        <template v-if="po.status === 'draft'">
          <ClientLookup
            :supplier-lookup="true"
            id="supplier"
            :model-value="po.supplier"
            required
            placeholder="Search supplier…"
            @update:selected-client="(c) => emit('update:supplier', c?.name || '')"
            @update:selected-id="(id) => emit('update:supplier_id', id)"
            :label="'Supplier'"
          />
        </template>
        <template v-else>
          <Label for="supplier-readonly">Supplier</Label>
          <div class="flex items-center gap-2">
            <Input
              id="supplier-readonly"
              :model-value="po.supplier || ''"
              disabled
              class="flex-1 px-2 py-1 text-sm"
              placeholder="No supplier selected"
            />
            <span
              class="flex items-center px-1 py-0.5 rounded text-[11px] font-semibold"
              :class="
                po.supplier_has_xero_id
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              "
            >
              Xero
              <component :is="po.supplier_has_xero_id ? Check : AlertCircle" class="w-3 h-3 ml-1" />
            </span>
          </div>
        </template>
      </div>

      <div class="flex flex-col gap-1 mt-4">
        <Label for="reference">Reference</Label>
        <Input
          id="reference"
          :model-value="po.reference"
          @update:model-value="emit('update:reference', $event)"
          class="w-full"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Order Date</label>
            <Button variant="outline" class="justify-start font-normal w-full bg-gray-50" disabled>
              <CalendarIcon class="mr-2 h-4 w-4" />
              {{ formatDate(po.order_date) || 'Today' }}
            </Button>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <DatePicker
            label="Expected Delivery"
            :modelValue="po.expected_delivery"
            @update:modelValue="onExpectedDeliveryUpdate"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2 mt-4" v-if="!isCreateMode">
        <Label for="status">Status</Label>
        <Select id="status" :modelValue="po.status" @update:modelValue="onStatusUpdate">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>

    <CardFooter v-if="!isCreateMode" class="flex flex-col gap-2">
      <!-- First row: Save changes -->
      <div class="flex justify-center">
        <Button @click="$emit('save')" type="button">Save changes</Button>
      </div>

      <!-- Second row: Sync with Xero (only if showActions is true) -->
      <div v-if="showActions" class="flex justify-start">
        <Button
          variant="default"
          :disabled="!syncEnabled"
          @click="$emit('sync-xero')"
          aria-label="Sync with Xero"
        >
          <UploadCloud class="mr-2 h-4 w-4" /> Sync with Xero
        </Button>
      </div>

      <!-- Third row: View, Print, Email (only show if View in Xero is available and showActions is true) -->
      <div v-if="showActions && po.online_url" class="flex flex-wrap gap-2">
        <Button variant="outline" @click="$emit('view-xero')" aria-label="View in Xero">
          <ExternalLink class="mr-2 h-4 w-4" /> View in Xero
        </Button>

        <Button variant="outline" aria-label="Print" @click="$emit('print')">
          <Printer class="mr-2 h-4 w-4" /> Print
        </Button>

        <Button variant="outline" aria-label="E-mail" @click="$emit('email')">
          <Mail class="mr-2 h-4 w-4" /> E-mail
        </Button>
      </div>

      <!-- Fallback: Print and Email only (when no Xero URL but showActions is true) -->
      <div v-else-if="showActions" class="flex flex-wrap gap-2">
        <Button variant="outline" aria-label="Print" @click="$emit('print')">
          <Printer class="mr-2 h-4 w-4" /> Print
        </Button>

        <Button variant="outline" aria-label="E-mail" @click="$emit('email')">
          <Mail class="mr-2 h-4 w-4" /> E-mail
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>
