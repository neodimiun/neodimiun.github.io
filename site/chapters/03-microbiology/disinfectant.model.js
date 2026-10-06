// Fig. 5 model (Team MICRO, SPEC-C §6.3). Pure maths and the strings the figure speaks; no DOM. Imported eagerly by
// chapter.js (so it stays tiny) and by facts.assert.mjs and tools/f5-layout.mjs, which recompute every displayed string
// from it and compare with facts.json.
export const STUDY = { recoveryMl: 10.0, platedMl: 1.0, criterionLog: 3.0,
  control: { colonies: 186, dilution: 1e-3 }, treated: { colonies: 13, dilution: 1 } }
export const perCoupon = (p) => p.colonies / p.dilution * STUDY.recoveryMl / STUDY.platedMl
export const r2 = (x) => (Math.round(x * 100) / 100).toFixed(2)

// the ladder scale (SPEC-C §6.5): x(v) = 20 + v·(w − 40)/7, written as a fraction of the inner track (w − 40)
export const LADDER_MAX = 7
export const frac = (v) => v / LADDER_MAX

// live-region sentences (final values only; §6.5 States table)
export const SAY = {
  plated: 'Plated. Both coupons plated; nothing has grown yet.',
  incubated: 'Incubated 72 hours. Colonies have grown; not yet counted.',
  counted: 'Counted. Control 186 colonies at 1 in 1,000, 1.86 million CFU per coupon. Disinfected 13 colonies undiluted, 130 CFU per coupon. Log reduction 4.16; criterion 3.0; pass.',
}

// intro timing (ms, §6.5 Intro). Cohort j fades in at GROW0 + j·COHORT over 600 ms; dot rows from COUNT0 over COUNT_SPAN.
export const T = { GROW0: 270, COHORT: 66.25, GROW_DUR: 600, CLOCK: [233, 467, 700, 933, 1167, 1400], INCUBATED: 1400,
  COUNT0: 1500, COUNT_SPAN: 1080, ROW_DUR: 120, AFTER: 2700, AFTER_STAGGER: 80, AFTER_DUR: 300, BAR_DELAY: 2900, BAR_DUR: 400, END: 3300 }
export const hoursAt = (ms) => Math.round(ms * 72 / T.INCUBATED)
