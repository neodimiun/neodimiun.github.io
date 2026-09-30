import type { Chapter as ChapterData } from "../chapters"
import { FOUNDATION_ENTRIES } from "../chapters"
import { SpecList } from "./SpecList"
import { Plate } from "./Plate"
import { LedgerFigure } from "./LedgerFigure"

type Props = {
  chapter: ChapterData
  active: boolean
}

export function Chapter({ chapter, active }: Props) {
  const c = chapter
  return (
    <article id={c.id} className={`chapter ${active ? "is-active" : ""}`} aria-labelledby={`${c.id}-h`}>
      <div className="label-row reveal">
        <span>
          <span className="num">{c.num}</span> / {c.org}
        </span>
        <span className="meta">{c.meta}</span>
      </div>

      <h3 id={`${c.id}-h`} className="chapter-headline reveal">
        {c.headline}
      </h3>

      <div className="reveal">
        {c.body.map((p, i) => (
          <p key={i} className="chapter-body">
            {p}
          </p>
        ))}
      </div>

      {c.id === "path-foundation" ? <FoundationDetails /> : null}

      {c.specs.length > 0 ? (
        <div className="reveal">
          <SpecList rows={c.specs} />
        </div>
      ) : null}

      {c.extra}

      {c.plate ? <Plate src={c.plate.src} alt={c.plate.alt} fig={c.plate.fig} caption={c.plate.caption} /> : null}

      {c.id === "immutableqc" ? (
        <Plate fig="Fig. 08" caption="Record #0045 amends #0044. Both remain.">
          <LedgerFigure />
        </Plate>
      ) : null}
    </article>
  )
}

function FoundationDetails() {
  return (
    <div className="path-foundation mb-6 reveal">
      <details>
        <summary>Foundation detail, four entries</summary>
        <div className="mt-4">
          {FOUNDATION_ENTRIES.map((item) => (
            <article key={item.id} id={item.id} className="py-5 border-t border-black/10 first:border-t-0 scroll-mt-14">
              <h4 className="text-[16px] sm:text-[17px] mb-1 text-black leading-[1.35] font-medium">{item.title}</h4>
              <p className="mono-plain text-[11px] tracking-[0.06em] uppercase text-black/55 mb-3">{item.meta}</p>
              <p className="text-[15px] sm:text-[16px] leading-[1.65] text-black">{item.body}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
  )
}
