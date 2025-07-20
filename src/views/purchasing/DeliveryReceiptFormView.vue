<template>
  <AppLayout>
    <div class="p-4 md:p-8 flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Package class="w-6 h-6 text-indigo-600" />
          Delivery Receipt - Purchase Order {{ purchaseOrder?.po_number || 'Loading...' }}
        </h1>
        <div class="flex gap-2">
          <Button variant="outline" @click="goBack">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="text-gray-600">Loading purchase order...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
        <Button @click="loadData" class="mt-2" variant="outline" size="sm"> Try Again </Button>
      </div>

      <!-- Company Configuration Warning -->
      <div
        v-else-if="purchaseOrder && !isCompanyConfigured"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
      >
        <div class="flex items-center">
          <AlertCircle class="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
          <div>
            <p class="text-yellow-800 font-medium">Company Configuration Required</p>
            <p class="text-yellow-700 text-sm mt-1">
              Company materials markup is not configured. Retail rates will default to 0%. Please
              contact your administrator to configure company defaults.
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="purchaseOrder" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Left Column: PO Summary -->
        <div class="space-y-6">
          <Card class="h-fit">
            <CardHeader class="pb-4">
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-lg">Purchase Order Details</h2>
                <div class="flex items-center gap-2">
                  <component
                    :is="getStatusIcon(purchaseOrder.status)"
                    :class="getStatusIconClass(purchaseOrder.status)"
                  />
                  <span
                    :class="getStatusClass(purchaseOrder.status)"
                    class="px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {{ formatStatus(purchaseOrder.status) }}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <Building2 class="w-4 h-4 text-gray-500" />
                    <span class="font-medium text-gray-600">Supplier</span>
                  </div>
                  <div class="text-lg font-semibold">{{ purchaseOrder.supplier }}</div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-gray-500" />
                    <span class="font-medium text-gray-600">Order Date</span>
                  </div>
                  <div class="text-lg">{{ formatDate(purchaseOrder.order_date) }}</div>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4 text-gray-500" />
                    <span class="font-medium text-gray-600">PO Number</span>
                  </div>
                  <div class="text-lg font-mono">{{ purchaseOrder.po_number }}</div>
                </div>
              </div>

              <!-- Summary Statistics -->
              <div class="mt-6 pt-4 border-t">
                <div class="grid grid-cols-3 gap-3">
                  <div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div class="text-xl font-bold text-blue-600">
                      {{ purchaseOrder.lines.length }}
                    </div>
                    <div class="text-xs text-gray-600 mt-1">Line Items</div>
                  </div>
                  <div class="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <div class="text-xl font-bold text-green-600">{{ getTotalOrdered() }}</div>
                    <div class="text-xs text-gray-600 mt-1">Total Ordered</div>
                  </div>
                  <div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div class="text-xl font-bold text-purple-600">{{ getTotalReceived() }}</div>
                    <div class="text-xs text-gray-600 mt-1">Previously Received</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Actions Card -->
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <Button @click="goBack" variant="outline" size="sm">
                    <ArrowLeft class="w-4 h-4 mr-2" />
                    Close
                  </Button>

                  <Button
                    v-if="hasExistingAllocations"
                    @click="showPreviousAllocationsModal = true"
                    variant="outline"
                    size="sm"
                  >
                    <History class="w-4 h-4 mr-2" />
                    Previous Allocations
                  </Button>
                </div>

                <Button @click="saveChanges" :disabled="!hasChanges || isSaving" size="sm">
                  <div v-if="isSaving" class="flex items-center gap-2">
                    <div
                      class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></div>
                    <span>Saving...</span>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <Save class="w-4 h-4" />
                    <span>Save Receipt</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Column: Line Items Table -->
        <div class="space-y-6">
          <Card class="flex flex-col">
            <CardHeader>
              <h2 class="font-semibold text-lg">New Delivery Receipt</h2>
              <p class="text-sm text-gray-600">
                Specify quantities received and allocate to jobs or stock locations
              </p>
            </CardHeader>
            <CardContent class="flex-1 p-0">
              <div class="px-6 pb-6">
                <DeliveryReceiptLinesTable
                  :lines="purchaseOrder.lines"
                  :jobs="availableJobs"
                  :allocations="allocations"
                  :existing-allocations="existingAllocations"
                  @update:allocations="allocations = $event"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Previous Allocations Modal -->
    <Dialog
      :open="showPreviousAllocationsModal"
      @update:open="
        (open) => {
          showPreviousAllocationsModal = open
        }
      "
    >
      <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <History class="w-5 h-5" />
            Previous Allocations
          </DialogTitle>
        </DialogHeader>

        <div class="py-4">
          <ExistingAllocationsDisplay
            :existing-allocations="existingAllocations"
            :lines="purchaseOrder?.lines || []"
          />
        </div>
      </DialogContent>
    </Dialog>
  </AppLayout>
</template>
<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AppLayout from '@/components/AppLayout.vue'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DeliveryReceiptLinesTable from '@/components/purchasing/DeliveryReceiptLinesTable.vue'
import ExistingAllocationsDisplay from '@/components/purchasing/ExistingAllocationsDisplay.vue'
import {
  Package,
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Clock,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Save,
  History,
} from 'lucide-vue-next'
import { useDeliveryReceiptStore } from '@/stores/deliveryReceiptStore'
import { schemas } from '@/api/generated/api'
import type { DeliveryAllocationUI } from '@/api/local/schemas.ts'
import { transformDeliveryReceiptForAPI } from '@/api/local/schemas.ts'
import type { z } from 'zod'

// Import types from generated API schemas
type PurchaseOrder = z.infer<typeof schemas.PurchaseOrderDetail>
type ExistingAllocation = z.infer<typeof schemas.DeliveryReceiptLine>

const route = useRoute()
const router = useRouter()
const deliveryReceiptStore = useDeliveryReceiptStore()

const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const purchaseOrder = ref<PurchaseOrder | null>(null)
const allocations = ref<Record<string, DeliveryAllocationUI[]>>({})
const existingAllocations = ref<Record<string, ExistingAllocation[]>>({})
const showPreviousAllocationsModal = ref(false)

const availableJobs = computed(() => {
  const allocatable = deliveryReceiptStore.allocatableJobs || []
  const stockHolding = deliveryReceiptStore.stockHoldingJob

  return stockHolding ? [stockHolding, ...allocatable] : allocatable
})

const hasChanges = computed(() => {
  return Object.keys(allocations.value).some(
    (lineId) =>
      allocations.value[lineId].length > 0 &&
      allocations.value[lineId].some((alloc) => alloc.quantity > 0),
  )
})

const hasExistingAllocations = computed(() => {
  const hasKeys = Object.keys(existingAllocations.value).length > 0
  const hasData = Object.values(existingAllocations.value).some(
    (allocations) => allocations && allocations.length > 0,
  )
  return hasKeys && hasData
})

const isCompanyConfigured = computed(() => {
  const defaultRate = deliveryReceiptStore.getDefaultRetailRate()
  return defaultRate > 0
})

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'draft':
      return FileText
    case 'sent':
      return Truck
    case 'confirmed':
      return CheckCircle
    case 'partially_received':
      return Clock
    case 'received':
      return CheckCircle
    case 'cancelled':
      return XCircle
    default:
      return AlertCircle
  }
}

function getStatusIconClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'w-5 h-5 text-gray-500'
    case 'sent':
      return 'w-5 h-5 text-blue-500'
    case 'confirmed':
      return 'w-5 h-5 text-green-500'
    case 'partially_received':
      return 'w-5 h-5 text-yellow-500'
    case 'received':
      return 'w-5 h-5 text-green-600'
    case 'cancelled':
      return 'w-5 h-5 text-red-500'
    default:
      return 'w-5 h-5 text-gray-400'
  }
}

function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'partially_received':
      return 'bg-yellow-100 text-yellow-800'
    case 'received':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getTotalOrdered(): number {
  if (!purchaseOrder.value) return 0
  return purchaseOrder.value.lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
}

function getTotalReceived(): number {
  if (!purchaseOrder.value) return 0
  return purchaseOrder.value.lines.reduce(
    (sum, line) => sum + (Number(line.received_quantity) || 0),
    0,
  )
}

function goBack() {
  router.push({ name: 'delivery-receipts' })
}

async function saveChanges() {
  if (!purchaseOrder.value) return

  const hasChanges = Object.keys(allocations.value).some(
    (lineId) =>
      allocations.value[lineId].length > 0 &&
      allocations.value[lineId].some((alloc) => alloc.quantity > 0),
  )

  if (!hasChanges) {
    toast.error('No changes to save')
    return
  }

  isSaving.value = true

  try {
    // Use transformation function to convert UI data to backend format
    const deliveryReceiptData = transformDeliveryReceiptForAPI(
      purchaseOrder.value.id,
      allocations.value,
      deliveryReceiptStore.getDefaultRetailRate(),
    )

    await deliveryReceiptStore.submitDeliveryReceipt(
      purchaseOrder.value.id,
      deliveryReceiptData.allocations,
    )
    toast.success('Delivery receipt saved successfully!')

    await loadData()

    const clearedAllocations: Record<string, DeliveryAllocationUI[]> = {}
    purchaseOrder.value.lines.forEach((line) => {
      clearedAllocations[line.id] = []
    })
    allocations.value = clearedAllocations
  } catch (err) {
    const errorMsg =
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'error' in err.response.data
        ? (err.response.data.error as string)
        : 'Failed to save delivery receipt'
    debugLog('Error saving delivery receipt:', err)
    toast.error(errorMsg)
  } finally {
    isSaving.value = false
  }
}

async function loadData() {
  const poId = route.params.poId as string
  if (!poId) {
    error.value = 'Purchase Order ID is required'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const [po, , existingAllocationsData] = await Promise.all([
      deliveryReceiptStore.fetchPurchaseOrder(poId),
      deliveryReceiptStore.fetchJobs(),
      deliveryReceiptStore.fetchExistingAllocations(poId).catch(() => ({ allocations: {} })),
    ])

    purchaseOrder.value = po
    existingAllocations.value = existingAllocationsData.allocations || {}

    const initialAllocations: Record<string, DeliveryAllocationUI[]> = {}
    po.lines.forEach((line) => {
      initialAllocations[line.id] = []
    })
    allocations.value = initialAllocations
  } catch (err) {
    const errorMsg =
      err &&
      typeof err === 'object' &&
      'response' in err &&
      err.response &&
      typeof err.response === 'object' &&
      'data' in err.response &&
      err.response.data &&
      typeof err.response.data === 'object' &&
      'error' in err.response.data
        ? (err.response.data.error as string)
        : 'Failed to load purchase order'
    debugLog('Error loading data:', err)
    error.value = errorMsg
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
