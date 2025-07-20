<template>
  <nav
    class="bg-white border-b border-gray-200 px-3 sm:px-6 py-1 md:py-0.5 lg:py-3 xl:py-4 fixed top-0 left-0 right-0 z-50 transition-all duration-200"
  >
    <div class="flex items-center justify-between h-10 md:h-8 lg:h-auto">
      <div class="flex items-center">
        <button
          @click="toggleMobileMenu"
          class="lg:hidden mr-2 p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu v-if="!showMobileMenu" class="h-4 w-4" />
          <X v-else class="h-4 w-4" />
        </button>
        <router-link
          to="/kanban"
          class="text-sm md:text-sm lg:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          <LayoutDashboard class="inline w-5 h-5 mr-1 align-text-bottom" /> Jobs Manager
        </router-link>
      </div>

      <div class="hidden lg:flex items-center space-x-6">
        <router-link
          to="/jobs/create"
          class="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          <FilePlus class="w-4 h-4 mr-1" /> Create Job
        </router-link>

        <div class="relative group">
          <button
            @click="toggleDropdown('timesheets')"
            class="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 z-60"
          >
            <Calendar class="w-4 h-4" />
            <span>Timesheets</span>
            <ChevronDown class="w-4 h-4" />
          </button>

          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-95"
          >
            <div
              v-if="activeDropdown === 'timesheets'"
              class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-[60]"
            >
              <div class="py-1">
                <router-link
                  to="/timesheets/entry"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
                >
                  <PlusCircle class="w-4 h-4 mr-3" /> Entry & Management
                </router-link>
                <router-link
                  to="/timesheets/daily"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
                >
                  <Calendar class="w-4 h-4 mr-3" /> Daily Overview
                </router-link>
                <router-link
                  to="/timesheets/weekly"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
                >
                  <BarChart3 class="w-4 h-4 mr-3" /> Weekly Overview
                </router-link>
              </div>
            </div>
          </Transition>
        </div>

        <div class="relative" @click.stop>
          <button
            @click="toggleDropdown('purchases')"
            class="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-md duration-200"
          >
            <ShoppingCart class="w-4 h-4 mr-1" /> Purchases
            <ChevronDown class="ml-1 h-4 w-4" />
          </button>
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-95"
          >
            <div
              v-if="activeDropdown === 'purchases'"
              class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-[60]"
            >
              <RouterLink
                to="/purchasing/po"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <FileText class="w-4 h-4 mr-2" /> Purchase Orders
              </RouterLink>
              <RouterLink
                to="/purchasing/receipts"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Package class="w-4 h-4 mr-2" /> Delivery Receipts
              </RouterLink>
              <RouterLink
                to="/purchasing/stock"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Box class="w-4 h-4 mr-2" /> Use Stock
              </RouterLink>
              <RouterLink
                to="/purchasing/pricing"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <UploadCloud class="w-4 h-4 mr-2" /> Upload Supplier Pricing
              </RouterLink>
              <RouterLink
                to="/purchasing/mappings"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <FileText class="w-4 h-4 mr-2" /> Product Mappings
              </RouterLink>
            </div>
          </Transition>
        </div>
        <router-link
          to="/xero"
          class="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          <Link2 class="w-4 h-4 mr-1" /> Xero
        </router-link>

        <div class="relative" @click.stop>
          <button
            @click="toggleDropdown('reports')"
            class="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-md duration-200"
          >
            <BarChart3 class="w-4 h-4 mr-1" /> Reports
            <ChevronDown class="ml-1 h-4 w-4" />
          </button>
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-95"
          >
            <div
              v-if="activeDropdown === 'reports'"
              class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[60]"
            >
              <router-link
                to="/reports/kpi"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <BarChart3 class="w-4 h-4 mr-2" /> KPI Reports
              </router-link>
              <router-link
                to="/reports/job-aging"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Clock class="w-4 h-4 mr-2" /> Job Aging Report
              </router-link>
              <router-link
                to="/reports/staff-performance"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Users class="w-4 h-4 mr-2" /> Staff Performance
              </router-link>
            </div>
          </Transition>
        </div>

        <div class="relative" @click.stop v-if="userInfo.is_staff">
          <button
            @click="toggleDropdown('admin')"
            class="flex items-center text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-md duration-200"
          >
            <Settings class="w-4 h-4 mr-1" /> Admin
            <ChevronDown class="ml-1 h-4 w-4" />
          </button>
          <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-2 scale-95"
          >
            <div
              v-if="activeDropdown === 'admin'"
              class="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-[60]"
            >
              <router-link
                to="/admin/staff"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Users class="w-4 h-4 mr-2" /> Staff
              </router-link>
              <router-link
                to="/admin/company"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Building2 class="w-4 h-4 mr-2" /> Company
              </router-link>
              <router-link
                to="/admin/archive-jobs"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Archive class="w-4 h-4 mr-2" /> Archive Jobs
              </router-link>
              <router-link
                to="/admin/month-end"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <CalendarClock class="w-4 h-4 mr-2" /> Month-End
              </router-link>
              <router-link
                to="/admin/errors"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <X class="w-4 h-4 mr-2" /> App Errors
              </router-link>
              <router-link
                to="/admin/django-jobs"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Cog class="w-4 h-4 mr-2" /> Django Jobs
              </router-link>
              <router-link
                to="/admin/ai-providers"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Brain class="w-4 h-4 mr-2" /> AI Providers
              </router-link>
              <router-link
                to="/admin/uat"
                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-all"
              >
                <Server class="w-4 h-4 mr-2" /> Manage UAT
              </router-link>
            </div>
          </Transition>
        </div>
      </div>

      <div class="flex items-center">
        <div class="hidden md:flex lg:hidden items-center space-x-2">
          <span class="text-gray-700 text-xs">{{ userInfo.displayName?.split(' ')[0] }}</span>
          <button
            @click="handleLogout"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-xs transition-colors"
          >
            Logout
          </button>
        </div>

        <div class="hidden lg:flex items-center space-x-4">
          <span class="text-gray-700 text-sm">Welcome, {{ userInfo.displayName }}!</span>
          <button
            @click="handleLogout"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
          >
            Log out
          </button>
        </div>

        <div class="flex md:hidden items-center">
          <span class="text-gray-700 text-xs mr-2">{{ userInfo.displayName?.split(' ')[0] }}</span>
          <button
            @click="handleLogout"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform -translate-y-2"
      enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform -translate-y-2"
    >
      <div
        v-if="showMobileMenu"
        class="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-[60]"
      >
        <div class="px-4 py-4 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-1 gap-3">
            <div class="space-y-3">
              <router-link
                to="/jobs/create"
                class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                @click="closeMobileMenu"
                >Create Job</router-link
              >
              <router-link
                to="/timesheets/entry"
                class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                @click="closeMobileMenu"
                >Timesheet Entry</router-link
              >
              <router-link
                to="/timesheets/daily"
                class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                @click="closeMobileMenu"
                >Daily Overview</router-link
              >
              <router-link
                to="/xero"
                class="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                @click="closeMobileMenu"
                >Xero</router-link
              >
            </div>

            <div class="border-t border-gray-200"></div>

            <div class="space-y-2">
              <div class="bg-gray-50 rounded-md">
                <button
                  @click="toggleMobileSection('purchases')"
                  class="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Purchases
                  <ChevronDown
                    :class="[
                      'h-4 w-4 transition-transform duration-200',
                      mobileSections.purchases ? 'rotate-180' : '',
                    ]"
                  />
                </button>
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-40"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 max-h-40"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="mobileSections.purchases" class="overflow-hidden">
                    <div class="px-3 pb-2 space-y-1">
                      <RouterLink
                        to="/purchasing/po"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Purchase Orders</RouterLink
                      >
                      <RouterLink
                        to="/purchasing/receipts"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Delivery Receipts</RouterLink
                      >
                      <RouterLink
                        to="/purchasing/stock"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Use Stock</RouterLink
                      >
                      <RouterLink
                        to="/purchasing/pricing"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Upload Supplier Pricing</RouterLink
                      >
                      <RouterLink
                        to="/purchasing/mappings"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Product Mappings</RouterLink
                      >
                    </div>
                  </div>
                </Transition>
              </div>

              <div class="bg-gray-50 rounded-md">
                <button
                  @click="toggleMobileSection('reports')"
                  class="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Reports
                  <ChevronDown
                    :class="[
                      'h-4 w-4 transition-transform duration-200',
                      mobileSections.reports ? 'rotate-180' : '',
                    ]"
                  />
                </button>
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-40"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 max-h-40"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="mobileSections.reports" class="overflow-hidden">
                    <div class="px-3 pb-2 space-y-1">
                      <router-link
                        to="/reports/kpi"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >KPI Reports</router-link
                      >
                      <router-link
                        to="/reports/job-aging"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Job Aging Report</router-link
                      >
                      <router-link
                        to="/reports/staff-performance"
                        class="block px-2 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        @click="closeMobileMenu"
                        >Staff Performance</router-link
                      >
                    </div>
                  </div>
                </Transition>
              </div>

              <div class="bg-gray-50 rounded-md" v-if="userInfo.is_staff">
                <button
                  @click="toggleMobileSection('admin')"
                  class="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Admin
                  <ChevronDown :class="[mobileSections.admin ? 'rotate-180' : '']" />
                </button>
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 max-h-0"
                  enter-to-class="opacity-100 max-h-40"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-to-class="opacity-0 max-h-0"
                >
                  <div v-if="mobileSections.admin" class="overflow-hidden">
                    <router-link
                      to="/admin/staff"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      Staff
                    </router-link>
                    <router-link
                      to="/admin/company"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      Company
                    </router-link>
                    <router-link
                      to="/admin/archive-jobs"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      Archive Jobs
                    </router-link>
                    <router-link
                      to="/admin/month-end"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      Month-End
                    </router-link>
                    <router-link
                      to="/admin/errors"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      App Errors
                    </router-link>
                    <router-link
                      to="/admin/django-jobs"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      Django Jobs
                    </router-link>
                    <router-link
                      to="/admin/ai-providers"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      AI Providers
                    </router-link>
                    <router-link
                      to="/admin/uat"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      @click="closeMobileMenu"
                    >
                      Manage UAT
                    </router-link>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  ChevronDown,
  Menu,
  X,
  Calendar,
  PlusCircle,
  BarChart3,
  LayoutDashboard,
  FilePlus,
  ShoppingCart,
  FileText,
  Package,
  Box,
  UploadCloud,
  Link2,
  Settings,
  Users,
  Building2,
  Archive,
  CalendarClock,
  Clock,
  Server,
  Cog,
  Brain,
} from 'lucide-vue-next'
import { useAppLayout } from '@/composables/useAppLayout'

const activeDropdown = ref<string | null>(null)
const showMobileMenu = ref(false)
const mobileSections = ref({
  purchases: false,
  reports: false,
  admin: false,
})

const { userInfo, handleLogout } = useAppLayout()

const toggleDropdown = (dropdown: string) => {
  activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  if (!showMobileMenu.value) {
    mobileSections.value = {
      purchases: false,
      reports: false,
      admin: false,
    }
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  mobileSections.value = {
    purchases: false,
    reports: false,
    admin: false,
  }
}

const toggleMobileSection = (section: 'purchases' | 'reports' | 'admin') => {
  mobileSections.value[section] = !mobileSections.value[section]
}

let clickHandler: ((e: MouseEvent) => void) | null = null

onMounted(() => {
  clickHandler = (e: MouseEvent) => {
    const dropdowns = document.querySelectorAll('.absolute, .z-60')
    let insideDropdown = false
    dropdowns.forEach((el) => {
      if (el.contains(e.target as Node)) insideDropdown = true
    })
    if (!insideDropdown) activeDropdown.value = null
  }
  document.addEventListener('click', clickHandler)
})

onUnmounted(() => {
  if (clickHandler) document.removeEventListener('click', clickHandler)
})
</script>
