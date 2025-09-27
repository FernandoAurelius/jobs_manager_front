import { defineStore } from 'pinia'
import { ref } from 'vue'
import { schemas } from '@/api/generated/api'
import { api } from '@/api/client'
import { z } from 'zod'

type StockItem = z.infer<typeof schemas.StockItem>
type StockConsumeRequest = z.infer<typeof schemas.StockConsumeRequest>
type StockConsumeResponse = z.infer<typeof schemas.StockConsumeResponse>
type StockCreate = z.infer<typeof schemas.StockCreate>

export { StockItem }

// Narrow Zodios error shape where response is available at error.cause.received
type ZodiosErrorWithReceived = { cause?: { received?: unknown } }
function hasReceivedPayload(err: unknown): err is ZodiosErrorWithReceived {
  if (!err || typeof err !== 'object') return false
  const cause = (err as Record<string, unknown>).cause
  if (!cause || typeof cause !== 'object') return false
  return 'received' in cause
}

export const useStockStore = defineStore('stock', () => {
  const items = ref<StockItem[]>([])
  const loading = ref(false)
  let inFlight: Promise<StockItem[]> | null = null
  type StockFetchOptions = { signal?: AbortSignal; timeout?: number; force?: boolean }

  // Single internal fetch routine used by both public methods
  function startStockFetch({ signal, timeout }: { signal?: AbortSignal; timeout?: number }) {
    return (async () => {
      try {
        const response = await api.purchasing_rest_stock_retrieve({ signal, timeout })
        items.value = response.items || []
        return items.value
      } catch (error: unknown) {
        // Handle zodios validation error and extract the actual data
        if (hasReceivedPayload(error)) {
          try {
            const receivedData = error.cause?.received
            if (receivedData && typeof receivedData === 'object' && 'items' in receivedData) {
              const stockList = schemas.StockList.parse(receivedData)
              items.value = stockList.items || []
              return items.value
            }
          } catch (parseError) {
            console.error('Error parsing stock data:', parseError)
          }
        }
        // Re-throw so callers can decide whether to swallow
        throw error
      } finally {
        loading.value = false
        queueMicrotask(() => {
          inFlight = null
        })
      }
    })()
  }

  async function fetchStock(force = false): Promise<StockItem[]> {
    // Return existing in-flight promise if one exists (unless forcing)
    if (loading.value && inFlight && !force) return inFlight

    // Early return if already have data and not forcing
    if (!force && items.value.length > 0) return items.value

    loading.value = true
    inFlight = startStockFetch({})

    return inFlight
  }

  // Non-blocking, abortable, one-shot fetch suitable for background refreshes
  function fetchStockSafe(options: StockFetchOptions = {}): Promise<StockItem[] | void> {
    const { signal, timeout, force = false } = options

    // If a request is already in-flight and not forcing, return it
    if (inFlight && !force) return inFlight

    // If we already have data and not forcing, resolve immediately
    if (!force && items.value.length > 0) return Promise.resolve(items.value)

    loading.value = true
    inFlight = startStockFetch({ signal, timeout })
    // Swallow rejections to remain non-blocking
    return inFlight.catch((error) => {
      console.warn('fetchStockSafe: background stock fetch failed (non-blocking):', error)
    })
  }

  async function consumeStock(
    id: string,
    payload: { job_id: string; quantity: number },
  ): Promise<StockConsumeResponse> {
    const consumePayload: StockConsumeRequest = {
      job_id: payload.job_id,
      quantity: payload.quantity,
    }
    return await api.consumeStock(consumePayload, {
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

  return { items, loading, fetchStock, fetchStockSafe, consumeStock, create, deactivate }
})
