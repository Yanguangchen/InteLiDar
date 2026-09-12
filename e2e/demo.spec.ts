import { expect, test } from '@playwright/test'

test('demo path: sweep, reconstruct, ask chairs, then enable edit', async ({ page }) => {
  await page.goto('/')

  // The sensor sweeps before anything can be reconstructed.
  const meter = page.getByRole('progressbar', { name: /lidar capture/i })
  await expect(meter).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('LiDAR capture')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: /^skip$/i }).click()

  const reconstruct = page.getByRole('button', { name: /AI Reconstruct/ })
  await expect(reconstruct).toBeEnabled({ timeout: 20_000 })
  await expect(page.getByText('Raw mesh')).toBeVisible()
  await expect(meter).toHaveCount(0)

  await reconstruct.click()
  await expect(page.getByText('Semantic twin')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('textbox', { name: /ask the spatial assistant/i })).toBeEnabled()

  await page.getByRole('button', { name: 'Show me all the chairs.' }).click()
  await expect(page.locator('.reply')).toContainText(/chair/i)
  await expect(page.getByRole('button', { name: /Chair/ }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('button', { name: 'Editing' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/drag tables, chairs, and equipment/i)).toBeVisible()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('hands over the finished scan without playing the sweep', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('button', { name: /AI Reconstruct/ })).toBeEnabled({
      timeout: 20_000,
    })
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    await expect(page.getByText('Raw mesh')).toBeVisible()
  })
})
