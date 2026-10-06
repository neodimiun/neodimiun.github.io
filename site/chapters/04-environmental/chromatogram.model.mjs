// Fig. 6 "The Run" model (Team ENV): EPA 300.0 Part A anions, suppressed conductivity. Pure maths, shared by the
// generator (tools/paths.mjs), the controller (chapter.js: hover reading + dev self-check) and facts.assert.mjs.
// Retention times: EPA 300.0 Rev 2.1 Table 1 (1.7 mM NaHCO3 / 1.8 mM Na2CO3, 2.0 mL/min, 50 µL loop). SPEC-C §7.3.
export const RUN = { loopUL: 50, flowMLmin: 2.0, plates: 4000, runMin: 8 }
// Lambda: limiting molar conductance of the acid after suppression (S·cm²/mol) = lambda(anion) + z·lambda(H+ 349.8).
// M: the mass the result is expressed as (N for nitrite/nitrate). alpha: fraction dissociated at peak concentration.
// top: the highest mixed-standard level, mg/L (nitrate as N 10.0); the five levels are 5/10/25/50/100 % of it.
export const ANIONS = [
  { id: 'F', name: 'Fluoride', tR: 1.2, M: 19.0, L: 55.4 + 349.8, alpha: 0.97, top: 2 },
  { id: 'Cl', name: 'Chloride', tR: 1.7, M: 35.45, L: 76.3 + 349.8, alpha: 1, top: 10 },
  { id: 'NO2', name: 'Nitrite', tR: 2.0, M: 14.007, L: 71.8 + 349.8, alpha: 0.95, top: 2 },
  { id: 'Br', name: 'Bromide', tR: 2.9, M: 79.9, L: 78.1 + 349.8, alpha: 1, top: 4 },
  { id: 'NO3', name: 'Nitrate', tR: 3.2, M: 14.007, L: 71.4 + 349.8, alpha: 1, top: 10 },
  { id: 'PO4', name: 'Phosphate', tR: 5.4, M: 30.97, L: 36.0 + 349.8, alpha: 0.95, top: 4 },
  { id: 'SO4', name: 'Sulfate', tR: 6.9, M: 96.06, L: 2 * (80.0 + 349.8), alpha: 1, top: 40 },
]
export const by = (id) => ANIONS.find((a) => a.id === id)
// theoretical response, µS·min per mg/L = Λ·α/M · (V_inj / F) · unit factors; EFF is the suppressor/transfer efficiency
const VF = ((RUN.loopUL * 1e-6 * 1e-3) / (RUN.flowMLmin * 1e-3)) * 1e-3 * 1e6
export const THEORY = Object.fromEntries(ANIONS.map((a) => [a.id, ((a.L * a.alpha) / a.M) * VF]))
export const EFF = 0.9957
export const K = Object.fromEntries(ANIONS.map((a) => [a.id, THEORY[a.id] * EFF]))
export const sigma = (tR) => tR / Math.sqrt(RUN.plates)
export const SQ2PI = Math.sqrt(2 * Math.PI)

// nitrate calibration (§7.3): five standards with realistic residuals, OLS refit m = 0.748106 → 0.7481, b = 0.006997 → 0.007
export const LEVELS = [0.05, 0.1, 0.25, 0.5, 1] // fractions of the top standard
export const STD_N = ['0.50', '1.00', '2.50', '5.00', '10.0'] // nitrate as N, mg/L, as labelled
export const STD_AREA = [0.374, 0.76, 1.858, 3.781, 7.476] // µS·min, never displayed
// run-to-run retention drift of each standard injection, min (sample and blank 0): a few thousandths, well inside the
// ±3 SD (0.017 min) window, so the overlaid standards in the zoomed views do not land on exactly the same time. Whole
// steps of the generator's 0.0025 min sampling, so the drawn vertices shift with the peak.
export const STD_DT = [0.005, -0.0025, 0.0025, -0.005, 0]
export const CAL = { m: 0.7481, b: 0.007 }
export const SAMPLE = { F: 0.31, Cl: 6.84, SO4: 14.2 } // the other drawn analytes, mg/L (nitrate is set by its area)
export const AREA = { sample: 2.61, spike: 4.421 }
export const SPIKE_ADDED = 2.5
export const RT = 3.2, RTSD = 0.017, MCL = 10, LIMITS = [80, 120]

export function fit(C = STD_N.map(Number), A = STD_AREA) {
  const n = C.length, mx = C.reduce((a, b) => a + b) / n, my = A.reduce((a, b) => a + b) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) { sxy += (C[i] - mx) * (A[i] - my); sxx += (C[i] - mx) ** 2; syy += (A[i] - my) ** 2 }
  const m = sxy / sxx
  return { m, b: my - m * mx, r: sxy / Math.sqrt(sxx * syy) }
}
export const conc = (A) => (A - CAL.b) / CAL.m
// integer arithmetic for the displayed strings (§7.3): areas in thousandths, slope in ten-thousandths → hundredths of mg/L
export const hundredths = (A) => Math.round(((Math.round(A * 1000) - Math.round(CAL.b * 1000)) * 1000) / Math.round(CAL.m * 10000))
export function numbers() {
  const s = hundredths(AREA.sample), p = hundredths(AREA.spike), add = Math.round(SPIKE_ADDED * 100)
  const rec = ((p - s) * 1000) / add // tenths of a percent (exact integer here)
  const sN = sigma(RT), sBr = sigma(by('Br').tR)
  return {
    sample: (s / 100).toFixed(2), spike: (p / 100).toFixed(2), gap: ((p - s) / 100).toFixed(2), added: SPIKE_ADDED.toFixed(2),
    recovery: (rec / 10).toFixed(1), recTenths: rec, s, p,
    window: `${(RT - 3 * RTSD).toFixed(2)}–${(RT + 3 * RTSD).toFixed(2)}`, rt: RT.toFixed(2),
    scaleY: (AREA.sample / AREA.spike).toFixed(4),
    rs: Math.abs(RT - by('Br').tR) / (2 * (sBr + sN)),
    apex: height('NO3', AREA.sample), apexSpike: height('NO3', AREA.spike),
  }
}

// peak height from area (µS): H = A / (σ·√2π); the bi-Gaussian below keeps area and height
export const height = (id, area) => area / (sigma(by(id).tR) * SQ2PI)
// one injection = areas per analyte (µS·min)
export const sampleAreas = (nitrateArea = AREA.sample) => ({ F: K.F * SAMPLE.F, Cl: K.Cl * SAMPLE.Cl, NO3: nitrateArea, SO4: K.SO4 * SAMPLE.SO4 })
export const standardAreas = (i) => Object.fromEntries(ANIONS.map((a) => [a.id, a.id === 'NO3' ? STD_AREA[i] : K[a.id] * a.top * LEVELS[i]]))
// bi-Gaussian (front 0.85σ, tail 1.15σ) plus the water dip at the void; returns µS
export function signal(t, areas) {
  let y = -2.4 * Math.exp(-0.5 * ((t - 0.92) / 0.035) ** 2)
  for (const a of ANIONS) {
    const A = areas[a.id]
    if (!A) continue
    const s = sigma(a.tR), d = t - a.tR
    y += height(a.id, A) * Math.exp(-0.5 * (d / (d < 0 ? 0.85 * s : 1.15 * s)) ** 2)
  }
  return y
}
// hover reading: snap to a drawn apex within ±0.05 min (the label then names the peak)
export function reading(t, areas) {
  for (const a of ANIONS) if (areas[a.id] && Math.abs(t - a.tR) <= 0.05) return { t: a.tR, v: signal(a.tR, areas), name: a.name }
  return { t, v: signal(t, areas), name: '' }
}
export const readingText = (r) => `${r.t.toFixed(2)} min · ${r.v.toFixed(1)} µS${r.name ? ' · ' + r.name : ''}`

// drawing geometry (viewBox 0 0 360 450, plate 4:5). Stack: DX/DY per injection. Zoom: 2.75–3.75 min, ×9 / ×1.5.
export const G = { W: 360, H: 450, X0: 58, PPM: 31, Y0: 368, S: 3.3, DX: 6, DY: -21, ZX: 9, ZY: 1.5, W0: 2.75 }
export const xs = (t) => G.X0 + G.PPM * t
export const ys = (v) => G.Y0 - G.S * v
export const zxs = (t) => G.X0 + (t - G.W0) * G.PPM * G.ZX
export const zys = (v) => G.Y0 - G.S * G.ZY * v
export const ZOOM = { tx: G.X0 - G.ZX * (G.X0 + G.PPM * G.W0), ty: G.Y0 - G.ZY * G.Y0 } // −1231.25, −184

// live sentences, final values only (§7.4), built from facts.json
export const say = (k) => ({
  sample: `Sample: nitrate as nitrogen ${k.value} milligrams per liter, below the drinking-water MCL of ${k.mcl} milligrams per liter as nitrogen.`,
  std: `Standards: the sample's nitrate peak sits inside the calibrated range, ${k.cal.levels[0]} to ${+k.cal.levels[4]} milligrams per liter, at ${k.rt} minutes, inside the nitrate window.`,
  spike: `Matrix spike: ${k.spike.gap} of ${k.spike.added} milligrams per liter found, ${k.spike.recovery} percent recovery, inside 80 to 120.`,
})
