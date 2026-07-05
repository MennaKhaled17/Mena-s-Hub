import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserType } from '../types';

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconPieChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconClock = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function validateEmail(email: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!email) return { valid: false, errors: [] };
  if (!email.includes('@')) errors.push('Must contain @');
  else if (!email.split('@')[1]?.includes('.')) errors.push('Invalid domain (e.g. gmail.com)');
  if (email.length < 5) errors.push('Too short');
  return { valid: errors.length === 0, errors };
}

function validatePassword(pass: string): { valid: boolean; rules: { label: string; met: boolean }[] } {
  const rules = [
    { label: 'At least 6 characters', met: pass.length >= 6 },
    { label: 'No spaces',             met: !pass.includes(' ') },
  ];
  return { valid: rules.every(r => r.met), rules };
}

function sendApprovalNotification(name: string): void {
  const text = encodeURIComponent(
    `Hi Mena! 👋\nNew signup request waiting for your approval.\n\nName: ${name}\nTime: ${new Date().toLocaleString()}\n\nPlease log in as admin and check Pending Approvals.`
  );
  window.open(`https://wa.me/201148841234?text=${text}`, '_blank');
}

// ── Sign Up Dialog ──────────────────────────────────────────────
interface SignUpDialogProps {
  isRTL: boolean;
  language: string;
  t: (en: string, ar: string) => string;
  onClose: () => void;
  onSuccess: (email: string, name: string) => void;
  registerUser: (email: string, password: string, name?: string, requestedRole?: UserType, parentOfStudentEmail?: string) => Promise<boolean | 'pending_new_student' | 'email_taken' | 'name_taken'>;
}

const SignUpDialog: React.FC<SignUpDialogProps> = ({ isRTL, t, onClose, onSuccess, registerUser }) => {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [touched,  setTouched]  = useState({ name: false, email: false, password: false });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const emailV = validateEmail(email);
  const passV  = validatePassword(password);
  const nameV  = name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!nameV || !emailV.valid || !passV.valid) return;
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    const result = await registerUser(email, password, name.trim());
    if (result === 'pending_new_student' || result === true) {
      onSuccess(email, name.trim());
    } else if (result === 'email_taken') {
      setError(t('Email is already taken.', 'البريد الإلكتروني مستخدم بالفعل.'));
    } else if (result === 'name_taken') {
      setError(t('Name is already taken.', 'الاسم مستخدم بالفعل.'));
    } else {
      setError(t('Something went wrong. Please try again.', 'حدث خطأ. يرجى المحاولة مجدداً.'));
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '36px 28px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'dialogIn 0.25s cubic-bezier(.34,1.56,.64,1) both', direction: isRTL ? 'rtl' : 'ltr', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: isRTL ? 'auto' : 16, left: isRTL ? 16 : 'auto', background: '#f4f6fb', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
          <IconClose />
        </button>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px', fontFamily: "'Syne',sans-serif", letterSpacing: '-0.5px' }}>
            {t('Create Account', 'إنشاء حساب')}
          </h2>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
            {t("Sign up and wait for Mena's approval to access the platform.", 'سجّل وانتظر موافقة منى للوصول إلى المنصة.')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              {t('Full Name', 'الاسم الكامل')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                <IconUser />
              </span>
              <input
                className={`inp${touched.name ? (nameV ? ' ok' : name ? ' err' : '') : ''}`}
                type="text" value={name}
                onChange={e => { setName(e.target.value); setTouched(p => ({ ...p, name: true })); setError(''); }}
                placeholder={t('Your full name', 'اسمك الكامل')}
                style={{ width: '100%', boxSizing: 'border-box' as const, padding: isRTL ? '12px 44px 12px 14px' : '12px 14px 12px 44px', background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', fontFamily: 'inherit' }}
              />
            </div>
            {touched.name && !nameV && name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                <IconX /> {t('Name too short', 'الاسم قصير جداً')}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              {t('Email', 'البريد الإلكتروني')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                <IconMail />
              </span>
              <input
                className={`inp${touched.email ? (emailV.valid ? ' ok' : email ? ' err' : '') : ''}`}
                type="text" value={email}
                onChange={e => { setEmail(e.target.value); setTouched(p => ({ ...p, email: true })); setError(''); }}
                placeholder="you@example.com"
                style={{ width: '100%', boxSizing: 'border-box' as const, padding: isRTL ? '12px 44px 12px 14px' : '12px 14px 12px 44px', background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', fontFamily: 'inherit', direction: 'ltr' }}
              />
              {touched.email && email && (
                <span style={{ position: 'absolute', right: isRTL ? 'auto' : 14, left: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: emailV.valid ? '#10b981' : '#ef4444', display: 'flex' }}>
                  {emailV.valid ? <IconCheck /> : <IconX />}
                </span>
              )}
            </div>
            {touched.email && emailV.errors.map(err => (
              <div key={err} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                <IconX /> {err}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              {t('Password', 'كلمة المرور')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                <IconLock />
              </span>
              <input
                className={`inp${touched.password ? (passV.valid ? ' ok' : password ? ' err' : '') : ''}`}
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setTouched(p => ({ ...p, password: true })); setError(''); }}
                placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box' as const, padding: '12px 44px', background: '#f8fafc', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', fontFamily: 'inherit', direction: 'ltr' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: isRTL ? 'auto' : 14, left: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}>
                {showPass ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {touched.password && password && (
              <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {passV.rules.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: r.met ? '#10b981' : '#9ca3af' }}>
                    {r.met ? <IconCheck /> : <IconX />} {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconInfo /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#6366f1', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            {loading
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />{t('Creating…', 'جارٍ الإنشاء…')}</>
              : <>{t('Create Account', 'إنشاء الحساب')} <IconArrow /></>
            }
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 16, marginBottom: 0 }}>
            {t('Already have an account?', 'لديك حساب بالفعل؟')}{' '}
            <button type="button" onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: 0 }}>
              {t('Sign in', 'تسجيل الدخول')}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

// ── Main Login Component ────────────────────────────────────────
export const Login: React.FC = () => {
  const { login, language, setLanguage, t } = useApp();
  const navigate  = useNavigate();
  const isRTL     = language === 'ar';

  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [touched,         setTouched]         = useState({ email: false, password: false });
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [showSignUp,      setShowSignUp]      = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingEmail,    setPendingEmail]    = useState('');
  const [pendingName,     setPendingName]     = useState('');

  const emailV = validateEmail(email);
  const passV  = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!emailV.valid || !passV.valid) return;
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    const result = await login(email, password);
    if (result === true) {
      navigate('/home');
    } else if (result === 'pending_new_student') {
      setPendingEmail(email);
      setPendingName(email.split('@')[0]);
      setPendingApproval(true);
    } else {
      setError(t('Invalid email or password.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'));
    }
    setLoading(false);
  };

  const handleSignUpSuccess = (email: string, name: string) => {
    setShowSignUp(false);
    setPendingEmail(email);
    setPendingName(name);
    setPendingApproval(true);
  };

  // ── Pending approval screen ──
  if (pendingApproval) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Segoe UI','Cairo',sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Syne:wght@700;800&display=swap');
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        `}</style>
        <div style={{ background: '#fff', borderRadius: 20, padding: '40px 28px', maxWidth: 460, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(99,102,241,0.10)', animation: 'fadeUp 0.5s ease both', border: '1px solid #e5e7eb' }}>
          <div style={{ color: '#6366f1', marginBottom: 24, animation: 'pulse 2s ease infinite' }}>
            <IconClock />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 12px', fontFamily: "'Syne',sans-serif", letterSpacing: '-1px' }}>
            {t('Waiting for Approval', 'في انتظار الموافقة')}
          </h2>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
            {t(
              "Your request has been sent to Mena. You'll be able to log in once she approves your account.",
              'تم إرسال طلبك إلى منى. ستتمكن من تسجيل الدخول بمجرد موافقتها على حسابك.'
            )}
          </p>
          {pendingName && (
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 20px', marginBottom: 10, textAlign: isRTL ? 'right' : 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>{t('Name', 'الاسم')}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{pendingName}</div>
            </div>
          )}
          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 20px', marginBottom: 28, textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 4, letterSpacing: '1px', textTransform: 'uppercase' }}>{t('Email', 'البريد الإلكتروني')}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', wordBreak: 'break-all' }}>{pendingEmail}</div>
          </div>
          <button
            onClick={() => { setPendingApproval(false); setEmail(''); setPassword(''); setTouched({ email: false, password: false }); }}
            style={{ background: 'none', border: '1.5px solid #6366f1', borderRadius: 10, padding: '10px 28px', color: '#6366f1', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t('← Back to Login', '← العودة لتسجيل الدخول')}
          </button>
        </div>
      </div>
    );
  }

  // ── Main login screen ──
  return (
    <div className="login-root" style={{ minHeight: '100vh', background: '#f4f6fb', display: 'flex', fontFamily: "'Segoe UI','Cairo',sans-serif", direction: isRTL ? 'rtl' : 'ltr' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Syne:wght@700;800&display=swap');

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dialogIn { from{opacity:0;transform:scale(0.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }

        .inp { transition: border-color 0.15s, box-shadow 0.15s !important; }
        .inp:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; outline: none !important; }
        .inp.err { border-color: #ef4444 !important; }
        .inp.ok  { border-color: #10b981 !important; }
        .submit-btn:hover:not(:disabled) { filter: brightness(0.92); transform: translateY(-1px); }
        .lang-btn:hover   { background: #eef2ff !important; color: #4338ca !important; }
        .signup-btn:hover { color: #4338ca !important; }
        .stat-pill { transition: all 0.15s; }
        .stat-pill:hover { transform: translateY(-2px); }

        /* Desktop: side-by-side */
        .login-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 32px;
          padding: 52px 56px;
          background: #fff;
          position: relative;
          overflow: hidden;
        }

        .login-right {
          width: 480px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 72px 44px 52px;
          background: #f4f6fb;
          position: relative;
          overflow-y: auto;
        }

        /* Tablet / mobile: stack vertically */
        @media (max-width: 768px) {
          .login-root {
            flex-direction: column !important;
          }
          .login-left {
            width: 100% !important;
            flex: none !important;
            padding: 28px 20px 24px !important;
            border-right: none !important;
            border-left: none !important;
            border-bottom: 1px solid #e5e7eb !important;
            gap: 20px !important;
            justify-content: flex-start !important;
          }
          .login-right {
            width: 100% !important;
            flex-shrink: unset !important;
            padding: 56px 20px 40px !important;
            justify-content: flex-start !important;
          }
          .login-hero-h1 {
            font-size: 34px !important;
            letter-spacing: -1px !important;
            white-space: normal !important;
          }
          .login-hero-p {
            font-size: 13px !important;
          }
          .login-lang-btn {
            top: 16px !important;
            right: ${isRTL ? 'auto' : '16px'} !important;
            left: ${isRTL ? '16px' : 'auto'} !important;
          }
        }

        @media (max-width: 480px) {
          .login-left  { padding: 20px 16px !important; }
          .login-right { padding: 52px 16px 36px !important; }
          .login-hero-h1 { font-size: 26px !important; }
        }

        /* RTL border swap */
        .login-left-ltr { border-right: 1px solid #e5e7eb; border-left: none; }
        .login-left-rtl { border-left: 1px solid #e5e7eb; border-right: none; }
        @media (max-width: 768px) {
          .login-left-ltr, .login-left-rtl {
            border-right: none !important;
            border-left: none !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      {showSignUp && (
        <SignUpDialog
          isRTL={isRTL}
          language={language}
          t={t}
          onClose={() => setShowSignUp(false)}
          onSuccess={handleSignUpSuccess}
          registerUser={login}
        />
      )}

      {/* LEFT PANEL */}
      <div className={`login-left ${isRTL ? 'login-left-rtl' : 'login-left-ltr'}`}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#6366f108 1px,transparent 1px),linear-gradient(90deg,#6366f108 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <IconBarChart />
            </div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>
                MENA<span style={{ color: '#6366f1' }}>'S</span> HUB
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 2 }}>
                Statistics · IGCSE
              </div>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease 0.1s both' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 16 }}>
            {t('Learning Platform', 'منصة تعليمية')}
          </p>
          <h1 className="login-hero-h1" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05, color: '#111827', margin: '0 0 20px', letterSpacing: '-2px', fontFamily: "'Syne',sans-serif", whiteSpace: 'pre-line' }}>
            {t('Master\nStatistics\nwith data.', 'أتقن\nالإحصاء\nبالبيانات.')}
          </h1>
          <div style={{ width: 48, height: 3, background: '#6366f1', borderRadius: 2, marginBottom: 20 }} />
          <p className="login-hero-p" style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 340, margin: 0 }}>
            {t(
              'Your complete IGCSE Statistics platform — track progress, review lessons, and stay on top of every chapter.',
              'منصتك الشاملة لإحصاء IGCSE — تابع تقدمك، راجع دروسك، وأتقن كل فصل.'
            )}
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease 0.2s both' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: <IconTrendUp />, label: t('Progress tracking', 'تتبع التقدم') },
              { icon: <IconPieChart />, label: t('Reports', 'التقارير') },
              { icon: <IconBarChart />, label: t('Videos', 'الفيديوهات') },
            ].map((p, i) => (
              <div key={i} className="stat-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                <span style={{ color: '#6366f1' }}>{p.icon}</span>
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">
        {/* Language toggle */}
        <button
          className="lang-btn login-lang-btn"
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          style={{
            position: 'absolute',
            top: 24,
            right: isRTL ? 'auto' : 24,
            left: isRTL ? 24 : 'auto',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 14px',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 2,
          }}>
          <IconGlobe />
          {language === 'en' ? 'عربي' : 'English'}
        </button>

        <div style={{ animation: 'fadeUp 0.45s ease 0.15s both' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 8px', fontFamily: "'Syne',sans-serif", letterSpacing: '-1px' }}>
              {t('Welcome back', 'مرحباً بعودتك')}
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
              {t('Sign in to your account to continue', 'سجّل دخولك للمتابعة')}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                {t('Email', 'البريد الإلكتروني')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                  <IconMail />
                </span>
                <input
                  className={`inp${touched.email ? (emailV.valid ? ' ok' : email ? ' err' : '') : ''}`}
                  type="text" value={email}
                  onChange={e => { setEmail(e.target.value); setTouched(p => ({ ...p, email: true })); setError(''); }}
                  placeholder="you@example.com"
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: isRTL ? '12px 44px 12px 14px' : '12px 14px 12px 44px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', fontFamily: 'inherit', direction: 'ltr' }}
                />
                {touched.email && email && (
                  <span style={{ position: 'absolute', right: isRTL ? 'auto' : 14, left: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: emailV.valid ? '#10b981' : '#ef4444', display: 'flex' }}>
                    {emailV.valid ? <IconCheck /> : <IconX />}
                  </span>
                )}
              </div>
              {touched.email && emailV.errors.length > 0 && (
                <div style={{ marginTop: 5 }}>
                  {emailV.errors.map(err => (
                    <div key={err} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: 12, marginTop: 2 }}>
                      <IconX /> {err}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                {t('Password', 'كلمة المرور')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: isRTL ? 'auto' : 14, right: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
                  <IconLock />
                </span>
                <input
                  className={`inp${touched.password ? (passV.valid ? ' ok' : password ? ' err' : '') : ''}`}
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setTouched(p => ({ ...p, password: true })); setError(''); }}
                  placeholder="••••••••"
                  style={{ width: '100%', boxSizing: 'border-box' as const, padding: '12px 44px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, color: '#111827', fontFamily: 'inherit', direction: 'ltr' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: isRTL ? 'auto' : 14, left: isRTL ? 14 : 'auto', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}>
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {touched.password && password && (
              <div style={{ marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {passV.rules.map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: r.met ? '#10b981' : '#9ca3af' }}>
                    {r.met ? <IconCheck /> : <IconX />} {r.label}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconInfo /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn"
              style={{ width: '100%', padding: '13px', background: '#6366f1', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'all 0.2s', opacity: loading ? 0.75 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
              {loading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} />{t('Signing in…', 'جارٍ الدخول…')}</>
                : <>{t('Sign In', 'دخول')} <IconArrow /></>
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20, marginBottom: 0 }}>
              {t("Don't have an account?", 'ليس لديك حساب؟')}{' '}
              <button type="button" className="signup-btn" onClick={() => setShowSignUp(true)}
                style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: 0, transition: 'color 0.15s' }}>
                {t('Create one', 'أنشئ حساباً')}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
