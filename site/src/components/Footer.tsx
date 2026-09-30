import { LINKS } from "../links"

const linkClass = "underline underline-offset-2 hover:opacity-60 transition-opacity"

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative z-[2] bg-black text-white px-5 sm:px-8 md:px-10 pt-14 pb-10 sm:pt-20 sm:pb-12"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="label-row mb-6 text-white/55!">
          <span>
            <span className="num text-white!">11</span> / Contact
          </span>
          <span className="meta">Email · LinkedIn · ImmutableQC</span>
        </div>
        <h2
          className="text-[26px] sm:text-[34px] mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 500, letterSpacing: "-0.02em" }}
        >
          Run the method. Own the method. Own the process.
        </h2>
        <p className="text-[16px] sm:text-[18px] leading-[1.7]">
          <a href={LINKS.mailto} className={linkClass}>
            {LINKS.email}
          </a>
          {" · "}
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {LINKS.linkedinLabel}
          </a>
          {" · "}
          <a href={LINKS.immutableqc} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {LINKS.immutableqcLabel}
          </a>
        </p>

        <div className="mt-14 pt-5 border-t border-white/15 flex flex-wrap justify-between gap-x-6 gap-y-2 mono text-[10px] text-white/45">
          <span>Jose A. Fernandez Abreu · Senior Engineer, M&amp;PT</span>
          <span>Collins Aerospace Landing Systems · Opa-Locka, FL</span>
          <span>joseqc.com · rev. 2026</span>
        </div>
      </div>
    </footer>
  )
}
