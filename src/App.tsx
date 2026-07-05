import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Reports } from './pages/Reports';
import { HomeworkPage } from './pages/Homework';
import { GroupsPage } from './pages/GroupsPage';
import { Videos, Roadmap, AboutUs, ContactUs } from './pages/OtherPages';
import { UserType } from './types';



const AppRoutes: React.FC = () => {
  const { currentUser, authLoading, logout, t, isRTL } = useApp();

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', color: '#9ca3af', fontFamily: "'Segoe UI',sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // A profile exists but hasn't been approved (or was rejected) by an admin.
  // This mirrors the server-side RLS check — is_approved() — so a pending
  // user genuinely can't read any real data even if they got this far.
  if (currentUser.status !== 'approved') {
    const isRejected = currentUser.status === 'rejected';
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', background: '#f4f6fb', fontFamily: "'Segoe UI',sans-serif",
        padding: 24, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{isRejected ? '🚫' : '⏳'}</div>
        <h2 style={{ margin: '0 0 8px', color: '#1f2937' }}>
          {isRejected
            ? t('Access denied', 'تم رفض الوصول')
            : t('Waiting for approval', 'في انتظار الموافقة')}
        </h2>
        <p style={{ color: '#6b7280', maxWidth: 420, margin: '0 0 20px' }}>
          {isRejected
            ? t(
                'An admin has declined this account. Contact your admin if you believe this is a mistake.',
                'قام المشرف برفض هذا الحساب. تواصل مع المشرف إذا كنت تعتقد أن هذا خطأ.'
              )
            : t(
                'Your account has been created and is waiting for an admin to approve it. You’ll be able to sign in normally once approved.',
                'تم إنشاء حسابك وهو في انتظار موافقة المشرف. ستتمكن من تسجيل الدخول بعد الموافقة عليه.'
              )}
        </p>
        <button
          onClick={() => logout()}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2563eb',
            color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}
        >
          {t('Log out', 'تسجيل الخروج')}
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/home" element={<Home />} />

      <Route element={<Layout />}>
        {currentUser.type === UserType.Admin && (
          <Route path="/admin" element={<AdminDashboard />} />
        )}
        {(currentUser.type === UserType.Admin || currentUser.type === UserType.Teacher) && (
          <Route path="/groups" element={<GroupsPage />} />
        )}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports"   element={<Reports />} />
        <Route path="/homework"  element={<HomeworkPage />} />
        <Route path="/videos"    element={<Videos />} />
        <Route path="/roadmap"   element={<Roadmap />} />
        <Route path="/about"     element={<AboutUs />} />
        <Route path="/contact"   element={<ContactUs />} />
      </Route>

      <Route path="/"  element={<Navigate to="/home" replace />} />
      <Route path="*"  element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  </ErrorBoundary>
);

export default App;