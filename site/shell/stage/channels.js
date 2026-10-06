// channels.js (DS lead) — Path B's value channels: fixed-duration eased tween, exponential follow, snap.
// Used by GL scenes (step()) and, if needed, by DOM figure code. No rAF here: the stage's loop calls step().

// cubic-bezier(x1, y1, x2, y2) as a function of progress 0..1
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const X = (t) => ((ax * t + bx) * t + cx) * t
  const Y = (t) => ((ay * t + by) * t + cy) * t
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0, hi = 1, t = x
    for (let i = 0; i < 20; i++) {
      const v = X(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t; else hi = t
      t = (lo + hi) / 2
    }
    return Y(t)
  }
}
export const ease = bezier(0.2, 0.7, 0.2, 1) // --ease
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
export const wrapPi = (a) => (a > -Math.PI && a <= Math.PI ? a : Math.atan2(Math.sin(a), Math.cos(a)))
const SLOW = (() => { try { return clamp(+new URLSearchParams(location.search).get('slow') || 1, 1, 50) } catch (e) { return 1 } })()

// An animated value. tween(): fixed duration, eased, ends exactly. follow(): x += (t − x)(1 − e^(−dt/τ)), converges
// to within eps then lands. step(now) returns true if the value changed this frame.
export class Chan {
  constructor(v, { angle = false, eps } = {}) { this.v = v; this.angle = angle; this.eps = eps ?? (angle ? 1e-3 : 1e-4); this.tw = null; this.fl = null }
  get busy() { return !!(this.tw || this.fl) }
  set(v) { this.v = v; this.tw = null; this.fl = null }
  tween(to, ms, done, curve = ease) { this.tw = { from: this.v, to, t0: performance.now(), ms: ms * SLOW, done, curve }; this.fl = null }
  follow(to, tau) {
    if (this.angle) to = this.v + wrapPi(to - this.v)
    if (this.fl) { this.fl.to = to; this.fl.tau = tau } else this.fl = { to, tau, last: performance.now() }
    this.tw = null
  }
  snap() {
    const t = this.tw, f = this.fl
    this.tw = null; this.fl = null
    if (t) { this.v = this.angle ? wrapPi(t.to) : t.to; t.done && t.done() } else if (f) this.v = this.angle ? wrapPi(f.to) : f.to
  }
  step(now) {
    if (this.tw) {
      const t = this.tw
      const k = t.ms > 0 ? clamp((now - t.t0) / t.ms, 0, 1) : 1
      const v = t.from + (t.to - t.from) * t.curve(k)
      const changed = v !== this.v
      this.v = v
      if (k >= 1) { this.tw = null; if (this.angle) this.v = wrapPi(this.v); t.done && t.done() }
      return changed
    }
    if (this.fl) {
      const f = this.fl
      const dt = Math.min(64, now - f.last)
      f.last = now
      const nv = this.v + (f.to - this.v) * (1 - Math.exp(-dt / f.tau))
      if (Math.abs(f.to - nv) < this.eps) { this.v = this.angle ? wrapPi(f.to) : f.to; this.fl = null } else this.v = nv
      return true
    }
    return false
  }
}

// step a list of channels; returns { changed, moving } (moving: anything still busy after the step,
// which also catches a finished tween whose done() started the next one)
export function stepAll(list, now) {
  let changed = false, moving = false
  for (let i = 0; i < list.length; i++) if (list[i].step(now)) changed = true
  for (let i = 0; i < list.length; i++) if (list[i].busy) { moving = true; break }
  return { changed, moving }
}
export const snapAll = (list) => { for (let k = 0; k < 8; k++) { let any = false; for (const c of list) if (c.busy) { c.snap(); any = true } if (!any) break } }
