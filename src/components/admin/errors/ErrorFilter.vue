<script setup lang="ts">
import Input from '@/components/ui/input/Input.vue'
import { CustomDatePicker } from '@/components/ui/custom-date-picker'
import { ref, watch } from 'vue'
import { DateRangeSchema } from '@/api/local/schemas'
import { z } from 'zod'

type DateRange = z.infer<typeof DateRangeSchema>

const props = defineProps<{ search: string; range: DateRange }>()
const emit = defineEmits(['update:search', 'update:range'])

const localSearch = ref(props.search)
const localRange = ref<DateRange>({ ...props.range })

watch(
  () => props.search,
  (v) => {
    localSearch.value = v
  },
)
watch(
  () => props.range,
  (v) => {
    localRange.value = { ...v }
  },
  { deep: true },
)

watch(localSearch, (v) => emit('update:search', v))
watch(localRange, (v) => emit('update:range', v), { deep: true })
</script>

<template>
  <div class="flex flex-col md:flex-row items-end gap-4">
    <Input v-model="localSearch" placeholder="Search…" class="md:w-64" />
    <CustomDatePicker v-model="localRange" />
  </div>
</template>
