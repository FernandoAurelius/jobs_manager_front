import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, schemas } from '@/api/generated/api'
import { z } from 'zod'

type StockItem = z.infer<typeof schemas.StockList>
type StockConsumeRequest = z.infer<typeof schemas.StockConsumeRequest>
type StockConsumeResponse = z.infer<typeof schemas.StockConsumeResponse>
type StockCreate = z.infer<typeof schemas.StockCreate>

export { StockItem }

export const useStockStore = defineStore('stock', () => {
  const items = ref<StockItem[]>([])
  const loading = ref(false)

  async function fetchStock() {
    loading.value = true
    try {
      const response = await api.purchasing_rest_stock_retrieve()
      items.value = Array.isArray(response) ? response : [response]
    } catch (error: unknown) {
      // Handle zodios validation error and extract the actual data
      if (
        error &&
        typeof error === 'object' &&
        'cause' in error &&
        error.cause &&
        typeof error.cause === 'object' &&
        'received' in error.cause
      ) {
        try {
          // The zodios error contains the actual response data in cause.received
          const receivedData = (error.cause as { received?: unknown }).received
          if (Array.isArray(receivedData)) {
            // Validate each item in the array individually
            const validatedItems = receivedData.map((item) => schemas.StockList.parse(item))
            items.value = validatedItems
            return
          }
        } catch (parseError) {
          console.error('Error parsing stock data:', parseError)
        }
      }

      console.error('Error fetching stock:', error)
      items.value = []
    } finally {
      loading.value = false
    }
  }

  async function consumeStock(
    id: string,
    payload: { job_id: string; quantity: number },
  ): Promise<StockConsumeResponse> {
    // Convert quantity to string as required by the backend schema
    const consumePayload: StockConsumeRequest = {
      job_id: payload.job_id,
      quantity: payload.quantity.toString(),
    }
    return await api.purchasing_rest_stock_consume_create(consumePayload, {
      params: { stock_id: id },
    })
  }

  async function create(payload: StockCreate) {
    const response = await api.purchasing_rest_stock_create(payload)
    return response
  }

  async function deactivate(id: string) {
    await api.purchasing_rest_stock_destroy({ params: { id } })
  }

  return { items, loading, fetchStock, consumeStock, create, deactivate }
})
