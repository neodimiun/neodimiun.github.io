// Fig. 7 "The System Model" (Team IT, SPEC-C §8). Pure data and derivations; every string on the figure comes from
// facts['it.key'] through this file. Composite case, no client data: RFC 1918 LAN, RFC 5737 public addresses,
// RFC 9542 (formerly 7042) MAC, RFC 2606 name. PC-3 was set by hand years ago to the old server's DNS (.10); that server
// was retired on Friday; the call is on Monday. Everyone else gets DNS from the router (DHCP pool .100–.199).
// The geometry (geom) runs at BUILD time only (tools/layers-svg.mjs); chapter.js imports the strings and the intro table.

// ---------------------------------------------------------------- numbers
export const mean = (e) => e.reduce((a, b) => a + b, 0) / e.length
export const speedText = (bps) => (bps >= 1e9 ? (bps / 1e9).toFixed(1) + ' Gbps' : (bps / 1e6).toFixed(1) + ' Mbps')
// after the fix PC-3 asks the router, which forwards to the ISP resolver; the name resolves to the address that already answered
export const resolve = (k, dns) => (dns === k.fixDns ? k.target : null)

// ---------------------------------------------------------------- strings (readout, live region, hover)
export function words(k) {
  const v = `${k.value} ${k.unit}`
  return {
    rt: v, raw: `${k.echoes.join(' · ')} ${k.unit}`, of: `${k.echoes.length} of ${k.echoes.length}`,
    say: {
      model: 'Model. The documented office, before any test.',
      trace: `Trace complete. Physical, link and network pass; round trip ${k.value} milliseconds. Name lookup fails: PC-3 asks ${k.cause}, a server retired on Friday.`,
      fix: `Same tests, after the fix: all four pass. PC-3 now asks the router; ${k.name} resolves to ${resolve(k, k.fixDns)}.`,
    },
  }
}
// readout rows per state: [value, unit, status word, status class ('' | 't')]
export function readout(k) {
  const W = words(k)
  return {
    model: [['–', k.unit, 'Not run', ''], ['–', '', 'Not traced', '']],
    trace: [[k.value, `${k.unit} · ${W.of}`, 'Pass', 't'], [k.cause, 'DNS', 'Found', 't']],
    fix: [[k.value, `${k.unit} · ${W.of}`, 'Pass', 't'], [k.cause, 'DNS', 'Fixed', 't']],
  }
}

// ---------------------------------------------------------------- the four tests (OSI 1, 2, 3, 7), cheapest first
export function layers(k) {
  return [
    { n: 1, name: 'L1 PHYSICAL', test: 'LINK LIGHT', val: k.speed, ok: true },
    { n: 2, name: 'L2 LINK', test: 'GATEWAY MAC', val: 'found', ok: true },
    { n: 3, name: 'L3 NETWORK', test: 'PING BY ADDRESS', val: `${k.value} ${k.unit}`, ok: true },
    { n: 7, name: 'L7 APPLICATION', test: 'NAME LOOKUP', val: 'no answer', ok: false, fix: 'answered' },
  ]
}

// ---------------------------------------------------------------- intro (SPEC-C §8.4): 21 WAAPI animations, 10 dash paths
// [start ms, duration ms, target, kind]   kind: d = stroke-dashoffset (non-scaling stroke, screen px),
// m = stroke-dashoffset on a probe's mask path (pathLength 1), o = opacity.  '%' = inside the visible SVG variant.
export const INTRO = [
  [0, 240, '%.p1 .pl', 'd'], [80, 240, '%.p2 .pl', 'd'], [160, 240, '%.p3 .pl', 'd'], [240, 240, '%.p7 .pl', 'd'],
  [400, 200, '.a5', 'o'], [400, 200, '.a6', 'o'],
  [560, 320, '%.t1', 'd'], [880, 140, '.a8', 'o'],
  [1020, 160, '%.m1', 'm'], [1080, 160, '%.a10', 'o'], [1240, 160, '%.t2', 'd'], [1400, 140, '.a12', 'o'],
  [1540, 160, '%.m2', 'm'], [1600, 320, '%.t3', 'd'], [1920, 140, '.a15', 'o'], [1920, 140, '.a16', 'o'],
  [2060, 160, '%.m3', 'm'], [2120, 320, '%.a18', 'o'], [2700, 140, '.a19', 'o'],
  [2980, 320, '.a20', 'o'], [2980, 320, '.a21', 'o'],
]
export const introEnd = () => Math.max(...INTRO.map(([s, d]) => s + d))

// ---------------------------------------------------------------- geometry (build time; SPEC-C §8.4 "build(W, H)")
export const U = [0.07, 0.29, 0.51, 0.72, 0.93] // PC-3, SWITCH, ROUTER, ISP, PORTAL at v = .5
export function geom(W, H) {
  const yTop = 56, yBot = H - 52, band = (yBot - yTop) / 4, pd = band - 32, s = 0.6 * pd, xl = 12, xr = W - 12 - s
  const planes = [0, 1, 2, 3].map((i) => {
    const bandTop = yTop + (3 - i) * band, yb = bandTop + 22, yf = yb + pd
    return { i, n: [1, 2, 3, 7][i], bandTop, yb, yf }
  })
  // plane-local point: origin (0, yf) of its plane, so every plane shares the same local coordinates
  const P = (u, v) => [xl + u * (xr - xl) + v * s, -v * pd]
  const N = U.map((u) => P(u, 0.5))
  return {
    W, H, yTop, yBot, band, pd, s, xl, xr, planes, P, N,
    o1: P(0.14, 0.86), o2: P(0.14, 0.14), ghost: P(0.35, 0.72),
    poly: [[xl, 0], [xr, 0], [xr + s, -pd], [xl + s, -pd]],
  }
}
