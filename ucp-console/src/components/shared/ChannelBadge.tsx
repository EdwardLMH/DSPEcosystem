import React from 'react';
import { Channel } from '../../types/ucp';

interface ChannelBadgeProps {
  channel: Channel;
  size?: 'sm' | 'md';
}

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: string; color: string; bg: string }> = {
  SDUI:         { label: 'SDUI',    icon: '📱', color: '#fff', bg: 'var(--channel-sdui)' },
  WEB_STANDARD: { label: 'Web',     icon: '🌐', color: '#fff', bg: 'var(--channel-web)' },
  WEB_WECHAT:   { label: 'WeChat',  icon: '💬', color: '#fff', bg: 'var(--channel-wechat)' },
};

export function ChannelBadge({ channel, size = 'md' }: ChannelBadgeProps) {
  const cfg = CHANNEL_CONFIG[channel];
  const fontSize = size === 'sm' ? 10 : 11;
  const iconSize = size === 'sm' ? 10 : 12;
  const padding  = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: cfg.bg,
      color: cfg.color,
      fontSize,
      fontWeight: 700,
      padding,
      borderRadius: 'var(--radius-sm)',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: iconSize, lineHeight: 1 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
