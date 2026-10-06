// demo.gl.js (DS lead) — the minimal complete scene module: the reference for the Scene contract (SYSTEM-C §5.2) and
// the day-0 stand-in for the GL figures until each team's real *.gl.js lands. One full-plate triangle, one program,
// one draw call. A procedural "field" whose contrast is the state index (0 … n−1) and whose light follows the mouse.
import { Scene, OrthographicCamera, Mesh, BufferGeometry, BufferAttribute, ShaderMaterial, Color, Vector2 } from './three.js'
import { Chan, stepAll, snapAll } from './channels.js'

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uPlate, uFg, uMark; uniform float uT, uAz; uniform vec2 uRes;
varying vec2 vUv;
vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
void main(){
  vec2 p = (vUv - .5) * vec2(uRes.x / uRes.y, 1.) * 9.;
  vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.; vec2 id;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y), o = h2(i + g), r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) d2 = d;
  }
  float edge = smoothstep(.0, .06, sqrt(d2) - sqrt(d1));
  float shade = .5 + .5 * cos(6.2831 * h2(id).x + uAz);
  vec3 c = mix(uPlate, mix(uPlate, uFg, .18 + .22 * shade), uT);
  c = mix(mix(c, uFg, .55 * uT), c, edge);
  float ring = smoothstep(.006, .0, abs(length(vUv - .5) - .46));
  gl_FragColor = vec4(mix(c, uMark, ring * .8), 1.);
  #include <colorspace_fragment>
}`

export function create(env) {
  const { tokens, fig } = env
  const states = (fig.dataset.states || 'a b').split(/\s+/)
  const tOf = (s) => Math.max(0, states.indexOf(s)) / Math.max(1, states.length - 1)
  const ch = { t: new Chan(tOf(fig.dataset.final)), az: new Chan(2.4, { angle: true }) }
  const list = Object.values(ch)
  let scene, camera, mat, geo, mesh, state = fig.dataset.final, introOn = false

  return {
    id: env.id,
    async init(renderer) {
      scene = new Scene(); camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
      geo = new BufferGeometry()
      geo.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
      geo.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2))
      mat = new ShaderMaterial({
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
        fragmentShader: FRAG, depthTest: false, depthWrite: false,
        uniforms: { uPlate: { value: new Color(tokens.plate) }, uFg: { value: new Color(tokens.fg) }, uMark: { value: new Color(tokens.aMark) },
          uT: { value: ch.t.v }, uAz: { value: ch.az.v }, uRes: { value: new Vector2(1, 1) } },
      })
      mesh = new Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh)
      await env.nextTask()
      await env.compile(renderer, scene, camera)
      this.renderer = renderer
    },
    resize(w, h) { mat.uniforms.uRes.value.set(w, h) },
    setState(s, { animate = true } = {}) {
      state = s
      if (animate) ch.t.tween(tOf(s), 600); else ch.t.set(tOf(s))
    },
    // the one-time entry sequence: from the state showing to data-final (a dip and back when they are equal)
    intro() {
      introOn = true
      const to = tOf(fig.dataset.final), done = () => { introOn = false }
      state = fig.dataset.final
      if (Math.abs(ch.t.v - to) > 1e-6) ch.t.tween(to, 1600, done)
      else ch.t.tween(Math.abs(to - 0.5) < 0.25 ? 1 : 0.5, 800, () => ch.t.tween(to, 900, done))
    },
    step(now) { return stepAll(list, now).moving },
    draw() {
      const r = this.renderer
      mat.uniforms.uT.value = ch.t.v; mat.uniforms.uAz.value = ch.az.v
      r.setRenderTarget(null); r.setClearColor(mat.uniforms.uPlate.value, 1); r.render(scene, camera)
    },
    snapshot() {
      const rest = !list.some((c) => c.busy) && Math.abs(ch.az.v - 2.4) < 1e-3
      const atState = Math.abs(ch.t.v - tOf(state)) < 1e-6
      return { state: atState && !introOn ? state : null, poster: rest && atState ? state : null, readout: null }
    },
    rest() { snapAll(list); if (Math.abs(ch.az.v - 2.4) > 1e-3) ch.az.set(2.4) },
    snap() { snapAll(list); introOn = false },
    pointer(e, rect) {
      if (e.type === 'pointerleave' || e.type === 'pointercancel') { ch.az.follow(2.4, 180); return }
      ch.az.follow(Math.atan2(-(e.clientY - rect.top - rect.height / 2), e.clientX - rect.left - rect.width / 2), 120)
    },
    async restore() { /* nothing baked: three re-uploads geometry and recompiles on the next render */ },
    dispose() { geo.dispose(); mat.dispose() },
    stats() { return { drawCalls: 1, triangles: 1 } },
    scale() { return 1 },
  }
}
