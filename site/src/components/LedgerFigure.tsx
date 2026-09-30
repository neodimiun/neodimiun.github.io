/**
 * Static ledger drawing for the ImmutableQC chapter: four chained records,
 * the last one an amendment that references the report instead of
 * overwriting it. Pure SVG so it prerenders and needs no script.
 */
export function LedgerFigure() {
  const recs = [
    { id: "#0042", kind: "INJ", line: "14:22:07.318Z" },
    { id: "#0043", kind: "PEAKS", line: "3 · RT H A" },
    { id: "#0044", kind: "RPT", line: "sha256:9c2e…41b7" },
  ]
  const x0 = 40
  const w = 150
  const gap = 45
  const y = 118
  const h = 74

  return (
    <svg viewBox="0 0 640 360" className="ledger" role="img" aria-label="Four chained ledger records; the amendment references the report rather than overwriting it">
      <rect x="0" y="0" width="640" height="360" fill="#050505" />
      <text x="40" y="52" className="dim">IMMUTABLEQC LEDGER · 2231-A · RUN 014</text>
      <text x="600" y="52" className="hi" textAnchor="end">CHAIN INTACT</text>
      <line x1="40" y1="64" x2="600" y2="64" stroke="rgba(255,255,255,0.18)" />

      {recs.map((r, i) => {
        const x = x0 + i * (w + gap)
        return (
          <g key={r.id}>
            <rect x={x} y={y} width={w} height={h} className="box" />
            <text x={x + 12} y={y + 24}>{r.id} · {r.kind}</text>
            <text x={x + 12} y={y + 46} className="dim">{r.line}</text>
            <text x={x + 12} y={y + 64} className="dim">prev · {i === 0 ? "a7f3…c91b" : recs[i - 1].id}</text>
            {i < recs.length - 1 ? (
              <path d={`M${x + w} ${y + h / 2} h${gap - 8}`} className="link" markerEnd="url(#arr)" />
            ) : null}
          </g>
        )
      })}

      {/* Amendment, linked back to the report */}
      <rect x={x0 + 2 * (w + gap)} y={y + 118} width={w} height={h} className="box hi" />
      <text x={x0 + 2 * (w + gap) + 12} y={y + 142} className="hi">#0045 · AMD</text>
      <text x={x0 + 2 * (w + gap) + 12} y={y + 164} className="dim">dil. 1.00 to 2.50</text>
      <text x={x0 + 2 * (w + gap) + 12} y={y + 182} className="dim">refs #0044 · v2</text>
      <path
        d={`M${x0 + 2 * (w + gap) + w / 2} ${y + 118} v-40`}
        className="link hi"
        markerEnd="url(#arrhi)"
      />

      <text x="40" y="330" className="dim">DEMO · SYNTHETIC</text>
      <text x="600" y="330" className="dim" textAnchor="end">NOTHING OVERWRITTEN</text>

      <defs>
        <marker id="arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="rgba(255,255,255,0.35)" />
        </marker>
        <marker id="arrhi" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="#4aa8e8" />
        </marker>
      </defs>
    </svg>
  )
}
