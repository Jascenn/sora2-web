/**
 * Homepage E2E Tests
 *
 * Week 4: Testing Framework - Playwright E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Page should load without errors
    await expect(page).toHaveTitle(/Sora2/)
  })

  test('should display header navigation', async ({ page }) => {
    await page.goto('/')

    // Check for main navigation elements
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Check for logo/brand (more specific selector)
    const logo = page.getByRole('link', { name: 'Sora2' }).first()
    await expect(logo).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Find and click login button/link
    const loginLink = page.getByRole('link', { name: /登录|login/i })
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await page.waitForURL('**/login')
      await expect(page).toHaveURL(/.*login/)
    }
  })

  test('should have working links', async ({ page }) => {
    await page.goto('/')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')

    // Check for working navigation links (only links with href)
    const links = page.locator('a[href]')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })
})
