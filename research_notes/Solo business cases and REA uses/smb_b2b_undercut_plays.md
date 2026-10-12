# B2B/SMB products overpriced relative to their 2026 delivery cost: undercut plays for a solo builder

Scope: B2B tools and services sold to small businesses, indie developers and creators (US/EU), as of October 2026. Excluded: anything that needs a professional license to deliver (law, CPA attestation), biometric products and people-search. Consumer pay-per-report products are covered elsewhere.

Source-quality caveat (applies throughout): Many incumbents (Vanta, Drata, Birdeye, Podium, Conveyor) sell by quote only. Most price figures below therefore come from third-party price trackers (CostBench, Vendr, SpendHound) or from competitor blogs that have an incentive to make the incumbent look expensive. Every finding below is marked by source type, and where sources disagree the disagreement is stated.

---

## 1. Which compliance-forced purchases are overpriced relative to their delivery cost?

### Takeaway
The strongest "must-buy" demand is in **website accessibility** (about 3,100 federal website suits in 2025, or roughly 4,000–4,900 once state courts are counted; the European Accessibility Act has been in force since June 2025; ADA Title II deadlines now fall in 2027 and 2028) and **US privacy/cookie consent** (20 state laws in effect, and California enforcement aimed at broken cookie banners and at ignoring Global Privacy Control). In both markets the incumbents charge for human audit labour or per-subpage SaaS tiers, while automated delivery costs cents. SOC 2 platforms are expensive ($7.5k–$15k a year before the audit), but trust in the category was shaken by the March 2026 Delve scandal, which makes it a high-liability play. PCI SAQ A script monitoring lost its forced demand in January 2025. The EU AI Act Article 50 obligations have applied since 2 August 2026, but enforcement has not yet been tested.

### Cited Findings

**A. Website accessibility (ADA Title III / Title II, EAA)**

*Demand and lawsuits*
- Seyfarth Shaw counted **3,117 federal website-accessibility lawsuits in 2025**, up 27% from 2,452 in 2024. Total federal ADA Title III suits (all types) were **8,667** in 2025 — [Seyfarth ADA Title III blog via search summary](https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/)
- EcomBack counted **3,948** website lawsuits in 2025 (federal plus state portals), +23.84% over 2024 (3,188) — [EcomBack 2025 annual report](https://www.ecomback.com/annual-2025-ada-website-accessibility-lawsuit-report)
- UsableNet counted **4,928** digital-accessibility lawsuits in federal and state courts by the end of 2025 — [UsableNet 2026 trends blog](https://blog.usablenet.com/ada-web-lawsuit-trends-2026); [UsableNet tracker](https://info.usablenet.com/ada-website-compliance-lawsuit-tracker). One secondary summary cites 4,605 (+12%) "federal-only," which conflicts with UsableNet's own framing — [beaccessible.com](https://beaccessible.com/post/web-accessibility-statistics/)
- Small businesses are the main targets. UsableNet's 2025 midyear data reportedly found that only 36% of sued companies had more than $25M in revenue (up from 33% in 2024), so roughly two-thirds were below $25M. This is a secondary report — [Newswire release](https://www.newswire.com/news/digital-accessibility-lawsuits-surge-in-2025-22618502). TestParty, citing Seyfarth, says 67% of 2024 suits targeted companies under $25M, and another TestParty post claims 77% for 2025. TestParty sells remediation, so these figures conflict and are vendor-sourced — [TestParty](https://testparty.ai/blog/ada-lawsuit-trends-ecommerce-2025-2026-data)
- About 70% of 2025 web suits targeted e-commerce, and 46% of federal cases involved repeat defendants (secondary, citing UsableNet) — [TestParty e-commerce data](https://testparty.ai/blog/ada-lawsuit-trends-ecommerce-2025-2026-data)
- In August 2026, 108 of 432 defendants had been sued before, and 134 of the 432 were running a third-party accessibility widget when sued (secondary, citing the UsableNet tracker) — [TestParty widget data](https://testparty.ai/blog/accessibility-widget-lawsuit-data); [UsableNet tracker](https://info.usablenet.com/ada-website-compliance-lawsuit-tracker)

*Overlay controversy and regulatory risk*
- The FTC finalized its order against accessiBe in **April 2025** by a 3-0 vote. The order requires a **$1M** payment and bars accessiBe from claiming that its automated product can make any website WCAG-compliant without substantiation. It also bars presenting paid reviews as independent — [FTC](https://www.ftc.gov/node/88115); [Data Privacy + Security Insider, Apr 2025](https://www.dataprivacyandsecurityinsider.com/2025/04/ftc-settles-with-accessibe-for-misleading-statements-about-wcag-compliance/); [TechCrunch, Jan 3 2025](https://techcrunch.com/2025/01/03/ftc-orders-ai-accessibility-startup-accessibe-to-pay-1m-for-misleading-advertising). Sources give either April 15 or April 22 as the final-approval date; MLex reported it on April 22.
- A class action over the UserWay overlay was reported as advancing in 2026 (headline only, not verified in detail) — [accessibility.build](https://accessibility.build/blog/overlay-lawsuits-2026-userway-class-action)
- AudioEye's 2026 litigation report reportedly found that 38.5% of businesses sued in 2025 already had some accessibility solution, usually an overlay (secondary, not verified against the report) — [ratedwithai AudioEye review](https://ratedwithai.com/blog/audioeye-review-2026)

*Incumbent pricing*
- Overlays: UserWay bundles cost $49–$249/month, or $490/year for up to 100k pageviews — [ratedwithai UserWay](https://ratedwithai.com/blog/userway-pricing-review-2026). AudioEye is listed from $45/month by one source and at $199–$799/month by another (the two conflict) — [ratedwithai AudioEye pricing](https://ratedwithai.com/blog/audioeye-pricing-2026)
- Manual audits: Accessible.org charges **$100–$250 per primary page or screen** and $25–$100 per light page — [Accessible.org pricing](https://accessible.org/pricing/). A mid-market manual WCAG audit runs **$5,000–$25,000**, while automated scanners cost $0–$500/month and catch only about 30–40% of WCAG issues — [WebAbility (vendor)](https://www.webability.io/blog/wcag-audit-cost). Another source gives $75–$500 per page, $1,500–$5,000 for a small-site audit and $10k–$25k for enterprise — [Beancount.io guide, Sep 2026](https://beancount.io/pt/blog/2026/09/14/web-accessibility-audit-vpat-consultancy-bookkeeping-pricing-remediation-guide)
- VPAT/ACR documents: Accessible.org charges $350 (WCAG edition), $550 (Revised 508), $650 (EN 301 549) and $950 (INT), plus a separately priced audit — [Accessible.org cost of a VPAT](https://accessible.org/cost-vpat/). An ACR is a vendor self-attestation, not a certification — [LoadFocus glossary](https://loadfocus.com/glossary/acr-in-accessibility). University buyers now score ACRs: the University of Vermont's June 2026 rubric requires VPAT 2.5 (template 2.4 is no longer accepted), an update within the last 24 months, and asks whether an independent party produced it — [UVM Padlet ACR evaluation, Jun 2026](https://www.uvm.edu/d10-files/documents/2026-06/Padlet-ACR-Evaluation-June-2026-ACH.pdf)

*Regulatory timeline*
- DOJ issued an **interim final rule on April 20, 2026** that moved the Title II (state and local government) web and app compliance dates to **April 26, 2027** for entities serving 50,000+ people and **April 26, 2028** for smaller entities. The standard is still WCAG 2.1 AA — [Reed Smith](https://www.reedsmith.com/articles/doj-extends-digital-accessibility-compliance-dates-under-title-ii-of-the-ada/); [Consumer Financial Services Law Monitor](https://www.consumerfinancialserviceslawmonitor.com/2026/04/doj-extends-title-ii-ada-web-accessibility-rule-compliance-deadlines-for-state-and-local-governments/). Among DOJ's stated reasons were "slower-than-expected technological solutions (including limits of generative artificial intelligence for remediation)" — [same](https://www.consumerfinancialserviceslawmonitor.com/2026/04/doj-extends-title-ii-ada-web-accessibility-rule-compliance-deadlines-for-state-and-local-governments/)
- Jackson Lewis notes that HHS's separate **May 2026** web-accessibility deadline (for recipients of HHS funding) was *not* extended — [Jackson Lewis](https://www.jacksonlewis.com/insights/doj-extends-public-entities-compliance-deadline-ada-related-website-accessibility-hhss-may-2026-deadline-still-looms)
- EAA: vendor guides report that, as of June 2026, **no EAA-specific fines had been publicly confirmed**. Enforcement starts with a complaint, then a correction order — [WebYes](https://www.webyes.com/blogs/eaa-fines/); [Auditsu](https://auditsu.com/resources/european-accessibility-act-fines). A Lille court reportedly dismissed a French EAA claim against Auchan E-Commerce on 6 May 2026 on a turnover threshold (secondary) — [Plaintest](https://www.plaintest.dev/blog/eu-accessibility-act-enforcement-2026/). Service providers with fewer than 10 employees **and** under €2M turnover are exempt — [TrustYourWebsite](https://trustyourwebsite.com/eu/en/guides/eaa-penalties). Maximum fines vary by country (Germany is commonly cited at €100k, Spain at up to €1M); these are unverified against primary law — [web-accessibility-checker.com](https://web-accessibility-checker.com/en/blog/eaa-fines-by-country)

**B. Cookie consent / US state privacy / GPC**
- **20 US states** had comprehensive privacy laws in effect as of August 2026, per Enzuzo's tracker; Oklahoma and Alabama follow in 2027 — [Enzuzo tracker](https://www.enzuzo.com/blog/us-state-privacy-laws). Indiana, Kentucky and Rhode Island took effect on Jan 1, 2026. Penalties are up to $7,500 per violation (IN, KY) and $10,000 (RI). RI has no cure period — [Koley Jessen](https://www.koleyjessen.com/insights/publications/new-state-privacy-laws-effective-january-1-2026-indiana-kentucky-and-rhode-island)
- California enforcement has repeatedly targeted cookie and opt-out mechanics:
  - American Honda: $632,500 (Mar 2025, CPPA), cited for an "asymmetric cookie tool" and excess verification
  - Healthline: $1.55M (Jul 2025, AG); its consent banner did not actually disable tracking
  - Tractor Supply: $1.35M (Sep 2025, CPPA), for having no working opt-out
  - Disney: $2.75M (Feb 2026), for opt-outs, including GPC, that did not carry across devices
  - PlayOn Sports: $1.1M, for ignoring opt-out preference signals
  - General Motors: $12.75M (May 2026), for selling driving data — the largest CCPA penalty to date

  Sources: [Privisy tracker](https://www.getprivisy.com/enforcement); [Troutman Privacy on Disney, Feb 2026](https://www.troutmanprivacy.com/2026/02/california-ag-announces-largest-ccpa-enforcement-settlement-to-date/); [UniConsent on Disney/GPC](https://www.uniconsent.com/blog/disney-ccpa-fine-global-privacy-control); [privacyterms.io statistics](https://privacyterms.io/ccpa-enforcement-statistics-2026). Trackers put cumulative CCPA penalties at about $23–25M — [privacyterms.io](https://privacyterms.io/ccpa-enforcement-statistics-2026)
- On Aug 6–7, 2026, the CPPA board reportedly voted to begin rulemaking that would explicitly name GPC in the CCPA regulations (secondary) — [Ketch blog](https://www.ketch.com/blog/posts/gpc-compliance-gap)
- EU ad-tech forcing function: since **16 Jan 2024**, sites serving personalised Google ads to EEA/UK users must use a **Google-certified CMP integrated with IAB TCF** (Switzerland since 31 Jul 2024). Google reportedly requires TCF v2.3 consent strings from 1 Mar 2026, and only about 30–40 CMPs were certified in early 2026 — [FlexyConsent (vendor)](https://flexyconsent.com/blog/google-certified-cmp-list-requirements/). Advertisers who use Google Ads/GA4 with EEA traffic need Consent Mode v2, which does not require a certified CMP — [ConsentBit](https://www.consentbit.com/blog/do-you-need-a-google-certified-cmp-what-googles-requirement-actually-means)
- Incumbent pricing: Cookiebot (Usercentrics) has a free tier for one domain with 50 subpages, and Premium tiers of **€7 / €15 / €30 / €50 / €90 per month per domain, set by subpage count**. Subdomains are billed separately and there are no volume discounts — [ConsentStack](https://www.consentstack.io/blog/cookiebot-pricing); [Consently review](https://consently.net/blog/cookiebot-review)

**C. GDPR / US DSAR handling**
- Enterprise DSAR/privacy platforms are reported at **$200k–$500k+/yr (OneTrust)** and **$150k–$300k/yr (DataGrail)**. The SMB tool Reform is listed at $35/month (vendor blog, low reliability) — [Reform blog](https://www.reform.app/blog/top-tools-dsar-timeframe-management)
- An EU vendor blog puts SMB (10–50 employee) GDPR platforms at €1,500–6,000/yr and manual handling at **€100–1,500+ per DSAR** — [Legiscope](https://www.legiscope.com/blog/gdpr-software-pricing-company-size.html)

**D. SOC 2 readiness (Vanta, Drata, etc.)**
- Vanta and Drata are quote-only. Third-party estimates put a startup SOC 2-only tier at about **$7,500–$15,000/yr for Drata** and about **$10,000/yr for Vanta Core**. Auditor fees are extra: $8k–$25k for Type II, or $2.5k–$7.5k for a security-only Type I through partner auditors. Cheaper competitors include Sprinto (~$6k/yr) and Strike Graph (from $10k/yr) — [soc2auditors.org](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/); [SecureLeap](https://www.secureleap.tech/blog/vanta-review-pricing-top-alternatives-for-compliance-automation); [Vendr Drata](https://www.vendr.com/marketplace/drata). All-in first-year estimates range from about $10k to $55k depending on the source — [Cipherssecurity](https://cipherssecurity.com/vanta-vs-drata-pricing-2026/)
- **Delve scandal (Mar 2026):** an anonymous investigation alleged that YC-backed Delve issued near-identical SOC 2 reports (493 of 494 with the same boilerplate) through auditors traced offshore. Delve disputed the claims, and customer Lovable reportedly left — [IANS Research, Apr 2026](https://www.iansresearch.com/resources/all-blogs/post/security-blog/2026/04/19/delve-allegations-expose-weak-points-in-modern-compliance); [ComplianceHub](https://compliancehub.wiki/delve-compliance-startup-fake-soc2-audit-scandal/); [Workplace Privacy Report, May 2026](https://www.workplaceprivacyreport.com/2026/05/articles/governance-risk-and-compliance-2/the-delve-scandal-why-a-soc-2-report-cant-be-a-check-the-box-exercise-for-vendor-management/). These are allegations, not adjudicated findings.
- Adjacent market, security-questionnaire automation: prices range from €299/month (Orbiq, the vendor making the claim) to $20,000+/yr for enterprise platforms (Conveyor, Loopio, SafeBase are quote-based) — [Orbiq (vendor)](https://www.orbiqhq.com/compliance-automation/security-questionnaire-software); [Vendr, Hypercomply cost drivers](https://www.vendr.com/marketplace/hypercomply)

**E. PCI DSS SAQ A (e-commerce script controls)**
- The January 2025 SAQ A revision (r1) **removed requirements 6.4.3 (payment-page script inventory), 11.6.1 (tamper detection) and 12.3.1** from SAQ A. In their place is an eligibility criterion: the merchant must confirm its site "is not susceptible to attacks from scripts." 6.4.3 and 11.6.1 still apply to SAQ D merchants and to onsite assessments — [Adyen docs](https://docs.adyen.com/development-resources/pci-dss-compliance-guide/saq-a-eligibility); [usd AG](https://www.usd.de/update-pci-saq-a-2025/). AccessIT argues that the new criterion still effectively requires the same controls — [AccessIT Group](https://www.accessitgroup.com/tag/saq-a)

**F. EU AI Act Article 50 (AI transparency labeling)**
- The Article 50 transparency duties (chatbot disclosure, deepfake labeling, machine-readable marking of synthetic content) **took effect on 2 August 2026 and were not deferred by the Digital Omnibus**. High-risk Annex III obligations moved to 2 Dec 2027 — [Cloud Security Alliance note, Jul 29 2026](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-article-50-transparency-20260729/); [Usercentrics](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
- Generative systems already on the market before 2 Aug 2026 have until **2 Dec 2026** to add machine-readable marking — [CSA watermarking note](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-article50-watermarking-deadline/). The Commission says no single technique suffices and recommends a multi-layered approach (metadata plus watermarking) — [Paul, Weiss](https://www.paulweiss.com/insights/client-memos/eu-finalises-transparency-rules-for-ai-generated-content). Final Art. 50 guidelines were reportedly adopted on 20 July 2026 — [Legalithm (secondary)](https://www.legalithm.com/en/blog/eu-ai-act-what-applies-2-august-2026)

**G. App Store privacy labels / Google Play Data Safety**
- A Mozilla study (Feb 2023, older figure) found that **nearly 80% of the Data Safety labels for 40 top apps were false or misleading**, with 16 of 40 rated "Poor." Google's position is that developers "are responsible for making complete and accurate declarations" — [TechCrunch, Feb 2023](https://techcrunch.com/2023/02/23/popular-android-apps-play-store-privacy-labels-dont-match-up-to-their-claims-mozilla-says); [Gizmodo](https://gizmodo.com/google-play-store-privacy-labels-failure-mozilla-study-1850142302)

### Inferences
- **Accessibility is the clearest case of "customers must buy, incumbents overcharge."** The incumbent offers are (a) $5k–25k human audits or (b) $490–$9.6k/yr overlays that the FTC and lawsuit data have discredited. The automatable middle is largely unserved at SMB prices: continuous scanning, source-level fix suggestions, an accessibility statement and a VPAT/ACR draft. The FTC accessiBe order is the main constraint. Selling "compliance," "lawsuit protection" or "100% WCAG" is now a demonstrated regulatory risk. A solo product must be sold as monitoring plus fix tooling plus documentation, with explicit limits.
- **VPAT/ACR drafting for small B2B SaaS** is a sharp sub-niche. ACRs are self-attestations, and buyers such as universities demand VPAT 2.5 refreshed every 24 months. Title II deadlines in 2027 and 2028 will make public buyers demand ACRs from small SaaS vendors. Incumbents bundle a $350–$950 document on top of a multi-thousand-dollar audit.
- **Cookie consent and GPC demand is real, but the market is crowded.** Enforcement shows the actual failure mode is banners that do not really block trackers or honor GPC (Healthline, Honda, PlayOn). A product that verifies blocking and GPC behavior with a headless-browser test is differentiated from banner generators. Serving EEA publishers that run personalised ads requires Google CMP certification and IAB TCF, which is a real barrier to entry. A solo builder should target US state-law and GPC SMBs and EEA advertisers (who only need Consent Mode v2) first.
- **SOC 2: the price gap is real, but liability and trust dominate after Delve.** A solo builder should stay on the readiness side (policy templates, evidence collection, questionnaire answering) and never touch or imply attestation, which is CPA-licensed work and excluded.
- **PCI script monitoring** lost much of its forced SMB demand when SAQ A dropped 6.4.3 and 11.6.1. It is now an "assurance" sale, not a must-buy. This is a lower priority.
- **AI Act Art. 50 labeling kit** (a disclosure widget plus C2PA/metadata stamping SDK for small EU AI apps) is timely, with the Dec 2, 2026 marking deadline for existing systems. However, no fines have been reported, there are no SMB demand data, and the "technical standard" is still multi-layered and vague. It is speculative.
- **App-store label and Data Safety generators** solve a real accuracy problem, but buyers are indie devs with low willingness to pay and no regulator-driven penalty data was found. This is best as a free lead magnet for a privacy-policy or consent product.
- **DSAR tooling for SMBs** is already cheap at the low end ($35/mo). Most US state laws have applicability thresholds, so SMB demand is thin; GDPR is the more relevant driver.

### Gaps
- Primary UsableNet and Seyfarth reports could not be fetched (DNS failure from this environment), so the e-commerce share, under-$25M share and repeat-defendant percentages are from secondary sources, some of them remediation vendors.
- No confirmed EAA fines were found. The €25k Dutch fine reported by one blog is unverified.
- Not verified: the details of the HHS Section 504 web rule (exact scope, the 15-employee threshold, small-entity date) beyond Jackson Lewis's headline.
- No Termly, iubenda, CookieYes or OneTrust SMB pricing was retrieved. The claim that the CMP market is "crowded with free/cheap plugins" is my inference, not a sourced fact.
- No pricing was retrieved for PCI client-side script-monitoring vendors (Jscrambler, Feroot, c/side, Source Defense, Report URI).
- No market-size data was found for AI Act Art. 50 labeling tools, and no SMB adoption data.
- No published revenue was found for Vanta or Drata in this pass.

---

## 2. Which developer and indie tools are overpriced relative to their delivery cost (status pages, transactional email, e-signature)?

### Takeaway
These are the clearest cost gaps. DocuSign's effective price is about $3.60 per envelope on Standard, Statuspage charges $99–$399/month for what is mostly static hosting plus notification email, and SES sends email at $0.10 per 1,000. But none of these purchases is compliance-forced, the categories are already full of cheap and open-source challengers, and the incumbents' moats are trust and network effects (DocuSign brand, email deliverability reputation) rather than cost. They are weaker solo plays than the compliance categories.

### Cited Findings
**Status pages**
- Atlassian Statuspage: Hobby **$29/mo** (1 team member, 250 subscribers), Startup **$99/mo** (5 members, 1,000 subscribers), Business **$399/mo** (5,000 subscribers), Enterprise custom. Private pages run $79–$1,499+/mo and audience-specific pages start at $300/mo — [Hyperping (competitor)](https://hyperping.com/blog/statuspage-pricing); [CostBench](https://costbench.com/software/network-monitoring/atlassian-statuspage/)
- Common complaints are subscriber-based cost scaling, a mandatory Atlassian account, "premium prices for a communication-only tool," and no self-hosting — [OneUptime (competitor)](https://oneuptime.com/blog/post/2026-03-10-best-statuspage-alternatives/view); [CostBench alternatives](https://www.costbench.com/software/network-monitoring/atlassian-statuspage/alternatives/)

**Transactional email**
- Twilio **retired the SendGrid free plan starting May 27, 2025**. Paused sending followed for free accounts after 60 days, and new signups get a 60-day trial capped at 100 emails/day — [Twilio changelog](https://static1.twilio.com/en-us/changelog/sendgrid-free-plan); [Bubble forum PSA](https://forum.bubble.io/t/psa-sendgrid-ending-their-free-tier-plan/374463). Paid plans start at **$19.95/mo**, and Pro at $89.95/mo — [Dreamlit](https://dreamlit.ai/blog/best-sendgrid-alternatives)
- Postmark costs **$15/mo for 10,000 emails**, plus $1.80 per additional 1,000 — [Dreamlit](https://dreamlit.ai/blog/postmark-vs-sendgrid)
- Delivery cost: Amazon SES à la carte is **$0.10 per 1,000 emails**, with a dedicated IP at $24.95/month. AWS added bundled Essentials/Pro/Enterprise plans on 21 July 2026 ($0.16–$0.23 per 1,000 plus fixed fees); à la carte is still available — [dev.to SES 2026 plans](https://dev.to/mr_manushukla/amazon-ses-pricing-plans-in-2026-essentials-vs-pro-vs-enterprise-and-when-a-la-carte-still-wins-1ohg); [CloudBurn](https://cloudburn.io/blog/amazon-ses-pricing)

**E-signature**
- DocuSign (third-party verified July 2026): **Personal $11/mo (5 envelopes/month), Standard $30/user/mo, Business Pro $45/user/mo**. Standard is capped at **100 envelopes per user per year**. SMS delivery costs $0.36 each and ID verification $2.40 per attempt — [AutomationAtlas](https://automationatlas.io/answers/docusign-pricing-explained-2026/); [PulseSignal](https://getpulsesignal.com/pricing/docusign). Standard reportedly rose from $25 to $30/user/mo, and some 2026 pages still show $25 — [Signeasy (competitor)](https://signeasy.com/blog/business/docusign-pricing)

### Inferences
- Effective DocuSign Standard cost is $30 × 12 / 100 envelopes, or about **$3.60 per envelope**. The marginal delivery cost of an envelope (storage plus a few emails at SES rates) is well under a cent. ESIGN/UETA validity does not depend on the vendor, so the moat is brand trust, enterprise integrations and buyer inertia. A solo builder can undercut, but many cheap and open-source challengers already exist (not researched in depth here). The best angle is vertical (for example, e-sign built into a niche workflow) rather than horizontal.
- Statuspage at Startup tier ($99/mo, 1,000 subscribers) delivers a static page plus a few thousand notification emails a month, which costs under $1 at SES rates. The gap is enormous, but the category is saturated with monitoring vendors that bundle status pages. Low priority.
- Transactional email: SES is about 15x cheaper per message than Postmark's overage rate. However, deliverability and IP reputation are the product, and a solo builder carries abuse and spam liability. Not recommended as a standalone play.

### Gaps
- No primary Indie Hackers or Starter Story revenue disclosures were found for status-page, e-sign or email challengers (searches returned generic listicles). One self-reported solo founder shows about $7k MRR for a portfolio including a website security scanner — [MRRStory](https://www.mrrstory.com/stories/this-indie-hacker-reached-6772-mrr-with-just-20day-meta-ads). This is weak evidence.
- Hacker News and Reddit pricing-backlash threads for DocuSign and Statuspage were not fetched directly.
- Invoicing and appointment booking were not researched in this pass.

---

## 3. Which local-business tools are overpriced (review management, Google Business Profile, call tracking)?

### Takeaway
Review management is the largest ratio of price to delivery cost found in this research. Birdeye charges $299–$449 per location per month, while LLM-drafted review replies cost a fraction of a cent each. The incumbent shows customer-hostile contract terms, and the FTC's Consumer Review Rule (with warning letters in December 2025) creates "compliant review solicitation" as a selling point. Call tracking also has a large gap (CallRail at $50–$195/mo plus usage, after 2026 price increases, versus about $1.15/number/month and $0.0085/min on Twilio), but it is harder to build.

### Cited Findings
**Review management / GBP**
- Birdeye (third-party): **Starter $299, Growth $349, Dominate $449 per location per month**, billed annually, with no month-to-month option and no free trial. The top plan was cut from $499 to $449 in **Feb 2026** — [CostBench Birdeye vs Podium](https://www.costbench.com/compare/birdeye-vs-podium/); [CostBench changelog](https://www.costbench.com/changelog/birdeye-price-decrease-2026-02/)
- Podium is listed at **$399–$599/month** (Core/Pro) — [CostBench](https://www.costbench.com/compare/birdeye-vs-podium/)
- Hidden costs (aggregator estimates, not vendor-confirmed): onboarding $500–$1,500 per location, add-ons $50–$150/mo each, and an ~8% "Innovation Fee" at renewal — [CostBench Birdeye hidden costs](https://costbench.com/software/review-management/birdeye/hidden-costs/)
- Backlash: Birdeye's Trustpilot score is **1.7/5 (25 reviews)** versus 4.2/5 (26) for Podium. Reviewers report cancellations submitted before renewal not being honored, and poor support after onboarding. Podium complaints cite aggressive upselling — [CostBench](https://www.costbench.com/compare/birdeye-vs-podium/)
- FTC Consumer Review Rule (16 CFR 465), fully effective October 2024: it bans review suppression, "gating mechanisms" that hide negative feedback, and sentiment-conditioned incentives. On **Dec 22, 2025** the FTC sent warning letters to 10 companies citing civil penalties of up to **$53,088 per violation** — [Arnold & Porter, Jan 2026](https://www.arnoldporter.com/en/perspectives/blogs/consumer-products-and-retail-navigator/2026/01/ftc-warning-letters-over-consumer-review-rule); [Kelley Drye](https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/ftc-warns-companies-of-potential-violations-of-the-consumer-review-rule). One firm argues that each day a violation continues may count separately (an interpretation) — [KJK, Aug 2026](https://kjk.com/2026/08/06/ftc-consumer-review-rule-enforcement-what-businesses-need-to-know/). Targets reportedly included law firms and property managers — [Near Media](https://www.nearmedia.co/ftc-warning-letters-about-review-abuses-2/)
- LLM delivery cost: GPT-5.4-mini is listed at **$0.75 input / $4.50 output per 1M tokens**, and GPT-5.4-nano at $0.20 / $1.25 (June 2026; the same source says GPT-5 and GPT-5-mini were delisted) — [Morph](https://morphllm.com/openai-api-pricing)

**Call tracking**
- CallRail **restructured its plans on Apr 25, 2026** into Lead Tracking ($50), Lead Tracking Complete ($95), Lead Conversion ($150) and Lead Conversion Complete ($195). The former $45 entry tier is gone, and the top tier rose from $175 to $195 (+11.4%) — [CostBench changelog](https://costbench.com/changelog/callrail-plans-renamed-2026-04/); [CostBench price history](https://www.costbench.com/software/marketing-attribution/callrail/price-history/)
- SpendHound data (160 customers) shows SMB CallRail spend up **12.02% YoY** — [SpendHound](https://www.spendhound.com/marketplace/callrail-pricing). A competitor estimates that real-world cost lands near $135/mo once minutes, numbers and seats are included — [NextPhone (competitor)](https://www.getnextphone.com/blog/callrail-pricing)
- Delivery cost: Twilio US local numbers are **$1.15/month** and inbound local calls **$0.0085/min** (official page) — [Twilio pricing](https://www.twilio.com/en-us/phone-numbers/pricing). Transcribing calls with OpenAI gpt-4o-mini-transcribe costs about **$0.003/min** — [ConvertAudioToText](https://convertaudiototext.com/blog/speech-to-text-api-pricing-2026)

### Inferences
- **Review reply cost:** about 500 input plus 150 output tokens per review on GPT-5.4-mini comes to roughly $0.001 per drafted reply. That makes 100 replies a month about $0.10 of inference against Birdeye's $299+ per location. The main costs are Google Business Profile API access and approval, onboarding, and support. A $19–$49/location/month product with month-to-month billing, FTC-compliant (non-gated) review requests, AI reply drafts, GBP post scheduling and a monthly report is buildable in 2–6 weeks. Liability is low if the product never gates or filters reviews, and if replies are human-approved or clearly the business's own speech. The FTC rule actually gives a compliance-themed selling point ("we don't gate").
- **Call tracking cost:** a 10-number SMB pool with 1,000 inbound minutes and AI transcripts costs about $11.50 + $8.50 + $3, or roughly $23/mo, against CallRail's $95–$195 plus usage. The moat is DNI (dynamic number insertion) JavaScript, Google Ads and GA4 attribution integrations, and telecom compliance (call-recording consent, number porting). That is feasible but closer to 6+ weeks, with real liability around recording consent.
- Both categories sell well through local-marketing agencies (white-label). This is a distribution advantage for a solo builder who does not want to do SMB direct sales.

### Gaps
- No BrightLocal, Yext or GBP-management pricing was retrieved. Google Business Profile API access requirements and approval timelines were not verified.
- No primary Podium pricing page was found (quote-based). All Birdeye and Podium figures are from CostBench.
- Call-recording consent law (two-party consent states) and A2P 10DLC SMS registration costs were not researched.

---

## 4. Which content and marketing services are overpriced (captioning, localization, product photos, UGC)?

### Takeaway
Captioning and transcription show a markup of roughly 80x on the AI tier (Rev at $0.25/min versus about $0.003–0.0043/min for API delivery) and roughly 400–600x on human tiers. Compliance demand exists (ADA Title II, HHS, EAA audiovisual services), but the public-sector deadlines just slipped to 2027–2028. Website localization (Weglot at €15–€699/mo) carries an equally large LLM cost gap but no compliance driver in US/EU scope. Product photo editing and UGC/ad creative were not researched in depth.

### Cited Findings
- Rev: AI transcription and captions at **$0.25/min**. Human transcription is quoted at **$1.50 or $1.99/min** (the sources conflict). Human captions cost $1.99/min in English and $3.25/min in Spanish, and translated subtitles **$6.49–$15.99/min** — [Sonix (competitor)](https://sonix.ai/resources/rev-pricing/); [Notta review](https://www.notta.ai/en/blog/rev-review). Human service is marketed at 99% accuracy versus about 90–95% for AI — [Notta](https://www.notta.ai/en/blog/rev-review)
- API delivery cost: OpenAI **gpt-4o-mini-transcribe ≈ $0.003/min**. Deepgram Nova-3 is about **$0.0043/min batch** and $0.0077/min streaming (third-party; figures vary by tier and date) — [ConvertAudioToText](https://convertaudiototext.com/blog/speech-to-text-api-pricing-2026); [ConvertAudioToText, Deepgram](https://convertaudiototext.com/blog/deepgram-nova-3-explained)
- Weglot: **€15/mo** for 10,000 words and 1 language, with tiers at €29, €79, €299 and €699 — [Capterra](https://www.capterra.com/p/200736/Weglot/pricing/). Toolradar calls it "on the higher side" and notes word-count overage fees — [Toolradar](https://toolradar.com/tools/weglot/pricing)
- Compliance timing: Title II deadlines moved to April 2027 and 2028 — [Reed Smith](https://www.reedsmith.com/articles/doj-extends-digital-accessibility-compliance-dates-under-title-ii-of-the-ada/)

### Inferences
- **Captioning cost:** a 60-minute video costs about $0.18 in API fees, versus $15 for Rev AI or about $119 for Rev human captions. An "AI plus human QA pass" tier at about $0.40–$0.75/min, aimed at schools, municipalities, churches and podcasters, undercuts human-caption pricing by 60–80%. Liability is accuracy-related (captions that fail a WCAG audit), not legal. The moat is LMS and video-platform integrations and the procurement relationships of 3Play/Verbit (not researched). The 2027–2028 deadline slip lowers urgency, so this is a good candidate but not top three.
- **Localization cost:** translating 10k words is about 13k input and 15k output tokens, roughly $0.08 on GPT-5.4-mini, against Weglot's €15/mo for that volume. The moat is the SEO-friendly translated-subdomain proxy, CMS plugins and the translation-memory editor. The price gap is huge, but there is no forcing regulation in US/EU scope.

### Gaps
- No pricing was retrieved for DeepL API, Lokalise, Crowdin, 3Play Media or Verbit.
- Product-photo editing (remove.bg, Photoroom, Pixelcut) and UGC/ad-creative pricing were not researched. The category is likely already commoditized by AI tools, but this is unverified.
- No data was found on the volume of caption-compliance demand from small entities.

---

## 5. Which incumbents have recently raised prices or drawn pricing backlash?

### Takeaway
Documented 2025–2026 price increases or punitive changes come from Cookiebot (base Premium reportedly doubled in Aug 2025), DocuSign (Standard $25→$30), CallRail (top tier +11.4%, SMB spend +12% YoY, entry tier removed), and SendGrid (free plan retired in May 2025). Birdeye has severe contract and cancellation complaints, but it cut its top tier in Feb 2026, which suggests competitive pressure. Statuspage draws persistent complaints about subscriber-based pricing.

### Cited Findings
- **Cookiebot:** in Aug 2025 Cookiebot reportedly doubled its base Premium price and moved accounts with fewer than four domains to a pricier tier — [ConsentStack (competitor)](https://www.consentstack.io/blog/cookiebot-pricing). A Capterra reviewer reported the Small tier going from €15 to €30/month, with the pricing page not updated — [Capterra Cookiebot pricing](https://www.capterra.com/p/240030/Cookiebot/pricing/). Tiers auto-upgrade when the scanner finds more subpages, and paid users cannot manually downgrade — [Consently](https://consently.net/blog/cookiebot-review)
- **DocuSign:** Standard reportedly rose from $25 to $30/user/mo — [Signeasy](https://signeasy.com/blog/business/docusign-pricing); [AutomationAtlas](https://automationatlas.io/answers/docusign-pricing-explained-2026/)
- **CallRail:** restructured on Apr 25, 2026, the top tier rose from $175 to $195, and the $45 tier was removed — [CostBench](https://costbench.com/changelog/callrail-plans-renamed-2026-04/). SMB spend is up 12.02% YoY — [SpendHound](https://www.spendhound.com/marketplace/callrail-pricing)
- **SendGrid:** the free plan was retired starting May 27, 2025 — [Twilio changelog](https://static1.twilio.com/en-us/changelog/sendgrid-free-plan)
- **Birdeye:** Trustpilot 1.7/5, with reports of cancellations not honored before renewal. The top plan was cut from $499 to $449 in Feb 2026 — [CostBench](https://www.costbench.com/compare/birdeye-vs-podium/); [CostBench changelog](https://www.costbench.com/changelog/birdeye-price-decrease-2026-02/)
- **Statuspage:** complaints about subscriber-based cost scaling and the mandatory Atlassian account — [OneUptime](https://oneuptime.com/blog/post/2026-03-10-best-statuspage-alternatives/view)
- **SOC 2:** the Delve scandal (Mar 2026) produced backlash against cheap "SOC 2 as a service." This is backlash against cheapness, not against price — [IANS](https://www.iansresearch.com/resources/all-blogs/post/security-blog/2026/04/19/delve-allegations-expose-weak-points-in-modern-compliance); [Blake Oliver](https://www.blakeoliver.com/blog/fake-soc2-reports)

### Inferences
- Price increases in compliance-adjacent SMB tools (Cookiebot) produce the most switching intent, because the customer cannot cancel the category, only the vendor. That is the ideal setup for a "same thing, flat price" challenger.
- The SOC 2 backlash cuts the opposite way. In audit-adjacent categories, being cheap is now a reputational liability, so undercutting there needs visible rigor rather than a low price alone.

### Gaps
- Hacker News and Reddit threads were not fetched directly. All backlash evidence here is from review sites and price trackers.
- No price-increase evidence was found for Postmark, Vanta or Drata. Podium's price history was not found.

---

## 6. Candidate list (13 candidates) and the 3 most promising for a solo builder

### Takeaway
Of 13 candidates, the three best fits are: (1) an accessibility "fix, don't overlay" monitor plus VPAT/ACR and accessibility-statement generator for Shopify/WordPress SMBs and small B2B SaaS; (2) flat-priced, FTC-compliant review and Google Business Profile automation for local businesses, sold through agencies; and (3) a US-state-law cookie consent and GPC tool that verifies blocking, priced flat to undercut Cookiebot. All three have recurring revenue, a 2–6 week MVP, low marginal cost and documented demand. Accessibility and cookie consent are also compliance-forced. Liability control rests mainly on never promising "compliance" or "lawsuit protection," the claim the FTC penalized in the accessiBe order.

### Cited Findings
(Each row's facts are sourced in sections 1–5. Prices are third-party unless noted.)

| # | Candidate | Incumbent price (sourced) | Delivery cost basis (sourced) | Demand driver (sourced) | Incumbent moat / why not already cheap |
|---|---|---|---|---|---|
| 1 | Accessibility monitoring + source-level fixes + statement | Audits $5k–$25k ([WebAbility](https://www.webability.io/blog/wcag-audit-cost)); $100–$250/page ([Accessible.org](https://accessible.org/pricing/)); overlays $49–$249/mo ([ratedwithai](https://ratedwithai.com/blog/userway-pricing-review-2026)) | Automated scans catch ~30–40% of issues ([WebAbility](https://www.webability.io/blog/wcag-audit-cost)); LLM $0.75/$4.50 per M tokens ([Morph](https://morphllm.com/openai-api-pricing)) | 3,117 federal suits in 2025 ([Seyfarth](https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/)); EAA; FTC overlay order ([FTC](https://www.ftc.gov/node/88115)) | Manual-testing labor; legal trust; DOJ notes the limits of GenAI remediation ([CFS Law Monitor](https://www.consumerfinancialserviceslawmonitor.com/2026/04/doj-extends-title-ii-ada-web-accessibility-rule-compliance-deadlines-for-state-and-local-governments/)) |
| 2 | VPAT/ACR drafting for small SaaS | $350–$950 per document plus audit ([Accessible.org](https://accessible.org/cost-vpat/)) | Self-attestation ([LoadFocus](https://loadfocus.com/glossary/acr-in-accessibility)) | Universities require VPAT 2.5 within 24 months ([UVM](https://www.uvm.edu/d10-files/documents/2026-06/Padlet-ACR-Evaluation-June-2026-ACH.pdf)); Title II 2027/2028 ([Reed Smith](https://www.reedsmith.com/articles/doj-extends-digital-accessibility-compliance-dates-under-title-ii-of-the-ada/)) | Buyers may prefer an "independent party" ([UVM](https://www.uvm.edu/d10-files/documents/2026-06/Padlet-ACR-Evaluation-June-2026-ACH.pdf)) |
| 3 | Cookie consent + GPC + US state banner | Cookiebot €7–€90/domain/mo, doubled Aug 2025 ([ConsentStack](https://www.consentstack.io/blog/cookiebot-pricing)) | CDN-served JS (inferred) | 20 state laws ([Enzuzo](https://www.enzuzo.com/blog/us-state-privacy-laws)); Honda, Healthline, Disney, PlayOn fines ([Privisy](https://www.getprivisy.com/enforcement)) | Google CMP certification and IAB TCF for EEA publishers ([FlexyConsent](https://flexyconsent.com/blog/google-certified-cmp-list-requirements/)); crowded market |
| 4 | Review mgmt / GBP automation | Birdeye $299–$449/location/mo; Podium $399–$599 ([CostBench](https://www.costbench.com/compare/birdeye-vs-podium/)) | LLM tokens ([Morph](https://morphllm.com/openai-api-pricing)) | FTC Consumer Review Rule letters ([Arnold & Porter](https://www.arnoldporter.com/en/perspectives/blogs/consumer-products-and-retail-navigator/2026/01/ftc-warning-letters-over-consumer-review-rule)) | Sales-led bundles (messaging, payments); onboarding; GBP API access |
| 5 | Call tracking lite + AI call summaries | CallRail $50–$195/mo + usage ([CostBench](https://costbench.com/changelog/callrail-plans-renamed-2026-04/)) | Twilio $1.15/number, $0.0085/min ([Twilio](https://www.twilio.com/en-us/phone-numbers/pricing)); $0.003/min STT ([ConvertAudioToText](https://convertaudiototext.com/blog/speech-to-text-api-pricing-2026)) | ROI-driven, not forced; +12% YoY SMB spend ([SpendHound](https://www.spendhound.com/marketplace/callrail-pricing)) | DNI, ad-platform integrations, telecom compliance |
| 6 | Captioning with AI + human QA | Rev $0.25 AI / $1.50–$1.99 human per min ([Sonix](https://sonix.ai/resources/rev-pricing/)) | $0.003–$0.0043/min ([ConvertAudioToText](https://convertaudiototext.com/blog/speech-to-text-api-pricing-2026)) | Title II/HHS ([Jackson Lewis](https://www.jacksonlewis.com/insights/doj-extends-public-entities-compliance-deadline-ada-related-website-accessibility-hhss-may-2026-deadline-still-looms)) | Accuracy guarantees, LMS integrations, procurement |
| 7 | SOC 2 readiness lite + security-questionnaire autofill | Vanta ~$10k/yr, Drata $7.5k–$15k ([soc2auditors.org](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/)); questionnaire tools to $20k+/yr ([Orbiq](https://www.orbiqhq.com/compliance-automation/security-questionnaire-software)) | Policy templates + LLM | Enterprise buyer demand | 100+ integrations, auditor network, post-Delve trust ([IANS](https://www.iansresearch.com/resources/all-blogs/post/security-blog/2026/04/19/delve-allegations-expose-weak-points-in-modern-compliance)) |
| 8 | E-signature (vertical) | DocuSign $30/user/mo, 100 envelopes/yr ([AutomationAtlas](https://automationatlas.io/answers/docusign-pricing-explained-2026/)) | SES $0.10/1k emails ([dev.to](https://dev.to/mr_manushukla/amazon-ses-pricing-plans-in-2026-essentials-vs-pro-vs-enterprise-and-when-a-la-carte-still-wins-1ohg)) | Not forced | Brand trust; saturated |
| 9 | Status pages | Statuspage $29–$399+/mo ([Hyperping](https://hyperping.com/blog/statuspage-pricing)) | Static hosting + SES | Not forced | Bundled by monitoring vendors; saturated |
| 10 | Website localization | Weglot €15–€699/mo ([Capterra](https://www.capterra.com/p/200736/Weglot/pricing/)) | LLM tokens ([Morph](https://morphllm.com/openai-api-pricing)) | Not forced (US/EU) | SEO proxy hosting, CMS plugins |
| 11 | AI Act Art. 50 labeling kit (disclosure widget + C2PA/metadata SDK) | Not found | Metadata stamping (inferred) | In force 2 Aug 2026; marking grace to 2 Dec 2026 ([CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-article50-watermarking-deadline/)) | None yet; the standard is vague ([Paul, Weiss](https://www.paulweiss.com/insights/client-memos/eu-finalises-transparency-rules-for-ai-generated-content)) |
| 12 | PCI payment-page script monitoring | Not found | Headless crawler + CSP reports (inferred) | Weakened by the SAQ A r1 change ([Adyen](https://docs.adyen.com/development-resources/pci-dss-compliance-guide/saq-a-eligibility)) | Security credibility |
| 13 | DSAR inbox for SMBs | OneTrust $200k+ (enterprise); Reform $35/mo ([Reform](https://www.reform.app/blog/top-tools-dsar-timeframe-management)) | Email parsing + LLM | GDPR; manual DSAR €100–1,500 each ([Legiscope](https://www.legiscope.com/blog/gdpr-software-pricing-company-size.html)) | Low end already cheap |

### Inferences

**Top pick 1: Accessibility "fix, don't overlay" monitor plus VPAT/ACR and statement generator (candidates 1+2 combined)**
- *Why:*
  - The demand is compliance-forced and recurring: thousands of suits a year, about two-thirds against sub-$25M firms, about 70% e-commerce, repeat suits common, and EAA plus Title II deadlines adding pressure.
  - The incumbents are polarized between expensive human audits and overlays that the FTC has discredited.
  - There is a positioning gift: "we fix your theme or source code, we don't inject a widget," backed by the FTC order and the widget-lawsuit data.
- *2–6 week MVP:*
  - Shopify/WordPress app or GitHub app runs axe-style automated scans on a schedule.
  - An LLM proposes concrete code or theme patches (alt text, labels, contrast, ARIA) as PRs or snippets.
  - It generates an accessibility statement (EAA requires one; not verified in this pass) and a VPAT 2.5 draft from the scan results plus a guided manual checklist.
  - Pricing: $29–$99/mo for SMB stores; $299–$999 per ACR refresh for SaaS.
- *Liability:* moderate. Never claim WCAG/ADA compliance or lawsuit immunity (the accessiBe precedent). State that automated tests catch only part of WCAG. Offer optional paid human review through a contractor network.
- *Distribution:* Shopify App Store and WordPress.org plugin directory; content SEO on "ADA demand letter"; partnerships with agencies and with the defense lawyers who handle demand letters.
- *Moat risk:* incumbents such as AudioEye could cut prices, and many AI-a11y startups are entering (TestParty and others appear in the search results).

**Top pick 2: Flat-priced review and Google Business Profile automation for local businesses (candidate 4)**
- *Why:* the price-to-cost ratio is the largest found (about $300–$450 per location per month versus cents of inference). The incumbent has documented contract hostility (Birdeye 1.7/5 Trustpilot) and annual lock-in. The FTC review-rule warning letters (Dec 2025) give a "compliance-safe review requests" angle.
- *2–6 week MVP:*
  - GBP API integration that pulls reviews.
  - LLM reply drafts approved in one click by email or SMS.
  - Review-request links sent to all customers, with no gating.
  - Monthly report and white-label for agencies.
  - Pricing: $19–$49 per location per month, month-to-month.
- *Liability:* low, as long as the product never filters unhappy customers away from public review sites and never offers incentives tied to sentiment.
- *Moat risk:* Google API approval and rate limits; GBP features that Google gives away for free; many cheap clones exist (not quantified here).

**Top pick 3: US state-law cookie consent and GPC tool that verifies blocking (candidate 3)**
- *Why:* compliance-forced across 20 US states plus GDPR. California fines specifically punish banners that do not block trackers or honor GPC. The market leader reportedly doubled its base price in 2025 and bills per domain by subpage count with auto-upgrades, which produces switching intent.
- *2–6 week MVP:*
  - A lightweight consent script with GPC honoring and real tag blocking, plus Google Consent Mode v2 signals.
  - A headless-browser "proof of blocking" test that runs monthly and emails a dated report (a differentiator and an audit artefact).
  - Flat pricing per account, not per subpage.
- *Liability:* moderate. If the script fails to block, the customer may be fined, and fines have reached seven figures, so contractual limits and a no-guarantee clause are essential.
- *Moat risk:* crowded market of free plugins (unquantified). EEA publisher monetization requires Google CMP certification and IAB TCF registration, so the solo version should exclude that segment at first.

**Runners-up**
- Call tracking lite (candidate 5): a large cost gap and fresh price increases, but a harder build and telecom and recording-consent exposure.
- Captioning with human QA (candidate 6): a large markup, but the compliance urgency slipped to 2027–2028.
- Security-questionnaire autofill for small SaaS (candidate 7): high price anchors, but it sits in a trust-sensitive category after Delve.

**Not recommended for a solo undercut:** status pages, transactional email and horizontal e-sign. The cost gap is real, but the categories are saturated and nothing forces purchase. PCI script monitoring has had its forced demand removed for SAQ A merchants. A DSAR inbox is already cheap at the low end. The AI Act labeling kit is a speculative watch item for 2027.

### Gaps
- No verified solo-founder revenue figures were found for any of the top 3 categories. Indie Hackers and Starter Story searches returned generic listicles.
- Not verified: Google Business Profile API access policy, and whether the EAA requires a published accessibility statement for each service provider.
- No competitor-count data exists for the three picks. "Crowded" is my judgment, not a sourced fact.
- The cost estimates for LLM review replies, call tracking and localization are my own arithmetic from sourced unit prices. They exclude hosting, support, payment fees and customer-acquisition cost.
