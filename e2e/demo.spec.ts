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

test('graphics menu turns the expensive effects off, and remembers', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^skip$/i }).click({ timeout: 20_000 })

  await page.getByRole('button', { name: /graphics/i }).click()
  await expect(page.getByRole('switch', { name: /point cloud/i })).toHaveAttribute(
    'aria-checked',
    'true',
  )

  await page.getByRole('button', { name: /^low$/i }).click()
  for (const setting of [/point cloud/i, /shadows/i, /glass blur/i, /animation/i]) {
    await expect(page.getByRole('switch', { name: setting })).toHaveAttribute('aria-checked', 'false')
  }
  await expect(page.locator('.app')).toHaveAttribute('data-glass', 'off')
  await expect(page.locator('.app')).toHaveAttribute('data-motion', 'off')

  await page.keyboard.press('Escape')
  await expect(page.getByRole('switch', { name: /point cloud/i })).toHaveCount(0)

  // The choice survives a reload, and with animation off there is no sweep to sit through.
  await page.reload()
  await expect(page.getByRole('button', { name: /AI Reconstruct/ })).toBeEnabled({ timeout: 20_000 })
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await expect(page.locator('.app')).toHaveAttribute('data-glass', 'off')

  // Low quality is still the whole product: reconstruct and ask both work.
  await page.getByRole('button', { name: /AI Reconstruct/ }).click()
  await expect(page.getByText('Semantic twin')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Show me all the chairs.' }).click()
  await expect(page.locator('.reply')).toContainText(/chair/i)
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
