import { useEffect, useRef, useState } from "react"
import { gearX, runwayProgress } from "../runway"

type Props = {
  runwayId: string
}

export function Background({ runwayId }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const scanRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const scrollP = useRef(0)
  const smoothP = useRef(0)
  const mouse = useRef({ x: 0, y: 0, on: false })
  const smoothMouse = useRef({ x: 0, y: 0 })
  const visible = useRef(true)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (reduced) return

    const wrap = wrapRef.current
    const scan = scanRef.current
    const tick = tickRef.current
    const runway = document.getElementById(runwayId)
    const stage = wrap?.parentElement
    if (!wrap || !runway || !stage) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(1.25, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr))
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr))
    }
    resize()

    const hoverR = () => Math.round(Math.min(380, Math.max(140, window.innerWidth * 0.14)))

    let raf = 0
    let lastUrl = ""

    const shouldRun = () => visible.current || mouse.current.on

    const stopRaf = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    const frame = () => {
      if (!shouldRun()) {
        raf = 0
        return
      }

      const target = scrollP.current
      smoothP.current += (target - smoothP.current) * 0.14
      const p = smoothP.current
      const w = canvas.width
      const h = canvas.height
      const dpr = w / Math.max(1, window.innerWidth)

      const m = mouse.current
      const s = smoothMouse.current
      if (m.on) {
        s.x += (m.x - s.x) * 0.14
        s.y += (m.y - s.y) * 0.14
      }

      if (!m.on && p < 0.01) {
        wrap.style.opacity = "0"
        wrap.style.maskImage = "none"
        wrap.style.webkitMaskImage = "none"
        if (scan) scan.style.opacity = "0"
        if (tick) tick.style.opacity = "0"
        raf = requestAnimationFrame(frame)
        return
      }

      wrap.style.opacity = "1"
      ctx.clearRect(0, 0, w, h)

      const edge = Math.min(1, Math.max(0, 0.06 + p * 0.88))
      const y = edge * h
      const soft = 0.028 + p * 0.018

      if (p >= 0.98) {
        ctx.fillStyle = "#fff"
        ctx.fillRect(0, 0, w, h)
      } else if (p > 0.01) {
        const lg = ctx.createLinearGradient(0, 0, 0, h)
        lg.addColorStop(0, "rgba(255,255,255,1)")
        lg.addColorStop(Math.max(0, edge - soft * 0.3), "rgba(255,255,255,1)")
        lg.addColorStop(Math.min(1, edge + soft), "rgba(255,255,255,0)")
        lg.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = lg
        ctx.fillRect(0, 0, w, h)

        const gx = gearX() * dpr
        const bloom = hoverR() * dpr * (0.85 + p * 0.55)
        const g = ctx.createRadialGradient(gx, y, 0, gx, y, bloom)
        g.addColorStop(0, "rgba(255,255,255,0.95)")
        g.addColorStop(0.45, "rgba(255,255,255,0.55)")
        g.addColorStop(0.75, "rgba(255,255,255,0.12)")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ctx.globalCompositeOperation = "lighter"
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)

        // Keep the scan line as the leading edge: nothing below it is
        // revealed except a short feather, so the glow only lights what
        // the scanner has already passed.
        const feather = Math.max(8, 0.018 * h)
        const cut = ctx.createLinearGradient(0, 0, 0, h)
        cut.addColorStop(0, "rgba(255,255,255,1)")
        cut.addColorStop(Math.min(1, y / h), "rgba(255,255,255,1)")
        cut.addColorStop(Math.min(1, (y + feather) / h), "rgba(255,255,255,0)")
        cut.addColorStop(1, "rgba(255,255,255,0)")
        ctx.globalCompositeOperation = "destination-in"
        ctx.fillStyle = cut
        ctx.fillRect(0, 0, w, h)
        ctx.globalCompositeOperation = "source-over"
      }

      if (m.on) {
        const r = hoverR() * dpr
        const g = ctx.createRadialGradient(s.x * dpr, s.y * dpr, 0, s.x * dpr, s.y * dpr, r)
        g.addColorStop(0, "rgba(255,255,255,1)")
        g.addColorStop(0.35, "rgba(255,255,255,0.85)")
        g.addColorStop(0.65, "rgba(255,255,255,0.28)")
        g.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      const url = canvas.toDataURL("image/png")
      if (url !== lastUrl) {
        lastUrl = url
        wrap.style.maskImage = `url(${url})`
        wrap.style.webkitMaskImage = `url(${url})`
        wrap.style.maskSize = "100% 100%"
        wrap.style.webkitMaskSize = "100% 100%"
        wrap.style.maskRepeat = "no-repeat"
        wrap.style.webkitMaskRepeat = "no-repeat"
      }

      const scanY = edge * 100
      const short = window.innerHeight < 700
      const scanActive = p > 0.02 && p < 0.98
      if (scan) {
        scan.style.top = `${scanY}%`
        scan.style.opacity = scanActive ? (short ? "0.45" : "1") : "0"
      }
      if (tick) {
        tick.style.top = `${scanY}%`
        tick.style.opacity = scanActive ? (short ? "0.4" : "0.65") : "0"
      }


      raf = requestAnimationFrame(frame)
    }

    const startRaf = () => {
      if (!raf && shouldRun()) raf = requestAnimationFrame(frame)
    }

    const readScroll = () => {
      scrollP.current = runwayProgress(runway)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY, on: true }
      startRaf()
    }
    const onMouseLeave = () => {
      mouse.current.on = false
      if (!visible.current) stopRaf()
    }
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) {
        mouse.current = { x: t.clientX, y: t.clientY, on: true }
        startRaf()
      }
    }
    const onTouchEnd = () => {
      mouse.current.on = false
      if (!visible.current) stopRaf()
    }
    const onResize = () => {
      resize()
      readScroll()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        const was = visible.current
        visible.current = !!entry?.isIntersecting
        if (visible.current) {
          readScroll()
          startRaf()
        } else if (!mouse.current.on) {
          stopRaf()
        }
        if (!was && visible.current) {
          readScroll()
          startRaf()
        }
      },
      { threshold: 0.05 },
    )
    io.observe(stage)

    window.addEventListener("scroll", readScroll, { passive: true })
    window.addEventListener("resize", onResize)
    stage.addEventListener("mousemove", onMouseMove)
    stage.addEventListener("mouseleave", onMouseLeave)
    stage.addEventListener("touchmove", onTouch, { passive: true })
    stage.addEventListener("touchend", onTouchEnd)
    readScroll()
    startRaf()

    return () => {
      stopRaf()
      io.disconnect()
      window.removeEventListener("scroll", readScroll)
      window.removeEventListener("resize", onResize)
      stage.removeEventListener("mousemove", onMouseMove)
      stage.removeEventListener("mouseleave", onMouseLeave)
      stage.removeEventListener("touchmove", onTouch)
      stage.removeEventListener("touchend", onTouchEnd)
    }
  }, [runwayId, reduced])

  const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`

  if (reduced) {
    return (
      <>
        <div className="hero-reduced" aria-hidden>
          <figure className="hero-reduced-plate">
            <img src={media("bg-1.jpg")} alt="" />
            <figcaption>Optical</figcaption>
          </figure>
          <figure className="hero-reduced-plate">
            <img src={media("bg-2.jpg")} alt="" />
            <figcaption>Radiograph</figcaption>
          </figure>
        </div>
        <div className="hero-scrim" aria-hidden />
      </>
    )
  }

  return (
    <>
      <img className="hero-chrome" src={media("bg-1.jpg")} alt="" />
      <div ref={wrapRef} className="hero-xray-wrap" aria-hidden>
        <img className="hero-xray" src={media("bg-2.jpg")} alt="" />
      </div>
      <div ref={scanRef} className="hero-scanline" aria-hidden />
      <div ref={tickRef} className="hero-dim-ticks" aria-hidden />
      <div className="hero-scrim" aria-hidden />
      <div className="hero-grain" aria-hidden />

    </>
  )
}
