<template>
  <AppLayout>
    <div class="w-full h-full flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto p-0">
        <div class="max-w-5xl mx-auto py-6 px-2 md:px-8 h-full flex flex-col gap-6">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <Building2 class="w-7 h-7 text-indigo-400 animate-pulse" />
              Company Defaults
            </h1>
          </div>
          <div
            v-if="loading"
            class="flex flex-col items-center justify-center"
            style="height: 60vh"
          >
            <div class="flex items-center justify-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              Company defaults are still loading, please wait
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center" style="height: 60vh">
            <div class="grid grid-cols-3 gap-6 mb-6 w-full max-w-3xl">
              <button class="section-btn" @click="openSection('general')">
                <Settings class="w-12 h-12 mb-2" />
                <span>General</span>
              </button>
              <button class="section-btn" @click="openSection('google')">
                <FileText class="w-12 h-12 mb-2" />
                <span>Google Sheets</span>
              </button>
              <button class="section-btn" @click="openSection('xero')">
                <Link2 class="w-12 h-12 mb-2" />
                <span>Xero Integration</span>
              </button>
            </div>
            <div class="grid grid-cols-3 gap-6 w-full max-w-3xl">
              <button class="section-btn" @click="openSection('kpi')">
                <BarChart3 class="w-12 h-12 mb-2" />
                <span>KPI & Thresholds</span>
              </button>
              <button class="section-btn" @click="openSection('working_hours')">
                <Clock class="w-12 h-12 mb-2" />
                <span>Working Hours</span>
              </button>
              <button class="section-btn" @click="openAIProvidersDialog">
                <Sparkles class="w-12 h-12 mb-2" />
                <span>AI Providers</span>
              </button>
            </div>
          </div>
          <div class="flex justify-center mt-8">
            <Button
              type="button"
              variant="default"
              class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 flex items-center gap-2 text-base font-semibold rounded shadow"
              @click="saveAll"
            >
              <Save class="w-5 h-5" /> Save All
            </Button>
          </div>
          <SectionModal
            v-if="modalSection"
            :section="modalSection"
            :form="form"
            @close="closeSection"
            @update="onSectionUpdate"
          />
        </div>
      </div>
      <AIProvidersDialog
        v-if="showAIProvidersDialog"
        :providers="form.ai_providers || []"
        @close="closeAIProvidersDialog"
        @update:providers="onProvidersUpdate"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '../utils/debug'

import AppLayout from '../components/AppLayout.vue'
import { Button } from '../components/ui/button'
import { ref, onMounted } from 'vue'
import type { AIProvider } from '../services/admin-company-defaults-service'
import {
  Building2,
  Save,
  Settings,
  FileText,
  Link2,
  BarChart3,
  Sparkles,
  Clock,
} from 'lucide-vue-next'
import AIProvidersDialog from '../components/AIProvidersDialog.vue'
import SectionModal from '../components/SectionModal.vue'
import {
  getCompanyDefaults,
  updateCompanyDefaults,
  CompanyDefaults,
  PatchedCompanyDefaults,
} from '../services/admin-company-defaults-service'
import { toast } from 'vue-sonner'

const companyDefaults = ref<CompanyDefaults>({} as CompanyDefaults)
const form = ref<CompanyDefaults>({} as CompanyDefaults)
const loading = ref(true)
const showAIProvidersDialog = ref(false)
const modalSection = ref<string | null>(null)

debugLog('[AdminCompanyView] companyDefaults:', companyDefaults.value)
debugLog('[AdminCompanyView] form:', form.value)

function openAIProvidersDialog() {
  // Guard clause para garantir que ai_providers existe
  if (!form.value.ai_providers) {
    form.value.ai_providers = []
  }
  debugLog('[AdminCompanyView] openAIProvidersDialog, form.ai_providers:', form.value.ai_providers)
  showAIProvidersDialog.value = true
}
function closeAIProvidersDialog() {
  showAIProvidersDialog.value = false
}
async function fetchDefaults() {
  loading.value = true
  const data = await getCompanyDefaults()
  debugLog('[AdminCompanyView] getCompanyDefaults() result:', data)
  companyDefaults.value = data
  form.value = JSON.parse(JSON.stringify(data))
  debugLog('[AdminCompanyView] form after fetch:', form.value)
  loading.value = false
}
async function saveAll() {
  loading.value = true
  try {
    debugLog('[AdminCompanyView] saveAll() called with form.value:', form.value)
    debugLog('[AdminCompanyView] saveAll() AI providers specifically:', form.value.ai_providers)

    // Create a clean payload excluding read-only fields
    const payload: Partial<PatchedCompanyDefaults> = {
      company_name: form.value.company_name,
      ai_providers: form.value.ai_providers || [],
      is_primary: form.value.is_primary,
      time_markup: form.value.time_markup,
      materials_markup: form.value.materials_markup,
      charge_out_rate: form.value.charge_out_rate,
      wage_rate: form.value.wage_rate,
      starting_job_number: form.value.starting_job_number,
      starting_po_number: form.value.starting_po_number,
      po_prefix: form.value.po_prefix,
      master_quote_template_url: form.value.master_quote_template_url,
      master_quote_template_id: form.value.master_quote_template_id,
      gdrive_quotes_folder_url: form.value.gdrive_quotes_folder_url,
      gdrive_quotes_folder_id: form.value.gdrive_quotes_folder_id,
      xero_tenant_id: form.value.xero_tenant_id,
      mon_start: form.value.mon_start,
      mon_end: form.value.mon_end,
      tue_start: form.value.tue_start,
      tue_end: form.value.tue_end,
      wed_start: form.value.wed_start,
      wed_end: form.value.wed_end,
      thu_start: form.value.thu_start,
      thu_end: form.value.thu_end,
      fri_start: form.value.fri_start,
      fri_end: form.value.fri_end,
      last_xero_sync: form.value.last_xero_sync,
      last_xero_deep_sync: form.value.last_xero_deep_sync,
      shop_client_name: form.value.shop_client_name,
      billable_threshold_green: form.value.billable_threshold_green,
      billable_threshold_amber: form.value.billable_threshold_amber,
      daily_gp_target: form.value.daily_gp_target,
      shop_hours_target_percentage: form.value.shop_hours_target_percentage,
    }

    debugLog('[AdminCompanyView] saveAll() clean payload:', payload)

    await updateCompanyDefaults(payload)
    toast.success('Company defaults saved successfully!')
    await fetchDefaults()
  } catch (error) {
    debugLog('[AdminCompanyView] saveAll() error:', error)
    toast.error('Failed to save company defaults.')
  }
  loading.value = false
}
function onProvidersUpdate(providers: AIProvider[]) {
  debugLog('[AdminCompanyView] onProvidersUpdate called with:', providers)
  debugLog(
    '[AdminCompanyView] onProvidersUpdate, new providers:',
    providers.map((p) => ({
      name: p.name,
      default: p.default,
      id: p.id,
    })),
  )

  form.value.ai_providers = providers
  debugLog('[AdminCompanyView] form.value.ai_providers updated to:', form.value.ai_providers)
}
function openSection(section: string) {
  modalSection.value = section
}
function closeSection() {
  modalSection.value = null
}
function onSectionUpdate(newData: Partial<CompanyDefaults>) {
  Object.assign(form.value, newData)
}
onMounted(fetchDefaults)
</script>

<style scoped>
.section-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0.75rem;
  box-shadow: 0 2px 12px 0 rgba(80, 80, 120, 0.08);
  padding: 1.5rem;
  color: #3730a3;
  font-weight: 600;
  font-size: 1.125rem;
  transition:
    background 0.2s,
    transform 0.2s;
  min-width: 160px;
  min-height: 140px;
  border: none;
  outline: none;
  cursor: pointer;
}
.section-btn:hover,
.section-btn:focus {
  background: linear-gradient(135deg, #c7d2fe 0%, #e0e7ff 100%);
  transform: scale(1.05);
  box-shadow: 0 4px 24px 0 rgba(80, 80, 120, 0.13);
}
</style>
