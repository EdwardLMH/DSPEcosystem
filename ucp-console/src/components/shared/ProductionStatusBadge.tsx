import React from 'react';
import { ProductionStatus } from '../../types/ucp';

interface ProductionStatusBadgeProps {
  status: ProductionStatus;
  size?: 'sm' | 'md';
}

const CONFIG: Record<ProductionStatus, { label: string; color: string; bg: string; strikethrough?: boolean }> = {
  LIVE:           { label: 'Live',           color: 'var(--prod-live)',  bg: 'var(--prod-live-bg)' },
  NEVER_RELEASED: { label: 'Never Released', color: 'var(--prod-never)', bg: 'var(--prod-never-bg)' },
  ROLLED_BACK:    { label: 'Rolled Back',    color: 'var(--prod-rolled)',bg: 'var(--prod-rolled-bg)' },
  SUPERSEDED:     { label: 'Superseded',     color: 'var(--prod-never)', bg: 'var(--prod-never-bg)', strikethrough: true },
};

const DOT: Record<ProductionStatus, string> = {
  LIVE:           '#059669',
  NEVER_RELEASED: '#9CA3AF',
  ROLLED_BACK:    '#D97706',
  SUPERSEDED:     '#9CA3AF',
};

export function ProductionStatusBadge({ status, size = 'md' }: ProductionStatusBadgeProps) {
  const cfg = CONFIG[status];
  const fontSize = size === 'sm' ? 9 : 11;
  const padding  = size === 'sm' ? '2px 6px' : '3px 9px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: cfg.bg,
      color: cfg.color,
      fontSize,
      fontWeight: 600,
      padding,
      borderRadius: 'var(--radius-full)',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      textDecoration: cfg.strikethrough ? 'line-through' : 'none',
    }}>
      <span style={{
        width: size === 'sm' ? 5 : 6,
        height: size === 'sm' ? 5 : 6,
        borderRadius: '50%',
        background: DOT[status],
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
