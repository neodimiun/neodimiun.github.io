// verify.mjs (Team DI, review aid; not a generator, never run by build.mjs).
//   node chapters/06-data-integrity/tools/verify.mjs [page] [--shots] [--base=http://localhost:8080/]
// Checks SPEC-C §14 items 10–13, 38, 39, 41, 43, 44, 47, 48, 50 for Fig. 8 on a built page and writes screenshots to
// c/.build/di-verify/. Exit 1 on any failure.
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const { chromium } = await import('playwright')
const HERE = dirname(fileURLToPath(import.meta.url)), C = join(HERE, '../../..')
const args = process.argv.slice(2)
const pageName = args.find((a) => !a.startsWith('--')) || 'dev-data-integrity'
const base = (args.find((a) => a.startsWith('--base=')) || '--base=http://localhost:8080/').slice(7)
const shots = args.includes('--shots')
const OUT = join(C, '.build/di-verify'); mkdirSync(OUT, { recursive: true })
const facts = JSON.parse(readFileSync(join(C, 'data/facts.json'), 'utf8'))
const fails = [], notes = []
const ok = (cond, msg) => { if (!cond) fails.push(msg) }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const SPY = `(() => { const s = crypto.subtle; if (!s) return; window.__spy = { verify: 0, digest: 0, failAt: 0 };
  const v = s.verify.bind(s), d = s.digest.bind(s);
  s.verify = async (...a) => { const n = ++window.__spy.verify; const r = await v(...a); return window.__spy.failAt && n === window.__spy.failAt ? false : r };
  s.digest = (...a) => { window.__spy.digest++; return d(...a) } })()`

async function open(vp, q = '', o = {}) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: o.reduced ? 'reduce' : 'no-preference', javaScriptEnabled: o.js !== false, deviceScaleFactor: o.dpr || 1 })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  if (o.init) await page.addInitScript(o.init)
  await page.goto(`${base}${pageName}.html${q}${q ? '&' : '?'}hud=0`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  return { ctx, page, errs }
}
const toFig = (page) => page.evaluate(() => document.getElementById('fig-record').scrollIntoView({ block: 'center' }))
const ready = (page) => page.waitForFunction(() => document.getElementById('fig-record').__ledger?.stats().painted, null, { timeout: 8000 })
const press = async (page, s) => { await page.click(`#fig-record [data-set="${s}"]`); await page.waitForFunction((s) => document.getElementById('fig-record').__ledger?.stats().painted === s, s); await page.waitForTimeout(700) }
const read = (page) => page.evaluate(() => {
  const f = document.getElementById('fig-record'), t = (e) => e && e.innerText.replace(/\s+/g, ' ').trim()
  const st = (e) => ({ text: t(e), use: [...e.querySelectorAll('use')].map((u) => u.getAttribute('href')) })
  return {
    state: f.dataset.state, n: t(f.querySelector('[data-r=n]')), s: st(f.querySelector('[data-r=s]')), h: t(f.querySelector('[data-r=h]')), hs: st(f.querySelector('[data-r=hs]')),
    rows: [...f.querySelectorAll('.rec')].map((li) => ({ key: li.dataset.key, cls: li.className, val: li.querySelector('.val').textContent, unit: li.querySelector('.unit').textContent, hx: li.querySelector('.hx').textContent, st: st(li.querySelector('.st')), sig: st(li.querySelector('.sig')), nm: li.querySelector('.nm').innerText, href: li.querySelector('.l2 a').getAttribute('href') })),
    chg: [...f.querySelectorAll('.rec .val .chg')].map((e) => e.textContent).join(''), tr: f.querySelector('.corner.tr').textContent, cap: t(f.querySelector('figcaption')),
    head: t(f.querySelector('.hd .st')), headHx: f.querySelector('.hd .hx').textContent, live: f.querySelector('[data-live]').textContent,
    anims: document.getAnimations().length, plateH: f.querySelector('.plate').getBoundingClientRect().height, figH: f.getBoundingClientRect().height,
    stats: f.__ledger?.stats(), spy: window.__spy && { ...window.__spy },
  }
})
const geom = (page) => page.evaluate(() => {
  const f = document.getElementById('fig-record'), cw = document.documentElement.clientWidth
  // page overflow is attributed: this tool fails only on what the chapter itself pushes past the viewport
  const past = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > cw + 0.5)
  const out = { overflowX: past.filter((e) => e.closest('#data-integrity')).length, elsewhere: [...new Set(past.filter((e) => !e.closest('#data-integrity')).map((e) => `${e.tagName.toLowerCase()}.${e.className?.baseVal ?? e.className}`))], clipped: [], small: [], overlap: [], buttons: [] }
  const vis = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length }
  const leaves = [...f.querySelectorAll('.plate *, .readout *, #ctrl-l, figcaption')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.data.trim()))
  for (const e of leaves) {
    const fs = parseFloat(getComputedStyle(e).fontSize)
    if (fs < (innerWidth <= 360 ? 10.5 : 11)) out.small.push(`${e.className || e.tagName} ${fs}px`)
    // ellipsized? (chapter names, values, quantity labels must not be; hashes may be)
    if (e.scrollWidth > e.clientWidth + 0.5 && getComputedStyle(e).overflow === 'hidden' && !e.classList.contains('hx') && !e.classList.contains('h')) out.clipped.push(`${e.className}: ${e.textContent.trim().slice(0, 40)}`)
  }
  for (const s of ['.nm', '.l2', '.vu', '.q']) for (const e of f.querySelectorAll(s)) if (vis(e) && e.scrollWidth > e.clientWidth + 0.5) out.clipped.push(`${s}: ${e.textContent.trim()}`)
  // pairwise overlap of text boxes inside each ledger line and the stamp vs the seat / corners
  const boxes = [...f.querySelectorAll('.plate .l1 > *:not(.lead), .plate .l3 > *:not(.lead), .plate .l2, .stamp, .corner')].filter(vis).map((e) => ({ e, r: e.getBoundingClientRect() }))
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i].r, b = boxes[j].r
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (ix > 0.5 && iy > 0.5 && !boxes[i].e.contains(boxes[j].e) && !boxes[j].e.contains(boxes[i].e)) out.overlap.push(`${boxes[i].e.className} × ${boxes[j].e.className}`)
  }
  for (const b of f.querySelectorAll('.ctrl button')) if (vis(b)) { const r = b.getBoundingClientRect(); out.buttons.push([Math.round(r.width), Math.round(r.height)]); if (b.scrollWidth > b.clientWidth + 0.5) out.clipped.push(`button "${b.textContent.trim()}" spills (${b.scrollWidth} > ${b.clientWidth})`) }
  const rp = f.querySelector('.ctrl .replay')
  if (rp && vis(rp)) { if (rp.getAttribute('aria-label') !== 'Replay' || !vis(rp.querySelector('.rt'))) out.clipped.push('Replay: needs aria-label="Replay" and a visible label') }
  for (const li of f.querySelectorAll('.rec')) {
    const h = li.querySelector('.l3 .h'), l3 = li.querySelector('.l3'), lr = l3.getBoundingClientRect()
    if (innerWidth >= 360 && h.scrollWidth > h.clientWidth + 0.5) out.clipped.push(`${li.dataset.key}: line 3 hash/annotation cut "${h.textContent}"`)
    for (const c of l3.children) if (vis(c) && c.getBoundingClientRect().right > lr.right + 0.5) out.clipped.push(`${li.dataset.key}: line 3 .${c.className} runs past the line`)
  }
  const pr = f.querySelector('.plate').getBoundingClientRect()
  for (const e of f.querySelectorAll('.plate .ledger *')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.width && (r.right > pr.right + 0.5 || r.left < pr.left - 0.5)) out.clipped.push(`outside plate: ${e.className?.baseVal ?? e.className}`) }
  out.plate = [Math.round(pr.width * 10) / 10, Math.round(pr.height * 10) / 10]
  const st = f.querySelector('.stamp'); out.stampLines = Math.round(st.getBoundingClientRect().height); out.stamp = st.innerText.replace(/\n/g, ' / ')
  return out
})

// ---------------------------------------------------------------- 1. states, desktop, motion on
const D = { width: 1440, height: 900 }
{
  const { ctx, page, errs } = await open(D, '?intro=0', { init: SPY })
  await toFig(page); await ready(page); await page.waitForTimeout(400)
  const r0 = await read(page)
  ok(r0.n === '5 of 5' && /VERIFIED/.test(r0.s.text) && r0.s.use.includes('#i-check'), `recorded readout row 1: ${JSON.stringify(r0.s)} ${r0.n}`)
  ok(r0.h === '0ce54cb9…' && /MATCHES ANCHOR/.test(r0.hs.text) && r0.hs.use.includes('#i-check'), `recorded readout row 2: ${r0.h} ${JSON.stringify(r0.hs)}`)
  ok(r0.spy.verify === 5 && r0.spy.digest === 10, `one evaluation = 5 verify + 10 digest (got ${r0.spy.verify} / ${r0.spy.digest})`)
  for (const [i, row] of r0.rows.entries()) {
    const f = facts[row.key]
    ok(`${row.val} ${row.unit}` === `${f.value} ${f.unit}`, `row ${row.key}: ${row.val} ${row.unit}`)
    ok(row.href.endsWith(`#fig-${f.fig}`), `row ${row.key} links ${row.href}`)
    ok(/verified/.test(row.st.text) && row.st.use.includes('#i-check'), `row ${i + 1} status ${row.st.text}`)
  }
  ok(r0.rows.map((x) => x.hx).join(' ') === 'e7819b87… ed94e67f… 3cfcb1e0… 77f35d66… 0ce54cb9…', `recorded hashes ${r0.rows.map((x) => x.hx)}`)
  if (shots) await page.locator('#fig-record').screenshot({ path: join(OUT, 'd1440-recorded.png') })
  const hRec = r0.figH
  // changed
  await page.evaluate(() => { window.__spy.verify = 0; window.__spy.digest = 0 })
  await press(page, 'changed')
  const r1 = await read(page)
  ok(r1.spy.verify === 5 && r1.spy.digest === 10, `changed: 5 verify + 10 digest (got ${r1.spy.verify} / ${r1.spy.digest})`)
  ok(r1.n === '1 of 5' && /4 FAIL/.test(r1.s.text) && r1.s.use.includes('#i-cross'), `changed row 1: ${r1.n} ${JSON.stringify(r1.s)}`)
  ok(r1.h === '3526350f…' && /NO MATCH/.test(r1.hs.text) && r1.hs.use.includes('#i-cross'), `changed row 2: ${r1.h} ${JSON.stringify(r1.hs)}`)
  ok(r1.rows[1].hx === '59682c8c…' && /signature fails/.test(r1.rows[1].st.text) && r1.rows[1].val === '24.60', `changed row 02: ${JSON.stringify(r1.rows[1])}`)
  ok(r1.rows.slice(2).every((x) => /link broken/.test(x.st.text) && x.sig.use.includes('#i-check')), 'changed rows 03–05 link broken, signatures still check')
  ok(/verified/.test(r1.rows[0].st.text), 'changed row 01 verified')
  ok(r1.chg === '60', `changed: the changed digits of record 02 are underlined (.chg "${r1.chg}")`)
  ok(r1.live.startsWith('Record 02 changed from 24.06 to 24.60 milliliters.') && r1.live.includes('1 of 5 records verify'), `changed live: ${r1.live}`)
  ok(Math.abs(r1.figH - hRec) < 0.5, `figure height changed across states (${hRec} → ${r1.figH})`)
  if (shots) await page.locator('#fig-record').screenshot({ path: join(OUT, 'd1440-changed.png') })
  // resigned
  await page.evaluate(() => { window.__spy.verify = 0; window.__spy.digest = 0 })
  await press(page, 'resigned')
  const r2 = await read(page)
  ok(r2.spy.verify === 5 && r2.spy.digest === 10, `resigned: 5 verify + 10 digest (got ${r2.spy.verify} / ${r2.spy.digest})`)
  ok(r2.n === '5 of 5' && /SIGNED & LINKED/.test(r2.s.text) && r2.h === '3526350f…' && /NO MATCH/.test(r2.hs.text), `resigned readout: ${r2.n} ${r2.s.text} ${r2.h} ${r2.hs.text}`)
  ok(/re-signed/.test(r2.rows[1].st.text) && r2.rows.slice(2).every((x) => /relinked/.test(x.st.text)), 'resigned notes')
  ok(r2.chg === '60', `resigned: changed digits underlined (.chg "${r2.chg}")`)
  ok(r2.live.startsWith('Record 02 rewritten to 24.60 and re-signed'), `resigned live: ${r2.live}`)
  ok(Math.abs(r2.figH - hRec) < 0.5, `figure height changed (resigned ${r2.figH})`)
  if (shots) await page.locator('#fig-record').screenshot({ path: join(OUT, 'd1440-resigned.png') })
  await page.waitForTimeout(1200)
  ok((await read(page)).anims === 0, 'animations at rest after a press')
  const stats = (await read(page)).stats
  notes.push(`verify ${stats.verifyMs} ms (desktop, no throttle)`)
  ok(!errs.length, `page errors: ${errs.join(' | ')}`)
  await ctx.close()
}
// ---------------------------------------------------------------- 2. fault injection (item 10c)
{
  const { ctx, page } = await open(D, '?intro=0', { init: SPY + ';window.__spy && (window.__spy.failAt = 4)' })
  await toFig(page); await ready(page); await page.waitForTimeout(300)
  const r = await read(page)
  ok(r.n === '4 of 5' && /1 FAIL/.test(r.s.text) && r.s.use.includes('#i-cross') && /MATCHES ANCHOR/.test(r.hs.text), `fault injection readout: ${r.n} ${r.s.text} ${r.hs.text}`)
  ok(r.rows.map((x) => /signature fails/.test(x.st.text)).join() === 'false,false,false,true,false', `fault injection rows: ${r.rows.map((x) => x.st.text)}`)
  await ctx.close()
}
// ---------------------------------------------------------------- 3. no crypto.subtle (item 50)
{
  const { ctx, page, errs } = await open(D, '?intro=0', { init: "Object.defineProperty(Crypto.prototype, 'subtle', { get: () => undefined })" })
  await toFig(page); await ready(page); await page.waitForTimeout(300)
  const r = await read(page)
  ok(r.rows.every((x) => x.sig.text === 'checked at build' && !x.sig.use.length), `fallback signatures: ${r.rows.map((x) => x.sig.text)}`)
  ok(r.n === '5 of 5' && r.s.text === 'CHECKED AT BUILD', `fallback readout ${r.n} ${r.s.text}`)
  ok(r.tr === 'SHA-256' && !/in your browser/.test(r.cap) && /checked at build/.test(r.cap), `fallback TR "${r.tr}" / caption "${r.cap}"`)
  ok(!r.spy, 'fallback had no subtle')
  if (shots) await page.locator('#fig-record').screenshot({ path: join(OUT, 'fallback-recorded.png') })
  await press(page, 'changed')
  const c = await read(page)
  ok(c.n === '1 of 5' && c.h === '3526350f…' && /altered/.test(c.rows[1].st.text) && !/signature fails/.test(c.rows[1].st.text + c.live), `fallback changed ${c.n} ${c.h} ${c.rows[1].st.text} / ${c.live}`)
  ok(c.rows.every((x) => x.sig.text === 'checked at build' && !x.sig.use.length), `fallback changed signatures: ${c.rows.map((x) => x.sig.text)}`)
  await press(page, 'resigned')
  const s = await read(page)
  ok(s.n === '5 of 5' && s.s.text === 'CHECKED AT BUILD' && /NO MATCH/.test(s.hs.text), `fallback resigned ${s.n} ${s.s.text} ${s.hs.text}`)
  ok(!errs.length, `fallback page errors: ${errs.join(' | ')}`)
  await ctx.close()
}
// ---------------------------------------------------------------- 4. layout at every width and state
for (const vp of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 600, height: 960 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  const { ctx, page } = await open(vp, '?intro=0', { dpr: vp.width < 600 ? 2 : 1 })
  await toFig(page); await ready(page); await page.waitForTimeout(300)
  const hs = []
  for (const s of ['recorded', 'changed', 'resigned']) {
    if (s !== 'recorded') await press(page, s)
    const g = await geom(page)
    hs.push((await read(page)).figH)
    ok(g.overflowX === 0, `${vp.width} ${s}: chapter elements past the viewport ${g.overflowX}`)
    if (g.elsewhere.length && s === 'recorded') notes.push(`${vp.width}: page overflow outside the chapter (not DI): ${g.elsewhere.join(', ')}`)
    ok(!g.clipped.length, `${vp.width} ${s}: clipped ${g.clipped.join('; ')}`)
    ok(!g.small.length, `${vp.width} ${s}: small text ${g.small.join('; ')}`)
    ok(!g.overlap.length, `${vp.width} ${s}: overlap ${g.overlap.join('; ')}`)
    ok(g.buttons.every(([w, h]) => w >= 44 && h >= 44), `${vp.width} ${s}: buttons ${JSON.stringify(g.buttons)}`)
    if (vp.width < 360) ok(/SIMULATED/.test(g.stamp), `${vp.width}: stamp shows SIMULATED (${g.stamp})`)
    if (s === 'recorded') notes.push(`${vp.width}: plate ${g.plate.join(' × ')}, stamp ${g.stamp}`)
    if (shots && (vp.width <= 412 || vp.width === 1440)) await page.locator('#fig-record').screenshot({ path: join(OUT, `w${vp.width}-${s}.png`) })
  }
  ok(Math.max(...hs) - Math.min(...hs) < 0.5, `${vp.width}: figure height differs across states ${hs}`)
  if (shots && [320, 390, 412, 1440].includes(vp.width)) { await press(page, 'recorded'); await page.locator('#data-integrity').screenshot({ path: join(OUT, `w${vp.width}-chapter.png`) }) }
  await ctx.close()
}
// ---------------------------------------------------------------- 5. reduced motion, no JS
{
  const { ctx, page } = await open({ width: 390, height: 844 }, '', { reduced: true })
  await toFig(page); await ready(page); await page.waitForTimeout(300)
  const r = await read(page)
  ok(r.n === '5 of 5' && /VERIFIED/.test(r.s.text) && !(await page.$('#fig-record.pre')), 'reduced motion: final state, no .pre')
  ok(!(await page.isVisible('#fig-record .replay')), 'reduced motion: Replay hidden')
  await press(page, 'changed')
  ok((await read(page)).anims === 0, 'reduced motion: no stagger animations')
  if (shots) await page.locator('#fig-record').screenshot({ path: join(OUT, 'reduced-changed.png') })
  await ctx.close()
}
{
  const { ctx, page } = await open({ width: 390, height: 844 }, '', { js: false })
  const r = await page.evaluate(() => { const f = document.getElementById('fig-record'); return { ctrl: getComputedStyle(f.querySelector('.ctrl')).display, label: getComputedStyle(f.querySelector('#ctrl-l')).display, n: f.querySelector('[data-r=n]').textContent, s: f.querySelector('[data-r=s]').textContent, rows: [...f.querySelectorAll('.rec')].map((li) => `${li.querySelector('.val').textContent} ${li.querySelector('.unit').textContent}`), st: [...f.querySelectorAll('.rec .st')].map((e) => e.innerText.trim()), cap: f.querySelector('figcaption').innerText } })
  ok(r.ctrl === 'none' && r.label === 'none' && r.n === '5 of 5' && r.s === 'Checked at build', `no JS: ${JSON.stringify(r)}`)
  ok(r.st.every((x) => x === 'checked at build') && !/in your browser/.test(r.cap), `no JS: rows ${r.st} / caption ${r.cap}`)
  ok(r.rows.join(', ') === '180 HV0.5, 24.06 mL, 4.16 log, 3.48 mg/L, 18 ms', `no JS rows ${r.rows}`)
  if (shots) { await page.evaluate(() => document.getElementById('fig-record').scrollIntoView()); await page.locator('#fig-record').screenshot({ path: join(OUT, 'nojs.png') }) }
  await ctx.close()
}
// ---------------------------------------------------------------- 6. intro (motion on, below the fold), 4× CPU verify time
{
  const { ctx, page, errs } = await open({ width: 390, height: 844 }, '', { init: SPY })
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const armed = !!(await page.$('#fig-record.pre'))
  await page.evaluate(() => { const f = document.getElementById('fig-record'); scrollTo(0, f.getBoundingClientRect().top + scrollY - 120) })
  if (!armed) { notes.push('figure starts on screen here (not armed): the intro is tested through Replay'); await ready(page); await page.waitForTimeout(300); await page.evaluate(() => document.querySelector('#fig-record .replay').click()) }
  const t0 = Date.now()
  let peak = 0
  // Fig. 8's own animations only (on index.html other figures and seams may animate at the same time)
  // on index.html the page scrolls a long way (smooth) before the figure takes the lock, so wait for the intro's end (≤ 10 s)
  for (let i = 0; i < 40; i++) { await page.waitForTimeout(250); peak = Math.max(peak, await page.evaluate(() => { const f = document.getElementById('fig-record'); return document.getAnimations().filter((a) => a.effect && a.effect.target && f.contains(a.effect.target)).length })); if (shots && [3, 6, 9].includes(i)) await page.locator('#fig-record .plate').screenshot({ path: join(OUT, `intro-${i * 250}.png`) }); if (i >= 13 && await page.evaluate(() => window.__stage.introLog.some((l) => /(end|settle) record/.test(l)))) break }
  const log = await page.evaluate(() => window.__stage.introLog.filter((l) => l.includes('record')))
  notes.push(`intro log ${log.join(' | ')} · peak animations ${peak}`)
  ok(log.some((l) => /play record/.test(l)) && log.some((l) => /end record/.test(l)), `intro did not play+end: ${log}`)
  const m = log.map((l) => +l.split(' ')[0]), playT = m[log.findIndex((l) => /play record/.test(l))], endT = m[log.findIndex((l) => /end record/.test(l))]
  ok(endT - playT <= 3600, `intro ${endT - playT} ms (≤ 3600)`)
  ok(peak <= 40, `animations per intro ${peak} (≤ 40)`)
  await page.waitForTimeout(500)
  const r = await read(page)
  ok(r.anims === 0 && r.spy.verify === 5, `after the intro: ${r.anims} animations, ${r.spy.verify} verify calls`)
  ok(/All 5 records verify/.test(r.live), `intro live ${r.live}`)
  // verify time per state at 4× CPU
  const times = []
  for (let k = 0; k < 3; k++) for (const s of ['changed', 'resigned', 'recorded']) { await press(page, s); times.push((await read(page)).stats.verifyMs) }
  const med = [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)]
  notes.push(`verify at 4× CPU (9 presses): ${times.join(' / ')} ms, median ${med}`)
  ok(med <= 10, `verify median ≤ 10 ms at 4× CPU (${times})`)
  ok(!errs.length, `intro page errors: ${errs.join(' | ')}`)
  await ctx.close()
}
await browser.close()

// ---------------------------------------------------------------- 7. chunk greps (items 10a, 13) + sizes
const dir = pageName === 'index' ? join(C, 'js/chunks') : join(C, `js-dev/${pageName.replace(/^dev-/, '')}/chunks`)
for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const s = readFileSync(join(dir, f), 'utf8')
  if (/^ledger-/.test(f)) {
    const words = s.match(/verified|fail|match|signed|linked|broken/gi)
    ok(!words, `ledger chunk contains status words: ${[...new Set(words || [])]}`)
    notes.push(`ledger chunk ${f}: ${(gzipSync(s, { level: 9 }).length / 1024).toFixed(2)} KB gzip, imports ${[...s.matchAll(/from\s*"([^"]+)"/g)].map((m) => m[1]).join(', ')}`)
  }
  if (/sha256-/.test(f)) notes.push(`sha256 chunk ${(gzipSync(s, { level: 9 }).length / 1024).toFixed(2)} KB gzip`)
  ok(!/PRIVATE KEY|pkcs8|"d"\s*:/.test(s), `private key material in ${f}`)
}
console.log(notes.join('\n'))
console.log(fails.length ? `\nFAIL (${fails.length})\n  ${fails.join('\n  ')}` : '\nall Fig. 8 checks passed')
process.exit(fails.length ? 1 : 0)
