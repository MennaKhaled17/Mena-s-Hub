import React, { CSSProperties, ReactNode } from 'react';

/* ── Page wrapper ── */
export const Page: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto', ...style }}>
    {children}
  </div>
);

/* ── Section heading ── */
export const PageHeader: React.FC<{ title: string; sub?: string; action?: ReactNode }> = ({ title, sub, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{title}</h1>
      {sub && <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{sub}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ── Card ── */
export const Card: React.FC<{ children: ReactNode; style?: CSSProperties; onClick?: () => void }> = ({ children, style, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 14,
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      cursor: onClick ? 'pointer' : undefined,
      transition: onClick ? 'box-shadow 0.2s, transform 0.2s' : undefined,
      ...style,
    }}
    onMouseEnter={onClick ? e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; } : undefined}
    onMouseLeave={onClick ? e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = ''; } : undefined}
  >
    {children}
  </div>
);

/* ── Stat card (no emoji — uses colored dot + label) ── */
export const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <Card>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: color, display: 'block' }} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  </Card>
);

/* ── Badge ── */
type BadgeVariant = 'indigo' | 'green' | 'amber' | 'red' | 'violet' | 'gray' | 'blue';
const badgeColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  indigo: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  green:  { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  amber:  { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  red:    { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
  violet: { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe' },
  gray:   { bg: '#f9fafb', text: '#374151', border: '#d1d5db' },
  blue:   { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
};
export const Badge: React.FC<{ children: ReactNode; variant?: BadgeVariant }> = ({ children, variant = 'gray' }) => {
  const c = badgeColors[variant];
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
      {children}
    </span>
  );
};

/* ── Button ── */
export const Btn: React.FC<{ children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; disabled?: boolean; style?: CSSProperties }> = ({ children, onClick, variant = 'ghost', size = 'md', disabled, style }) => {
  const base: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
    padding: size === 'sm' ? '6px 12px' : '9px 18px',
    fontSize: size === 'sm' ? 13 : 14,
    opacity: disabled ? 0.5 : 1,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: '#6366f1', color: '#fff' },
    ghost:   { background: '#f4f6fb', color: '#374151', border: '1px solid #e5e7eb' },
    danger:  { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.95)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
    >
      {children}
    </button>
  );
};

/* ── Input ── */
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>}
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        border: '1px solid #d1d5db', borderRadius: 10,
        fontSize: 14, color: '#111827', background: '#fff',
        outline: 'none', boxSizing: 'border-box' as const,
        fontFamily: 'inherit',
        ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

/* ── Textarea ── */
export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>}
    <textarea
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        border: '1px solid #d1d5db', borderRadius: 10,
        fontSize: 14, color: '#111827', background: '#fff',
        outline: 'none', boxSizing: 'border-box' as const,
        resize: 'vertical', minHeight: 100,
        fontFamily: 'inherit',
        ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
    />
  </div>
);

/* ── Divider ── */
export const Divider: React.FC = () => <div style={{ borderTop: '1px solid #f3f4f6', margin: '16px 0' }} />;

/* ── Avatar ── */
export const Avatar: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `${color}18`, border: `1.5px solid ${color}44`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color, fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
  }}>
    {name.charAt(0).toUpperCase()}
  </div>
);

/* ── Empty state ── */
export const Empty: React.FC<{ icon?: string; text: string }> = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <div style={{ fontSize: 14 }}>{text}</div>
  </div>
);
