<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Job Attachments</DialogTitle>
      </DialogHeader>

      <div class="space-y-6">
        <div>
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            @click="triggerFileInput"
          >
            <div class="flex flex-col items-center">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="mt-4">
                <p class="text-sm text-gray-600">
                  <span class="font-medium text-indigo-600 hover:text-indigo-500">
                    Click to upload
                  </span>
                  or drag and drop
                </p>
                <p class="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            @change="handleFileChange"
            accept="image/*,.pdf,.doc,.docx,.txt"
            class="hidden"
          />
        </div>

        <div>
          <button
            @click="openCameraModal"
            :disabled="!props.jobNumber"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              ></path>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              ></path>
            </svg>
            Capture Photo
          </button>
        </div>

        <div v-if="uploadProgress > 0 && uploadProgress < 100">
          <div class="bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-1">Uploading... {{ uploadProgress }}%</p>
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <!-- Show thumbnail if available -->
                <img
                  v-if="file.thumbnail_url"
                  :src="file.thumbnail_url"
                  :alt="file.filename"
                  class="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80"
                  @click="openImagePreview(file)"
                  @error="onImageError"
                />
                <!-- Show image preview if it's an image file but no thumbnail -->
                <img
                  v-else-if="isImageJobFile(file) && file.download_url"
                  :src="file.download_url"
                  :alt="file.filename"
                  class="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80"
                  @click="openImagePreview(file)"
                  @error="onImageError"
                />
                <!-- Show file icon for other files -->
                <div v-else class="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
                  <svg
                    v-if="isPdfFile(file)"
                    class="w-6 h-6 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M4 18h12V6l-4-4H4v16zm8-14v2h2l-2-2z" />
                  </svg>
                  <svg
                    v-else
                    class="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ file.filename }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatFileSize(file.size || 0) }} • {{ formatDate(file.uploaded_at) }}
                </p>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <label class="flex items-center">
                <input
                  v-model="file.print_on_jobsheet"
                  @change="updatePrintSetting(file)"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200/50"
                />
                <span class="ml-2 text-xs text-gray-600">Print</span>
              </label>

              <button
                @click="downloadFile(file)"
                class="text-indigo-600 hover:text-indigo-900 text-sm"
                title="Download"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
              </button>

              <button
                @click="deleteFile(file.id)"
                class="text-red-600 hover:text-red-900 text-sm"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="files.length === 0 && !isLoading" class="text-center py-8">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by uploading a file.</p>
          </div>

          <div v-if="files.length === 0 && isLoading" class="text-center py-8">
            <div class="flex flex-col items-center gap-2">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p class="text-sm text-gray-500">Loading job attachments, please wait</p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          @click="closeModal"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Image Preview Modal -->
  <Dialog :open="isImagePreviewOpen" @update:open="closeImagePreview">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-auto">
      <DialogHeader>
        <DialogTitle>{{ previewImage?.filename }}</DialogTitle>
      </DialogHeader>
      <div class="flex justify-center items-center p-4">
        <img
          v-if="previewImage"
          :src="previewImage.thumbnail_url || previewImage.download_url"
          :alt="previewImage.filename"
          class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
        />
      </div>
      <DialogFooter>
        <button
          @click="downloadFile(previewImage!)"
          type="button"
          class="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Download
        </button>
        <button
          @click="closeImagePreview"
          type="button"
          class="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Close
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <CameraModal
    :is-open="isCameraModalOpen"
    @close="closeCameraModal"
    @photo-captured="handlePhotoCaptured"
  />
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, onMounted, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import CameraModal from './CameraModal.vue'
import { schemas } from '@/api/generated/api'
import { jobService } from '@/services/job.service'
import { z } from 'zod'

type JobFile = z.infer<typeof schemas.JobFile>

const props = defineProps<{
  jobId: string
  jobNumber: number | undefined
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  'file-uploaded': [file: JobFile]
  'file-deleted': [fileId: string]
}>()

const files = ref<JobFile[]>([])
const uploadProgress = ref(0)
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const isLoading = ref(false)
const isCameraModalOpen = ref(false)

async function loadFiles() {
  if (!props.jobNumber) {
    debugLog('Job number is required for loading files')
    return
  }

  isLoading.value = true
  try {
    const list = await jobService.listJobFiles(String(props.jobNumber))
    files.value = list
  } catch (err) {
    debugLog('Failed to load files:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.jobNumber != null) {
      loadFiles()
    }
  },
)

const closeModal = () => {
  emit('close')
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

const handleFiles = async (fileList: File[]) => {
  for (const file of fileList) {
    if (file.size === 0) {
      debugLog(`File ${file.name} has 0 bytes and will be ignored`)
      continue
    }

    await processAndUploadFile(file)
  }
}

const processAndUploadFile = async (file: File) => {
  try {
    let fileToUpload = file

    if (isImageFile(file)) {
      debugLog(`Compressing image before upload: ${file.name}`)
      fileToUpload = await compressImage(file)
    }

    await uploadFile(fileToUpload)
  } catch (err) {
    debugLog(`Error processing file ${file.name}:`, err)
  }
}

const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

const compressImage = (
  file: File,
  maxWidth = 1280,
  maxHeight = 960,
  quality = 0.7,
): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const scaleWidth = maxWidth / width
          const scaleHeight = maxHeight / height
          const scaleFactor = Math.min(scaleWidth, scaleHeight)

          width = Math.floor(width * scaleFactor)
          height = Math.floor(height * scaleFactor)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })

            debugLog(`Image compressed: ${file.name}
              Original: ${(file.size / 1024 / 1024).toFixed(2)}MB
              Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

            resolve(compressedFile)
          },
          'image/jpeg',
          quality,
        )
      }
    }
  })
}

const uploadFile = async (file: File) => {
  if (!props.jobNumber) {
    debugLog('Job number is required for file upload')
    return
  }

  uploadProgress.value = 0
  uploading.value = true

  try {
    const uploaded = await jobService.uploadJobFiles(String(props.jobNumber), [file])

    if (uploaded.length > 0) {
      files.value.push(...uploaded)
      emit('file-uploaded', uploaded[0])
    }

    await loadFiles()
  } catch (err) {
    debugLog('Error uploading file:', err)
  } finally {
    uploadProgress.value = 0
    uploading.value = false
  }
}

function downloadFile(file: JobFile) {
  const apiBase = import.meta.env.VITE_API_BASE_URL
  const url = `${apiBase}/rest/jobs/files/${encodeURIComponent(file.id)}/`
  window.open(url, '_blank')
}

async function deleteFile(id: string) {
  if (!confirm('Are you sure you want to delete this file?')) return

  try {
    await jobService.deleteJobFile(id)
    emit('file-deleted', id)
    await loadFiles()
  } catch (err) {
    debugLog('Error deleting file:', err)
  }
}

async function updatePrintSetting(file: JobFile) {
  if (!props.jobNumber) {
    debugLog('Job number is required for updating print setting')
    return
  }

  debugLog('Updating print setting for file:', {
    filename: file.filename,
    current_value: file.print_on_jobsheet,
    job_number: props.jobNumber,
  })

  try {
    const response = await jobService.updateJobFile({
      file_id: file.id,
      print_on_jobsheet: file.print_on_jobsheet,
    })

    debugLog('Print setting update response:', response)

    await loadFiles()
  } catch (err) {
    debugLog('Error updating print setting:', err)

    file.print_on_jobsheet = !file.print_on_jobsheet
  }
}

const openCameraModal = () => {
  if (!props.jobNumber) {
    debugLog('Job number is required for camera capture')
    return
  }
  isCameraModalOpen.value = true
}

const closeCameraModal = () => {
  isCameraModalOpen.value = false
}

const handlePhotoCaptured = async (photo: File) => {
  try {
    debugLog('Photo captured:', {
      name: photo.name,
      size: `${(photo.size / 1024 / 1024).toFixed(2)}MB`,
      type: photo.type,
    })

    await processAndUploadFile(photo)

    debugLog('Photo uploaded successfully!')
  } catch (err) {
    debugLog('Error uploading captured photo:', err)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

// Helper functions for file types
const isImageJobFile = (file: JobFile): boolean => {
  return file.mime_type?.startsWith('image/') || false
}

const isPdfFile = (file: JobFile): boolean => {
  return file.mime_type === 'application/pdf'
}

// Image preview modal
const previewImage = ref<JobFile | null>(null)
const isImagePreviewOpen = ref(false)

const openImagePreview = (file: JobFile) => {
  previewImage.value = file
  isImagePreviewOpen.value = true
}

const closeImagePreview = () => {
  previewImage.value = null
  isImagePreviewOpen.value = false
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // Hide broken image by setting a placeholder
  img.style.display = 'none'
}

onMounted(() => {
  if (props.isOpen) {
    loadFiles()
  }
})
</script>
