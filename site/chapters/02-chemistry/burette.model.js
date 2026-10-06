// Fig. 3's numbers, in one place (Team CHEM). Pure maths, no DOM, no three.js: imported by the eager controller
// (chapter.js), the lazy scene (burette.gl.js), the poster tool and the chapter's facts asserts, so the drawing, the
// readout and facts.json cannot drift apart. The true reading itself comes from facts.json (chem.burette.value).
//
// Geometry (from Path A): one world unit = 1 mL of scale length; the meniscus bottom sits at y = 0; the camera always
// looks at it, so the plate's centre row is the line of sight and the front-scale value on that row is
// reading(θ) = true − R·tan θ for an eye θ above level (θ < 0: below).
export const R = 0.5 // outer tube radius, in mL of scale length (about right for a 50 mL burette)
export const TILT_DEG = 12 // the eye angle of 'above' and 'below' (buttons, posters, the intro's hold, the pointer's extremes)
export const DEG = Math.PI / 180
export const TILT = TILT_DEG * DEG
export const LOOK = { above: TILT, level: 0, below: -TILT }
export const STATES = ['above', 'level', 'below']

export const readingAt = (trueMl, theta) => trueMl - R * Math.tan(theta)
export const fmt = (v) => v.toFixed(2)
export const readingText = (trueMl, theta) => fmt(readingAt(trueMl, theta))

// what the eye's position says about the reading: 'level' only while the reading is exactly the true value, so the
// status never contradicts the number
export function lookOf(trueMl, theta) {
  const v = readingText(trueMl, theta)
  return Math.abs(theta) < 0.6 * DEG && v === fmt(trueMl) ? 'level' : theta > 0 ? 'above' : 'below'
}

// readout status (authored sentence case; the strip renders it uppercase) and the spoken sentence
export const STATUS = { level: 'At eye level', above: 'Eye above · reads low', below: 'Eye below · reads high' }
export const SPOKEN = { level: 'the true reading', above: 'eye above, reads low', below: 'eye below, reads high' }
export const say = (trueMl, s) => `${s === 'level' ? 'At eye level' : 'Looking from ' + s}: ${readingText(trueMl, LOOK[s])} milliliters, ${SPOKEN[s]}.`
