// ledger-sign.mjs (Team DI). NOT a generator: run by hand, never by build.mjs (SPEC-C A2, §9.4, §12.4).
//   node chapters/06-data-integrity/tools/ledger-sign.mjs
// Reads facts.ledger.rows, builds the five record payloads, makes a fresh P-256 key pair in memory, signs the 32 raw bytes
// of every r (and of r₂′, the 24.06 → 24.60 tamper, for the "re-signed" state), exports the public key as 65-byte
// uncompressed hex and writes ledger-data.json. The private key is never written and is dropped when the process exits.
import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const C = join(HERE, '../../..')
const facts = JSON.parse(readFileSync(join(C, 'data/facts.json'), 'utf8'))
const H = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
const B = (hex) => Buffer.from(hex, 'hex')
const payload = (f, v = f.value) => `fig-${f.fig}|${f.label}|${v}|${f.unit}`

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const jwk = publicKey.export({ format: 'jwk' })
const pub = '04' + Buffer.from(jwk.x, 'base64url').toString('hex').padStart(64, '0') + Buffer.from(jwk.y, 'base64url').toString('hex').padStart(64, '0')
const sig = (rHex) => sign('sha256', B(rHex), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('hex')

let prev = '0'.repeat(64)
const records = facts.ledger.rows.map((key, i) => {
  const f = facts[key]
  const r = H(payload(f)), h = H(prev + r + String(i + 1))
  const o = { rec: String(i + 1).padStart(2, '0'), fig: f.fig, q: f.label, v: f.value, u: f.unit, prev, r, h, sig: sig(r) }
  prev = h
  return o
})
const t = facts.ledger.tamper
const ti = facts.ledger.rows.indexOf(t.row)
const r2 = H(payload(facts[t.row], t.to))
const data = { pub, anchor: prev, records, tamper: { rec: records[ti].rec, v: t.to, sig: sig(r2) } }

// self-check with the public key only, as the browser will
const pk = { key: publicKey, dsaEncoding: 'ieee-p1363' }
for (const o of records) if (!verify('sha256', B(o.r), pk, B(o.sig))) throw new Error(`record ${o.rec}: signature does not verify`)
if (!verify('sha256', B(r2), pk, B(data.tamper.sig))) throw new Error('tamper signature does not verify')

writeFileSync(join(HERE, '../ledger-data.json'), JSON.stringify(data, null, 1) + '\n')
console.log(`ledger-data.json written: ${records.length} records, anchor ${data.anchor.slice(0, 8)}…, public key ${pub.slice(0, 10)}… (private key discarded)`)
