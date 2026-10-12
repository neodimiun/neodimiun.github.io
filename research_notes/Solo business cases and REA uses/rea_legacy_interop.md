# Non-security solo businesses built on REA (Reverse Engineer Anything): legacy recovery, interoperability, right-to-repair, preservation (as of Oct 2026)

Research date: 2026-10-12. Scope: US/EU. Method: read the local REA clone (`/home/user/morluto/rea`, package `rea-agents` v6.4.0, CHANGELOG dated 2026-10-11) plus web searches.

**Source-access caveat for the report writer:** this session's egress proxy blocked direct fetches of copyright.gov, federalregister.gov, eur-lex.europa.eu, law.cornell.edu and most other sites. Every web finding below therefore comes from search-engine result summaries, not from full-page reads. Primary legal texts (17 U.S.C. §1201(f), Directive 2009/24/EC Arts. 5/6/8, the 2024 §1201 final rule) **were not read verbatim**. Where a point relies on general legal knowledge rather than a retrieved source, it is placed under Inferences or Gaps and marked "verify".

---

## Q1. What can REA actually do that matters for non-security businesses, and what are its limits?

### Takeaway
REA is a fast-moving, MIT-licensed MCP server and CLI that gives a coding agent evidence-backed access to native binaries (through Ghidra, Hopper or IDA), .NET CIL, JavaScript/Electron, HAR captures, SQLite, firmware, packet/USB captures, logic-analyzer recordings and 16-bit DOS executables. That covers most of the "understand what the old thing does" phase of legacy, interop and repair work. It has real gaps for exactly the Windows-era SMB software that legacy work targets: 16-bit Windows NE is unsupported, Windows support is "experimental", it has no VB6- or Delphi-specific tooling, SQLite is its only database format, and process capture does not run on native Windows. It is also only about three months old.

### Cited Findings
- REA describes itself as "One MCP for reverse engineering across binaries, applications, and runtime behavior". Its pitch is "See a feature in an app that you want in your own product? Ask your agent to investigate it with REA… explain how the feature works, show the evidence, and build a version for your project." Analysis runs locally. Setup supports Claude Code, Codex, Cursor, Gemini CLI, Grok Build and others. — [REA README](https://github.com/morluto/rea/blob/main/README.md)
- **Capability table (README):** native binaries (pseudocode, assembly, strings, symbols, calls; needs Hopper, Ghidra or IDA); Go binaries (build metadata); SQLite databases ("Tables, columns, indexes, views, triggers and selected ordinary-table rows"); JavaScript/Electron (modules, IPC, source maps); websites (Chrome-family browser); saved network captures (HAR, mitmproxy); .NET assemblies ("Metadata, CIL instructions, declared native dependencies and build comparisons", static only); Android APKs (JADX); Android devices (adb); firmware (Binwalk/Unblob on Linux); recorded packets (TShark 4.x, Linux); recorded logic signals (sigrok-cli, Linux); process behavior (Linux/macOS PTY). — [REA README](https://github.com/morluto/rea/blob/main/README.md)
- **.NET is CIL-level, not C#-level.** REA "inspects .NET PE/CLI artifacts without loading or executing their code". It ships seven tools, including `import_managed_reconstruction`, which imports decompiled code against verified member identities and can use ILSpy as an optional oracle (`REA_ILSPY_CMD_PATH`). It "does not unpack .NET single-file hosts, decode IL2CPP metadata, or infer a NativeAOT identity". — [managed-code-analysis.md](https://github.com/morluto/rea/blob/main/docs/managed-code-analysis.md)
- **DOS:** Ghidra 12.1.x supports DOS MZ and COM targets with 16-bit real-mode decompilation. "PE remains PE; NE, LE, and LX declarations are explicitly unsupported", so 16-bit Windows 3.x (NE) programs and DOS-extender (LE/LX) programs are out of scope. — [ghidra-dos.md](https://github.com/morluto/rea/blob/main/docs/ghidra-dos.md)
- **Windows host support is "experimental".** It covers Windows 10+ x64 with Ghidra 12.1.x for "the 25 read-only Ghidra inventory, memory, and function-analysis operations". Native x86 (32-bit) PE support is on repo main; npm releases through 5.0.0 admitted only x86-64 PE on Windows. "This boundary does not establish general Windows feature parity." — [windows-ghidra-p0.md](https://github.com/morluto/rea/blob/main/docs/windows-ghidra-p0.md)
- **Process capture** is Linux/macOS only: "Native Windows capture is unavailable." — [process-capture.md](https://github.com/morluto/rea/blob/main/docs/process-capture.md)
- **SQLite inspection** works on a quiescent local snapshot. It needs Node 24.15+ or 26+ and returns schema plus selected rows. — [sqlite-databases.md](https://github.com/morluto/rea/blob/main/docs/sqlite-databases.md)
- **Firmware:** Binwalk 3.1.x for region inspection and Unblob 26.6.x for extraction, verified on Linux x64. "No device, root privilege, mount, emulation or execution of extracted programs is needed." Extracted ELFs hand off to Ghidra. — [firmware-analysis.md](https://github.com/morluto/rea/blob/main/docs/firmware-analysis.md)
- **Packet captures** can be "Network, USB or Bluetooth recordings" through TShark, with no live acquisition. — [packet-captures.md](https://github.com/morluto/rea/blob/main/docs/packet-captures.md). **Logic-signal decoding** handles e.g. UART at 9600 baud from existing VCD recordings, Linux only. — [signal-recordings.md](https://github.com/morluto/rea/blob/main/docs/signal-recordings.md)
- **Verification discipline:** `build_reconstruction_obligation_ledger` turns evidence into reconstruction claims. A claim closes only with "a passing verifier whose authority is comparable to the original observation". — [reconstruction-obligation-ledgers.md](https://github.com/morluto/rea/blob/main/docs/reconstruction-obligation-ledgers.md)
- **Showcases:** DX-Ball sound-pan reconstruction "passes 3,205 original-x86 cases and reproduces all 63 compiled function bytes". The TH04 (PC-98) bullet-ring calculation was recovered from 16-bit instructions and compared against historical compiler output. — [REA README](https://github.com/morluto/rea/blob/main/README.md)
- **Project policy (DISCLAIMER):** lawful uses listed include "interoperability, software preservation, and debugging or auditing software you own or are authorized to examine". The project "will not help with… circumventing DRM, license checks… copying proprietary software or reproducing its protected code and assets". "Obtaining source-like output… does not grant rights to the original program." IDA/Hopper/JEB must be legally obtained, and an open-source bridge "does not grant additional… automation, hosting, or output-sharing rights". — [DISCLAIMER.md](https://github.com/morluto/rea/blob/main/DISCLAIMER.md)
- **Maturity:** the CHANGELOG has 35 releases, from 0.2.0 (2026-07-12) to 6.4.0 (2026-10-11), in about three months. — [CHANGELOG.md](https://github.com/morluto/rea/blob/main/CHANGELOG.md)

### Inferences
- REA's value to a solo operator is **evidence-backed agent automation** of tools that already exist (Ghidra, ILSpy, JADX, Binwalk, TShark, sigrok). It does not add new decompilation power. The productivity gain comes from the agent driving these tools and writing tests against observed behavior.
- For **.NET legacy apps**, free decompilers such as ILSpy already produce near-source C#, so REA's marginal value is orchestration plus verification. For **native Win32 (VB6 native-compiled, Delphi, C/C++)** and **DOS** binaries, the marginal value is larger. A grep of REA's docs found no mention of VB6 or Delphi, so VB6 P-code apps and Delphi form/RTTI recovery likely need extra third-party tools. Verify per target.
- Legacy vertical software often stores data in Paradox, dBase, Btrieve/Pervasive, Access, Firebird or SQL Anywhere (general knowledge, unsourced here; verify). REA inspects only SQLite natively, so data-format work on other engines needs the binary-analysis route or external drivers.
- Many REA capabilities (firmware, TShark, sigrok, process capture) are Linux-first. A solo operator should run a Linux workstation plus a Windows VM.
- Thirty-five releases in about three months means rapid improvement but also API churn. Client-facing deliverables should not depend on any specific REA version, and training content will go stale quickly.

### Gaps
- No public benchmark measures how much REA (as opposed to agents plus Ghidra in general) cuts hours on real legacy-recovery jobs. The showcases are function-level, not application-level.
- REA's rea.tools guides and showcases site was not fetched (egress blocked). Only the repo copy was read.

---

## Q2. What is the legal framework (US/EU) for these businesses, and where is the risk?

### Takeaway
Reverse engineering **software the customer lawfully owns or licenses, to get the customer's own data out, interoperate, fix errors or repair hardware** has solid footing:
- US: fair use for intermediate copying (Sega, Connectix), §1201(f) for interoperability, DTSA treats reverse engineering as a "proper means", and the §1201 repair and preservation exemptions run through Oct 2027.
- EU: Software Directive Arts. 5 and 6 (with Top System 2021 allowing decompilation to fix errors), the Trade Secrets Directive Art. 3, and Data Act portability.

The biggest practical risks are:
- US contract law: EULA anti-reverse-engineering clauses are enforceable in the US (Bowers, Davidson v. Jung, SAS v. WPL 4th Cir.).
- Circumventing technical protection measures (TPMs) or distributing circumvention tools, which is outside the exemptions.
- Using reverse-engineered output to build competing products. EU Art. 6(2)(c) bars this (verify text), as does Data Act Art. 4(10).
- Accessing third-party hosted systems without authorization (CFAA/ToS).

### Cited Findings
**US — copyright / fair use**
- *Sony v. Connectix* (9th Cir. 2000): "The intermediate copies made and used by Connectix during the course of its reverse engineering of the Sony BIOS were protected fair use". It relied on *Sega v. Accolade* (9th Cir. 1992), under which disassembly is fair use where it is the only way to reach functional elements and there is a legitimate reason. — [Copyright Office fair-use summary](https://www.copyright.gov/fair-use/summaries/sony-connectix-9thcir2000.pdf); [203 F.3d 596](https://law.resource.org/pub/us/case/reporter/F3/203/203.F3d.596.99-15852.html); [BC IPTF](https://sites.bc.edu/iptf/2001/11/01/does-intermediate-copying-of-computer-software-for-the-purpose-of-reverse-engineering-a-non-infringing-product-infringe-the-copyright-in-the-software/)
- The Connectix court gave the commercial-use factor "very little weight" in cases of "intermediate infringement" where "the final product does not itself contain infringing material". — [Copyright Office summary](https://www.copyright.gov/fair-use/summaries/sony-connectix-9thcir2000.pdf)

**US — contracts override (the main US risk)**
- *Bowers v. Baystate* (Fed. Cir. 2003; cited as 320 F.3d 1317, though sources are inconsistent on the cite) held that a shrinkwrap "no reverse engineering" clause was breached and was **not preempted** by the Copyright Act. Its precedential reach is limited to the Federal Circuit. The 5th Circuit's *Alcatel v. DGI* earlier treated a reverse-engineering restriction as copyright misuse. — [SMU Computer Law Review](https://scholar.smu.edu/comtech/vol8/iss3/7); [Wikipedia](https://en.wikipedia.org/wiki/Bowers_v._Baystate_Technologies,_Inc.)
- *Davidson & Associates v. Jung* (8th Cir. 2005, 422 F.3d 630; the bnetd Battle.net emulator case): the court held defendants violated §1201(a)(1) and (a)(2), and rejected the §1201(f) interoperability defense **because the defendants had infringed Blizzard's copyright**. EULA/TOU anti-reverse-engineering breach claims were not preempted. — [422 F.3d 630](https://law.resource.org/pub/us/case/reporter/F3/422/422.F3d.630.04-3654.html); [Studicata brief](https://studicata.com/case-briefs/case/davidson-associates-v-jung)
- *SAS Institute v. World Programming* (4th Cir. 2017): a US court let SAS pursue license-breach claims on reverse engineering "despite a U.K. court's ruling that E.U. law barred the claim". — [Holland & Knight](https://hklaw.com/en/insights/publications/2018/01/reverse-engineering-source-code-of-software-is-not)

**US — DMCA §1201 triennial exemptions (status Oct 2026)**
- The 2024 (ninth) final rule was published Oct 2024, and its exemptions "remain in effect… until October 28, 2027". In the ninth cycle the Office received 11 petitions for new or expanded exemptions and 37 renewal petitions. — [Copyright Office NewsNet 1057](https://www.copyright.gov/newsnet/2024/1057.html); [Finnegan](https://www.finnegan.com/en/insights/ip-updates/final-rule-issued-in-the-us-copyright-offices-ninth-triennial-section-1201-proceeding.html)
- The **tenth (2027) cycle** began with a notice of inquiry on June 9, 2026. New and renewal petitions were due Aug 24, 2026, and comments on renewals were due Sept 28, 2026. Renewed exemptions would run Oct 2027 to Oct 2030. At an early stage "a short, plain statement of the activities is sufficient". — [Copyright Office 2027 cycle page](https://www.copyright.gov/1201/2027/); [GovDelivery announcement](https://content.govdelivery.com/accounts/USLOCCOPYRIGHT/bulletins/35be9b1); [regulations.gov COLC-2026-0100](https://www.regulations.gov/document/COLC-2026-0100-0001); [24x7 Magazine](https://24x7mag.com/standards/servicing-legislation/right-to-repair/us-copyright-office-opens-petitions-dmca-exemptions/)
- **2027-cycle renewal petitions observed on copyright.gov:**
  - device repair (iFixit)
  - vehicle repair (SEMA)
  - medical devices (Crothall Facilities Management; Caylor Equipment Services)
  - preservation of computer programs (Library Copyright Alliance)
  - "Computer Programs – Investigating Potential Infringement" (Software Freedom Conservancy)
  - text and data mining, assistive technologies, and others

  — [iFixit](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Device-Repair-iFixit.pdf); [SEMA](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Vehicle-Repair-SEMA.pdf); [Crothall](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Medical-Devices-Crothall-Facilities-Management.pdf); [Caylor](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Medical-Devices-Caylor-Equipment-Services-LLC.pdf); [LCA – Computer Programs](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Preservation-Library-Copyright-Alliance-Computer-Programs.pdf); [SFC](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Comp-Programs-Investigating-Potential-Infringement-Software-Freedom-Conservancy.pdf)
- A medical-device renewal petition stresses that "access to software-generated error logs and diagnostic data is often critical to accurately diagnosing equipment failures". — [Caylor/Crothall renewal petitions](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Medical-Devices-Caylor-Equipment-Services-LLC.pdf)
- **Current exemption classes listed in the 2027 renewal form** include:
  - computer programs controlling retail-level commercial food preparation equipment, "for purposes of diagnosis, maintenance, or repair"
  - video games "for which outside server support has been discontinued", for individual play and for preservation by libraries, archives and museums, including console jailbreaking for preservation only
  - discontinued video games that never required server support, for preservation by libraries, archives and museums
  - preservation of computer programs by libraries, archives and museums, with off-premises access added in 2021 per the LCA petition

  — [2027 renewal petition form](https://www.copyright.gov/1201/2027/renewal-petition.pdf); [LCA petition](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Preservation-Library-Copyright-Alliance-Computer-Programs.pdf)
- EFF won exemptions in an earlier cycle for "tinkering with Echos and repairing appliances". It and iFixit/Public Knowledge have sought repair exemptions covering "all software-enabled devices" and commercial/industrial equipment. — [EFF press release](https://www.eff.org/press/releases/eff-wins-dmca-exemption-petitions-tinkering-echos-and-repairing-appliances-new); [24x7 Magazine](https://24x7mag.com/standards/servicing-legislation/right-to-repair/us-copyright-office-opens-petitions-dmca-exemptions/)

**US — trade secrets and computer-access law**
- DTSA (18 U.S.C. §1839) expressly excludes "reverse engineering, independent derivation, or any other lawful means of acquisition" from "improper means". State law generally follows the same model. — [Sierra IP Law](https://sierraiplaw.com/reverse-engineering/); [Crowell trade secrets blog](https://www.crowelltradesecretstrends.com/?p=3082)
- CFAA after *Van Buren* (2021) is read as a "gates-up-or-down" test: liability turns on intrusion into a protected system, not ToS violations. *hiQ v. LinkedIn* ended in a stipulated permanent injunction barring hiQ's scraping, while the Ninth Circuit's pro-scraping CFAA rulings on public data stand. In *Meta v. Bright Data* (N.D. Cal., Jan 23, 2024) the court granted summary judgment for Bright Data. — [Farella Braun + Martel](https://www.fbm.com/alex-reese/publications/what-recent-rulings-in-hiq-v-linkedin-and-other-cases-say-about-the-legality-of-data-scraping/); [Fenwick](https://www.fenwick.com/insights/publications/hiq-labs-scrapes-by-again-the-ninth-circuit-reaffirms-that-data-scraping-does-not-violate-the-cfaa-1)

**EU — Software Directive 2009/24/EC and CJEU**
- *Top System v. Belgian State* (CJEU C-13/20, 6 Oct 2021): a lawful acquirer may **decompile to correct errors** under Art. 5(1) "and is not required to satisfy the requirements laid down in Article 6". The decompilation must go only as far as the correction needs, "in compliance, where appropriate, with the conditions laid down in the contract". The contract cannot bar error correction outright but can regulate how it is done. The provisions are substantively identical in 2009/24/EC. — [SCL](https://www.scl.org/12394-court-of-justice-rules-that-software-buyers-can-decompile-programs-to-correct-errors/); [Cuatrecasas](https://www.cuatrecasas.com/en/global/art/decompilation-of-software-for-error-correction-cjeu-judgment-in-top-system); [IPPT judgment copy](https://www.ippt.eu/sites/ippt/files/2021/IPPT20211006_CJEU_Top_System.pdf)
- The UK SAS v. WPL proceedings were referred to the CJEU on whether functionality, programming languages and data formats are protectable. The 2012 CJEU answer (C-406/10, functionality not protected) and the Art. 6 / Art. 8 text were **not retrieved** in this session. — [SMU / search summary](https://scholar.smu.edu/comtech/vol8/iss3/7)

**EU — Trade Secrets Directive 2016/943**
- Art. 3(1)(b): acquisition by reverse engineering is lawful where the product was made public or is lawfully held by an acquirer "free from any legally valid duty to limit the acquisition". Contractual bans are permitted. One (2016, draft-era) source notes Germany may treat reverse engineering requiring "substantial investments" as illegal in some cases. — [SCL](https://www.scl.org/3315-eu-trade-secrets-directive-be-aware-be-very-aware/); [European Papers](https://www.europeanpapers.eu/europeanforum/trade-secrets-directive-international-legal-framework); [Mondaq (2016, draft-era)](https://webiis08.mondaq.com/germany/trade-secrets/468420/the-new-european-directive-on-the-protection-of-trade-secrets)

**EU — Data Act (Regulation 2023/2854)**
- The Data Act has applied since 12 Sept 2025. The Art. 3(1) "access by design" duty applies only to connected products **placed on the market after 12 Sept 2026**. It covers home appliances, thermostats, wearables, connected vehicles, and "industrial and agricultural machinery". Data must be accessible "easily, securely, free of charge, in a comprehensive, structured, commonly used and machine-readable format". — [Bird & Bird (2026)](https://cm.twobirds.com/en/insights/2026/the-eu-data-act-where-things-stand-now); [Matheson](https://www.matheson.com/insights/the-data-act-access-by-design-requirement-comes-into-force/); [McCann FitzGerald](https://www.mccannfitzgerald.com/knowledge/data-privacy-and-cyber-risk/data-act-developments-2026-and-beyond)
- Cloud/data-processing-service switching charges must be fully eliminated by **12 Jan 2027** (Art. 29). — [Data Act search summary / McCann FitzGerald](https://www.mccannfitzgerald.com/knowledge/data-privacy-and-cyber-risk/data-act-developments-2026-and-beyond)
- **Limit:** users (Art. 4(10)) and third parties (Art. 6(2)(e)) may not use data obtained under the Act "to develop a competing connected product" or to infer the data holder's trade secrets. — [IAM Media](https://www.iam-media.com/hub/trade-secrets-hub/2025/article/connected-products-and-data-sharing-how-the-eu-data-act-reshaping-trade-secret-protection-in-europe); [Heuking](https://www.heuking.de/en/news-events/newsletter-articles/detail/the-data-act-opportunities-and-challenges-for-companies.html)
- Germany designated the Federal Network Agency as enforcer. One source cites fines of up to 4% of turnover (single, lower-quality source; not verified). — [ComplianceHub](https://compliancehub.wiki/eu-data-act-enforcement-accelerates-germany-designates-federal-network-agency-sets-4-turnover-fines-as-september-2026-deadline-looms/)

### Inferences
- **Engagement checklist for a lawful practice:**
  - The customer owns the hardware, licenses the software, or owns the data.
  - Read the EULA. In the US an anti-reverse-engineering clause is a live breach-of-contract risk (Bowers, Davidson, SAS 4th Cir.). In the EU, error correction (Top System), observe/study/test, and interoperability decompilation cannot be fully contracted away (verify Art. 8 text).
  - Do not circumvent encryption or license checks unless a specific §1201 exemption or §1201(f) clearly applies. REA's own policy also refuses DRM and license-check circumvention.
  - Deliver clean-room specs and newly written code, not decompiled code.
  - Never access a third-party server beyond the customer's own credentials and rights.
- The §1201(f) interoperability exemption is narrow and failed in Davidson because the defendants' end product infringed. A solo operator should rely on it only for strictly independent, non-infringing interoperable programs. Statutory text was not retrieved; verify.
- §1201 exemptions cover the user's act of circumvention. Davidson shows that **trafficking** liability under §1201(a)(2) is separate. Publicly distributing a tool that defeats an access control (for example a decrypter for a vendor's encrypted database) is materially riskier than doing a one-off job for a customer. The general rule that exemptions do not cover trafficking is from general knowledge; verify.
- Most 2024 exemptions expire Oct 28, 2027 unless renewed. A business relying on a specific exemption (medical-device or food-equipment repair, abandoned-server games) should track the tenth-cycle outcome, expected around Oct 2027.

### Gaps
- The verbatim §1201(f) text, Directive 2009/24/EC Art. 5(3)/6/8 text, and the full 2024 final rule were not retrieved (sites blocked). The list of **new** (non-renewal) 2027-cycle petitions could not be retrieved, so it is unknown whether anyone petitioned for broader repair, abandoned-IoT or interoperability exemptions in 2026.
- The substance of the European Commission's 16 June 2026 reply to the "Stop Destroying Videogames" initiative was not found (see Q6).

---

## Q3. Candidate 1: lost-source-code recovery and legacy modernization for SMBs and manufacturers (VB6, .NET, Delphi, DOS, machine-control, lab-instrument and niche-ERP software)

### Takeaway
There is real but diffuse demand. It is large in aggregate: legacy modernization is estimated at roughly $15–30B in 2025, and 2026 SMB VB6/Access rebuild quotes run €40k–€110k or CAD 90k–220k. Pain is acute when the vendor is gone and no source exists. REA plus an agent mainly compresses the expensive discovery phase: recovering behavior, file formats and business rules from binaries, then writing tests that pin original behavior.

The best solo offer is a **fixed-fee recovery assessment** followed by a **clean-room rebuild or behavior-preserving wrapper**, priced 30–60% under agency quotes. Legal footing is good when the client licenses the software. The US EULA clause is the main risk.

### Cited Findings
**Market size**
- Legacy software modernization market: $15.14B (2025) to $17.57B (2026), 16.1% CAGR, projected $31.59B by 2030. This is The Business Research Company's report via ResearchAndMarkets, Feb 2026. — [ResearchAndMarkets](https://www.researchandmarkets.com/reports/6215677/legacy-software-modernization-market-report)
- Other syntheses put it at $25–30B in 2025 across five research firms, rising to $66–90B+ by 2031–2034. Mainframe modernization alone is about $9B. **These sources conflict by scope.** — [Keyhole Software (May 2026)](https://keyholesoftware.com/legacy-modernization-trends/); [DreamFactory roundup](https://www.dreamfactory.com/hub/legacy-system-modernization-statistics)
- Japan IT modernization services: ¥1,304B (2025), forecast ¥2,123B by 2030. — [IDC](https://www.idc.com/resource-center/blog/japan-it-modernization-market-2030/)

**What buyers pay today**
- VB6 stock and cost (**stale**):
  - Gartner (2008) estimated 14B lines of VB6 in enterprises and about $11B to migrate.
  - A 2009 ITPro article put real-world large-app migration at $3–7 per LOC, and $10–15/LOC with integrations.

  — [ITPro Today](https://itprotoday.com/microsoft-365/migration-confrontation)
- Vendor models: GAPVelocity assumes a manual rewrite costs about $30/line (about 20 LOC per developer-day at $150k burdened cost). An "AI migrator" advertises $0.12/line (promo) and claims "50-70% total cost savings versus ground-up rewrites". **Both are vendor claims.** — [GAPVelocity VB6 guide](https://www.gapvelocity.ai/hubfs/Updated%20PDFs/GAPVelocity-AI-VB6-Eradication-Guide.docx.pdf); [vb6.7bulls.com](https://vb6.7bulls.com/)
- 2026 SMB project quotes (consultancy marketing pages):
  - Toronto VB6/Access modernization: CAD 90,000–220,000 over 6–12 months.
  - London rebuild: €40,000–110,000, plus €4,500–12,000 for audit and data migration.

  — [Kolonell Toronto](https://kolonell.com/en/blog/legacy-application-modernization-cost-eti-toronto-2026); [Kolonell London](https://kolonell.com/en/blog/legacy-software-migration-web-app-london-2026)
- Historical specialist-tool benchmark (**stale, about 13 years old**): migration-firm quotes of $6,200 and $8,000 for a 117k–140k-line VB6 app. — [Freelancer.com project post](https://www.freelancer.ph/projects/visual-basic-net/converting-writing-desktop-software-net)

**Consultant rates**
- Delphi: about $20–120+/hr overall; senior migration/architecture $78–120+/hr in the US, $55–90/hr globally (recruiting-platform marketing). — [Flexiple](https://flexiple.com/cost-to-hire/delphi-developer)
- Independent software consultants: $75–150/hr, with specialization adding 20–50%. — [RaftLabs (2026)](https://www.raftlabs.com/blog/software-development-consulting-rates)
- Engineering consultants $75–125/hr; management consultants $100–350/hr. — [Paperbell](https://paperbell.com/blog/consulting-rates/)
- Freelancer.com lists generic "reverse engineering" at $25–80/hr (marketplace listing, likely dated). — [Freelancer.com](https://Freelancer.mx/hire/reverse-engineering)
- 2026 scan-to-CAD (mechanical) reverse engineering: $65–135/hr. — [CADCrowd](https://www.cadcrowd.com/blog/?p=50394)

**Demand evidence (qualitative, weak to moderate)**
- A 2026 post says "a surprising number of businesses, especially in manufacturing, insurance, and healthcare, still lean on VB6 tools". No count is given. — [dev.to (code-district)](https://dev.to/feed/code-district)
- Legacy-equipment explainers name the vendor going out of business and departed builders "taking undocumented institutional knowledge" as defining traits. They say hospitals and similar sites still run XP machines, and that "file formats and databases are often the hardest part" of migration. — [ScienceInsights](https://scienceinsights.org/what-is-legacy-equipment-and-why-does-it-still-exist/)
- Forum threads show buyers hitting dead ends:
  - LabVIEW executables have "no decompiler".
  - An AMX vendor said "there is no way to decompile the netlinx source code".
  - A DailyWTF thread notes that companies that lose source often pay the original developers high rates for changes.

  — [NI forums](https://forums.ni.com/t5/LabVIEW/decompiler/m-p/2154); [Harman/AMX forum](https://proforums.harman.com/amx/discussion/comment/31797); [DailyWTF](https://thedailywtf.com/articles/comments/The_Call_of_Codethulhu)

**Feasibility of AI-assisted reconstruction**
- AI agents materially accelerate verifier-guided reconstruction:
  - An N64 game (Snowboard Kids) was decompiled in 84 days versus 596 days for its sequel, credited to "AI agents, community experts, and improved tooling".
  - An ICML 2026 paper frames matching decompilation as a "verifier-guided task" for coding agents.
  - An early-2025 test got a 96% first-attempt match on a simple function with Claude Sonnet 3.5.

  — [Zeli](https://zeli.app/story/49466006); [ICML 2026](https://icml.cc/virtual/2026/82758); [Macabeus](https://macabeus.medium.com/game-decompilation-using-ai-4d47b65f8852)
- Counterpoint: Nightdive's lead KEX developer says reverse engineering is slower and less exact than having source, and that for complex early-2000s games full source is "absolutely mandatory". — [Galaxus/Nightdive](https://www.galaxus.ch/en/page/nightdive-studios-is-fighting-to-keep-long-lost-games-out-of-obscurity-39484). (A search-result summary also said a Claude-driven Zelda project, "Yodecomp", stalled on byte matching and pivoted to SDL porting. The originating URL was not identified, so treat this as unverified.)
- **Legal hooks:**
  - EU: lawful acquirers may decompile to fix errors without meeting Art. 6 (Top System).
  - US: intermediate copying for reverse engineering can be fair use (Connectix).
  - US risk: EULA clauses are enforceable (Bowers).

  — see Q2 citations: [SCL](https://www.scl.org/12394-court-of-justice-rules-that-software-buyers-can-decompile-programs-to-correct-errors/); [Copyright Office summary](https://www.copyright.gov/fair-use/summaries/sony-connectix-9thcir2000.pdf); [SMU](https://scholar.smu.edu/comtech/vol8/iss3/7)

### Inferences
- **How REA plus an agent cuts delivery cost.** Discovery (what does this binary do, what are its file formats, which business rules are buried in it) is the costliest and riskiest phase. Ghidra pseudocode and string/xref tracing, .NET CIL inspection, DOS MZ decompilation, SQLite schema dumps, and Linux/macOS process capture (comparing runs) let an agent produce:
  - a behavior spec
  - golden-master tests from captured I/O
  - a data-format decoder

  The rewrite then becomes ordinary agent-assisted development. The DX-Ball "3,205 cases" pattern (differential testing against the original binary) is the right acceptance-test model for clients.
- **Do not promise "source recovery".** Promise "behavioral recovery plus a maintainable reimplementation". Decompiled output is not buildable, idiomatic source, and shipping decompiled code raises copyright issues (Disclaimer, Connectix). For machine-control software, the safer product is often a **wrapper/bridge**: keep the old binary in a VM and add a modern data export or API around its files or serial protocol.
- **Fit gaps:**
  - VB6 P-code, Delphi form/RTTI, 16-bit Windows NE and LE/LX DOS-extender binaries all lack first-class REA support.
  - Windows-hosted analysis is experimental.

  Screen each lead with a quick triage (file type, compiler, packer, database engine) before quoting.
- **Distribution (no sources found; reasoning only):**
  - Industrial automation integrators and MSPs serving manufacturers, labs and clinics, who meet "the vendor is gone" problems and need a subcontractor.
  - Software-escrow customers whose escrow never happened.
  - Content marketing via public case studies on targets the operator is allowed to publish. REA invites showcase submissions through issues and PRs, which could give credibility.
  - Upwork/Freelancer "legacy", "VB6", "Delphi" and "file format" job searches.
  - LinkedIn outreach to plant engineers and lab managers.
- **Realistic solo pricing (inference, anchored to the cited benchmarks):**
  - Triage call: free or $250.
  - Fixed-fee recovery assessment: $2,500–7,500, 1–2 weeks. Deliverables are a behavior and data-format spec, a risk/legal checklist, and a rebuild estimate. Anchor: London audit plus data migration €4.5k–12k.
  - Data-export bridge or wrapper: $5k–20k.
  - Small-app clean-room rebuild: $15k–60k, versus the €40k–110k and CAD 90k–220k agency quotes.
  - Maintenance retainer: $500–2,500/month.
  - Effective rate target: $125–200/hr, the upper end of independent consultant ranges given the specialization premium.
- **Main business risks:**
  - Lumpy, trust-heavy sales.
  - Client expectations of "just decompile it".
  - Liability if a reimplemented machine-control or lab system misbehaves. Use contracts with acceptance tests and a liability cap, and keep safety-critical control loops out of scope.

### Gaps
- There is no independent 2026 per-LOC or per-project benchmark for SMB legacy rebuilds. Cited numbers are vendor or consultancy marketing.
- There are no data on how many SMBs run unsupported, sourceless software, or on willingness to pay specifically for "lost source" recovery.
- No direct evidence quantifies REA-specific time savings on application-scale recovery.

---

## Q4. Candidate 2: interoperability and data-liberation tools for closed vertical software (dental/medical PMS, POS, salon, legacy accounting, auto-dealer DMS)

### Takeaway
This is the most **productizable** lawful model: decode a closed product's local data store or file format once, then sell export or migration many times. The buyers who already pay are destination vendors and migration consultants. Dental PMS conversions typically cost $500–2,500 per practice, and the destination vendor often charges for or subsidizes them. Demand spikes when a vendor shuts down. EU Data Act portability and switching rules are a tailwind.

The legal sweet spot is reading the customer's own data from files on the customer's own machines. Risk rises sharply when the data is encrypted (TPM circumvention), when the work touches a hosted system (CFAA/ToS), or when the incumbent is litigious, as the auto-dealer DMS wars show.

### Cited Findings
**Dental conversion pricing and incumbents**
- DentiMax: "most data conversions can range in price from $500-$2500". — [DentiMax](https://dentimax.com/switching-dental-software/)
- Open Dental: typical US cost "$1200 per database", with a free test conversion. — [Open Dental conversions](https://www.OpenDental.com/site/conversions.html)
- Benco (Open Dental reseller): $800–1,400 depending on source software and practice size. — [Benco](https://www.benco.com/?p=23112)
- EZ 2000: $1,295–1,495 depending on origin software. — [ZoftwareHub](https://zoftwarehub.com/products/ez-2000-dental-software/zoftware-analysis)

**Encryption and vendor shutdowns**
- Conversions take about 1–2 weeks. When "a prior vendor's data is encrypted", vendors sometimes need extra time "to decrypt your data in some cases". — [Wisdom (dental billing)](https://www.withwisdom.com/resources/dental-pms-conversions-why-when-and-how); [SFD](https://sfd.co/news/15.html)
- Vendor shutdowns create urgent export demand: DentiMax markets switching "like when Umbie® closed its doors". — [DentiMax](https://dentimax.com/switching-dental-software/)
- Practice-management guides advise requesting your data "before you give notice, while you are still a paying customer". They warn that contracts may "impose restrictions or penalties". — [NetPractice](https://netpractice.co.za/blog/switching-practice-management-software/)

**Incumbent hostility: the auto-dealer DMS precedent**
- Authenticom sued Reynolds and CDK over dealer-data access. Reynolds settled with Authenticom in 2022 and paid dealers nearly $30M (2018). A $100M dealer class settlement covering CDK/Reynolds DMS buyers was preliminarily approved on Aug 23, 2024. The MDL sits in N.D. Ill. — [Dayton Daily News](https://www.daytondailynews.com/business/court-weigh-reynolds-and-reynolds-settlement/dJnhyCtFlALgUwFsDA3HPJ); [Digital Dealer](https://digitaldealer.com/news/cdk-settles-lawsuit-with-dealers/161282/); [Repairer Driven News](https://www.repairerdrivennews.com/?p=173385)

**Regulatory tailwinds**
- EU Data Act: user access to connected-product data, access-by-design for products placed on the market after 12 Sept 2026, and cloud switching charges abolished by 12 Jan 2027. — [Bird & Bird](https://cm.twobirds.com/en/insights/2026/the-eu-data-act-where-things-stand-now); [Matheson](https://www.matheson.com/insights/the-data-act-access-by-design-requirement-comes-into-force/)

**Legal basis for interoperability reverse engineering**
- US: Sega/Connectix fair use; §1201(f), which is narrow (Davidson); DTSA proper means.
- EU: Art. 6 decompilation for interoperability (text unverified this session) and Art. 5(1) error correction (Top System).
- Risks: EULA breach (Bowers, Davidson); CFAA "gates-up-or-down" (Van Buren).

— see Q2: [Copyright Office summary](https://www.copyright.gov/fair-use/summaries/sony-connectix-9thcir2000.pdf); [422 F.3d 630](https://law.resource.org/pub/us/case/reporter/F3/422/422.F3d.630.04-3654.html); [Sierra IP Law](https://sierraiplaw.com/reverse-engineering/); [FBM](https://www.fbm.com/alex-reese/publications/what-recent-rulings-in-hiq-v-linkedin-and-other-cases-say-about-the-legality-of-data-scraping/)

**REA capabilities that apply**
- SQLite schema and rows; HAR/mitmproxy capture inspection; .NET metadata/CIL to locate serializers and schema code; native pseudocode to recover proprietary file-format parsers; Electron/JS analysis for modern desktop clients; process capture (Linux/macOS) to observe file reads and writes. — [REA README](https://github.com/morluto/rea/blob/main/README.md); [web-network-captures.md](https://github.com/morluto/rea/blob/main/docs/web-network-captures.md)

### Inferences
- **Who pays:** practices and SMBs pay grudgingly, $500–2,500 per conversion. **Destination vendors** pay to win customers: they already run conversion teams and offer free test conversions. They are the best B2B customer for a "long-tail source-format converter": license a decoder for an obscure or defunct source system to several destination vendors and migration consultants. A second buyer group is data-migration consultants for accounting, POS and salon systems.
- **Product shape:**
  1. A per-format "extractor" (CLI or desktop) that reads the customer's local DB or files and emits CSV, JSON or the target vendor's import format.
  2. A white-label license to destination vendors.
  3. Emergency "vendor shutdown export" service.

  Each new format follows the same REA workflow: locate the data files, inspect them if SQLite, otherwise find parser code via strings and xrefs in Ghidra or .NET CIL, write the decoder, and validate it against the original app's own screens and reports.
- **Hard legal lines:**
  - Read data **at rest on the customer's own system** with the customer's authorization.
  - Avoid breaking encryption or obfuscation keyed by the vendor. If unavoidable, get counsel and rely on §1201(f) or Art. 6 narrowly, or require a vendor-provided export or key.
  - Never use reverse-engineered **credentials or APIs** against a vendor's cloud. This is where the Reynolds/CDK-style fights and CFAA/ToS exposure arise.
  - Do not publish circumvention tools.
  - For health data, add HIPAA (US) or GDPR (EU) data-handling obligations: BAAs, local processing. REA runs locally, which helps.
- **Pricing (inference):**
  - Per-practice export: $300–1,500, undercutting or matching destination-vendor conversion fees.
  - White-label decoder license to a destination vendor: $5k–25k upfront plus per-conversion royalty ($50–200).
  - Bespoke format decode: $3k–15k.
  - Emergency shutdown export: $1k–5k per site.
- **Distribution:** destination-vendor partnerships (conversion teams), dealer/distributor networks such as dental supply houses, vertical forums and Facebook groups, and timely landing pages when a vendor announces end-of-life.
- **Why rank highly:** one decoder can be resold many times, sales cycles are short, the buyer's pain is tied to an event (switch or shutdown), legal risk is lowest when confined to customer-held data, and an agent plus REA is especially good at file-format recovery.

### Gaps
- No sources were found quantifying how often vertical vendors lock exports or charge exit fees, or how many SMBs are stuck on defunct PMS/POS products.
- No evidence was found on whether destination vendors buy third-party converters (as opposed to building them in-house); this needs customer discovery.
- Whether the 2024 or 2027 §1201 classes cover decrypting one's own data in vertical software is unknown (new 2027 petitions not retrieved).

---

## Q5. Candidate 3: right-to-repair diagnostics and abandoned-device revival

### Takeaway
The legal tailwinds are strong:
- US §1201 repair exemptions for consumer devices, vehicles, medical devices and retail food-prep equipment run through Oct 2027, with renewals filed.
- State repair and parts-pairing laws took effect in 2026.
- The FTC v. Deere settlement (July 2026) forces Deere to share dealer-grade diagnostics.
- The EU Data Act adds data access by design.

The consumer "revive my bricked gadget" segment, however, is hobbyist and donation-funded (OpenPin stalled, Wemo users pushed to HomeKit). The viable solo business is B2B:
- diagnostic and protocol documentation and tools for **independent service organizations (ISOs)** in medical, food-service and commercial equipment
- local-control bridges for **fleets** of business devices orphaned by vendor shutdowns

### Cited Findings
**State repair laws**
- Colorado HB24-1121 took effect Jan 1, 2026. It bans parts pairing that blocks functional replacement parts, degrades function or triggers misleading warnings, with a carve-out for biometric components. — [Proskauer](https://www.proskauer.com/blog/colorado-expands-right-to-repair-law); [beancount.io guide (2026)](https://beancount.io/blog/2026/07/11/right-to-repair-2026-parts-pairing-independent-shops-guide)
- Other states:
  - Oregon's parts-pairing ban takes effect in 2027.
  - Minnesota (effective July 1, 2024), New York (Dec 28, 2023) and California (2023) have electronics repair laws.
  - Washington consumer electronics and wheelchair laws took effect Jan 1, 2026.
  - Connecticut and Texas rules take effect July and Sept 2026 (single secondary source).

  — [Wiley](https://sitepilot09.firmseek.com/client/wiley2/www/printpilot-publication-State-Right-to-Repair-Patchwork-Grows-as-Electronic-Device-Manufacturers-Face-New-Compliance-Deadlines.pdf); [beancount.io](https://beancount.io/blog/2026/07/11/right-to-repair-2026-parts-pairing-independent-shops-guide)

**FTC v. Deere**
- Filed Jan 15, 2025 and settled July 8, 2026 with the FTC and five states (IL, AZ, MI, MN, WI). The settlement lasts 10 years. Deere must give farmers and independent shops "the same diagnostic software, manuals, and parts-pairing tools" as dealers, may not retaliate, and pays $1M in state legal costs. A separate April 2026 class action settled for $99M. — [Equipment World](https://www.equipmentworld.com/business/article/15829573/john-deere-settles-ftc-states-lawsuit-over-right-to-repair); [KCRG](https://www.kcrg.com/2026/07/08/deere-reaches-settlement-with-ftc-right-to-repair-antitrust-lawsuit/)

**§1201 repair exemptions**
- Classes exist for retail-level commercial food prep equipment and medical devices (renewal petitions by Crothall and Caylor, ISOs). iFixit filed a device-repair renewal and SEMA a vehicle-repair renewal. Current exemptions expire Oct 28, 2027. — [2027 renewal form](https://www.copyright.gov/1201/2027/renewal-petition.pdf); [Crothall](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Medical-Devices-Crothall-Facilities-Management.pdf); [iFixit](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Device-Repair-iFixit.pdf); [NewsNet 1057](https://www.copyright.gov/newsnet/2024/1057.html)

**Abandoned devices**
- Belkin discontinued Wemo cloud and app support for select products **effective Jan 31, 2026**. Only HomeKit-configured or Thread models keep working locally, voice integrations end, and Belkin offered "partial" refunds for in-warranty devices. — [Belkin](https://www.belkin.com/support/wemo); [9to5Google](https://9to5google.com/?p=680751)
- Humane AI Pin: HP acquired Humane and shut down the servers, bricking devices. The community OpenPin project redirects pins to its own server but requires an **interposer** (hardware). Its developer "has halted development". — [Liliputing](https://liliputing.com/openpin-is-an-open-source-project-to-revive-humanes-dead-ai-pin/); [CO/AI](https://getcoai.com/news/humanes-ai-pin-revival-bypasses-hps-printer-expertise)
- Earlier cloud-shutdown bricks include SmartDry, Insteon and Revolv. Advocates point to local-first firmware (ESPHome/Tasmota) and Home Assistant. PIRG documents community efforts to keep unsupported devices alive. — [Techdirt](https://www.techdirt.com/tag/smartdry/); [daily.dev](https://daily.dev/posts/your-smart-home-devices-will-outlast-the-companies-that-made-them-if-you-ditch-the-cloud-cnvnmbcgr); [PIRG](https://pirg.org/articles/keeping-tech-alive-the-open-source-communities-fighting-against-unsupported-devices/)

**EU Data Act**
- Connected-product data access by design covers "industrial and agricultural machinery" placed on the market after 12 Sept 2026. — [Matheson](https://www.matheson.com/insights/the-data-act-access-by-design-requirement-comes-into-force/)

**REA capabilities that apply**
- Firmware region inspection and extraction (Binwalk/Unblob) with handoff to Ghidra.
- TShark inspection of network, USB and Bluetooth captures.
- sigrok decoding of UART and other logic captures.
- Android APK (companion app) and adb device analysis.
- MIPS/ARM/RISC-V Ghidra guides.

— [firmware-analysis.md](https://github.com/morluto/rea/blob/main/docs/firmware-analysis.md); [packet-captures.md](https://github.com/morluto/rea/blob/main/docs/packet-captures.md); [signal-recordings.md](https://github.com/morluto/rea/blob/main/docs/signal-recordings.md); [REA README](https://github.com/morluto/rea/blob/main/README.md)

### Inferences
- **How REA cuts cost.** Diagnosing a device's service protocol usually means:
  1. Extract firmware.
  2. Decompile the service handler.
  3. Capture USB or serial traffic from a working service tool or companion app.
  4. Decode it and write an open diagnostic client.

  REA wraps every step in agent-callable tools. That turns weeks of specialist work into days for a generalist with an agent. The physical-access parts (UART taps, JTAG, interposers) remain manual.
- **Best paying buyers:**
  - Medical-equipment ISOs and hospital clinical-engineering departments; Crothall and Caylor are already active in the §1201 process.
  - Food-service equipment repair companies, where the McFlurry-machine-style exemption exists.
  - Commercial and industrial equipment service shops.
  - Businesses with fleets of orphaned IoT, such as hospitality, property management and retail.
- **Deere's settlement reduces RE demand in ag** because the tools must now be provided. The opportunity shifts to integration, training and multi-brand diagnostics for independent shops, and to non-Deere brands.
- **Pricing (inference):**
  - Device-family diagnostic and protocol report plus open tool: $5k–25k per family, sold to one ISO or co-funded by several.
  - Annual tool subscription for ISOs: $1k–5k per seat.
  - Orphaned-fleet local-control bridge: $5k–30k per deployment.
  - Consumer revival: donation, Patreon or kit sales only; not a living wage on its own.
- **Risks:**
  - Exemptions cover diagnosis, maintenance and repair, not arbitrary modification or tool trafficking.
  - Medical-device work carries FDA and patient-safety considerations. Stay on the diagnostic and repair side and avoid changing therapeutic function.
  - Exemptions expire Oct 2027 unless renewed.
  - Devices with signed firmware or secure boot may be infeasible.
  - Hardware sourcing and lab costs.
- **Distribution:** ISO trade associations and biomed (HTM) communities, iFixit and repair-advocacy networks, Home Assistant and community forums for consumer goodwill and leads, and municipal or state repair programs. All of this is inference; no sources were found.

### Gaps
- No pricing data was found for OEM service contracts or ISO margins on medical or food-service equipment, which is needed to size willingness to pay.
- It is not confirmed whether new 2027-cycle petitions seek broader repair or "abandoned device" exemptions (petition list not retrieved).
- No source was found on any paid business successfully selling revival of a specific 2025–26 shutdown. OpenPin is unpaid and stalled.

---

## Q6. Candidate 4: game and software preservation, decompilation commissions, porting, mod tooling

### Takeaway
Agentic decompilation is now fast enough to matter: Snowboard Kids was decompiled in 84 days versus 596 days for its sequel, and an ICML 2026 paper treats verifier-guided matching decompilation as an agent task. REA's own showcases (DX-Ball, PC-98 TH04) are matching-decompilation demos.

The **lawful paying market**, though, is narrow:
- rights-holder-commissioned remasters and ports. Nightdive reverse-engineered System Shock 2's retail binary for its 2025 remaster.
- libraries, archives and museums under the §1201 preservation exemptions.

Unlicensed decomps of commercial games carry copyright exposure even though Nintendo has not sued matching decomps. Nintendo is aggressive against emulators: 401 repos were removed in Aug 2026 (single source). This candidate is a good portfolio and marketing engine but a weak primary business unless the operator can land studio subcontracts.

### Cited Findings
**Licensed remaster work**
- Nightdive "had to reverse-engineer the code available on the original retail disc" for the *System Shock 2: 25th Anniversary Remaster* (2025). Late-stage source acquisition sped things up. *Blood: Refreshed Supply* (Dec 2025) was rebuilt from recovered original source and used to check earlier reverse-engineering work. — [Epic Games Store interview](https://store.epicgames.com/news/system-shock-2-25th-anniversary-remaster-interview-stephen-kick); [Xbox Wire](https://news.xbox.com/en-us/2025/12/03/blood-refreshed-supply-source-code/); [Galaxus](https://www.galaxus.ch/en/page/nightdive-studios-is-fighting-to-keep-long-lost-games-out-of-obscurity-39484)

**AI-accelerated decompilation**
- Agents on N64 (Chris Lewis, Snowboard Kids 2); the ICML 2026 verifier-guided harness; one-shot Claude decompilation results. — [Chris Lewis](https://blog.chrislewis.au/using-coding-agents-to-decompile-nintendo-64-games/); [Chris Lewis one-shot](https://blog.chrislewis.au/the-unexpected-effectiveness-of-one-shot-decompilation-with-claude/); [ICML 2026](https://icml.cc/virtual/2026/82758); [Zeli](https://zeli.app/story/49466006)
- REA DX-Ball: 63 bytes matched, 3,205 test cases. TH04: PC-98 16-bit recovery. — [REA README](https://github.com/morluto/rea/blob/main/README.md)

**IP risk landscape**
- Fan decomps:
  - Nintendo "has not taken legal action against matching decomps" since Super Mario 64 (2019).
  - The Zelda OoT "ZRET" reimplementation was reported 91% complete.
  - "Dusk", a Twilight Princess reimplementation, appeared in May 2026.
  - These projects avoid distributing original assets.
- Nintendo emulator takedowns: GitHub notices against 13 emulator projects in Feb 2026, and 401 repos removed on Aug 17, 2026 (single outlet).
- Scholarship notes decomps "usually comprise entirely new code" without assets, but this is not a ruling.

  — [Godisageek](https://godisageek.com/2026/08/nintendo-401-switch-emulator-repos-dmca/); [VGC](https://www.videogameschronicle.com/news/zelda-ocarina-of-time-pc-port-looks-likely-as-fan-decompilation-clears-65/); [GamingOnLinux](https://www.gamingonlinux.com/2026/05/dusk-is-a-reverse-engineered-reimplementation-of-the-legend-of-zelda-twilight-princess/); [Cardozo Law Review](https://cardozolawreview.com/sigmon-nerds-v-nintendo)

**Preservation exemptions and EU policy**
- §1201 classes cover games with discontinued server support (individual play plus library, archive and museum preservation) and preservation of computer programs by libraries, archives and museums. — [2027 renewal form](https://www.copyright.gov/1201/2027/renewal-petition.pdf); [LCA petition](https://www.copyright.gov/1201/2027/petitions/renewal/Renewal-Pet-Preservation-Library-Copyright-Alliance-Computer-Programs.pdf)
- EU "Stop Destroying Videogames" initiative: 1,294,188 valid signatures, thresholds met in 24 member states. The Commission adopted its reply on 16 June 2026; **its substance was not found**. — [European Citizens' Initiative site](https://citizens-initiative.europa.eu/news/european-commission-replies-stop-destroying-videogames-initiative-2026-06-16_cs); [heise](https://heise.de/-11154579); [RetroHandhelds](https://retrohandhelds.gg/eu-sets-deadline-for-stop-killing-games-decision/)

### Inferences
- **Lawful revenue models:**
  1. Subcontract reverse engineering and porting to rights holders and remaster studios. When source is lost, the studio needs binary-to-behavior recovery; REA's matching-decomp workflow plus agent-written tests fits.
  2. Grant-funded preservation work for museums and archives, such as emulation or recompilation of in-house software collections, within the library/archive/museum exemptions.
  3. Server-revival for **licensed** or abandoned-server games where the rights holder consents, or under the discontinued-server exemption for personal play.
  4. Mod tooling for games whose publishers permit modding.
- **Avoid:**
  - selling decomps or ports of commercial games without a license
  - distributing assets
  - anything that defeats DRM or anti-cheat (REA's own policy refuses these)
  - Patreon-funded decomps of litigious publishers' IP, which carry takedown and suit risk even if Nintendo has so far left matching decomps alone
- **Pricing (inference):** studio subcontract day rate $600–1,200 (in line with $75–150/hr specialist consulting) or fixed per-subsystem fees. Museum projects depend on grant cycles: slow, low margin, but good PR.
- **Strategic value:** public, permitted decomp or preservation case studies such as abandonware with clear permission, or homebrew are excellent **marketing** for the legacy-recovery business (Q3), because they demonstrate verifiable byte-matching skill.

### Gaps
- No data were found on how many studios outsource RE for remasters or what they pay. Nightdive appears to do it in-house.
- There is no source on museum or archive software-preservation grant budgets.
- The EU Commission's June 2026 response substance is unknown. If it proposes end-of-life obligations for online games, server-revival demand could grow.

---

## Q7. Candidate 5: competitive feature analysis ("how does competitor X implement feature Y")

### Takeaway
This is REA's own headline pitch ("See a feature you like… build a version for your project"). It is **legal in narrow forms and ethically and contractually fraught in common forms**.

Copyright protects code, not ideas or functionality, and US trade-secret law treats reverse engineering of a lawfully acquired product as a proper means. However:
- US EULA anti-reverse-engineering clauses are enforceable (Bowers, Davidson, SAS 4th Cir.).
- EU Software Directive decompilation rights are limited to interoperability and error correction. Using decompiled information to build a substantially similar program is excluded (Art. 6(2)(c), verify text).
- The EU Trade Secrets Directive permits contractual bans on reverse engineering.
- The Data Act bars using connected-product data to build competing products.

Not recommended as a core business. A defensible variant is clean-room **black-box** analysis of publicly observable behavior.

### Cited Findings
- REA README pitch: "See a feature in an app that you want in your own product? Ask your agent to investigate it with REA… and build a version for your project." The DISCLAIMER excludes "copying proprietary software or reproducing its protected code and assets". — [REA README](https://github.com/morluto/rea/blob/main/README.md); [DISCLAIMER.md](https://github.com/morluto/rea/blob/main/DISCLAIMER.md)
- **Trade secrets:**
  - US DTSA: reverse engineering is not improper means.
  - EU TSD Art. 3(1)(b): reverse engineering is lawful only if the acquirer is "free from any legally valid duty to limit the acquisition", and contractual bans are permitted.

  — [Sierra IP Law](https://sierraiplaw.com/reverse-engineering/); [SCL](https://www.scl.org/3315-eu-trade-secrets-directive-be-aware-be-very-aware/)
- **Contract risk:** Bowers (Fed. Cir.), Davidson (8th Cir.), SAS v. WPL (4th Cir.) enforcing license terms despite EU law. — [SMU](https://scholar.smu.edu/comtech/vol8/iss3/7); [422 F.3d 630](https://law.resource.org/pub/us/case/reporter/F3/422/422.F3d.630.04-3654.html); [Holland & Knight](https://hklaw.com/en/insights/publications/2018/01/reverse-engineering-source-code-of-software-is-not)
- **Data Act:** data from connected products may not be used "to develop a competing connected product" (Arts. 4(10), 6(2)(e)). — [IAM Media](https://www.iam-media.com/hub/trade-secrets-hub/2025/article/connected-products-and-data-sharing-how-the-eu-data-act-reshaping-trade-secret-protection-in-europe)
- **Precedent that output must be non-infringing:** Connectix discounted intermediate copying only where "the final product does not itself contain infringing material". — [Copyright Office summary](https://www.copyright.gov/fair-use/summaries/sony-connectix-9thcir2000.pdf)

### Inferences
- **Lower-risk forms:**
  - analysis of publicly served web front-ends and network traffic of the client's own account (HAR), producing **functional descriptions** and UX teardown
  - patent and prior-art technical analysis
  - "how is this open protocol or format used" studies
  - authorized competitive benchmarking where the license permits it
- **Higher-risk forms:**
  - decompiling competitors' desktop or mobile apps under EULAs that prohibit reverse engineering
  - giving clients pseudocode-derived implementations
  - anything touching DRM or anti-tamper

  A solo operator without counsel and insurance should avoid these.
- **Ethics and reputation:** being known as a "copy competitors' features" shop undermines the trust needed for the legacy, interop and repair offers, which rely on customers handing over their own systems.
- **Pricing if offered (clean-room only):** $2k–8k per teardown report. Not ranked.

### Gaps
- No sources were found on market demand or pricing for software competitive teardowns specifically.

---

## Q8. Candidate 6: selling REA-based services and tooling (hosted/managed REA, training, agentic-RE consulting)

### Takeaway
A training market for agentic RE exists: Ringzer0's 3-day "Agentic Malware Analysis" course (Ghidra, local LLMs, MCP) costs CAD 4,900 in Nov 2026. That market is security-flavored, and REA is free, MIT-licensed, very new and changing weekly, with its own maintainers and Discord. **Hosted REA** is constrained by third-party tool licensing: IDA, Hopper and JEB rights do not extend to hosting through REA. It also conflicts with customers' preference for local analysis of their own confidential binaries.

Best as an **add-on**: workshops and enablement for in-house teams doing legacy and interop work, not a standalone business.

### Cited Findings
- Ringzer0 COUNTERMEASURE Fall 2026 lists "Agentic Malware Analysis", a 3-day in-person course on Nov 2–4, 2026 in Ottawa, at **CAD 4,900**, using Ghidra, local LLMs, scripting, headless execution and MCP. A 2025 iOS RE course was CAD 5,000. — [Ringzer0 registration](https://ringzer0.regfox.com/ringzer0-countermeasure-fall-2026-in-person); [Ringzer0](https://ringzer0.training/)
- REA is MIT-licensed and provides "no commercial-tool license, key, or activation entitlement". An open-source bridge "does not grant additional user, machine, feature, automation, hosting, or output-sharing rights". — [DISCLAIMER.md](https://github.com/morluto/rea/blob/main/DISCLAIMER.md)
- REA has 35 releases in about three months (0.2.0 on 2026-07-12 to 6.4.0 on 2026-10-11) and an active Discord. — [CHANGELOG.md](https://github.com/morluto/rea/blob/main/CHANGELOG.md); [REA README](https://github.com/morluto/rea/blob/main/README.md)
- REA emphasizes that "Analysis runs locally". — [REA README](https://github.com/morluto/rea/blob/main/README.md)

### Inferences
- **Hosted REA as SaaS** is weak:
  - Ghidra (free) could be hosted, but Hopper and IDA licensing likely forbid it.
  - Customers with sensitive legacy binaries or patient data want on-prem.
  - The maintainers or larger players could ship hosted versions.

  A **managed on-prem install** for an enterprise legacy team (setup, provider configuration, agent prompts, verification lanes) is plausible at $2k–10k per engagement.
- **Training:** a 1–2 day "agentic legacy recovery and interop" workshop for in-house IT and engineering teams could price at $1,500–3,000 per seat or $8k–20k per private cohort, benchmarked below Ringzer0's security-focused CAD 4,900. Content decay from REA's release pace requires frequent updates.
- **Additional candidates surfaced during research (thin evidence, inference only):**
  1. **Software forensics and litigation support:** binary comparison for copyright and open-source license-compliance disputes, using REA's build-comparison and evidence-ledger tools. There is a §1201 exemption for investigating potential infringement (SFC renewal petition), and expert-witness rates are typically high. Rates were not sourced.
  2. **M&A or vendor-risk "binary-only asset" due diligence:** what does this acquired sourceless tool actually do, and which dependencies are in it (REA's Go module and .NET native-boundary tools).
  3. **Scientific and lab instrument data-format liberation:** decoding proprietary instrument file formats so labs can use their own data in open tools. This is a sub-case of Q4. Demand evidence was not gathered.
  4. **SaaS "vendor shutdown" exports via the customer's own authenticated web session (HAR):** legal if confined to the customer's own credentials and data. Van Buren lowers CFAA risk for authorized users, but ToS risk remains.

### Gaps
- No data on demand for agentic-RE training outside security, or on any company selling hosted or managed REA.
- No verified figures on expert-witness or software-forensics rates (not searched due to tool budget).

---

## Q9. Ranking: top 3 lawful solo businesses using REA (synthesis)

### Takeaway
1. **Data liberation and migration converters for closed vertical software**: customer-held data, B2B to destination vendors and migration consultants, plus emergency shutdown exports.
2. **Legacy "lost source" recovery assessments plus clean-room rebuilds or bridges** for SMB manufacturers, labs and clinics.
3. **B2B right-to-repair diagnostics and orphaned-fleet revival** for independent service organizations (medical, food-service, commercial) and businesses with bricked IoT fleets.

Preservation and porting is a strong **marketing and portfolio** complement. Competitive teardown and hosted REA are not recommended as core businesses.

### Cited Findings
- Conversion prices show existing willingness to pay: dental conversions $500–2,500; Open Dental $1,200 per database. — [DentiMax](https://dentimax.com/switching-dental-software/); [Open Dental](https://www.OpenDental.com/site/conversions.html)
- Legacy rebuild quotes and market: €40k–110k (London, plus €4.5–12k audit/data migration), CAD 90k–220k (Toronto), market $15–30B (2025). — [Kolonell London](https://kolonell.com/en/blog/legacy-software-migration-web-app-london-2026); [Kolonell Toronto](https://kolonell.com/en/blog/legacy-application-modernization-cost-eti-toronto-2026); [ResearchAndMarkets](https://www.researchandmarkets.com/reports/6215677/legacy-software-modernization-market-report); [Keyhole](https://keyholesoftware.com/legacy-modernization-trends/)
- Repair legal tailwinds: Colorado parts pairing (Jan 2026), FTC–Deere (July 2026), medical-device and food-equipment §1201 classes through Oct 2027. — [Proskauer](https://www.proskauer.com/blog/colorado-expands-right-to-repair-law); [Equipment World](https://www.equipmentworld.com/business/article/15829573/john-deere-settles-ftc-states-lawsuit-over-right-to-repair); [NewsNet 1057](https://www.copyright.gov/newsnet/2024/1057.html)
- Evidence that agents accelerate binary-to-source recovery (84 vs 596 days) and that REA demonstrates byte-matching reconstruction. — [Zeli](https://zeli.app/story/49466006); [REA README](https://github.com/morluto/rea/blob/main/README.md)

### Inferences

**Scoring rationale** (author judgment; scores are 1–5, higher is better):

| Rank | Business | Legal risk (lower is better) | Repeatability / productization | Ticket size | Demand evidence | REA fit | Solo feasibility |
|---|---|---|---|---|---|---|---|
| 1 | Data liberation / migration converters (customer-held data) | Low–medium (rises with encryption or hosted access) | High: one decoder, many sales | $300–1.5k per site; $5k–25k licenses | Moderate (priced conversion market, vendor shutdowns, Data Act) | High (SQLite, CIL, Ghidra parsers, HAR) | High |
| 2 | Legacy lost-source recovery and rebuild | Low–medium (US EULA clauses; EU Top System/Art. 6 help) | Medium (assessment is productizable; rebuilds are bespoke) | $2.5k–7.5k assessment; $15k–60k rebuild | Moderate (large market, anecdotal "vendor gone" pain) | Medium–high (gaps: VB6 P-code, Delphi, NE, Windows experimental) | Medium (sales cycle, liability) |
| 3 | B2B repair diagnostics / orphaned-fleet revival | Medium (exemption-dependent, expires Oct 2027; medical safety) | Medium (per device family, resellable to multiple ISOs) | $5k–25k per family; $1k–5k per seat per year | Moderate (ISOs active in §1201; state laws; Deere) | High (firmware, USB/BT pcap, UART, APK) | Medium (hardware lab needed) |
| 4 | Preservation / licensed porting subcontracts | Low if licensed; high if not | Low | Day-rate | Weak–moderate | High (matching decomp) | Medium |
| 5 | Agentic-RE training / managed on-prem setup | Low | Medium | $1.5k–3k per seat | Weak outside security | N/A | Medium (content decay) |
| 6 | Competitive feature teardown | Medium–high (EULA, EU Art. 6(2)(c), Data Act 4(10)) | Medium | $2k–8k | Unknown | High | Not recommended |

**Recommended operating model:** combine #1 and #2 under one "we get your data and logic out of software you're stuck with" brand. Use #3 as a vertical expansion once a hardware lab exists, and publish permitted preservation case studies (#4) for credibility.

**Standard legal hygiene for every engagement:**
- written authorization and confirmation of ownership or license
- EULA review
- no circumvention of encryption or license checks without a documented exemption basis and counsel
- clean-room deliverables
- local processing of customer data
- liability caps
- no publication of circumvention tools

**Effective-rate assumption:** a solo operator billing about $125–200/hr equivalent. That is the upper end of the $75–150/hr independent consultant range plus a 20–50% specialization premium ([RaftLabs](https://www.raftlabs.com/blog/software-development-consulting-rates)), while still undercutting agency project quotes because REA plus an agent compresses discovery.

### Gaps
- All recommended solo price points are reasoned from adjacent benchmarks, not observed REA-based businesses. None were found as of Oct 2026, which is unsurprising given REA's three-month age.
- Customer-discovery data (interviews, willingness-to-pay tests) is needed before committing to a vertical, especially for #1, where it is unclear whether destination vendors will buy third-party converters.
