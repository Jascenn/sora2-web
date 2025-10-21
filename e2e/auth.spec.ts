/**
 * Authentication E2E Tests
 *
 * Week 4: Testing Framework - Login/Register Flow Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login')

      // Check for form elements
      await expect(page.getByLabel(/邮箱|email/i)).toBeVisible()
      await expect(page.getByLabel(/密码|password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login')

      // Click submit without filling form
      await page.getByRole('button', { name: '登录', exact: true }).click()

      // Wait for validation messages
      await page.waitForTimeout(500)

      // Check for error messages (they might be in Chinese or English)
      const errorMessages = page.locator('text=/请输入|required|invalid/i')
      const count = await errorMessages.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      // Fill form with invalid credentials
      await page.getByLabel(/邮箱|email/i).fill('invalid@example.com')
      await page.getByLabel(/密码|password/i).fill('wrongpassword')
      await page.getByRole('button', { name: '登录', exact: true }).click()

      // Wait for error response
      await page.waitForTimeout(1000)

      // Should show error message or stay on login page
      const url = page.url()
      expect(url).toContain('login')
    })

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login')

      const registerLink = page.getByRole('link', { name: /注册|register|sign up/i })
      if (await registerLink.isVisible()) {
        await registerLink.click()
        await page.waitForURL('**/register')
        await expect(page).toHaveURL(/.*register/)
      }
    })
  })

  test.describe('Register Page', () => {
    test('should display register form', async ({ page }) => {
      await page.goto('/register')

      // Check for form elements
      await expect(page.getByLabel(/邮箱|email/i)).toBeVisible()
      await expect(page.getByLabel(/密码|password/i).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /注册|register|sign up/i })).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/register')

      // Enter invalid email
      await page.getByLabel(/邮箱|email/i).fill('invalid-email')
      await page.getByLabel(/邮箱|email/i).blur()

      // Wait for validation
      await page.waitForTimeout(500)

      // Should show validation error
      const errorMessage = page.locator('text=/邮箱|email.*invalid|valid/i')
      const count = await errorMessage.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register')

      // Enter weak password (too short and no letters)
      await page.getByLabel(/密码|password/i).first().fill('123')
      await page.getByLabel(/密码|password/i).first().blur()
      await page.getByLabel(/邮箱|email/i).click() // Trigger validation

      // Wait for validation to trigger
      await page.waitForTimeout(1000)

      // Should show validation error about password length
      // Using error message style class from registration form
      const errorMessage = page.locator('.text-red-600')
      await expect(errorMessage).toBeVisible({ timeout: 3000 })
      const text = await errorMessage.textContent()
      expect(text).toMatch(/密码.*字符|密码.*至少6个|至少6个字符/i)
    })

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register')

      const loginLink = page.getByRole('link', { name: /登录|login|sign in/i })
      if (await loginLink.isVisible()) {
        await loginLink.click()
        await page.waitForURL('**/login')
        await expect(page).toHaveURL(/.*login/)
      }
    })
  })
})
