import React from 'react';

const PromoBanner = React.lazy(() =>
  import('../components/PromoBannerComponent').then(module => ({
    default: module.PromoBannerComponent,
  }))
);
const AISearchBar = React.lazy(() => import('../components/AISearchBar'));

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ComponentRegistry: Record<string, React.ComponentType<any>> = {
  PromoBanner,
  PROMO_BANNER: PromoBanner,
  AISearchBar,
  AI_SEARCH_BAR: AISearchBar,
  HOME_SEARCH_HEADER: AISearchBar,
};

/**
 * Resolves a component type string to its React component.
 * Returns null if the type is not registered.
 */
export function resolveComponent(type: string): React.ComponentType<any> | null {
  return ComponentRegistry[type] ?? null;
}
