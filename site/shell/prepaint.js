(function (d, w) {
  // prepaint (DS lead): inlined in <head>, runs before first paint. Classes on <html>: js, motion (no reduced motion,
  // no save-data, Motion toggle on, no ?motion=0), coarse, gl (WebGL2 constructor present). __C = chunk manifest.
  var c = d.documentElement.classList, m = true, q
  try { m = localStorage.getItem('jqc-motion') !== 'off' } catch (e) { /* private mode */ }
  try { q = new URLSearchParams(location.search); if (q.get('motion') === '0') m = false } catch (e) { /* old engine */ }
  var mm = function (s) { return !!(w.matchMedia && w.matchMedia(s).matches) }
  var sd = !!(navigator.connection && navigator.connection.saveData)
  c.add('js')
  if (m && !sd && !mm('(prefers-reduced-motion: reduce)')) c.add('motion')
  if (mm('(pointer: coarse)')) c.add('coarse')
  if ('WebGL2RenderingContext' in w) c.add('gl')
  // c0 until the parsed page has painted once: on a phone chapter 01's text below the hero (inside the browser's
  // content-visibility margin, so never skipped) then lays out in its own task, not in the first one (chapter.css;
  // SPEC-C §14 item 33, no task over 80 ms at 4x CPU). Set and cleared here, so a failed main.js cannot keep it.
  c.add('c0')
  var u = function () { c.remove('c0') }
  d.addEventListener('DOMContentLoaded', function () { if (w.requestAnimationFrame) w.requestAnimationFrame(function () { setTimeout(u, 0) }); else u() })
  w.__C = __MANIFEST__
})(document, window)
