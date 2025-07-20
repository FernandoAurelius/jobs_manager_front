<template>
  <div class="relative">
    <!-- Input field -->
    <input
      ref="inputRef"
      v-model="searchTerm"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      :class="{
        'border-red-500': hasError,
        'opacity-50 cursor-not-allowed': disabled,
      }"
      @focus="disabled ? null : onFocus()"
      @blur="disabled ? null : onBlur($event)"
      @input="disabled ? null : onInput()"
      @keydown="disabled ? null : onKeydown($event)"
    />

    <!-- Error message -->
    <div v-if="hasError && errorMessage" class="text-red-500 text-sm mt-1">
      {{ errorMessage }}
    </div>

    <!-- Dropdown portal -->
    <Teleport to="body">
      <div
        v-if="showDropdown && !disabled"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="absolute bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-[9999] min-w-[200px]"
      >
        <!-- Job items -->
        <div
          v-for="(job, index) in filteredJobs"
          :key="job.id"
          :class="{
            'bg-blue-50': index === highlightedIndex,
            'hover:bg-gray-50': index !== highlightedIndex,
          }"
          class="px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0"
          @click="selectJob(job)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="font-medium text-gray-900">
            {{ job.number || job.job_number }}
          </div>
          <div class="text-sm text-gray-600 truncate">
            {{ job.description || job.name }}
          </div>
          <div v-if="job.client_name" class="text-xs text-gray-500 truncate">
            Client: {{ job.client_name }}
          </div>
        </div>

        <!-- Loading message -->
        <div v-if="isLoading" class="px-3 py-2 text-gray-500 text-sm flex items-center gap-2">
          <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
          Jobs are loading, please wait
        </div>

        <!-- No results message -->
        <div
          v-if="!isLoading && filteredJobs.length === 0 && searchTerm.trim()"
          class="px-3 py-2 text-gray-500 text-sm"
        >
          No jobs found for "{{ searchTerm }}"
        </div>

        <!-- No jobs available -->
        <div
          v-if="!isLoading && filteredJobs.length === 0 && !searchTerm.trim()"
          class="px-3 py-2 text-gray-500 text-sm"
        >
          No jobs available
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null,
  },
  jobs: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Select a job (optional)...',
  },
  hasError: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'jobSelected'])

const inputRef = ref(null)
const dropdownRef = ref(null)
const searchTerm = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const dropdownStyle = ref({})

const filteredJobs = computed(() => {
  const excludedStatuses = ['rejected', 'archived', 'completed', 'special']
  const availableJobs = props.jobs.filter(
    (job) => !excludedStatuses.includes(job.status?.toLowerCase()),
  )

  if (!searchTerm.value.trim()) {
    return availableJobs
  }

  const term = searchTerm.value.toLowerCase()

  const filtered = availableJobs.filter((job) => {
    const numberMatch = job.number?.toString().toLowerCase().includes(term)
    const jobNumberMatch = job.job_number?.toString().toLowerCase().includes(term)
    const descriptionMatch = job.description?.toLowerCase().includes(term)
    const nameMatch = job.name?.toLowerCase().includes(term)
    const clientMatch = job.client_name?.toLowerCase().includes(term)

    return numberMatch || jobNumberMatch || descriptionMatch || nameMatch || clientMatch
  })

  return filtered
})

const updateSearchTermFromModelValue = (modelValue) => {
  if (modelValue) {
    const selectedJob = props.jobs.find((job) => job.id === modelValue)
    if (selectedJob) {
      const jobNumber = selectedJob.number || selectedJob.job_number
      const jobDescription = selectedJob.description || selectedJob.name
      searchTerm.value = `${jobNumber} - ${jobDescription}`
    }
  } else {
    searchTerm.value = ''
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    updateSearchTermFromModelValue(newValue)
  },
  { immediate: true },
)

watch(
  () => props.jobs,
  (newJobs) => {
    if (props.modelValue && newJobs.length > 0) {
      updateSearchTermFromModelValue(props.modelValue)
    }
  },
  { immediate: true },
)

watch(searchTerm, () => {}, { immediate: true })

const onFocus = () => {
  if (props.disabled) return
  showDropdown.value = true
  highlightedIndex.value = -1
  calculateDropdownPosition()
}

const onBlur = (event) => {
  if (props.disabled) return
  setTimeout(() => {
    if (!dropdownRef.value?.contains(event.relatedTarget)) {
      showDropdown.value = false
      highlightedIndex.value = -1
    }
  }, 150)
}

const onInput = () => {
  if (props.disabled) return
  showDropdown.value = true
  highlightedIndex.value = -1
  calculateDropdownPosition()

  if (props.modelValue) {
    emit('update:modelValue', null)
    emit('jobSelected', null)
  }
}

const onKeydown = (event) => {
  if (props.disabled || !showDropdown.value || filteredJobs.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredJobs.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0) {
        selectJob(filteredJobs.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      showDropdown.value = false
      highlightedIndex.value = -1
      inputRef.value?.blur()
      break
  }
}

const selectJob = (job) => {
  if (props.disabled) return

  const jobNumber = job.number || job.job_number
  const jobDescription = job.description || job.name
  searchTerm.value = `${jobNumber} - ${jobDescription}`
  showDropdown.value = false
  highlightedIndex.value = -1

  emit('update:modelValue', job.id)
  emit('jobSelected', job)

  inputRef.value?.blur()
}

const calculateDropdownPosition = async () => {
  await nextTick()

  if (!inputRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 240

  let top = inputRect.bottom + window.scrollY
  let left = inputRect.left + window.scrollX
  const width = inputRect.width

  if (inputRect.bottom + dropdownHeight > viewportHeight) {
    if (inputRect.top > dropdownHeight) {
      top = inputRect.top + window.scrollY - dropdownHeight
    }
  }

  const maxLeft = window.innerWidth - width - 20
  left = Math.min(left, maxLeft)
  left = Math.max(left, 10)

  dropdownStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    zIndex: 9999,
  }
}

const handleClickOutside = (event) => {
  if (
    inputRef.value &&
    !inputRef.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    showDropdown.value = false
    highlightedIndex.value = -1
  }
}

const handleResize = () => {
  if (showDropdown.value) {
    calculateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
})

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: () => {
    searchTerm.value = ''
    emit('update:modelValue', null)
    emit('jobSelected', null)
  },
})
</script>
