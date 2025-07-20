<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { type ErrorRecord } from '@/api/local/schemas'

const props = defineProps<{ error: ErrorRecord | null }>()
const emit = defineEmits(['close'])
</script>

<template>
  <Dialog :open="!!props.error" @update:open="emit('close')">
    <DialogContent class="max-w-lg space-y-4">
      <DialogHeader>
        <DialogTitle>Error Details</DialogTitle>
      </DialogHeader>
      <div v-if="props.error" class="space-y-2">
        <div class="text-sm text-muted-foreground">
          {{ new Date(props.error.timestamp).toLocaleString() }}
        </div>
        <div class="font-medium">{{ props.error.message }}</div>
        <div class="text-sm">Entity: {{ props.error.entity || '-' }}</div>
        <div class="text-sm">Severity: {{ props.error.severity || 'error' }}</div>
        <pre
          v-if="props.error.stack"
          class="bg-muted p-2 rounded text-xs overflow-auto whitespace-pre-wrap"
          >{{ props.error.stack }}</pre
        >
      </div>
      <div class="flex justify-end">
        <Button variant="outline" @click="emit('close')">Close</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
