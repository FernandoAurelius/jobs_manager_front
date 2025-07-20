import { ref, computed, type Ref } from 'vue'
import type {
  GridApi,
  ColDef,
  CellValueChangedEvent,
  GridOptions,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community'
import { customTheme } from '@/plugins/ag-grid'
import type { PurchaseOrderLineUI } from '@/api/local/schemas'
import { PoLineJobCellEditor } from '@/components/purchasing/PoLineJobCellEditor'

export function usePurchaseOrderGrid(lines: Ref<PurchaseOrderLineUI[]>) {
  const gridApi = ref<GridApi | null>(null)

  const columnDefs = ref<ColDef<PurchaseOrderLineUI>[]>([
    {
      headerName: 'Job',
      field: 'job_number',
      width: 120,
      editable: true,
      cellEditor: PoLineJobCellEditor,
      cellEditorPopup: true,
      cellRenderer: (params: ICellRendererParams) => {
        const { job_number, client_name } = params.data as PurchaseOrderLineUI
        if (!job_number) return '<em style="color: #9CA3AF;">Select job...</em>'
        return `
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; color: #1F2937;">#${job_number}</span>
            <span style="font-size: 11px; color: #6B7280;">${client_name || ''}</span>
          </div>
        `
      },
    },
    {
      headerName: 'Item',
      field: 'item_name',
      flex: 1,
      minWidth: 180,
      editable: true,
    },
    {
      headerName: 'Description',
      field: 'description',
      flex: 2,
      minWidth: 250,
      editable: true,
    },
    {
      headerName: 'Qty',
      field: 'quantity',
      width: 80,
      editable: true,
      type: 'numericColumn',
    },
    {
      headerName: 'Unit Price',
      field: 'unit_price',
      width: 120,
      editable: true,
      type: 'numericColumn',
      valueFormatter: (params: ValueFormatterParams) => `$${(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: 'Total',
      field: 'total_price',
      width: 120,
      type: 'numericColumn',
      valueGetter: (params) => {
        const data = params.data as PurchaseOrderLineUI
        return (data.quantity || 0) * (data.unit_price || 0)
      },
      valueFormatter: (params: ValueFormatterParams) => `$${(params.value || 0).toFixed(2)}`,
      editable: false,
    },
    {
      headerName: 'Actions',
      width: 80,
      cellRenderer: (params: ICellRendererParams) => {
        return `<button class="delete-row-btn" data-node-id="${params.node.id}">🗑️</button>`
      },
      editable: false,
      sortable: false,
      filter: false,
    },
  ])

  const gridOptions = computed<GridOptions<PurchaseOrderLineUI>>(() => ({
    theme: customTheme,
    columnDefs: columnDefs.value,
    rowData: lines.value,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
    },
    rowHeight: 48,
    headerHeight: 44,
    animateRows: true,
    onCellValueChanged: (event: CellValueChangedEvent) => {
      if (event.colDef.field === 'quantity' || event.colDef.field === 'unit_price') {
        event.api.refreshCells({ rowNodes: [event.node], columns: ['total_price'] })
      }
    },
    onGridReady: (params) => {
      gridApi.value = params.api
      params.api.sizeColumnsToFit()
    },
    onCellClicked: (params) => {
      if (params.event) {
        const target = params.event.target as HTMLElement
        if (target.classList.contains('delete-row-btn')) {
          const nodeId = target.getAttribute('data-node-id')
          if (nodeId) {
            const rowNode = params.api.getRowNode(nodeId)
            if (rowNode) {
              params.api.applyTransaction({ remove: [rowNode.data] })
            }
          }
        }
      }
    },
  }))

  const addLine = () => {
    const newLine: PurchaseOrderLineUI = {
      id: `temp-${Date.now()}`,
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }
    gridApi.value?.applyTransaction({ add: [newLine] })
  }

  return {
    gridOptions,
    addLine,
  }
}
