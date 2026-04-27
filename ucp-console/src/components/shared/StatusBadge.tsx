import React from 'react';
import { WorkflowStatus } from '../../types/ucp';

const CONFIG: Record<WorkflowStatus, { label: string; bg: string; color: string; dot: string }> = {
  DRAFT:            { label: 'Draft',           bg: 'var(--status-draft-bg)',    color: 'var(--status-draft)',    dot: '#9CA3AF' },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: 'var(--status-pending-bg)', color: 'var(--status-pending)',  dot: '#D97706' },
  APPROVED:         { label: 'Approved',          bg: 'var(--status-approved-bg)',color: 'var(--status-approved)', dot: '#059669' },
  REJECTED:         { label: 'Rejected',          bg: 'var(--status-rejected-bg)',color: 'var(--status-rejected)', dot: '#DC2626' },
  LIVE:             { label: 'Live',              bg: 'var(--status-live-bg)',    color: 'var(--status-live)',     dot: '#2563EB' },
};

interface StatusBadgeProps {
  status: WorkflowStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = CONFIG[status];
  const fontSize = size === 'sm' ? 10 : 12;
  const padding  = size === 'sm' ? '2px 7px' : '3px 10px';
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
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}
