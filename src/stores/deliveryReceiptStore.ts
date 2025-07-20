import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, schemas } from '@/api/generated/api'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import { debugLog } from '@/utils/debug'
import type { z } from 'zod'

type Job = z.infer<typeof schemas.JobForPurchasing>
type PurchaseOrderDetail = z.infer<typeof schemas.PurchaseOrderDetail>
type DeliveryReceiptRequest = z.infer<typeof schemas.DeliveryReceiptRequest>
type AllJobsResponse = z.infer<typeof schemas.AllJobsResponse>
type PurchaseOrderAllocationsResponse = z.infer<typeof schemas.PurchaseOrderAllocationsResponse>

// Extended Job type for delivery receipt functionality
type ExtendedJob = Job & {
  is_stock_holding?: boolean
  status?: string
}

export const useDeliveryReceiptStore = defineStore('deliveryReceipts', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stockHoldingJob = ref<Job | null>(null)
  const allocatableJobs = ref<Job[]>([])

  function getDefaultRetailRate(): number {
    const companyDefaultsStore = useCompanyDefaultsStore()
    const materialsMarkup = companyDefaultsStore.companyDefaults?.materials_markup

    if (materialsMarkup !== undefined && materialsMarkup !== null) {
      return materialsMarkup * 100
    }

    return 0
  }

  async function fetchPurchaseOrder(id: string): Promise<PurchaseOrderDetail> {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    loading.value = true
    error.value = null

    try {
      const response = await api.retrievePurchaseOrder({ params: { id } })
      return response
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to fetch purchase order ${id}`)
      error.value = errorMessage
      debugLog(`Error fetching purchase order ${id}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function fetchJobs(): Promise<{ stockHolding: Job; allocatable: Job[] }> {
    error.value = null

    try {
      const response = await api.purchasing_rest_all_jobs_retrieve()
      const data = response as AllJobsResponse

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      const allJobs = data.jobs || []

      const stockHolding = allJobs.find((job: ExtendedJob) => job.is_stock_holding)
      if (!stockHolding) {
        throw new Error('Stock holding job not found')
      }

      const allocatable = allJobs.filter(
        (job: ExtendedJob) =>
          !job.is_stock_holding &&
          !['rejected', 'archived', 'completed', 'special'].includes(job.status || ''),
      )

      stockHoldingJob.value = stockHolding
      allocatableJobs.value = allocatable

      return { stockHolding, allocatable }
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch jobs')
      error.value = errorMessage
      debugLog('Error fetching jobs:', err)
      throw new Error(errorMessage)
    }
  }

  async function submitDeliveryReceipt(
    purchaseOrderId: string,
    receiptData: DeliveryReceiptRequest['allocations'],
  ): Promise<void> {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required')
    }

    if (!receiptData || Object.keys(receiptData).length === 0) {
      throw new Error('Receipt data is required')
    }

    loading.value = true
    error.value = null

    try {
      const payload: DeliveryReceiptRequest = {
        purchase_order_id: purchaseOrderId,
        allocations: receiptData,
      }

      await api.purchasing_rest_delivery_receipts_create(payload)
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        `Failed to submit delivery receipt for PO ${purchaseOrderId}`,
      )
      error.value = errorMessage
      debugLog(`Error submitting delivery receipt for PO ${purchaseOrderId}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function fetchExistingAllocations(
    purchaseOrderId: string,
  ): Promise<PurchaseOrderAllocationsResponse> {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required')
    }

    loading.value = true
    error.value = null

    try {
      debugLog(`🔍 Fetching existing allocations for PO: ${purchaseOrderId}`)
      const response = await api.purchasing_rest_purchase_orders_allocations_retrieve({
        params: { po_id: purchaseOrderId },
      })
      debugLog('📦 Existing allocations response:', response)
      return response
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        `Failed to fetch existing allocations for PO ${purchaseOrderId}`,
      )
      error.value = errorMessage
      debugLog(`❌ Error fetching existing allocations for PO ${purchaseOrderId}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  function handleApiError(err: unknown, defaultMessage: string): string {
    if (!err) return defaultMessage

    if (typeof err === 'object' && 'response' in err) {
      const axiosError = err as {
        response?: { status?: number; data?: { error?: string; message?: string } }
      }

      if (axiosError.response?.status === 404) {
        return 'Resource not found'
      }

      if (axiosError.response?.status === 403) {
        return 'Access denied'
      }

      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error
      }

      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message
      }
    }

    if (err instanceof Error) {
      return err.message
    }

    return defaultMessage
  }

  return {
    loading,
    error,
    stockHoldingJob,
    allocatableJobs,
    fetchPurchaseOrder,
    fetchJobs,
    submitDeliveryReceipt,
    getDefaultRetailRate,
    fetchExistingAllocations,
  }
})
