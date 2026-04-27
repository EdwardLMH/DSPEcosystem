import React from 'react';

// Lazy-loaded component imports — paths resolve to the components directory
const PromoBanner = React.lazy(() => import('../components/PromoBanner'));
const SurveyWidget = React.lazy(() => import('../components/SurveyWidget'));
const HeroBanner = React.lazy(() => import('../components/HeroBanner'));
const ProductCard = React.lazy(() => import('../components/ProductCard'));
const OfferTile = React.lazy(() => import('../components/OfferTile'));
const OfferCarousel = React.lazy(() => import('../components/OfferCarousel'));
const RichText = React.lazy(() => import('../components/RichText'));
const ImageBlock = React.lazy(() => import('../components/ImageBlock'));
const VideoBlock = React.lazy(() => import('../components/VideoBlock'));
const CTAButton = React.lazy(() => import('../components/CTAButton'));
const CTABanner = React.lazy(() => import('../components/CTABanner'));
const NavigationBar = React.lazy(() => import('../components/NavigationBar'));
const TabBar = React.lazy(() => import('../components/TabBar'));
const Divider = React.lazy(() => import('../components/Divider'));
const Spacer = React.lazy(() => import('../components/Spacer'));
const Badge = React.lazy(() => import('../components/Badge'));
const CountdownTimer = React.lazy(() => import('../components/CountdownTimer'));
const ProgressBar = React.lazy(() => import('../components/ProgressBar'));
const RatingStars = React.lazy(() => import('../components/RatingStars'));
const Disclaimer = React.lazy(() => import('../components/Disclaimer'));
const AccordionItem = React.lazy(() => import('../components/AccordionItem'));
const InfoCard = React.lazy(() => import('../components/InfoCard'));
const ComparisonTable = React.lazy(() => import('../components/ComparisonTable'));
const EligibilityChecker = React.lazy(() => import('../components/EligibilityChecker'));

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  PromoBanner,
  SurveyWidget,
  HeroBanner,
  ProductCard,
  OfferTile,
  OfferCarousel,
  RichText,
  ImageBlock,
  VideoBlock,
  CTAButton,
  CTABanner,
  NavigationBar,
  TabBar,
  Divider,
  Spacer,
  Badge,
  CountdownTimer,
  ProgressBar,
  RatingStars,
  Disclaimer,
  AccordionItem,
  InfoCard,
  ComparisonTable,
  EligibilityChecker,
};

/**
 * Resolves a component type string to its React component.
 * Returns null if the type is not registered.
 */
export function resolveComponent(type: string): React.ComponentType<any> | null {
  return ComponentRegistry[type] ?? null;
}
