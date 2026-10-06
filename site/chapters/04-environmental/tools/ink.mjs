// Team ENV review aid (run by hand): the rendered stroke-under-label check for Fig. 6 (the generator's clearance check,
// measured in pixels). Per viewport and state: note each visible in-plot label's box, hide every label, screenshot the
// plate at 2×, and count the pixels inside each box that differ from the plate ground (any trace, axis or leader).
// Every count must be 0.   node chapters/04-environmental/tools/ink.mjs [--base=http://localhost:8080/] [--theme=dark]
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const base = (args.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const dark = args.includes('--theme=dark')
const VPS = [[1440, 900], [1280, 720], [768, 1024], [412, 915], [390, 844], [360, 740], [320, 568]]
const b = await chromium.launch()
let fails = 0
for (const [w, h] of VPS) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: dark ? 'dark' : 'light' })
  const p = await ctx.newPage()
  await p.goto(base + 'dev-environmental.html?hud=0', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready)
  const row = []
  for (const s of ['sample', 'std', 'spike']) {
    await p.evaluate((s) => document.querySelector(`#fig-chromatogram [data-set="${s}"]`).click(), s)
    await p.waitForTimeout(60)
    const boxes = await p.evaluate(() => {
      const fig = document.getElementById('fig-chromatogram'), pr = fig.querySelector('.plate').getBoundingClientRect()
      const vis = (el) => { for (let e = el; e && e !== fig; e = e.parentElement) { const c = getComputedStyle(e); if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity === 0) return false } return true }
      return [...fig.querySelectorAll('.lb i')].filter(vis).map((el) => { const r = el.getBoundingClientRect(); return { t: el.textContent, x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height } })
    })
    await p.addStyleTag({ content: '#fig-chromatogram .lb,#fig-chromatogram .corner{visibility:hidden!important}' })
    const png = (await p.locator('#fig-chromatogram .plate').screenshot()).toString('base64')
    const counts = await p.evaluate(async ({ png, boxes }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode()
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      const g = c.getContext('2d'); g.drawImage(img, 0, 0)
      const d = g.getImageData(0, 0, c.width, c.height).data, at = (x, y) => (y * c.width + x) * 4
      const g0 = [d[at(4, c.height >> 1)], d[at(4, c.height >> 1) + 1], d[at(4, c.height >> 1) + 2]] // plate ground, left edge
      return boxes.map((bx) => {
        let n = 0
        for (let y = Math.ceil(bx.y * 2 + 1); y < Math.floor((bx.y + bx.h) * 2 - 1); y++) for (let x = Math.ceil(bx.x * 2 + 1); x < Math.floor((bx.x + bx.w) * 2 - 1); x++) {
          const i = at(x, y); if (Math.abs(d[i] - g0[0]) + Math.abs(d[i + 1] - g0[1]) + Math.abs(d[i + 2] - g0[2]) > 60) n++
        }
        return [bx.t, n]
      })
    }, { png, boxes })
    await p.evaluate(() => document.querySelectorAll('style').forEach((s) => { if (s.textContent.includes('.lb,#fig-chromatogram .corner{visibility')) s.remove() }))
    const bad = counts.filter(([, n]) => n)
    fails += bad.length
    row.push(`${s}: ${counts.length} labels, ${bad.length ? 'INK ' + bad.map(([t, n]) => `"${t}" ${n}`).join(', ') : 'all 0'}`)
  }
  console.log(`${w}×${h}${dark ? ' dark' : ''}  ${row.join(' · ')}`)
  await ctx.close()
}
await b.close()
if (fails) { console.log(`FAIL ${fails} label(s) over strokes`); process.exit(1) } else console.log('ok: no stroke under any label')
