import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'
import { type XeroItemUI } from '@/api/local/schemas'

export const useXeroItemStore = defineStore('xeroItems', () => {
  const items = ref<XeroItemUI[]>([])
  const loading = ref(false)

  async function fetchItems() {
    loading.value = true
    try {
      const response = await api.purchasing_rest_xero_items_retrieve()
      items.value = Array.isArray(response.items) ? response.items : []
      debugLog('Xero items fetched:', items.value)
    } finally {
      loading.value = false
    }
  }

  return { items, loading, fetchItems }
})
