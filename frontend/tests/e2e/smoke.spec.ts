import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('the sign-in screen renders with the form a user needs', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /เข้าสู่ระบบ|sign in/i }).first()).toBeVisible()
  })

  test('the language switch changes the interface and survives a reload', async ({ page }) => {
    await page.goto('/login')

    const before = await page.locator('html').getAttribute('lang')
    const toggles = page.locator('button[aria-label*="English"], button:has-text("EN")')
    await expect(toggles.first()).toBeVisible()
    await toggles.first().click()

    await expect
      .poll(async () => page.locator('html').getAttribute('lang'), { timeout: 7_000 })
      .not.toBe(before)

    await page.reload()
    await expect
      .poll(async () => page.locator('html').getAttribute('lang'), { timeout: 7_000 })
      .not.toBe(before)
  })

  test('an unknown route falls back to the app shell, not a server error', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist')
    expect(response?.status() ?? 200).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  })
})
