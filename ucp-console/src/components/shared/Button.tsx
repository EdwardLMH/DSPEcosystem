import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  fullWidth,
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
    fontFamily: 'var(--font-family)',
    letterSpacing: '0.01em',
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: 12, padding: '5px 12px', height: 28 },
    md: { fontSize: 13, padding: '7px 16px', height: 34 },
    lg: { fontSize: 14, padding: '10px 22px', height: 42 },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--hsbc-red)',    color: '#fff',                    borderColor: 'var(--hsbc-red)' },
    secondary: { background: '#fff',               color: 'var(--text-primary)',      borderColor: 'var(--border-mid)' },
    ghost:     { background: 'transparent',        color: 'var(--text-secondary)',    borderColor: 'transparent' },
    danger:    { background: '#FEE2E2',            color: 'var(--status-rejected)',   borderColor: '#FECACA' },
    success:   { background: 'var(--status-approved-bg)', color: 'var(--status-approved)', borderColor: '#A7F3D0' },
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...sizes[size], ...variants[variant], ...style }}
    >
      {loading ? <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span> : icon && <span style={{ fontSize: size === 'sm' ? 12 : 14 }}>{icon}</span>}
      {children}
    </button>
  );
}
