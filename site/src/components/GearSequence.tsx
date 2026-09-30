import { useEffect, useRef, useState } from "react"
import { runwayProgress } from "../runway"

const FRAME_COUNT = 48
/** Portion of the runway spent scrubbing the dolly; the rest holds the last frame. */
const SCRUB_END = 0.6

type Callout = {
  id: string
  process: string
  part: string
  at: number
  x: number
  y: number
}

const CALLOUTS: Callout[] = [
  { id: "chrome", process: "Chrome", part: "Oleo piston", at: 0.62, x: 0.445, y: 0.45 },
  { id: "peen", process: "Shot peen", part: "Torque links", at: 0.7, x: 0.335, y: 0.36 },
  { id: "cad", process: "Cadmium", part: "Steel fittings", at: 0.78, x: 0.605, y: 0.2 },
  { id: "nickel", process: "Sulfamate nickel", part: "Bores and journals", at: 0.86, x: 0.4, y: 0.7 },
  { id: "ccc", process: "Conversion coat", part: "Wheel, aluminum", at: 0.93, x: 0.74, y: 0.86 },
]

const RUNWAY_ID = "gear-runway"

function frameUrl(size: 640 | 1280, i: number) {
  return `${import.meta.env.BASE_URL}media/gear/${size}/f-${String(i + 1).padStart(2, "0")}.webp`
}

/** Cover-fit `iw x ih` into `cw x ch`, keeping the focus point (image fractions) near the centre. */
function coverRect(cw: number, ch: number, iw: number, ih: number, focusX = 0.45, focusY = 0.5) {
  const scale = Math.max(cw / iw, ch / ih)
  const dw = iw * scale
  const dh = ih * scale
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
  const dx = clamp(cw / 2 - focusX * dw, cw - dw, 0)
  const dy = clamp(ch / 2 - focusY * dh, ch - dh, 0)
  return { dx, dy, dw, dh }
}

export function GearSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const calloutRefs = useRef<(HTMLDivElement | null)[]>([])
  const listRefs = useRef<(HTMLLIElement | null)[]>([])
  const frameOut = useRef<HTMLElement>(null)
  const seqOut = useRef<HTMLElement>(null)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    const stage = stageRef.current
    const runway = document.getElementById(RUNWAY_ID)
    if (!canvas || !stage || !runway) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const size: 640 | 1280 = window.innerWidth < 768 ? 640 : 1280
    const frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null)
    let loading = false
    let raf = 0
    let visible = false
    let lastDrawn = -1
    let progress = 0
    let smooth = 0
    const dpr = Math.min(1.5, window.devicePixelRatio || 1)

    const resize = () => {
      canvas.width = Math.max(1, Math.round(stage.clientWidth * dpr))
      canvas.height = Math.max(1, Math.round(stage.clientHeight * dpr))
      lastDrawn = -1
    }

    const load = () => {
      if (loading) return
      loading = true
      // Load the last frame first (it is the one that holds), then the rest.
      const order = [FRAME_COUNT - 1, 0, ...Array.from({ length: FRAME_COUNT - 2 }, (_, i) => i + 1)]
      order.forEach((i, k) => {
        const img = new Image()
        img.decoding = "async"
        img.onload = () => {
          frames[i] = img
          if (k < 2) lastDrawn = -1
          start()
        }
        img.src = frameUrl(size, i)
      })
    }

    const nearestLoaded = (i: number) => {
      if (frames[i]) return i
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return i - d
        if (frames[i + d]) return i + d
      }
      return -1
    }

    const draw = () => {
      const p = smooth
      const t = Math.min(1, p / SCRUB_END)
      const want = Math.round(t * (FRAME_COUNT - 1))
      const idx = nearestLoaded(want)
      const w = canvas.width
      const h = canvas.height

      let rect = { dx: 0, dy: 0, dw: w, dh: h }
      if (idx >= 0) {
        const img = frames[idx]!
        rect = coverRect(w, h, img.naturalWidth, img.naturalHeight)
        if (idx !== lastDrawn) {
          ctx.fillStyle = "#e9e7e3"
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, rect.dx, rect.dy, rect.dw, rect.dh)
          lastDrawn = idx
        }
      }

      const holding = p >= SCRUB_END - 0.02
      calloutRefs.current.forEach((el, i) => {
        if (!el) return
        const c = CALLOUTS[i]
        const show = holding && p >= c.at
        const fade = show ? Math.min(1, (p - c.at) / 0.05) : 0
        el.style.opacity = String(fade)
        el.style.transform = `translate(-10%, -50%) translateY(${(1 - fade) * 6}px)`
        el.style.left = `${(rect.dx + c.x * rect.dw) / dpr}px`
        el.style.top = `${(rect.dy + c.y * rect.dh) / dpr}px`
        const li = listRefs.current[i]
        if (li) li.classList.toggle("on", show)
      })

      if (frameOut.current) frameOut.current.textContent = String(want + 1).padStart(2, "0")
      if (seqOut.current) seqOut.current.textContent = `${String(Math.round(p * 100)).padStart(3, "0")}%`
    }

    const frame = () => {
      if (!visible) {
        raf = 0
        return
      }
      smooth += (progress - smooth) * 0.2
      if (Math.abs(progress - smooth) < 0.0005) smooth = progress
      draw()
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame)
    }

    const readScroll = () => {
      progress = runwayProgress(runway)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        const on = !!entry?.isIntersecting
        if (on) load()
        visible = on
        if (on) {
          readScroll()
          start()
        }
      },
      { rootMargin: "150% 0px 150% 0px", threshold: 0 },
    )
    io.observe(runway)

    const onResize = () => {
      resize()
      readScroll()
      start()
    }

    resize()
    readScroll()
    window.addEventListener("scroll", readScroll, { passive: true })
    window.addEventListener("resize", onResize)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener("scroll", readScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [reduced])

  const poster = frameUrl(1280, FRAME_COUNT - 1)
  const first = frameUrl(1280, 0)

  return (
    <section id="gear" className="relative z-[2]" aria-label="Main landing gear, special processes">
      <div id={RUNWAY_ID} className="gear-runway">
        <div ref={stageRef} className="gear-stage">
          {reduced ? (
            <img className="gear-poster" src={poster} alt="Main landing gear, close view" />
          ) : (
            <>
              <img className="gear-poster" src={first} alt="" loading="lazy" decoding="async" aria-hidden />
              <canvas ref={canvasRef} className="gear-canvas" aria-hidden />
            </>
          )}
          <div className="gear-scrim" aria-hidden />

          {CALLOUTS.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => {
                calloutRefs.current[i] = el
              }}
              className="gear-callout"
              style={reduced ? { opacity: 1, left: `${c.x * 100}%`, top: `${c.y * 100}%` } : undefined}
              aria-hidden
            >
              <span className="gear-callout-tick" />
              <span className="gear-callout-label">
                {c.process}
                <small>{c.part}</small>
              </span>
            </div>
          ))}

          <div className="gear-hud">
            <div>
              <div className="label-row">
                <span>
                  <span className="num">05</span> / Special processes
                </span>
                <span className="meta">Fig. 05 · Main landing gear</span>
              </div>
              <h3 className="gear-title">Every finish on this gear is a process I test and control.</h3>
            </div>
            <div className="gear-foot">
              <ol className="gear-list">
                {CALLOUTS.map((c, i) => (
                  <li
                    key={c.id}
                    ref={(el) => {
                      listRefs.current[i] = el
                    }}
                    className={reduced ? "on" : ""}
                  >
                    <span className="idx">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      {c.process} <span className="text-black/45">/ {c.part}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {reduced ? null : (
                <div className="gear-readout">
                  <span>
                    Frame <b ref={frameOut}>01</b> / {FRAME_COUNT}
                  </span>
                  <span>
                    Seq <b ref={seqOut}>000%</b>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
