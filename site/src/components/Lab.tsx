import type { ReactNode } from "react"
import { headingActive } from "./SectionStill"
import { LabRail } from "./LabRail"
import { SECTION_IDS } from "../toc"
import { useScrollActive, useScrollCurrent } from "../hooks/useScrollCurrent"
import { useReveal } from "../hooks/useReveal"

function Usp({ n }: { n: string }) {
  return <>USP {"<" + n + ">"}</>
}

const LEAD: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "lab-0",
    title: "Aerospace special processes and materials testing",
    body: "Corrosion resistance, water break, paint adhesion, bend adhesion, hydrogen embrittlement, heat resistance, microhardness, porosity. Applied to chemical conversion coating, passivation, cadmium, sulfamate nickel, chrome plating, brush plating, and shot peen.",
  },
  {
    id: "lab-1",
    title: "Process solution control",
    body: "Routine and ad-hoc chemical and physical testing of process solutions to specification, work instruction, and control schedule. Critical-parameter trending against shop limits, trivalent chromium and iron trending after dummying, reagent and consumable shelf-life control, full traceability in TrueChem.",
  },
  {
    id: "lab-2",
    title: "Quality systems and documentation",
    body: "Nadcap site focal · customer and internal audits · RRCA · authorship and revision of SOPs, work instructions, specifications, methods, manuals, and training materials · technique sheet and material review and approval · process qualification to internal, customer, and proprietary specifications · chain of custody · cGMP and USP, EPA, and Standard Methods compliance.",
  },
  {
    id: "lab-3",
    title: "Microbiology and QC, pharmaceutical",
    body: (
      <>
        <Usp n="85" /> kinetic chromogenic endotoxin on PW, WFI, and pure steam. <Usp n="1231" /> point-of-use water system sampling, including cleanrooms. <Usp n="1113" /> microbial identification by VITEK 2. Facility-wide disinfectant efficacy study per USP guidance, execution through co-authored report.
      </>
    ),
  },
]

const ARCHIVE: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "lab-archive-0",
    title: "Nutrients",
    body: (
      <>
        SM 4500-N C-2011 (total nitrogen by flow injection), SM 4500-NH<sub>3</sub> G (ammonia), SM 4500-N<sub>org</sub> D (total Kjeldahl nitrogen), SM 4500-P F (total phosphorus as P).
      </>
    ),
  },
  {
    id: "lab-archive-1",
    title: "Anions and metals",
    body: "EPA 300.0 (anions by ion chromatography, water), EPA 9056 (anions by ion chromatography, soil), SM 3500-Cr D 18th/19th ed. (hexavalent chromium by UV-Vis).",
  },
  {
    id: "lab-archive-2",
    title: "Solids and residue",
    body: "SM 2540 B / EPA 160.3 (total residue), SM 2540 C / EPA 160.1 (total dissolved solids), SM 2540 D / EPA 160.2 (total suspended solids), SM 2540 C (percent moisture and percent solids).",
  },
  {
    id: "lab-archive-3",
    title: "Oxygen demand",
    body: "SM 5210 B (five-day BOD and CBOD).",
  },
  {
    id: "lab-archive-4",
    title: "Organic carbon and color",
    body: "SM 5310 B (total organic carbon), SM 2120 C (color, automated, by UV-Vis).",
  },
  {
    id: "lab-archive-5",
    title: "General and physical",
    body: (
      <>
        SM 4500-H<sup>+</sup> B (pH), SM 2320 B (alkalinity), SM 2510 B (conductivity).
      </>
    ),
  },
  {
    id: "lab-archive-6",
    title: "Microbiology, water and environmental",
    body: "SM 9215 B (heterotrophic plate count), SM 9221 B (total coliforms, multiple-tube fermentation), SM 9221 F (fecal coliform MPN), SM 9222 B (total coliforms, membrane filtration), SM 9222 D (fecal coliforms, membrane filtration), SM 9223 B (enzyme substrate).",
  },
  {
    id: "lab-archive-7",
    title: "Molecular biology",
    body: (
      <>
        Chloroplast DNA isolation, purification, and quantification; PCR and <em>rbcL</em> sequence analysis.
      </>
    ),
  },
  {
    id: "lab-archive-8",
    title: "Instrumentation and systems",
    body: "Flow injection analyzer · UV-Vis (Shimadzu) · ion chromatography · TOC analyzer · VITEK 2 · kinetic chromogenic endotoxin reader · membrane filtration and multiple-tube fermentation · microhardness testing · LIMS · TrueChem · calibration, standards, and troubleshooting.",
  },
]

const LAB_IDS = [...LEAD.map((item) => item.id), "lab-archive"]
const LEAD_NUM = ["M1", "M2", "M3", "M4"]

export function Lab() {
  const active = useScrollActive(LAB_IDS)
  const sectionOn = useScrollCurrent(SECTION_IDS) === "lab"
  useReveal("lab")

  return (
    <section id="lab" className="relative z-[2] bg-[#f4f4f4] px-5 sm:px-8 md:px-10 pt-16 pb-20 sm:pt-20 sm:pb-24">
      <div className="max-w-[1200px] mx-auto lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(15rem,1fr)] lg:gap-16">
        <div>
          <div className="label-row mb-4 reveal">
            <span>
              <span className="num">09</span> / Lab methods
            </span>
            <span className="meta">Specification sheet · four disciplines, one archive</span>
          </div>
          <h2
            className={`mb-8 text-[22px] sm:text-[28px] text-black tracking-tight reveal ${headingActive(sectionOn)}`}
            style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}
          >
            Lab Methods
          </h2>
          <dl className="spec spec-lead reveal">
            {LEAD.map((item, i) => (
              <div key={item.id} id={item.id} className="spec-row py-4! scroll-mt-14">
                <dt className="flex gap-2">
                  <span>{LEAD_NUM[i]}</span>
                </dt>
                <dd>
                  <h3
                    className={`text-[16px] sm:text-[17px] font-medium mb-1.5 text-black ${headingActive(sectionOn && active.includes(item.id))}`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[14.5px] sm:text-[15.5px] leading-[1.6] text-black">{item.body}</p>
                </dd>
              </div>
            ))}
          </dl>

          <details id="lab-archive" className="lab-archive mt-8 scroll-mt-14 reveal">
            <summary className={headingActive(sectionOn && active.includes("lab-archive"))}>
              M5 · Methods archive, by method number
            </summary>
            <dl className="spec mt-5">
              {ARCHIVE.map((item, i) => (
                <div key={item.id} id={item.id} className="spec-row scroll-mt-14">
                  <dt>{`A${i + 1}`} · {item.title}</dt>
                  <dd className="text-[14px]! leading-[1.55]!">{item.body}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
        <LabRail activeIds={sectionOn ? active : []} />
      </div>
    </section>
  )
}
