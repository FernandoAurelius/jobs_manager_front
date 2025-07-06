export interface PurchaseOrderLine {
  id: string
  po_id: string
  part_no: string
  description: string
  metal_type: string
  alloy: string
  specifics: string
  location: string
  qty_ordered: number
  qty_received: number
  job_id?: string
  retail_rate?: number
}

export interface DeliveryAllocation {
  job_id: string | null
  stock_location: string | null
  quantity: number
  retail_rate: number
}

export interface DeliveryReceipt {
  id?: string
  purchase_order_id?: string
  date?: string
  allocations: Record<string, DeliveryAllocation[]>
}
