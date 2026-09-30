import type { SpecRow } from "../chapters"

export function SpecList({ rows, className = "" }: { rows: SpecRow[]; className?: string }) {
  if (rows.length === 0) return null
  return (
    <dl className={`spec ${className}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="spec-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
