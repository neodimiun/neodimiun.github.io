import { headingActive } from "./SectionStill"
import { SECTION_IDS } from "../toc"
import { useScrollCurrent } from "../hooks/useScrollCurrent"
import { useReveal } from "../hooks/useReveal"
import { SpecList } from "./SpecList"
import type { SpecRow } from "../chapters"

const ROWS: SpecRow[] = [
  ["Graduate", "M.S. Microbiology & Cell Science, University of Florida, 2018. Medical Microbiology and Biochemistry, GPA 3.90"],
  ["Undergraduate", "B.S. Biological Sciences (Biotechnology), Miami Dade College, 2015, highest honors. A.S. and A.A. Biotechnology, College Credit Certificate in Biotechnology"],
  ["Honors", "Golden Key International Honour Society (UF and MDC), Phi Theta Kappa, National Society of Leadership and Success. Dean's List, three terms. North Dade Medical Foundation Scholarship, four awards. STEM Ambassador, Miami Dade College, 2013–2015"],
  ["Languages", "English and Spanish, native fluency in both"],
  ["Systems", "TrueChem, LIMS, Microsoft Office. Windows, macOS, Linux. Seven years of hardware and network support before the bench"],
]

export function Credentials() {
  const sectionOn = useScrollCurrent(SECTION_IDS) === "credentials"
  useReveal("credentials")

  return (
    <section
      id="credentials"
      className="relative z-[2] bg-white px-5 sm:px-8 md:px-10 pt-16 pb-20 sm:pt-20 sm:pb-24"
    >
      <div className="max-w-[1200px] mx-auto lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(15rem,1fr)] lg:gap-16">
        <div>
          <div className="label-row mb-4 reveal">
            <span>
              <span className="num">10</span> / Credentials
            </span>
            <span className="meta">Degrees · honors · languages</span>
          </div>
          <h2
            className={`mb-8 text-[22px] sm:text-[28px] text-black tracking-tight reveal ${headingActive(sectionOn)}`}
            style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}
          >
            Credentials
          </h2>
          <div className="reveal">
            <SpecList rows={ROWS} />
          </div>
        </div>
      </div>
    </section>
  )
}
