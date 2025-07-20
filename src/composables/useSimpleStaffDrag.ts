import { ref } from 'vue'
import Sortable from 'sortablejs'

export function useSimpleStaffDrag() {
  const isDragging = ref(false)
  const draggedStaffId = ref<string | null>(null)
  const dragTargetJobId = ref<string | null>(null)

  let staffSortable: Sortable | null = null

  // Add job card as drop target for staff
  const makeJobDroppable = (jobElement: HTMLElement, jobId: string) => {
    console.log('🎯 Making job droppable with SortableJS:', jobId)

    // Create a sortable instance for this job card that can accept staff
    const jobSortable = Sortable.create(jobElement, {
      group: {
        name: 'job-' + jobId,
        pull: false,
        put: ['staff'], // Accept items from staff group
      },
      sort: false, // Job cards themselves should not be sortable
      animation: 150,

      onAdd: (evt) => {
        console.log('📋 Staff dropped on job:', jobId)

        const staffElement = evt.item as HTMLElement
        const staffId = staffElement.getAttribute('data-staff-id')

        if (staffId && jobId) {
          console.log('✅ Assigning staff', staffId, 'to job', jobId)
          assignStaffToJob(staffId, jobId)
        }

        // Remove the dropped element since we don't want to show it in the job card
        if (evt.item && evt.item.parentNode) {
          evt.item.parentNode.removeChild(evt.item)
        }
      },

      onMove: (evt) => {
        // Allow drops only on valid targets
        return evt.related.classList.contains('job-card')
      },
    })

    // Store sortable instance for cleanup
    ;(jobElement as HTMLElement & { __staffDropSortable?: Sortable }).__staffDropSortable =
      jobSortable
  }

  const assignStaffToJob = async (staffId: string, jobId: string) => {
    try {
      console.log('🔄 API call: Assigning staff', staffId, 'to job', jobId)

      // Here you would call the API to assign staff to job
      // For example:
      // await api.assignStaffToJob(jobId, staffId)

      // For now, just log
      console.log('✅ Staff assignment successful')

      // Emit event to update UI
      // emit('staff-assigned', { staffId, jobId })
    } catch (error) {
      console.error('❌ Error assigning staff to job:', error)
    }
  }

  const initializeStaffPanel = (staffPanelElement: HTMLElement) => {
    console.log('🎛️ Initializing staff panel with SortableJS on drag handles')

    if (staffSortable) {
      staffSortable.destroy()
    }

    staffSortable = Sortable.create(staffPanelElement, {
      group: {
        name: 'staff',
        pull: 'clone', // Clone staff items when dragging
        put: false, // Don't allow items to be put back
      },
      sort: false, // Staff panel items should not be sortable
      animation: 150,
      ghostClass: 'staff-sortable-ghost',
      chosenClass: 'staff-sortable-chosen',
      dragClass: 'staff-sortable-drag',
      handle: '.drag-handle', // Only allow dragging from drag handle

      onStart: (evt) => {
        const staffElement = evt.item as HTMLElement
        const staffId = staffElement.getAttribute('data-staff-id')

        console.log('🎯 Staff drag started:', staffId)
        isDragging.value = true
        draggedStaffId.value = staffId

        // Add visual feedback to all job cards
        document.querySelectorAll('.job-card').forEach((card) => {
          ;(card as HTMLElement).style.outline = '2px dashed #3b82f6'
          ;(card as HTMLElement).style.outlineOffset = '2px'
        })
      },

      onEnd: (evt) => {
        console.log('🏁 Staff drag ended')
        isDragging.value = false
        draggedStaffId.value = null
        dragTargetJobId.value = null

        // Remove visual feedback from all job cards
        document.querySelectorAll('.job-card').forEach((card) => {
          ;(card as HTMLElement).style.outline = ''
          ;(card as HTMLElement).style.outlineOffset = ''
        })

        // Remove the cloned element if it exists
        if (evt.item && evt.item.parentNode) {
          evt.item.parentNode.removeChild(evt.item)
        }
      },
    })
  }

  const initializeJobCard = (jobElement: HTMLElement, jobId: string) => {
    console.log('🃏 Initializing job card as drop target:', jobId)
    makeJobDroppable(jobElement, jobId)
  }

  const cleanup = () => {
    if (staffSortable) {
      staffSortable.destroy()
      staffSortable = null
    }

    // Clean up job sortables
    document.querySelectorAll('[data-job-id]').forEach((element) => {
      const sortable = (element as HTMLElement & { __staffDropSortable?: Sortable })
        .__staffDropSortable
      if (sortable) {
        sortable.destroy()
        delete (element as HTMLElement & { __staffDropSortable?: Sortable }).__staffDropSortable
      }
    })
  }

  return {
    isDragging,
    draggedStaffId,
    dragTargetJobId,
    initializeStaffPanel,
    initializeJobCard,
    assignStaffToJob,
    cleanup,
  }
}
