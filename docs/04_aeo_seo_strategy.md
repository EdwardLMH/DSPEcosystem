# AEO & SEO Strategy — LLM Visibility and Search Performance

**Document Version:** 1.0  
**Date:** 2026-04-19  
**Scope:** AEO Monitoring, Schema.org Implementation, SEO Foundations, Feedback to CMS  

---

## 1. Executive Summary

As of 2025–2026, a significant and accelerating shift in customer search behaviour directly impacts how HSBC acquires digital customers. Customers researching banking products increasingly bypass traditional search engine result pages (SERPs) and instead receive direct answers from large language model (LLM) engines: ChatGPT, Perplexity, Google AI Overviews, and Bing Copilot. If HSBC content is not structured to be cited by these engines, the customer never reaches HSBC.com — the competitor whose content is cited wins the consideration moment.

**Answer Engine Optimisation (AEO)** is the discipline of structuring, tagging, and maintaining content so that LLM engines select it as the authoritative cited answer for financial queries. Unlike traditional SEO — which optimises for ranking position in a list — AEO optimises for being selected as *the* answer in a conversational response.

This document defines the AEO strategy, the technical implementation within the Stripes CMS and DAP, the LLM visibility monitoring architecture, and the SEO foundations that underpin discoverability for both traditional and AI-powered search.

---

## 2. Search Behaviour Shift

```
TRADITIONAL SEARCH (pre-2024):

  Customer query: "best credit card no fx fee hong kong"
         │
         ▼
  Google SERP: 10 blue links ranked by SEO
         │
         ▼
  Customer clicks HSBC.com link (if ranked top 3)
         │
         ▼
  HSBC content page — conversion opportunity

──────────────────────────────────────────────────

LLM-ERA SEARCH (2025–2026):

  Customer query: "best credit card no fx fee hong kong"
         │
         ▼
  ChatGPT / Perplexity / Google AI Overview
  generates direct conversational answer:
  "The HSBC Visa Platinum card offers no FX fee on
   overseas transactions. As of Q1 2026, the rate is..."
   [Source: HSBC.com/credit-cards/visa-platinum]
         │
         ├── HSBC cited → customer sees HSBC brand, clicks source
         │
         └── Competitor cited → HSBC invisible in this interaction

IMPACT: If HSBC content is not AEO-optimised,
        the entire acquisition funnel begins at a loss.
```

### 2.1 Key Banking Queries Now Answered by LLMs

| Query Type | Example | LLM Behaviour |
|-----------|---------|--------------|
| Product comparison | "HSBC vs Hang Seng mortgage rates" | Aggregates rates from structured sources |
| Eligibility | "Who qualifies for HSBC Jade?" | Pulls eligibility criteria from content |
| How-to | "How to open HSBC account in HK as expat" | Generates step-by-step from HowTo schema |
| Rate lookup | "HSBC savings rate today" | Pulls from structured / freshness-stamped content |
| Feature question | "Does HSBC Premier have airport lounge access?" | Answers from FAQPage schema |

---

## 3. AEO Content Pipeline

### 3.1 Full Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        AEO Content Pipeline                               │
│                                                                            │
│  STEP 1 — AUTHORING (Stripes CMS)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Content editor fills mandatory AEO fields per product page:         │ │
│  │  ✅ Product name (structured field, not free text)                   │ │
│  │  ✅ Rate / fee (structured numeric field — auto-stamped with date)   │ │
│  │  ✅ FAQ block (min 3 Q&A pairs — AEO gate blocks publish if missing) │ │
│  │  ✅ Author credential (CFP / CFA / Licensed Banker badge)            │ │
│  │  ✅ Last reviewed date (mandatory — blocks publish if > 90 days)     │ │
│  │  ✅ Regulatory references (HKMA / SFC / FCA links)                  │ │
│  │  ✅ First-paragraph answer (must directly answer primary query)      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  STEP 2 — SCHEMA AUTO-GENERATION                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  CMS publish → Schema Generator Service reads structured CMS fields  │ │
│  │  → emits JSON-LD into page <head> automatically:                     │ │
│  │                                                                       │ │
│  │  • FinancialProduct (all product pages)                               │ │
│  │  • FAQPage (from FAQ block)                                           │ │
│  │  • HowTo (from step-by-step guide content type)                       │ │
│  │  • BankOrCreditUnion (entity disambiguation — site-wide)              │ │
│  │  • BreadcrumbList (from CMS content hierarchy)                        │ │
│  │  • Article + author + dateModified (from authored content fields)     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  STEP 3 — LLM CRAWLER ACCESSIBILITY                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  • robots.txt: allow GPTBot, PerplexityBot, ClaudeBot, BingBot      │ │
│  │  • llms.txt: machine-readable product index at /llms.txt            │ │
│  │  • Sitemap priority: product + FAQ pages set to 1.0                 │ │
│  │  • Page speed: LCP < 2.5s (crawl budget and E-E-A-T signal)         │ │
│  │  • HTTPS only: all canonical URLs HTTPS                              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Schema.org Implementation Guide

### 4.1 FinancialProduct — Credit Card Example

```json
{
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "HSBC Visa Platinum Credit Card",
  "description": "No foreign transaction fee credit card for global travellers. Earn rewards on every spend.",
  "url": "https://www.hsbc.com.hk/credit-cards/visa-platinum/",
  "provider": {
    "@type": "BankOrCreditUnion",
    "name": "HSBC",
    "legalName": "The Hongkong and Shanghai Banking Corporation Limited",
    "url": "https://www.hsbc.com.hk",
    "regulatoryBody": {
      "@type": "Organization",
      "name": "Hong Kong Monetary Authority",
      "url": "https://www.hkma.gov.hk"
    }
  },
  "feesAndCommissionsSpecification": "No annual fee for first year; HKD 1,800 thereafter. No foreign transaction fee.",
  "annualPercentageRate": {
    "@type": "QuantitativeValue",
    "value": 36.00,
    "unitText": "P/A"
  },
  "offers": {
    "@type": "Offer",
    "description": "0% interest on new purchases for first 6 months. Welcome gift: 20,000 bonus miles.",
    "validFrom": "2026-01-01",
    "validThrough": "2026-06-30"
  },
  "dateModified": "2026-04-01",
  "author": {
    "@type": "Person",
    "name": "HSBC Cards Product Team",
    "hasCredential": "Licensed by HKMA"
  }
}
```

### 4.2 FAQPage — Mandatory for All Product Pages

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Does the HSBC Visa Platinum card charge a foreign transaction fee?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The HSBC Visa Platinum Credit Card has no foreign transaction fee on overseas purchases or online purchases in foreign currencies. This applies to all Visa transactions worldwide."
      }
    },
    {
      "@type": "Question",
      "name": "What is the minimum income requirement for the HSBC Visa Platinum card?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The minimum annual income requirement is HKD 150,000 for Hong Kong residents. Self-employed applicants must provide 3 months of bank statements."
      }
    },
    {
      "@type": "Question",
      "name": "How do I apply for the HSBC Visa Platinum card?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can apply online via the HSBC HK app or at hsbc.com.hk/credit-cards/visa-platinum. The application takes approximately 10 minutes. You will need your HKID, income proof, and address proof."
      }
    }
  ]
}
```

### 4.3 HowTo — Application Guide

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Apply for an HSBC Credit Card in Hong Kong",
  "description": "Step-by-step guide to applying for an HSBC credit card online in Hong Kong.",
  "totalTime": "PT10M",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Check eligibility",
      "text": "Confirm you meet the minimum income requirement (HKD 150,000 p.a.) and are aged 18 or over with a valid HKID."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Gather documents",
      "text": "Prepare your HKID, latest 1-month payslip or 3-month bank statement, and proof of address dated within 3 months."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Submit online application",
      "text": "Visit hsbc.com.hk/credit-cards or open the HSBC HK app. Select your preferred card and click Apply Now. Complete the form in approximately 10 minutes."
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Receive decision",
      "text": "Existing HSBC customers typically receive an instant decision. New customers receive a decision within 3 working days by email and SMS."
    }
  ]
}
```

### 4.4 BankOrCreditUnion — Entity Disambiguation (Site-Wide)

```json
{
  "@context": "https://schema.org",
  "@type": "BankOrCreditUnion",
  "name": "HSBC",
  "legalName": "The Hongkong and Shanghai Banking Corporation Limited",
  "url": "https://www.hsbc.com.hk",
  "logo": "https://www.hsbc.com.hk/assets/images/hsbc-logo.svg",
  "sameAs": [
    "https://en.wikipedia.org/wiki/HSBC",
    "https://www.wikidata.org/wiki/Q190524",
    "https://www.linkedin.com/company/hsbc"
  ],
  "foundingDate": "1865",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "HK",
    "addressLocality": "Hong Kong"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+852-2233-3000",
    "contactType": "customer service"
  }
}
```

---

## 5. llms.txt — Machine-Readable Product Index

The `llms.txt` standard (emerging 2025) provides a machine-readable index for LLM crawlers, analogous to `sitemap.xml` for traditional crawlers.

```
# File location: https://www.hsbc.com.hk/llms.txt
# Purpose: Machine-readable product and content index for LLM crawlers
# Updated: daily via CMS auto-generation
# Contact: digital-seo@hsbc.com.hk

# HSBC Hong Kong — Digital Product Index

## About HSBC Hong Kong
HSBC has been in Hong Kong since 1865. We serve personal, commercial, and
private banking customers across Hong Kong and Greater Bay Area.
Regulated by the Hong Kong Monetary Authority (HKMA).

## Credit Cards
- [HSBC Visa Platinum Card](/credit-cards/visa-platinum/): No FX fee, travel rewards, 0% intro APR
- [HSBC Red Credit Card](/credit-cards/red/): Cashback on online shopping, no annual fee
- [HSBC Premier Mastercard](/credit-cards/premier-mastercard/): Premier customers, unlimited lounge access
- [HSBC UnionPay Dual Currency Card](/credit-cards/unionpay/): HKD + RMB dual currency

## Mortgages
- [HSBC SmartMortgage](/mortgages/smart/): Offset mortgage linked to savings account
- [HSBC H-Plan Mortgage](/mortgages/h-plan/): HIBOR-linked flexible repayment
- [First Home Buyer Guide](/mortgages/first-home/): Step-by-step guide for first-time buyers

## Savings & Deposits
- [HSBC Everyday Savings](/savings/everyday/): No minimum balance, instant access
- [Time Deposit Rates](/savings/time-deposit/): Updated daily — 1-month to 24-month rates
- [HSBC Bonus Saver](/savings/bonus-saver/): Tiered bonus interest on qualifying spend

## Wealth & Premier
- [HSBC Premier](/wealth/premier/): Global banking, minimum HKD 1M in accounts or mortgage
- [HSBC Jade](/wealth/jade/): Private banking experience, minimum HKD 7.8M AUM
- [Investment Services](/wealth/investments/): Unit trusts, structured products, bonds

## Current Rates (Updated Daily)
- [Mortgage Rates](/rates/mortgage/): H-Plan and P-Plan rates, updated daily
- [Savings Rates](/rates/savings/): Time deposit, savings account rates
- [FX Rates](/rates/fx/): Live foreign exchange rates for 30+ currencies

## Regulatory Information
- Regulated by: Hong Kong Monetary Authority (HKMA)
- Deposit protection: Hong Kong Deposit Protection Board (up to HKD 500,000)
- Investment products: Licensed by Securities and Futures Commission (SFC)
```

---

## 6. LLM Visibility Monitoring System

### 6.1 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    LLM Probe & Monitor Service (Python)                   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Probe Query Bank (maintained in BigQuery: dap.aeo_query_bank)   │    │
│  │                                                                    │    │
│  │  Category: Credit Cards                                            │    │
│  │    "Best no FX fee credit card Hong Kong 2026"                    │    │
│  │    "HSBC credit card travel benefits Hong Kong"                   │    │
│  │    "Credit card with airport lounge access Hong Kong"             │    │
│  │    "Compare HSBC vs Hang Seng credit cards"                       │    │
│  │                                                                    │    │
│  │  Category: Mortgages                                               │    │
│  │    "HSBC mortgage rates Hong Kong today"                          │    │
│  │    "First home buyer mortgage Hong Kong how to apply"             │    │
│  │    "HIBOR vs Prime mortgage Hong Kong which is better"            │    │
│  │                                                                    │    │
│  │  Category: Wealth                                                  │    │
│  │    "What is HSBC Jade who qualifies"                              │    │
│  │    "HSBC Premier vs Jade difference"                              │    │
│  │    "Private banking minimum balance Hong Kong"                    │    │
│  │                                                                    │    │
│  │  Category: Savings                                                 │    │
│  │    "HSBC savings account interest rate Hong Kong"                 │    │
│  │    "Best time deposit rates Hong Kong 2026"                       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                    │                                       │
│                       Daily Probe Job (03:00 HKT)                         │
│                                    │                                       │
│         ┌──────────────────────────┼──────────────────────────┐           │
│         │                          │                           │           │
│  ┌──────▼──────┐         ┌─────────▼──────┐         ┌────────▼────────┐  │
│  │ ChatGPT API │         │ Perplexity API │         │ Bing Search API │  │
│  │ gpt-4o      │         │ sonar-pro      │         │ (AI answers)    │  │
│  │             │         │ (web-grounded) │         │                 │  │
│  └──────┬──────┘         └─────────┬──────┘         └────────┬────────┘  │
│         └──────────────────────────┼──────────────────────────┘           │
│                                    │                                       │
│                    ┌───────────────▼────────────────┐                     │
│                    │  Response Parser                │                     │
│                    │  • Is HSBC mentioned? (bool)    │                     │
│                    │  • Is HSBC cited with URL? (bool│                     │
│                    │  • Citation position (1st/2nd/..)│                    │
│                    │  • Which HSBC URL cited?        │                     │
│                    │  • Which competitor cited?      │                     │
│                    │  • Sentiment of HSBC mention    │                     │
│                    │  • Full answer text (stored)    │                     │
│                    └───────────────┬────────────────┘                     │
│                                    │                                       │
│                    ┌───────────────▼────────────────┐                     │
│                    │  BigQuery: dap.aeo_probe_results│                     │
│                    │  {probe_date, query_id, query,  │                     │
│                    │   llm_engine, hsbc_mentioned,   │                     │
│                    │   hsbc_cited, citation_position,│                     │
│                    │   competitor_cited, url_cited,  │                     │
│                    │   answer_text}                  │                     │
│                    └───────────────┬────────────────┘                     │
│                                    │                                       │
│         ┌──────────────────────────┼──────────────────────────┐           │
│         │                          │                           │           │
│  ┌──────▼──────────┐   ┌───────────▼──────────┐   ┌──────────▼────────┐  │
│  │ Looker AEO      │   │ Alert: citation share │   │ CMS Content Gap   │  │
│  │ Dashboard       │   │ drops > 10% WoW       │   │ Report (weekly)   │  │
│  │ (weekly trends) │   │ → Slack + email        │   │ → editor backlog  │  │
│  └─────────────────┘   └───────────────────────┘   └───────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Alert Thresholds

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Citation share drop | > 10% week-on-week | Slack alert to SEO/AEO team + CMS content gap task |
| Competitor overtakes HSBC in citation | Competitor cited for > 50% of category queries | Escalation to Head of Digital + content sprint |
| HSBC mentioned but not cited | > 30% of queries mention HSBC without URL | Schema.org audit triggered |
| New query type discovered | LLM answers query category with no HSBC citation | New query added to probe bank; content gap task created |
| Positive citation growth | Citation share grows > 15% after content update | STAR signal added to CPS; editor notified |

---

## 7. AEO Content Scoring Rubric (Per Page — 100 Points)

| Criterion | Points | How to Earn |
|-----------|--------|------------|
| FAQPage schema present and valid | 20 | Validated by Schema.org validator on publish |
| FinancialProduct / HowTo schema present | 20 | Auto-generated from CMS structured fields |
| Last reviewed date < 30 days | 15 | CMS mandatory date field; blocks publish if > 90 days |
| Author credentials declared | 10 | CMS author badge field (CFP / CFA / HKMA licensed) |
| Regulatory reference linked | 10 | At least 1 HKMA / SFC / FCA external link |
| Rate / fee in structured field (not image) | 10 | CMS structured numeric field used; not embedded in image |
| Direct answer in first 60 words | 10 | CMS writing guideline gate; editorial checklist |
| Cited by at least 1 LLM engine in last 30 days | 5 | From DAP AEO probe results |

**AEO Grade:**
- A: 85–100 pts  
- B: 70–84 pts  
- C: 50–69 pts  
- D: 30–49 pts  
- F: 0–29 pts  

---

## 8. Compliance-Safe AEO Framework

Banking content must satisfy both AEO optimisation and regulatory constraints simultaneously.

| Traditional Marketing Copy | AEO-Optimised (Compliant) |
|--------------------------|--------------------------|
| "Best rates in Hong Kong!" | "HSBC time deposit rates as of April 2026: 3.8% p.a. for 3-month HKD [updated monthly]" |
| "Guaranteed approval" | "Subject to credit assessment and eligibility criteria per HKMA guidelines" |
| Vague benefit claims | Specific, verifiable facts with sources |
| Gated / login-walled content | Publicly accessible answer content (for LLM crawlers) |
| Rate buried in PDF | Rate in structured field on public HTML page |

**Compliance gates in CMS publish workflow:**
1. Legal review required for any content with rate claims
2. Compliance checker scans for prohibited superlatives
3. Disclaimer auto-appended to all rate fields
4. All content must link to full T&C document

---

## 9. E-E-A-T Implementation for Banking

Google and LLMs weight **Experience, Expertise, Authoritativeness, Trustworthiness** signals heavily for YMYL (Your Money or Your Life) content.

| E-E-A-T Signal | HSBC Implementation |
|----------------|---------------------|
| Experience | Customer case studies (with consent); real product team authorship |
| Expertise | Author credential badges (CFA, CFP, HKMA Licensed) on all product pages |
| Authoritativeness | HKMA, SFC regulatory references; Google Knowledge Graph entity registration |
| Trustworthiness | HTTPS; clear T&C links; data freshness timestamps; Wikidata entity |

**Entity Disambiguation:**
- HSBC registered in Google Knowledge Graph (via structured data + Wikipedia consistency)
- Wikidata entry: `Q190524` (The Hongkong and Shanghai Banking Corporation)
- LinkedIn company page consistent with schema.org `BankOrCreditUnion` `sameAs` field
- All canonical URLs use `https://www.hsbc.com.hk` (no www vs non-www split)

---

## 10. SEO Foundations

| Area | Requirement | Target |
|------|-------------|--------|
| Core Web Vitals — LCP | Largest Contentful Paint | < 2.5s |
| Core Web Vitals — CLS | Cumulative Layout Shift | < 0.1 |
| Core Web Vitals — INP | Interaction to Next Paint | < 200ms |
| Crawl Budget | Product + FAQ pages priority | Sitemap priority = 1.0 |
| robots.txt | Allow LLM bots | GPTBot, PerplexityBot, ClaudeBot, BingBot all Allowed |
| Canonical Tags | No duplicate content | All pages have self-referencing canonical |
| Hreflang | Multi-locale | `en-HK`, `zh-HK`, `en-GB` hreflang correctly implemented |
| Internal Linking | Contextual links to product pages | Min 3 internal links per blog/insight page |
| Page Speed | SDUI-rendered pages | Brotli compression; image WebP; lazy load below fold |

### 10.1 robots.txt Configuration

```
User-agent: *
Disallow: /private/
Disallow: /api/
Disallow: /cms-preview/
Allow: /

# Allow all LLM crawlers explicitly
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: BingBot
Allow: /

Sitemap: https://www.hsbc.com.hk/sitemap.xml
Sitemap: https://www.hsbc.com.hk/sitemap-products.xml
Sitemap: https://www.hsbc.com.hk/sitemap-faq.xml
```
