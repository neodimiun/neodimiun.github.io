// node tools/scaffold.mjs (DS lead) — writes the day-0 PLACEHOLDER chapter.html / chapter.css / chapter.js for any
// chapter directory that does not have them yet. It NEVER overwrites an existing file: once a team has written its own
// file, this script leaves it alone. Copy is SPEC-C's final copy; figures are placeholder frames (GL figures run the
// shell's demo scene) so the whole page, stage hand-off, lint and check work before any team lands.
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const C = join(dirname(fileURLToPath(import.meta.url)), '..')
const FACTS = JSON.parse(readFileSync(join(C, 'data/facts.json'), 'utf8'))

const corners = (id, tr, bl) => `<span class="corner tl">{{fig:${id}}}</span><span class="corner tr">${tr}</span><span class="corner bl">${bl}</span><span class="corner br">Simulated</span>`
const ctrl = (label, states, rest, replay) => `<div class="ctrl" role="group" aria-label="${label}">${states.map((s) => `<button type="button" aria-pressed="${s === rest}" data-set="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}${replay ? '<button type="button" class="replay">{{icon:replay}}Replay</button>' : ''}</div>`
function glFig({ id, cls = 'fig--plate', aspect, states, initial, final, tr, bl, readout, label, replay, cap, alts }) {
  return `<figure class="fig ${cls}" id="fig-${id}" data-fig="${id}" data-kind="gl" data-states="${states.join(' ')}" data-state="${final}" data-final="${final}" data-initial="${initial}" style="--aspect: ${aspect}">
  <div class="plate"><div class="host">${states.map((s) => `{{poster:${id} ${s} "${alts[s]}"}}`).join('')}</div>${corners(id, tr, bl)}</div>
  ${readout || ''}
  ${ctrl(label, states, final, replay)}
  <p class="sr-only" aria-live="polite" data-live></p>
  <figcaption><b>{{fig:${id}}}</b> · ${cap} Shown: <span class="state">${final}</span>.</figcaption>
</figure>`
}
function domFig({ id, cls = 'fig--plate', aspect, states, final, tr, bl, readout, label, cap, note }) {
  return `<figure class="fig ${cls}" id="fig-${id}" data-fig="${id}" data-kind="dom" data-states="${states.join(' ')}" data-state="${final}" data-final="${final}" style="--aspect: ${aspect}">
  <div class="plate"><div class="draw ph-draw"><p class="ph-note">${note}</p></div>${corners(id, tr, bl)}</div>
  ${readout}
  ${label ? ctrl(label, states, final, true) : ''}
  ${label ? '<p class="sr-only" aria-live="polite" data-live></p>' : ''}
  <figcaption><b>{{fig:${id}}}</b> · ${cap}</figcaption>
</figure>`
}
const ro = (lbl, key, w, unit, status) => `<div class="readout" aria-hidden="true"><span class="lbl">${lbl}</span> <b class="val" style="--w:${w}" data-fact-readout="${key}">{{fact:${key}}}</b> <span class="unit">${unit}</span><span class="lead"></span><span class="status is-true">${status}</span></div>`
const head = (no, code, slug, kicker, years, title, roles) => `<div class="seam" aria-hidden="true"></div>
  <header class="ch-head">
    <p class="kicker"><span class="no">${no}</span> — ${kicker} <span class="yrs">${years}</span></p>
    <h2 id="${code}-t">${title}</h2>
    ${roles ? `<ul class="roles">${roles.map(([o, t, y]) => `<li><span class="org">${o}</span> <i>${t}</i> <span class="yr">${y}</span></li>`).join('')}</ul>` : ''}
  </header>`
const methods = (sum, body) => `<details class="methods"><summary><span class="k">Methods</span> · ${sum}</summary><p>${body}</p></details>`
const PH = '<!-- PLACEHOLDER (DS lead, day 0): this team replaces this file. Copy is SPEC-C final copy; the figure is a frame only. -->'

const CH = {
  '01-engineering': `${PH}
<section class="ch" id="engineering" data-ch="eng" aria-labelledby="eng-t">
  <div class="hero">
    <p class="kicker eyebrow"><span class="nw">José A. Fernández Abreu ·</span> <span class="nw">Materials &amp; Process Engineer ·</span> <span class="nw">Bilingual</span></p>
    <h1><span class="s">Under the finish,</span> <span class="s">the structure.</span> <span class="s">Under the number,</span> <span class="s">the record.</span></h1>
    ${glFig({ id: 'field', aspect: '1/1', states: ['polished', 'etched'], initial: 'polished', final: 'etched', tr: '×200', bl: '316L', label: 'Specimen state',
      cap: 'Solution-annealed 316L, polished then etched · ×200 nominal · simulated. The etch shows the structure under the finish.',
      alts: { polished: 'Polished 316L at ×200: a bright, featureless field', etched: 'Etched 316L at ×200: equiaxed austenite grains with annealing twins' } })}
    <p class="dek">I engineer special processes for aerospace landing gear. I got here through water chemistry, pharmaceutical microbiology, environmental testing and IT support, asking one question the whole way: is this number true, and what has to happen because of it?</p>
    <p class="links"><a href="mailto:{{site.email}}">{{site.email}}</a><span class="sep">·</span><a href="{{site.linkedin}}">LinkedIn</a></p>
    <p class="now"><span class="c">{{site.now.label}} · {{site.now.date}} —</span> <span class="c">{{site.now.role}},</span> <span class="c">{{site.now.org}}</span></p>
    {{contents}}
  </div>
  ${head('01', 'eng', 'engineering', 'Engineering', '· 2026–present', 'Now I answer for the process.', [['Collins Aerospace, Landing Systems', 'Senior Engineer, Materials &amp; Process Technologies', '2026–present'], ['Collins Aerospace', 'Chemical Process Laboratory', '2026']])}
  <div class="ch-body"><p>The deliberate turn. In every lab before this one, the solution in front of me was the sample. In the Chemical Process Laboratory it was the tool: a bath whose chemistry decides whether a part meets spec. Now I own the special processes on landing gear: plating, conversion coating, passivation. I own the tests that prove a finish will do its job, and the corrective action when results drift. Site focal for Nadcap special-process audits.</p></div>
  ${methods('special processes · testing', 'Testing that proves a finish will do its job: corrosion resistance, water break, paint and bend adhesion, hydrogen embrittlement, heat resistance, microhardness, porosity. Fig. 2: Vickers, ASTM E384 / ISO 6507-1. F = 0.5 kgf; d̄ = ({{fact:eng.hv.d1}} + {{fact:eng.hv.d2}}) / 2 = {{fact:eng.hv.dbar}} µm; reported {{fact:eng.hv}} HV0.5.')}
  <div class="fig-band on-resin"><div class="band-in">
    ${glFig({ id: 'indent', cls: 'fig--band', aspect: '1/1', states: ['etched', 'indented', 'measured'], initial: 'etched', final: 'measured', tr: '×500 · HV0.5', bl: '316L', label: 'Indent', replay: true,
      readout: ro('HV', 'eng.hv', '4ch', 'HV0.5', 'Measured'),
      cap: 'Solution-annealed 316L, etched and indented · Vickers HV0.5, ASTM E384 method · ×500 nominal · simulated. Two diagonals, one formula.',
      alts: { etched: 'Etched 316L at ×500', indented: 'A Vickers indent in etched 316L at ×500', measured: 'The indent measured: d1 71.4 µm, d2 72.1 µm, 180 HV0.5' } })}
    <div class="band-text"><h3>A hardness number is two diagonals and a formula.</h3><p>Trusting it a year from now takes the record.</p></div>
  </div></div>
  <p class="bridge">Before I owned the process, I measured it.</p>
</section>
`,
  '02-chemistry': `${PH}
<section class="ch" id="chemistry" data-ch="chem" aria-labelledby="chem-t">
  ${head('02', 'chem', 'chemistry', 'Chemistry', '· 2018–2025', 'Read it at eye level.', [['South Florida Water Management District', 'Chemist II', '2025'], ['City of Boca Raton', 'Lead Wastewater Analyst', '2018–2024']])}
  <div class="ch-body"><p>Left contract work for a utility because I wanted results acted on the same shift, not mailed out. Six years at Boca Raton running the plant's nutrient, solids, oxygen demand and physical methods, leading two analysts, owning calibration, reagents, LIMS review and chain of custody. Then the District: over 1,000 samples a month, total nitrogen by flow injection, color, organic carbon. When the queue never empties, only process discipline protects the data. Everything I report starts by reading it right.</p></div>
  ${glFig({ id: 'burette', aspect: '4/5', states: ['above', 'level', 'below'], initial: 'level', final: 'level', tr: '0.1 mL div.', bl: '50 mL burette', label: 'Look from',
    readout: ro('Reading', 'chem.burette', '5ch', 'mL', 'At eye level'),
    cap: 'Reading a burette · 50 mL, Class A, 0.1 mL divisions · simulated, refraction ignored. The ring closes into one line only at your eye\'s height; from above it reads low, from below, high.',
    alts: { above: 'Burette read from 12° above: 23.95 mL, reads low', level: 'Burette read at eye level: 24.06 mL', below: 'Burette read from 12° below: 24.17 mL, reads high' } })}
  ${domFig({ id: 'calibration', cls: 'fig--mini', aspect: '4/3', states: ['drawn'], final: 'drawn', tr: 'UV-Vis · absorbance', bl: '5 standards + check',
    readout: ro('Check recovery', 'chem.cal', '4ch', '%', 'Pass · ±10&nbsp;%'), note: 'Calibration line: Team CHEM',
    cap: 'Calibration, checked · five standards, UV-Vis absorbance · simulated. An independent check standard has to land inside its ±10&nbsp;% band before any result is reported.' })}
  ${methods('nutrients, solids, BOD, carbon', 'Nutrients, solids, oxygen demand, physical methods, color, total organic carbon. Fig. 3: reading = 24.06 − 0.5 · tan(eye angle) mL; 12° above or below gives {{fact:chem.burette.above}} / {{fact:chem.burette.below}}. Fig. 4: r = {{fact:chem.cal.r}}; check {{fact:chem.cal.checkTrue}} mg/L found {{fact:chem.cal.checkFound}} = {{fact:chem.cal}}&nbsp;% recovery, inside ±10&nbsp;%.')}
</section>
`,
  '03-microbiology': `${PH}
<section class="ch" id="microbiology" data-ch="micro" aria-labelledby="micro-t">
  ${head('03', 'micro', 'microbiology', 'Microbiology', '· 2018, 2025', 'Clean is a claim until you count survivors.', [['Aveva Drug Delivery Systems', 'QC Microbiologist II, cGMP', '2025'], ['University of Florida', 'M.S. Microbiology &amp; Cell Science', '2018']])}
  <blockquote class="pull">Cleanrooms do not forgive a sloppy record.</blockquote>
  <div class="ch-body"><p>Moved into cGMP manufacturing to learn quality at its strictest. Sterile isn't the same as safe. I tested purified water, WFI and pure steam for endotoxin, each sample beside a spiked twin to prove nothing in the water was hiding it. I sampled points of use inside cleanrooms, identified isolates by VITEK 2, and carried a facility-wide disinfectant efficacy study from execution through the co-authored report. The UF master's, finished while working full time, made my microbiology match my chemistry.</p></div>
  ${domFig({ id: 'disinfectant', aspect: '10/9', states: ['plated', 'incubated', 'counted'], final: 'counted', tr: 'TSA · 30–35 °C · 72 h', bl: '<i>S. aureus</i> ATCC 6538 · 316L', label: 'Plate state',
    readout: ro('Log reduction', 'micro.key', '4ch', 'log', 'Pass · NLT 3.0'), note: 'Counted survivors: Team MICRO',
    cap: 'Disinfectant efficacy, coupon method, USP &lt;1072&gt; · S. aureus on 316L · simulated. Shown: <span class="state">counted</span>.' })}
  ${methods('endotoxin, IDs, disinfectants', 'Endotoxin, kinetic chromogenic (USP &lt;85&gt;). Point-of-use water sampling (USP &lt;1231&gt;). Identification by VITEK 2 (USP &lt;1113&gt;). Disinfectant efficacy (USP &lt;1072&gt;). Control {{sci:micro.key.control.cfuSci}} CFU per coupon (log {{fact:micro.key.control.log}}); disinfected {{fact:micro.key.treated.cfu}} (log {{fact:micro.key.treated.log}}); log reduction {{fact:micro.key}}. Simulated, not an employer result.')}
</section>
`,
  '04-environmental': `${PH}
<section class="ch" id="environmental" data-ch="env" aria-labelledby="env-t">
  ${head('04', 'env', 'environmental', 'Environmental science', '· 2015–2018', 'Time says what. Area says how much.', [['Advanced Environmental Laboratories', 'Senior Analyst, Inorganic Chemistry &amp; Microbiology', '2015–2018']])}
  <div class="ch-body"><p>Client data gets audited, so I learned to write a result I could defend a year later. I chose a commercial lab for the longest method list under one roof: anions by ion chromatography in water and soil, hexavalent chromium, solids, oxygen demand, the full coliform suite. A peak becomes a nitrate result when the run's own standards identify it and size it; a spike into the same water shows whether the matrix is hiding any. Senior analyst over three people across wet chemistry and microbiology.</p></div>
  ${domFig({ id: 'chromatogram', aspect: '4/5', states: ['std', 'sample', 'spike'], final: 'sample', tr: 'Conductivity', bl: 'Drinking water', label: 'Show injection',
    readout: ro('Nitrate as N', 'env.key', '4ch', 'mg/L', 'Below MCL 10'), note: 'The Run: Team ENV',
    cap: 'Anions in drinking water by ion chromatography, suppressed conductivity · EPA 300.0 · simulated. Shown: <span class="state">sample</span>.' })}
  ${methods('anions, Cr(VI), BOD, coliforms', 'Anions by ion chromatography, EPA 300.0 (water) and EPA 9056 (soil). Sample ({{fact:env.key.area}} − {{fact:env.key.cal.b}}) ÷ {{fact:env.key.cal.m}} = {{fact:env.key}} mg/L. Matrix spike recovery {{fact:env.key.spike.recovery}}&nbsp;% (80–120&nbsp;%).')}
  <p class="bridge">Before any bench, I fixed computers. That paid for school.</p>
</section>
`,
  '05-it': `${PH}
<section class="ch" id="it" data-ch="it" aria-labelledby="it-t">
  ${head('05', 'it', 'it', 'IT', '· 2008–2015', 'Model the system before touching it.', [['CompMedic, LLC', 'IT Technical Support', '2008–2015'], ['Miami Dade College', 'A.A. to B.S. Biological Sciences (Biotechnology), Highest Honors', '2009–2015']])}
  <div class="ch-body"><p>Fixing computers paid for my first degrees and taught me the method I still use on a process: model the system before touching it, then test the cheapest hypothesis first, from the wire up. A typical Monday call: the internet is down. The link light is on, the router answers, the outside world answers by address. Only the name lookup fails. I told the office manager: one computer is still asking for a server that was retired on Friday.</p></div>
  ${domFig({ id: 'layers', aspect: '4/5', states: ['model', 'trace', 'fix'], final: 'trace', tr: '4 tests · bottom up', bl: 'Office LAN /24', label: 'Fault trace',
    readout: ro('Round trip', 'it.key', '3ch', 'ms', 'Pass'), note: 'The System Model: Team IT',
    cap: 'Fault trace on a small-office network, layer 1 to layer 7 · composite case · simulated. Shown: <span class="state">trace</span>.' })}
  ${methods('link, ARP, ping, name lookup', 'Bottom up, one test per layer. L3: ping {{fact:it.key.target}}, (18 + 17 + 19 + 18) ÷ 4 = {{fact:it.key}} ms. Composite case, no client data; RFC 1918, RFC 5737, RFC 9542 (formerly 7042), RFC 2606.')}
  <p class="bridge">Records are systems too.</p>
</section>
`,
  '06-data-integrity': `${PH}
<section class="ch" id="data-integrity" data-ch="di" aria-labelledby="di-t">
  ${head('06', 'di', 'data-integrity', 'Compliance &amp; data integrity', '· 2015–present', 'Undocumented work did not happen.', null)}
  <div class="ch-body"><p>Accreditation, a discharge permit, cGMP, Nadcap: four rulebooks, one rule. Calibrate first, keep chain of custody, correct by appending, never overwriting. A promise is not an answer; a record anyone can check is. The weak point was always the gap between instrument and record; I am trying to close it.</p></div>
  <div class="iqc kicker" data-once="iqc"><p data-iqc="tagline">Immutable QC — {{fact:iqc.tagline}}</p><p data-iqc="sentence">{{site.iqcSentence}}</p><p data-iqc="status">{{fact:iqc.status}}</p><p data-iqc="roadmap">{{fact:iqc.roadmap}}</p>{{#if site.iqcVisit}}<p><a href="{{site.iqcUrl}}">Visit immutableqc.com {{icon:arrow-ne}}</a></p>{{/if}}</div>
  <figure class="fig fig--plate" id="fig-record" data-fig="record" data-kind="dom" data-states="recorded changed resigned" data-state="recorded" data-final="recorded" style="--aspect: 5/6">
    <div class="plate"><ol class="ledger ph-ledger" aria-label="Five chapter records, signed and hash-linked">
      ${['eng.hv', 'chem.burette', 'micro.key', 'env.key', 'it.key'].map((k) => `<li class="rec" data-key="${k}"><span class="val">{{fact:${k}}}</span> <span class="unit">{{fact:${k}.unit}}</span> · {{figref:${FACTS[k].fig}}}</li>`).join('\n      ')}
    </ol>${corners('record', 'SHA-256 · P-256', 'Records 01–05')}</div>
    <p id="ctrl-l">Record 02 was recorded as 24.06 mL. Show it as recorded, changed to 24.60, or changed and re-signed:</p>
    <div class="ctrl" role="group" aria-labelledby="ctrl-l"><button type="button" aria-pressed="true" data-set="recorded">Recorded</button><button type="button" aria-pressed="false" data-set="changed">Changed</button><button type="button" aria-pressed="false" data-set="resigned">Re-signed</button><button type="button" class="replay">{{icon:replay}}Replay</button></div>
    <p class="sr-only" aria-live="polite" data-live></p>
    <figcaption><b>{{fig:record}}</b> · One number from each chapter above · SHA-256 links, ECDSA P-256 signatures, checked in your browser · demo key, anchor simulated.</figcaption>
  </figure>
  ${methods('SHA-256, P-256 signatures', 'Ledger construction and verification: Team DI.')}
</section>
`,
}

const CSS = (code, slug, extra = '') => `/* PLACEHOLDER (DS lead, day 0): Team replaces this file. Selectors start with [data-ch=${code}] or #${slug}; tokens only. */
[data-ch=${code}] .ph-draw{position:absolute;inset:40px 16px;display:grid;place-items:center;border:1px dashed var(--steel)}
[data-ch=${code}] .ph-note{font:400 11px/1.4 var(--mono);color:var(--fg-2);text-transform:uppercase;letter-spacing:.06em}
[data-ch=${code}] .fig.pre .plate{opacity:0}
${extra}`
const CSSX = {
  '01-engineering': `@media (min-width:380px){#engineering .hero h1 .s{display:inline-block;white-space:nowrap}}
#engineering .hero .fig .plate{width:min(100%, clamp(232px, var(--svh) * 100 - 344px, 358px));margin:0 auto;border-radius:50%}
@media (min-width:1024px){#engineering .hero .fig .plate{width:min(100%, 560px, var(--svh) * 100 - 260px)}}
#engineering .fig--band{max-width:min(100%, var(--svh) * 70)}`,
  '06-data-integrity': `[data-ch=di] .ph-ledger{position:absolute;inset:40px 16px;display:grid;align-content:center;gap:12px;font:400 13px/1.4 var(--mono)}
[data-ch=di] .ph-ledger .val{font-weight:500}
[data-ch=di] #ctrl-l{margin-top:12px;font-size:15px}
[data-ch=di] .iqc{margin-top:16px}`,
}

const JS = `// PLACEHOLDER (DS lead, day 0): the team replaces this file. Generic wiring from the figure's data attributes:
// GL figures run the shell's demo scene; DOM figures fade in once. It shows the stage contract end to end.
import { wireControls, announce, fadeIn, stopAll } from '../../shell/stage/dom-figure.js'

export default function setup({ stage, root }) {
  for (const fig of root.querySelectorAll('figure.fig')) {
    const id = fig.dataset.fig, states = (fig.dataset.states || '').split(' '), final = fig.dataset.final
    const cap = fig.querySelector('figcaption .state')
    const show = (s) => { c.pressed(s); if (cap) cap.textContent = s }
    const c = wireControls(fig, {
      onSet: (s) => { show(s); stage.setState(id, s); announce(fig, \`Shown: \${s}.\`) },
      onReplay: () => stage.replay(id),
    })
    if (fig.dataset.kind === 'gl') {
      stage.register({
        id, kind: 'gl', fig, host: fig.querySelector('.host'), states, initial: fig.dataset.initial || final, final,
        load: () => import('../../shell/stage/demo.gl.js'),
        intro: { at: 0.4, delay: 450, maxMs: 2600 }, pointer: 'fine-hover',
        onState(snap) { if (snap.state) show(snap.state) },
      })
    } else {
      stage.registerDom({
        id, kind: 'dom', fig, final, intro: { at: 0.4, delay: 250 },
        arm(el) { el.classList.add('pre') },
        play(el) { el.classList.remove('pre'); return fadeIn(el.querySelector('.plate'), { dur: 600 }).finished },
        settle(el) { el.classList.remove('pre'); stopAll(el) },
        set(el, s) { el.dataset.state = s; show(s) },
      })
    }
  }
}
`

let wrote = 0
for (const [dir, html] of Object.entries(CH)) {
  const d = join(C, 'chapters', dir)
  mkdirSync(d, { recursive: true })
  const j = JSON.parse(readFileSync(join(d, 'chapter.json'), 'utf8'))
  const files = { 'chapter.html': html, 'chapter.css': CSS(j.code, j.slug, CSSX[dir] || ''), 'chapter.js': JS }
  for (const [f, body] of Object.entries(files)) {
    const p = join(d, f)
    const refresh = process.argv.includes('--refresh') && existsSync(p) && readFileSync(p, 'utf8').includes('PLACEHOLDER (DS lead, day 0)')
    if (existsSync(p) && !refresh) { console.log(`kept   ${dir}/${f} (exists)`); continue }
    writeFileSync(p, body); wrote++
    console.log(`wrote  ${dir}/${f}`)
  }
}
console.log(`${wrote} placeholder file(s) written`)
