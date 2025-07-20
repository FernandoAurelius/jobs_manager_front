<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// Use generated XeroError type from Zodios API
type XeroError = z.infer<typeof schemas.XeroError>

const props = defineProps<{
  errors: XeroError[]
  loading: boolean
  page: number
  pageCount: number
}>()
const emit = defineEmits(['rowClick', 'update:page'])

function onRowClick(record: XeroError) {
  emit('rowClick', record)
}
</script>

<template>
  <div class="border rounded-md overflow-hidden">
    <div class="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Severity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="props.loading">
            <TableCell colspan="4" class="text-center py-6">
              <div class="flex items-center justify-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Error records are still loading, please wait
              </div>
            </TableCell>
          </TableRow>
          <TableRow
            v-for="err in props.errors"
            :key="err.id"
            class="cursor-pointer hover:bg-accent"
            @click="onRowClick(err)"
          >
            <TableCell>{{ new Date(err.timestamp).toLocaleString() }}</TableCell>
            <TableCell>{{ err.message }}</TableCell>
            <TableCell>{{ err.entity || '-' }}</TableCell>
            <TableCell>{{ err.severity || 'error' }}</TableCell>
          </TableRow>
          <TableRow v-if="!props.loading && props.errors.length === 0">
            <TableCell colspan="4" class="text-center py-6"
              >No errors found for the current filters.</TableCell
            >
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <Pagination
      class="mt-2"
      :page="props.page"
      :total="props.pageCount"
      @update:page="emit('update:page', $event)"
    />
  </div>
</template>
