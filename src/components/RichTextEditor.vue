<template>
  <div>
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div
      class="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent"
    >
      <div :id="id" ref="editorContainer" class="min-h-[120px]"></div>
    </div>

    <p v-if="helpText" class="mt-1 text-sm text-gray-500">{{ helpText }}</p>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type Quill from 'quill'
import RangeStatic from 'quill'

interface Props {
  id?: string
  label?: string
  modelValue?: string
  placeholder?: string
  required?: boolean
  helpText?: string
  readonly?: boolean
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: 'rich-text-editor',
  modelValue: '',
  placeholder: 'Enter text...',
  required: false,
  readonly: false,
  height: '120px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  blur: []
}>()

const editorContainer = ref<HTMLElement>()
let quill: Quill | null = null
let isUpdatingFromProp = false

const initializeEditor = async () => {
  if (!editorContainer.value) {
    debugLog('Editor container not found')
    return
  }
  try {
    const { default: Quill } = await import('quill')
    await import('quill/dist/quill.snow.css')

    const toolbarOptions = [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ]

    const options = {
      theme: 'snow',
      placeholder: props.placeholder,
      readOnly: props.readonly,
      modules: {
        toolbar: toolbarOptions,
      },
    }

    quill = new Quill(editorContainer.value, options)

    if (props.modelValue) {
      quill.root.innerHTML = props.modelValue
    }

    setupEventHandlers()
  } catch (error) {
    debugLog('Failed to initialize Quill editor:', error)
  }
}

const setupEventHandlers = () => {
  if (!quill) return

  quill.on('text-change', () => {
    if (isUpdatingFromProp) return

    if (!quill) return

    const content = quill.root.innerHTML
    emit('update:modelValue', content)
  })

  quill.on('selection-change', (range: RangeStatic | null) => {
    if (range) {
      emit('focus')
    } else {
      emit('blur')
    }
  })
}

const updateContent = (newContent: string | undefined) => {
  if (!quill) return

  const safeContent = newContent || ''
  const currentContent = quill.root.innerHTML

  if (currentContent === safeContent) return

  isUpdatingFromProp = true

  const selection = quill.getSelection()

  quill.root.innerHTML = safeContent

  if (selection) {
    nextTick(() => {
      if (!quill) return
      quill.setSelection(selection)
    })
  }

  isUpdatingFromProp = false
}

const setReadonly = (readonly: boolean) => {
  if (quill) {
    quill.enable(!readonly)
  }
}

const focus = () => {
  if (quill) {
    quill.focus()
  }
}

const getTextContent = (): string => {
  return quill ? quill.getText() : ''
}

const clear = () => {
  if (quill) {
    quill.setText('')
  }
}

onMounted(async () => {
  await nextTick()
  await initializeEditor()
})

onUnmounted(() => {
  if (quill) {
    quill = null
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    updateContent(newValue)
  },
)

watch(
  () => props.readonly,
  (newReadonly) => {
    setReadonly(newReadonly)
  },
)

defineExpose({
  focus,
  getTextContent,
  clear,
  quill: () => quill,
})
</script>

<style>
.ql-toolbar {
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-bottom: 1px solid #e5e7eb !important;
}

.ql-container {
  border: none !important;
  font-family: inherit;
}

.ql-editor {
  min-height: 80px;
  padding: 12px;
}

.ql-editor.ql-blank::before {
  font-style: normal;
  color: #9ca3af;
}

.ql-toolbar.ql-snow + .ql-container.ql-snow {
  border: none;
}
</style>
