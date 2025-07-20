<template>
  <div
    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
    :class="badgeClass"
  >
    <TrendingUp class="h-3 w-3 mr-1" />
    {{ displayValue }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp } from 'lucide-vue-next'

const props = defineProps<{
  percentage?: number
}>()

const displayValue = computed(() => {
  if (props.percentage === undefined || props.percentage === null) return '--'
  return `${props.percentage.toFixed(1)}%`
})

const badgeClass = computed(() => {
  if (props.percentage === undefined || props.percentage === null)
    return 'bg-gray-100 text-gray-500'
  if (props.percentage >= 80) return 'bg-green-100 text-green-700'
  if (props.percentage >= 50) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
})
</script>
