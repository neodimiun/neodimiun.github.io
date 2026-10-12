# External input: long-form report from a third model run

Provenance: pasted by the user on 12 Oct 2026 from a separate model session
(most likely Gemini Deep Research, given the format; the user did not say).
Not independently verified. No URLs were given for most figures. Several
claims conflict with other notes or look wrong (see "Coordinator review").

## Ideas as presented (condensed)

| Idea | Buyer & forcing function | Incumbent prices (as claimed) | Unit cost (as claimed) | Model's confidence |
|---|---|---|---|---|
| Medical device premarket SBOM generator (REA + headless Ghidra) | MedTech sponsors filing 510(k)/De Novo/PMA for "cyber devices" under FD&C Act §524B; FDA refuse-to-accept policy without SBOM | Consultancies (e.g. Blue Goat Cyber) $65k–150k per submission; Finite State/FOSSA $15k–50k/yr | $0.27/report; proposed price $999/device report | High |
| EU CRA micro-vendor binary dependency scanner | Small IoT/hardware makers selling into EU (Reg. 2024/2847) | Finite State, FOSSA, Interlynk: $15k–50k/yr (benchmarks, not price cards) | $0.37 | Medium |
| DMARC/BIMI enforcer for SMBs | Google/Yahoo bulk-sender authentication rules | dmarcian Basic $24/mo, Plus $240/mo, Enterprise $600/mo; Valimail $5k/yr floor | $0.014/domain/mo; proposed $5/domain/mo or $49 one-time | High |
| E-commerce ADA code remediator (axe-core + LLM-generated Liquid/HTML patches, no overlay) | Shopify/WooCommerce merchants facing Title III suits | accessiBe $490–3,990/yr; UserWay $490–1,490/yr; manual audits $1,250–5,000 | $0.13; proposed $149 per site package | High |
| Proprietary binary file/format migration utility (REA) | Migration teams leaving legacy vertical software | RE consultancies $150–350/hr | $0.22 | Medium |
| SOC 2 continuous evidence collector for micro-ISVs | Bootstrapped SaaS blocked by security questionnaires | Vanta $10k–30k/yr; Drata $9k–34k/yr; Sprinto ~$15k/yr | $0.08 | Medium |
| CCPA/CPRA privacy-request automation (Shopify app) | Mid-market DTC merchants | OneTrust/Ketch $5k–25k+/yr | $0.04 | Medium |
| Desktop/mobile secret-leak auditor (REA on Electron ASAR / APK) | Indie devs shipping compiled apps | NowSecure/Appknox $2.5k–10k per scan | $0.10 | High |

Out-of-category idea: FMCSA Drug & Alcohol Clearinghouse automation for small
trucking fleets (1–15 trucks). Claims: 49 CFR §382.701 requires pre-employment
and annual queries; $1.25 federal fee per query; owner-operators must designate
a Consortium/Third-Party Administrator (C/TPA) to query on their behalf;
incumbent C/TPAs (Foley, DATCO) charge $50–150/driver/yr, often bundled with
$250–400/yr drug-testing consortium fees; proposed price $10/driver/yr; leads
from FMCSA SAFER/registration data.

Licensing claims: IDA retail/Home licences bar multi-tenant/hosted use; an IDA
OEM licence is required for SaaS backends. JEB: Android $1,200/yr, Pro
$2,000/yr, Pro Floating $4,000/yr/seat, JEB Server $8,000/yr/instance for
headless/server pipelines. Hopper: commercial desktop use allowed, but
multi-tenant headless server use conflicts with per-seat terms (unverified).
Architecture suggestion: ship REA/Ghidra as a client-side CLI so analysis runs
on the customer's machine with their own credentials — no hosting of customer
binaries, no data-residency issues, no engine-licence exposure for the operator.

Rejected by the model: EU AI Act conformity scanner (standards unfinished,
liability), IDA-backed hosted disassembly (licence), automated SOC 2 attestation
(CPA required), unofficial private-API proxies for closed SaaS (CFAA/ToS/DMCA).

## Coordinator review (for the report writer)

Use this report as a source of leads, not facts. Specific problems:

1. False precision on unit economics: per-report costs like "$0.271" and "99%
   gross margin" ignore human review, support, customer acquisition, liability
   (E&O) insurance and sales cycles. It also prices LLM work with "Claude 3.5
   Sonnet", a retired model — the figures are not current.
2. Apples-to-oranges comparison in the medtech idea: the $65k–150k consulting
   packages cover the whole premarket cybersecurity submission (threat
   modelling, risk assessment, architecture, testing, postmarket plans), of
   which the SBOM is one part. A $999 SBOM does not "undercut by 98%". Device
   makers also usually have their own source, so binary analysis matters mainly
   for third-party/off-the-shelf components. Trust and liability for a
   regulated FDA submission from a solo vendor are a major barrier. Cross-check
   against rea_security_compliance.md (which covers FDA §524B).
3. Google Trends percentages (+85%, +320%, +40%, +60%) are unsourced; treat as
   unverified.
4. DMARC: the "price cliff" gap is weak — free DMARC monitoring already exists
   (e.g. Cloudflare DMARC Management, Valimail Monitor, EasyDMARC/Postmark free
   tiers; verify current status). dmarcian tier prices unverified.
5. ADA: the cited DOJ rule (28 CFR §35.200) is Title II (state/local
   government), not Title III commerce; the model concedes courts only borrow
   the standard. Cold emails telling merchants about their "legal exposure"
   must avoid compliance/lawsuit-protection claims (FTC accessiBe order).
   Consistent with smb_b2b_undercut_plays.md otherwise.
6. Secret-leak auditor: scanning OTHER people's public releases for secrets and
   emailing them is unauthorized analysis of third-party software — contradicts
   the "customer-owned software only" rule; also crowded (GitGuardian,
   TruffleHog). Only the opt-in "scan your own build" version is clean.
7. FMCSA idea — promising but with factual problems:
   - "Failure to log queries results in automatic CDL downgrades" is wrong as
     stated: Clearinghouse-II (compliance date 18 Nov 2024) downgrades drivers
     who are in prohibited status for drug/alcohol violations; carrier query
     failures lead to civil penalties, not driver downgrades.
   - Owner-operators must also belong to a random drug/alcohol testing
     consortium, which involves collection sites, labs and MROs — it is an
     operational service, not pure software, so the "unbundled $10/driver"
     pitch may not satisfy their whole obligation.
   - "Headless Playwright against the FMCSA portal" would automate a federal
     login.gov-protected system; check terms of use and whether official bulk
     query upload exists instead.
   - Incumbent prices ($50–150/driver/yr) unverified.
   Verdict: a real compliance-forced niche worth a verification pass, but not
   "3 weeks, no human ops".
8. Legal framing overstated: 17 U.S.C. §1201(f) is an exception to the
   anti-circumvention rules, not a general shield — copyright fair use and
   contract (EULA anti-RE clauses, enforceable per Bowers v. Baystate) still
   apply (see rea_legacy_interop.md). "Complete legal certainty" is not
   accurate.
9. Useful and consistent with other notes: Ghidra-only stack for any hosted
   service; IDA/JEB licence limits; the client-side CLI architecture (run on the
   customer's machine) as a way to avoid holding customer binaries.
