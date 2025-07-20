import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { DashboardStats } from '@/api/local/schemas'

export function useDashboard() {
  const authStore = useAuthStore()

  const userStats = computed((): DashboardStats | null => {
    if (!authStore.user) {
      return null
    }

    return {
      id: authStore.user.id,
      username: authStore.user.username,
      email: authStore.user.email,
      firstName: authStore.user.first_name,
      lastName: authStore.user.last_name,
      isActive: authStore.user.is_active,
      isStaff: authStore.user.is_staff,
    }
  })

  const isLoading = computed(() => authStore.isLoading)
  const hasUser = computed(() => !!authStore.user)

  return {
    userStats,
    isLoading,
    hasUser,
  }
}
