// Fig. 3 scene (Team CHEM, lazy): Path A's live burette (a/src/scene.js) as a stage scene module (SYSTEM-C §5.2).
// A 50 mL burette slice whose reading depends on eye height. One world unit = 1 mL of scale length;
// worldY(mL) = −(mL − true): the meniscus bottom sits at y = 0 and the camera always looks at it, so the host's centre
// row is the line of sight and the front-scale value on that row is exactly true − R·tan θ (burette.model.js). The dark
// meniscus band's lower edge is the meniscus profile, whose lowest point is always on the centre row.
// Shared-renderer rules: no rAF, no timers that render, no window listeners, no setSize/setPixelRatio; no depth buffer
// (draw order by renderOrder); colours from env.tokens; draw() sets everything it relies on.
import {
  Scene, PerspectiveCamera, Color, ShaderMaterial, CylinderGeometry, LatheGeometry,
  Vector2, Vector3, Mesh, CanvasTexture, BufferGeometry, BufferAttribute, BackSide, FrontSide, DoubleSide, GLSL3,
} from '../../shell/stage/three.js'
// The model (burette.model.js) and the true reading (facts.json) arrive from the eager controller on the figure element
// (fig.__burette), not by import: importing them here would make esbuild split them out of the main bundle into a
// shared chunk, an extra request on first load.
const M = () => document.getElementById('fig-burette').__burette
const { R, TILT, LOOK, DEG, readingText, lookOf, TRUE_ML } = M()
const R_IN = 0.43
const MEN_R = 0.428 // liquid radius (inner wall, less a hair so the two never meet)
const MEN_H = 0.075 // meniscus rise at the wall
// profile h(r) = MEN_H·(r/MEN_R)^3: at half the radius the surface has risen 1/8 of the way, close to a water meniscus in
// a burette bore (Young–Laplace), so at eye level the band is a crescent rather than a flat slab
const MEN_P = 3
const MEN_MID = 0.03 // a mid height of the curved surface, for line-of-sight tests against it
const D = 8.6
const FOV = 18
export const VIEW_H = 2 * D * Math.tan((FOV / 2) * DEG) // mL of scale the camera's vertical field spans (the host's height)

// Numerals sit on the glass 0.85 rad round to the left of the scale and clear of their ring (Path A, tools/numclear.mjs)
const NUM_FIRST = 22, NUM_LAST = 28
const NUM_PHI = -0.85
const NUM_LIFT = 0.17 // numeral centre above its ring
const NUM_HALF_GLYPH = 0.055

// motion (Path A main.js): the intro rises to 12° above, holds, and falls back to level; returns are fixed-duration glides
const INTRO = { rise: 750, hold: 700, fall: 1150 }
const RETURN_MS = (d) => Math.min(1100, Math.max(450, 450 + 650 * (Math.abs(d) / TILT)))
const TAU = 90 // pointer follow time constant (ms)
const EPS = 2e-3 // settle threshold: about a quarter pixel on the largest plate (the reading changes every 0.02 rad)
const PDEAD = 0.06 // pointer dead zone around the centre row, as a fraction of half the host
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (6 * x - 15) + 10))
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

// a CSS colour token as raw sRGB components: the ShaderMaterials output them unchanged, so the screen shows the exact token
const srgb = (css) => { const h = new Color(css).getHex(); return new Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255) }
const LIQ = 0.06 // what the plate shows through the liquid column: ground glazed with 6 % ink

const VERT = /* glsl */ `
out vec3 vWorldPos;
out vec3 vNormal;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorldPos = w.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`

// Graduations. Constant work per fragment (no loops). Off level, the front scale carries a thin knockout (ground or
// liquid tone) so every tick stays legible where it crosses the dark meniscus band.
const GRAD_FRAG = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uGround;
uniform vec3 uLiquid;
uniform vec3 uGloss3;
uniform float uAlpha;
uniform float uHalo;
uniform float uGloss;
in vec3 vWorldPos;
out highp vec4 fragColor;
float band(float d, float hw, float aa) { return 1.0 - smoothstep(hw - aa, hw + aa, d); }
float dist(float v, float period) { return abs(fract(v / period + 0.5) - 0.5) * period; }
void main() {
  float mL = ${TRUE_ML.toFixed(2)} - vWorldPos.y;
  float aa = max(fwidth(mL), 1e-5);
  float ax = abs(vWorldPos.x);
  float axa = max(fwidth(vWorldPos.x), 1e-5);
  float front = step(0.0, vWorldPos.z);
  float d1 = dist(mL, 0.1), d5 = dist(mL, 0.5), d10 = dist(mL, 1.0);
  // minor ticks span ±0.27 rad of the front, half-mL ticks ±0.42 rad, whole-mL rings the full circumference
  float wMinor = ${(R * Math.sin(0.27)).toFixed(4)}, wHalf = ${(R * Math.sin(0.42)).toFixed(4)};
  float minor = band(d1, 0.006, aa) * band(ax, wMinor, axa) * front;
  float halfT = band(d5, 0.008, aa) * band(ax, wHalf, axa) * front;
  float ring = band(d10, 0.010, aa);
  float core = max(max(minor, halfT), ring);
  float k = 1.6; // knockout width in pixels, above and below each front tick (not past its ends)
  float halo = max(
    band(d1, 0.006 + k * aa, aa) * band(ax, wMinor, axa),
    band(d5, 0.008 + k * aa, aa) * band(ax, wHalf, axa)) * front * uHalo;
  float a = max(core, halo);
  vec3 dir = vWorldPos - cameraPosition;
  float tm = (${MEN_MID.toFixed(3)} - vWorldPos.y) / min(dir.y, -1e-6);
  bool overLiquid = vWorldPos.y < ${MEN_H.toFixed(3)} || (dir.y < 0.0 && length((vWorldPos + dir * tm).xz) < ${MEN_R.toFixed(3)});
  vec3 under = overLiquid ? uLiquid : uGround;
  // a faint highlight streak down the front glass (paper tone), under the graduations
  float gloss = uGloss * 0.5 * (1.0 - smoothstep(0.0, 0.03, abs(vWorldPos.x - 0.335))) * front;
  float A = 1.0 - (1.0 - gloss) * (1.0 - a);
  vec3 P = uInk * core + under * (a - core) + uGloss3 * gloss * (1.0 - a);
  fragColor = vec4(P / max(A, 1e-4), A * uAlpha);
}`

// Liquid column: a 6 % ink glaze, a touch heavier toward its edges so it reads as a volume.
const LIQUID_FRAG = /* glsl */ `
uniform vec3 uInk;
in vec3 vWorldPos;
in vec3 vNormal;
out highp vec4 fragColor;
void main() {
  float f = 1.0 - abs(dot(normalize(vNormal), normalize(cameraPosition - vWorldPos)));
  fragColor = vec4(uInk, ${LIQ.toFixed(3)} + 0.07 * f * f * f * f);
}`

// Meniscus. The dark band is the half of the surface beyond the line of sight through the meniscus bottom (the far half
// from above, the near half from below; all of it at eye level), so its lower edge is the meniscus profile and its
// lowest point is the meniscus bottom on the centre row, at any angle.
const MENISCUS_FRAG = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uGround;
uniform float uHalo;
in vec3 vWorldPos;
out highp vec4 fragColor;
void main() {
  vec3 p = vWorldPos;
  float s = cameraPosition.y * p.z;
  float dark = 1.0 - smoothstep(0.0, fwidth(s) + 1e-9, s);
  vec3 v = cameraPosition - p;
  float a = dot(v.xz, v.xz), b = dot(p.xz, v.xz), c = dot(p.xz, p.xz) - ${(MEN_R * MEN_R).toFixed(6)};
  float t = (-b + sqrt(max(b * b - a * c, 0.0))) / max(a, 1e-8);
  float yExit = p.y + t * v.y;
  float fy = fwidth(yExit) + 1e-6;
  float glaze = ${LIQ.toFixed(3)} * smoothstep(${MEN_H.toFixed(3)} - fy, ${MEN_H.toFixed(3)} + fy, yExit);
  float rr = length(p.xz) / ${MEN_R.toFixed(3)};
  float across = abs(p.z) / max(sqrt(max(${(MEN_R * MEN_R).toFixed(6)} - p.x * p.x, 0.0)), 1e-4);
  float tone = mix(0.88, 0.42, uHalo * smoothstep(0.0, 0.55, across));
  float edge = 1.0 - smoothstep(1.0 - fwidth(rr) - 1e-5, 1.0, rr);
  vec3 col = mix(uInk, mix(uGround, uInk, tone), dark);
  fragColor = vec4(col, mix(glaze, 1.0, dark) * edge);
}`

// Glass edges as real geometry: the silhouette of a vertical cylinder seen from a point is the pair of generators tangent
// from that point, at z = r²/d. Each is a quad extruded to a constant width in screen space.
const EDGE_VERT = /* glsl */ `
in vec4 aLine;   // side (-1|1), radius, half width (world units at the target), alpha
in float aAcross;
uniform vec2 uViewport;
uniform float uPxPerUnit;
out float vAcross;
out float vHalf;
out float vAlpha;
void main() {
  float r = aLine.y;
  float dc = length(cameraPosition.xz);
  float zs = r * r / dc;
  float xs = aLine.x * sqrt(max(r * r - zs * zs, 0.0));
  vec4 c0 = projectionMatrix * viewMatrix * vec4(xs, position.y, zs, 1.0);
  vec4 c1 = projectionMatrix * viewMatrix * vec4(xs, position.y + 0.25, zs, 1.0);
  vec2 s0 = c0.xy / c0.w * uViewport * 0.5;
  vec2 s1 = c1.xy / c1.w * uViewport * 0.5;
  vec2 dir = normalize(s1 - s0);
  float hp = max(aLine.z * uPxPerUnit, 0.5);
  float ext = hp + 1.0;
  vec2 off = vec2(-dir.y, dir.x) * aAcross * ext;
  gl_Position = c0 + vec4(off / (uViewport * 0.5) * c0.w, 0.0, 0.0);
  vAcross = aAcross * ext;
  vHalf = hp;
  vAlpha = aLine.w;
}`
const EDGE_FRAG = /* glsl */ `
uniform vec3 uInk;
in float vAcross;
in float vHalf;
in float vAlpha;
out highp vec4 fragColor;
void main() {
  fragColor = vec4(uInk, clamp(vHalf + 0.5 - abs(vAcross), 0.0, 1.0) * vAlpha);
}`

// Numerals: one atlas texture, one merged mesh (one draw call). Two coverage masks per numeral: the glyph, and the glyph
// with its engraver's knockout outline. The knockout takes whatever lies behind the glass, and drops where the line of
// sight meets the meniscus, so no numeral carries a pale halo over the grey of the meniscus seen from above.
const NUM_VERT = /* glsl */ `
in float aN;
out vec2 vUv;
out float vN;
out vec3 vWorldPos;
void main() {
  vUv = uv;
  vN = aN;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorldPos = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const NUM_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uRange;
uniform vec3 uInk;
uniform vec3 uGround;
uniform vec3 uLiquid;
in vec2 vUv;
in float vN;
in vec3 vWorldPos;
out highp vec4 fragColor;
void main() {
  if (vN < uRange.x - 0.5 || vN > uRange.y + 0.5) discard;
  float fill = texture(uMap, vec2(vUv.x * 0.5, vUv.y)).a;
  float knock = max(texture(uMap, vec2(0.5 + vUv.x * 0.5, vUv.y)).a, fill);
  vec3 dir = vWorldPos - cameraPosition;
  float tm = (${MEN_MID.toFixed(3)} - vWorldPos.y) / min(dir.y, -1e-6);
  float r = length((vWorldPos + dir * tm).xz);
  float fr = fwidth(r) + 1e-5;
  float onMen = (dir.y < 0.0 && vWorldPos.y > ${MEN_H.toFixed(3)}) ? 1.0 - smoothstep(${MEN_R.toFixed(3)} - fr, ${MEN_R.toFixed(3)} + fr, r) : 0.0;
  vec3 behind = vWorldPos.y < ${MEN_H.toFixed(3)} ? uLiquid : uGround;
  float ka = (knock - fill) * (1.0 - onMen);
  fragColor = vec4(uInk * fill + behind * ka, fill + ka);
}`

const timeout = (ms) => new Promise((r) => setTimeout(r, ms))

export function create(env) {
  const { tokens, fig } = env
  const ink = srgb(tokens.fg), ground = srgb(tokens.plate)
  const uInk = { value: ink }
  const uGround = { value: ground }
  const uLiquid = { value: ground.clone().lerp(ink, LIQ) }
  const uGloss3 = { value: srgb(tokens.surface) }
  const uHalo = { value: 0 }
  const uViewport = { value: new Vector2(1, 1) }
  const uPxPerUnit = { value: 100 }
  const uRange = { value: new Vector2(NUM_FIRST, NUM_LAST) }
  const clear = new Color(tokens.plate)
  const monoStack = (getComputedStyle(fig).getPropertyValue('--mono') || '').trim() || 'ui-monospace, monospace'

  let renderer = null, scene, camera, tex, atlas, actx
  const disposables = []
  let cssW = 1, cssH = 1, bufW = 1, bufH = 1

  // ---- eye state
  let th = 0 // the angle drawn
  let drawnTh = NaN, needs = true, triOnce = false
  let mode = 'rest' // rest | intro | glide | follow
  let glide = null // { from, to, dur, t0, kind: 'button' | 'return' | 'snap' }
  let target = 0, lastT = 0
  const intro = { t0: 0, phase: '', on: false, done: false }
  let held = 'level' // the discrete state the figure rests in (a button's choice, or level)
  let lit = 'level' // the button the readout names (null while the eye travels)
  let suspended = false // a button's choice holds until the mouse comes back onto the plate
  let susX = -1, susY = -1

  const place = (t) => {
    camera.position.set(0, D * Math.sin(t), D * Math.cos(t))
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    // knockouts and the graded band appear only off level, so the level view stays one crisp dark band
    uHalo.value = smooth(0.5 * DEG, 2.5 * DEG, Math.abs(t))
  }
  const lookAtTheta = (t) => (Math.abs(t - LOOK.above) < 1e-9 ? 'above' : Math.abs(t - LOOK.below) < 1e-9 ? 'below'
    : lookOf(TRUE_ML, t) === 'level' ? 'level' : null)

  function drawAtlas() {
    const CELL_W = 256, CELL_H = 128, COUNT = NUM_LAST - NUM_FIRST + 1
    actx.clearRect(0, 0, atlas.width, atlas.height)
    actx.font = `500 88px ${monoStack}`
    actx.textAlign = 'center'
    actx.textBaseline = 'alphabetic'
    actx.lineJoin = 'round'
    actx.lineWidth = 6
    actx.fillStyle = actx.strokeStyle = '#fff'
    for (let i = 0; i < COUNT; i++) {
      const s = String(NUM_FIRST + i)
      const m = actx.measureText(s)
      const asc = m.actualBoundingBoxAscent || 62, desc = m.actualBoundingBoxDescent || 0
      const y = CELL_H * i + 64 + (asc - desc) / 2
      actx.fillText(s, CELL_W / 2, y)
      actx.strokeText(s, CELL_W * 1.5, y)
      actx.fillText(s, CELL_W * 1.5, y)
    }
  }

  function setView(aspect, fov = FOV) { camera.aspect = aspect; camera.fov = fov; camera.updateProjectionMatrix() }
  function setPixelSize(w, h) { uViewport.value.set(w, h); uPxPerUnit.value = h / (2 * D * Math.tan((camera.fov * DEG) / 2)) }

  // ---- the three-panel small multiples (reduced-motion poster only; drawn once for tools/posters.mjs)
  const SPAN = 2.9 // mL of scale each panel frames, top to bottom
  function ndcY(x, y, z) { return new Vector3(x, y, z).project(camera).y }
  function ringsAndNumerals() {
    const nx = 0.505 * Math.sin(NUM_PHI), nz = 0.505 * Math.cos(NUM_PHI)
    const labelled = [], rings = []
    for (let n = NUM_FIRST - 1; n <= NUM_LAST + 1; n++) {
      const yr = -(n - TRUE_ML)
      if ([-0.5, 0.5].some((z) => Math.abs(ndcY(0, yr, z)) < 1.0)) rings.push(n)
      const y = yr + NUM_LIFT
      if ([y + NUM_HALF_GLYPH, y - NUM_HALF_GLYPH].every((yy) => Math.abs(ndcY(nx, yy, nz)) < 0.96)) labelled.push(n)
    }
    return { rings, labelled }
  }
  function drawTri() {
    const errors = []
    const panels = [LOOK.above, LOOK.level, LOOK.below].map((t, i) => {
      const x0 = Math.round((i * cssW) / 3), x1 = Math.round(((i + 1) * cssW) / 3), w = x1 - x0
      const aspect = w / cssH, fov = (2 * Math.atan(SPAN / 2 / D)) / DEG
      if (SPAN * aspect < 1.15) errors.push(`panel only ${(SPAN * aspect).toFixed(2)} mL wide: the tube walls would be cut`)
      setView(aspect, fov); place(t)
      const { rings, labelled } = ringsAndNumerals()
      for (const n of rings) if (!labelled.includes(n)) errors.push(`${(t / DEG).toFixed(0)}°: ring ${n} shows without its numeral`)
      return { t, x0, w, aspect, fov, rings }
    })
    for (const p of panels) if (p.rings.join() !== panels[1].rings.join()) errors.push(`rings ${p.rings} differ from level ${panels[1].rings}`)
    const all = panels.flatMap((p) => p.rings)
    uRange.value.set(Math.min(...all), Math.max(...all))
    renderer.setScissorTest(true)
    for (const p of panels) {
      renderer.setViewport(p.x0, 0, p.w, cssH); renderer.setScissor(p.x0, 0, p.w, cssH)
      setView(p.aspect, p.fov)
      setPixelSize(p.w * (bufW / cssW), bufH)
      place(p.t)
      renderer.render(scene, camera)
    }
    renderer.setScissorTest(false)
    renderer.setViewport(0, 0, cssW, cssH)
    uRange.value.set(NUM_FIRST, NUM_LAST)
    setView(cssW / cssH)
    setPixelSize(bufW, bufH)
    place(th)
    fig.dataset.triCheck = JSON.stringify({ errors, rings: panels[1].rings, spanMl: SPAN, panelWidthMl: +(SPAN * panels[1].aspect).toFixed(2) })
    drawnTh = NaN // the next ordinary frame redraws the single view
  }

  // ---- motion
  function startGlide(to, kind) {
    to = clamp(to, -TILT, TILT)
    target = to
    if (Math.abs(to - th) <= EPS) { glide = null; th = to; mode = 'rest'; needs = true; return }
    glide = { from: th, to, dur: RETURN_MS(to - th), t0: 0, kind }
    mode = 'glide'
  }
  function settleAt(t) {
    // the eye has come to rest: the button for its view lights (a button's choice keeps its own lit)
    th = t; glide = null; mode = 'rest'
    lit = suspended ? held : lookAtTheta(t)
  }
  function introAt(ms) {
    const { rise, hold, fall } = INTRO
    if (ms < rise) { intro.phase = 'rise'; return TILT * ease(ms / rise) }
    if (ms < rise + hold) { intro.phase = 'hold'; return TILT }
    intro.phase = 'fall'
    const u = (ms - rise - hold) / fall
    return u >= 1 ? null : TILT * (1 - ease(u))
  }

  return {
    id: env.id,
    async init(r) {
      renderer = r
      scene = new Scene()
      camera = new PerspectiveCamera(FOV, 1, 0.1, 50)
      let order = 0
      const add = (geo, mat, y = 0) => {
        const m = new Mesh(geo, mat)
        m.position.y = y
        m.renderOrder = order++
        m.matrixAutoUpdate = false
        m.updateMatrix()
        m.frustumCulled = false
        scene.add(m)
        disposables.push(mat)
        return m
      }
      const shader = (fragmentShader, extra = {}, vertexShader = VERT) => new ShaderMaterial({
        glslVersion: GLSL3, vertexShader, fragmentShader, transparent: true, depthWrite: false, depthTest: false, ...extra,
      })
      // (a) back half of the tube: rings show faintly through the glass
      const tubeGeo = new CylinderGeometry(R, R, 6, 128, 1, true)
      disposables.push(tubeGeo)
      add(tubeGeo, shader(GRAD_FRAG, { side: BackSide, uniforms: { uInk, uGround, uLiquid, uGloss3, uAlpha: { value: 0.22 }, uHalo: { value: 0 }, uGloss: { value: 0 } } }))
      // (b) liquid column, up to the contact line so no air gap shows under the meniscus
      const liqH = 3 + MEN_H
      const liqGeo = new CylinderGeometry(MEN_R, MEN_R, liqH, 96, 1, true); disposables.push(liqGeo)
      add(liqGeo, shader(LIQUID_FRAG, { side: FrontSide, uniforms: { uInk } }), MEN_H - liqH / 2)
      // (c) concave meniscus, rising at the wall
      const prof = []
      for (let i = 0; i <= 32; i++) { const t = i / 32; prof.push(new Vector2(MEN_R * t, MEN_H * t ** MEN_P)) }
      const menGeo = new LatheGeometry(prof, 96); disposables.push(menGeo)
      add(menGeo, shader(MENISCUS_FRAG, { side: DoubleSide, uniforms: { uInk, uGround, uHalo } }))
      // (d) glass edges: outer walls heavier than the inner (glass thickness) walls
      {
        const lines = [[-1, R, 0.0046, 0.9], [1, R, 0.0046, 0.9], [-1, R_IN, 0.0026, 0.55], [1, R_IN, 0.0026, 0.55]]
        const pos = [], line = [], acr = [], idx = []
        lines.forEach(([side, rr, hw, al], i) => {
          for (const y of [-3, 3]) for (const s of [-1, 1]) { pos.push(side * rr, y, 0); line.push(side, rr, hw, al); acr.push(s) }
          const o = i * 4
          idx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3)
        })
        const g = new BufferGeometry()
        g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
        g.setAttribute('aLine', new BufferAttribute(new Float32Array(line), 4))
        g.setAttribute('aAcross', new BufferAttribute(new Float32Array(acr), 1))
        g.setIndex(idx)
        disposables.push(g)
        add(g, shader(EDGE_FRAG, { side: DoubleSide, uniforms: { uInk, uViewport, uPxPerUnit } }, EDGE_VERT))
      }
      // (e) front half of the tube: graduations at full ink, with knockouts off level
      add(tubeGeo, shader(GRAD_FRAG, { side: FrontSide, uniforms: { uInk, uGround, uLiquid, uGloss3, uAlpha: { value: 1 }, uHalo, uGloss: { value: 1 } } }))
      await env.nextTask()
      // (f) numerals 22..28 on the glass at NUM_PHI, just above their whole-mL ring, drawn in Plex Mono 500
      try {
        await Promise.race([Promise.all([document.fonts.load(`500 88px ${monoStack}`), document.fonts.ready]), timeout(3000)])
      } catch (e) { /* the fallback face draws; the poster tool always waits for the real one */ }
      const CELL_W = 256, CELL_H = 128, COUNT = NUM_LAST - NUM_FIRST + 1
      atlas = document.createElement('canvas')
      atlas.width = 2 * CELL_W; atlas.height = CELL_H * COUNT
      actx = atlas.getContext('2d')
      drawAtlas()
      tex = new CanvasTexture(atlas)
      tex.premultiplyAlpha = true
      tex.anisotropy = 4
      disposables.push(tex)
      {
        const PW = 0.42, PH = 0.22
        const cs = Math.cos(NUM_PHI), sn = Math.sin(NUM_PHI)
        const pos = [], uv = [], nn = [], idx = []
        for (let i = 0; i < COUNT; i++) {
          const n = NUM_FIRST + i
          const cx = 0.505 * sn, cz = 0.505 * cs, cy = -(n - TRUE_ML) + NUM_LIFT
          const v0 = 1 - (i + 1) / COUNT, v1 = 1 - i / COUNT
          for (const [lx, ly, u, v] of [[-PW / 2, -PH / 2, 0, v0], [PW / 2, -PH / 2, 1, v0], [-PW / 2, PH / 2, 0, v1], [PW / 2, PH / 2, 1, v1]]) {
            pos.push(cx + lx * cs, cy + ly, cz - lx * sn)
            uv.push(u, v)
            nn.push(n)
          }
          const o = i * 4
          idx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3)
        }
        const g = new BufferGeometry()
        g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
        g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
        g.setAttribute('aN', new BufferAttribute(new Float32Array(nn), 1))
        g.setIndex(idx)
        disposables.push(g)
        add(g, shader(NUM_FRAG, { side: DoubleSide, premultipliedAlpha: true, uniforms: { uMap: { value: tex }, uRange, uInk, uGround, uLiquid } }, NUM_VERT))
      }
      place(th)
      await env.nextTask()
      // compile links exactly the canvas (SRGB-output) programs draw() uses; no render-target warm-up, which in r186
      // would link a second, linear-output variant of every material that nothing ever draws with (SYSTEM-C §5.6)
      await env.compile(renderer, scene, camera)
      await env.nextTask()
      // upload the numeral atlas now, so the first visible frame does not pay for it
      renderer.initTexture(tex)
      needs = true
    },
    resize(w, h) {
      cssW = w; cssH = h
      bufW = renderer.domElement.width; bufH = renderer.domElement.height
      setView(w / h)
      setPixelSize(bufW, bufH)
      needs = true
    },
    setState(s, { animate = true } = {}) {
      if (s === 'tri') { triOnce = true; needs = true; return }
      if (!(s in LOOK)) return
      intro.on = false
      held = s; lit = s
      suspended = true; susX = susY = -1
      if (animate) startGlide(LOOK[s], 'button')
      else { glide = null; mode = 'rest'; th = target = LOOK[s] }
      needs = true
    },
    // the one-time entry sequence: level → 12° above → hold → level (the stage calls it once, from the level view)
    intro() {
      glide = null; suspended = false
      held = 'level'; lit = null
      th = target = 0
      intro.on = true; intro.t0 = 0; intro.phase = 'rise'; intro.done = false
      mode = 'intro'
      needs = true
    },
    step(now) {
      if (mode === 'intro') {
        if (!intro.t0) intro.t0 = now - 1000 / 60 // the first frame already moves (the level view is on screen)
        const t = introAt(now - intro.t0)
        if (t === null) { intro.on = false; intro.done = true; settleAt(0); lit = 'level'; return th !== drawnTh }
        th = target = t
        lit = intro.phase === 'hold' ? 'above' : null
        return true
      }
      if (mode === 'glide') {
        if (!glide.t0) glide.t0 = now - 1000 / 60
        const u = (now - glide.t0) / glide.dur
        if (u >= 1) { const k = glide.kind; settleAt(glide.to); if (k === 'button') lit = held; return th !== drawnTh }
        th = glide.from + (glide.to - glide.from) * ease(u)
        return true
      }
      if (mode === 'follow') {
        const dt = lastT ? Math.min(now - lastT, 64) : 1000 / 60
        lastT = now
        th += (target - th) * (1 - Math.exp(-dt / TAU))
        if (Math.abs(target - th) <= EPS) { settleAt(target); return th !== drawnTh }
        return true
      }
      return false
    },
    draw() {
      renderer.setRenderTarget(null)
      renderer.setClearColor(clear, 1)
      renderer.autoClear = true
      if (triOnce) { triOnce = false; drawTri(); return }
      // a frame that would not move the drawing (the intro's hold, the last step of a glide) is not re-rendered: the
      // canvas keeps showing the identical previous frame
      if (!needs && Math.abs(th - drawnTh) < 1e-4) return
      place(th)
      renderer.render(scene, camera)
      drawnTh = th; needs = false
    },
    snapshot() {
      // context lost: the poster of the held state shows, so the readout must name it too (Path A)
      if (renderer && renderer.getContext().isContextLost() && (mode !== 'rest' || lookAtTheta(th) === null)) this.rest()
      const moving = mode !== 'rest'
      const exact = STATE_AT(th)
      const state = exact && (!moving || (mode === 'intro' && intro.phase === 'hold')) ? exact : null
      // a button glide reports where it is going (values change when the state that produces them changes); the
      // intro and the mouse report what is drawn
      const shownTh = moving && glide && glide.kind === 'button' ? glide.to : th
      const value = readingText(TRUE_ML, shownTh)
      const look = lookOf(TRUE_ML, shownTh)
      const phase = mode === 'intro' ? 'intro' : moving ? 'moving' : intro.done ? 'after-intro' : 'rest'
      return { state, poster: state, readout: { value, look, lit, phase }, key: `${state}|${value}|${look}|${lit}|${phase}` }
    },
    rest() {
      // continuous input → the nearest poster-backed state: the held choice (a button's) or level
      if (mode === 'intro') { intro.on = false; intro.done = true }
      glide = null
      const s = STATE_AT(th)
      if (s && s === held) { mode = 'rest'; lit = held; return }
      th = target = LOOK[held]; mode = 'rest'; lit = held; needs = true
    },
    snap() {
      if (mode === 'intro') { intro.on = false; intro.done = true; settleAt(0); lit = 'level' }
      else if (mode === 'glide') { const k = glide.kind; settleAt(glide.to); if (k === 'button') lit = held }
      else if (mode === 'follow') settleAt(target)
      needs = true
    },
    // fine mouse over the plate only (the stage forwards it): the mouse is the eye. Its height above or below the host's
    // centre row (the index ticks) sets the angle; the host's top and bottom edges are 12° above and below.
    pointer(e, rect) {
      if (mode === 'intro') return // the intro plays out; any button cancels it
      if (e.type === 'pointerleave' || e.type === 'pointercancel') {
        if (suspended) return
        lit = null
        startGlide(0, 'return') // off the plate the eye drifts back to level: at rest the figure shows the true reading
        if (mode === 'rest') settleAt(0)
        return
      }
      if (e.type === 'pointerenter') suspended = false
      else if (suspended) {
        // a keyboard press while the mouse rests on the plate: small jitter does not undo it
        if (susX < 0) { susX = e.clientX; susY = e.clientY; return }
        if (Math.abs(e.clientX - susX) < 24 && Math.abs(e.clientY - susY) < 24) return
        suspended = false
      }
      const o = clamp((rect.top + rect.height / 2 - e.clientY) / (rect.height / 2), -1, 1)
      const to = (Math.sign(o) * Math.max(0, Math.abs(o) - PDEAD)) / (1 - PDEAD) * TILT
      held = 'level'
      if (Math.abs(to - th) <= EPS && mode === 'rest') return
      if (mode !== 'follow') lastT = 0
      target = to; glide = null; mode = 'follow'
      if (lookAtTheta(to) === null || Math.abs(to - th) > EPS) lit = null
    },
    async restore() {
      // three.js rebuilt its GL state; the numeral atlas is a CanvasTexture and must be uploaded again
      if (tex) tex.needsUpdate = true
      needs = true
    },
    dispose() { for (const d of disposables) d.dispose() },
    stats() { return { drawCalls: scene ? scene.children.length : 0, triangles: 0 } },
    scale() { return 1 },
  }
}

// the discrete state the eye is exactly at (none while between)
function STATE_AT(t) {
  if (Math.abs(t - LOOK.above) < 1e-9) return 'above'
  if (Math.abs(t - LOOK.below) < 1e-9) return 'below'
  if (Math.abs(t) < 1e-9) return 'level'
  return null
}
