// field.gl.js (Team ENG, lazy): Path B's microscope field as a stage scene (SYSTEM-C §5.2, SPEC-C §4.2).
// Two instances: Fig. 1 (hero, ×200, polished → etched) and Fig. 2 (band, ×500, etched → indented → measured). They
// share ONE baked grain render target and noise texture through env.shared. The grain bake, field shader and indent maths
// are the Path B prototype's, unchanged except: (a) the specimen shading is a function, so a reverse change
// (un-etch, un-indent) cross-fades inside the shader instead of popping; (b) the Fig. 2 crosshairs are drawn here, in the
// same pass, so the 'measured' poster and the live frame are the same picture. One program, one draw call per frame.
import {
  Scene, OrthographicCamera, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, Vector2, Vector3, Color,
  WebGLRenderTarget, DataTexture, UnsignedByteType, RGBAFormat, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping,
  NoColorSpace, SRGBColorSpace,
} from '../../shell/stage/three.js'
import { Chan, stepAll, snapAll } from '../../shell/stage/channels.js'
// the model (field.model.js over facts.json) arrives through the figure (fig.__field, set by chapter.js), not by import:
// importing it here would split facts.json and the model out of the main bundle into a shared chunk (an extra request)
let M = null
const REST_AZ = 2.4 // light from the upper left
const SWEEP_REST = 1.2 // the raking sweep parked outside the disc
const BAKE_N = 1024 // 1024 on phones too: the ×500 band magnifies a 512 bake ~2× and boundaries wobble (Path B)
const STRIPS = 8
// ?slow=N review aid (channels.js stretches durations; the intro's offsets stretch with them)
const SLOW = (() => { try { return Math.min(50, Math.max(1, +new URLSearchParams(location.search).get('slow') || 1)) } catch (e) { return 1 } })()

// ---------------------------------------------------------------------------------------------------- GLSL
const HASH = /* glsl */ `
uvec4 pcg4d(uvec4 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  v ^= v >> 16u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  return v;
}
vec4 hash4(vec2 c, float salt) {
  ivec2 i = ivec2(floor(c + 0.5));
  uvec4 u = pcg4d(uvec4(uint(i.x + 4096), uint(i.y + 4096), uint(salt), 2654435769u));
  return vec4(u >> 8u) / 16777215.0;
}
`
const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`
// Grain bake (Path B §2 as built): domain-warped periodic power diagram with annealing twins.
// R = orientation, G = facet azimuth, B = grain-boundary distance / 0.15 cell, A = 0.5 + signed twin distance / 0.3 cell
const BAKE_FRAG = /* glsl */ `
precision highp float;
precision highp int;
varying vec2 vUv;
uniform float uC;
${HASH}
float vnoiseP(vec2 x, float period, float salt) {
  vec2 i = floor(x); vec2 f = x - i; vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash4(mod(i, period), salt).x;
  float b = hash4(mod(i + vec2(1.0, 0.0), period), salt).x;
  float c = hash4(mod(i + vec2(0.0, 1.0), period), salt).x;
  float d = hash4(mod(i + vec2(1.0, 1.0), period), salt).x;
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float pnoise(vec2 x, float salt) {
  float s = 0.0, amp = 0.5, per = uC * 0.5, norm = 0.0;
  for (int o = 0; o < 3; o++) { s += amp * vnoiseP(x, per, salt + float(o) * 13.0); norm += amp; x *= 2.0; per *= 2.0; amp *= 0.5; }
  return (s / norm) * 2.0 - 1.0;
}
vec2 seedOffset(vec2 cell) { return 0.5 + 0.9 * (hash4(mod(cell, uC), 0.0).xy - 0.5); }
float seedW(vec2 cell) { float u = hash4(mod(cell, uC), 3.0).x; return 0.9 * u * u * u * u * u - 0.10; }
void main() {
  vec2 p0 = vUv * uC;
  vec2 p = p0 + 0.30 * vec2(pnoise(p0 * 0.5, 1.0), pnoise(p0 * 0.5 + 17.3, 2.0));
  vec2 n = floor(p); vec2 f = p - n;
  vec2 mg = vec2(0.0), mr = vec2(0.0); float md = 1e9;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 r = g + seedOffset(n + g) - f;
    float d = dot(r, r) - seedW(n + g);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float own = md; md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + seedOffset(n + g) - f;
    vec2 dr = r - mr; float L = length(dr);
    if (L > 1e-3) md = min(md, (dot(r, r) - seedW(n + g) - own) / (2.0 * L));
  }
  vec2 id = mod(n + mg, uC);
  vec4 h = hash4(id, 5.0); vec4 h2 = hash4(id, 9.0);
  vec2 seed = n + mg + seedOffset(n + mg); vec2 rel = p0 - seed;
  float tsd = 1.0;
  if (h.x < 0.68) {
    float a = h.y * 3.14159265; vec2 nn = vec2(cos(a), sin(a));
    float s = dot(rel, nn); float o = (h.z - 0.5) * 0.8;
    float w = 0.09 + 0.36 * pow(h.w, 1.8);
    float e = abs(s - o) - 0.5 * w;
    if (h2.z < 0.05) {
      float b = (h2.y < 0.5 ? 1.0 : -1.0) * (0.55 + 0.35 * h2.x);
      vec2 tdir = vec2(-nn.y, nn.x) * cos(b) + nn * sin(b);
      float side = h2.z < 0.025 ? 1.0 : -1.0;
      e = max(e, side * (dot(rel, tdir) - (h2.w - 0.5) * 0.6));
    }
    tsd = e;
    if (h.x < 0.06) {
      float w2 = 0.09 + 0.08 * h2.y; float o2 = o + 0.5 * w + 0.10 + 0.20 * h2.x + 0.5 * w2;
      tsd = min(tsd, abs(s - o2) - 0.5 * w2);
    }
  }
  float R = h2.x;
  gl_FragColor = vec4(R, fract(R * 1.618 + h.z), clamp(md / 0.15, 0.0, 1.0), clamp(0.5 + tsd / 0.3, 0.0, 1.0));
}
`
// Field shader (Path B §3 as built). lumAt(etch, indent) is the specimen; main() cross-fades two of them (uXf) for the
// reverse changes, adds the sweep, the field falloff, and the measuring crosshairs (Fig. 2) on top.
const FIELD_FRAG = /* glsl */ `
precision highp float;
precision highp int;
varying vec2 vUv;
uniform sampler2D uGrain;
uniform sampler2D uNoise;
uniform float uTile, uFieldMicrons, uMipBias, uLightAz, uLightEl, uSweep, uA1, uA2, uDist, uGloss;
uniform vec2 uOffset, uIndentC;
uniform float uEtch, uIndent, uEtch2, uIndent2, uXf;   // specimen A, specimen B, cross-fade A -> B
uniform float uXh, uXhA, uXhA2;                        // crosshair spread (1 = on the corners) and opacity (A, B)
uniform vec3 uAcc, uUnder;                             // crosshair line + underlay (display sRGB, from tokens)
float vnoise(vec2 x, vec2 salt, vec4 ch) {
  vec2 i = floor(x); vec2 f = x - i; vec2 u = f * f * (3.0 - 2.0 * f);
  return dot(texture(uNoise, (i + salt + u + 0.5) / 256.0), ch);
}
vec4 noiseAt(vec2 cell) { return texelFetch(uNoise, ivec2(mod(cell, 256.0)), 0); }
float shade(float R, float azimuth, float mott, vec3 L, vec3 H, float e) {
  float tilt = 0.03 + 0.28 * e;
  float az = azimuth * 6.2831853;
  vec3 n = normalize(vec3(cos(az) * tilt, sin(az) * tilt, 1.0));
  float base = mix(1.05, 0.98 - 0.46 * pow(R, 2.6), e);
  base *= 1.0 + mott * e;
  float spec = pow(max(dot(n, H), 0.0), mix(64.0, 40.0, uGloss)) * (0.08 + (0.18 + 0.10 * uGloss) * e);
  return base * (0.78 + 0.22 * dot(n, L)) + spec;
}
// per-pixel inputs shared by both specimens
vec4 g, gf; vec2 um, q; vec3 L, H;
float pxum, aa, defocus, gb, tb, twin, mott0, slow, attack, inc;
float lumAt(float etch, float ind) {
  float eB = smoothstep(0.0, 0.55, etch);
  float eC = smoothstep(0.25, 1.0, etch);
  float lum = mix(shade(g.r, g.g, mott0 + 0.22 * slow * (g.g - 0.5), L, H, eC),
                  shade(fract(g.r + 0.37), fract(g.g + 0.6), mott0 + 0.22 * slow * (fract(g.g + 0.6) - 0.5), L, H, eC), twin);
  if (defocus > 0.0) {
    float far = shade(gf.r, gf.g, 0.0, L, H, eC) * (1.0 - 0.10 * eB);
    lum = mix(lum, far, smoothstep(0.0, 1.0, defocus));
  }
  lum = mix(lum, 0.10, inc * 0.85);
  lum *= 1.0 - 0.85 * attack * gb * eB;
  lum *= 1.0 - 0.32 * (0.6 + 0.4 * attack) * tb * eC;
  if (ind > 0.0) {
    float a1 = uA1 * ind, a2 = uA2 * ind;
    float m = abs(q.x) / a1 + abs(q.y) / a2;
    float u = (abs(q.x) / a1) / max(m, 1e-4);
    m /= 1.0 - 0.06 * u * (1.0 - u);           // sink-in: sides bow inward, corners stay at +-a1, +-a2
    float aa2 = max(fwidth(m), 1e-4) * 0.75;
    float inside = 1.0 - smoothstep(1.0 - aa2, 1.0 + aa2, m);
    vec3 fn = normalize(vec3(-sign(q.x) * 0.286, -sign(q.y) * 0.286, 1.0));   // 22 deg faces of the 136 deg pyramid
    float facet = (0.11 + 0.07 * max(dot(fn, L), 0.0)) * (0.82 + 0.18 * m);
    float crease = min(abs(q.x), abs(q.y));
    facet *= 1.0 - 0.5 * (1.0 - smoothstep(0.6 - aa, 0.6 + aa, crease));
    float outside = smoothstep(1.0 - aa2, 1.0 + aa2, m);
    lum *= 1.0 - 0.12 * exp(-pow((m - 1.0) * uA1 / 1.5, 2.0)) * outside * ind;
    lum = mix(lum, facet, inside);
  }
  return lum;
}
void main() {
  um = (vUv - 0.5) * uFieldMicrons + uOffset;
  q = um - uIndentC;
  pxum = uFieldMicrons * fwidth(vUv.x);                  // um per device pixel (orthographic: exact)
  defocus = clamp(uMipBias * 0.25, 0.0, 1.0);
  g = texture(uGrain, um / uTile, uMipBias * 0.5);
  float dGB = g.b * uDist;
  float eT = (g.a - 0.5) * 2.0 * uDist;
  float dTB = abs(eT);
  aa = max(pxum * 0.75, 0.0012 * uFieldMicrons);
  gb = 1.0 - smoothstep(0.7 - aa, 0.7 + aa, dGB);
  tb = 1.0 - smoothstep(0.4 - aa, 0.4 + aa, dTB);
  if (defocus > 0.0) {
    float bl = 3.0 * defocus;
    gb = (1.0 - smoothstep(0.0, 0.7 + aa + bl, dGB)) * (1.0 - 0.6 * defocus);
    tb *= 1.0 - defocus;
    gf = texture(uGrain, um / uTile, uMipBias + 2.5);
  }
  twin = 1.0 - smoothstep(-aa, aa, eT);
  L = vec3(cos(uLightAz) * cos(uLightEl), sin(uLightAz) * cos(uLightEl), sin(uLightEl));
  H = normalize(L + vec3(0.0, 0.0, 1.0));
  float fine = (vnoise(um / 9.0, vec2(0.0), vec4(0.0, 1.0, 0.0, 0.0)) - 0.5) * (1.0 - smoothstep(0.08, 0.2, pxum / 9.0));
  mott0 = 0.10 * (vnoise(um / 26.0, vec2(0.0), vec4(1.0, 0.0, 0.0, 0.0)) - 0.5) + 0.05 * fine;
  slow = vnoise(um / 70.0, vec2(41.0, 17.0), vec4(0.0, 0.0, 1.0, 0.0)) - 0.5;
  // non-metallic inclusions (small oxides): about one 50 um cell in 14 holds one, 0.8-2.2 um in radius, so a 700 um
  // field at x200 shows about ten, as in clean 316L bar; the same dots sit in the polished and the etched field
  vec2 ic = floor(um / 50.0);
  vec4 ni = noiseAt(ic + vec2(101.0, 57.0));
  inc = 0.0;
  float ir = 0.8 + 1.4 * ni.w;
  if (ni.x > 0.93) inc = 1.0 - smoothstep(ir - aa, ir + aa, length(um - (ic + 0.2 + 0.6 * ni.yz) * 50.0));
  attack = 0.55 + 0.45 * vnoise(um / 17.0, vec2(83.0, 29.0), vec4(0.0, 0.0, 0.0, 1.0));

  float lum = lumAt(uEtch, uIndent);
  if (uXf > 0.0) lum = mix(lum, lumAt(uEtch2, uIndent2), uXf);
  lum += 0.26 * exp(-pow((vUv.x + vUv.y - 1.0 - uSweep) / 0.13, 2.0));
  lum *= mix(1.0, 0.88, smoothstep(0.72, 1.0, length(vUv - 0.5) * 2.0));
  float eC = smoothstep(0.25, 1.0, mix(uEtch, uEtch2, uXf));
  vec3 tint = mix(vec3(0.975, 0.985, 1.0), vec3(1.0, 0.99, 0.97), eC);
  float k = max(lum - 0.92, 0.0);
  lum = min(lum, 0.92) + 0.14 * (1.0 - exp(-k / 0.14));
  vec3 col = mix(vec3(0.16, 0.17, 0.18), vec3(0.95, 0.95, 0.94), max(lum, 0.0)) * tint;

  // measuring crosshairs (Fig. 2): vertical pair at x = +-a1, horizontal pair at y = +-a2, spread uXh (1.7 -> 1 as they
  // close). Widths are fractions of the field (1.5 px line, 3.5 px underlay on a 560 px field), never under 1.5 device px,
  // so a poster and the live frame show the same lines at any size.
  float xa = mix(uXhA, uXhA2, uXf);
  if (xa > 0.0) {
    float d = min(abs(abs(q.x) - uA1 * uXh), abs(abs(q.y) - uA2 * uXh));
    float wl = 0.5 * max(0.0027 * uFieldMicrons, 1.5 * pxum);   // never under 1.5 device px: a line that falls between
    float wu = 0.5 * max(0.0063 * uFieldMicrons, 3.0 * pxum);   // two pixel centres keeps its colour instead of going muddy
    float cu = 1.0 - smoothstep(wu - 0.5 * pxum, wu + 0.5 * pxum, d);
    float cl = 1.0 - smoothstep(wl - 0.5 * pxum, wl + 0.5 * pxum, d);
    col = mix(col, uUnder, cu * 0.6 * xa);
    col = mix(col, uAcc, cl * xa);
  }
  col += (texelFetch(uNoise, ivec2(gl_FragCoord.xy) & 255, 0).w - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`

// ---------------------------------------------------------------------------------------------------- shared grain
function tri() {
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2))
  return geo
}
function sharedGrain(env) {
  let G = env.shared.get('field.grain')
  if (G) return G
  const rt = new WebGLRenderTarget(BAKE_N, BAKE_N, {
    type: UnsignedByteType, format: RGBAFormat, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter,
    wrapS: RepeatWrapping, wrapT: RepeatWrapping, depthBuffer: false, stencilBuffer: false, colorSpace: NoColorSpace,
  })
  // 256² RGBA white noise, seeded: identical for live frames and posters
  const N = 256, data = new Uint8Array(N * N * 4)
  let seed = 0x9e3779b9
  for (let i = 0; i < data.length; i++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; data[i] = (seed >>> 0) & 255 }
  const noise = new DataTexture(data, N, N, RGBAFormat, UnsignedByteType)
  noise.wrapS = noise.wrapT = RepeatWrapping
  noise.magFilter = noise.minFilter = LinearFilter
  noise.generateMipmaps = false
  noise.colorSpace = NoColorSpace
  noise.needsUpdate = true
  const geo = tri()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: BAKE_FRAG, uniforms: { uC: { value: M.GRAIN.cells } }, depthTest: false, depthWrite: false })
  const scene = new Scene()
  const mesh = new Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh)
  G = { rt, noise, geo, camera, bakeP: null }
  // The bake (a 5×5 power-diagram search per texel) goes in 8 horizontal strips, one per task: no long task, no
  // compositor stall. Mipmaps are built once, after the last strip.
  G.bake = async (renderer) => {
    await env.compile(renderer, scene, camera)
    await env.nextTask() // the program link and the first strip (which also allocates the target) in separate tasks
    const h = Math.ceil(BAKE_N / STRIPS), ac = renderer.autoClear
    renderer.autoClear = false
    try {
      for (let i = 0; i < STRIPS; i++) {
        rt.scissor.set(0, i * h, BAKE_N, Math.min(h, BAKE_N - i * h))
        rt.scissorTest = true
        rt.texture.generateMipmaps = i === STRIPS - 1
        renderer.setRenderTarget(rt)
        renderer.render(scene, camera)
        rt.texture.generateMipmaps = true
        renderer.setRenderTarget(null)
        if (i < STRIPS - 1) await env.nextTask()
      }
    } finally { rt.scissorTest = false; renderer.autoClear = ac }
  }
  G.ensure = (renderer) => (G.bakeP ||= G.bake(renderer))
  // after a context restore three.js has forgotten every GPU object: the first scene to restore re-bakes, the other
  // finds the render target's framebuffer already rebuilt
  G.restore = async (renderer) => { if (!renderer.properties.get(rt).__webglFramebuffer) { G.bakeP = G.bake(renderer); await G.bakeP } }
  env.shared.set('field.grain', G)
  return G
}

const srgb = (css) => { const t = { r: 0, g: 0, b: 0 }; new Color(css).getRGB(t, SRGBColorSpace); return new Vector3(t.r, t.g, t.b) }

// ---------------------------------------------------------------------------------------------------- scene
export function create(env) {
  M = env.fig.__field
  const hero = env.id === 'field'
  const O = hero ? M.HERO : M.BAND
  const ch = {
    etch: new Chan(1), indent: new Chan(hero ? 0 : 1), sweep: new Chan(SWEEP_REST), mip: new Chan(0),
    az: new Chan(REST_AZ, { angle: true }), gloss: new Chan(0), xh: new Chan(1), xhA: new Chan(hero ? 0 : 1), xf: new Chan(0),
  }
  const list = Object.values(ch)
  const B2 = { etch: 1, indent: 0, xhA: 0 } // cross-fade target
  let renderer, scene, camera, mat, G
  let state = env.fig.dataset.final, phase = null, introOn = false, seq = 0

  // the resting picture of a state, set at once
  function put(s) {
    ch.sweep.set(SWEEP_REST); ch.mip.set(0); ch.xh.set(1); ch.xf.set(0)
    if (hero) { ch.etch.set(s === 'etched' ? 1 : 0); ch.indent.set(0); ch.xhA.set(0) } else {
      ch.etch.set(1); ch.indent.set(s === 'etched' ? 0 : 1); ch.xhA.set(s === 'measured' ? 1 : 0)
    }
  }
  // reverse changes (un-etch, un-indent, crosshairs off) are not physical processes: cross-fade to the target picture
  function crossfade(t) {
    const tok = ++seq
    snapAll(list)
    if (tok !== seq) return
    Object.assign(B2, { etch: ch.etch.v, indent: ch.indent.v, xhA: ch.xhA.v }, t)
    ch.xf.set(0)
    ch.xf.tween(1, 240, () => { ch.etch.set(B2.etch); ch.indent.set(B2.indent); ch.xhA.set(B2.xhA); ch.xh.set(1); ch.xf.set(0) })
  }
  const settled = () => !list.some((c) => c.busy) && ch.xf.v === 0 && ch.mip.v === 0 && ch.sweep.v === SWEEP_REST

  return {
    id: env.id,
    async init(r) {
      renderer = r
      G = sharedGrain(env)
      camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
      const t = env.tokens
      mat = new ShaderMaterial({
        vertexShader: VERT, fragmentShader: FIELD_FRAG, depthTest: false, depthWrite: false,
        uniforms: {
          uGrain: { value: G.rt.texture }, uNoise: { value: G.noise }, uTile: { value: M.GRAIN.cells * M.GRAIN.cellUm },
          uFieldMicrons: { value: O.field }, uOffset: { value: new Vector2(...M.OFFSET) }, uIndentC: { value: new Vector2(...M.OFFSET) },
          uMipBias: { value: 0 }, uLightAz: { value: REST_AZ }, uLightEl: { value: 0.61 }, uSweep: { value: SWEEP_REST },
          uA1: { value: M.A1 }, uA2: { value: M.A2 }, uDist: { value: 0.15 * M.GRAIN.cellUm }, uGloss: { value: 0 },
          uEtch: { value: 1 }, uIndent: { value: 0 }, uEtch2: { value: 1 }, uIndent2: { value: 0 }, uXf: { value: 0 },
          uXh: { value: 1 }, uXhA: { value: 0 }, uXhA2: { value: 0 },
          uAcc: { value: srgb(t.a) }, uUnder: { value: srgb(t.surface) },
        },
      })
      this.clear = new Color(t.surface)
      scene = new Scene()
      const mesh = new Mesh(G.geo, mat); mesh.frustumCulled = false; scene.add(mesh)
      await env.nextTask()
      await G.ensure(renderer)
      await env.nextTask()
      await env.compile(renderer, scene, camera)
    },
    resize() { /* the shader measures its own pixel footprint (fwidth); nothing is sized here */ },
    setState(s, { animate = true } = {}) {
      const was = state
      state = s; introOn = false; phase = null
      if (!animate) { seq++; snapAll(list); put(s); return }
      const tok = ++seq, ok = () => tok === seq
      if (hero) {
        if (s === 'etched') {
          if (ch.sweep.busy) ch.sweep.set(SWEEP_REST)
          if (ch.xf.busy) ch.xf.snap()
          if (ch.etch.v !== 1 || ch.etch.busy) ch.etch.tween(1, 600) // the etch develops
        } else if (ch.etch.v !== 0 || ch.etch.busy || was !== s) crossfade({ etch: 0 })
        return
      }
      if (ch.mip.v !== 0 || ch.mip.busy) ch.mip.tween(0, 300)
      if (ch.az.v !== REST_AZ || ch.az.busy) ch.az.tween(REST_AZ, 400)
      if (s === 'etched') { if (ch.indent.v > 0 || ch.xhA.v > 0 || ch.indent.busy) crossfade({ indent: 0, xhA: 0 }) }
      else if (s === 'indented') {
        if (ch.xhA.v > 0) crossfade({ indent: 1, xhA: 0 })
        else if (ch.indent.v !== 1 || ch.indent.busy) ch.indent.tween(1, 600)
      } else {
        const close = () => { if (!ok()) return; ch.xhA.set(1); ch.xh.set(1.7); ch.xh.tween(1, 700) }
        if (ch.xf.busy) ch.xf.snap()
        if (ch.indent.v < 1 || ch.indent.busy) ch.indent.tween(1, 600, close)
        else if (ch.xhA.v < 1 || ch.xh.busy) close()
      }
    },
    // the one-time entry sequence, ending in data-final. Every step is scheduled from one start time (no drift from
    // chaining on frame callbacks), so the sequence lasts exactly its sum.
    intro() {
      const tok = ++seq, ok = () => tok === seq
      introOn = true
      const T = performance.now()
      const at = (c, to, ms, off, done) => { c.tween(to, ms, done); c.tw.t0 = T + off * SLOW }
      const end = () => { if (ok()) { introOn = false; phase = null } }
      if (hero) {
        // Fig. 1: a raking light sweeps the mirror (900 ms), then the etch develops (1.2 s): 2.1 s, then still
        state = 'etched'; phase = 'polished'
        put('polished'); ch.sweep.set(-SWEEP_REST)
        at(ch.sweep, SWEEP_REST, 900, 0, () => { if (ok()) phase = 'etching' })
        at(ch.etch, 1, 1200, 900, end)
        return
      }
      // Fig. 2 (SPEC-C §4.2): objective change (focus pull 700 ms); the light turns through 180° (1.6 s); the indent
      // lands (600 ms); the crosshairs close on the corners (700 ms): 3.6 s, then still
      state = 'measured'; phase = 'etched'
      put('etched'); ch.mip.set(4); ch.az.set(REST_AZ - Math.PI); ch.xh.set(1.7)
      at(ch.mip, 0, 700, 0)
      at(ch.az, REST_AZ, 1600, 700)
      at(ch.indent, 1, 600, 2300, () => { if (ok()) { phase = 'indented'; ch.xhA.set(1) } })
      at(ch.xh, 1, 700, 2900, end)
    },
    step(now) { const r = stepAll(list, now); return r.changed || r.moving },
    draw() {
      const u = mat.uniforms
      u.uEtch.value = ch.etch.v; u.uIndent.value = ch.indent.v; u.uSweep.value = ch.sweep.v; u.uMipBias.value = ch.mip.v
      u.uLightAz.value = ch.az.v; u.uGloss.value = ch.gloss.v; u.uXh.value = ch.xh.v; u.uXhA.value = ch.xhA.v; u.uXf.value = ch.xf.v
      u.uEtch2.value = B2.etch; u.uIndent2.value = B2.indent; u.uXhA2.value = B2.xhA
      renderer.setRenderTarget(null)
      renderer.autoClear = true
      renderer.setClearColor(this.clear, 1)
      renderer.render(scene, camera)
    },
    snapshot() {
      const st = introOn ? (hero ? 'polished' : phase) : state
      const rest = settled() && Math.abs(ch.az.v - REST_AZ) < 1e-3 && ch.gloss.v === 0
      let poster = null
      if (rest && !introOn) {
        const pic = hero ? (ch.etch.v === 1 ? 'etched' : ch.etch.v === 0 ? 'polished' : null)
          : ch.indent.v === 0 && ch.xhA.v === 0 ? 'etched' : ch.indent.v === 1 && ch.xhA.v === 0 ? 'indented' : ch.indent.v === 1 && ch.xhA.v === 1 && ch.xh.v === 1 ? 'measured' : null
        poster = pic === state ? pic : null
      }
      const closed = !hero && ch.xhA.v === 1 && ch.xh.v === 1 && !ch.xh.busy && !ch.indent.busy && ch.xf.v === 0
      const readout = hero ? null : M.readout(st === 'measured' && closed ? 'measured' : 'none')
      return { state: st, poster, readout, phase: introOn ? phase : null, key: `${st}|${poster}|${introOn ? phase : ''}|${readout ? readout.hv : ''}` }
    },
    rest() { ch.az.set(REST_AZ); ch.gloss.set(0); this.snap() },
    snap() { seq++; snapAll(list); put(state); introOn = false; phase = null },
    // the raking light follows a fine mouse over the Fig. 1 plate (the stage forwards plate events only)
    pointer(e, rect) {
      if (!hero) return
      if (e.type === 'pointerleave' || e.type === 'pointercancel') {
        ch.az.follow(REST_AZ, 180)
        if (ch.gloss.v !== 0 || ch.gloss.busy) ch.gloss.tween(0, 400)
        return
      }
      ch.az.follow(Math.atan2(-(e.clientY - (rect.top + rect.height / 2)), e.clientX - (rect.left + rect.width / 2)), 120)
      if (!(ch.gloss.tw && ch.gloss.tw.to === 1) && ch.gloss.v !== 1) ch.gloss.tween(1, 300)
    },
    async restore(r) { renderer = r; await G.restore(r) },
    dispose() { mat.dispose() },
    stats() { return { drawCalls: 1, triangles: 1 } },
    scale(coarse) { return coarse ? 0.75 : 1 },
  }
}
