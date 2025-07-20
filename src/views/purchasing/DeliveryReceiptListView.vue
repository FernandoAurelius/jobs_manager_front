<template>
  <AppLayout>
    <div class="p-4 md:p-8 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Package class="w-6 h-6 text-indigo-600" /> Delivery Receipts
        </h1>
      </div>
      <div class="overflow-x-auto overflow-y-auto max-h-[67vh] rounded-2xl shadow-lg border">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th class="p-3 text-left font-semibold">PO #</th>
              <th class="p-3 text-left font-semibold">Supplier</th>
              <th class="p-3 text-left font-semibold">Date</th>
              <th class="p-3 text-left font-semibold">Status</th>
              <th class="p-3 w-24 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="5" class="p-8 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  Delivery receipts are still loading, please wait
                </div>
              </td>
            </tr>
            <tr v-else-if="pagedReceipts.length === 0">
              <td colspan="5" class="p-8 text-center text-gray-500">No delivery receipts found</td>
            </tr>
            <tr
              v-else
              v-for="receipt in pagedReceipts"
              :key="receipt.id"
              class="border-b hover:bg-slate-50"
            >
              <td class="p-3">{{ receipt.po_number }}</td>
              <td class="p-3">{{ receipt.supplier }}</td>
              <td class="p-3">{{ formatDate(receipt.order_date) }}</td>
              <td class="p-3">{{ formatStatus(receipt.status) }}</td>
              <td class="p-3 flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  @click="editReceipt(receipt.id)"
                  class="w-8 h-8 p-0"
                  aria-label="Edit Delivery Receipt"
                >
                  <Edit class="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  @click="deleteReceipt(receipt.id)"
                  class="w-8 h-8 p-0"
                  aria-label="Delete Receipt"
                >
                  <Trash2 class="w-4 h-4 text-red-500" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-center mt-2">
        <Pagination
          :page="page"
          :total="totalPages"
          @update:page="page = $event"
          class="space-x-2"
          btn-class="px-3 py-1 rounded-lg border bg-white hover:bg-slate-100 text-sm font-medium"
          active-btn-class="bg-indigo-600 text-white border-indigo-600"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import AppLayout from '@/components/AppLayout.vue'
import { Package, Edit, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { onMounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Pagination from '@/components/ui/pagination/Pagination.vue'
import { api } from '../../api/generated/api'

// Import types from generated API schemas
import type { PurchaseOrderList } from '@/api/generated/api'

// Use PurchaseOrderList as it contains the same fields needed for receipt listing
type Receipt = PurchaseOrderList

const isLoading = ref(true)
const receipts = ref<Receipt[]>([])
const router = useRouter()

const page = ref(1)
const pageSize = 25

const totalPages = computed(() => Math.max(1, Math.ceil(receipts.value.length / pageSize)))

const pagedReceipts = computed(() => {
  const start = (page.value - 1) * pageSize
  return receipts.value.slice(start, start + pageSize)
})

watch(
  () => receipts.value.length,
  () => {
    if (page.value > totalPages.value) page.value = 1
  },
)

const formatStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'submitted':
      return 'Submitted to Supplier'
    case 'partially_received':
      return 'Partially Received'
    case 'fully_received':
      return 'Fully Received'
    case 'deleted':
      return 'Deleted'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const editReceipt = (id: string) => {
  router.push({ name: 'delivery-receipt-form', params: { poId: id } })
}

const deleteReceipt = (id: string) => {
  debugLog('Delete receipt:', id)
}

onMounted(async () => {
  try {
    isLoading.value = true
    const response = await api.listPurchaseOrders({
      queries: { status: 'submitted,partially_received' },
    })
    receipts.value = response || []
  } catch (error) {
    console.error('Error loading delivery receipts:', error)
    receipts.value = []
  } finally {
    isLoading.value = false
  }
})
</script>
