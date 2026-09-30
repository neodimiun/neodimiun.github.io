import { CHAPTERS } from "../chapters"

export function ChapterRail({ activeIds }: { activeIds: string[] }) {
  return (
    <aside className="hidden lg:block relative" aria-label="Chapter index">
      <div className="sticky top-16">
        <div className="mono text-[10px] text-black/45 mb-3 pl-[1.1rem]">Index</div>
        <nav className="relative ml-1 border-l border-black/20">
          {CHAPTERS.map((c) => {
            const on = activeIds.includes(c.id)
            return (
              <a key={c.id} href={`#${c.id}`} className={`rail-item ${on ? "on" : ""}`}>
                <span className="rail-num">{c.num}</span>
                <span>
                  <span className="rail-label">{c.label}</span>
                  {c.year ? <span className="rail-year">{c.year}</span> : null}
                </span>
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
