import { CHAPTERS, CHAPTER_IDS } from "../chapters"
import { Chapter } from "./Chapter"
import { ChapterRail } from "./ChapterRail"
import { GearSequence } from "./GearSequence"
import { headingActive } from "./SectionStill"
import { SECTION_IDS } from "../toc"
import { useScrollActive, useScrollCurrent } from "../hooks/useScrollCurrent"
import { useReveal } from "../hooks/useReveal"

const BEFORE_GEAR = CHAPTERS.filter((c) => Number(c.num) <= 4)
const AFTER_GEAR = CHAPTERS.filter((c) => Number(c.num) >= 5)

const GRID = "max-w-[1200px] mx-auto lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(15rem,1fr)] lg:gap-16"
const PAD = "px-5 sm:px-8 md:px-10"

export function Chapters() {
  const active = useScrollActive(CHAPTER_IDS)
  const sectionOn = useScrollCurrent(SECTION_IDS) === "path"
  useReveal("path")

  return (
    <section id="path" className="relative z-[2] bg-white">
      <div className={`${PAD} pt-16 sm:pt-20 pb-10`}>
        <div className={GRID}>
          <div>
            <div className="label-row mb-4">
              <span>
                <span className="num">00</span> / Path &amp; work
              </span>
              <span className="meta">Eight chapters · oldest first</span>
            </div>
            <h2
              className={`mb-6 text-[22px] sm:text-[28px] text-black tracking-tight ${headingActive(sectionOn)}`}
              style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}
            >
              Path &amp; Work
            </h2>
            <p className="text-[17px] sm:text-[18px] leading-[1.65] text-black mb-6">
              Every move was made to acquire something specific: a class of methods, a regulatory system, a different kind of accountability. Each one made the next possible.
            </p>

            {BEFORE_GEAR.map((c) => (
              <Chapter key={c.id} chapter={c} active={sectionOn && active.includes(c.id)} />
            ))}
          </div>
          <ChapterRail activeIds={sectionOn ? active : []} />
        </div>
      </div>

      <GearSequence />

      <div className={`${PAD} pt-4 pb-20 sm:pb-24`}>
        <div className={GRID}>
          <div>
            {AFTER_GEAR.map((c) => (
              <Chapter key={c.id} chapter={c} active={sectionOn && active.includes(c.id)} />
            ))}
          </div>
          <ChapterRail activeIds={sectionOn ? active : []} />
        </div>
      </div>
    </section>
  )
}
