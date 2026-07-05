// ─── Mena's Hub Design Tokens ─── Clean White + Indigo ───
export const theme = {
  // backgrounds
  bgPage:    '#f4f6fb',
  bgCard:    '#ffffff',
  bgSidebar: '#ffffff',
  bgHover:   '#f0f2f8',

  // indigo primary
  primary:       '#6366f1',
  primaryLight:  '#eef2ff',
  primaryMid:    '#c7d2fe',
  primaryDark:   '#4338ca',

  // role accent colours
  mena:      '#f59e0b',   // amber  – Mena/Admin
  assistant: '#10b981',   // emerald – Assistant
  student:   '#6366f1',   // indigo  – Student
  parent:    '#8b5cf6',   // violet  – Parent

  // text
  textPrimary:   '#111827',
  textSecondary: '#6b7280',
  textMuted:     '#9ca3af',

  // borders
  border:      '#e5e7eb',
  borderFocus: '#6366f1',

  // status
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  info:    '#3b82f6',

  // shadows
  shadow:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:'0 4px 12px rgba(0,0,0,0.08)',
};

export const roleColor = {
  Admin:   theme.mena,
  Teacher: theme.assistant,
  Student: theme.student,
  Parent:  theme.parent,
} as const;
