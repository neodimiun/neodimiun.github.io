// tools/posters.mjs (Team ENG): renders every Fig. 1 / Fig. 2 poster with the live scene code (SYSTEM-C §5.7). Run by
// hand, never by build.mjs:   node chapters/01-engineering/tools/posters.mjs [--base=http://localhost:8080/]
// 1. builds nothing: it loads the current dev-engineering.html?poster=…&w=1200 (run `node build.mjs --dev --chapter
//    engineering` first) and calls __stage.capture(id, state, px) for each state at 720 and 1200 device px;
// 2. composes the reduced-motion small multiples (etched · indented · measured) from three captures on the band's own
//    surface colour (read from the page's tokens). Its labels are DOM text in chapter.html, not pixels;
// 3. writes posters/<id>-<state>-<w>.avif (libaom) + .webp, and prints the sizes against the SYSTEM-C §5.7 budgets.
import { chromium } from 'playwright'
import { writeFileSync, readFileSync, statSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const { TRI } = await import('data:text/javascript;base64,' + Buffer.from(readFileSync(join(HERE, '../field.model.js'))).toString('base64'))
const OUT = join(HERE, '../posters')
const TMP = join(tmpdir(), 'eng-posters'); mkdirSync(TMP, { recursive: true }); mkdirSync(OUT, { recursive: true })
const base = (process.argv.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const WIDTHS = [720, 1200]
const JOBS = [['field', 'polished'], ['field', 'etched'], ['indent', 'etched'], ['indent', 'indented'], ['indent', 'measured']]
// AV1 crf per poster: the near-uniform polished mirror bands at the default crf, so it gets a finer one (Path B)
const CRF = { 'field-polished': 20, 'field-etched': 35, default: 32 }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => console.log('pageerror', e.message))
await page.goto(`${base}dev-engineering.html?poster=etched&w=1200&hud=0`, { waitUntil: 'load' })
await page.waitForFunction(() => window.__stage && window.__stage.capture, null, { timeout: 30000 })
const png = {}
for (const [id, state] of JOBS) for (const w of WIDTHS) {
  const url = await page.evaluate(([id, s, w]) => window.__stage.capture(id, s, w), [id, state, w])
  const f = join(TMP, `${id}-${state}-${w}.png`)
  writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'))
  png[`${id}-${state}-${w}`] = url
}
// small multiples: three 1200 px captures drawn as discs with steel rings on the band surface
const tok = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#fig-indent .plate')); return { surface: cs.getPropertyValue('--surface').trim(), steel: cs.getPropertyValue('--steel').trim() } })
for (const w of WIDTHS) {
  const url = await page.evaluate(async ({ srcs, w, tok, T }) => {
    const c = document.createElement('canvas'); c.width = c.height = w
    const g = c.getContext('2d')
    g.fillStyle = tok.surface; g.fillRect(0, 0, w, w)
    const imgs = await Promise.all(srcs.map((s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s })))
    g.imageSmoothingQuality = 'high'
    imgs.forEach((im, k) => {
      const d = T.d * w, x = T.cx[k] * w, y = T.cy[k] * w
      g.save(); g.beginPath(); g.arc(x, y, d / 2, 0, Math.PI * 2); g.clip(); g.drawImage(im, x - d / 2, y - d / 2, d, d); g.restore()
      g.strokeStyle = tok.steel; g.lineWidth = Math.max(1, w / 600); g.beginPath(); g.arc(x, y, d / 2, 0, Math.PI * 2); g.stroke()
      if (k < 2) { // a short steel rule from each field to the next, along the line of centres: the order of operations
        const X = T.cx[k + 1] * w, Y = T.cy[k + 1] * w, L = Math.hypot(X - x, Y - y), ux = (X - x) / L, uy = (Y - y) / L
        const e = d / 2 + 0.012 * w
        g.beginPath(); g.moveTo(x + ux * e, y + uy * e); g.lineTo(X - ux * e, Y - uy * e); g.stroke()
      }
    })
    return c.toDataURL('image/png')
  }, { srcs: ['etched', 'indented', 'measured'].map((s) => png[`indent-${s}-1200`]), w, tok, T: TRI })
  writeFileSync(join(TMP, `indent-tri-${w}.png`), Buffer.from(url.split(',')[1], 'base64'))
}
await browser.close()

const BUDGET = { 720: 20, 1200: 30 }
// The polished field is the motion-on LCP image (it shows from first paint while the intro waits). Chrome drops images
// under 0.05 bits per CSS pixel of their displayed area from LCP, and then the etched poster revealed after the intro
// becomes the LCP (≈ 2.9 s on desktop). So each polished file is encoded finely enough to carry ≥ 0.07 bpp at the
// largest size Fig. 1 is drawn (560 CSS px, chapter.json sizes) at either width: ≥ 2,744 bytes.
const LCP = { bpp: 0.07, css: 560 }
const MIN = { 'field-polished': Math.ceil((LCP.bpp * LCP.css * LCP.css) / 8) }
const enc = {
  avif: (src, dst, crf) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', String(crf), '-cpu-used', '4', '-pix_fmt', 'yuv420p', dst]),
  webp: (src, dst, q) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', dst]),
}
for (const [id, state] of [...JOBS, ['indent', 'tri']]) for (const w of WIDTHS) {
  const name = `${id}-${state}-${w}`, src = join(TMP, `${name}.png`), min = MIN[`${id}-${state}`] || 0
  const A = join(OUT, `${name}.avif`), W = join(OUT, `${name}.webp`)
  let crf = CRF[`${id}-${state}`] ?? CRF.default, q = 74
  enc.avif(src, A, crf); while (statSync(A).size < min && crf > 0) enc.avif(src, A, (crf = Math.max(0, crf - 2)))
  enc.webp(src, W, q); while (statSync(W).size < min && q < 100) enc.webp(src, W, (q = Math.min(100, q + 4)))
  const a = statSync(A).size, b = statSync(W).size
  const lcp = min ? ` · ${((a * 8) / LCP.css ** 2).toFixed(3)} / ${((b * 8) / LCP.css ** 2).toFixed(3)} bpp at ${LCP.css} px (crf ${crf}, q ${q})${a < min || b < min ? '  UNDER LCP FLOOR' : ''}` : ''
  console.log(`${name.padEnd(24)} avif ${(a / 1024).toFixed(1).padStart(5)} KB (≤ ${BUDGET[w]})${a / 1024 > BUDGET[w] ? '  OVER' : ''} · webp ${(b / 1024).toFixed(1)} KB${lcp}`)
}
rmSync(TMP, { recursive: true, force: true })
