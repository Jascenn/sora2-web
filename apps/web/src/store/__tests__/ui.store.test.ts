/**
 * UI Store Tests
 *
 * Week 4: Testing Framework - Zustand Store Unit Tests
 */

import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../ui.store'

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useUIStore())
    act(() => {
      result.current.reset()
    })
  })

  describe('Theme Management', () => {
    it('should have default theme as system', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.theme).toBe('system')
    })

    it('should toggle theme between light and dark', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setTheme('light')
      })
      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })
      expect(result.current.theme).toBe('light')
    })

    it('should set specific theme', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('system')
      })
      expect(result.current.theme).toBe('system')
    })
  })

  describe('Sidebar Management', () => {
    it('should have sidebar closed by default', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.sidebarOpen).toBe(false)
    })

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.toggleSidebar()
      })
      expect(result.current.sidebarOpen).toBe(true)

      act(() => {
        result.current.toggleSidebar()
      })
      expect(result.current.sidebarOpen).toBe(false)
    })

    it('should set sidebar state directly', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.setSidebarOpen(true)
      })
      expect(result.current.sidebarOpen).toBe(true)

      act(() => {
        result.current.setSidebarOpen(false)
      })
      expect(result.current.sidebarOpen).toBe(false)
    })
  })

  describe('Modal Management', () => {
    it('should have all modals closed by default', () => {
      const { result } = renderHook(() => useUIStore())
      expect(result.current.modals.loginOpen).toBe(false)
      expect(result.current.modals.registerOpen).toBe(false)
      expect(result.current.modals.uploadOpen).toBe(false)
      expect(result.current.modals.creditRechargeOpen).toBe(false)
    })

    it('should open login modal', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.openModal('login')
      })
      expect(result.current.modals.loginOpen).toBe(true)
    })

    it('should close login modal', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.openModal('login')
      })
      expect(result.current.modals.loginOpen).toBe(true)

      act(() => {
        result.current.closeModal('login')
      })
      expect(result.current.modals.loginOpen).toBe(false)
    })

    it('should open multiple modals', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.openModal('login')
        result.current.openModal('upload')
      })
      expect(result.current.modals.loginOpen).toBe(true)
      expect(result.current.modals.uploadOpen).toBe(true)
    })

    it('should close all modals', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.openModal('login')
        result.current.openModal('register')
        result.current.openModal('upload')
      })

      act(() => {
        result.current.closeAllModals()
      })

      expect(result.current.modals.loginOpen).toBe(false)
      expect(result.current.modals.registerOpen).toBe(false)
      expect(result.current.modals.uploadOpen).toBe(false)
      expect(result.current.modals.creditRechargeOpen).toBe(false)
    })
  })

  describe('Notifications', () => {
    it('should toggle notifications', () => {
      const { result } = renderHook(() => useUIStore())

      act(() => {
        result.current.toggleNotifications()
      })
      expect(result.current.notificationsOpen).toBe(true)

      act(() => {
        result.current.toggleNotifications()
      })
      expect(result.current.notificationsOpen).toBe(false)
    })
  })

  describe('Store Reset', () => {
    it('should reset all state to defaults', () => {
      const { result } = renderHook(() => useUIStore())

      // Modify state
      act(() => {
        result.current.setTheme('dark')
        result.current.setSidebarOpen(true)
        result.current.openModal('login')
        result.current.toggleNotifications()
      })

      // Verify state changed
      expect(result.current.theme).toBe('dark')
      expect(result.current.sidebarOpen).toBe(true)
      expect(result.current.modals.loginOpen).toBe(true)
      expect(result.current.notificationsOpen).toBe(true)

      // Reset
      act(() => {
        result.current.reset()
      })

      // Verify reset to defaults
      expect(result.current.theme).toBe('system')
      expect(result.current.sidebarOpen).toBe(false)
      expect(result.current.modals.loginOpen).toBe(false)
      expect(result.current.notificationsOpen).toBe(false)
    })
  })
})
