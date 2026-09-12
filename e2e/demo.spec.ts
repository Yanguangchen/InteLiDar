import { expect, test } from '@playwright/test'

test('demo path: reconstruct, ask chairs, then enable edit', async ({ page }) => {
  await page.goto('/')

  const reconstruct = page.getByRole('button', { name: /AI Reconstruct/ })
  await expect(reconstruct).toBeEnabled({ timeout: 20_000 })
  await expect(page.getByText('Raw mesh')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()

  await reconstruct.click()
  await expect(page.getByText('Semantic twin')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('textbox', { name: /ask the spatial assistant/i })).toBeEnabled()

  await page.getByRole('button', { name: 'Show me all the chairs.' }).click()
  await expect(page.locator('.reply')).toContainText(/chair/i)

  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('button', { name: 'Editing' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(/drag tables, chairs, and equipment/i)).toBeVisible()
})
