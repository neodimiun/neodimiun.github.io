// dom-figure.js (DS lead) — helpers for SVG/DOM figures (SYSTEM-C §5.9, SPEC-C §13.2). WAAPI only, no rAF, ever.
// Opacity, transform and stroke-dashoffset only. Every helper is a no-op-safe building block for play()/settle().

const EASE = 'cubic-bezier(.2,.7,.2,1)'

// one WAAPI animation; fill:'both' so the from-state holds during the delay. Returns the Animation.
export function anim(el, keyframes, { dur = 240, delay = 0, easing = EASE, fill = 'both' } = {}) {
  return el.animate(keyframes, { duration: dur, delay, easing, fill })
}
export const fadeIn = (el, o = {}) => anim(el, [{ opacity: 0 }, { opacity: 1 }], o)
// stroke draw for a path with pathLength="1" (or pass len)
export const draw = (el, o = {}, len = 1) => anim(el, [{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { easing: 'linear', ...o })

// resolves when every animation under el (and el's own) has finished; cancelled animations count as finished
export function finished(el) {
  const list = el.getAnimations ? el.getAnimations({ subtree: true }) : []
  return Promise.all(list.map((a) => a.finished.catch(() => null))).then(() => undefined)
}

// finish then cancel every animation under el: the authored (final) CSS state shows, 0 animations remain
export function stopAll(el) {
  if (!el.getAnimations) return
  for (const a of el.getAnimations({ subtree: true })) { try { a.finish() } catch (e) { /* infinite or idle */ } a.cancel() }
}

// text-only / animation-start timeouts, cleared together by settle()
export function timers() {
  const ids = new Set()
  return {
    set(fn, ms) { const id = setTimeout(() => { ids.delete(id); fn() }, ms); ids.add(id); return id },
    clear() { for (const id of ids) clearTimeout(id); ids.clear() },
    get size() { return ids.size },
  }
}

// the common controls wiring: .ctrl buttons with data-set="state" (and an optional .replay button).
// onSet(state, button) runs on press; pressed(state) updates aria-pressed. Returns { pressed }.
export function wireControls(fig, { onSet, onReplay } = {}) {
  const ctrl = fig.querySelector('.ctrl')
  const buttons = ctrl ? [...ctrl.querySelectorAll('button[data-set]')] : []
  const pressed = (s) => { for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.set === s)) }
  for (const b of buttons) b.addEventListener('click', () => onSet && onSet(b.dataset.set, b))
  const replay = ctrl && ctrl.querySelector('.replay')
  if (replay && onReplay) replay.addEventListener('click', () => onReplay())
  return { pressed, buttons, replay }
}

// polite live region: announce final values only (never per frame)
// The same text again (Replay ends where it began) is still spoken: clear the region, then write it a task later.
export function announce(fig, text) {
  const live = fig.querySelector('[data-live]')
  if (!live) return
  clearTimeout(live.__t)
  if (live.textContent !== text) { live.textContent = text; return }
  live.textContent = ''
  live.__t = setTimeout(() => { live.textContent = text }, 50)
}
