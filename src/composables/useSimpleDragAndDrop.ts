import { ref, nextTick } from 'vue'
import Sortable from 'sortablejs'
import { debugLog } from '@/utils/debug'
import type { DragEventData, JobCardElement, SortableOptions } from '../api/local/schemas'

const SORTABLE_CONFIG = {
  GROUP: 'jobs',
  ANIMATION_DURATION: 150,
  GHOST_CLASS: 'opacity-50 bg-blue-100',
  CHOSEN_CLASS: 'scale-105 shadow-lg',
  DRAG_CLASS: 'rotate-2 shadow-xl',
  DRAGGABLE_SELECTOR: '.job-card-simple',
  DISABLED: false,
  DELAY: 0,
  TOUCH_START_THRESHOLD: 0,
  FORCE_FALLBACK: false,
  FALLBACK_ON_BODY: true,
} as const

export function useSimpleDragAndDrop() {
  const isDragging = ref(false)
  const sortableInstances = new Map<string, Sortable>()

  const logColumnInitialization = (element: HTMLElement, status: string): void => {
    debugLog(`📍 Initializing simple drag for ${status}`)
    debugLog(`📍 Element:`, element)
    debugLog(`📍 Element classes:`, element.className)
    debugLog(`📍 Element data-status:`, element.dataset.status)
  }
  const createJobCardElementData = (htmlElement: HTMLElement): JobCardElement => ({
    id: htmlElement.dataset.id || '',
    classes: htmlElement.className,
    hasDataId: !!htmlElement.dataset.id,
  })

  const logDraggableElements = (element: HTMLElement, status: string): void => {
    const draggableElements = element.querySelectorAll('[data-id]')
    const jobCardElements = element.querySelectorAll('.job-card-simple')
    const draggableJobCards = element.querySelectorAll('.job-card-simple[data-id]')

    debugLog(`📦 Found ${draggableElements.length} draggable elements in ${status}`)
    debugLog(`🃏 Found ${jobCardElements.length} job-card elements in ${status}`)
    debugLog(`🎯 Found ${draggableJobCards.length} draggable job-card elements in ${status}`)

    if (jobCardElements.length === 0) return

    const jobCardData: JobCardElement[] = Array.from(jobCardElements).map((el) =>
      createJobCardElementData(el as HTMLElement),
    )

    debugLog('🎴 Job card elements:', jobCardData)

    if (draggableJobCards.length > 0) {
      debugLog(
        '🎯 Draggable job cards:',
        Array.from(draggableJobCards).map((el) => ({
          id: el.getAttribute('data-id'),
          classes: el.className,
        })),
      )
    }
  }

  const handleDragStart = (evt: Sortable.SortableEvent): void => {
    debugLog('🎯 Simple drag started', {
      item: evt.item,
      itemId: evt.item.dataset.id,
      from: evt.from.dataset.status,
      event: evt,
    })
    isDragging.value = true
  }

  const handleDragMove = (evt: Sortable.MoveEvent): boolean => {
    debugLog('🔄 Move event', {
      related: evt.related,
      relatedRect: evt.relatedRect,
      willInsertAfter: evt.willInsertAfter,
    })
    return true
  }

  const extractDragEventData = (evt: Sortable.SortableEvent): DragEventData => ({
    jobId: evt.item.dataset.id || '',
    fromStatus: evt.from.dataset.status || '',
    toStatus: evt.to.dataset.status || '',
  })

  const isValidDragEventData = (dragData: DragEventData): boolean => {
    return !!(dragData.jobId && dragData.fromStatus && dragData.toStatus)
  }

  const shouldProcessJobMove = (dragData: DragEventData): boolean => {
    if (!isValidDragEventData(dragData)) {
      debugLog('⚠️ Missing data for job move:', dragData)
      return false
    }

    if (dragData.fromStatus === dragData.toStatus) {
      debugLog('📍 Job moved within same column, no status change needed')
      return false
    }

    return true
  }

  const processJobMove = (
    dragData: DragEventData,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): void => {
    debugLog(`📦 Moving job ${dragData.jobId} from ${dragData.fromStatus} to ${dragData.toStatus}`)
    onJobMoved(dragData.fromStatus, dragData.toStatus, dragData.jobId)
  }

  const handleDragEnd = (
    evt: Sortable.SortableEvent,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): void => {
    debugLog('🏁 Simple drag ended', {
      item: evt.item,
      itemId: evt.item.dataset.id,
      from: evt.from.dataset.status,
      to: evt.to.dataset.status,
      event: evt,
    })

    isDragging.value = false

    const dragData = extractDragEventData(evt)

    if (!shouldProcessJobMove(dragData)) return

    processJobMove(dragData, onJobMoved)
  }

  const createSortableConfiguration = (
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): SortableOptions => ({
    group: SORTABLE_CONFIG.GROUP,
    animation: SORTABLE_CONFIG.ANIMATION_DURATION,
    ghostClass: SORTABLE_CONFIG.GHOST_CLASS,
    chosenClass: SORTABLE_CONFIG.CHOSEN_CLASS,
    dragClass: SORTABLE_CONFIG.DRAG_CLASS,
    draggable: SORTABLE_CONFIG.DRAGGABLE_SELECTOR,
    disabled: SORTABLE_CONFIG.DISABLED,
    delay: SORTABLE_CONFIG.DELAY,
    touchStartThreshold: SORTABLE_CONFIG.TOUCH_START_THRESHOLD,
    forceFallback: SORTABLE_CONFIG.FORCE_FALLBACK,
    fallbackOnBody: SORTABLE_CONFIG.FALLBACK_ON_BODY,
    onStart: handleDragStart,
    onEnd: (evt: Sortable.SortableEvent) => handleDragEnd(evt, onJobMoved),
    onMove: handleDragMove,
  })

  const destroyExistingSortableInstance = (status: string): void => {
    const existingInstance = sortableInstances.get(status)

    if (!existingInstance) return

    existingInstance.destroy()
    debugLog(`🗑️ Destroyed existing sortable for ${status}`)
    sortableInstances.delete(status)
  }

  const createAndStoreSortableInstance = (
    element: HTMLElement,
    status: string,
    config: SortableOptions,
  ): Sortable => {
    debugLog(`🚀 Creating Sortable instance for ${status} with config:`, config)
    debugLog(`🎯 Element HTML:`, element.outerHTML.substring(0, 300))
    debugLog(`🔍 Selector being used:`, SORTABLE_CONFIG.DRAGGABLE_SELECTOR)

    const testElements = element.querySelectorAll(SORTABLE_CONFIG.DRAGGABLE_SELECTOR)
    debugLog(`🧪 Test selector found ${testElements.length} elements before Sortable creation`)

    const sortableInstance = new Sortable(element, config)
    sortableInstances.set(status, sortableInstance)

    debugLog(`✅ Sortable initialized for ${status}:`, {
      sortable: sortableInstance,
      options: sortableInstance.options,
      element: sortableInstance.el,
    })

    debugLog(`🔍 Sortable disabled state:`, sortableInstance.option('disabled'))
    debugLog(`🔍 Sortable group:`, sortableInstance.option('group'))
    debugLog(`🔍 Sortable draggable:`, sortableInstance.option('draggable'))

    return sortableInstance
  }

  const initializeColumn = (
    element: HTMLElement,
    status: string,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): Sortable | undefined => {
    if (!element) {
      debugLog(`⚠️ No element provided for ${status}`)
      return undefined
    }

    destroyExistingSortableInstance(status)
    logColumnInitialization(element, status)
    logDraggableElements(element, status)

    const sortableConfig = createSortableConfiguration(onJobMoved)
    const sortableInstance = createAndStoreSortableInstance(element, status, sortableConfig)

    setTimeout(() => {
      const draggableItems = element.querySelectorAll(SORTABLE_CONFIG.DRAGGABLE_SELECTOR)
      debugLog(
        `🔍 Post-init verification for ${status}: Found ${draggableItems.length} draggable items`,
      )
      draggableItems.forEach((item, index) => {
        debugLog(`  Item ${index}:`, {
          element: item,
          dataId: item.getAttribute('data-id'),
          classes: item.className,
        })

        const htmlItem = item as HTMLElement
        htmlItem.addEventListener('mousedown', (e) => {
          debugLog(`🖱️ Manual mousedown on item ${index}:`, e)
        })
        htmlItem.addEventListener('dragstart', (e) => {
          debugLog(`🎭 Manual dragstart on item ${index}:`, e)
        })
      })
    }, 100)

    return sortableInstance
  }

  const findColumnElement = (status: string): HTMLElement | null => {
    return document.querySelector(`[data-status="${status}"]`) as HTMLElement
  }

  const initializeColumnByStatus = (
    status: string,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): void => {
    const element = findColumnElement(status)

    if (element) {
      debugLog(`🔧 Reinitializing ${status} with element:`, element)
      initializeColumn(element, status, onJobMoved)
    } else {
      debugLog(`⚠️ No element found for status: ${status}`)
    }
  }

  const reinitializeAllColumns = async (
    statuses: string[],
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): Promise<void> => {
    debugLog('🔄 Reinitializing all columns...')

    await nextTick()

    await new Promise((resolve) => setTimeout(resolve, 150))

    statuses.forEach((status) => initializeColumnByStatus(status, onJobMoved))
  }

  const destroyAllSortableInstances = (): void => {
    debugLog('🧹 Destroying all sortable instances...')

    sortableInstances.forEach((sortableInstance, status) => {
      sortableInstance.destroy()
      debugLog(`🗑️ Destroyed sortable for ${status}`)
    })

    sortableInstances.clear()
  }

  return {
    isDragging,
    initializeColumn,
    reinitializeAll: reinitializeAllColumns,
    destroy: destroyAllSortableInstances,
  }
}
