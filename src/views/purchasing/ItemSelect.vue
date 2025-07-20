<script setup lang="ts">
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useXeroItemStore } from '@/stores/xeroItemStore'
import { onMounted, computed } from 'vue'

const props = defineProps<{
  modelValue: string | null
}>()
const emit = defineEmits<{
  'update:modelValue': [string]
  'update:description': [string]
  'update:unit_cost': [number | null]
}>()

const store = useXeroItemStore()

onMounted(async () => {
  if (store.items.length === 0 && !store.loading) {
    await store.fetchItems()
  }
})

const displayLabel = computed(() => {
  if (!props.modelValue) return 'Select'
  const found = store.items.find((i) => i.id === props.modelValue)
  return found ? found.code : 'Select'
})
</script>

<template>
  <Select
    :model-value="props.modelValue"
    class="w-32"
    @update:model-value="
      (val) => {
        emit('update:modelValue', val)
        const found = store.items.find((i) => i.id === val)
        emit('update:description', found ? found.name : '')
        emit('update:unit_cost', found && found.unit_cost != null ? Number(found.unit_cost) : null)
      }
    "
  >
    <SelectTrigger>
      <SelectValue :placeholder="'Select'">
        {{ displayLabel }}
      </SelectValue>
    </SelectTrigger>

    <SelectContent>
      <SelectItem v-for="i in store.items" :key="i.id" :value="i.id">{{ i.code }}</SelectItem>
    </SelectContent>
  </Select>
</template>
