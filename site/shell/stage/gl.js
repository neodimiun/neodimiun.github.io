// gl.js (DS lead, lazy) — wraps the stage's single pre-made WebGL2 context in the single WebGLRenderer.
// Loaded only after the gate passes (motion on, WebGL2, quality < L3). Scenes get helpers via env and import three.js
// classes from ./three.js. No namespace object (import * as …) anywhere in the site's JS: esbuild would put its __export
// helper in a shared chunk that the eager main bundle then imports, one more request on first load.
import { WebGLRenderer, SRGBColorSpace, NoToneMapping, Color } from './three.js'

// yield the main thread between heavy boot steps (no task > 50 ms at 4× CPU)
export const nextTask = () => new Promise((r) => {
  if (typeof MessageChannel === 'function') { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0) } else setTimeout(r, 0)
})
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)))

export function createRenderer(canvas, context) {
  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'default' })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  renderer.autoClear = true
  renderer.info.autoReset = true
  let gpu = ''
  try {
    const gl = renderer.getContext()
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))
  } catch (e) { /* privacy-restricted */ }
  const software = /swiftshader|llvmpipe|softpipe|software/i.test(gpu)
  return { renderer, gpu, software }
}

// compileAsync only helps with KHR_parallel_shader_compile; without it compile synchronously (same result, no warning)
export async function compile(renderer, scene, camera) {
  if (renderer.extensions.has('KHR_parallel_shader_compile')) return renderer.compileAsync(scene, camera)
  renderer.compile(scene, camera)
}

// read a CSS colour token from an element's computed style as a THREE.Color (sRGB in, linear working space out)
export function tokenColor(el, name, fallback = '#000') {
  const v = getComputedStyle(el).getPropertyValue(name).trim() || fallback
  return new Color(v)
}
