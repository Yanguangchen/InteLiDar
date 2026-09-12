import { chromium } from '@playwright/test'
const OUT = '/tmp/claude-0/-home-user-InteLiDar/3eebd1e7-a77a-539e-a27a-758463145218/scratchpad/shots'
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errs = []
page.on('pageerror', (e) => errs.push(e.message))
await page.goto('http://127.0.0.1:4200/', { waitUntil: 'load' })

// The full demo path, against the production bundle + the real function.
await page.getByRole('button', { name: /^skip$/i }).click({ timeout: 20000 })
await page.getByRole('button', { name: /AI Reconstruct/ }).click({ timeout: 20000 })
await page.getByText('Semantic twin').waitFor({ timeout: 20000 })
await page.getByRole('button', { name: 'Show me all the chairs.' }).click()
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/vercel-sim.png` })

console.log('objects listed :', await page.locator('.object-row').count())
console.log('ask reply      :', await page.locator('.reply').innerText())
console.log('error banner   :', await page.locator('.error').count())
console.log('page errors    :', errs.length ? errs.join(' | ') : '(none)')
await browser.close()
