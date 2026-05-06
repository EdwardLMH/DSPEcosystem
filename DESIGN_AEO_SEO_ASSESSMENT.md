# AEO/SEO Assessment Tool Design

## Overview
Add an AEO/SEO assessment tool that automatically evaluates pages and journeys when submitting them for approval in the Web Standard channel. This provides immediate feedback on search engine optimization quality before the approval process begins.

## Current State
- AEO scores exist in the system (`AEOPanel.tsx`) but are only viewable in a separate "Analyse" section
- Scores are pre-calculated and stored in `aeoScores` state
- Submission flow (`SUBMIT_PAGE`, `SUBMIT_JOURNEY`) directly changes status to `PENDING_APPROVAL` without any assessment
- Web Standard channel has SEO metadata fields: `webMetaTitle`, `webMetaDescription`, `webSlug`

## Proposed Solution

### 1. Assessment Modal Component
Create a new `AEOAssessmentModal` component that:
- Appears automatically when user clicks "Submit for Approval" for Web Standard channel pages/journeys
- Calculates AEO/SEO score in real-time based on page content
- Displays score breakdown with visual indicators (A-F grade)
- Shows recommendations for improvement
- Allows user to:
  - **Proceed with submission** (even with low score)
  - **Cancel and improve** (return to editing)
  - **View detailed breakdown** (expandable sections)

### 2. Assessment Algorithm
Calculate AEO/SEO score based on these criteria:

#### SEO Metadata (40 points)
- **Meta Title** (15 points)
  - Exists: 5 points
  - Length 30-60 chars: 5 points
  - Contains keywords: 5 points
- **Meta Description** (15 points)
  - Exists: 5 points
  - Length 120-160 chars: 5 points
  - Contains call-to-action: 5 points
- **URL Slug** (10 points)
  - Exists: 5 points
  - SEO-friendly (lowercase, hyphens, no special chars): 5 points

#### Content Structure (30 points)
- **FAQ Schema** (10 points): Has FAQ-type slices or content
- **Product Schema** (10 points): Has product-related slices (WEALTH_SELECTION, PROMO_BANNER)
- **Structured Content** (10 points): Has organized slices (HEADER_NAV, FUNCTION_GRID)

#### Content Quality (20 points)
- **Freshness** (10 points): Recently created/updated (within 30 days)
- **Author Credentials** (10 points): Has author information or credentials

#### Technical SEO (10 points)
- **Direct Answers** (5 points): Has clear value propositions in slices
- **Rich Media** (5 points): Has VIDEO_PLAYER or image-rich slices

**Grading Scale:**
- A: 90-100 points
- B: 80-89 points
- C: 70-79 points
- D: 60-69 points
- F: 0-59 points

### 3. Integration Points

#### PageLibraryPanel.tsx
- Modify "Submit for Approval" button click handler
- Check if channel is `WEB_STANDARD`
- If yes, show `AEOAssessmentModal` before dispatching `SUBMIT_PAGE`
- If no, proceed with normal submission

#### JourneyLibraryPanel.tsx
- Similar integration for journey submission
- Check if journey has Web Standard pages
- Show assessment modal before dispatching `SUBMIT_JOURNEY`

#### OCDPStore.tsx
- Add new action: `CALCULATE_AEO_SCORE`
- When `SUBMIT_PAGE` or `SUBMIT_JOURNEY` is dispatched, automatically calculate and store AEO score
- Store score in `aeoScores` array for future reference

### 4. User Flow

```
User clicks "Submit for Approval"
    ���
Check if channel === 'WEB_STANDARD'
    ↓ (yes)
Calculate AEO/SEO score
    ↓
Show AEOAssessmentModal with:
    - Overall score & grade (A-F)
    - Visual score breakdown
    - Recommendations
    - Action buttons
    ↓
User chooses:
    - "Proceed Anyway" �� dispatch SUBMIT_PAGE → status = PENDING_APPROVAL
    - "Improve Content" → close modal → stay in DRAFT
    - "View Details" → expand breakdown sections
```

### 5. UI Design

#### Modal Layout
```
┌─��───��──���────��──���──────��──���─────��──���────��───��┐
│  AEO/SEO Assessment                    [×]  │
��──���──��──���─────��──���──��──���──────��──���────��───��──��
│                                             │
│  ┌───��──��──���───��──���─────��─────��──���─────┐   │
��  │         [A]  Score: 88              │   ��
│  │    ██���██��██���██████��░░���░              │   │
│  └──��──���──��──���────��───��──���────��──���────��┘   │
│                                             │
│  ✅ Meta Title (15/15)                      │
│  �� Meta Description (15/15)                │
��  ✅ URL Slug (10/10)                        │
│  ��� FAQ Schema (10/10)                      │
│  ��� Product Schema (10/10)                  │
│  ✅ Structured Content (10/10)              │
│  ✅ Freshness (10/10)                       │
│  ❌ Author Credentials (0/10)               │
│  ��️  Direct Answers (3/5)                   │
│  ✅ Rich Media (5/5)                        │
���                                             │
│  💡 Recommendations:                        │
│  • Add author credentials to improve trust ���
│  • Enhance direct answer content           │
│                                             ���
│  [Cancel]  [Improve Content]  [Submit ✓]   │
└─��────��──���────��───��──���────��────��──���─────��──���─┘
```

### 6. Technical Implementation

#### New Files
- `/src/components/deliver/AEOAssessmentModal.tsx` - Modal component
- `/src/utils/aeoCalculator.ts` - Assessment algorithm

#### Modified Files
- `/src/components/deliver/PageLibraryPanel.tsx` - Add modal trigger
- `/src/components/deliver/JourneyLibraryPanel.tsx` - Add modal trigger
- `/src/store/OCDPStore.tsx` - Add CALCULATE_AEO_SCORE action
- `/src/types/ocdp.ts` - Add any new types if needed

### 7. Benefits
- **Proactive Quality Control**: Catch SEO issues before approval
- **Educational**: Authors learn SEO best practices
- **Flexible**: Doesn't block submission, just provides guidance
- **Consistent**: Standardized scoring across all Web Standard content
- **Traceable**: Scores stored for historical analysis

### 8. Future Enhancements
- Real-time score preview in page editor
- Automated suggestions with "Fix" buttons
- Integration with external SEO tools (Google Search Console, etc.)
- Competitive analysis against similar pages
- A/B testing recommendations
