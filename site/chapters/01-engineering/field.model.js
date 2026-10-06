// field.model.js (Team ENG): the pure maths behind Figs. 1 and 2. Used by chapter.js (eager: the DOM is right without
// WebGL), by field.gl.js (the geometry that is drawn) and by facts.assert.mjs (node). Every number the figures show
// comes from facts.json through here; nothing is typed twice. No imports, so node and the browser share it as is.

export const DASH = '—'
// reduced-motion small multiples (tools/posters.mjs draws the discs; chapter.css places the DOM labels and sizes the scale
// bar): fractions of the square. Two fields above, the third centred below (etched, indented / measured), so each field
// is 0.4 of the plate rather than 0.3 in a row. Each disc is a whole 280 um ×500 field, so the 50 um bar is d × 50/280.
export const TRI = { d: 0.4, cx: [0.25, 0.75, 0.5], cy: [0.25, 0.25, 0.7] }
const mag = (s) => +String(s).replace(/[^\d.]/g, '')

export function model(facts) {
  const H = facts['eng.hv'], F = facts['eng.field']
  // One eyepiece field number for both objectives: the ×500 field is the ×200 field scaled by 200/500.
  const HERO = { field: F.fieldUm, bar: F.scaleUm, mag: mag(F.mag) }                       // 700 µm, 100 µm bar, ×200
  const BAND = { field: (F.fieldUm * mag(F.mag)) / mag(H.mag), bar: 50, mag: mag(H.mag) }  // 280 µm, 50 µm bar, ×500
  // Vickers half-diagonals (µm) straight from the reported diagonals: what is drawn is what is read.
  const A1 = +H.d1 / 2 // 35.7  → d1 71.4 µm (horizontal diagonal, crosshairs at x = ±A1)
  const A2 = +H.d2 / 2 // 36.05 → d2 72.1 µm (vertical diagonal, crosshairs at y = ±A2)
  // Readings as the eyepiece reports them: diagonals to 0.1 µm, d̄ the mean of the DISPLAYED diagonals (so
  // d̄ = (d1 + d2)/2 holds digit for digit), HV = 1.8544·F/d̄² with d̄ in mm, reported to the nearest whole number.
  const d1 = (2 * A1).toFixed(1), d2 = (2 * A2).toFixed(1)
  const dbar = ((Math.round(20 * A1) + Math.round(20 * A2)) / 20).toFixed(2)
  const hvExact = (1.8544 * H.loadKgf) / (+dbar / 1000) ** 2
  const hv = String(Math.round(hvExact))
  const readout = (state) => {
    const on = state === 'measured'
    return { d1: on ? d1 : DASH, d2: on ? d2 : DASH, dm: on ? dbar : DASH, hv: on ? hv : DASH }
  }
  return {
    HERO, BAND, A1, A2, d1, d2, dbar, hvExact, hv, unit: H.unit, loadKgf: H.loadKgf, readout,
    // Grain bake (Path B as built): 16 cells × 50 µm = an 800 µm tile, larger than the 700 µm hero field.
    GRAIN: { cells: 16, cellUm: 50 },
    // Both fields look at the same spot: Fig. 2 is the centre of Fig. 1 at ×500, and the indent sits there.
    OFFSET: [212, 148],
    barFrac: (o) => o.bar / o.field,
    status: { etched: 'No indent', indented: 'Not measured', measured: 'Measured' },
    announceIndent: (s) => s === 'measured'
      ? `Fig. 2 measured: d1 ${d1} micrometers, d2 ${d2} micrometers, mean ${dbar} micrometers, ${hv} ${H.unit}.`
      : s === 'indented' ? 'Fig. 2 indented, not yet measured.' : 'Fig. 2 etched, no indent.',
    announceField: (s) => `Fig. 1 shown ${s === 'etched' ? 'etched' : 'polished'}.`,
  }
}
