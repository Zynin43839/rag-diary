import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * NFR-04 claims keyboard access and readable announcements. Until now that was
 * checked by hand, which means it was not checked at all on most pushes.
 *
 * Only serious and critical violations fail the build: minor ones are reported
 * by axe but would block every commit for cosmetic reasons.
 */
const BLOCKING = new Set(['serious', 'critical'])

const audit = async (page: Parameters<typeof AxeBuilder>[0]['page']) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const blocking = results.violations.filter((v) => BLOCKING.has(v.impact ?? ''))
  return blocking.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 3),
  }))
}

test('the sign-in page has no blocking accessibility violations', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()
  const blocking = await audit(page)
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
})

test('the sign-in page in English has no blocking accessibility violations', async ({ page }) => {
  await page.goto('/login')
  const toggle = page.locator('button[aria-label*="English"], button:has-text("EN")')
  if (await toggle.count()) {
    await toggle.first().click()
    await page.waitForTimeout(500)
  }
  const blocking = await audit(page)
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
})
