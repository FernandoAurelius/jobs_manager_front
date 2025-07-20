<template>
  <div class="relative inline-block text-left">
    <button
      @click="isOpen = !isOpen"
      :disabled="disabled"
      class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-blue-600 text-white border border-blue-600 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      style="min-width: 0"
    >
      <PlusCircle class="w-4 h-4 mr-1" />
      Add Entry
      <ChevronDown class="w-4 h-4 ml-1" :class="{ 'rotate-180': isOpen }" />
    </button>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabindex="-1"
      >
        <div class="py-1" role="none">
          <button
            @click="handleAddMaterial"
            class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            tabindex="-1"
          >
            <Package
              class="mr-3 h-4 w-4 text-green-500 group-hover:text-green-600"
              aria-hidden="true"
            />
            Add Material (Stock)
          </button>
          <button
            @click="handleAddAdjustment"
            class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            tabindex="-1"
          >
            <Settings
              class="mr-3 h-4 w-4 text-pink-500 group-hover:text-pink-600"
              aria-hidden="true"
            />
            Add Adjustment
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { PlusCircle, ChevronDown, Package, Settings } from 'lucide-vue-next'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  'add-material': []
  'add-adjustment': []
}>()

const isOpen = ref(false)

function handleAddMaterial() {
  emit('add-material')
  isOpen.value = false
}

function handleAddAdjustment() {
  emit('add-adjustment')
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
