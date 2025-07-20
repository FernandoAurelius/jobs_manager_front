import { ref, computed } from 'vue'
import { useDeviceDetection } from '../composables/useDeviceDetection'
import { schemas } from '../api/generated/api'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'

// Use KanbanJob for mobile job movement
type Job = z.infer<typeof schemas.KanbanJob>

export function useMobileJobMovement() {
  const { isMobile, isTablet } = useDeviceDetection()

  const isMovementModeActive = ref(false)
  const selectedJobForMovement = ref<Job | null>(null)
  const showColumnSelector = ref(false)

  const shouldShowMovementControls = computed(() => {
    const shouldShow = window.innerWidth < 1024
    debugLog('Movement controls visibility:', {
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      windowWidth: window.innerWidth,
      shouldShow,
      threshold: '< 1024px (lg breakpoint)',
    })
    return shouldShow
  })

  const isJobSelectedForMovement = computed(() => {
    return (jobId: string) => selectedJobForMovement.value?.id.toString() === jobId
  })

  const startMovementMode = () => {
    isMovementModeActive.value = true
  }

  const exitMovementMode = () => {
    isMovementModeActive.value = false
    selectedJobForMovement.value = null
    showColumnSelector.value = false
  }

  const selectJobForMovement = (job: Job) => {
    if (!isMovementModeActive.value) return

    selectedJobForMovement.value = job
    showColumnSelector.value = true
  }

  const moveJobToColumn = async (
    targetStatus: string,
    onMoveJob: (jobId: string, targetStatus: string) => Promise<void>,
  ) => {
    if (!selectedJobForMovement.value) return

    try {
      await onMoveJob(selectedJobForMovement.value.id.toString(), targetStatus)
      exitMovementMode()
    } catch (error) {
      debugLog('Error moving job:', error)
    }
  }

  const cancelJobSelection = () => {
    selectedJobForMovement.value = null
    showColumnSelector.value = false
  }
  return {
    isMovementModeActive,
    selectedJobForMovement,
    showColumnSelector,
    shouldShowMovementControls,

    isJobSelectedForMovement,

    startMovementMode,
    exitMovementMode,
    selectJobForMovement,
    moveJobToColumn,
    cancelJobSelection,
  }
}
