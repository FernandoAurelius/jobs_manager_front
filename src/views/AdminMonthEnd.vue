<template>
  <AppLayout>
    <div
      class="w-full min-h-screen bg-white max-w-none mx-0 py-8 px-4 flex flex-col gap-6 overflow-y-hidden"
    >
      <Tabs v-model="activeTab" class="w-full max-w-2xl mx-auto sticky top-0 z-10 bg-white pb-4">
        <TabsList class="justify-center w-full">
          <TabsTrigger value="current">Current Month-End</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="custom">Select Month</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Tabs v-model="activeMonthTab">
            <TabsList class="justify-center">
              <TabsTrigger
                v-for="month in lastSixMonths"
                :key="month.key"
                :value="month.key"
                @click="loadMonthData(month)"
              >
                {{ month.label }}
              </TabsTrigger>
            </TabsList>
            <TabsContent v-for="month in lastSixMonths" :key="month.key" :value="month.key">
              <MonthEndSummary
                v-if="monthData[month.key]"
                :jobs="monthData[month.key].jobs"
                :stockSummary="monthData[month.key].stockSummary"
                :monthKey="month.key"
                :selectedIds="selectedIds"
                @selectJob="onSelectJob"
                @runMonthEnd="showDialog = true"
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="custom">
          <div class="flex items-end gap-3 mb-4 justify-center">
            <input type="month" v-model="selectedMonth" class="border rounded px-2 py-1" />
            <Button variant="default" @click="loadCustomMonth">Load</Button>
          </div>
          <div
            v-if="!customMonthLoaded"
            class="flex flex-col items-center justify-center min-h-[200px] text-gray-400"
          >
            <span>Load data to see previous months data here</span>
          </div>
          <div v-else>
            <MonthEndSummary
              :jobs="customMonthData.jobs"
              :stockSummary="customMonthData.stockSummary"
              :monthKey="selectedMonth"
              :selectedIds="selectedIds"
              @selectJob="onSelectJob"
              @runMonthEnd="showDialog = true"
            />
            <div class="flex justify-center mt-4">
              <Button variant="outline" @click="resetToCurrent">Back to Current</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="current">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Jobs</CardTitle>
              </CardHeader>
              <CardContent class="text-2xl font-bold text-center">{{ jobs.length }}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Hours</CardTitle>
              </CardHeader>
              <CardContent class="text-2xl font-bold text-center">{{
                totalHours.toFixed(2)
              }}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Dollars</CardTitle>
              </CardHeader>
              <CardContent class="text-2xl font-bold text-center">{{
                totalDollars.toFixed(2)
              }}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stock Job</CardTitle>
              </CardHeader>
              <CardContent class="text-center space-y-1">
                <div>Lines: {{ stockSummary.material_line_count }}</div>
                <div>Cost: {{ stockSummary.material_cost.toFixed(2) }}</div>
              </CardContent>
            </Card>
          </div>
          <div class="mt-6 overflow-x-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-10">
                    <input type="checkbox" @change="toggleAll" :checked="allSelected" />
                  </TableHead>
                  <TableHead>Job #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Dollars</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="job in jobs" :key="job.job_id">
                  <TableCell>
                    <input type="checkbox" :value="job.job_id" v-model="selectedIds" />
                  </TableCell>
                  <TableCell>{{ job.job_number }}</TableCell>
                  <TableCell>{{ job.job_name }}</TableCell>
                  <TableCell>{{ job.total_hours.toFixed(2) }}</TableCell>
                  <TableCell>{{ job.total_dollars.toFixed(2) }}</TableCell>
                  <TableCell>
                    <svg class="w-24 h-6">
                      <polyline
                        :points="sparklinePoints(job.history.map((h) => h.total_hours))"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1"
                      />
                    </svg>
                  </TableCell>
                </TableRow>
                <TableRow v-if="jobs.length === 0 && !isLoading">
                  <TableCell colspan="6" class="text-center py-4">No jobs</TableCell>
                </TableRow>
                <TableRow v-if="jobs.length === 0 && isLoading">
                  <TableCell colspan="6" class="text-center py-4">
                    <div class="flex items-center justify-center gap-2">
                      <div
                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"
                      ></div>
                      Month-end jobs are still loading, please wait
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div class="flex justify-center mt-8">
            <Button variant="destructive" :disabled="!selectedIds.length" @click="showDialog = true"
              >Run Month-End</Button
            >
          </div>
        </TabsContent>
      </Tabs>
      <Dialog v-model:open="showDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Month-End</DialogTitle>
          </DialogHeader>
          <div class="space-y-2">
            <div
              v-for="id in selectedIds"
              :key="id"
              class="flex items-center justify-between px-2 py-1 border rounded bg-muted"
            >
              <span class="font-mono text-sm">{{ jobNumber(id) }}</span>
              <span class="text-xs text-gray-500">
                {{ (getCurrentJobs().find((j) => j.job_id === id)?.job_name || '').slice(0, 32) }}
              </span>
              <span class="ml-2 text-xs text-blue-700">
                ${{
                  (getCurrentJobs().find((j) => j.job_id === id)?.total_dollars ?? 0).toFixed(2)
                }}
              </span>
            </div>
          </div>
          <DialogFooter class="flex gap-2 justify-end mt-4">
            <Button variant="destructive" @click="confirmRun">Run</Button>
            <Button variant="outline" @click="showDialog = false">Cancel</Button>
          </DialogFooter>
          <Progress v-if="loading" class="mt-4" :model-value="progress" />
        </DialogContent>
      </Dialog>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Progress from '@/components/ui/progress/Progress.vue'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchMonthEnd, runMonthEnd } from '@/composables/useMonthEnd'
import type { MonthEndJob, MonthEndStockJob } from '@/api/generated/api'
import { toast } from 'vue-sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import MonthEndSummary from '@/components/admin/MonthEndSummary.vue'

interface MonthTab {
  key: string
  label: string
}

const activeTab = ref<'current' | 'history' | 'custom'>('current')
const activeMonthTab = ref<string>('')
const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const selectedIds = ref<string[]>([])
const loading = ref(false)
const jobs = ref<MonthEndJob[]>([])
const stockJob = ref<MonthEndStockJob | null>(null)
const isLoading = computed(() => loading.value)
const totalHours = computed(() => jobs.value.reduce((a, j) => a + j.total_hours, 0))
const totalDollars = computed(() => jobs.value.reduce((a, j) => a + j.total_dollars, 0))
const allSelected = computed(
  () => jobs.value.length > 0 && selectedIds.value.length === jobs.value.length,
)
const stockSummary = computed(() => {
  if (!stockJob.value) return { material_line_count: 0, material_cost: 0 }
  return {
    material_line_count: stockJob.value.history.reduce((a, h) => a + h.material_line_count, 0),
    material_cost: stockJob.value.history.reduce((a, h) => a + h.material_cost, 0),
  }
})

function sparklinePoints(values: number[]): string {
  if (!Array.isArray(values) || values.length < 2) return ''
  const validValues = values.filter((v) => typeof v === 'number' && !isNaN(v))
  if (validValues.length < 2) return ''
  const max = Math.max(...validValues)
  const min = Math.min(...validValues)
  const width = 60
  const height = 20
  return validValues
    .map((v, i) => {
      const x = (i / (validValues.length - 1)) * width
      const y = height - (max === min ? height / 2 : ((v - min) / (max - min)) * height)
      return `${x},${y}`
    })
    .join(' ')
}

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? jobs.value.map((j) => j.job_id) : []
}

function jobNumber(id: string) {
  const j = jobs.value.find((j) => j.job_id === id)
  return j ? j.job_number : id
}

async function fetchMonthEndData() {
  loading.value = true
  toast.info('Loading Month-End data...', { id: 'month-end-loading' })
  try {
    const data = await fetchMonthEnd()
    jobs.value = data.jobs
    stockJob.value = data.stockJob
    selectedIds.value = []
    toast.success('Month-End data loaded successfully')
  } catch {
    toast.error('Failed to load month-end data')
  } finally {
    loading.value = false
    setTimeout(() => {
      toast.dismiss('month-end-loading')
    }, 2000)
  }
}

const lastSixMonths = computed<MonthTab[]>(() => {
  const months: MonthTab[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({
      key,
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
    })
  }
  return months
})

const monthData = ref<
  Record<
    string,
    { jobs: MonthEndJob[]; stockSummary: { material_line_count: number; material_cost: number } }
  >
>({})

function loadMonthData(month: MonthTab) {
  if (monthData.value[month.key]) return
  loading.value = true
  toast.info(`Loading data for ${month.label}...`, { id: `month-end-${month.key}` })
  fetchMonthEnd()
    .then((data) => {
      monthData.value[month.key] = {
        jobs: data.jobs,
        stockSummary: data.stockJob
          ? {
              material_line_count: data.stockJob.history.reduce(
                (a, h) => a + h.material_line_count,
                0,
              ),
              material_cost: data.stockJob.history.reduce((a, h) => a + h.material_cost, 0),
            }
          : { material_line_count: 0, material_cost: 0 },
      }
      toast.success('Month-End data loaded successfully')
    })
    .catch(() => {
      toast.error('Failed to load month-end data')
    })
    .finally(() => {
      loading.value = false
      toast.dismiss(`month-end-${month.key}`)
    })
}

function loadCustomMonth() {
  loading.value = true
  toast.info('Loading Month-End data...', { id: 'month-end-custom' })
  fetchMonthEnd()
    .then((data) => {
      customMonthData.value = {
        jobs: data.jobs,
        stockSummary: data.stockJob
          ? {
              material_line_count: data.stockJob.history.reduce(
                (a, h) => a + h.material_line_count,
                0,
              ),
              material_cost: data.stockJob.history.reduce((a, h) => a + h.material_cost, 0),
            }
          : { material_line_count: 0, material_cost: 0 },
      }
      customMonthLoaded.value = true
      activeTab.value = 'custom'
      toast.success('Month-End data loaded successfully')
    })
    .catch(() => {
      toast.error('Failed to load month-end data')
    })
    .finally(() => {
      loading.value = false
      toast.dismiss('month-end-custom')
    })
}

function resetToCurrent() {
  customMonthLoaded.value = false
  activeTab.value = 'current'
}

function onSelectJob(ids: string[]) {
  selectedIds.value = ids
}

function getCurrentJobs() {
  if (activeTab.value === 'custom' && customMonthLoaded.value && customMonthData.value) {
    return customMonthData.value.jobs || []
  }
  if (activeTab.value === 'history' && monthData.value[activeMonthTab.value]) {
    return monthData.value[activeMonthTab.value].jobs || []
  }
  return jobs.value
}

async function confirmRun() {
  loading.value = true
  progress.value = 0
  try {
    const res = await runMonthEnd(selectedIds.value)
    progress.value = 100
    if (!res.errors.length) {
      toast.success('Month-End completed')
    } else {
      toast.error('Some jobs failed')
    }
    showDialog.value = false
    if (activeTab.value === 'custom') {
      loadCustomMonth()
    } else if (activeTab.value === 'history') {
      loadMonthData(lastSixMonths.value.find((m) => m.key === activeMonthTab.value)!)
    }
  } catch {
    toast.error('Failed to run Month-End')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  activeMonthTab.value = lastSixMonths.value[0].key
  loadMonthData(lastSixMonths.value[0])
  fetchMonthEndData()
})
</script>
