<template>
  <AppLayout>
    <div class="p-4 relative space-y-4">
      <ErrorTabs v-model="activeTab" />
      <Alert v-if="fetchError" variant="destructive">{{ fetchError }}</Alert>
      <ErrorFilter
        v-if="activeTab === 'xero'"
        :search="searchTerm"
        :range="dateRange"
        @update:search="searchTerm = $event"
        @update:range="dateRange = $event"
      />
      <div v-if="activeTab === 'xero'">
        <ErrorTable
          :errors="errors"
          :loading="loading"
          :page="page"
          :page-count="pageCount"
          @rowClick="openErrorDialog"
          @update:page="page = $event"
        />
      </div>
      <div v-else class="flex flex-col items-center justify-center min-h-[40vh]">
        <div class="text-3xl font-bold text-center mb-6">To be implemented</div>
        <AlertCircle class="w-24 h-24 text-black opacity-80" />
      </div>
      <ErrorDialog :error="selectedError" @close="closeErrorDialog" />
      <Progress v-if="loading" class="absolute top-0 left-0 right-0" />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
import Progress from '@/components/ui/progress/Progress.vue'
import { AlertCircle } from 'lucide-vue-next'
import { Alert } from '@/components/ui/alert'
import ErrorTabs from '@/components/admin/errors/ErrorTabs.vue'
import ErrorFilter from '@/components/admin/errors/ErrorFilter.vue'
import ErrorTable from '@/components/admin/errors/ErrorTable.vue'
import ErrorDialog from '@/components/admin/errors/ErrorDialog.vue'
import { ref, watch, onMounted } from 'vue'
import { useErrorApi } from '@/composables/useErrorApi'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// Use generated types from Zodios API
type XeroError = z.infer<typeof schemas.XeroError>

interface DateRange {
  start: string | null
  end: string | null
}

const { fetchErrors, error: fetchError } = useErrorApi()

const errors = ref<XeroError[]>([])
const loading = ref(false)
const page = ref(1)
const pageCount = ref(1)
const searchTerm = ref('')
const dateRange = ref<DateRange>({ start: null, end: null })
const activeTab = ref<'xero' | 'system'>('xero')
const selectedError = ref<ErrorRecord | null>(null)

async function loadErrors() {
  loading.value = true
  if (activeTab.value === 'system') {
    errors.value = []
    pageCount.value = 1
    loading.value = false
    return
  }
  const res = await fetchErrors(activeTab.value, page.value, searchTerm.value, dateRange.value)
  errors.value = res.results
  pageCount.value = res.pageCount
  loading.value = false
}

function openErrorDialog(err: ErrorRecord) {
  selectedError.value = err
}
function closeErrorDialog() {
  selectedError.value = null
}

watch([searchTerm, dateRange, activeTab], () => {
  page.value = 1
})
watch([page, searchTerm, dateRange, activeTab], loadErrors, { deep: true })

onMounted(() => loadErrors())
</script>

<style scoped></style>
