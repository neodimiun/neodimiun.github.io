// ledger.js (Team DI, lazy; one chunk with ledger-data.json). SPEC-C §9.2–9.4.
// The verifier replays every record line ON THE PAGE (figure | quantity | value | unit, read from the row's own text) with
// SHA-256, relinks h_n = SHA-256(hex h_{n−1} ‖ hex r_n ‖ n) from 64 zeros, checks every stored ECDSA P-256 signature with
// the shipped public key, and compares the replayed head with the anchor. Every class, icon and word on the figure is
// chosen from that output (never from the state name); the words themselves come from template#di-s in chapter.html.
// Per evaluation: 10 × subtle.digest + 5 × subtle.verify. No rAF; the intro and the press stagger are WAAPI only.
import data from './ledger-data.json'
// the WAAPI helpers (shell/stage/dom-figure.js) arrive through attach(): importing them here would split them out of the
// main bundle into a shared chunk, an extra request on first load
let anim, draw, fadeIn, finished, stopAll, announce

const ZERO = '0'.repeat(64)
const REC = data.records, N = REC.length, T = data.tamper, TI = REC.findIndex((d) => d.rec === T.rec)
const hex = (b) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('')
const bytes = (h) => { const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(2 * i, 2), 16); return b }
const short = (h) => h.slice(0, 8) + '…'
const ic = (n) => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`
const C = globalThis.crypto, S = C && C.subtle

export function attach(fig, { stage, pressed, fx }) {
  ;({ anim, draw, fadeIn, finished, stopAll, announce } = fx)
  const $ = (s, r = fig) => r.querySelector(s), $$ = (s, r = fig) => [...r.querySelectorAll(s)]
  // strings: every word the verifier can show (§9.2). {slot} filled from the verifier's numbers.
  const W = {}
  for (const i of $('#di-s').content.querySelectorAll('[data-k]')) W[i.dataset.k] = i.textContent
  const say = (k, o = {}) => W[k].replace(/\{(\w+)\}/g, (_, s) => o[s] ?? '')
  const rows = $$('.ledger .rec'), hd = $('.ledger .hd'), anc = $('.ledger .anc'), gen = $('.ledger .gen')
  const ro = Object.fromEntries($$('.readout [data-r]').map((e) => [e.dataset.r, e]))
  const txt = (li, s) => $(s, li).textContent.trim()

  // ---- hashing + signature engines (WebCrypto; sha256.js replays hashes where crypto.subtle is missing)
  let H, sigOk, browserSig = !!S
  const ready = (async () => {
    if (S) {
      const key = await S.importKey('raw', bytes(data.pub), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
      const enc = new TextEncoder()
      H = async (s) => hex(await S.digest('SHA-256', enc.encode(s)))
      sigOk = (sig, r) => S.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, bytes(sig), bytes(r))
    } else {
      // no browser signature check: a signature counts only for the exact r the build checked it against
      const { sha256 } = await import('./sha256.js')
      const p = (i, v) => `fig-${REC[i].fig}|${REC[i].q}|${v}|${REC[i].u}`
      const built = new Map([...REC.map((d) => [d.sig, d.r]), [T.sig, sha256(p(TI, T.v))]])
      H = async (s) => sha256(s)
      sigOk = async (sig, r) => built.get(sig) === r
    }
  })()

  // ---- no crypto.subtle: say "checked at build" wherever the page would otherwise claim a browser signature check.
  // The column's first word is droppable on narrow plates (CSS .sb); TR corner and caption follow (§9.4 Runtime).
  const [sb1, ...sb2] = W['sig.build'].split(' ')
  const sb = `<span class="sb">${sb1} </span>${sb2.join(' ')}`
  if (!browserSig) {
    fig.classList.add('nosub')
    $('.corner.tr').textContent = W['tr.build']
    const cb = $('figcaption .cb'); if (cb) cb.textContent = W['cap.build']
  }

  // ---- the three scenarios (data only): what is stored, and what the page shows for record 02
  const ST = fig.dataset.states.split(' ') // the three state names, in chapter.json order
  const scenario = (state) => { const k = ST.indexOf(state); return REC.map((d, i) => {
    const t = k > 0 && i === TI
    return { v: t ? T.v : d.v, sig: k > 1 && t ? T.sig : d.sig, rewrite: k > 1 && i >= TI, d }
  }) }

  // ---- the verifier (§9.2 rule: sig ok on replayed r, stored prev = replayed h_{n−1}, stored h = replayed h)
  let ms = 0, last = null
  async function verify(sc) {
    await ready
    const t0 = performance.now()
    const rs = await Promise.all(rows.map((li, i) => H(`fig-${sc[i].d.fig}|${txt(li, '.q')}|${txt(li, '.val')}|${txt(li, '.unit')}`)))
    const sos = Promise.all(rs.map((r, i) => sigOk(sc[i].sig, r)))
    let prev = ZERO
    const out = []
    for (let i = 0; i < N; i++) {
      const s = sc[i], r = rs[i], h = await H(prev + r + String(i + 1))
      const sp = s.rewrite ? prev : s.d.prev, sh = s.rewrite ? h : s.d.h
      out.push({ r, h, lo: sp === prev, ho: sh === h, re: s.sig !== s.d.sig, rl: sp !== s.d.prev || sh !== s.d.h })
      prev = h
    }
    ;(await sos).forEach((so, i) => { const x = out[i]; x.so = so; x.ok = so && x.lo && x.ho })
    ms = performance.now() - t0
    const ok = out.filter((x) => x.ok).length
    return (last = { rows: out, head: prev, eq: prev === data.anchor, ok, n: N })
  }

  // ---- paint: classes, icons and words from the verifier output
  let painted = null, keys = []
  function paint(v, sc) {
    const k2 = []
    rows.forEach((li, i) => {
      const x = v.rows[i], d = REC[i], s = sc[i]
      // the shown value (changed characters underlined); text content stays the plain value
      const val = $('.val', li)
      const vh = s.v === d.v ? s.v : [...s.v].map((c, j) => (c !== d.v[j] ? `<span class="chg">${c}</span>` : c)).join('')
      if (val.innerHTML !== vh) val.innerHTML = vh
      const next = i < N - 1 ? v.rows[i + 1].lo : x.ho // the segment below this node: does the next item link to it?
      li.classList.toggle('bad', !x.ok); li.classList.toggle('sigbad', !x.so)
      li.classList.toggle('rw', x.h !== d.h && x.ok); li.classList.toggle('brk', !next)
      li.classList.toggle('rl', x.rl && x.ok)
      $('.hx', li).textContent = short(x.h)
      $('.was', li).textContent = x.h === d.h ? '' : say(x.ho ? 'was.b' : 'was', { h: short(d.h) })
      // without crypto.subtle no signature is checked here: the column says so, with no icon either way (§14 item 50)
      $('.sig', li).innerHTML = browserSig ? `${W.sig} ${ic(x.so ? 'check' : 'cross')}` : sb
      const note = x.ok && (x.re ? W['row.re'] : x.rl ? W['row.rl'] : '')
      li.classList.toggle('nt', !!note)
      $('.st', li).innerHTML = x.ok ? `${ic('check')}${W['row.ok']}${note ? `<span class="note"><span class="d"> · </span>${note}</span>` : ''}` : `${ic('cross')}${x.so ? W['row.link'] : browserSig ? W['row.sig'] : W['row.sigb']}`
      k2.push(li.className + $('.st', li).textContent)
    })
    hd.classList.toggle('bad', !v.eq); hd.classList.toggle('brk', !v.eq); anc.classList.toggle('brk', !v.eq)
    $('.hx', hd).textContent = short(v.head)
    $('.st', hd).innerHTML = `${ic(v.eq ? 'check' : 'cross')}${(v.eq ? W['head.eq'] : W['head.ne']).toLowerCase()}`
    k2.push(hd.className)
    // readout (§9.2 table)
    const bad = v.n - v.ok
    ro.n.textContent = say('count', v)
    const all = bad === 0
    ro.s.innerHTML = all && !browserSig ? W.build : all ? `${ic('check')}${v.eq ? W['sum.all'] : W['sum.sl']}` : `${ic('cross')}${say('sum.part', { bad })}`
    if (all && !browserSig) delete ro.s.dataset.v; else ro.s.dataset.v = all ? 'y' : 'n'
    ro.h.textContent = short(v.head)
    ro.hs.innerHTML = `${ic(v.eq ? 'check' : 'cross')}${v.eq ? W['head.eq'] : W['head.ne']}`
    ro.hs.dataset.v = v.eq ? 'y' : 'n'
    const changed = painted ? k2.map((k, i) => k !== keys[i]) : []
    keys = k2
    return changed
  }

  // ---- the live sentence, chosen from the verifier output (final values only)
  function sentence(v) {
    const o = { ...v, rec: T.rec, from: REC[TI].v, to: T.v, next: REC[TI + 1]?.rec, last: REC[N - 1].rec }
    const pat = v.rows.map((x) => (x.ok ? (x.re || x.rl ? 'r' : 'o') : x.so ? 'l' : 's')).join('')
    const exp = (a, b, c) => 'o'.repeat(TI) + a + b.repeat(N - TI - 1) === pat && c
    const live = (k) => say('live.' + ST[k], o)
    if (exp('o', 'o', v.eq)) return live(0)
    if (browserSig && exp('s', 'l', !v.eq)) return live(1) // its words claim a signature check the browser made
    if (exp('r', 'r', !v.eq)) return live(2)
    return `${say('live.other', o)} ${W[v.eq ? 'live.eq' : 'live.ne']}`
  }

  let seq = 0
  async function set(state, { speak = true } = {}) {
    const my = ++seq
    const sc = scenario(state)
    // the page shows the scenario's value for record 02 first; the verifier then reads the page
    rows.forEach((li, i) => { const val = $('.val', li); if (val.textContent !== sc[i].v) val.textContent = sc[i].v })
    const v = await verify(sc)
    if (my !== seq) return v
    fig.dataset.state = state; pressed(state)
    const ch = paint(v, sc)
    painted = state
    if (stage.motion() && !fig.classList.contains('pre')) {
      let k = 0
      ;[...rows, hd].forEach((li, i) => { if (ch[i]) anim(li, [{ opacity: 0.35 }, { opacity: 1 }], { dur: 160, delay: 80 * k++, fill: 'backwards', easing: 'ease-out' }) })
    }
    if (speak) announce(fig, sentence(v))
    return v
  }

  // ---- intro (§9.4 timeline, ends at 2880 ms): opacity + stroke-dashoffset only, 31 animations, 8 dash paths
  async function play() {
    if (painted !== ST[0]) await set(ST[0], { speak: false })
    else await ready
    fig.classList.remove('pre')
    const f = (el, delay, dur = 180) => el && fadeIn(el, { delay, dur })
    const d = (el, delay, dur = 160) => el && draw(el, { delay, dur })
    f(gen, 0, 160); d($('.lk .ok', gen), 160, 100)
    rows.forEach((li, i) => {
      const t = 260 + 360 * i
      f(li, t); f($('.hx', li), t + 120, 160); d($('.lk .ok', li), t + 200); f($('.st', li), t + 260, 120)
    })
    f(hd, 2060); d($('.lk .ok', hd), 2220)
    f($('.seat', anc), 2380, 160); f($('.stamp', anc), 2380, 120); d($('.stamp rect', anc), 2380, 320)
    $$('.readout .val, .readout .status').forEach((e) => f(e, 2720, 160))
    await finished(fig)
    if (last && painted === ST[0]) announce(fig, sentence(last))
  }
  function settle() {
    stopAll(fig)
    fig.classList.remove('pre')
    if (painted !== ST[0]) set(ST[0], { speak: false })
  }

  const api = { set, play, settle, ready: set(ST[0], { speak: false }), stats: () => ({ verifyMs: +ms.toFixed(2), browserSig, painted }) }
  fig.__ledger = api
  return api
}
