import type { PageLayout, AEOScore } from '../types/ocdp';

interface ScoreBreakdownItem {
  label: string;
  score: number;
  maxScore: number;
  pass: boolean;
  recommendation?: string;
}

/**
 * Calculate AEO/SEO score for a Web Standard page
 */
export function calculateAEOScore(page: PageLayout, targetId: string): AEOScore {
  const breakdown: ScoreBreakdownItem[] = [];
  let totalScore = 0;

  // ─── SEO Metadata (40 points) ──���──��──���──��────��──���────��──���────��──��────��──���───

  // Meta Title (15 points)
  let metaTitleScore = 0;
  const metaTitle = page.webMetaTitle || '';
  if (metaTitle) metaTitleScore += 5;
  if (metaTitle.length >= 30 && metaTitle.length <= 60) metaTitleScore += 5;
  if (/hsbc|bank|wealth|credit|loan|card/i.test(metaTitle)) metaTitleScore += 5;
  breakdown.push({
    label: 'Meta Title',
    score: metaTitleScore,
    maxScore: 15,
    pass: metaTitleScore >= 10,
    recommendation: metaTitleScore < 10 ? 'Add a descriptive title (30-60 chars) with relevant keywords' : undefined,
  });
  totalScore += metaTitleScore;

  // Meta Description (15 points)
  let metaDescScore = 0;
  const metaDesc = page.webMetaDescription || '';
  if (metaDesc) metaDescScore += 5;
  if (metaDesc.length >= 120 && metaDesc.length <= 160) metaDescScore += 5;
  if (/apply|learn|discover|explore|get|open|start/i.test(metaDesc)) metaDescScore += 5;
  breakdown.push({
    label: 'Meta Description',
    score: metaDescScore,
    maxScore: 15,
    pass: metaDescScore >= 10,
    recommendation: metaDescScore < 10 ? 'Add a compelling description (120-160 chars) with a call-to-action' : undefined,
  });
  totalScore += metaDescScore;

  // URL Slug (10 points)
  let slugScore = 0;
  const slug = page.webSlug || '';
  if (slug) slugScore += 5;
  if (/^[a-z0-9-/]+$/.test(slug) && !slug.includes('_') && !slug.includes(' ')) slugScore += 5;
  breakdown.push({
    label: 'URL Slug',
    score: slugScore,
    maxScore: 10,
    pass: slugScore >= 5,
    recommendation: slugScore < 5 ? 'Add an SEO-friendly URL slug (lowercase, hyphens, no special chars)' : undefined,
  });
  totalScore += slugScore;

  // ──�� Content Structure (30 points) ─���───��──���────��───��──���──────��──���───��──���────

  // FAQ Schema (10 points)
  const hasFAQ = page.slices.some(s =>
    s.type === 'AI_ASSISTANT' ||
    s.type === 'AI_SEARCH_BAR' ||
    (s.props && typeof s.props === 'object' && 'faq' in s.props)
  );
  const faqScore = hasFAQ ? 10 : 0;
  breakdown.push({
    label: 'FAQ Schema',
    score: faqScore,
    maxScore: 10,
    pass: faqScore >= 5,
    recommendation: faqScore < 5 ? 'Add FAQ or Q&A content to improve answer engine visibility' : undefined,
  });
  totalScore += faqScore;

  // Product Schema (10 points)
  const hasProduct = page.slices.some(s =>
    s.type === 'WEALTH_SELECTION' ||
    s.type === 'PROMO_BANNER' ||
    s.type === 'FEATURED_RANKINGS' ||
    s.type === 'FLASH_LOAN'
  );
  const productScore = hasProduct ? 10 : 0;
  breakdown.push({
    label: 'Product Schema',
    score: productScore,
    maxScore: 10,
    pass: productScore >= 5,
    recommendation: productScore < 5 ? 'Add product showcases or promotional content' : undefined,
  });
  totalScore += productScore;

  // Structured Content (10 points)
  const hasStructure = page.slices.some(s =>
    s.type === 'HEADER_NAV' ||
    s.type === 'FUNCTION_GRID' ||
    s.type === 'QUICK_ACCESS'
  );
  const structureScore = hasStructure ? 10 : 5;
  breakdown.push({
    label: 'Structured Content',
    score: structureScore,
    maxScore: 10,
    pass: structureScore >= 5,
    recommendation: structureScore < 10 ? 'Add navigation or grid components for better structure' : undefined,
  });
  totalScore += structureScore;

  // ──��� Content Quality (20 points) ──��──���────��───��──���────��──���────��──���────��──��──

  // Freshness (10 points) - assume pages without lastReviewedAt are recent
  const freshnessScore = 10; // In real implementation, check creation/update date
  breakdown.push({
    label: 'Freshness',
    score: freshnessScore,
    maxScore: 10,
    pass: freshnessScore >= 5,
  });
  totalScore += freshnessScore;

  // Author Credentials (10 points)
  const hasAuthor = !!page.authorCredentials;
  const authorScore = hasAuthor ? 10 : 0;
  breakdown.push({
    label: 'Author Credentials',
    score: authorScore,
    maxScore: 10,
    pass: authorScore >= 5,
    recommendation: authorScore < 5 ? 'Add author credentials to build trust and authority' : undefined,
  });
  totalScore += authorScore;

  // ─── Technical SEO (10 points) ─��──��──��──���────��────��──���─────��──���──��──���────��──

  // Direct Answers (5 points)
  const hasDirectAnswer = page.slices.some(s =>
    s.type === 'MARKET_BRIEFING_TEXT' ||
    s.type === 'CONTACT_RM_CTA'
  ) || (page.description && page.description.length > 50);
  const directAnswerScore = hasDirectAnswer ? 5 : 2;
  breakdown.push({
    label: 'Direct Answers',
    score: directAnswerScore,
    maxScore: 5,
    pass: directAnswerScore >= 3,
    recommendation: directAnswerScore < 3 ? 'Add clear, concise answers to common questions' : undefined,
  });
  totalScore += directAnswerScore;

  // Rich Media (5 points)
  const hasRichMedia = page.slices.some(s =>
    s.type === 'VIDEO_PLAYER' ||
    s.type === 'AD_BANNER' ||
    s.type === 'PROMO_BANNER'
  );
  const richMediaScore = hasRichMedia ? 5 : 0;
  breakdown.push({
    label: 'Rich Media',
    score: richMediaScore,
    maxScore: 5,
    pass: richMediaScore >= 3,
    recommendation: richMediaScore < 3 ? 'Add images, videos, or visual content to enhance engagement' : undefined,
  });
  totalScore += richMediaScore;

  // ─��─ Calculate Grade ──��──���──��───��──���────��───��──────��──���──��──��──���──��──���────��─

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';
  else grade = 'F';

  return {
    pageId: page.pageId,
    targetId,
    score: totalScore,
    grade,
    checkedAt: new Date().toISOString(),
    breakdown,
  };
}

/**
 * Get recommendations from AEO score breakdown
 */
export function getRecommendations(score: AEOScore): string[] {
  return score.breakdown
    .filter(item => item.recommendation)
    .map(item => item.recommendation!);
}

/**
 * Check if a page should show AEO assessment (Web Standard channel only)
 */
export function shouldShowAEOAssessment(page: PageLayout): boolean {
  return page.channel === 'WEB_STANDARD';
}
