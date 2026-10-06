// Team IT asserts (SPEC-C §8.3, §8.4, §14 items 9, 21, 37, 44). Run by c/data/facts.assert.mjs on every build.
// The DS file already asserts the §8.3 address/echo arithmetic; these add the figure's own derived strings, the intro
// table, the geometry the generator draws, and the copy rules that live in this chapter.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import genF7 from './tools/layers-svg.mjs'
import { INTRO, introEnd, mean, speedText, resolve, words, readout, layers, geom, U } from './layers.model.js'

const HERE = dirname(fileURLToPath(import.meta.url))

export default async function (facts, { eq, ok }) {
  const k = facts['it.key'], W = words(k), R = readout(k), L = layers(k)
  // numbers on the figure, recomputed
  eq('it: mean of echoes = readout', String(mean(k.echoes)), k.value)
  eq('it: (18 + 17 + 19 + 18) / 4 = 72 / 4', `${k.echoes.reduce((a, b) => a + b, 0)}/${k.echoes.length}`, '72/4')
  eq('it: L3 result label', L[2].val, '18 ms')
  eq('it: ledger value "18 ms" = readout + unit', `${k.value} ${k.unit}`, W.rt)
  eq('it: hover reading', W.raw, '18 · 17 · 19 · 18 ms')
  eq('it: echo count "4 of 4" (0 % loss)', W.of, '4 of 4')
  eq('it: L1 speed from 1e9 bit/s', speedText(1e9), k.speed)
  eq('it: resolved address = pinged address', resolve(k, k.fixDns), k.target)
  ok('it: the cause address resolves nothing', resolve(k, k.cause) === null)
  eq('it: layers drawn', L.map((x) => x.n).join(','), k.layers.join(','))
  eq('it: trace readout row 1', R.trace[0].slice(0, 3).join('|'), '18|ms · 4 of 4|Pass')
  eq('it: trace readout row 2', R.trace[1].slice(0, 3).join('|'), '192.168.1.10|DNS|Found')
  eq('it: fix readout row 2', R.fix[1].slice(0, 3).join('|'), '192.168.1.10|DNS|Fixed')
  ok('it: live sentences name the cause, the fix and the target', W.say.trace.includes(k.cause) && W.say.fix.includes(k.target) && W.say.trace.includes(`${k.value} milliseconds`))
  // intro (§8.4): 21 animations, 10 dash paths, ends 3300 ms ≤ 3600; the 260 ms timeout beat
  eq('it: intro animations', INTRO.length, 21)
  eq('it: intro dash paths (4 outlines + 3 tests + 3 probes)', INTRO.filter((r) => r[3] !== 'o').length, 10)
  eq('it: intro ends', introEnd(), 3300)
  ok('it: intro ≤ 3600 ms', introEnd() <= 3600)
  const n18 = INTRO[17], n19 = INTRO[18]
  eq('it: "no answer" lands 260 ms after the fail arrow', n19[0] - (n18[0] + n18[1]), 260)
  ok('it: intro rows in start order', INTRO.every((r, i) => !i || r[0] >= INTRO[i - 1][0]))
  // geometry (§8.4 constants) for both variants
  for (const [W0, H0, name] of [[360, 450, 'regular'], [360, 480, 'narrow']]) {
    const G = geom(W0, H0)
    eq(`it: ${name} band`, +G.band.toFixed(2), (H0 - 52 - 56) / 4)
    eq(`it: ${name} s = 0.6 pd`, +(G.s / G.pd).toFixed(3), 0.6)
    ok(`it: ${name} planes stacked bottom up without overlap`, G.planes.every((p, i) => !i || p.yf < G.planes[i - 1].yb))
    ok(`it: ${name} columns inside the plane`, U.every((u) => { const x = G.P(u, 0.5)[0]; return x > G.xl && x < G.xr + G.s }))
  }
  eq('it: regular plate at 390 is 358 × 447.5', `${358} × ${358 * 450 / 360}`, '358 × 447.5')
  eq('it: narrow plate at 360 is 328 × 437.3', `${328} × ${(328 * 4 / 3).toFixed(1)}`, '328 × 437.3')
  eq('it: narrow plate at 320 is 288 × 384', `${288} × ${288 * 4 / 3}`, '288 × 384')
  // the generated figure and the copy
  const html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  // the generator's own output (what the build writes between the f7 markers), independent of the file's current state
  const gen = (await genF7({ facts }))[0].html
  ok('it: generated figure present', gen.length > 1000, gen.length)
  eq('it: two drawing variants', (gen.match(/<svg class="sm v[rn]"/g) || []).length, 2)
  // L1: 4 occupied switch ports (PC-3, PC-1, PC-2, router); L2: broadcast to the 3 others; 1 unicast reply
  eq('it: L2 broadcast fan paths per variant', (gen.match(/class="fan"/g) || []).length, 6)
  for (const s of [L[0].val, 'found', L[2].val, 'no answer', 'answered', `${k.cause}`, `${k.name}&nbsp;</span>= ${k.target}`, `${k.name} = ?`, '>L4–6<', '>DNS · UDP 53<', k.target]) ok(`it: figure shows "${s}"`, gen.includes(s))
  // D2: the break mark (two ticks on the probe + "L4–6") sits in the gap BETWEEN the L7 front edge and the L3 back edge
  // (never on a plane, where it would read as part of that layer's test), in both variants
  for (const [v, H0] of [['r', 450], ['n', 480]]) {
    const G = geom(360, H0), lo = G.planes[3].yf, hi = G.planes[2].yb
    const d = (gen.match(new RegExp(`<svg class="ov v${v}"[^>]*>(?:(?!</svg>).)*?<path class="bk" d="([^"]+)"`)) || [])[1] || ''
    const ys = [...d.matchAll(/M[\d.]+ ([\d.]+)l6-3/g)].flatMap((m) => [+m[1], +m[1] - 3])
    ok(`it: ${v} break ticks between L7 (${lo}) and L3 (${hi})`, ys.length === 4 && ys.every((y) => y > lo + 2 && y < hi - 2), ys.join(','))
    const yl = +(gen.match(/<span class="l e bk" style="([^"]+)"/) || [])[1]?.match(v === 'r' ? /--y:([\d.]+)/ : /--yn:([\d.]+)/)?.[1]
    ok(`it: ${v} break label centred in the L7–L3 gap`, yl > lo + 8 && yl < hi - 8, yl)
  }
  ok('it: "RFC 9542" appears', html.includes('RFC 9542'))
  ok('it: "retired on Friday" appears', (html.match(/retired on Friday/g) || []).length >= 2)
  ok('it: "7042" appears only as "formerly 7042"', (html.match(/7042/g) || []).length === (html.match(/formerly 7042/g) || []).length)
  ok('it: "composite case" in caption and methods', (html.match(/composite case/g) || []).length >= 2)
  ok('it: no "most common" claim', !/most common/i.test(html))
}
