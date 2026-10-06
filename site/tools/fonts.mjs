// node tools/fonts.mjs  (DS lead; run once, output committed)
// 1. Instances the OFL variable fonts to the three static files SYSTEM-C §1.2 specifies (python fontTools):
//      Archivo (wdth 115, wght 620), Newsreader roman (opsz 16, wght 420), Newsreader italic (opsz 20, wght 420)
//    and copies IBM Plex Mono 400/500 byte-for-byte (its OFL declares the Reserved Font Name "Plex").
// 2. Computes metric-matched fallback faces (size-adjust, ascent/descent/line-gap overrides) against
//    Arial / Times New Roman / Courier New (measured on their metric-compatible Liberation clones) and writes
//    shell/fonts.css.
// 3. Extracts every file's cmap to tools/glyphs.json for the glyph lint (SPEC-C A8).
import { execFileSync } from 'node:child_process'
import { copyFileSync, writeFileSync, readFileSync, statSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const C = join(dirname(fileURLToPath(import.meta.url)), '..')
// Sources: one folder (--src=<dir>, default .build/fonts-src) holding the OFL originals under these names:
// archivo-latin-wdth-normal.woff2 (@fontsource-variable/archivo 5.3.0), newsreader-roman-420-opsz.woff2 and
// newsreader-italic-420-opsz.woff2 (Newsreader, opsz axis kept), ibm-plex-mono-latin-{400,500}-normal.woff2
// (@fontsource/ibm-plex-mono 5.3.0), plus OFL-Archivo.txt, OFL-Newsreader.txt, OFL-IBM-Plex-Mono.txt.
const srcArg = process.argv.find((a) => a.startsWith('--src='))
const SRCDIR = srcArg ? srcArg.slice(6) : join(C, '.build/fonts-src')
const SRC = {
  archivo: join(SRCDIR, 'archivo-latin-wdth-normal.woff2'),
  newsRoman: join(SRCDIR, 'newsreader-roman-420-opsz.woff2'),
  newsItalic: join(SRCDIR, 'newsreader-italic-420-opsz.woff2'),
  plex400: join(SRCDIR, 'ibm-plex-mono-latin-400-normal.woff2'),
  plex500: join(SRCDIR, 'ibm-plex-mono-latin-500-normal.woff2'),
}
for (const p of Object.values(SRC)) if (!existsSync(p)) { console.error(`fonts.mjs: missing source ${p} (pass --src=<dir>)`); process.exit(1) }
const OUT = join(C, 'fonts')
const FILES = {
  archivo: 'archivo-c-115-620.woff2',
  news: 'newsreader-c-420.woff2',
  newsItalic: 'newsreader-c-420-italic.woff2',
  plex400: 'ibm-plex-mono-latin-400-normal.woff2',
  plex500: 'ibm-plex-mono-latin-500-normal.woff2',
}

const PY = String.raw`
import sys, json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
jobs = json.loads(sys.argv[1])
for src, dst, axes in jobs:
    f = TTFont(src)
    st = instancer.instantiateVariableFont(f, axes, inplace=False, updateFontNames=False)
    for t in ('STAT', 'MVAR', 'HVAR', 'avar', 'fvar', 'gvar', 'cvar'):
        if t in st: del st[t]
    st.flavor = 'woff2'
    st.save(dst)
`
const MEASURE = String.raw`
import sys, json
from fontTools.ttLib import TTFont
files = json.loads(sys.argv[1]); sample = sys.argv[2]
out = {}
for key, path in files.items():
    f = TTFont(path)
    upm = f['head'].unitsPerEm
    cmap = f.getBestCmap(); hmtx = f['hmtx']
    os2 = f['OS/2']; hhea = f['hhea']
    use_typo = bool(os2.fsSelection & (1 << 7))
    asc, desc, gap = (os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap) if use_typo else (hhea.ascent, hhea.descent, hhea.lineGap)
    widths = [hmtx[cmap[ord(c)]][0] for c in sample if ord(c) in cmap]
    out[key] = { 'upm': upm, 'asc': asc, 'desc': desc, 'gap': gap, 'avg': sum(widths) / len(widths) / upm,
                 'cmap': sorted(cmap.keys()) }
print(json.dumps(out))
`

// 1. instance + copy
execFileSync('python3', ['-c', PY, JSON.stringify([
  [SRC.archivo, join(OUT, FILES.archivo), { wdth: 115, wght: 620 }],
  [SRC.newsRoman, join(OUT, FILES.news), { opsz: 16 }],
  [SRC.newsItalic, join(OUT, FILES.newsItalic), { opsz: 20 }],
])], { stdio: 'inherit' })
copyFileSync(SRC.plex400, join(OUT, FILES.plex400))
copyFileSync(SRC.plex500, join(OUT, FILES.plex500))
for (const f of ['OFL-Archivo.txt', 'OFL-Newsreader.txt', 'OFL-IBM-Plex-Mono.txt']) {
  if (existsSync(join(SRCDIR, f))) copyFileSync(join(SRCDIR, f), join(OUT, f))
}

// 2. fallback metrics. Sample: representative English text (the chapter copy's letter mix).
const SAMPLE = 'I engineer special processes for aerospace landing gear. I got here through water chemistry, pharmaceutical microbiology, environmental testing and IT support, asking one question the whole way: is this number true, and what has to happen because of it? Calibrate first, keep chain of custody, correct by appending, never overwriting.'
const LIB = '/usr/share/fonts/truetype/liberation/'
const m = JSON.parse(execFileSync('python3', ['-c', MEASURE, JSON.stringify({
  archivo: join(OUT, FILES.archivo), news: join(OUT, FILES.news), newsItalic: join(OUT, FILES.newsItalic),
  plex400: join(OUT, FILES.plex400), plex500: join(OUT, FILES.plex500),
  arial: LIB + 'LiberationSans-Regular.ttf', times: LIB + 'LiberationSerif-Regular.ttf', timesItalic: LIB + 'LiberationSerif-Italic.ttf',
  courier: LIB + 'LiberationMono-Regular.ttf',
}), SAMPLE]).toString())

const pct = (x) => `${(x * 100).toFixed(2)}%`
function fallback(name, font, fb, locals, extra = '') {
  const sa = m[font].avg / m[fb].avg
  const f = m[font]
  return `@font-face{font-family:'${name}';src:${locals.map((l) => `local('${l}')`).join(',')};size-adjust:${pct(sa)};` +
    `ascent-override:${pct(f.asc / f.upm / sa)};descent-override:${pct(Math.abs(f.desc) / f.upm / sa)};line-gap-override:${pct(f.gap / f.upm / sa)}${extra}}`
}
const face = (fam, file, weight, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url({{asset:../fonts/${file}}}) format('woff2');font-weight:${weight};font-style:${style};font-display:swap}`

const css = [
  '/* GENERATED by tools/fonts.mjs: self-hosted faces + metric-matched fallbacks (SYSTEM-C §1.2). Do not edit. */',
  face('Archivo C', FILES.archivo, 620),
  face('Newsreader C', FILES.news, 420),
  face('Newsreader C', FILES.newsItalic, 420, 'italic'),
  face('Plex Mono C', FILES.plex400, 400),
  face('Plex Mono C', FILES.plex500, 500),
  fallback('Archivo C fb', 'archivo', 'arial', ['Arial', 'Liberation Sans']),
  fallback('Newsreader C fb', 'news', 'times', ['Times New Roman', 'Liberation Serif']),
  fallback('Newsreader C fb', 'newsItalic', 'timesItalic', ['Times New Roman Italic', 'Liberation Serif Italic'], ';font-style:italic'),
  fallback('Plex Mono C fb', 'plex400', 'courier', ['Courier New', 'Liberation Mono']),
].join('\n') + '\n'
writeFileSync(join(C, 'shell/fonts.css'), css)

// 3. glyph sets (code points) per face, for tools/lint.mjs
const glyphs = {
  _note: 'GENERATED by tools/fonts.mjs (fontTools getBestCmap). Families as used in CSS: display = Archivo C, serif = Newsreader C, mono = Plex Mono C.',
  display: m.archivo.cmap, serif: m.news.cmap, serifItalic: m.newsItalic.cmap, mono: m.plex400.cmap, mono500: m.plex500.cmap,
}
writeFileSync(join(C, 'tools/glyphs.json'), JSON.stringify(glyphs) + '\n')

const kb = (f) => (statSync(join(OUT, f)).size / 1024).toFixed(1)
const total = Object.values(FILES).reduce((s, f) => s + statSync(join(OUT, f)).size, 0)
console.log(Object.entries(FILES).map(([k, f]) => `${f.padEnd(40)} ${kb(f)} KB`).join('\n'))
console.log(`total ${(total / 1024).toFixed(1)} KB · first screen (archivo + news + plex 400 + 500) ${((total - statSync(join(OUT, FILES.newsItalic)).size) / 1024).toFixed(1)} KB`)
console.log('plex 400 copied byte-for-byte:', readFileSync(join(OUT, FILES.plex400)).equals(readFileSync(SRC.plex400)))
