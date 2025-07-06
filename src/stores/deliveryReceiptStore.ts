import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import type { PurchaseOrderLine, DeliveryAllocation } from '@/types/purchasing'

export interface Job {
  id: string
  name: string
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier: string
  order_date: string
  status: string
  lines: PurchaseOrderLine[]
}

export type AllocationData = DeliveryAllocation

export interface LineAllocation {
  total_received: number
  allocations: AllocationData[]
}

export interface DeliveryReceiptData {
  [lineId: string]: LineAllocation
}

interface TransformedLineData {
  total_received: number
  job_allocation: number
  stock_allocation: number
  job_id: string | null
  retail_rate: number
}

export const useDeliveryReceiptStore = defineStore('deliveryReceipts', () => {
  const loading = ref(false)
  const stockHoldingJob = ref<Job | null>(null)
  const allocatableJobs = ref<Job[]>([])

  async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
    loading.value = true
    try {
      const res = await api.get(`/purchasing/rest/purchase-orders/${id}/`)
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchJobs(): Promise<{ stockHolding: Job; allocatable: Job[] }> {
    const res = await api.get('/job/api/jobs/fetch-all/')
    const data = res.data

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch jobs')
    }

    // Get both active and archived jobs to find special jobs like Worker Admin
    const allJobs = [...(data.active_jobs || []), ...(data.archived_jobs || [])]

    // Find stock holding job (Worker Admin) - it might be marked as special
    const stockHolding = allJobs.find((job: Job) => job.name === 'Worker Admin')
    if (!stockHolding) {
      throw new Error('Stock holding job (Worker Admin) not found')
    }

    // For allocatable jobs, use only active jobs and exclude the stock holding job
    const allocatable = (data.active_jobs || []).filter((job: Job) => job.id !== stockHolding.id)

    stockHoldingJob.value = stockHolding
    allocatableJobs.value = allocatable

    return { stockHolding, allocatable }
  }

  async function submitDeliveryReceipt(
    purchaseOrderId: string,
    receiptData: DeliveryReceiptData,
  ): Promise<void> {
    loading.value = true
    try {
      // Transform data to match backend format
      const transformedData: { [lineId: string]: TransformedLineData } = {}

      for (const [lineId, allocation] of Object.entries(receiptData)) {
        const lineData: TransformedLineData = {
          total_received: allocation.total_received,
          job_allocation: 0,
          stock_allocation: 0,
          job_id: null,
          retail_rate: 20, // Default retail rate
        }

        // Process allocations
        for (const alloc of allocation.allocations) {
          if (alloc.job_id === stockHoldingJob.value?.id) {
            // Stock allocation
            lineData.stock_allocation = alloc.quantity
            lineData.retail_rate = alloc.retail_rate
          } else {
            // Job allocation
            lineData.job_allocation = alloc.quantity
            lineData.job_id = alloc.job_id
            lineData.retail_rate = alloc.retail_rate
          }
        }

        transformedData[lineId] = lineData
      }

      const formData = new FormData()
      formData.append('received_quantities', JSON.stringify(transformedData))

      await api.post(`/purchasing/delivery-receipt/${purchaseOrderId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    stockHoldingJob,
    allocatableJobs,
    fetchPurchaseOrder,
    fetchJobs,
    submitDeliveryReceipt,
  }
})
