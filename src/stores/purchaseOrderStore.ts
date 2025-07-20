import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/generated/api'
import { debugLog } from '../utils/debug'
import { schemas } from '../api/generated/api'
import axios from 'axios'
import type { z } from 'zod'

// Type definitions
type PurchaseOrder = z.infer<typeof schemas.PurchaseOrderList>
type PurchaseOrderCreate = z.infer<typeof schemas.PurchaseOrderCreate>
type PurchaseOrderUpdate = z.infer<typeof schemas.PatchedPurchaseOrderUpdate>

export const usePurchaseOrderStore = defineStore('purchaseOrders', () => {
  const orders = ref<PurchaseOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchOrders() {
    loading.value = true
    error.value = null

    try {
      const response = await api.listPurchaseOrders()
      orders.value = response
    } catch (err) {
      error.value = 'Failed to fetch purchase orders'
      debugLog('Error fetching purchase orders:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: PurchaseOrderCreate) {
    error.value = null

    try {
      const response = await api.purchasing_rest_purchase_orders_create(data)
      return response
    } catch (err) {
      error.value = 'Failed to create purchase order'
      debugLog('Error creating purchase order:', err)
      throw err
    }
  }

  async function fetchOne(id: string) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      const response = await api.retrievePurchaseOrder({
        params: { id },
      })
      return response
    } catch (err) {
      error.value = `Failed to fetch purchase order ${id}`
      debugLog(`Error fetching purchase order ${id}:`, err)
      throw err
    }
  }

  async function patch(id: string, data: PurchaseOrderUpdate) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      const response = await api.purchasing_rest_purchase_orders_partial_update(data, {
        params: { id: id },
      })
      return response
    } catch (err) {
      error.value = `Failed to update purchase order ${id}`
      debugLog(`Error updating purchase order ${id}:`, err)
      throw err
    }
  }

  async function fetchPurchaseOrderPdf(id: string): Promise<Blob> {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    try {
      // First, try the standard endpoint
      const response = await axios.get(`/purchasing/api/purchase-orders/${id}/pdf/`, {
        responseType: 'blob',
      })

      return response.data
    } catch (err) {
      debugLog(`Error fetching PDF for purchase order ${id}:`, err)
      throw err
    }
  }

  async function emailPurchaseOrder(id: string) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    try {
      const response = await api.purchasing_api_purchase_orders_email_create(
        {}, // Empty body as required by the schema
        { params: { purchase_order_id: id } },
      )
      return response
    } catch (err) {
      debugLog(`Error emailing purchase order ${id}:`, err)
      throw err
    }
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    fetchOne,
    patch,
    fetchPurchaseOrderPdf,
    emailPurchaseOrder,
  }
})
