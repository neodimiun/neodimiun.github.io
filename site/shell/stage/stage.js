// stage.js (DS lead) — SYSTEM-C §5 / SPEC-C §13. Owns the page's ONE WebGL2 context, canvas, renderer and demand loop,
// the figure registry (GL scenes + DOM figures), host picking, the global intro lock + queue (A15), cold caps,
// posters / reduced motion / no-WebGL / context loss, the quality ladder, and the __stage stats.
// Imports no three.js: the renderer arrives with the lazy gl.js chunk.
//
// Ported from Path B main.js (loop, attach, posterFor/upscaled/settle, quality ladder, context loss) and Path A main.js
// (pre-made context as the only capability probe, boot slicing).

const ATTRS = { alpha: false, depth: false, stencil: false, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: true }
const LADDER = [1, 0.8, 1, 0] // L2 is "dpr -> 1.0" (handled below); L3 = posters
const MP = { coarse: 0.35e6, fine: 1.5e6 }
const CAP = { gl: 2500, dom: 1200 } // cold cap from lock grant (A15)
const BACKSTOP = 6000
const INTENT_MS = 4000
const FADE = 240

const store = {
  get(s, k) { try { return s.getItem(k) } catch (e) { return null } },
  set(s, k, v) { try { s.setItem(k, v) } catch (e) { /* private mode */ } },
  del(s, k) { try { s.removeItem(k) } catch (e) { /* private mode */ } },
}
const LS = () => { try { return localStorage } catch (e) { return null } }
const SS = () => { try { return sessionStorage } catch (e) { return null } }

export function createStage({ params = new URLSearchParams(location.search), dev = false, manifest = window.__C || {} } = {}) {
  const html = document.documentElement
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)')
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)')
  const coarse = matchMedia('(pointer: coarse)').matches
  const fine = () => mqFine.matches && !coarse
  const saveData = !!(navigator.connection && navigator.connection.saveData)
  const glCapable = 'WebGL2RenderingContext' in window
  const posterQ = params.get('poster') // ?poster=<state>&w=<px>: capture mode (no intro, no fade)
  const posterW = +params.get('w') || 0
  const introOff = params.get('intro') === '0' || !!posterQ
  const qa = params.get('qa') === '1'
  const forcedQ = /^L[0-3]$/.test(params.get('quality') || '') ? +params.get('quality')[1] : null

  let motionPref = store.get(LS(), 'jqc-motion') !== 'off' && params.get('motion') !== '0'
  let level = forcedQ ?? Math.min(3, Math.max(0, +store.get(SS(), 'jqc-q') | 0))
  let glFailed = (+store.get(SS(), 'jqc-lost') | 0) > 2
  const motion = () => motionPref && !mqReduce.matches && !saveData
  const wantGL = () => motion() && glCapable && level < 3 && !glFailed
  const why = () => mqReduce.matches ? 'reduced motion' : saveData ? 'save-data' : !motionPref ? 'motion off' : !glCapable ? 'no WebGL2' : glFailed ? 'WebGL unavailable' : level >= 3 ? 'quality L3' : ''

  const S = (window.__stage = window.__proto = {
    renderer: null, renders: 0, frames: 0, cpuMs: 0, quality: 'pending', reason: '', roForwarded: 0, losses: 0,
    gpu: '', adaptive: true, idle: false, introLog: [],
  })

  const figs = [] // records, document order after start()
  const byId = new Map()
  const glFigs = []
  const motionSubs = new Set()
  let started = false

  // ---------------------------------------------------------------------------------------- registry
  function base(desc, kind) {
    if (!desc || !desc.id || !desc.fig) throw new Error('stage.register: id and fig are required')
    if (byId.has(desc.id)) throw new Error(`stage: figure "${desc.id}" registered twice`)
    const fig = desc.fig
    const F = {
      id: desc.id, kind, desc, fig, plate: desc.plate || fig.querySelector('.plate') || fig,
      at: desc.intro?.at ?? 0.4, delay: desc.intro?.delay ?? (kind === 'gl' ? 450 : 250), maxMs: desc.intro?.maxMs ?? 3600,
      states: desc.states || (fig.dataset.states || '').split(/\s+/).filter(Boolean),
      final: desc.final || fig.dataset.final, initial: desc.initial || desc.final || fig.dataset.final,
      state: null, visible: false, ratio: 0, area: 0, played: false, running: false, queued: false, armed: false,
      userSet: false, intentT: -1e9, order: 0, timers: {},
    }
    F.state = F.final
    figs.push(F); byId.set(F.id, F)
    return F
  }
  function register(desc) {
    const F = base(desc, 'gl')
    F.host = desc.host || F.fig.querySelector('.host')
    F.scene = null; F.sceneP = null; F.failed = false; F.lastKey = ''
    glFigs.push(F)
    if (desc.pointer === 'fine-hover') wirePointer(F)
    if (started) bootFig(F)
    return F
  }
  function registerDom(desc) {
    const F = base(desc, 'dom')
    if (started) bootFig(F)
    return F
  }

  // ---------------------------------------------------------------------------------------- DOM state helpers
  const xfade = (F) => {
    F.fig.classList.add('xfade'); clearTimeout(F.timers.xf)
    F.timers.xf = setTimeout(() => F.fig.classList.remove('xfade'), 400)
  }
  function applySnap(F, snap) {
    if (snap.state && F.states.includes(snap.state) && F.fig.dataset.state !== snap.state) F.fig.dataset.state = snap.state
    try { F.desc.onState && F.desc.onState(snap) } catch (e) { console.error(e) }
  }
  const snapOf = (F) => F.scene ? F.scene.snapshot() : { state: F.state, poster: F.state, readout: null }

  // ---------------------------------------------------------------------------------------- intro lock + queue (A15)
  let lock = null
  const clearT = (F, ...k) => { for (const n of k) { clearTimeout(F.timers[n]); F.timers[n] = 0 } }
  const wants = (F) => !F.played && (!introOff || F.replayed) && motion() && (F.kind === 'dom' ? F.armed : wantGL())
  function pump() {
    if (lock) return
    const next = figs.filter((F) => F.queued && wants(F) && F.ratio >= F.at).sort((a, b) => a.order - b.order)[0]
    if (next) grant(next)
  }
  function grant(F) {
    lock = F
    if (F.kind === 'gl' && armed) loadScene(F)
    F.grantT = performance.now()
    S.introLog.push(`${Math.round(F.grantT)} grant ${F.id}`)
    F.timers.cap = setTimeout(() => { if (lock === F && !F.running) settleFig(F, 'cold cap') }, CAP[F.kind])
    F.timers.go = setTimeout(() => go(F), F.delay)
  }
  function release(F) {
    clearT(F, 'cap', 'go', 'back')
    F.queued = false
    if (lock === F) { lock = null; setTimeout(pump, 0) }
  }
  function go(F) {
    if (lock !== F || F.running || F.played) return
    if (F.kind === 'gl') return tryStartGL()
    ;(async () => {
      try { if (F.desc.load && !F.loaded) { await F.desc.load(); F.loaded = true } } catch (e) { console.error(e) }
      if (lock !== F || F.played || !wants(F) || F.ratio < F.at) return
      F.running = true; clearT(F, 'cap')
      S.introLog.push(`${Math.round(performance.now())} play ${F.id}`)
      let p
      try { p = F.desc.play && F.desc.play(F.fig) } catch (e) { console.error(e) }
      await Promise.resolve(p).catch(() => null)
      if (F.running) finishIntro(F)
    })()
  }
  function finishIntro(F) {
    const was = F.running
    F.running = false; F.played = true
    if (F.kind === 'dom') { try { F.desc.settle && F.desc.settle(F.fig) } catch (e) { console.error(e) } }
    else if (F.scene) applySnap(F, F.scene.snapshot())
    if (was) S.introLog.push(`${Math.round(performance.now())} end ${F.id}`)
    release(F)
  }
  // to the final state now (cold cap, left the screen, motion off, backstop)
  function settleFig(F, reason) {
    S.introLog.push(`${Math.round(performance.now())} settle ${F.id} (${reason})`)
    if (F.kind === 'dom') {
      F.armed = false
      try { F.desc.settle && F.desc.settle(F.fig) } catch (e) { console.error(e) }
    } else {
      if (F.scene) F.scene.snap()
      const target = F.userSet ? F.state : F.final
      F.state = target
      if (F.fig.dataset.state !== target || (F.scene && F.scene.snapshot().state !== target)) {
        if (!(F === active && shown && !hidden)) xfade(F)
        F.fig.dataset.state = target
        if (F.scene) { F.scene.setState(target, { animate: false }); if (F === active) { dirty = true; kick() } }
      }
      applySnap(F, F.scene ? F.scene.snapshot() : { state: F.state, poster: F.state, readout: null })
    }
    F.running = false; F.played = true
    release(F)
  }

  // ---------------------------------------------------------------------------------------- visibility
  const vio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const F = e.target.__F
      if (!F) continue
      const was = F.visible
      F.visible = e.isIntersecting && e.intersectionRatio > 0
      F.ratio = F.visible ? e.intersectionRatio : 0
      F.area = F.visible ? e.intersectionRect.width * e.intersectionRect.height : 0
      if (F.ratio >= F.at && wants(F) && !F.queued) {
        F.queued = true
        F.timers.back = setTimeout(() => { if (!F.played && !F.running) settleFig(F, 'backstop') }, BACKSTOP)
      }
      if (was && !F.visible && !F.played) {
        if (F.running) {
          if (F.kind === 'gl' && F.scene) { F.scene.snap(); finishIntro(F) } else settleFig(F, 'left mid-intro')
        } else if (F.queued || lock === F) settleFig(F, 'left the queue')
      }
    }
    pump()
    decide()
  }, { threshold: [0, 0.1, 0.2, 0.25, 0.4, 0.6, 0.8, 1] })

  // ---------------------------------------------------------------------------------------- GL engine
  let canvas = null, glmod = null, renderer = null, engineP = null, lost = false
  let active = null, shown = false, hidden = false, dirty = false, raf = 0, chained = false, lastT = 0
  const shared = new Map()
  const cpu = new Float64Array(30); let cpuN = 0, cpuI = 0
  const runnable = () => !!renderer && !lost && wantGL() && document.visibilityState === 'visible' && !!active && active.visible && !!active.scene

  function modulepreload(href) {
    if (!href || document.querySelector(`link[rel=modulepreload][href="${href}"]`)) return
    const l = document.createElement('link'); l.rel = 'modulepreload'; l.href = href; document.head.appendChild(l)
  }
  function ensureEngine() {
    if (engineP) return engineP
    engineP = (async () => {
      if (!wantGL()) throw new Error(why() || 'gate')
      canvas = document.createElement('canvas')
      canvas.className = 'gl'
      canvas.setAttribute('aria-hidden', 'true')
      canvas.setAttribute('role', 'presentation')
      canvas.style.opacity = '0'
      let ctx = null
      try { ctx = canvas.getContext('webgl2', posterQ ? { ...ATTRS, failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: true } : ATTRS) } catch (e) { ctx = null }
      if (!ctx || ctx.isContextLost()) { glFailed = true; throw new Error('WebGL unavailable') }
      canvas.addEventListener('webglcontextlost', onLost)
      modulepreload(manifest.three); modulepreload(manifest.gl)
      S.quality = 'loading'
      glmod = await import('./gl.js')
      // each heavy step in its own task (no task > 80 ms at 4x CPU): a resolved import() continues in the same task
      await glmod.nextTask()
      const r = glmod.createRenderer(canvas, ctx)
      renderer = r.renderer
      canvas.addEventListener('webglcontextrestored', onRestored) // after three.js's own listener
      S.renderer = renderer; S.gpu = r.gpu
      S.adaptive = !r.software || qa
      S.quality = qualityName()
      return renderer
    })()
    engineP.catch((e) => { glFailed = glFailed || /WebGL/.test(e.message); postersMode(e.message || 'WebGL unavailable', true) })
    return engineP
  }
  const qualityName = () => `L${level}${S.adaptive ? '' : ' · software GL: adaptive ladder paused'}`

  function readTokens(el) {
    const cs = getComputedStyle(el)
    const g = (n) => cs.getPropertyValue(n).trim()
    return { fg: g('--fg'), fg2: g('--fg-2'), plate: g('--plate'), surface: g('--surface'), a: g('--a'), aMark: g('--a-mark'), hair: g('--hair') }
  }
  function envFor(F) {
    return {
      renderer, gl: glmod, tokens: readTokens(F.plate), coarse, fine: fine(),
      quality: { level, scale: LADDER[level] }, shared, nextTask: glmod.nextTask, compile: glmod.compile,
      fig: F.fig, host: F.host, id: F.id, dev, motion: motion(),
    }
  }
  // scenes load one at a time (boot slicing), nearest first
  let loadChain = Promise.resolve()
  function loadScene(F) {
    if (F.sceneP || F.failed) return F.sceneP
    F.loading = true
    F.sceneP = loadChain = loadChain.then(async () => {
      // gated after the request (any path, not only postersMode / onMotionChange): never leave an unplayed figure on its intro poster
      if (!wantGL()) { if (!F.played) settleFig(F, why() || 'gate'); return }
      await ensureEngine()
      await glmod.nextTask()
      const mod = await F.desc.load()
      await glmod.nextTask()
      const env = envFor(F)
      const scene = (mod.create || mod.default)(env)
      await scene.init(renderer, env)
      await glmod.nextTask() // compile above, the first size + draw below
      // the first frame must equal the poster that shows: start in the shown state (initial while an intro is pending)
      scene.setState(F.fig.dataset.state || F.state, { animate: false })
      F.scene = scene
      S.quality = qualityName()
      decide(); tryStartGL()
    }).finally(() => { F.loading = false }).catch((e) => {
      F.failed = true
      if (dev) console.info(`[stage] ${F.id}: posters (${e && e.message})`)
      if (!F.played) settleFig(F, 'scene failed')
    })
    return F.sceneP
  }

  const eio = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) {
      // only posters that can show (figure.css / build: the others are display:none until they may)
      for (const img of e.target.querySelectorAll('.poster img[loading="lazy"]')) if (getComputedStyle(img.parentNode).display !== 'none') img.loading = 'eager'
      eio.unobserve(e.target)
    }
  }, { rootMargin: '100% 0px' })
  const lio = new IntersectionObserver((entries) => {
    const near = entries.filter((e) => e.isIntersecting).map((e) => e.target.__F).filter(Boolean)
    near.sort((a, b) => (b.area - a.area) || (Math.abs(a.host.getBoundingClientRect().top) - Math.abs(b.host.getBoundingClientRect().top)))
    for (const F of near) loadScene(F)
  }, { rootMargin: '100% 0px' })

  function pick() {
    const ok = (F) => F.visible && F.scene && !F.failed
    if (lock && lock.kind === 'gl' && ok(lock) && !lock.played) return lock
    const now = performance.now()
    if (active && ok(active) && now - active.intentT < INTENT_MS && active.ratio >= 0.2) return active
    const vis = glFigs.filter(ok)
    if (!vis.length) return null
    const best = vis.reduce((a, b) => (b.area > a.area ? b : a))
    if (active && best !== active && ok(active) && active.ratio >= 0.1 && best.area <= active.area * 1.25) return active
    return best
  }
  function decide() {
    if (!renderer || lost || !wantGL()) return
    const c = pick()
    if (!c) { cancel(); return }
    if (c !== active) attach(c)
    kick()
  }
  function dprFor(F, w, h) {
    if (posterQ && posterW) return posterW / Math.max(1, w)
    let d = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2)
    if (level === 1) d *= LADDER[1]
    if (level === 2) d = 1
    const sc = F.scene && F.scene.scale ? F.scene.scale(coarse) : 1
    d *= sc
    const budget = coarse ? MP.coarse : MP.fine
    if (w * h * d * d > budget) d = Math.sqrt(budget / (w * h))
    return d
  }
  const V2 = { x: 0, y: 0, set(x, y) { this.x = x; this.y = y; return this } } // getSize() target (no three import here)
  function size(F) {
    const w = F.host.clientWidth, h = F.host.clientHeight
    if (!w || !h || !F.scene) return
    const d = dprFor(F, w, h)
    // one drawing-buffer resize, and none when nothing changed: setPixelRatio() + setSize() reallocate it twice, and a
    // reallocation is a synchronous GPU round trip (the longest step of a scene switch on a software-GL phone)
    const s = renderer.getSize(V2)
    if (s.x !== w || s.y !== h || renderer.getPixelRatio() !== d) renderer.setDrawingBufferSize(w, h, d)
    F.scene.resize(w, h, d)
    F.sized = w + 'x' + h + '@' + d
    dirty = true
  }
  function attach(F) {
    const prev = active
    if (prev && prev.scene) {
      if (prev.running) { prev.scene.snap(); finishIntro(prev) }
      prev.scene.rest()
      applySnap(prev, prev.scene.snapshot())
    }
    active = F
    shown = false; hidden = false
    clearTimeout(fadeT)
    canvas.style.transition = 'none'
    canvas.style.opacity = '0'
    F.host.prepend(canvas)
    size(F)
    F.attachT = performance.now()
    qs.warm = 0
  }

  // ---------------------------------------------------------------------------------------- the single demand loop
  function kick() { if (!raf && runnable()) raf = requestAnimationFrame(frame) }
  function cancel() { if (raf) cancelAnimationFrame(raf); raf = 0; chained = false }
  function frame(now) {
    raf = 0; S.frames++
    const F = active, s = F.scene
    const moving = !!s.step(now)
    if (moving || dirty) {
      const t0 = performance.now()
      s.draw()
      S.renders++
      dirty = false
      cpu[cpuI] = performance.now() - t0; cpuI = (cpuI + 1) % cpu.length; if (cpuN < cpu.length) cpuN++
      let sum = 0; for (let i = 0; i < cpuN; i++) sum += cpu[i]
      S.cpuMs = sum / cpuN
      if (!shown) reveal(F, moving)
      else if (hidden && moving) showNow()
    }
    const snap = s.snapshot()
    const key = snap.key ?? `${snap.state}|${snap.poster}|${snap.readout ? Object.values(snap.readout).join(',') : ''}`
    if (key !== F.lastKey) { F.lastKey = key; applySnap(F, snap) }
    if (chained) qualitySample(now - lastT)
    lastT = now
    if (F.running && (!moving || now - F.introT0 > F.maxMs + 400)) { if (moving) s.snap(); finishIntro(F) }
    if (moving && runnable()) { chained = true; raf = requestAnimationFrame(frame) } else { chained = false; if (!moving) settleCanvas(F) }
  }
  let fadeT = 0
  function reveal(F, moving) {
    shown = true
    if (!moving && upscaled(F) && posterImg(F)) { hidden = true; afterReveal(); return }
    hidden = false
    if (posterQ) { canvas.style.transition = 'none'; canvas.style.opacity = '1'; afterReveal(); return }
    getComputedStyle(canvas).opacity
    canvas.style.transition = `opacity ${FADE}ms cubic-bezier(.2,.7,.2,1)`
    canvas.style.opacity = '1'
    clearTimeout(fadeT)
    fadeT = setTimeout(afterReveal, FADE + 20)
  }
  function afterReveal() { tryStartGL() }
  function showNow() { hidden = false; canvas.style.transition = 'none'; canvas.style.opacity = '1'; getComputedStyle(canvas).opacity }
  function hideToPoster(ms) { hidden = true; canvas.style.transition = `opacity ${ms}ms ease-out`; canvas.style.opacity = '0' }
  // Path B: a canvas rendering below device resolution rests over the sharper poster of the identical state
  function posterImg(F) {
    const snap = F.scene.snapshot()
    if (!snap.poster) return null
    const img = F.fig.querySelector(`.poster[data-for="${snap.poster}"] img`)
    return img && img.complete && img.naturalWidth > 0 ? img : null
  }
  const upscaled = (F) => !posterQ && !!canvas && canvas.width < F.host.clientWidth * (devicePixelRatio || 1) * 0.85
  function settleCanvas(F) {
    if (F !== active || !shown || hidden || !upscaled(F) || F.running) return
    if (posterImg(F)) hideToPoster(250)
  }
  function wake(F) { if (F === active && shown && hidden) showNow() }

  function tryStartGL() {
    const F = lock
    if (!F || F.kind !== 'gl' || F.running || F.played) return
    if (performance.now() - F.grantT < F.delay - 5) return
    if (F !== active) { decide(); if (F !== active) return }
    if (!shown || lost || !runnable()) return
    if (F.ratio < F.at) return
    clearT(F, 'cap')
    F.running = true; F.introT0 = performance.now()
    S.introLog.push(`${Math.round(F.introT0)} play ${F.id}`)
    wake(F)
    F.scene.intro()
    kick()
  }

  // ---------------------------------------------------------------------------------------- adaptive quality (§5.6)
  const qs = { warm: 0, acc: 0, win: [], strikes: 0 }
  function qualitySample(dt) {
    if (forcedQ !== null || !S.adaptive || dt > 250) return
    if (qs.warm < 500) { qs.warm += dt; return }
    qs.win.push(dt); qs.acc += dt
    if (qs.acc < 1500) return
    const w = qs.win.sort((a, b) => a - b)
    const p75 = w[Math.floor(w.length * 0.75)], med = w[w.length >> 1]
    const lowPower = med > 30 && med < 36.5 && p75 < 40
    qs.strikes = p75 > 20 && !lowPower ? qs.strikes + 1 : 0
    if (qa) console.log(`[quality] p75 ${p75.toFixed(1)} median ${med.toFixed(1)} strikes ${qs.strikes}`)
    qs.win.length = 0; qs.acc = 0
    if (qs.strikes >= 2) { qs.strikes = 0; stepDown() }
  }
  function stepDown() {
    level++
    store.set(SS(), 'jqc-q', String(level))
    if (level >= 3) { postersMode('L3 · posters (auto)', true); return }
    S.quality = qualityName()
    if (active) { size(active); kick() }
  }

  // ---------------------------------------------------------------------------------------- posters mode / motion
  // glOnly: the GL engine failed (no WebGL, L3, repeated context loss). DOM figures never use WebGL, so their intros
  // carry on; only a motion change (motion off) settles them too.
  function postersMode(reason, glOnly = false) {
    cancel()
    S.reason = reason
    S.quality = `posters (${reason})`
    for (const F of figs) {
      if (glOnly && F.kind === 'dom') continue
      if (F.running || (!F.played && (F.queued || lock === F))) settleFig(F, reason)
      else if (F.kind === 'dom' && F.armed && !F.played) settleFig(F, reason)
      else if (F.kind === 'gl' && !F.played && F.fig.dataset.state !== F.final && !F.userSet) settleFig(F, reason)
    }
    if (canvas) { clearTimeout(fadeT); canvas.style.transition = 'none'; canvas.style.opacity = '0' }
    shown = false; hidden = false
    if (active && active.scene) { active.scene.rest(); applySnap(active, active.scene.snapshot()) }
    active = null
  }
  function syncMotionClass() {
    html.classList.toggle('motion', motion())
    for (const fn of motionSubs) try { fn(motion()) } catch (e) { console.error(e) }
  }
  function setMotion(on) {
    if (on && level >= 3 && forcedQ === null) { level = 0; store.del(SS(), 'jqc-q') }
    motionPref = on
    store.set(LS(), 'jqc-motion', on ? 'on' : 'off')
    onMotionChange()
  }
  function onMotionChange() {
    syncMotionClass()
    if (!wantGL()) postersMode(why() || 'motion off')
    else {
      S.reason = ''; S.quality = renderer ? qualityName() : 'pending'
      if (glFailed === false && engineP && !renderer) engineP = null // a gate failure earlier (motion off) may be retried
      if (!armed) { armed = true; for (const F of glFigs) lio.observe(F.host) }
      for (const F of glFigs) if (F.visible) { if (!F.failed && !F.scene && !F.loading) F.sceneP = null; loadScene(F) }
      decide()
    }
  }
  mqReduce.addEventListener?.('change', onMotionChange)

  // ---------------------------------------------------------------------------------------- context loss (§5.8)
  function onLost(e) {
    e.preventDefault()
    lost = true
    cancel()
    S.losses++
    const n = (+store.get(SS(), 'jqc-lost') | 0) + 1
    store.set(SS(), 'jqc-lost', String(n))
    for (const F of glFigs) {
      if (!F.scene) continue
      if (F.running) { F.scene.snap(); finishIntro(F) }
      applySnap(F, F.scene.snapshot())
    }
    clearTimeout(fadeT)
    if (canvas) { canvas.style.transition = 'none'; canvas.style.opacity = '0' }
    shown = false; hidden = false
    S.quality = 'context lost · posters'
  }
  function onRestored() {
    setTimeout(async () => {
      if (!lost) return
      if ((+store.get(SS(), 'jqc-lost') | 0) > 2) { glFailed = true; postersMode('context lost 3×', true); return }
      for (const F of glFigs) if (F.scene) { try { await F.scene.restore(renderer) } catch (err) { console.error(err) } }
      lost = false
      S.quality = qualityName()
      const a = active; active = null
      if (a) attach(a)
      decide()
    }, 0)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') { kick(); return }
    cancel()
    for (const F of figs) if (F.kind === 'dom' && !F.played && (F.running || F.queued || lock === F)) settleFig(F, 'hidden tab')
  })

  // ---------------------------------------------------------------------------------------- sizes (width changes only on coarse pointers)
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const F = e.target.__F
      if (!F) continue
      const w = e.contentRect.width, h = e.contentRect.height
      const changed = Math.abs(w - (F.w || 0)) >= 0.5 || (!coarse && Math.abs(h - (F.h || 0)) >= 0.5)
      F.w = w; F.h = h
      if (!changed || !F.seenSize) { F.seenSize = true; continue }
      S.roForwarded++
      clearTimeout(F.timers.ro)
      F.timers.ro = setTimeout(() => { if (F === active && renderer) { size(F); kick() } }, 150)
    }
  })

  // ---------------------------------------------------------------------------------------- input
  function intent(F) { F.intentT = performance.now() }
  function wirePointer(F) {
    const el = F.plate
    const ok = (e) => e.pointerType === 'mouse' && fine()
    const fwd = (e) => {
      if (!ok(e)) return
      intent(F)
      if (active !== F) { decide(); return }
      if (!F.scene || !F.scene.pointer || !runnable()) return
      wake(F)
      F.scene.pointer(e, F.host.getBoundingClientRect())
      kick()
    }
    for (const t of ['pointerenter', 'pointermove', 'pointerleave', 'pointercancel']) el.addEventListener(t, fwd)
  }
  // controller pressed a button: the DOM is already updated; move the picture to match
  function setState(id, s, { animate = true } = {}) {
    const F = byId.get(id)
    if (!F) return
    if (F.states.length && !F.states.includes(s)) console.warn(`[stage] ${id}: unknown state "${s}"`)
    F.userSet = true
    intent(F)
    if (F.kind === 'dom') {
      if (F.running || F.armed) settleFig(F, 'input')
      F.state = s
      try { F.desc.set && F.desc.set(F.fig, s) } catch (e) { console.error(e) }
      return
    }
    const live = F.scene && renderer && !lost && wantGL()
    if (F.running) { F.scene.snap(); finishIntro(F) } else if (!F.played) { F.played = true; release(F) }
    F.state = s
    if (live && F === active && shown) { wake(F); F.fig.dataset.state = s; F.scene.setState(s, { animate }); kick() } else {
      if (F.fig.dataset.state !== s) { xfade(F); F.fig.dataset.state = s }
      if (F.scene) { F.scene.setState(s, { animate: false }); if (F === active) dirty = true }
      if (live && F.visible) decide()
      if (!F.scene) applySnap(F, { state: s, poster: s, readout: null })
    }
  }
  function replay(id) {
    const F = byId.get(id)
    if (!F || !motion()) return
    if (lock && lock !== F) settleFig(lock, 'replay elsewhere')
    if (lock === F) release(F)
    F.played = false; F.userSet = false; F.replayed = true
    if (F.kind === 'dom') {
      try { F.desc.settle && F.desc.settle(F.fig) } catch (e) { console.error(e) }
      try { F.desc.arm && F.desc.arm(F.fig) } catch (e) { console.error(e) }
      F.armed = true
      F.delaySave = F.delay; F.delay = 0
      grant(F); F.delay = F.delaySave
      return
    }
    if (!(F.scene && renderer && !lost && wantGL())) { F.played = true; return }
    F.state = F.final
    F.scene.setState(F.initial, { animate: false })
    intent(F)
    lock = F; F.grantT = performance.now() - F.delay; clearT(F, 'cap')
    if (F === active) { wake(F); dirty = true }
    decide(); tryStartGL()
  }

  // ---------------------------------------------------------------------------------------- boot
  let armed = false
  function bootFig(F, below) {
    F.order = figs.indexOf(F)
    const targets = F.kind === 'gl' ? F.host : F.plate
    targets.__F = F
    vio.observe(targets)
    if (F.kind === 'gl') {
      F.fig.classList.add('started')
      const s = introOff ? (posterQ && F.states.includes(posterQ) ? posterQ : F.final) : wantGL() ? F.initial : F.final
      if (introOff) F.played = true
      F.state = introOff ? s : F.final // where the visitor ends up; initial is only the intro's starting picture
      F.fig.dataset.state = s
      applySnap(F, { state: s, poster: s, readout: null, boot: true })
      ro.observe(F.host)
      eio.observe(F.host)
      if (armed) lio.observe(F.host)
    } else {
      if (below === undefined) below = F.plate.getBoundingClientRect().top >= innerHeight // registered after start()
      if (!introOff && motion() && below && F.desc.arm) { try { F.desc.arm(F.fig) } catch (e) { console.error(e) } F.armed = true }
      else { F.played = true; try { F.desc.settle && F.desc.settle(F.fig) } catch (e) { console.error(e) } }
      if (posterQ && F.states.includes(posterQ)) setState(F.id, posterQ)
    }
  }
  function start() {
    if (started) return
    started = true
    figs.sort((a, b) => (a.fig.compareDocumentPosition(b.fig) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    syncMotionClass()
    S.reason = wantGL() ? '' : why()
    if (!wantGL()) S.quality = `posters (${why() || 'no GL figures'})`
    // below the fold, decided for every DOM figure in ONE read pass before any arm() writes (a read after each arm()
    // forced a layout per figure). A figure whose chapter starts below the fold is below it: reading the chapter's own
    // box never forces a content-visibility:auto chapter to lay out its contents.
    const below = new Map(figs.filter((F) => F.kind === 'dom').map((F) => {
      const ch = F.fig.closest('.ch')
      return [F, (ch && ch.getBoundingClientRect().top >= innerHeight) || F.plate.getBoundingClientRect().top >= innerHeight]
    }))
    for (const F of figs) bootFig(F, below.get(F))
    const st = params.get('state')
    if (st) for (const F of figs) if (F.states.includes(st)) { F.played = true; setState(F.id, st, { animate: false }) }
    if (wantGL() && glFigs.length) {
      const idle = (f) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 400 }) : setTimeout(f, 50))
      const arm = () => requestAnimationFrame(() => setTimeout(() => idle(() => {
        armed = true
        for (const F of glFigs) lio.observe(F.host)
      }), 0))
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm, { once: true }); else arm()
    }
    pump()
  }

  function settleAll(reason = 'print') { for (const F of figs) if (!F.played || F.running) settleFig(F, reason) }

  // poster capture for chapter tools/posters.mjs: render figure `id` in `state` at `w` device px wide; returns a PNG data URL
  async function capture(id, state, w) {
    const F = byId.get(id)
    if (!F || F.kind !== 'gl') throw new Error(`capture: no GL figure "${id}"`)
    await loadScene(F)
    if (!F.scene) throw new Error(`capture: scene "${id}" failed`)
    if (F.running) { F.scene.snap(); finishIntro(F) }
    F.played = true
    if (active !== F) attach(F)
    const wCss = F.host.clientWidth, hCss = F.host.clientHeight
    renderer.setDrawingBufferSize(wCss, hCss, w / wCss); F.scene.resize(wCss, hCss, w / wCss)
    F.scene.setState(state, { animate: false })
    F.scene.snap()
    F.scene.draw(); S.renders++
    const url = canvas.toDataURL('image/png')
    size(F); dirty = true; kick()
    return url
  }

  S.capture = capture
  Object.defineProperty(S, 'idle', {
    get: () => !raf && !lock && !figs.some((F) => F.running) && (!engineP || !!renderer || glFailed) && glFigs.every((F) => !F.sceneP || F.scene || F.failed),
  })
  S.state = () => ({
    active: active && active.id, shown, hidden, raf: !!raf, lost, level, reason: S.reason, quality: S.quality,
    renders: S.renders, frames: S.frames, cpuMs: +S.cpuMs.toFixed(2), lock: lock && lock.id,
    mp: canvas && active ? +((canvas.width * canvas.height) / 1e6).toFixed(3) : 0,
    drawCalls: renderer ? renderer.info.render.calls : null, triangles: renderer ? renderer.info.render.triangles : null,
    figs: figs.map((F) => `${F.id}:${F.kind}:${F.fig.dataset.state}${F.played ? '' : '*'}${F.running ? '>' : ''}${F.visible ? '@' + F.ratio.toFixed(2) : ''}`).join(' '),
  })


  return {
    register, registerDom, setState, replay, start, settleAll, capture, setMotion,
    motion, intent: (id) => byId.has(id) && intent(byId.get(id)),
    onMotion: (fn) => { motionSubs.add(fn); return () => motionSubs.delete(fn) },
    get(id) { return byId.get(id) }, stats: S,
  }
}
