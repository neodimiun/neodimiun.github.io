# Consumer "pay-per-report / pay-per-lookup" products a solo builder could undercut (as of Oct 2026)

Scope note: Research done 2026-10-12. Excludes people-search, face/biometric search, stalking-adjacent tools, FCRA background checks, and anything that needs a professional license to deliver. Many incumbent prices below come from third-party or competitor pages because several vendor sites could not be fetched (socialcatfish.com and data.vinaudit.com did not resolve from the research environment). Where that is the case it is flagged. LLM per-unit costs use Anthropic's current list prices (cited once here and reused below): Claude Haiku 5.5 is $0.10/MTok input and $0.50/MTok output for prompts up to 100k tokens; Claude Sonnet 5.5 is $2/MTok input and $10/MTok output; the Batch API is 50% off — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).

## Q1. Which report/lookup businesses charge high prices relative to data cost? (candidate inventory, 15 checked)

### Takeaway
The pattern is real in about a dozen categories, but the gap between price and cost is not the hard part. The candidates that matter are the ones where (a) the incumbent takes a **contingency cut** (25–60% of a refund or savings) on work that software now does in seconds, or (b) a **fixed per-page or per-report fee** sits on top of a commodity input (machine translation, public data). Vehicle history, résumé/ATS scoring, AI-text detection, window stickers and reverse-image "catfish" searches look attractive on paper, but they have already been undercut to $0–$10, or they depend on proprietary data, or they sit next to biometric or people-search risk.

### Cited Findings

#### 1. Vehicle history reports (Carfax / AutoCheck vs. NMVTIS resellers)
- Carfax single report is about **$44.99**, with $64.99 for 3 and $99.99 for 6 (third-party page citing carfax.com prices as of 2026-09-11; not confirmed on carfax.com directly). AutoCheck is quoted at $29.99 for one or $49.99 for 25 within 21 days, while a sponsored article says $24.99 — [Collegian (sponsored)](https://collegian.com/sponsored/2026/05/3-best-carfax-alternatives-in-2026/); [Indie Hackers post](https://www.indiehackers.com/post/best-cheap-carfax-report-services-for-used-car-buyers-in-2026-UciMjptiI8BKZm74avCv); [CarWhere](https://www.carwhere.com/carfax-alternative)
- VinAudit (an approved NMVTIS provider) sells consumer reports at **$9.99 each or $20/month unlimited**, and says its wholesale NMVTIS fee starts at about **$1 per report, falling to about $0.25 at high volume** (self-reported, undated). API pricing is quote-based — [VinAudit API pricing blog](https://www.vinaudit.com/?p=22297); [VinAudit Carfax alternatives](https://www.vinaudit.com/?p=10041)
- EpicVIN's own price page shows a 16-report pack at **$5.40/report ($86.34 total)** and unlimited at $49.99/month. Bumper is quoted at $31.99 single or a $1 trial that converts to a subscription. Trustpilot reviewers complain about $1 trials that auto-renew — [EpicVIN price page](https://epicvin.com/price); [Vincario review](https://vincario.com/blog/?p=1063); [City Cast](https://dc.citycast.fm/best-of/best-vin-lookup); [Trustpilot EpicVIN](https://ca.trustpilot.com/review/epicvin.com)
- Only approved NMVTIS data providers may sell reports built on NMVTIS data, under contract with AAMVA. Consumer NMVTIS reports were **$8–$12.99 each as of May 2020**. No personally identifying information goes to consumers — [AAMVA NMVTIS consumers](https://aamva.org/vehicles/nmvtis/general-public-and-consumers); [DC DMV](https://dmv.dc.gov/node/1572386)
- Carfax is not being hurt by cheap alternatives. The **CARFAX segment brought in $312M in Q2 2026, up 8%**, and Mobility Global (formerly S&P Global Mobility, spun out in 2026) had **$1.613B in revenue in 2024** — [BusinessWire Q2 2026](https://secure.businesswire.com/news/home/20260806846937/en/Mobility-Global-Reports-Second-Quarter-2026-Financial-Results); [SEC Form DRS](https://www.sec.gov/Archives/edgar/data/0002090312/000110465925101868/filename2.htm)
- Cheap NMVTIS-only reports have quality complaints. A Trustpilot reviewer said VinAudit showed 1 title where Carfax and AutoCheck showed 3, missed the owner count and missed a lien. A forum user said it "doesn't have nearly the information of carfax or autocheck" — [Trustpilot VinAudit](https://ca.trustpilot.com/review/vinaudit.com?page=10); [Classic Motorsports forum](https://classicmotorsports.com/forum/grm/carfax-or-alternatives/95975/page1)
- "$5.99 Carfax" resellers exist (for example, Indie Hackers SEO posts). Carfax terms say "commercial use, resale and redistribution … strictly prohibited", and Carfax has sued a company for misusing myCARFAX access — [Autopian](https://www.theautopian.com/my-bad-while-reporting-about-how-people-are-selling-carfax-reports-on-etsy-i-got-all-of-the-listings-removed/); [Auto Remarketing](https://www.autoremarketing.com/technology/carfax-files-lawsuit-alleging-data-theft); [Indie Hackers $5.99 post](https://www.indiehackers.com/post/cheap-carfax-report-for-5-99-the-smartest-vin-lookup-in-2026-uBRSJ1Km7kHwS3LMuG7a)

#### 2. Window sticker (Monroney) by VIN
- CarEdge says competitors charge **$7–$10 per sticker** and offers its own lookups free. ForCar rebuilds stickers free from NHTSA data. Most paid services use ChromeData to reconstruct the sticker — [CarEdge](https://caredge.com/window-sticker); [ForCar](https://forcar.org/window-sticker/ram/); [ClearVin](https://www.clearvin.com/window-sticker/)

#### 3. IMEI / blacklist checks for used phones
- A reseller lists a basic status check at **$5** and a full report (carrier, warranty, blacklist, iCloud/FMI) at **$10–$15**. M360 sells top-ups at **1,000 checks for €84.90 (about €0.085 each)**. Swappa's check needs a login and credits. GSMA sells Device Check as a B2B API with no public rate card — [Sanders Software](https://sanderssoftware.it.com/services/imei-check); [M360](https://m360soft.com/help/others); [Swappa](https://SWAPPA.COM/esn); [GSMA Device Check brief](https://www.gsma.com/latinamerica/wp-content/uploads/2015/01/Device-Check-Brief.pdf)

#### 4. Reverse image search for catfish/scam checks (exact-match, not face search)
- Social Catfish sells image search as a subscription: a 3-day trial at $6.87 that converts to **$28.97/month** (another source says $36/month), plus a $397 ID-verification package. All of these come from third-party pages — [Futurepedia](https://www.futurepedia.io/tool/social-catfish); [Geekflare](https://geekflare.com/face-recognition-search-engines); [CodaOne](https://www.codaone.ai/tools/social-catfish)
- Google Cloud Vision **Web Detection is $3.50 per 1,000 units** (1,001–5M per month), and the first 1,000 units each month are free — [Google Cloud Vision pricing](https://cloud.google.com/vision/pricing?hl=bg)
- TinEye API bundles (undated blog): **5,000 searches for $200 ($0.04 each), 10,000 for $300, 50,000 for $1,000, 1M for $10,000 ($0.01 each)** — [TinEye blog](https://blog.tineye.com/new-image-search-pricing/)
- Demand signal: the FTC reported **$1.14B in romance-scam losses in 2023** (64,003 reports, $2,000 median loss). A secondary source says losses passed $1.16B in the first 9 months of 2025 — [Comparitech citing FTC](https://www.comparitech.com/blog/information-security/online-dating-romance-scams/); [Global Dating Insights](https://globaldatinginsights.com/2026/02/26/romance-scams-outpace-other-fraud-types-at-1-16-billion/)

#### 5. Plagiarism / AI-text detection
- Originality.ai Pro is $14.95/month for 2,000 credits at 1 credit per 100 words (about **$0.075 per 1,000 words**). Turnitin sells only to institutions. GPTZero has a free tier around 10k words/month — [CASRAI](https://www.casrai.org/guides/originality-ai-vs-turnitin); [CASRAI GPTZero](https://casrai.org/guides/gptzero-pricing)
- API costs: Sapling detection is **$0.005 per 1,000 characters**, falling to $0.0025 above 50M. GPTZero's developer tier is reported at $1,850/month for 20M words with **$150 per 1M words** overage (reseller page) — [Fast.io review](https://www.fast.io/resources/sapling-ai-detector-review-2026.md); [Fitgap GPTZero](https://us.fitgap.com/products/038942/gpt-zero)

#### 6. Résumé / ATS scoring
- Jobscan is about **$49.95/month** (or $89.95/quarter). Premium+ is cited at $89.95/month, and the free tier gives 5 scans/month. Sources disagree on plan structure — [Interview Guys](https://blog.theinterviewguys.com/?p=10428); [Careery](https://careery.pro/blog/is-jobscan-worth-it-2026); [Capterra](https://www.capterra.com/p/10016414/Jobscan/)
- Free and one-time competitors already exist (SkillSyncer free; ATS Verification sells one-time scans). Jobscan has 11–50 employees, and revenue is undisclosed — [ATS Verification](https://atsverification.com/vs/jobscan/); [RankMyAI](https://www.rankmyai.com/tools/510e93a7-3232-4344-be53-20950932b3c8/jobscan)

#### 7. Certified translation (USCIS-style)
- RushTranslate charges about **$24.95/page** (250 words or fewer), notarization from $19.95, and non-certified work from $0.10/word. The market range is **$25–$40/page**. Rapid Translate says **$28/page or $38 rush** (2026). All of these are competitor pages — [Translayte](https://translayte.com/blog/certified-translation-cost-for-documents); [Rapid Translate](https://www.rapidtranslate.org/resources/top-translation-pricing-services-online)
- DeepL API: the 2026 Growth plan is about $26–$32.50/month with **$27.50 per 1M extra characters** (€22 in EUR). Older Pro pricing was $5.49/month plus **$25 per 1M characters** — [SimpleLocalize](https://simplelocalize.io/blog/posts/ai-machine-translation-cost-comparison/); [eesel](https://www.eesel.ai/blog/deepl-pricing)
- USCIS rule (8 CFR 103.2(b)(3)): a full English translation that the translator **certifies as complete and accurate**, plus the translator's **certification of competence**. Notarization is not required, there is no approved-translator list, and self-translation is rejected (secondary sources quoting the rule) — [ImmiHelp](https://www.immihelp.com/what-is-a-certified-translation-for-uscis); [CILawGroup](https://cilawgroup.com/news/2019/09/21/what-are-uscis-requirements-for-certified-foreign-language-translations/); [Immiva](https://immiva.com/blog/certified-translation-uscis-requirements)

#### 8. Trademark / name availability search
- LegalZoom search tiers: **Federal $199; Federal + State + Common Law $299; WorldScan International $499** (undated page). Professional clearance reports from CompuMark or Corsearch cost **$300–$1,500** before attorney time — [LegalZoom pricing](https://origin.cloudfront.aws-01.legalzoom.com/trademark-search/trademark-search-pricing.html); [TMarkMetric 2026](https://tmarkmetric.com/insights/trademark-attorney-cost); [TM Express](https://tmexpress.com/trademark-search-pricing/)

#### 9. Flight-delay compensation (EU261 / UK261) — contingency
- AirHelp: **35% service fee plus 15% legal-action fee** (both of total compensation, including VAT). AirHelp keeps any court-awarded legal costs. Legal action happens in about 3% of cases — [AirHelp price list](https://airhelp.com/en/price-list/); [AirHelp MyTrip price list](https://www.airhelp.com/en/ota/mytrip/price-list/)
- EUclaim is about 31% plus per-person file fees (per AirHelp's own blog). Bott & Co uses flat fees from **£47 on a £110 claim to £225 on a £520 claim** (about 43%), excluding VAT — [AirHelp vs EUclaim](https://www.airhelp.co.uk/blog/airhelp-vs-euclaim-best-flight-compensation-company/); [Bott & Co fees](https://www.bottonline.co.uk/flight-delay-compensation/fees)
- Scale: AirHelp says it had assessed nearly **16M claims** since 2013, helped **2.2M passengers**, and had 81M site users (Feb 2024). It **acquired ClaimCompass in Jan 2025** — [AirHelp press](https://airhelp.com/en-int/press/11-years-of-airhelp-more-than-2-2-million-passengers-claimed-compensation); [Capital.bg](https://www.capital.bg/en/business/2025/01/30/4735972_berlin-based_airhelp_acquires_bulgarias_claimcompass/)
- Ryanair says passengers who claim directly get 100% and warns against "claims chasers" — [Ryanair help](https://help.ryanair.com/hc/en-ie/articles/12890736320529-Beware-of-claims-chasers)
- EU261 reform, June–July 2026: sources conflict. Burges Salmon and SkyRefund say the 3-hour threshold and the €250–€600 amounts survived conciliation (EP vote 646–12). AeroMorning and Ulysse report 4h/6h thresholds, which matches the Council's earlier position — [Burges Salmon](https://www.burges-salmon.com/articles/102n2zj/eu261-reform-evolution-not-revolution); [SkyRefund](https://skyrefund.com/en/blog/eu261-reform-2026); [AeroMorning](https://aeromorning.com/en/eu261-reform-a-compromise-with-no-winners-in-europe/); [Ulysse](https://ulysse.com/news/ce261-reforme-indemnisation)
- US: DOT withdrew the cash delay-compensation proposal (Federal Register, Nov 17, 2025, 90 FR 51230). The 2024 automatic-refund rule stays — [The Points Guy](https://thepointsguy.com/news/trump-administration-withdraws-airline-compensation-rule/); [DWU Consulting](https://dwuconsulting.com/dwu-ai/dot-consumer-protection-rulemaking)

#### 10. Property-tax appeals — contingency
- Ownwell charges **25% of savings in TX, IL, WA, NY and 35% in GA, FL, CA, CO, PA**. In Georgia it adds $20 when it secures a 3-year freeze, and the fee recurs in each year it wins. Competitors are cited at **40–50%** (Ownwell's own comparison) — [Ownwell blog](https://www.ownwell.com/blog/ownwell-lower-percentage-pricing-better); [Money Crashers](https://www.moneycrashers.com/ownwell-review/); [AppealDesk review](https://www.appealdesk.com/blog/ownwell-pricing-review)
- Ownwell scale: **500,000+ customers, customers up 180% in 2025, 1M+ appeals, $400M+ saved**, profitable, **$50M Series B in Feb 2026 ($74M total)**. It launched a "National Appeals Packet" that one outlet calls free, while a competitor says the price is undisclosed — [Inman](https://www.inman.com/2026/02/25/ownwell-raises-50m-to-grow-its-property-tax-appeal-fintech/); [Crunchbase News](https://news.crunchbase.com/venture/ownwell-raise-lower-homeowner-property-tax/); [Commercial Observer](https://commercialobserver.com/?p=561620)
- A flat-fee DIY entrant already exists: **AppealDesk at $49** for a comps analysis, county filing instructions and a cover letter (the owner files). Its example: a 25% contingency on a $1,200 reduction is $300 — [AppealDesk](https://www.appealdesk.com/compare/ownwell-alternative); [AppealDesk 2026 report](https://lifestyle.kbew98country.com/story/111097/2026-property-tax-appeal-services-report/)

#### 11. Bill negotiation (cable, phone, internet) — contingency
- Rocket Money's bill negotiation fee is **35%–60% of first-year savings**, chosen by the user and charged only on success — [Rocket Money help](https://help.rocketmoney.com/en/articles/9744474-bill-negotiation-charge); [Atlanta News First, Jul 2026](https://www.atlantanewsfirst.com/2026/07/10/online-bill-negotiators-promise-savings-require-personal-data-access/)

#### 12. Medical bill review and negotiation — contingency
- Human advocates usually take **10–35% of savings** (MBAA's president suggested about 30%, with a range of 15–50%; possibly older). CareRoute charges **18–25% capped at $1,000**, Goodbill **20% capped at $1,000**, and Resolve **8–20% with an $800 minimum and a $249–$499 deposit** (vendor-reported) — [KFF Health News](https://kffhealthnews.org/health-industry/advocate-sidebar/); [CareRoute comparison](https://www.careroute.ai/bill-defense/compare-medical-bill-negotiation-services); [Resolve](https://www.resolvemedicalbills.com/lp/goodrx)
- AI entrants: the IQBill app sold at $39.99/year or $79.99 lifetime (its App Store listing is now archived). Avelis Health (YC) raised a $500K pre-seed in 2025 — [App Store IQBill](https://apps.apple.com/us/app/-/id6757212060); [POCIT](https://peopleofcolorintech.com/articles/y-combinator-invests-500k-in-ai-startup-helping-americans-save-money-on-medical-bills/)
- Free federal lever: uninsured or self-pay patients billed **≥$400 over their Good Faith Estimate** can open a CMS patient-provider dispute within 120 days. The fee was **$25** in 2023 — [CMS dispute a bill](https://www.cms.gov/medical-bill-rights/help/dispute-a-bill); [CMS PPDR fee notice](https://CMS.gov/cciio/resources/regulations-and-guidance/downloads/patient-provider-dispute-resolution-administrative-fee-cy-2023.pdf)

#### 13. Parking / traffic ticket contesting — contingency
- WinIt (NYC) charges **50% of the fine, only if the ticket is dismissed** (App Store listing updated March 2026). Early reported win rates were 40–50% — [AppGoblin WinIt](https://appgoblin.info/apps/929918279); [Ask Bob Rankin](https://askbobrankin.com/will_this_app_get_your_traffic_ticket_dismissed.html)

#### 14. Diminished-value appraisal reports (after a car accident)
- Professional DV appraisals typically cost **$250–$400**. Forum posters paid $300 and $425, and one vendor advertises a $225 flat fee against a competitor's $425. The appraisal often beats the insurer's offer (examples: $2,900 offer vs. $5,500 appraisal; $3,700 vs. $7,800) — [W Firm](https://wfirm.com/how-to-file-a-diminished-value-claim/); [Mach-E forum](https://www.macheforum.com/site/threads/diminished-value-claim.25846/latest); [Audizine](https://www.audizine.com/threads/diminished-value-claim.539224/)
- The "17c" formula is pre-accident value × 10% cap × damage multiplier × mileage multiplier. Georgia's insurance commissioner (2008) said the department has never endorsed any DV formula. Disputes may need a USPAP-compliant appraisal — [Beancount guide](https://beancount.io/blog/2026/09/24/diminished-value-claim-17c-formula-first-party-third-party-appraisal-guide); [Atlanta PI Attorney](https://atlantapiattorney.com/2022/11/calculating-diminished-value-georgia/)
- An incumbent signal: press-release headlines say Diminished Value of Georgia served "about 5,000 retail customers" in a year and helped clients obtain "an additional $123 million" (headline claims only; not verified) — [InsuranceNewsNet](https://insurancenewsnet.com/oarticle/diminished-value-of-georgia-releases-end-of-year-report-about-5000-retail-customers-served); [InsuranceNewsNet](https://insurancenewsnet.com/oarticle/Diminished-Value-of-Georgia-has-Helped-Clients-Obtain-an-Additional-123-Millio-a-561658)

#### 15. House-history style reports (California NHD; stigmatized-property)
- California Natural Hazard Disclosure reports cost **$59–$180**. SnapNHD charges $69.95 standard and $99.95 premium; HomeGuard $59 and $99 — [SnapNHD](https://snapnhd.com/blog/the-nhd-report-who-gets-it-what-s-it-cost-and-when-is-it-needed-during-a-sale); [HomeGuard](https://homeguard.com/order-nhd-report/)
- 2021: the Ventura, LA and San Diego DAs got a **$415,000** judgment against an NHD provider that sold the same report under two brands at different prices (about $16 apart). Earlier, a **$39.3M** settlement resolved claims that brokers got about $25 per NHD report for referrals (RESPA; 2008) — [Ventura County DA](https://da.venturacounty.gov/2021/07/july-27-2021); [Inman 2008](https://inman.com/2008/08/7/brokers-property-id-agree-39-million-settlement)
- DiedInHouse (whether someone died at an address) charged **$11.99 per address**, had 4.5M addresses in its database and had sold 30,000 searches **as of 2015**. No current data was found — [Malay Mail 2015](https://www.malaymail.com/news/life/2015/10/26/is-your-house-haunted-diedinhouse-will-identify-all-your-ghosts/993869)
- Permit-history data: Shovels sells permit data through quote-gated subscriptions and credits. A third party lists $599/month (unverified) — [Sacra](https://sacra.com/c/shovels/); [GTM Directory](https://thegtmdirectory.com/tools/shovels)

#### 16. Passport/ID photos (included for comparison, borderline-excluded)
- PhotoAiD Premium is about **$13.95**. Passport Photo Online is **$16.95 digital or $19.95 printed**. PhotoAiD's revenue is estimated at about $3.5M (a database estimate) — [UC Strategies](https://ucstrategies.com/news/this-free-ai-tool-replaces-photo-studios-for-passport-and-id-photos-but-one-rejection-can-cost-you-more/); [Passport Photo Online](https://passport-photo.online/); [Prospeo](https://prospeo.io/c/photoaid-revenue)

### Inferences
- **Per-unit cost vs. price (estimates; the cost side combines cited API prices with my token and page-size assumptions):**

| Candidate | Incumbent price | Est. marginal cost per unit | Gross margin at incumbent price |
|---|---|---|---|
| Vehicle history (NMVTIS-only) | Carfax $44.99; VinAudit $9.99; EpicVIN $5.40 | ~$0.25–$1 NMVTIS fee (VinAudit claim) + payment fees | >90%, but already undercut to $5–$10 |
| Window sticker | $7–$10 | Free NHTSA decode; ChromeData license unknown | Being driven to $0 |
| IMEI check | $5–$15 | ~€0.085 wholesale | ~95%+ |
| Reverse image (exact match) | ~$29/mo (Social Catfish) | $0.0035 (Google Web Detection) to $0.01–$0.04 (TinEye) per search | ~99%, but Google Lens is free |
| AI-text / plagiarism check | ~$0.075/1k words retail | ~$0.03/1k words (Sapling at ~6 chars/word) | Thin; free tiers everywhere |
| Résumé/ATS scan | $49.95/mo | ~$0.002 (Haiku 5.5) to ~$0.03 (Sonnet 5.5) per scan, assuming ~5k tokens in and ~2k out | ~99%, already commoditized |
| Certified translation | $24.95–$40/page | MT ~$0.04/page (250 words ≈ 1,500 chars at $25–27.50/M chars) **plus human certifier time** (cost unknown) | High even with a paid human reviewer |
| Trademark search | $199–$499 | USPTO data plus LLM similarity scoring, under $1 (data-licensing cost not verified) | Very high, but consumer demand is thin |
| Flight compensation | 35–50% of €250–€600 (€87–€300) | Flight-status data plus letter generation, under $1 (API price not verified); litigation is costly | High on easy claims; legal-stage costs are the moat |
| Property-tax appeal | 25–50% of savings (e.g., $300 on a $1,200 cut) | Comps data (price not verified) plus LLM, likely a few dollars | Very high versus a $29–$49 flat fee |
| Bill negotiation | 35–60% of year-1 savings | AI voice-agent minutes plus LLM (not verified) | High |
| Medical bill review | 10–35% of savings, $800 minimums | OCR plus LLM, under $0.10 per bill | Very high |
| Ticket contest | 50% of fine | Letter generation, under $0.01 | Very high, but UPL/FTC risk |
| Diminished value | $225–$425 | Used-car comps data (price not verified) plus formula plus LLM | Very high if insurers accept the report |
| CA NHD report | $59–$180 | Public hazard GIS layers plus tax data (not verified) | High, but distribution runs through agents |

- The categories where a solo builder can actually win are those where the incumbent's price is tied to the **customer's outcome** (a contingency) rather than to the **data**. Pure-data lookups (VIN, IMEI, sticker, image) have already been driven toward $0–$10 by dozens of SEO resellers. Contingency services still charge 25–60% even after Ownwell's growth.
- Vehicle history shows that "cheap data" does not beat an incumbent whose value is **proprietary data** (Carfax's service and accident records). Carfax is still growing 8% a year while $5–$10 NMVTIS reports are widely available.

### Gaps
- Could not fetch Social Catfish's, Carfax's or VinAudit's own pricing pages (DNS failures or no official page in results). Prices come from third parties.
- No verified per-lookup price for: flight-status APIs (FlightAware/Cirium), property comps data (ATTOM/Regrid/county feeds), used-car comps for DV, GSMA Device Check direct, ChromeData, USPTO bulk data, NHD GIS inputs.
- No search-volume data (Semrush/Ahrefs) was found for any category. Demand evidence is limited to revenue, customer counts and complaint signals.
- No current DiedInHouse or Social Catfish revenue was found. Jobscan and Resume Worded revenue are undisclosed.

## Q2. Exact incumbent prices today vs. underlying API/data costs (best available figures)

### Takeaway
Hard API prices are well documented for image matching ($0.0035–$0.04 per search), machine translation ($25–$27.50 per 1M characters), AI detection ($0.0025–$0.005 per 1k characters), IMEI checks (about €0.085) and LLM reasoning (Haiku 5.5 at $0.10/$0.50 per MTok). They are opaque (quote-only) for NMVTIS wholesale, permit data, property comps and GSMA. The biggest documented price-to-cost multiples are certified translation (several hundred times the MT cost before human review) and contingency services (fees of $100–$1,000+ against single-digit-dollar compute).

### Cited Findings
- Google Cloud Vision Web Detection: $3.50 per 1,000 units, first 1,000 free each month, each feature billed per image — [Google Cloud](https://cloud.google.com/vision/pricing?hl=bg); [Vantaige 2026](https://vantaige.io/blog/google-vision-ai-pricing-explained-alternatives-2026)
- TinEye API: $200 for 5k searches up to $10,000 for 1M (undated). Previously $300 for 5k — [TinEye blog](https://blog.tineye.com/new-image-search-pricing/)
- DeepL API: $25–$27.50 per 1M characters plus a monthly base fee. One blog says API Free and Pro closed to new signups in mid-2026 (unverified) — [SimpleLocalize](https://simplelocalize.io/blog/posts/ai-machine-translation-cost-comparison/); [eesel](https://www.eesel.ai/blog/deepl-pricing)
- Sapling AI detector API: $0.005 per 1k characters (first 10M) — [Fast.io](https://www.fast.io/resources/sapling-ai-detector-review-2026.md)
- NMVTIS wholesale: about $1 falling to $0.25 per report (VinAudit, self-reported) — [VinAudit](https://www.vinaudit.com/?p=22297)
- IMEI wholesale: €84.90 per 1,000 checks (M360) — [M360](https://m360soft.com/help/others)
- Claude Haiku 5.5: $0.10 in / $0.50 out per MTok (≤100k-token prompts). Sonnet 5.5: $2 / $10. Batch is 50% off — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Shovels permit data: quote-based or credits; $599/month is a third-party figure — [Sacra](https://sacra.com/c/shovels/); [GTM Directory](https://thegtmdirectory.com/tools/shovels)

### Inferences
- A 10-page LLM-generated report (about 20k tokens in, about 6k tokens out) costs about **$0.005 on Haiku 5.5** and about **$0.10 on Sonnet 5.5** at list prices. For any report priced at $10 or more, compute is effectively free. Margin goes to payments, acquisition (SEO and ads) and any human-in-the-loop step.
- For certified translation, the binding cost is the **human certifier**, not the MT. If a competent bilingual reviewer can post-edit and certify a one-page civil document in about 10–15 minutes, the unit cost would be a few dollars against $25–$40 retail. That reviewer-time figure is an assumption and is not sourced.

### Gaps
- No published GSMA Device Check, NMVTIS (AAMVA-to-provider) or property-comps price sheets were found.
- Post-editor or certifier labor cost per page was not researched.

## Q3. Which have contingency-fee models (25–60% of a refund or savings) that a flat-fee product could undercut?

### Takeaway
Five strong contingency targets: **property-tax appeals (25–50%)**, **bill negotiation (35–60%)**, **medical-bill advocacy (10–35%, $800 minimums)**, **flight compensation (35–50%)** and **ticket contesting (50% of the fine)**. Diminished-value appraisals are a high flat fee ($225–$425) rather than a contingency, but follow the same logic. Flat-fee DIY entrants already exist in property tax (AppealDesk at $49; Ownwell's possibly-free National Appeals Packet), which validates the model and also caps the price.

### Cited Findings
- Property tax: Ownwell 25–35%; others 40–50%; AppealDesk $49 flat; Ownwell's National Appeals Packet launched Feb 2026 (described as free by Commercial Observer, undisclosed per AppealDesk) — [Ownwell](https://www.ownwell.com/blog/ownwell-lower-percentage-pricing-better); [AppealDesk](https://www.appealdesk.com/compare/ownwell-alternative); [Commercial Observer](https://commercialobserver.com/?p=561620); [AppealDesk on Ownwell pricing](https://www.appealdesk.com/blog/ownwell-pricing-review)
- An AppealDesk-published source estimates a free DIY appeal takes **15–40 hours** of comps research. It cites a Lincoln Institute figure that the average successful appeal saves more than $1,000/year (secondhand) — [AppealDesk best services](https://www.appealdesk.com/blog/best-property-tax-appeal-services)
- Bill negotiation: Rocket Money 35–60% of year-1 savings — [Rocket Money help](https://help.rocketmoney.com/en/articles/9744474-bill-negotiation-charge)
- Medical bills: 10–35% typical, 15–50% range; Goodbill 20% capped at $1,000; Resolve $800 minimum — [KFF Health News](https://kffhealthnews.org/health-industry/advocate-sidebar/); [CareRoute](https://www.careroute.ai/bill-defense/compare-medical-bill-negotiation-services)
- Flight compensation: AirHelp 35% + 15%; Bott & Co flat £47–£225 (about 43% on £520) — [AirHelp](https://airhelp.com/en/price-list/); [Bott & Co](https://www.bottonline.co.uk/flight-delay-compensation/fees)
- Tickets: WinIt 50% of the fine on dismissal — [AppGoblin](https://appgoblin.info/apps/929918279)

### Inferences
- **Flat-fee price points that would still be roughly 80%+ cheaper for the customer:** property-tax packet $29–$49 (vs. $250–$500 typical contingency); medical-bill audit and dispute kit $19–$49 (vs. $800 minimums or 20% of a $5k reduction = $1,000); DV report $49–$99 (vs. $225–$425); flight-claim letter kit €9–€15 (vs. €87–€210 on a €250–€600 claim).
- Contingency firms earn their fee on the **hard tail** (litigation, phone negotiation, hearings). A flat-fee DIY product wins the **easy majority** but has to accept that some customers fail, or bolt on "escalate to a partner at X%" for hard cases.
- Flight compensation is the weakest flat-fee target. Airlines often pay direct claims for free (Ryanair says 100%), so willingness to pay for a DIY letter is low, and the value of a claims firm is litigation. The US has no cash-compensation rule to build on after DOT's Nov 2025 withdrawal.

### Gaps
- No data was found on what share of property-tax or medical-bill outcomes come from the "easy" first step (an informal review or a letter) versus formal hearings or negotiation.
- No evidence was found on whether bill-negotiation targets (ISPs, carriers) accept AI voice agents acting on a customer's behalf.

## Q4. Which are legally clean, and which touch regulated areas (FCRA, UPL, DPPA, HIPAA, BIPA, licensing)?

### Takeaway
**Cleanest:** IMEI checks, window stickers, AI-text checks, résumé scoring, US certified translation (no license under the USCIS rule), and DIY property-tax evidence packets where the owner files. **Moderate:** vehicle history (needs NMVTIS-approved status or a reseller contract; DPPA keeps owner PII out), medical bills (FTC Health Breach Notification Rule; HIPAA only if you work for a covered entity), DV reports (possible appraiser credential or USPAP expectations), trademark search (data is fine, a clearance opinion edges into legal advice). **Riskiest:** ticket contesting and any "robot lawyer" framing (UPL, FTC precedent), reverse-image catfish search and passport photos (BIPA exposure for any tool touching faces), and representing taxpayers for a fee in Texas (needs TDLR registration).

### Cited Findings
- **DPPA / NMVTIS:** Only approved NMVTIS providers under AAMVA contract may sell NMVTIS-based reports, and no personally identifying information is released to consumers. A VIN-report vendor says owner information is DPPA-protected and excluded from reports — [AAMVA](https://aamva.org/vehicles/nmvtis/general-public-and-consumers); [DC DMV](https://dmv.dc.gov/node/1572386); [ClearVin](https://www.clearvin.com/helpful-information/)
- **Carfax ToS:** resale or redistribution of Carfax reports is prohibited, and Carfax has sued over improper access — [Autopian](https://www.theautopian.com/my-bad-while-reporting-about-how-people-are-selling-carfax-reports-on-etsy-i-got-all-of-the-listings-removed/); [Auto Remarketing](https://www.autoremarketing.com/technology/carfax-files-lawsuit-alleging-data-theft)
- **UPL / FTC "robot lawyer":** The FTC final order against DoNotPay (approved 5–0 on Jan 16, 2025) imposed **$193,000** and bars claims of equivalence to a human lawyer without evidence — [FTC](https://www.ftc.gov/node/87474); [accountsrecovery.net](https://www.accountsrecovery.net/2025/02/12/robot-laywer-donotpay-to-pay-193k-in-settlement-with-ftc/)
- **UPL / software exemption (Texas):** after *Parsons Technology* (1999) held Quicken Family Lawyer to be UPL, Texas amended Gov't Code §81.101 so that the "practice of law" excludes software that clearly states it was not prepared by a lawyer — [Fifth Circuit 179 F.3d 956](https://law.resource.org/pub/us/case/reporter/F3/179/179.F3d.956.99-10388.html); [HB 1507 analysis](https://capitol.texas.gov/tlodocs/76R/analysis/html/HB01507I.htm)
- **Property-tax representation:** In Texas, anyone performing property-tax consulting for compensation must register with TDLR (40 hours of coursework, an exam, sponsorship by a senior consultant). Attorneys and CPAs are exempt. Registrants may not solicit by assuring an outcome — [TDLR PTC at a Glance](https://www.tdlr.texas.gov/media/pdf/PTC%20at%20a%20Glance.pdf); [TDLR FAQ](https://www.tdlr.texas.gov/ptc/ptcfaq.htm)
- **Health data:** the FTC's Health Breach Notification Rule (amended April 2024, effective July 29, 2024) covers health apps not covered by HIPAA. A summary says coverage turns on whether the app draws health data from multiple sources — [FTC](https://www.ftc.gov/node/85202); [Fierce Healthcare](https://www.fiercehealthcare.com/digital-health/ftc-warns-health-apps-must-notify-users-about-data-breaches-or-face-fines); [Foley Hoag](https://foleyhoag.com/news-and-insights/blogs/security-privacy-and-the-law/2024/april/ftc-s-updated-health-data-breach-rule-covers-apps-other-new-tech/)
- **BIPA spillover:** plaintiffs have sued over technologies "involving a face in any way", **including passport-photo software**, porn filters and interview software. Courts are split (*Sosa v. Onfido*: faceprints from photos can be biometric identifiers; *Martell v. X*: PhotoDNA is not facial recognition) — [Duane Morris](https://blogs.duanemorris.com/classactiondefense/2024/06/20/illinois-federal-court-rejects-class-action-because-an-ai-powered-porn-filter-does-not-violate-the-bipa/)
- **USCIS translation:** no license or notarization is required, only the translator's certification of accuracy and competence (secondary sources quoting 8 CFR 103.2(b)(3)) — [ImmiHelp](https://www.immihelp.com/what-is-a-certified-translation-for-uscis)
- **DV appraisals:** some practitioners say DV appraisers "should be licensed" and that disputes "typically require a USPAP compliant" report (interested sources). The Georgia commissioner has not endorsed 17c — [Atlanta PI Attorney](https://atlantapiattorney.com/2022/11/calculating-diminished-value-georgia/); [Beancount](https://beancount.io/blog/2026/09/24/diminished-value-claim-17c-formula-first-party-third-party-appraisal-guide)
- **NHD:** history of DA enforcement on pricing and marketing ($415k) and a RESPA kickback settlement ($39.3M) — [Ventura County DA](https://da.venturacounty.gov/2021/07/july-27-2021); [Inman](https://inman.com/2008/08/7/brokers-property-id-agree-39-million-settlement)
- **Consumer-protection exposure on trial and subscription traps:** auto-renewing $1 trials draw Trustpilot complaints (EpicVIN), and Social Catfish trials auto-renew — [Trustpilot](https://ca.trustpilot.com/review/epicvin.com); [CodaOne](https://www.codaone.ai/tools/social-catfish)

### Inferences
- **FCRA** is not triggered by vehicle, device, property or document reports, because none is a "consumer report" on a person used for eligibility decisions. It would be triggered if any product drifted into tenant, employment or credit screening. Keep everything keyed to a VIN, IMEI, parcel or document, never to a person's name.
- **Reverse image search for catfish checks** should be treated as excluded or high-caution. Even exact-match Web Detection on uploaded faces invites "face in any way" BIPA claims, and the use case (identifying who a stranger really is) is people-search adjacent. Google Lens and TinEye are also free to consumers, which caps willingness to pay.
- **Passport photos:** strong unit economics ($14–$20 against cents of compute), but they fail the brief's "no biometric" screen because compliance checks rely on facial-landmark detection.
- **Ticket contesting** and **trademark clearance opinions** carry UPL risk. Framing them as "self-help form/data + no legal advice" with a clear non-lawyer disclaimer reduces but does not remove it (Texas exemption language; other states differ).
- **EU:** certified or sworn translation in many EU states requires court-sworn translators, and claim assignment for EU261 may need debt-collection registration in some states (for example, Germany). Neither point was verified in this research (see Gaps), so the US is the cleaner first market for translation.

### Gaps
- Did not verify the EU sworn-translator rules or German RDG/Inkasso registration for EU261 claim assignment.
- Did not find state-by-state rules on whether DV appraisals need a license, or whether insurers must accept non-USPAP reports.
- Did not check whether non-Texas states (for example, Georgia, Illinois, Florida) require licenses for paid property-tax representation (contingency) as opposed to selling DIY evidence.
- No primary text of 18 U.S.C. §2721–2725 (DPPA) or 8 CFR 103.2(b)(3) was fetched; secondary summaries only.

## Q5. Demand, distribution and moats — and the 3 most promising plays

### Takeaway
Ranked by price/cost gap × demand evidence × legal cleanliness × solo-buildable distribution × weakness of the moat, the top 3 are: **(1) flat-fee property-tax appeal evidence packets**, **(2) AI-drafted, human-certified USCIS translations at about half price**, and **(3) a flat-fee medical-bill error audit and dispute kit**. The runners-up are **diminished-value reports** (high ticket, but acceptance and licensing are uncertain) and **IMEI checks** (clean and high-margin but low-ticket and crowded). Avoid vehicle history, ATS scoring, AI detection, window stickers, catfish image search, passport photos, ticket contesting and NHD reports for a solo launch.

### Cited Findings
- **Property-tax demand proof:** Ownwell has 500k+ customers, grew 180% in 2025, has handled 1M+ appeals and $400M+ in savings, and is profitable. A $49 flat-fee competitor (AppealDesk) already markets against it with SEO comparison pages — [Inman](https://www.inman.com/2026/02/25/ownwell-raises-50m-to-grow-its-property-tax-appeal-fintech/); [Crunchbase News](https://news.crunchbase.com/venture/ownwell-raise-lower-homeowner-property-tax/); [AppealDesk](https://www.appealdesk.com/compare/ownwell-alternative)
- **Translation demand and price anchors:** a crowded vendor set at $20–$40/page (RushTranslate $24.95, Rapid Translate $27.99/$28, Universal Translation $20) all run SEO comparison content — [Translayte](https://translayte.com/blog/certified-translation-cost-for-documents); [Rapid Translate](https://www.rapidtranslate.org/resources/top-translation-pricing-services-online)
- **Medical-bill demand and price anchors:** multiple venture-backed and AI entrants (Avelis Health YC, CareRoute, Goodbill, Resolve). Viral anecdote of a hospital bill cut from $195K to about $33–37K using Claude/ChatGPT (single case) — [POCIT](https://peopleofcolorintech.com/articles/y-combinator-invests-500k-in-ai-startup-helping-americans-save-money-on-medical-bills/); [DEV Community](https://dev.to/technoblogger14o3/using-ai-to-negotiate-a-195k-hospital-bill-down-to-33k-582j)
- **Vehicle history moat:** Carfax segment revenue is still growing 8% year on year in Q2 2026 despite $5–$10 NMVTIS competitors. Cheap reports draw accuracy complaints — [BusinessWire](https://secure.businesswire.com/news/home/20260806846937/en/Mobility-Global-Reports-Second-Quarter-2026-Financial-Results); [Trustpilot VinAudit](https://ca.trustpilot.com/review/vinaudit.com?page=10)
- **Flight-comp consolidation:** AirHelp acquired ClaimCompass in Jan 2025. Airlines like Ryanair push direct claims — [Capital.bg](https://www.capital.bg/en/business/2025/01/30/4735972_berlin-based_airhelp_acquires_bulgarias_claimcompass/); [Ryanair](https://help.ryanair.com/hc/en-ie/articles/12890736320529-Beware-of-claims-chasers)
- **ATS commoditization:** free scanners (SkillSyncer) and one-time-scan sellers already undercut Jobscan's $49.95/month — [ATS Verification](https://atsverification.com/vs/jobscan/); [JobShinobi](https://jobshinobi.com/compare/best-jobscan-alternative-free)
- **NHD distribution moat:** agents and brokers pick the vendor, and there is a referral-payment history — [Inman 2008](https://inman.com/2008/08/7/brokers-property-id-agree-39-million-settlement)

### Inferences

**#1 — Flat-fee property-tax appeal packet (US; start with 25–35% contingency states such as TX, GA, FL, IL, CA).**
- Price/cost: $29–$49 flat (or $19 plus $10 per extra year) against Ownwell's 25–35% and others' 40–50%. Unit cost is the comps data plus LLM, probably a few dollars (not verified).
- Demand: proven at scale (Ownwell's 500k+ customers). The search intent is seasonal and county-specific ("protest property taxes [county]"), which suits programmatic SEO across about 3,000 counties.
- Legal: clean if the homeowner files and the product sells evidence and instructions, not representation. Avoid acting as agent in TX without TDLR registration.
- Moat/why not undercut yet: contingency firms prefer percentage economics and full-service convenience. Undercutting is now starting (AppealDesk $49; Ownwell's possibly-free packet), so speed and county-level SEO depth matter. The main risk is that Ownwell gives the packet away free as lead-gen for its contingency service.

**#2 — USCIS certified translation: machine draft plus human certification, at about $12–$15/page (vs. $25–$40).**
- Price/cost: MT is about $0.04/page. The human certifier is the real cost (unverified, plausibly a few dollars per standard civil document such as birth or marriage certificates, which are templated).
- Demand: steady immigration filings, and the ecosystem of vendors buying SEO proves search demand.
- Legal: US rule needs only a competent translator's signed certification; no license or notarization. Do not let the AI "self-certify". Avoid EU sworn-translation markets.
- Moat: the incumbents' moat is trust and an "acceptance guarantee", not data. A solo builder can match it with a refund guarantee plus templated document types. Distribution through SEO, immigration-lawyer and DIY-immigration-platform partnerships, and Reddit (r/USCIS).

**#3 — Medical-bill error audit and dispute kit at $19–$49 flat (vs. 10–35% contingency, $800 minimums).**
- Price/cost: OCR plus an LLM read of an itemized bill and EOB costs under $0.10. The output is an error list, a dispute or hardship letter, a phone script, and a check of whether the bill qualifies for the CMS PPDR ($25, ≥$400 over the GFE) or charity care.
- Demand: an obvious, high-pain need, with VC-funded entrants signalling market belief.
- Legal: HIPAA generally does not apply to a consumer-directed tool that is not a covered entity or business associate. Comply with the FTC Health Breach Notification Rule and avoid "lawyer/negotiator" claims (DoNotPay precedent).
- Moat: incumbents' value is human phone negotiation; a DIY kit captures the people who can't justify a 20–35% cut. Distribution through SEO ("itemized hospital bill errors", "how to dispute a medical bill"), patient communities and credit-counseling partners.

**Runners-up**
- **Diminished-value reports** ($49–$99 vs. $225–$425): an excellent price gap and consumer intent, but whether insurers accept a non-appraiser or non-USPAP report is unverified. A hybrid (software draft plus a licensed appraiser sign-off for a fee) may be needed.
- **IMEI check** (about $2–$5 vs. €0.085 cost): clean and near-pure margin, but low-ticket and SEO-crowded. Best as a feature bundled with used-phone marketplace content.

**Not recommended for a solo launch:** vehicle history (proprietary-data moat, NMVTIS contracting, crowded $5–$10 tier, ToS risk from "cheap Carfax" resale); résumé/ATS and AI-text detection (already free or near-free); window stickers (free competitors); catfish reverse-image search (free Lens/TinEye, BIPA and people-search adjacency); passport photos (BIPA); parking tickets (UPL and FTC risk, city-by-city rules); trademark search (thin consumer demand, UPL edge); NHD (agent-controlled distribution, liability); flight compensation (free direct claims, litigation moat, no US compensation regime).

### Gaps
- No keyword-volume or CPC data was gathered for any category. The SEO viability claims are inference.
- The cost and licensing of property comps data, used-car comps data and flight-status data need pricing before a build decision.
- The price of Ownwell's National Appeals Packet (free or paid) is unconfirmed. It decides whether play #1 has room.
- Human-certifier labor cost and USCIS rejection rates for low-cost certified translations were not researched.
