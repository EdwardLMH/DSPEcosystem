import React from 'react';

interface MarketBadgeProps {
  marketId: string;
  scope?: 'GLOBAL' | 'MARKET';
  size?: 'sm' | 'md';
}

export function MarketBadge({ marketId, scope, size = 'md' }: MarketBadgeProps) {
  const isGlobal = scope === 'GLOBAL' || marketId === 'GLOBAL';

  const fontSize = size === 'sm' ? 9 : 10;
  const padding  = size === 'sm' ? '2px 6px' : '3px 8px';

  const style: React.CSSProperties = isGlobal
    ? {
        background: 'rgba(200,169,81,0.15)',
        color: '#92671A',
        border: '1px solid rgba(200,169,81,0.35)',
      }
    : {
        background: 'var(--market-badge-bg)',
        color: 'var(--market-badge)',
        border: '1px solid rgba(219,0,17,0.15)',
      };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize,
      fontWeight: 700,
      padding,
      borderRadius: 'var(--radius-sm)',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      ...style,
    }}>
      {isGlobal ? '🌐' : '📍'} {marketId}
    </span>
  );
}
