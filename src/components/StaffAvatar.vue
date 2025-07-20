<template>
  <div
    :class="[
      'rounded-full overflow-hidden flex items-center justify-center cursor-pointer shadow-sm transition-all duration-200 relative',
      'hover:scale-110 hover:shadow-md',
      size === 'sm' ? 'w-5 h-5 text-xs' : 'w-10 h-10',
      isActive
        ? 'border-2 border-blue-500 scale-110 shadow-blue-200 shadow-md ring-2 ring-blue-300 ring-offset-1'
        : '',
      isDragging ? 'opacity-80 rotate-1 scale-105 shadow-lg' : '',
      'staff-avatar-draggable',
    ]"
    :title="staff.display_name"
    :data-staff-id="staff.id"
  >
    <img
      v-if="staff.avatarUrl && staff.avatarUrl !== null"
      :src="staff.avatarUrl"
      :alt="staff.display_name"
      class="w-full h-full object-cover"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center text-white font-bold"
      :class="size === 'sm' ? 'text-xs' : 'text-sm'"
      :style="{ backgroundColor: backgroundColor }"
    >
      {{ getInitials(staff) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { StaffAvatarSchema, StaffAvatarSizeSchema } from '@/api/local/schemas'
import { z } from 'zod'

type StaffAvatar = z.infer<typeof StaffAvatarSchema>
type StaffAvatarSize = z.infer<typeof StaffAvatarSizeSchema>

const props = withDefaults(
  defineProps<{
    staff: StaffAvatar
    size?: StaffAvatarSize
    isActive?: boolean
    isDragging?: boolean
  }>(),
  {
    size: 'normal',
    isActive: false,
    isDragging: false,
  },
)

defineEmits<{
  click: []
}>()

const getInitials = (staff: StaffAvatar): string => {
  if (staff.initials) {
    return staff.initials
  }

  const firstInitial = staff.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = staff.lastName?.charAt(0)?.toUpperCase() || ''

  if (firstInitial || lastInitial) {
    return firstInitial + lastInitial
  }

  if (staff.display_name) {
    const words = staff.display_name.trim().split(/\s+/)
    if (words.length >= 2) {
      return words[0].charAt(0).toUpperCase() + words[words.length - 1].charAt(0).toUpperCase()
    } else if (words.length === 1 && words[0].length >= 2) {
      return words[0].substring(0, 2).toUpperCase()
    } else if (words[0].length === 1) {
      return words[0].charAt(0).toUpperCase() + words[0].charAt(0).toUpperCase()
    }
  }

  return '??'
}

const backgroundColor = computed(() => {
  const predefinedColors = [
    '#3498db',
    '#2ecc71',
    '#e74c3c',
    '#9b59b6',
    '#f39c12',
    '#1abc9c',
    '#d35400',
    '#c0392b',
    '#8e44ad',
    '#16a085',
    '#27ae60',
    '#2980b9',
    '#f1c40f',
    '#e67e22',
    '#34495e',
  ]

  const colorIndex =
    Math.abs(
      props.staff.display_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
    ) % predefinedColors.length
  return predefinedColors[colorIndex]
})
</script>

<style scoped>
.staff-avatar-draggable {
  user-select: none;
  -webkit-user-select: none;
}

:global(.staff-sortable-chosen) .staff-avatar-draggable {
  border: 2px solid #3b82f6 !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  transform: scale(1.1) !important;
}

:global(.staff-sortable-drag) .staff-avatar-draggable {
  border: 3px solid #2563eb !important;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4) !important;
  transform: scale(1.15) rotate(3deg) !important;
  z-index: 1002 !important;
  position: relative !important;
}

@media (min-width: 768px) and (max-width: 1023px) {
  :global(.staff-sortable-chosen) .staff-avatar-draggable {
    transform: scale(1.15) !important;
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.35) !important;
  }

  :global(.staff-sortable-drag) .staff-avatar-draggable {
    transform: scale(1.2) rotate(2deg) !important;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.45) !important;
    border-width: 3px !important;
  }
}

@media (max-width: 767px) {
  :global(.staff-sortable-chosen) .staff-avatar-draggable {
    transform: scale(1.08) !important;
  }

  :global(.staff-sortable-drag) .staff-avatar-draggable {
    transform: scale(1.12) rotate(1deg) !important;
  }
}
</style>
