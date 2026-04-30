import React from 'react';
import { AEOGrade } from '../../types/ucp';

interface AEOGradeBadgeProps {
  grade: AEOGrade;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const GRADE_CONFIG: Record<AEOGrade, { color: string; bg: string; label: string }> = {
  A: { color: 'var(--aeo-a)', bg: 'var(--aeo-a-bg)', label: 'Excellent' },
  B: { color: 'var(--aeo-b)', bg: 'var(--aeo-b-bg)', label: 'Good' },
  C: { color: 'var(--aeo-c)', bg: 'var(--aeo-c-bg)', label: 'Fair' },
  D: { color: 'var(--aeo-d)', bg: 'var(--aeo-d-bg)', label: 'Poor' },
  F: { color: 'var(--aeo-f)', bg: 'var(--aeo-f-bg)', label: 'Failing' },
};

export function AEOGradeBadge({ grade, score, size = 'md' }: AEOGradeBadgeProps) {
  const cfg = GRADE_CONFIG[grade];

  const gradeFont   = size === 'lg' ? 22 : size === 'md' ? 16 : 12;
  const scoreFont   = size === 'lg' ? 11 : size === 'md' ? 10 : 9;
  const labelFont   = size === 'lg' ? 10 : 9;
  const padding     = size === 'lg' ? '8px 14px' : size === 'md' ? '5px 10px' : '3px 7px';
  const gap         = size === 'lg' ? 10 : 6;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap,
      background: cfg.bg,
      color: cfg.color,
      padding,
      borderRadius: 'var(--radius-md)',
      flexShrink: 0,
      border: `1.5px solid ${cfg.color}30`,
    }}>
      {/* Grade letter */}
      <span style={{
        fontSize: gradeFont,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {grade}
      </span>

      {/* Score + label */}
      {(score !== undefined || size !== 'sm') && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {score !== undefined && (
            <span style={{ fontSize: scoreFont, fontWeight: 700, lineHeight: 1 }}>
              {score} pts
            </span>
          )}
          {size !== 'sm' && (
            <span style={{ fontSize: labelFont, fontWeight: 500, opacity: 0.75, lineHeight: 1 }}>
              {cfg.label}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
