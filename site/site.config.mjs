// Site configuration (DS lead). Chapter ORDER and site strings only: everything about a chapter lives in its
// own chapters/NN-slug/chapter.json, and the locator, index dialog, contents list and dev pages are generated
// from those files, so no team edits the shell to add itself.

export const chapters = ['01-engineering', '02-chemistry', '03-microbiology', '04-environmental', '05-it', '06-data-integrity']

// Immutable QC launch gate (SPEC-C §15), recorded as it stands today (2026-10-06). The build picks the one
// blockchain sentence (§9.3) and the IQC links from this record.
export const iqcGate = { G1: false, G2: false, G3: false, G4: false, G5: false, G6a: true, G6b: false, G7: null }

// CLIENT CORRECTIONS 2026-10-06 (BRIEF-C items 5, 7, 8) override SPEC-C §9.3: the single "tokeniz" on the site is the
// tagline "Tokenized lab data." (data/facts.json iqc.tagline, the IQC block's title line), and the sentence after it
// carries the single "blockchain" and no "tokeniz". The client's wording ships as S3 (design-intent family), which is
// also what the gate record above selects (G7 open), so no override is needed.
export const iqcSentenceOverride = null

// Reviewer / audit notes behind the Immutable QC copy. BUILD-ONLY: this file is never bundled (data/facts.json is,
// through main.js, so nothing editorial lives there). data/facts.assert.mjs checks the copy against these.
export const iqcNotes = {
  source: 'client corrections 2026-10-06 (BRIEF-C items 3-8)',
  customers: 0, // item 3: nothing may imply customers, deployments, pilots or production use
  records: ['signed', 'hash-chained'], // item 4
  anchorToday: 'public test network, unnamed on the page', // item 8
  filecoin: 'roadmap only', // item 8
  offPage: 'the separate ERC-20 and any wallet, staking or trading talk are not part of the product; never mentioned', // item 4
}

export const iqcSentences = {
  S0: "Each result is signed when it's recorded, chained to the one before it, and anchored to a public blockchain, so anyone can check whether it has changed.",
  S1: 'In the open alpha, readings imported from instrument files are signed, chained to the ones before them, and anchored to a public blockchain, so a changed value shows.',
  S2: 'In the open alpha, readings imported from instrument files are hash-linked and anchored to a public blockchain.',
  S3: "Each result is signed when it's recorded, linked to the one before it, and anchored to a public blockchain, so anyone can check it hasn't changed.",
}

// §15 sentence selection: S0 if G1–G4 and G7 pass; else S1 if only G1 is open; else S2 if G7 passes; else S3.
export function selectIqcSentence(g = iqcGate) {
  const p = (k) => g[k] === true
  if (p('G1') && p('G2') && p('G3') && p('G4') && p('G7')) return 'S0'
  if (!p('G1') && p('G2') && p('G3') && p('G4') && p('G7')) return 'S1'
  if (p('G7')) return 'S2'
  return 'S3'
}

export const site = {
  name: 'José A. Fernández Abreu',
  role: 'Materials & Process Engineer',
  place: 'South Florida',
  email: 'jose@joseqc.com',
  linkedin: 'https://www.linkedin.com/in/jf42',
  github: 'https://github.com/fabreu08', // most active
  github2: 'https://github.com/neodimiun', // hosts this site
  iqcUrl: 'https://immutableqc.com',
  iqcCode: null, // Q10: the repository link; also needs gate G6b
  title: 'José A. Fernández Abreu · Materials & Process Engineer',
  description: 'José A. Fernández Abreu, materials and process engineer for aerospace special processes, with a career across water chemistry, pharmaceutical microbiology, environmental testing and IT.',
  now: { label: 'Now', date: 'Oct 2026', role: 'Senior Engineer, Materials & Process Technologies', org: 'Collins Aerospace' },
  year: '2026',
  origin: 'https://joseqc.com',
  // root-absolute path of the home page: the 404 page (served at any depth) links and loads its assets from here.
  // Production (https://joseqc.com/) is served from the domain root.
  base: '/',
}
