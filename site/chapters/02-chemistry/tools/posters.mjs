// Fig. 3 posters (Team CHEM; run by hand, never by build.mjs — SPEC-C §12.2):
//   node build.mjs --dev --chapter chemistry && node chapters/02-chemistry/tools/posters.mjs [--base=http://localhost:8080/]
// Renders every poster with the live scene (burette.gl.js on the shared stage, via __stage.capture on the dev page), so a
// poster cannot drift from what the canvas draws. Writes chapters/02-chemistry/posters/burette-<state>-<w>.{avif,webp}.
//   above · level · below  square (1:1). The page shows them with object-fit: cover in a host that is always taller than
//                          wide, i.e. scaled to the host's height, which is exactly how the camera frames the canvas
//                          (fixed vertical field) at any host aspect, so the poster under the canvas equals its first frame.
//   tri                    three panels (12° above · level · 12° below), 6:5, the reduced-motion small multiples. The
//                          scene checks that every whole-mL ring in a panel carries its numeral, uncut.
// AVIF: ffmpeg libaom, crf 10 upward until the SYSTEM-C §5.7 budget holds (≤ 30 KB at 1200 w, ≤ 20 KB at 720 w).
// WebP fallback: Pillow, lossy q 90.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, statSync, readdirSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'posters')
const TMP = join(HERE, '../../../.build/chemistry/posters-png') // intermediate PNGs (build scratch, not shipped)
mkdirSync(TMP, { recursive: true }); mkdirSync(OUT, { recursive: true })
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const JOBS = [ // [state, css box w × h of the host during capture]
  ['above', 600, 600], ['level', 600, 600], ['below', 600, 600], ['tri', 600, 500],
]
const WIDTHS = [720, 1200]
const LIMIT = { 720: 20, 1200: 30 } // KB

for (const f of readdirSync(OUT)) if (/^burette-.*\.(avif|webp|png)$/.test(f)) unlinkSync(join(OUT, f))
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
let failed = false
for (const [state, bw, bh] of JOBS) {
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    const errs = []
    page.on('pageerror', (e) => errs.push(e.message))
    await page.goto(`${base}dev-chemistry.html?poster=${state === 'tri' ? 'level' : state}&w=${w}&hud=0`)
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => document.fonts.load("500 88px 'Plex Mono C'"))
    const res = await page.evaluate(async ({ state, bw, bh, w }) => {
      const host = document.querySelector('#fig-burette .host')
      host.style.cssText = `top:0;left:0;right:auto;bottom:auto;width:${bw}px;height:${bh}px`
      const url = await window.__stage.capture('burette', state, w)
      const fig = document.getElementById('fig-burette')
      return { url, check: fig.dataset.triCheck || null }
    }, { state, bw, bh, w })
    await page.close()
    if (errs.length) { failed = true; console.error(`${state}-${w}: ${errs.join('; ')}`) }
    if (state === 'tri') {
      const c = JSON.parse(res.check)
      if (c.errors.length) { failed = true; console.error(`tri-${w}: ${c.errors.join('; ')}`) } else console.log(`tri-${w}: rings ${c.rings.join(', ')} labelled · panel ${c.panelWidthMl} mL wide × ${c.spanMl} mL tall`)
    }
    const png = join(TMP, `burette-${state}-${w}.png`)
    writeFileSync(png, Buffer.from(res.url.split(',')[1], 'base64'))
    const avif = join(OUT, `burette-${state}-${w}.avif`)
    let crf = 10
    for (;;) {
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-vf', 'scale=out_color_matrix=bt709:out_range=pc,format=yuv444p',
        '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(crf), '-b:v', '0', '-cpu-used', '4',
        '-color_range', 'pc', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', avif])
      const kb = statSync(avif).size / 1024
      if (kb <= LIMIT[w] || crf >= 50) { console.log(`burette-${state}-${w}.avif crf ${crf} ${kb.toFixed(1)} KB${kb > LIMIT[w] ? '  OVER BUDGET' : ''}`); if (kb > LIMIT[w]) failed = true; break }
      crf += 3
    }
    const webp = join(OUT, `burette-${state}-${w}.webp`)
    execFileSync('python3', ['-c', `from PIL import Image; Image.open('${png}').convert('RGB').save('${webp}', 'WEBP', quality=90, method=6)`])
    console.log(`burette-${state}-${w}.webp ${(statSync(webp).size / 1024).toFixed(1)} KB`)
  }
}
await browser.close()
if (failed) process.exit(1)
