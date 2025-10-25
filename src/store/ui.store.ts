import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  notificationsOpen: boolean
  modals: {
    loginOpen: boolean
    registerOpen: boolean
    uploadOpen: boolean
    creditRechargeOpen: boolean
  }
}

interface UIActions {
  setTheme: (theme: UIState['theme']) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleNotifications: () => void
  setNotificationsOpen: (open: boolean) => void
  openModal: (modal: string) => void
  closeModal: (modal: string) => void
  closeAllModals: () => void
  reset: () => void
}

type UIStore = UIState & UIActions

const initialModals: UIState['modals'] = {
  loginOpen: false,
  registerOpen: false,
  uploadOpen: false,
  creditRechargeOpen: false,
}

const initialState: UIState = {
  theme: 'system',
  sidebarOpen: false,
  notificationsOpen: false,
  modals: initialModals,
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // State
      ...initialState,

      // Actions
      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleNotifications: () =>
        set((state) => ({ notificationsOpen: !state.notificationsOpen })),

      setNotificationsOpen: (open) => set({ notificationsOpen: open }),

      openModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [`${modal}Open` as keyof UIState['modals']]: true },
        })),

      closeModal: (modal) =>
        set((state) => ({
          modals: { ...state.modals, [`${modal}Open` as keyof UIState['modals']]: false },
        })),

      closeAllModals: () =>
        set({
          modals: initialModals,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
