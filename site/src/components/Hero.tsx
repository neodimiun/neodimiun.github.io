import { Background } from "./Background"
import { ScrollRevealText } from "./ScrollRevealText"
import { LINKS } from "../links"

const OPENING =
  "Environmental chemistry, municipal water quality, sterile pharmaceutical manufacturing, aerospace MRO. Eleven years, one question. Is this number true, and what has to happen because of it?"

export function Hero() {
  return (
    <section id="top" className="relative z-[1]">
      <div id="hero-runway" className="hero-runway">
        <div className="hero-stage sticky top-0 h-screen overflow-hidden">
          <Background runwayId="hero-runway" />
          <div className="relative z-10 h-full flex flex-col justify-end pb-12 md:justify-center md:pb-0 px-5 sm:px-8 md:px-10 pointer-events-none">
            <div className="max-w-2xl pointer-events-auto">
              <p className="mono text-[10.5px] text-black/55 mb-3">
                00 / Landing Systems · Opa-Locka, FL
              </p>
              <h1
                className="text-black mb-3 text-[24px] sm:text-[30px] tracking-tight"
                style={{ fontFamily: "var(--font-heading)", fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.02em" }}
              >
                Jose A. Fernandez Abreu
              </h1>
              <p
                className="text-black mb-1"
                style={{ fontSize: "clamp(16px, 2.4vw, 20px)", lineHeight: 1.35 }}
              >
                Senior Engineer, Materials &amp; Process Technologies, Collins Aerospace, Landing Systems
              </p>
              <p
                className="text-black mb-4"
                style={{ fontSize: "clamp(16px, 2.4vw, 20px)", lineHeight: 1.35 }}
              >
                M.S. Microbiology &amp; Cell Science, University of Florida
              </p>
              <a
                href={LINKS.immutableqc}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-building mb-5 sm:mb-6"
              >
                <span className="dot" aria-hidden />
                <span>Building</span>
                <span className="sep">/</span>
                <span>ImmutableQC<span className="long">, tamper-evident lab records</span></span>
                <span className="sep">·</span>
                <span>open alpha</span>
              </a>
              <ScrollRevealText text={OPENING} runwayId="hero-runway" startAt={0.5} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
