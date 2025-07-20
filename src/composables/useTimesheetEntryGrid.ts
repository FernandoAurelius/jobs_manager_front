import { ref, computed, nextTick, type Ref } from 'vue'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import type { TimesheetEntryJobSelectionItem, TimesheetEntryStaffMember } from '@/api/local/schemas'
import type {
  GridApi,
  ColDef,
  CellValueChangedEvent,
  RowDoubleClickedEvent,
  ICellRendererParams as AgICellRendererParams,
  ValueFormatterParams,
  CellClickedEvent,
  CellKeyDownEvent,
} from 'ag-grid-community'
import { customTheme } from '@/plugins/ag-grid'
import { TimesheetEntryJobCellEditor } from '@/components/timesheet/TimesheetEntryJobCellEditor'
import { useTimesheetEntryCalculations } from '@/composables/useTimesheetEntryCalculations'

type TimesheetEntryGridRowWithSaving = z.infer<typeof schemas.TimesheetCostLine> & {
  isSaving?: boolean
}

// Type aliases for compatibility with existing code
type TimesheetEntry = z.infer<typeof schemas.TimesheetCostLine>
type TimesheetEntryGridRow = z.infer<typeof schemas.TimesheetCostLine>
type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>

export function useTimesheetEntryGrid(
  companyDefaults: Ref<CompanyDefaults | null>,
  jobs: Ref<Record<string, unknown>[]>, // Add jobs parameter
  onSaveEntry: (entry: TimesheetEntry) => Promise<void>,
  onDeleteEntry: (id: number) => Promise<void>,
) {
  const gridApi = ref<GridApi | null>(null)
  const gridData = ref<TimesheetEntryGridRow[]>([])
  const loading = ref(false)
  const selectedRowIndex = ref(-1)
  const calculations = useTimesheetEntryCalculations(companyDefaults)
  const columnDefs = ref<ColDef<TimesheetEntryGridRow, unknown>[]>([
    {
      headerName: 'Job',
      field: 'jobNumber',
      width: 200,
      editable: true,
      cellEditor: TimesheetEntryJobCellEditor,
      cellEditorParams: {
        jobs: jobs,
      },
      valueFormatter: (params) => {
        if (!params.value) return ''
        const job = jobs.value?.find((j) => j.job_number === params.value)
        return job ? `#${job.job_number} - ${job.name}` : `#${params.value}`
      },
      cellStyle: {
        color: '#1F2937',
        fontWeight: '500',
      },
    },
    {
      headerName: 'Client',
      field: 'client',
      width: 140,
      editable: false,
      cellStyle: { color: '#6B7280', fontSize: '13px' },
    },
    {
      headerName: 'Job Name',
      field: 'jobName',
      flex: 1,
      minWidth: 180,
      editable: false,
      cellStyle: { color: '#374151', fontWeight: '500' },
    },
    {
      headerName: 'Hours',
      field: 'hours',
      width: 80,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 24,
        step: 0.25,
        precision: 2,
      },
      cellRenderer: (params: AgICellRendererParams) => {
        const hours = params.value || 0
        const isOvertime = hours > 8
        const color = isOvertime ? '#DC2626' : '#374151'
        const weight = isOvertime ? '600' : '400'
        return `<span style="color: ${color}; font-weight: ${weight};">${hours.toFixed(2)}h</span>`
      },
      cellClass: 'text-right',
    },
    {
      headerName: 'Billable',
      field: 'billable',
      width: 80,
      editable: true,
      cellEditor: 'agCheckboxCellEditor',
      cellRenderer: 'agCheckboxCellRenderer',
      cellClass: 'text-center',
    },
    {
      headerName: 'Description',
      field: 'description',
      flex: 2,
      minWidth: 200,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 500,
      },
    },
    {
      headerName: 'Rate',
      field: 'rate',
      width: 90,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Ord', '1.5', '2.0', 'Unpaid'],
      },
      cellRenderer: (params: AgICellRendererParams) => {
        const rate = params.value || 'Ord'
        const colors = {
          Ord: '#374151',
          '1.5': '#D97706',
          '2.0': '#DC2626',
          Unpaid: '#6B7280',
        }
        const displayText = rate === 'Ord' ? 'Ord' : rate === 'Unpaid' ? 'Unpaid' : `${rate}x`
        return `<span style="color: ${colors[rate as keyof typeof colors]}; font-weight: 500;">${displayText}</span>`
      },
    },
    {
      headerName: 'Wage',
      field: 'wage',
      width: 100,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) =>
        `$${(Number(params.value) || 0).toFixed(2)}`,
      cellClass: 'text-right',
      cellStyle: { color: '#059669', fontWeight: '600' },
    },
    {
      headerName: 'Bill',
      field: 'bill',
      width: 100,
      editable: false,
      valueFormatter: (params: ValueFormatterParams) =>
        `$${(Number(params.value) || 0).toFixed(2)}`,
      cellClass: 'text-right',
      cellStyle: { color: '#2563EB', fontWeight: '600' },
    },
    {
      headerName: 'Delete',
      width: 60,
      pinned: 'right',
      field: 'delete' as unknown as undefined,
      editable: false,
      cellRenderer: (params: AgICellRendererParams) => {
        if (!params.data || !params.data.id) return ''
        return `
          <button title='Delete this row' class='delete-row-btn' data-id='${params.data.id}'
            style='background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;width:100%;height:32px;font-size:20px;line-height:1;'
          >🗑️</button>
        `
      },
      cellStyle: { textAlign: 'center' },
      sortable: false,
      filter: false,
      resizable: false,
      onCellClicked: (params: CellClickedEvent) => {
        const rowId = params.data?.id
        if (!rowId) return
        const rowIndex = gridData.value.findIndex((row) => String(row.id) === String(rowId))
        if (rowIndex === -1) return
        deleteRow(rowIndex)
      },
    },
  ])

  const gridOptions = computed(() => ({
    theme: customTheme,
    columnDefs: columnDefs.value,
    rowData: gridData.value,
    defaultColDef: {
      sortable: true,
      filter: false,
      resizable: true,
    },
    rowHeight: 48,
    headerHeight: 44,
    animateRows: true,
    onCellValueChanged: (event: CellValueChangedEvent) => {
      handleCellValueChanged(event)
    },
    onRowDoubleClicked: handleRowDoubleClicked,
    onCellClicked: handleCellClicked,
    onCellKeyDown: handleCellKeyDown,
    getRowStyle: (params: { data?: TimesheetEntryGridRow }) => {
      if (!params.data) return undefined
      if (params.data.isNewRow) {
        return { backgroundColor: '#F0F9FF', border: '1px dashed #3B82F6' }
      }
      return undefined
    },
  }))

  async function handleCellClicked(event: CellClickedEvent): Promise<void> {
    const rowIndex = event.node.rowIndex
    const colKey = event.colDef.field
    if (colKey && event.colDef.editable && typeof rowIndex === 'number' && rowIndex >= 0) {
      event.api.startEditingCell({ rowIndex, colKey })
      event.api.setFocusedCell(rowIndex, colKey)
    }
  }

  function handleJobSelection(
    rowData: TimesheetEntryGridRow & { rowIndex: number },
    job: TimesheetEntryJobSelectionItem,
  ): void {
    const entry = createEntryFromRowData(rowData)
    const populated = calculations.populateJobFields(entry, job)
    const recalculated = calculations.recalculateEntry(populated)
    updateRowData(rowData.rowIndex, recalculated)
  }

  function isDuplicateEntry(entry: TimesheetEntry, ignoreIndex?: number): boolean {
    return (gridData.value as TimesheetEntryGridRowWithSaving[]).some((row, idx) => {
      if (ignoreIndex !== undefined && idx === ignoreIndex) return false
      return (
        row.jobNumber === entry.jobNumber &&
        row.date === entry.date &&
        row.staffId === entry.staffId &&
        row.description.trim() === entry.description.trim() &&
        !row.isSaving &&
        (!row.id || !entry.id || row.id !== entry.id)
      )
    })
  }

  async function handleCellValueChanged(event: CellValueChangedEvent): Promise<void> {
    const { data, colDef, newValue, oldValue } = event
    if (newValue === oldValue) return
    try {
      loading.value = true
      if (
        colDef.field &&
        [
          'hours',
          'rate',
          'billable',
          'jobNumber',
          'jobId',
          'chargeOutRate',
          'wage',
          'bill',
        ].includes(colDef.field)
      ) {
        const entry = createEntryFromRowData(data)
        const recalculated = calculations.recalculateEntry(entry)
        if (typeof event.node.rowIndex === 'number') {
          updateRowData(event.node.rowIndex, recalculated)
        }
      }
      const updatedEntry = createEntryFromRowData(data)
      if ((data as TimesheetEntryGridRowWithSaving).isSaving) return
      if (!data.isNewRow && updatedEntry.id && !isRowEmpty(updatedEntry)) {
        if (
          typeof event.node.rowIndex === 'number' &&
          isDuplicateEntry(updatedEntry, event.node.rowIndex)
        ) {
          return
        }
        ;(data as TimesheetEntryGridRowWithSaving).isSaving = true
        await onSaveEntry(updatedEntry)
        ;(data as TimesheetEntryGridRowWithSaving).isSaving = false
      }
      if (data.isNewRow && isRowComplete(updatedEntry) && typeof event.node.rowIndex === 'number') {
        if (isDuplicateEntry(updatedEntry)) {
          return
        }
        ;(data as TimesheetEntryGridRowWithSaving).isSaving = true
        await saveNewRow(event.node.rowIndex, updatedEntry)
        ;(data as TimesheetEntryGridRowWithSaving).isSaving = false
      }
    } catch {
      event.api.refreshCells({ rowNodes: [event.node], force: true })
    } finally {
      loading.value = false
    }
  }

  function handleRowDoubleClicked(event: RowDoubleClickedEvent): void {
    if (event.rowIndex === null) return
    const editableCol = columnDefs.value.find(
      (col) => col.editable && typeof col.field === 'string',
    )
    if (!editableCol || typeof editableCol.field !== 'string') return
    event.api.startEditingCell({
      rowIndex: event.rowIndex,
      colKey: editableCol.field,
    })
  }

  function handleCellKeyDown(params: CellKeyDownEvent): void {
    const { event, api, node, column } = params
    if (!event || !(event instanceof KeyboardEvent) || !node.rowIndex !== null) {
      return
    }
    switch (event.key) {
      case 'Escape':
        if (!column.getColDef().editable) {
          return
        }
        api.stopEditing(true)
        break
      case 'Enter':
        if (event.shiftKey) {
          if (column.getColId() === 'billable') {
            event.preventDefault()
            node.data.billable = !node.data.billable
            api.refreshCells({
              rowNodes: [node],
              force: true,
            })
            const entry = createEntryFromRowData(node.data)
            const recalculated = calculations.recalculateEntry(entry)
            updateRowData(node.rowIndex!, recalculated)
          }
          break
        }
        break
      default:
        break
    }
  }

  function createEntryFromRowData(rowData: TimesheetEntryGridRow): TimesheetEntry {
    return {
      id: rowData.id,
      jobId: rowData.jobId || '',
      jobNumber: rowData.jobNumber || '',
      client: rowData.client || '',
      jobName: rowData.jobName || '',
      hours: typeof rowData.hours === 'string' ? parseFloat(rowData.hours) : rowData.hours || 0,
      billable: rowData.billable ?? true,
      description: rowData.description || '',
      rate: rowData.rate || 'Ord',
      wage: typeof rowData.wage === 'string' ? parseFloat(rowData.wage) : rowData.wage || 0,
      bill: typeof rowData.bill === 'string' ? parseFloat(rowData.bill) : rowData.bill || 0,
      staffId: rowData.staffId || '',
      date: rowData.date || '',
      wageRate:
        typeof rowData.wageRate === 'string' ? parseFloat(rowData.wageRate) : rowData.wageRate || 0,
      chargeOutRate:
        typeof rowData.chargeOutRate === 'string'
          ? parseFloat(rowData.chargeOutRate)
          : rowData.chargeOutRate || 0,
      rateMultiplier: calculations.getRateMultiplier(rowData.rate || 'Ord'),
      isNewRow: rowData.isNewRow,
    }
  }

  function updateRowData(rowIndex: number, entry: TimesheetEntry): void {
    if (!gridApi.value || gridApi.value.isDestroyed?.()) return
    const rowNode = gridApi.value.getRowNode(rowIndex.toString())
    if (rowNode) {
      Object.assign(rowNode.data, entry)
      gridApi.value.refreshCells({ rowNodes: [rowNode], force: true })
    }
  }

  function isRowComplete(entry: TimesheetEntry): boolean {
    return !!(entry.jobNumber && entry.hours > 0 && entry.description.trim())
  }

  function isRowEmpty(entry: TimesheetEntry): boolean {
    return (
      !entry.jobNumber &&
      entry.hours === 0 &&
      (!entry.description || entry.description.trim() === '')
    )
  }

  async function saveNewRow(rowIndex: number, entry: TimesheetEntry): Promise<void> {
    if (isDuplicateEntry(entry)) return
    try {
      const entryToSave = { ...entry, isNewRow: false, isSaving: true }
      const entryToSaveClean = { ...entryToSave } as Partial<TimesheetEntryGridRowWithSaving>
      delete entryToSaveClean.isSaving
      updateRowData(rowIndex, entryToSaveClean as TimesheetEntry)
      await onSaveEntry(entryToSaveClean as TimesheetEntry)
      updateRowData(rowIndex, { ...entryToSaveClean } as TimesheetEntry)
      addNewRow()
    } catch {
      updateRowData(rowIndex, entry)
      throw new Error('Failed to save new row')
    }
  }

  async function deleteRow(rowIndex: number): Promise<void> {
    if (!gridApi.value) return
    const [rowDataToRemove] = gridData.value.splice(rowIndex, 1)
    if (rowDataToRemove) {
      if (gridApi.value && !gridApi.value.isDestroyed()) {
        gridApi.value.applyTransaction({ remove: [rowDataToRemove] })
      }
    }
    if (rowDataToRemove && rowDataToRemove.isNewRow) {
      clearRow(rowIndex)
      if (gridData.value.length === 0) {
        addNewRow()
      }
      return
    }
    try {
      loading.value = true
      if (rowDataToRemove && rowDataToRemove.id) {
        await onDeleteEntry(rowDataToRemove.id)
      }
    } catch (error) {
      gridData.value.splice(rowIndex, 0, rowDataToRemove)
      if (gridApi.value && !gridApi.value.isDestroyed()) {
        gridApi.value.applyTransaction({ add: [rowDataToRemove] })
      }
      throw error
    } finally {
      loading.value = false
      if (gridData.value.length === 0) {
        addNewRow()
      }
    }
  }

  function clearRow(rowIndex: number, staffId?: string): void {
    if (!gridApi.value || gridApi.value.isDestroyed?.()) return
    const rowNode = gridApi.value.getRowNode(rowIndex.toString())
    if (rowNode) {
      const currentStaffId = staffId || rowNode.data.staffId || ''
      const date = rowNode.data.date || new Date().toISOString().split('T')[0]
      const staffMember = { id: currentStaffId } as TimesheetEntryStaffMember
      const newRow = calculations.createNewRow(staffMember, date)
      Object.assign(rowNode.data, newRow)
      gridApi.value.refreshCells({ rowNodes: [rowNode], force: true })
    }
  }

  function setGridApi(api: GridApi): void {
    gridApi.value = api
  }

  function loadData(entries: TimesheetEntry[], staffId?: string): void {
    const rows: TimesheetEntryGridRow[] = entries.map((entry) => ({ ...entry }))
    gridData.value = rows
    if (gridApi.value && !gridApi.value.isDestroyed()) {
      // Clear existing data and set new data
      const allRowData: TimesheetEntryGridRow[] = []
      gridApi.value.forEachNode((node) => allRowData.push(node.data))
      if (allRowData.length > 0) {
        gridApi.value.applyTransaction({ remove: allRowData })
      }
      if (gridData.value.length > 0) {
        gridApi.value.applyTransaction({ add: gridData.value })
      }
    }
    if (gridData.value.length === 0) {
      addNewRow(staffId)
    }
  }

  function addNewRow(staffId?: string, date?: string): void {
    const currentStaffId = staffId || ''
    const currentDate = date || new Date().toISOString().split('T')[0]
    const staffMember = { id: currentStaffId } as TimesheetEntryStaffMember
    const newRow = calculations.createNewRow(staffMember, currentDate)
    gridData.value.push(newRow)
    if (gridApi.value && !gridApi.value.isDestroyed()) {
      gridApi.value.applyTransaction({ add: [newRow] })
    } else {
      nextTick(() => {
        if (gridApi.value && !gridApi.value.isDestroyed()) {
          gridApi.value.applyTransaction({ add: [newRow] })
        }
      })
    }
  }

  function getSelectedEntry(): TimesheetEntry | null {
    if (!gridApi.value || gridApi.value.isDestroyed?.() || selectedRowIndex.value < 0) return null
    const rowNode = gridApi.value.getRowNode(selectedRowIndex.value.toString())
    return rowNode ? createEntryFromRowData(rowNode.data) : null
  }

  function handleKeyboardShortcut(event: KeyboardEvent, staffId?: string): boolean {
    if (!gridApi.value) return false
    if (event.shiftKey && event.key === 'N') {
      event.preventDefault()
      addNewRow(staffId)
      return true
    }
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault()
      return true
    }
    if (event.key === 'Delete' && selectedRowIndex.value >= 0) {
      event.preventDefault()
      deleteRow(selectedRowIndex.value)
      return true
    }
    return false
  }

  function getGridData(): TimesheetEntryGridRow[] {
    if (!gridApi.value) return []
    const data: TimesheetEntryGridRow[] = []
    gridApi.value.forEachNode((node: { data?: TimesheetEntryGridRow }) => {
      if (node.data && !node.data.isEmptyRow) {
        data.push(node.data)
      }
    })
    return data
  }

  return {
    gridData,
    loading,
    gridOptions,
    columnDefs,
    setGridApi,
    loadData,
    addNewRow,
    getSelectedEntry,
    getGridData,
    handleKeyboardShortcut,
    handleJobSelection,
    handleCellValueChanged,
    hasData: computed(() => gridData.value.length > 0),
  }
}
