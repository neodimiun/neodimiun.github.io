// Chapter 06 asserts (Team DI), run by data/facts.assert.mjs on every build. Every hash Fig. 8 shows or compares is
// recomputed from facts.json with the SPEC-C A1 construction and checked against the values verified for SPEC-C §9.2
// (node:crypto here, coreutils sha256sum in the spec); the committed ledger-data.json is checked against them, its
// signatures verified with its public key, and the numbers the chapter states in words (methods, live sentences) recomputed.
import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkLedger } from './tools/ledger-html.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const H = (s) => createHash('sha256').update(s, 'utf8').digest('hex')

// SPEC-C §9.2 (exact)
const SPEC = {
  r: ['1c5ec779ab07ae437884481785ad9f74d50aa284a44bd56b21d59c53c4c57c68', '2a993f9ea30d6be3d368d007f002ebff7537ba089fd8bfd5ebbbd2aaf026e0dc',
    'c5a9d6bd6dc65616204d2186d9bd08bad42897038f6eb69d5d3afd838da8befb', 'f4c6c5b314597cfd35f668abb6bbe79b44174e4abbd9b761c54e447e12ccc688',
    'd01396fa7e12e9effe2c130eeee32a7df7a649c028b3dd762aaee6be1c829448'],
  h: ['e7819b8700f867850c29be78b9a5d5622fa3bd0ff60d8fe28389e8d2789be79e', 'ed94e67f8483662f2c3c483779439c62a7e512b2ccd69b61537919ee0656d418',
    '3cfcb1e05f9cb9b4f6cfbdc105069ef2b273116303c507d86a509e245fd5c9cc', '77f35d66baf4142856ed2bb96357c1cad1c50e769e6e20043cb6411f3c4e0d13',
    '0ce54cb978b68fc2e20c9600ac9c01051f56be5d55de9538da82fac01d0f0811'],
  payloadBytes: [43, 49, 52, 55, 38],
  r2t: '56a07ab2583611b9e0ccb3745a5f62f76afc3d787bf5bd114edafdcf9295dcde',
  ht: ['59682c8c9d6897cdcdc5efa52762a8f473dbc8bd4675e53f3492b47a79f9464b', 'bdb53fd435f7b2b81ce58108bdbfe104d41398377eda04f9f33cb0ea957e6673',
    'd4b67fbd9803c182d87ddb71d5a092db5cb98e7971276b2eb83084835b220c27', '3526350f91ecfba06af4a4f29e6e4db48840ef489fb30aa2ba3a6425a99e5401'],
}

export default function (facts, { eq, ok }) {
  const L = facts.ledger, rows = L.rows.map((k) => facts[k])
  const pay = (f, v = f.value) => `fig-${f.fig}|${f.label}|${v}|${f.unit}`
  const chain = (vals) => { let prev = '0'.repeat(64); return rows.map((f, i) => { const r = H(pay(f, vals[i])); prev = H(prev + r + String(i + 1)); return { r, h: prev } }) }
  const A = chain(rows.map((f) => f.value))
  rows.forEach((f, i) => {
    eq(`di: record 0${i + 1} payload bytes`, Buffer.byteLength(pay(f)), SPEC.payloadBytes[i])
    eq(`di: r${i + 1} = §9.2`, A[i].r, SPEC.r[i])
    eq(`di: h${i + 1} = §9.2`, A[i].h, SPEC.h[i])
  })
  eq('di: the methods line, record 01 = 1c5ec779…7c68', `${A[0].r.slice(0, 8)}…${A[0].r.slice(-4)}`, '1c5ec779…7c68')
  eq('di: the methods line, h1 = e7819b87…e79e', `${A[0].h.slice(0, 8)}…${A[0].h.slice(-4)}`, 'e7819b87…e79e')
  eq('di: HEAD shown = 0ce54cb9…', A[4].h.slice(0, 8), '0ce54cb9')
  // tamper 24.06 → 24.60 (changed and re-signed states replay the same values)
  const ti = L.rows.indexOf(L.tamper.row)
  const B = chain(rows.map((f, i) => (i === ti ? L.tamper.to : f.value)))
  eq('di: r2′ (24.60) = §9.2', B[ti].r, SPEC.r2t)
  for (let i = ti; i < rows.length; i++) eq(`di: replayed h${i + 1}′ = §9.2`, B[i].h, SPEC.ht[i - ti])
  ok('di: records before the tamper keep their hashes', B.slice(0, ti).every((x, i) => x.h === A[i].h))
  ok('di: tampered head ≠ anchor', B[4].h !== A[4].h)
  eq('di: changed-state readout 1 of 5 (records before the tamper verify)', `${ti} of ${rows.length}`, '1 of 5')
  eq('di: changed-state 4 FAIL', String(rows.length - ti), '4')
  eq('di: transposition +0.54 mL', (+L.tamper.to - +facts[L.tamper.row].value).toFixed(2), '0.54')
  // the committed signed ledger (DI-owned) agrees with all of the above and verifies with its own public key
  const p = join(HERE, 'ledger-data.json')
  ok('di: ledger-data.json exists (run tools/ledger-sign.mjs)', existsSync(p))
  if (existsSync(p)) {
    const data = JSON.parse(readFileSync(p, 'utf8'))
    let fine = true
    try { checkLedger(facts, data) } catch (e) { fine = false; ok(`di: ${e.message}`, false) }
    ok('di: ledger-data.json hashes, signatures and tamper signature verify', fine)
    eq('di: ledger-data.json anchor = h5 (§9.2)', data.anchor, SPEC.h[4])
    ok('di: no private key material in ledger-data.json', !/"d"\s*:|PRIVATE KEY|pkcs8/i.test(readFileSync(p, 'utf8')))
    eq('di: public key is a 65-byte uncompressed point', data.pub.length === 130 && data.pub.startsWith('04'), true)
  }
  // chapter.html: the copy strings that carry numbers
  const html = readFileSync(join(HERE, 'chapter.html'), 'utf8')
  ok('di: methods cite 11.10(a) and 7.11.3(b), and not 11.70', html.includes('11.10(a)') && html.includes('7.11.3(b)') && !html.includes('11.70'))
  ok('di: the methods printf for h1 uses r1 + "1"', html.includes(`${SPEC.r[0]}1"`))
}
