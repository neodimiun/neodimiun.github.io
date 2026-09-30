/**
 * Procedural main landing gear rendered as a radiograph: Fresnel-lit
 * volumes plus edge lines on a dark plate. Built from primitives so
 * there is no model file to license. Loaded lazily by GearSequence.
 */
import * as THREE from "three"

export type GearPart = "piston" | "links" | "fittings" | "axle" | "wheel"

export type GearScene = {
  /** 0..1 within the hold phase: drives rotation and plate fade. */
  setProgress: (t: number) => void
  setActive: (parts: Set<GearPart>) => void
  /** Screen-space anchors (css px) for each part, after the last render. */
  anchors: () => Record<GearPart, { x: number; y: number; visible: boolean }>
  render: () => void
  resize: () => void
  dispose: () => void
}

const XRAY = new THREE.Color("#4aa8e8")
const HOT = new THREE.Color("#bfe6ff")

const VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uHi;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(f, 2.4);
    float core = 0.06 + 0.10 * uHi;
    vec3 c = mix(uColor, uHot, uHi * 0.7);
    float a = (core + rim * (0.85 + 0.6 * uHi)) * uOpacity;
    gl_FragColor = vec4(c * (0.55 + rim * 0.9 + uHi * 0.5), a);
  }
`

function xrayMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uColor: { value: XRAY.clone() },
      uHot: { value: HOT.clone() },
      uHi: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}

type Piece = { mesh: THREE.Mesh; edges: THREE.LineSegments; part: GearPart }

export function createGearScene(container: HTMLElement): GearScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.className = "gear-3d"
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 1.75, 9.6)
  camera.lookAt(0, 1.7, 0)

  const rig = new THREE.Group()
  scene.add(rig)

  const pieces: Piece[] = []
  const edgeMat = new THREE.LineBasicMaterial({ color: XRAY, transparent: true, opacity: 0.32 })

  const add = (geo: THREE.BufferGeometry, part: GearPart, place: (o: THREE.Object3D) => void) => {
    const mesh = new THREE.Mesh(geo, xrayMaterial())
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat)
    place(mesh)
    place(edges)
    rig.add(mesh, edges)
    pieces.push({ mesh, edges, part })
  }

  // Outer cylinder (main fitting) and oleo piston
  add(new THREE.CylinderGeometry(0.3, 0.3, 1.7, 40, 1), "fittings", (o) => o.position.set(0, 2.45, 0))
  add(new THREE.CylinderGeometry(0.19, 0.19, 1.5, 40, 1), "piston", (o) => o.position.set(0, 1.15, 0))
  // Collars (upper and lower torque link attachments)
  add(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 40, 1), "fittings", (o) => o.position.set(0, 1.72, 0))
  add(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 40, 1), "fittings", (o) => o.position.set(0, 0.62, 0))
  // Trunnion at the top
  add(new THREE.BoxGeometry(0.9, 0.26, 0.3), "fittings", (o) => o.position.set(0, 3.38, 0))
  // Torque links: upper from collar to apex, lower from apex to piston collar
  const apex = new THREE.Vector3(0, 1.17, 0.78)
  const upperFrom = new THREE.Vector3(0, 1.72, 0.34)
  const lowerTo = new THREE.Vector3(0, 0.62, 0.24)
  const link = (a: THREE.Vector3, b: THREE.Vector3) => {
    const len = a.distanceTo(b)
    const geo = new THREE.BoxGeometry(0.16, len, 0.12)
    add(geo, "links", (o) => {
      o.position.copy(a).add(b).multiplyScalar(0.5)
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    })
  }
  link(upperFrom, apex)
  link(apex, lowerTo)
  add(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 20, 1), "links", (o) => {
    o.position.copy(apex)
    o.rotation.z = Math.PI / 2
  })
  // Drag brace, back and up
  {
    const a = new THREE.Vector3(0, 3.1, -0.15)
    const b = new THREE.Vector3(0, 1.75, -1.55)
    const len = a.distanceTo(b)
    add(new THREE.CylinderGeometry(0.075, 0.075, len, 20, 1), "fittings", (o) => {
      o.position.copy(a).add(b).multiplyScalar(0.5)
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    })
  }
  // Axle
  add(new THREE.CylinderGeometry(0.1, 0.1, 1.9, 24, 1), "axle", (o) => {
    o.position.set(0, 0.38, 0)
    o.rotation.z = Math.PI / 2
  })
  // Wheels: tire, rim, hub, on each side
  for (const sx of [-1, 1]) {
    add(new THREE.TorusGeometry(0.42, 0.2, 18, 44), "wheel", (o) => {
      o.position.set(sx * 0.68, 0.38, 0)
      o.rotation.y = Math.PI / 2
    })
    add(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32, 1), "wheel", (o) => {
      o.position.set(sx * 0.68, 0.38, 0)
      o.rotation.z = Math.PI / 2
    })
    add(new THREE.CylinderGeometry(0.13, 0.13, 0.36, 20, 1), "axle", (o) => {
      o.position.set(sx * 0.68, 0.38, 0)
      o.rotation.z = Math.PI / 2
    })
  }

  // Floor grid, faint
  const grid = new THREE.GridHelper(8, 16, XRAY, XRAY)
  const gm = grid.material as THREE.Material
  gm.transparent = true
  gm.opacity = 0.08
  grid.position.y = -0.12
  scene.add(grid)

  // Part anchors in rig space
  const anchorPts: Record<GearPart, THREE.Vector3> = {
    piston: new THREE.Vector3(0.19, 1.05, 0),
    links: apex.clone(),
    fittings: new THREE.Vector3(0.36, 1.72, 0),
    axle: new THREE.Vector3(0.32, 0.38, 0.1),
    wheel: new THREE.Vector3(0.68, 0.38, 0.62),
  }
  const lastAnchors: Record<GearPart, { x: number; y: number; visible: boolean }> = {
    piston: { x: 0, y: 0, visible: false },
    links: { x: 0, y: 0, visible: false },
    fittings: { x: 0, y: 0, visible: false },
    axle: { x: 0, y: 0, visible: false },
    wheel: { x: 0, y: 0, visible: false },
  }

  let width = 1
  let height = 1
  let t = 0
  const active = new Set<GearPart>()
  const hi: Record<GearPart, number> = { piston: 0, links: 0, fittings: 0, axle: 0, wheel: 0 }

  const resize = () => {
    width = Math.max(1, container.clientWidth)
    height = Math.max(1, container.clientHeight)
    renderer.setSize(width, height, false)
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    camera.aspect = width / height
    // Keep the whole gear in frame on narrow screens
    camera.fov = width < height ? 46 : 30
    camera.updateProjectionMatrix()
  }

  const v = new THREE.Vector3()
  const render = () => {
    // Slow orbit as the reader scrolls, with a slight tilt so the links read
    rig.rotation.y = -0.5 + t * 1.45
    rig.rotation.x = 0.06
    const fade = Math.min(1, t / 0.18)
    for (const part of Object.keys(hi) as GearPart[]) {
      const target = active.has(part) ? 1 : 0
      hi[part] += (target - hi[part]) * 0.15
    }
    for (const piece of pieces) {
      const m = piece.mesh.material as THREE.ShaderMaterial
      m.uniforms.uHi.value = hi[piece.part]
      m.uniforms.uOpacity.value = fade
    }
    edgeMat.opacity = 0.32 * fade
    gm.opacity = 0.08 * fade
    renderer.render(scene, camera)

    for (const part of Object.keys(anchorPts) as GearPart[]) {
      v.copy(anchorPts[part]).applyMatrix4(rig.matrixWorld).project(camera)
      lastAnchors[part] = {
        x: (v.x * 0.5 + 0.5) * width,
        y: (-v.y * 0.5 + 0.5) * height,
        visible: v.z < 1,
      }
    }
  }

  resize()

  return {
    setProgress: (p) => {
      t = Math.min(1, Math.max(0, p))
    },
    setActive: (parts) => {
      active.clear()
      parts.forEach((p) => active.add(p))
    },
    anchors: () => lastAnchors,
    render,
    resize,
    dispose: () => {
      for (const piece of pieces) {
        piece.mesh.geometry.dispose()
        ;(piece.mesh.material as THREE.Material).dispose()
        piece.edges.geometry.dispose()
      }
      edgeMat.dispose()
      grid.geometry.dispose()
      gm.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
