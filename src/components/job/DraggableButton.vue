<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    ref="buttonRef"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { ref, computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'

type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  draggable?: boolean
  class?: HTMLAttributes['class']
}

interface Emits {
  (e: 'click', event: MouseEvent): void
  (e: 'drag-start', event: MouseEvent | TouchEvent): void
  (e: 'drag-move', event: MouseEvent | TouchEvent): void
  (e: 'drag-end', event: MouseEvent | TouchEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  draggable: true,
})

const emit = defineEmits<Emits>()

const buttonRef = ref<HTMLElement>()
const isDragging = ref(false)
const startPosition = ref({ x: 0, y: 0 })

const buttonClasses = computed(() => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
    destructive: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    outline: 'border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-md border',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none',
  ]

  if (props.draggable) {
    baseClasses.push('cursor-grab active:cursor-grabbing')
  }

  if (isDragging.value) {
    baseClasses.push('shadow-lg transform scale-105')
  }

  return cn(baseClasses, variantClasses[props.variant], sizeClasses[props.size], props.class)
})

const handleClick = (event: MouseEvent): void => {
  if (isDragging.value) return

  emit('click', event)
}

const handleMouseDown = (event: MouseEvent): void => {
  if (!props.draggable || props.disabled) return

  startDrag(event.clientX, event.clientY)
  emit('drag-start', event)
}

const handleMouseMove = (event: MouseEvent): void => {
  if (!isDragging.value || !props.draggable) return

  updateDragPosition()
  emit('drag-move', event)
}

const handleMouseUp = (event: MouseEvent): void => {
  if (!isDragging.value) return

  endDrag()
  emit('drag-end', event)
}

const handleTouchStart = (event: TouchEvent): void => {
  if (!props.draggable || props.disabled) return

  const touch = event.touches[0]
  startDrag(touch.clientX, touch.clientY)
  emit('drag-start', event)
}

const handleTouchMove = (event: TouchEvent): void => {
  if (!isDragging.value || !props.draggable) return

  updateDragPosition()
  emit('drag-move', event)
}

const handleTouchEnd = (event: TouchEvent): void => {
  if (!isDragging.value) return

  endDrag()
  emit('drag-end', event)
}

const startDrag = (clientX: number, clientY: number): void => {
  isDragging.value = true
  startPosition.value = { x: clientX, y: clientY }
}

const updateDragPosition = (): void => {}

const endDrag = (): void => {
  isDragging.value = false
  startPosition.value = { x: 0, y: 0 }
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

button {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
</style>
