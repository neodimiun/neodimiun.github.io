import type { ReactNode } from "react"

type Props = {
  fig: string
  caption: string
  src?: string
  alt?: string
  children?: ReactNode
  className?: string
}

/** A framed figure with a Bluechip-style "FIG. 0N / caption" line under it. */
export function Plate({ fig, caption, src, alt = "", children, className = "" }: Props) {
  return (
    <figure className={`plate reveal ${className}`}>
      <div className="plate-frame">
        {src ? <img src={src} alt={alt} loading="lazy" decoding="async" /> : children}
        <span className="corner tl" aria-hidden />
        <span className="corner tr" aria-hidden />
        <span className="corner bl" aria-hidden />
        <span className="corner br" aria-hidden />
      </div>
      <figcaption>
        <span className="fig">{fig}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}
