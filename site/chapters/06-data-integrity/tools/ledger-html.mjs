// ledger-html.mjs (Team DI): the declared generator for Fig. 8 (SPEC-C §9.4, A11). Pure and deterministic: no key, no
// network, no randomness. It renders the authored (final, "recorded") ledger rows between <!--gen:ledger:start/end--> in
// chapter.html from facts.json (record lines) and the committed ledger-data.json (hashes). Before writing anything it
// re-checks what the page will claim: every r and h recomputed from facts, the anchor = h₅, and every stored signature
// (and the tamper signature) verified with the shipped public key. Any disagreement stops the build.
import { createHash, createPublicKey, verify } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chapters } from '../../../site.config.mjs'

const H = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const short = (h) => h.slice(0, 8) + '…'
const payload = (f, v = f.value) => `fig-${f.fig}|${f.label}|${v}|${f.unit}`

export function checkLedger(facts, data) {
  const pub = Buffer.from(data.pub, 'hex')
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('ledger-data.json: pub must be a 65-byte uncompressed P-256 point')
  const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' })
  const ok = (rHex, sig) => verify('sha256', Buffer.from(rHex, 'hex'), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'hex'))
  let prev = '0'.repeat(64)
  const rows = facts.ledger.rows.map((k, i) => {
    const f = facts[k], d = data.records[i] || {}
    const r = H(payload(f)), h = H(prev + r + String(i + 1))
    if (d.r !== r || d.h !== h || d.prev !== prev || d.v !== f.value || d.u !== f.unit || d.q !== f.label || d.fig !== f.fig) throw new Error(`ledger stale at record ${i + 1} (${k}): DI runs node chapters/06-data-integrity/tools/ledger-sign.mjs (§12.4)`)
    if (!ok(r, d.sig)) throw new Error(`ledger-data.json record ${i + 1}: signature does not verify`)
    prev = h
    return { key: k, f, d }
  })
  if (data.anchor !== prev) throw new Error('ledger-data.json: anchor ≠ h₅')
  const t = facts.ledger.tamper, ti = facts.ledger.rows.indexOf(t.row)
  if (data.tamper.v !== t.to || data.tamper.rec !== data.records[ti].rec) throw new Error('ledger-data.json: tamper ≠ facts.ledger.tamper')
  if (!ok(H(payload(facts[t.row], t.to)), data.tamper.sig)) throw new Error('ledger-data.json: tamper signature does not verify')
  if (/"d"\s*:/.test(JSON.stringify(data))) throw new Error('ledger-data.json holds private key material')
  return rows
}

// Rows are authored as checked at build (no JS, or before ledger.js loads): the browser's own result replaces the status.
// the spine segment from this node to the next one (x 10.5 px). Rows have fixed heights, so the segment is 100 % of the row.
const LK = (bad = true) => `<svg class="lk" aria-hidden="true"><line class="ok" x1="10.5" x2="10.5" y2="100%" pathLength="1"/>${bad ? '<line class="bad" x1="10.5" x2="10.5" y2="100%" pathLength="1"/><use href="#i-cross" x="5.5" y="50%" width="10" height="10" transform="translate(0 -5)"/>' : ''}</svg>`
const DIAMOND = (s) => `<svg class="nd" aria-hidden="true" viewBox="0 0 14 14"><rect x="${(14 - s) / 2}" y="${(14 - s) / 2}" width="${s}" height="${s}" transform="rotate(45 7 7)"/></svg>`

export default async function gen({ facts, root }) {
  const data = JSON.parse(readFileSync(join(root, 'ledger-data.json'), 'utf8'))
  const rows = checkLedger(facts, data)
  // chapter number, name (and short form below 600 px) and accent code from the chapter that declares each figure
  const site = chapters.map((d) => JSON.parse(readFileSync(join(root, '..', d, 'chapter.json'), 'utf8')))
  const chOf = (fig) => site.find((c) => c.figures.some((x) => x.id === fig))
  const name = (c) => {
    const s = c.navShort && c.nav.startsWith(c.navShort) && c.nav !== c.navShort ? c.navShort : null
    return s ? `${esc(s)}<span class="lf">${esc(c.nav.slice(s.length))}</span>` : esc(c.nav)
  }
  const li = rows.map(({ key, f, d }) => {
    const c = chOf(f.fig)
    if (!c) throw new Error(`no chapter declares figure "${f.fig}" (${key})`)
    return `<li class="rec c-${c.code}" data-key="${key}">${LK()}<span class="nd"></span>` +
      `<div class="l1"><span class="nm"><i class="bar"></i>${c.no} ${name(c)}</span><span class="lead"></span><span class="vu"><b class="val">${esc(f.value)}</b> <span class="unit">${esc(f.unit)}</span></span></div>` +
      `<div class="l2">{{figref:${f.fig}}} · <span class="q">${esc(f.label)}</span></div>` +
      `<div class="l3"><span class="h"><span class="lw">link </span><span class="hx">${short(d.h)}</span><span class="was"></span></span><span class="sig">signed</span><span class="lead"></span><span class="st">checked at build</span></div></li>`
  })
  const html = `<li class="gen">${LK(false)}${DIAMOND(8)}<div class="l1"><span class="g">h<sub>0</sub></span><span class="hx">${short('0'.repeat(64))}</span> · start</div></li>` +
    li.join('') +
    `<li class="hd">${LK()}${DIAMOND(10)}<div class="l1"><span class="k">Head</span> <span class="hx">${short(data.anchor)}</span><span class="lead"></span><span class="st">matches anchor</span></div></li>` +
    `<li class="anc"><svg class="seat" aria-hidden="true" viewBox="0 0 21 14"><path class="tri" d="M10.5 .5l5 7h-10z"/><path class="gl" d="M1 8.25h19"/><path class="ht" d="M5 9.5l-4 4M11 9.5l-4 4M17 9.5l-4 4"/></svg>` +
    `<div class="stamp"><svg aria-hidden="true"><rect pathLength="1" width="100%" height="100%"/></svg><span class="k">Anchored</span> <span class="hx">${short(data.anchor)}</span> <span class="sim">Simulated</span></div></li>`
  return [{ marker: 'ledger', html }, { marker: 'head', html: short(data.anchor) }]
}
