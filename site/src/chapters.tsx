import type { ReactNode } from "react"

export type SpecRow = [label: string, value: ReactNode]

export type Plate = {
  src: string
  alt: string
  fig: string
  caption: string
}

export type Chapter = {
  id: string
  num: string
  /** Left side of the label row, after the number. */
  org: string
  /** Right side of the label row: role, place, dates. */
  meta: string
  /** Short label for the rail and the menu. */
  label: string
  /** Year or range shown in the rail. */
  year: string
  headline: string
  body: ReactNode[]
  specs: SpecRow[]
  plate?: Plate
  /** Rendered after the specs, before the plate. */
  extra?: ReactNode
  /** Mark the chapter as the side project, not employment. */
  project?: boolean
}

export type FoundationEntry = {
  id: string
  title: string
  meta: string
  body: ReactNode
}

export const FOUNDATION_ENTRIES: FoundationEntry[] = [
  {
    id: "path-0",
    title: "CompMedic, LLC · IT Technical Support",
    meta: "Hollywood, FL · Sep 2008 – Jul 2015",
    body: "Paid for my first degrees by fixing computers. Learned to model a system before touching it, test the cheapest hypothesis first, and explain a failure to someone who does not want a technical explanation.",
  },
  {
    id: "path-1",
    title: "Miami Dade College · A.A., Certificate, A.S., B.S. Biological Sciences (Biotechnology)",
    meta: "Miami, FL · 2009–2015 · Highest Honors, upper-division GPA 4.0",
    body: (
      <>
        Stacked the credentials on purpose, choosing the biotechnology track each time to stay at the bench. Two summers set the direction: drug pedigree records and compliance audits at PharmaMed, where I learned that undocumented work did not happen, and chloroplast DNA isolation and amplification for an{" "}
        <em>rbcL</em> study of the golden cane palm.
      </>
    ),
  },
  {
    id: "path-2",
    title: "Advanced Environmental Laboratories · Senior Analyst, Inorganic Chemistry & Microbiology",
    meta: "Miramar, FL · Aug 2015 – Apr 2018",
    body: "Chose a commercial lab for the longest method list under one roof: anions by ion chromatography in water and soil, hexavalent chromium, solids and residue, oxygen demand, and the full coliform suite. Client data gets audited, so I learned to write a result I could defend a year later. Senior analyst over three people across wet chemistry and microbiology.",
  },
  {
    id: "path-3",
    title: "University of Florida · M.S. Microbiology & Cell Science",
    meta: "Gainesville, FL · 2018 · Medical Microbiology & Biochemistry · GPA 3.90",
    body: "Completed while working full time. I was already doing analytical chemistry daily and wanted the microbiology to match it. Fluency in both is why I have been able to move between water chemistry, pharmaceutical QC, and metal finishing without starting over.",
  },
]

const media = (file: string) => `${import.meta.env.BASE_URL}media/${file}`

export const CHAPTERS: Chapter[] = [
  {
    id: "path-foundation",
    num: "01",
    org: "Foundation",
    meta: "Hollywood · Miami · Miramar · Gainesville · 2008–2018",
    label: "Foundation",
    year: "2008–2018",
    headline: "The first decade was foundation.",
    body: [
      "IT support that paid for school, stacked biotech credentials at Miami Dade, a commercial lab with the longest method list under one roof, and a UF master's completed while working. Those years taught systems thinking, bench discipline, and the habit of writing a result that could be defended a year later.",
    ],
    specs: [
      ["Roles", "IT technical support, CompMedic (2008–2015). Senior analyst, inorganic chemistry and microbiology, Advanced Environmental Laboratories (2015–2018)."],
      ["Degrees", "A.A., A.S., B.S. Biological Sciences (Biotechnology), Miami Dade College, 2015. M.S. Microbiology & Cell Science, University of Florida, 2018."],
      ["Team", "Three analysts across wet chemistry and microbiology at AEL"],
      ["Methods", "Anions by ion chromatography (EPA 300.0, EPA 9056), hexavalent chromium (SM 3500-Cr D), solids and residue (SM 2540, EPA 160.x), BOD and CBOD (SM 5210 B), coliforms by membrane filtration, multiple-tube fermentation and enzyme substrate (SM 9221, 9222, 9223), heterotrophic plate count (SM 9215 B)"],
      ["Research", <>Chloroplast DNA isolation and amplification, <em>rbcL</em> sequence study, Miami Dade College, 2015</>],
    ],
    plate: {
      src: media("obj-cyber.jpg"),
      alt: "Rack server, studio render",
      fig: "Fig. 01",
      caption: "Systems first, 2008–2015",
    },
  },
  {
    id: "path-4",
    num: "02",
    org: "City of Boca Raton",
    meta: "Lead Wastewater Analyst · Boca Raton, FL · Apr 2018 – Dec 2024",
    label: "City of Boca Raton",
    year: "2018–2024",
    headline: "Results acted on the same shift.",
    body: [
      "Left contract work for a utility because I wanted results acted on the same shift rather than mailed out. Ran the plant's nutrient, solids, oxygen demand, and physical methods and led two analysts. Owned calibration, troubleshooting, reagent preparation, LIMS review, chain of custody, and inventory.",
    ],
    specs: [
      ["Role", "Quality Control Analyst I, Lead Wastewater Analyst"],
      ["Site", "Municipal wastewater treatment plant laboratory"],
      ["Team", "Two analysts, work review and scheduling"],
      ["Methods", <>EPA 300.0 (anions by IC), SM 5210 B (CBOD), SM 2540 C and D (TDS, TSS), SM 4500-H<sup>+</sup> B (pH), SM 4500-NH<sub>3</sub> G (ammonia), SM 4500-N<sub>org</sub> D (TKN), SM 4500-P F (total phosphorus), SM 2320 B (alkalinity), SM 2510 B (conductivity)</>],
      ["Systems", "LIMS entry and review, chain of custody, instrument calibration and troubleshooting, reagent preparation, supply inventory"],
    ],
    plate: {
      src: media("obj-chemistry.jpg"),
      alt: "Round-bottom flask and molecule, studio render",
      fig: "Fig. 02",
      caption: "Wet chemistry at plant volume",
    },
  },
  {
    id: "path-5",
    num: "03",
    org: "Aveva Drug Delivery Systems",
    meta: "QC Microbiologist II · Tamarac, FL · Jan – Apr 2025",
    label: "Aveva Drug Delivery Systems",
    year: "2025",
    headline: "Quality at its strictest.",
    body: [
      "Moved into cGMP manufacturing to learn quality at its strictest. Kinetic chromogenic endotoxin testing on purified water, WFI, and pure steam; point-of-use sampling inside cleanrooms; VITEK 2 identification; a facility-wide disinfectant efficacy study carried from execution through co-authored report. Validation is the discipline I took with me.",
    ],
    specs: [
      ["Role", "QC Microbiologist II"],
      ["System", "cGMP, sterile pharmaceutical manufacturing"],
      ["Methods", <>USP {"<85>"} kinetic chromogenic bacterial endotoxins (PW, WFI, pure steam), USP {"<1231>"} point-of-use water sampling including cleanrooms, USP {"<1113>"} microbial identification by VITEK 2</>],
      ["Study", "Facility-wide disinfectant efficacy study per USP guidance, against microbes of interest and environmental isolates, execution through co-authored final report"],
    ],
    plate: {
      src: media("obj-microbiology.jpg"),
      alt: "Compound microscope, studio render",
      fig: "Fig. 03",
      caption: "Microbiology, sterile manufacturing",
    },
  },
  {
    id: "path-6",
    num: "04",
    org: "South Florida Water Management District",
    meta: "Chemist II · West Palm Beach, FL · Apr – Oct 2025",
    label: "South Florida Water Management District",
    year: "2025",
    headline: "When the queue never empties.",
    body: [
      "Scale and automation: over 1,000 samples a month, total nitrogen by flow injection, automated color by UV-Vis, total organic carbon. When the queue never empties, only process discipline protects the data.",
    ],
    specs: [
      ["Role", "Chemist II"],
      ["Throughput", "Over 1,000 samples a month"],
      ["Methods", "SM 4500-N C-2011 (total nitrogen, flow injection analyzer), SM 2120 C (automated color, Shimadzu UV-Vis), SM 5310 B (total organic carbon)"],
      ["Discipline", "SOP-governed preparation and analysis, instrument queues that run every day"],
    ],
  },
  {
    id: "path-7",
    num: "05",
    org: "Collins Aerospace",
    meta: "Chemical Process Laboratory · Landing Systems · Opa-Locka, FL · 2026",
    label: "Collins Aerospace · Chemical Process Laboratory",
    year: "2026",
    headline: "The deliberate turn.",
    body: [
      "Everywhere else the solution in front of me was the sample. Here it is the tool: a bath whose concentration decides whether a landing gear component is airworthy. Tested process solutions against specification and control schedule, trended critical parameters, and evaluated trivalent chromium and iron after dummying. Owned the TrueChem record, calibration and standards, and controlled documents. Supported Nadcap, customer, and internal audits. Held stop-work authority on specification violations, and used it.",
    ],
    specs: [
      ["Scope", "Chemical analysis of process solutions to the solution control schedule and after every correction, evaluated against applicable specification criteria"],
      ["Control", "Statistical process control, critical-parameter trending against shop limits, chemical make-up sheets as concentrations approach process limits, monthly process control (MPC)"],
      ["Record", "TrueChem: solution testing, reagent expiry and stock, calibration status, external test results"],
      ["Documents", "Procedures, work instructions and reports written to OEM specification; equipment manuals, specifications and training documents reviewed and optimized"],
      ["Interfaces", "Plating specialist, plating shop, EH&S, purchasing, internal and external auditors, contract laboratories"],
      ["Audits", "Nadcap, customer, and internal"],
      ["Authority", "Stop-work on specification violations"],
    ],
  },
  {
    id: "path-8",
    num: "06",
    org: "Collins Aerospace",
    meta: "Senior Engineer, M&PT · Landing Systems · Opa-Locka, FL · 2026 – present",
    label: "Collins Aerospace · Senior Engineer, Materials & Process Technologies",
    year: "2026–",
    headline: "The same work, one level up.",
    body: [
      "I own the process rather than measure it from outside. Laboratory and process-control testing for chemical processing and surface engineering, including corrosion resistance, water break, paint and bend adhesion, hydrogen embrittlement, heat resistance, microhardness, and porosity on conversion coating, passivation, cadmium, sulfamate nickel, and chrome. Troubleshooting and corrective action across production, overhaul, and repair. Review and approval of new materials, chemicals, technique sheets, and work instructions. Owner of the brush plating work instructions, RRCA team member, site focal for Nadcap special process audits, certified trainer for shot peen.",
    ],
    specs: [
      ["Scope", "Chemical processing and surface engineering, Landing Systems MRO: production, overhaul, and repair"],
      ["Tests", "Corrosion resistance, water break, paint adhesion, bend adhesion, hydrogen embrittlement, heat resistance, microhardness, porosity"],
      ["Processes", "Chemical conversion coating, passivation, cadmium, sulfamate nickel, chrome, brush plating, shot peen"],
      ["Ownership", "Brush plating work instructions. Review and approval of new materials, chemicals, technique sheets, and work instructions"],
      ["Quality", "RRCA team member. Site focal for Nadcap special process audits. Certified shot peen trainer"],
    ],
    plate: {
      src: media("obj-aerospace.jpg"),
      alt: "Main landing gear assembly, studio render",
      fig: "Fig. 06",
      caption: "Main gear, the part that has to land",
    },
  },
  {
    id: "path-line",
    num: "07",
    org: "The line through it",
    meta: "2008 – present",
    label: "The line through it",
    year: "",
    headline: "Run the method, own the method, own the process the method protects.",
    body: [
      "Environmental work taught volume and defensibility. Pharmaceutical work taught validation. Aerospace asks for both and adds a consequence I like: the part I sign off on has to land.",
    ],
    specs: [],
  },
  {
    id: "immutableqc",
    num: "08",
    org: "ImmutableQC",
    meta: "Side project · Open alpha v0.1 · immutableqc.com",
    label: "ImmutableQC",
    year: "Now",
    headline: "What I am building.",
    project: true,
    body: [
      "Every lab I have worked in kept its audit trail in a system the same people could edit. ImmutableQC signs each record at the instrument and chains it to the one before it. A correction is a new record that points at the original. Nothing is overwritten, and the chain notices when a value changes.",
      "It grew out of the same discipline as the rest of this page: chain of custody, cGMP validation, Nadcap audits. The evidence should be mathematical, not paperwork.",
    ],
    specs: [
      ["Status", "Open alpha, v0.1"],
      ["Records", "Injection time, peak retention, height and area, report hash, amendments, each signed and chained to the previous record"],
      ["Alignment", "Cryptographic evidence aligned with 21 CFR Part 11 and ISO 17025. A complement to validation, not a substitute for it"],
      ["Live", "Signing and ledger, public registry. Instrument capture in progress"],
      ["Link", <a key="iqc" href="https://immutableqc.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-60 transition-opacity">immutableqc.com</a>],
    ],
  },
]

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id)
