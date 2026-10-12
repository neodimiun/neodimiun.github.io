# External input: full research answer from a second model

Provenance: the user ran the shared research prompt in a separate model session
(Gemini or Grok; the user did not say which) and pasted the answer into this
conversation on 12 Oct 2026. Not independently verified here. The answer gave
URLs only as domain names, so treat figures as leads to re-check against
primary pages. Notable unverified items: Claude model pricing quoted
("Claude Sonnet 5.5 ~$2/$10 per M tokens"), REA star count (100k–129k), and the
licence claims for Hopper/IDA Home/JEB (cross-check with rea_project_and_landscape.md).

## Conclusion (as stated)
Best near-term fit: a CRA SBOM + basic compliance-doc pack for small EU
manufacturers (Article 14 reporting in force since 11 Sep 2026; full obligations
11 Dec 2027), delivered with free open-source SBOM generators + cheap LLM calls.
Next strongest: accessibility audit reports, and REA+Ghidra binary SBOMs. Most
pure consumer "pay-per-report" undercuts are crowded or data-costly.

## Ideas table (condensed)

| Idea | Buyer & forcing function | Incumbents & prices (as cited) | Unit cost | Demand evidence | Legal risk | Distribution | Moat | Build | Conf. |
|---|---|---|---|---|---|---|---|---|---|
| CRA SBOM + compliance pack (Syft/cdxgen/Trivy + LLM docs) | EU SME manufacturers of products with digital elements; Art. 14 reporting from 11 Sep 2026, full reqs + SBOM 11 Dec 2027; fines up to €15M or 2.5% turnover | FOSSA Business ~$20/project/mo (fossa.com/pricing; conflicting); Venvera from €399/mo (venvera.com); consultants €2k–10k (solidwaretools.com) | ~free tools + LLM; hosting <$0.50 | "Thousands" of affected manufacturers (German estimates); Regulation (EU) 2024/2847; steptoe.com, meroisecurity.com | Low if framed as tooling + sample docs, not legal advice | SEO "CRA SBOM SME", LinkedIn manufacturer groups, r/embedded | Enterprise sales cycles, perceived completeness, SCA lock-in | 3–4 wks | Med |
| Automated WCAG/ADA audit report (axe-core + LLM) | US small e-commerce, restaurants, clinics facing demand letters/suits | Manual audits $1,250–$5,000 (accessible.org, digitala11y Aug 2026); continuous tools from $19/mo | ~$0.02–0.10/report | 3,117 federal ADA web suits 2025 (+27%); >5,000 all courts; ~6,176 projected 2026 (UsableNet/Seyfarth via adascanpro.com, adatitleiii.com); 68% of defendants <$50M revenue | Medium; must not claim compliance | Google Ads "ADA website audit", small-biz groups | Manual expertise, liability fear, widget vendors | 2–3 wks | Med |
| Binary/firmware SBOM via REA + Ghidra | Hardware/firmware makers needing CRA SBOMs where source is unavailable | Custom RE services "high five figures"; commercial binary SCA tiers | Ghidra (Apache 2.0) + REA (MIT) + LLM | Same CRA timeline | Low for customer-owned product. Claimed: IDA Home non-commercial (hex-rays FAQ); Hopper allows commercial (hopperapp FAQ); JEB needs OEM licence for SaaS output redistribution (pnfsoftware EULA) | CRA channels + embedded forums | RE skill; quality on obfuscated binaries | 4–6 wks | Med |
| Interoperability data export (REA on Electron/JS/closed apps) | Businesses locked into closed apps wanting their own data | Custom consultants $5k+ | REA JS analysis + LLM | UNVERIFIED, anecdotal | Low if customer's own data; avoid DRM | Niche software user forums | Per-app custom work | 2–4 wks/vertical | Low |
| Cheap business credit/summary report (public filings + OpenCorporates) | B2B supplier/customer due diligence | D&B BIR ~$140; Experian ~$60 (zephira.ai, Oct 2026); businesscreditreports.com $35–56 | OpenCorporates Essentials £2,250/yr for 500 calls/mo + LLM | UNVERIFIED | Low (commercial data, not people search) | SEO "cheap D&B alternative" | D&B/Experian data depth, brand | 3–4 wks | Med |
| AI visibility / GEO report | Small brands checking how AI assistants describe them | SearchEye Pro $99/mo; Geoptie $49/mo; Otterly ~$29/mo | ~$0.05–0.20/report | UNVERIFIED | Clean | SEO, Product Hunt | Incumbents already cheap | 2 wks | Med |
| SOC 2 readiness docs generator | Small SaaS pushed by enterprise buyers | Vanta/Drata/Secureframe $7.5k–25k/yr; year-1 total $25k–100k+ (strac.io) | LLM + templates | UNVERIFIED | Medium; CPA audit still required | r/SaaS, Indie Hackers | Evidence automation; audit required | 2–3 wks | Med |
| Container/image SBOM pay-per (Syft) | Dev teams needing one-off SBOMs | SCA tools | Free Syft + LLM | CRA/supply-chain pressure | Low | Dev channels | Free CLIs exist | 1–2 wks | Low |
| Website security/headers report | SMBs facing insurance/customer questionnaires | Pentests $4k+ | Free tools + LLM | UNVERIFIED | Medium; not a pentest | SEO | Depth of real scanners | 2 wks | Low |
| Domain/tech-stack history report | Acquirers, competitors | Expensive intel tools | WHOIS history APIs | UNVERIFIED | Clean if public data | SEO | Data freshness | 2 wks | Low |
| REA-assisted authorized app behaviour analysis | Security/compliance teams with own or customer binaries | High-end RE services | REA + Ghidra free | CRA + security demand | Low if authorized | Security/RE communities | Skill barrier | 3–5 wks | Low |

## Top 3 (as ranked by the model)
1. CRA SBOM + compliance pack — strongest forced purchase; near-zero delivery cost;
   upload → SBOM → LLM-drafted technical documentation + checklist; packaging and
   trust matter more than tech.
2. Automated ADA/WCAG audit report — high lawsuit volume; AI turns automated scan
   output into a readable prioritized report far cheaper than $1k–5k manual audits.
3. Binary/firmware SBOM via REA + Ghidra — real regulatory gap where source is
   unavailable; stick to Ghidra (Apache 2.0); quality on complex binaries is the risk.

## Outside-the-box idea
"CRA Article 14 early-warning + evidence pack": monitored SBOM + CVE/KEV feed +
templated ENISA notification drafts for the 24-hour early-warning obligation on
actively exploited vulnerabilities (from 11 Sep 2026). Narrower, more urgent, and
faster to build than a full compliance suite.

## Rejected (as stated)
Face search; deepfake monitoring; leak removal; vehicle history (Carfax $44.99 vs
~$10 alternatives); people search; full SOC 2 platform/audit (CPA required);
DRM/piracy/cloning; licensed professional services.

## Could not verify (as stated)
FOSSA Business list price; number of EU manufacturers in CRA scope; traffic/revenue
of cheap ADA or GEO tools; OpenCorporates self-serve tiers; whether any commercial
REA-based paid service exists at scale (none found).
