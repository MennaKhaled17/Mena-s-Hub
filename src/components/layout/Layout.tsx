import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { UserType, UserTypeLabel } from '../../types';
import { roleColor } from '../../theme';
import { Avatar } from '../ui';

/* ── Icon set ── */
const icons: Record<string, React.FC<{ size?: number; color?: string }>> = {
  home: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  dashboard: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),
  reports: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  homework: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  videos: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  roadmap: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
    </svg>
  ),
  about: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  contact: ({ size = 17, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  globe: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  collapse: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  expand: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  groups: ({ size = 17, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
),
  logout: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  logo: ({ size = 18, color = '#fff' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
};

const navItems = (type: UserType, t: (a: string, b: string) => string) => {
  const items = [
    { icon: 'home',      label: t('Home', 'الرئيسية'),           route: '/home' },
    { icon: 'dashboard', label: t('Dashboard', 'لوحة التحكم'),   route: type === UserType.Admin ? '/admin' : '/dashboard' },
  ];
 if (type === UserType.Admin || type === UserType.Teacher) {
  items.push({ icon: 'reports',  label: t('Reports', 'التقارير'),    route: '/reports' });
  items.push({ icon: 'homework', label: t('Homework', 'الواجبات'),   route: '/homework' });
  items.push({ icon: 'groups',   label: t('Groups', 'المجموعات'),    route: '/groups' });
}
  if (type === UserType.Student) {
    items.push({ icon: 'reports', label: t('Reports', 'التقارير'), route: '/reports' });
    items.push({ icon: 'homework', label: t('My Homework', 'واجباتي'), route: '/homework' });
  }
  if (type === UserType.Parent) {
    items.push({ icon: 'reports', label: t('Reports', 'التقارير'),     route: '/reports' });
  }
  items.push(
    { icon: 'videos',  label: t('Videos', 'الفيديوهات'),     route: '/videos' },
    { icon: 'roadmap', label: t('Roadmap', 'خارطة الطريق'),   route: '/roadmap' },
    { icon: 'about',   label: t('About', 'عن المنصة'),        route: '/about' },
    { icon: 'contact', label: t('Contact', 'تواصل معنا'),      route: '/contact' },
  );
  return items;
};

export const Layout: React.FC = () => {
  const { currentUser, language, setLanguage, logout, t } = useApp();
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const isRTL = language === 'ar';

  if (!currentUser) return null;

  const items = navItems(currentUser.type, t);
  const color  = roleColor[currentUser.type as keyof typeof roleColor];
  const LogoIcon = icons.logo;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Segoe UI','Cairo',sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .nav-item:hover { background: #f0f2f8 !important; }
        .nav-item.active { background: #eef2ff !important; color: #4338ca !important; }
        .sb-btn:hover { background: #f4f6fb !important; }
        .main-area { animation: fadeIn 0.25s ease; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: collapsed ? 64 : 232, minHeight: '100vh', background: '#fff', borderRight: isRTL ? 'none' : '1px solid #e5e7eb', borderLeft: isRTL ? '1px solid #e5e7eb' : 'none', display: 'flex', flexDirection: 'column', transition: 'width 0.25s', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? '18px 0' : '20px 18px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogoIcon />
          </div>
          {!collapsed && <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>{t("Mena's Hub", 'مركز منى')}</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {items.map(item => {
            const active = pathname === item.route;
            const NavIcon = icons[item.icon] || icons.home;
            const iconColor = active ? color : '#6b7280';
            return (
              <button key={item.route} className={`nav-item${active ? ' active' : ''}`} onClick={() => navigate(item.route)} title={collapsed ? item.label : undefined}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '9px 11px', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? `${color}20` : 'transparent', border: 'none', borderRadius: 9, color: iconColor, cursor: 'pointer', fontSize: 14, fontFamily: "'Segoe UI','Cairo',sans-serif", marginBottom: 2, textAlign: isRTL ? 'right' : 'left', fontWeight: active ? 600 : 400, transition: 'all 0.15s' }}>
                <NavIcon color={iconColor} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && <span style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0, width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px 8px 14px', borderTop: '1px solid #f3f4f6' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 10, marginBottom: 8 }}>
              <Avatar name={currentUser.name} color={color} size={32} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color, fontWeight: 600 }}>{UserTypeLabel[currentUser.type][language]}</div>
              </div>
            </div>
          )}
          {[
            { iconKey: 'globe',    label: language === 'en' ? 'عربي' : 'English', action: () => setLanguage(language === 'en' ? 'ar' : 'en'), red: false },
            { iconKey: collapsed ? 'expand' : 'collapse', label: t('Collapse','طي'), action: () => setCollapsed(!collapsed), red: false },
            { iconKey: 'logout',   label: t('Logout','خروج'), action: logout, red: true },
          ].map(btn => {
            const BtnIcon = icons[btn.iconKey] || icons.home;
            return (
              <button key={btn.label} className="sb-btn" onClick={btn.action}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '8px 0' : '8px 11px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none', borderRadius: 8, color: btn.red ? '#ef4444' : '#6b7280', cursor: 'pointer', fontSize: 13, fontFamily: "'Segoe UI','Cairo',sans-serif", marginBottom: 2, transition: 'background 0.15s' }}>
                <BtnIcon color={btn.red ? '#ef4444' : '#6b7280'} />
                {!collapsed && <span>{btn.label}</span>}
              </button>
            );
          })}
        </div>
      </aside>

      <main className="main-area" style={{ flex: 1, minWidth: 0, background: '#f4f6fb' }}>
        <Outlet />
      </main>
    </div>
  );
};
