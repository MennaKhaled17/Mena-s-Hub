import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserType, UserTypeLabel } from '../types';
import { roleColor } from '../theme';
import { useAnnouncements } from '../hooks/useSupabaseData';

const featureIcons: Record<string, React.FC> = {
  Dashboard:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  Reports:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Homework:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Videos:        () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  Roadmap:       () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>,
  'My Progress': () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  'My Homework': () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  Progress:      () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};
const DefaultIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;

const roleFeatures: Record<UserType, { enLabel: string; arLabel: string; route: string }[]> = {
  [UserType.Admin]: [
    { enLabel: 'Dashboard', arLabel: 'لوحة التحكم', route: '/admin'     },
    { enLabel: 'Reports',   arLabel: 'التقارير',     route: '/reports'  },
    { enLabel: 'Homework',  arLabel: 'الواجبات',     route: '/homework' },
    { enLabel: 'Videos',    arLabel: 'الفيديوهات',   route: '/videos'   },
    { enLabel: 'Roadmap',   arLabel: 'خارطة الطريق', route: '/roadmap'  },
  ],
  [UserType.Teacher]: [
    { enLabel: 'Dashboard', arLabel: 'لوحة التحكم', route: '/dashboard' },
    { enLabel: 'Reports',   arLabel: 'التقارير',     route: '/reports'  },
    { enLabel: 'Homework',  arLabel: 'الواجبات',     route: '/homework' },
    { enLabel: 'Videos',    arLabel: 'الفيديوهات',   route: '/videos'   },
    { enLabel: 'Roadmap',   arLabel: 'خارطة الطريق', route: '/roadmap'  },
  ],
  [UserType.Student]: [
    { enLabel: 'My Progress', arLabel: 'تقدمي',       route: '/dashboard' },
    { enLabel: 'My Homework', arLabel: 'واجباتي',      route: '/homework'  },
    { enLabel: 'Videos',      arLabel: 'الفيديوهات',  route: '/videos'    },
    { enLabel: 'Roadmap',     arLabel: 'خارطة الطريق',route: '/roadmap'   },
  ],
  [UserType.Parent]: [
    { enLabel: 'Progress', arLabel: 'تقدم طفلي',    route: '/dashboard' },
    { enLabel: 'Reports',  arLabel: 'التقارير',      route: '/reports'  },
    { enLabel: 'Videos',   arLabel: 'الفيديوهات',   route: '/videos'   },
    { enLabel: 'Roadmap',  arLabel: 'خارطة الطريق', route: '/roadmap'  },
  ],
};

// AFTER (correct order):
export const Home: React.FC = () => {
  const { currentUser, language, setLanguage, logout, t } = useApp();
  const navigate = useNavigate();
  const isRTL = language === 'ar';
  const { data: allAnnouncements = [] } = useAnnouncements();  // ← hook before any return ✅

 
// With this:
if (!currentUser) {
  navigate('/login', { replace: true });
  return null;
}

if (currentUser.status === 'pending') {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI','Cairo',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: '48px 40px', textAlign: 'center', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
          {t('Awaiting Approval', 'في انتظار الموافقة')}
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
          {t('Your account is pending approval from Mena. You will be notified once access is granted.', 'حسابك في انتظار موافقة منى. ستُخطر بمجرد منح الوصول.')}
        </p>
        <button onClick={() => { logout(); navigate('/login', { replace: true }); }}
          style={{ background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 20, padding: '10px 24px', color: '#6b7280', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
          {t('Sign Out', 'تسجيل الخروج')}
        </button>
      </div>
    </div>
  );
}

if (currentUser.status === 'rejected') {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI','Cairo',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: '48px 40px', textAlign: 'center', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>
          {t('Access Denied', 'تم رفض الوصول')}
        </h2>
        <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
          {t('Your account request was not approved. Please contact Mena for more information.', 'لم يتم قبول طلب حسابك. يرجى التواصل مع منى للمزيد من المعلومات.')}
        </p>
        <button onClick={() => { logout(); navigate('/login', { replace: true }); }}
          style={{ background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 20, padding: '10px 24px', color: '#6b7280', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
          {t('Sign Out', 'تسجيل الخروج')}
        </button>
      </div>
    </div>
  );
}

  const features = roleFeatures[currentUser.type] ?? roleFeatures[UserType.Student];
  const color = roleColor[currentUser.type as keyof typeof roleColor] ?? '#6366f1';
  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fb', fontFamily: "'Segoe UI','Cairo',sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .feat-card:hover  { box-shadow: 0 6px 20px rgba(99,102,241,0.15) !important; transform: translateY(-3px) !important; border-color: #c7d2fe !important; }
        .nav-btn:hover    { background: #eef2ff !important; color: #4338ca !important; }
        .logout-btn:hover { background: #fef2f2 !important; color: #dc2626 !important; }
      `}</style>

      {/* Top nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{t("Mena's Hub", 'مركز منى')}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="nav-btn" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            style={{ background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 20, padding: '6px 14px', color: '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {language === 'en' ? 'عربي' : 'English'}
          </button>
          <button className="logout-btn" onClick={() => { logout(); navigate('/login', { replace: true }); }}
            style={{ background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 20, padding: '6px 14px', color: '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {t('Logout', 'خروج')}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {/* Hero */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: '32px 36px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', animation: 'fadeUp 0.45s ease forwards', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 99, padding: '5px 14px', marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ color, fontSize: 13, fontWeight: 700 }}>
                {UserTypeLabel[currentUser.type]?.[language] ?? currentUser.type}
              </span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: -0.5 }}>
              {t('Welcome back,', 'مرحباً بعودتك،')} <span style={{ color: '#6366f1' }}>{currentUser.name}</span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
              {t("Here's your learning overview for today.", 'إليك نظرة عامة على مسيرتك التعليمية اليوم.')}
            </p>
          </div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg,${color}22,${color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
        </div>

        {/* Feature grid */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>
          {t('Quick Access', 'وصول سريع')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 14, marginBottom: 32 }}>
          {features.map((f, i) => {
            const IconComp = featureIcons[f.enLabel] || DefaultIcon;
            return (
              <div key={f.route} className="feat-card" onClick={() => navigate(f.route)}
                style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '22px 20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <IconComp />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  {language === 'ar' ? f.arLabel : f.enLabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Announcements */}
        {allAnnouncements.length > 0 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14 }}>
              {t('Announcements', 'الإعلانات')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allAnnouncements.map((a, i) => (
                <div key={a.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', animation: `fadeUp 0.4s ease ${0.3 + i * 0.07}s both`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', borderLeft: isRTL ? 'none' : '3px solid #6366f1', borderRight: isRTL ? '3px solid #6366f1' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ color: '#374151', fontSize: 14, margin: '0 0 4px', lineHeight: 1.55 }}>
                      {language === 'ar' ? a.contentAr : a.content}
                    </p>
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>{a.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};