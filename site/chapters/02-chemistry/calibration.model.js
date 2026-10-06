// Fig. 4's data and every number it shows (Team CHEM). Pure maths, no DOM: used by tools/calibration-svg.mjs (the
// declared generator that writes the figure's SVG geometry and DOM labels) and by this chapter's facts asserts.
// Data unchanged from Path A (a/tools/figs.mjs): five standards, mg/L vs absorbance, and a second-source check standard.
export const STD = [[0.5, 0.052], [1.0, 0.097], [2.0, 0.196], [4.0, 0.407], [5.0, 0.501]]
export const CHECK_TRUE = 3.0 // mg/L, the independent (second-source) check standard's known value
export const CHECK_RESP = 0.298 // its absorbance
export const LIM = 10 // acceptance window, ± % of the known value

export function fit(std = STD) {
  const n = std.length
  const mx = std.reduce((s, p) => s + p[0], 0) / n, my = std.reduce((s, p) => s + p[1], 0) / n
  let sxx = 0, syy = 0, sxy = 0
  for (const [x, y] of std) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my) }
  const m = sxy / sxx, b = my - m * mx, r = sxy / Math.sqrt(sxx * syy)
  return { m, b, r }
}

// everything displayed, from the data (strings exactly as the page shows them)
export function numbers() {
  const { m, b, r } = fit()
  const found = (CHECK_RESP - b) / m
  const recovery = (found / CHECK_TRUE) * 100
  const lo = m * CHECK_TRUE * (1 - LIM / 100) + b, hi = m * CHECK_TRUE * (1 + LIM / 100) + b // band, absorbance
  return {
    m, b, r, found, recovery, lo, hi,
    rTxt: r.toFixed(4), foundTxt: found.toFixed(2), trueTxt: CHECK_TRUE.toFixed(2), recTxt: recovery.toFixed(1), limTxt: String(LIM),
    pass: Math.abs(recovery - 100) <= LIM && CHECK_RESP > lo && CHECK_RESP < hi,
    backCalc: STD.map(([x, y]) => ((y - b) / m / x) * 100), // each standard's back-calculated recovery, %
  }
}

// drawing box 400 × 248 (A's geometry): plot area L..R × T..B; x 0–5.5 mg/L, y 0–0.6 AU
export const BOX = { W: 400, H: 248, L: 46, R: 386, T: 16, B: 206 }
export const X = (v) => BOX.L + (v / 5.5) * (BOX.R - BOX.L)
export const Y = (v) => BOX.B - (v / 0.6) * (BOX.B - BOX.T)
