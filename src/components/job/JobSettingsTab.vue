<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Job Settings</h2>
      </div>
    </div>

    <!-- Circular Layout Container -->
    <div class="flex-1 flex items-center justify-center -mt-8">
      <div class="relative w-[400px] h-[320px] sm:w-[500px] sm:h-[320px]">
        <!-- Button Container: Job Settings (Top Center) -->
        <div
          class="absolute flex flex-col items-center"
          style="top: -10px; left: 50%; transform: translateX(-50%)"
        >
          <button
            @click="$emit('open-settings')"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-105"
          >
            <Settings class="w-7 h-7" />
          </button>
          <div class="text-center mt-2">
            <span class="block text-sm font-semibold text-gray-700 whitespace-nowrap"
              >Job Settings</span
            >
            <span class="block text-xs text-gray-500">Configure details</span>
          </div>
        </div>

        <!-- Button Container: Workflow (Top Right) -->
        <div
          class="absolute flex flex-col items-center"
          style="top: 20%; right: 0; transform: translateY(-50%)"
        >
          <button
            @click="$emit('open-workflow')"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-105"
          >
            <Wrench class="w-7 h-7" />
          </button>
          <div class="text-center mt-2">
            <span class="block text-sm font-semibold text-gray-700 whitespace-nowrap"
              >Workflow</span
            >
            <span class="block text-xs text-gray-500">Manage status</span>
          </div>
        </div>

        <!-- Button Container: History (Bottom Right) -->
        <div
          class="absolute flex flex-col items-center"
          style="bottom: 20%; right: 0; transform: translateY(50%)"
        >
          <button
            @click="$emit('open-history')"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-105"
          >
            <BookOpen class="w-7 h-7" />
          </button>
          <div class="text-center mt-2">
            <span class="block text-sm font-semibold text-gray-700 whitespace-nowrap">History</span>
            <span class="block text-xs text-gray-500">View event logs</span>
          </div>
        </div>

        <!-- Button Container: Attachments (Bottom Center) -->
        <div
          class="absolute flex flex-col items-center"
          style="bottom: -10px; left: 50%; transform: translateX(-50%)"
        >
          <button
            @click="$emit('open-attachments')"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-105"
          >
            <Paperclip class="w-7 h-7" />
          </button>
          <div class="text-center mt-2">
            <span class="block text-sm font-semibold text-gray-700 whitespace-nowrap"
              >Attachments</span
            >
            <span class="block text-xs text-gray-500">Manage files</span>
          </div>
        </div>

        <!-- Button Container: Print Job (Bottom Left) -->
        <div
          class="absolute flex flex-col items-center"
          style="bottom: 20%; left: 0; transform: translateY(50%)"
        >
          <button
            @click="$emit('open-pdf')"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-105"
          >
            <Printer class="w-7 h-7" />
          </button>
          <div class="text-center mt-2">
            <span class="block text-sm font-semibold text-gray-700 whitespace-nowrap"
              >Print Job</span
            >
            <span class="block text-xs text-gray-500">Generate PDF</span>
          </div>
        </div>

        <!-- Button Container: Quoting Chat (Top Left) -->
        <div
          class="absolute flex flex-col items-center"
          style="top: 20%; left: 0; transform: translateY(-50%)"
        >
          <button
            @click="openQuotingChat"
            class="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-gray-200 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg hover:scale-105"
          >
            <MessageCircle class="w-7 h-7" />
          </button>
          <div class="text-center mt-2">
            <span class="block text-sm font-semibold text-gray-700 whitespace-nowrap"
              >Quoting Chat</span
            >
            <span class="block text-xs text-gray-500">AI assistant</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Settings, Wrench, BookOpen, Paperclip, Printer, MessageCircle } from 'lucide-vue-next'

interface JobSettingsTabProps {
  jobData: {
    id: string
    name: string
    job_number: number
    client_name: string
  }
}

interface JobSettingsTabEmits {
  (e: 'open-settings'): void
  (e: 'open-workflow'): void
  (e: 'open-history'): void
  (e: 'open-attachments'): void
  (e: 'open-pdf'): void
}

const props = defineProps<JobSettingsTabProps>()
defineEmits<JobSettingsTabEmits>()

const router = useRouter()

function openQuotingChat() {
  router.push({
    name: 'QuotingChatView',
    query: {
      jobId: props.jobData.id,
      jobName: props.jobData.name,
      jobNumber: props.jobData.job_number.toString(),
      clientName: props.jobData.client_name,
    },
  })
}
</script>
