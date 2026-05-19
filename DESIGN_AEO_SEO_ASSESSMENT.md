# AEO/SEO Assessment Tool Design

**Status:** Implemented in the OCDP Console prototype  
**Last Updated:** 2026-05-20

## Overview

The AEO/SEO assessment tool evaluates Web Standard pages and journeys when authors submit them for approval. It gives immediate search-quality feedback before maker-checker approval starts, while still allowing authors to proceed when business urgency requires it.

SDUI and WeChat channel pages bypass this assessment because they are not the search-indexed Web Standard surface.

## Current State

- AEO scores are shown in the OCDP Analyse/AEO experience.
- Web Standard submission runs an AEO assessment modal before approval submission.
- Scores are calculated by `ocdp-console/src/utils/aeoCalculator.ts`.
- The modal lives at `ocdp-console/src/components/deliver/AEOAssessmentModal.tsx`.
- Scores are stored in OCDP state for future review.
- Web Standard metadata fields include `webMetaTitle`, `webMetaDescription`, and `webSlug`.

## Assessment Model

| Category | Points | Signals |
|----------|--------|---------|
| SEO Metadata | 40 | meta title, meta description, URL slug |
| Content Structure | 30 | FAQ schema, product schema, structured page slices |
| Content Quality | 20 | freshness, author credentials |
| Technical SEO | 10 | direct answers, rich media |

Grading scale:

| Grade | Score |
|-------|-------|
| A | 90-100 |
| B | 80-89 |
| C | 70-79 |
| D | 60-69 |
| F | 0-59 |

## User Flow

```text
User clicks Submit for Approval
  -> check channel
  -> Web Standard opens AEOAssessmentModal
  -> score and recommendations are shown
  -> author chooses Submit, Improve Content, or Cancel
  -> approved submission continues into maker-checker workflow
```

## Implementation Files

| File | Role |
|------|------|
| `ocdp-console/src/components/deliver/AEOAssessmentModal.tsx` | Score and recommendation modal |
| `ocdp-console/src/utils/aeoCalculator.ts` | Assessment algorithm |
| `ocdp-console/src/components/deliver/PageLibraryPanel.tsx` | Page submission integration |
| `ocdp-console/src/components/deliver/JourneyBuilderPanel.tsx` | Journey submission integration |
| `ocdp-console/src/store/OCDPStore.tsx` | Score persistence in OCDP state |

## Related Current Capabilities

| Capability | Current state |
|------------|---------------|
| AI Search Admin | Seeds `HK HarmonyNext App Semantic Search` with entry-point/content config, governed video/image/file URLs, and audience visibility rules |
| CI/CD | Root Jenkins pipeline covers AWS overseas plus mainland China IKP/Alicloud/Tencent deployment flows |
| Observability | OpenTelemetry design plus client startup/network trace bridges for Web, iOS, Android and HarmonyNext |
| Mainland China | IKP runtime, Alicloud private authoring, Tencent COS/CDN and China-local telemetry boundaries are documented |

## Benefits

- Catches SEO/AEO issues before approval.
- Teaches authors the expected metadata and content quality bar.
- Keeps submission flexible rather than blocking low scores.
- Stores scores for historical analysis.

## Future Enhancements

- Real-time score preview in the page editor.
- Automated suggestions with "Fix" actions.
- Search Console or enterprise SEO tool integration.
- Competitive analysis against similar pages.
- A/B testing recommendations tied to AEO score deltas.
