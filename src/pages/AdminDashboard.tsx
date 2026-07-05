import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserType, UserTypeLabel } from '../types';
import type { Chapter, Video } from '../types';
// @ts-ignore
import { useUsers, useReports, useChapters, useVideos } from '../hooks/useSupabaseData';
// @ts-ignore
import * as db from '../services/db';
import { Page, PageHeader, Card, StatCard, Badge, Btn, Input, Avatar, Empty } from '../components/ui';
import { roleColor } from '../theme';
import type { PendingUser } from '../context/AppContext';
import type { User, Report } from '../types';

type Tab = 'overview' | 'users' | 'videos' | 'chapters' | 'pending';

export const AdminDashboard: React.FC = () => {
  const { language, t, pendingUsers, approveUser, rejectUser, deleteUser, currentUser } = useApp();
  const [tab, setTab] = useState<Tab>('overview');
  const [roleOverride, setRoleOverride] = useState<Record<string, UserType>>({});
  const [parentStudentEmails, setParentStudentEmails] = useState<Record<string, string>>({});

  const { data: mockUsers   = [] } = useUsers()   as { data: User[] };
  const { data: mockReports = [] } = useReports()  as { data: Report[] };
  const { data: videos      = [] } = useVideos()   as { data: Video[] };
  const { data: chapters    = [] } = useChapters() as { data: Chapter[] };

  const [vForm, setVForm] = useState({ title: '', titleAr: '', chapter: '', driveId: '' });
  const [showVForm, setShowVForm] = useState(false);
  const [showChForm, setShowChForm] = useState(false);
  const [editingCh, setEditingCh] = useState<Chapter | null>(null);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(t(
      `Permanently delete "${name}"? This cannot be undone.`,
      `حذف "${name}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`
    ))) return;
    try {
      await deleteUser(id);
    } catch (err) {
      // Surfacing this is the whole point — without it, a blocked delete
      // (RLS or a foreign-key reference) looks exactly like nothing happening.
      window.alert(t(
        `Couldn't delete "${name}": ${(err as Error).message}`,
        `تعذّر حذف "${name}": ${(err as Error).message}`
      ));
    }
  };
  const [chForm, setChForm] = useState({ title: '', description: '', status: 'pending' as Chapter['status'] });

  const students   = mockUsers.filter((u: User) => u.type === UserType.Student);
  const assistants = mockUsers.filter((u: User) => u.type === UserType.Teacher);
  const parents    = mockUsers.filter((u: User) => u.type === UserType.Parent);

  const addVideo = async () => {
    if (!vForm.title || !vForm.driveId) return;
    await db.addVideo(vForm);
    setVForm({ title: '', titleAr: '', chapter: '', driveId: '' });
    setShowVForm(false);
  };

  const deleteVideo = async (id: string) => {
    if (window.confirm(t('Delete this video?', 'حذف هذا الفيديو؟'))) await db.deleteVideo(id);
  };

  const openNewChapter = () => {
    setEditingCh(null);
    setChForm({ title: '', description: '', status: 'pending' });
    setShowChForm(true);
  };

  const openEditChapter = (ch: Chapter) => {
    setEditingCh(ch);
    setChForm({ title: ch.title, description: ch.description, status: ch.status });
    setShowChForm(true);
  };

  const saveChapter = async () => {
    if (!chForm.title) return;
    await db.saveChapter(editingCh ? { id: editingCh.id, ...chForm } : { ...chForm });
    setShowChForm(false);
    setEditingCh(null);
  };

  const deleteChapter = async (id: string) => {
    if (window.confirm(t('Delete this chapter?', 'حذف هذا الفصل؟'))) await db.deleteChapter(id);
  };

  const tabs: { id: Tab; label: string; labelAr: string; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',          labelAr: 'نظرة عامة' },
    { id: 'users',     label: 'Users',              labelAr: 'المستخدمون' },
    { id: 'videos',    label: 'Videos',             labelAr: 'الفيديوهات' },
    { id: 'chapters',  label: 'Chapters',           labelAr: 'الفصول' },
    { id: 'pending',   label: 'Pending Approvals',  labelAr: 'طلبات الموافقة', badge: pendingUsers.length },
  ];

  const statusColors: Record<Chapter['status'], 'green' | 'indigo' | 'gray'> = {
    completed: 'green', 'in-progress': 'indigo', pending: 'gray',
  };

  const behaviorVariant: Record<string, 'green' | 'amber' | 'red'> = {
    excellent: 'green', good: 'amber', 'needs-improvement': 'red',
  };

  const roleLabels: Record<UserType, { en: string; ar: string }> = {
    [UserType.Student]: { en: 'Student',   ar: 'طالب' },
    [UserType.Teacher]: { en: 'Assistant', ar: 'مساعد' },
    [UserType.Parent]:  { en: 'Parent',    ar: 'ولي أمر' },
    [UserType.Admin]:   { en: 'Admin',     ar: 'مدير' },
  };

  return (
    <Page>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .urow:hover { background:#fafafa!important }
        .del-btn:hover { background:#fef2f2!important; border-color:#fca5a5!important; color:#dc2626!important }
      `}</style>

      <PageHeader title={t("Mena's Dashboard", "لوحة تحكم منى")} sub={t('Full platform management', 'إدارة كاملة للمنصة')} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="" label={t('Students', 'الطلاب')}         value={students.length}   color="#6366f1" />
        <StatCard icon="" label={t('Assistants', 'المساعدون')}    value={assistants.length} color="#10b981" />
        <StatCard icon="" label={t('Parents', 'أولياء الأمر')}    value={parents.length}    color="#8b5cf6" />
        <StatCard icon="" label={t('Reports', 'التقارير')}         value={mockReports.length} color="#f59e0b" />
        <StatCard icon="" label={t('Videos', 'الفيديوهات')}       value={videos.length}     color="#ef4444" />
        <StatCard icon="" label={t('Chapters', 'الفصول')}         value={chapters.length}   color="#0ea5e9" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: tab === tb.id ? '#fff' : 'transparent', color: tab === tb.id ? '#111827' : '#6b7280', cursor: 'pointer', fontSize: 14, fontWeight: tab === tb.id ? 700 : 500, fontFamily: 'inherit', boxShadow: tab === tb.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {language === 'ar' ? tb.labelAr : tb.label}
            {tb.badge != null && tb.badge > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{tb.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeUp 0.3s ease forwards' }}>
          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Recent Reports', 'آخر التقارير')}</h3>
            {mockReports.slice(0, 3).map((r: Report) => {
              const student = mockUsers.find((u: User) => u.id === r.studentId);
              return (
                <div key={r.id} style={{ padding: '11px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#6366f1' }}>{student?.name}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.behavior && (
                        <Badge variant={behaviorVariant[r.behavior] ?? 'gray'}>
                          {r.behavior === 'excellent' ? t('Excellent', 'ممتاز') : r.behavior === 'good' ? t('Good', 'جيد') : t('Needs Work', 'يحتاج تحسين')}
                        </Badge>
                      )}
                      <span style={{ color: '#9ca3af', fontSize: 11 }}>{r.date}</span>
                    </div>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{r.content}</p>
                </div>
              );
            })}
          </Card>
          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Role Summary', 'ملخص الأدوار')}</h3>
            {([UserType.Admin, UserType.Teacher, UserType.Student, UserType.Parent] as UserType[]).map(role => {
              const cnt = mockUsers.filter((u: User) => u.type === role).length;
              const c = roleColor[role as keyof typeof roleColor];
              return (
                <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ color: '#374151', fontSize: 14 }}>{UserTypeLabel[role][language]}</span>
                  </div>
                  <Badge variant="gray">{cnt}</Badge>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <Card style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('All Users', 'جميع المستخدمين')}</h3>
          {mockUsers.map((u: User, i: number) => {
            const c = roleColor[u.type as keyof typeof roleColor];
            return (
              <div key={u.id} className="urow" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid #f3f4f6', animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                <Avatar name={u.name} color={c} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
                </div>
                <Badge variant={u.type === UserType.Admin ? 'amber' : u.type === UserType.Teacher ? 'green' : u.type === UserType.Student ? 'indigo' : 'violet'}>
                  {UserTypeLabel[u.type][language]}
                </Badge>
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    title={t('Delete permanently', 'حذف نهائي')}
                    style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Videos ── */}
      {tab === 'videos' && (
        <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn variant="primary" onClick={() => setShowVForm(!showVForm)}>+ {t('Add Video', 'إضافة فيديو')}</Btn>
          </div>
          {showVForm && (
            <Card style={{ marginBottom: 20, border: '1.5px solid #c7d2fe' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Add New Video', 'إضافة فيديو جديد')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label={t('Title (English)', 'العنوان (إنجليزي)')} value={vForm.title}   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVForm(f => ({ ...f, title: e.target.value }))}   placeholder="Cell Biology – Introduction" />
                <Input label={t('Title (Arabic)', 'العنوان (عربي)')}     value={vForm.titleAr} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVForm(f => ({ ...f, titleAr: e.target.value }))} placeholder="بيولوجيا الخلية – مقدمة" />
                <Input label={t('Chapter', 'الفصل')}                      value={vForm.chapter} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVForm(f => ({ ...f, chapter: e.target.value }))} placeholder="Chapter 1" />
                <Input label={t('Google Drive File ID', 'معرّف ملف Google Drive')} value={vForm.driveId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVForm(f => ({ ...f, driveId: e.target.value }))} placeholder="1BxiMVs0XRA5nFMd…" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <Btn onClick={() => setShowVForm(false)}>{t('Cancel', 'إلغاء')}</Btn>
                <Btn variant="primary" onClick={addVideo}>{t('Add Video', 'إضافة')}</Btn>
              </div>
            </Card>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {videos.map((v: Video, i: number) => (
              <Card key={v.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.05}s both`, position: 'relative' }}>
                <div style={{ background: '#f0f2f8', borderRadius: 10, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 4 }}>{language === 'ar' ? v.titleAr : v.title}</div>
                <Badge variant="indigo">{v.chapter}</Badge>
                <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af', wordBreak: 'break-all' as const }}>{v.driveId}</div>
                <button className="del-btn" onClick={() => deleteVideo(v.id)}
                  style={{ marginTop: 10, width: '100%', padding: '6px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6b7280', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {t('Delete', 'حذف')}
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Chapters ── */}
      {tab === 'chapters' && (
        <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn variant="primary" onClick={openNewChapter}>+ {t('Add Chapter', 'إضافة فصل')}</Btn>
          </div>
          {showChForm && (
            <Card style={{ marginBottom: 20, border: '1.5px solid #c7d2fe' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                {editingCh ? t('Edit Chapter', 'تعديل الفصل') : t('Add New Chapter', 'إضافة فصل جديد')}
              </h3>
              <Input label={t('Chapter Title', 'عنوان الفصل')} value={chForm.title}       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChForm(f => ({ ...f, title: e.target.value }))}       placeholder={t('e.g. Chapter 6', 'مثال: الفصل 6')} />
              <Input label={t('Description', 'الوصف')}         value={chForm.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChForm(f => ({ ...f, description: e.target.value }))} placeholder={t('Short description…', 'وصف مختصر…')} />
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Status', 'الحالة')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['completed', 'in-progress', 'pending'] as Chapter['status'][]).map((s: Chapter['status']) => (
                    <button key={s} onClick={() => setChForm(f => ({ ...f, status: s }))}
                      style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1.5px solid ${chForm.status === s ? '#c7d2fe' : '#e5e7eb'}`, background: chForm.status === s ? '#eef2ff' : '#fff', color: chForm.status === s ? '#4338ca' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      {s === 'completed' ? t('Completed', 'مكتمل') : s === 'in-progress' ? t('In Progress', 'قيد التنفيذ') : t('Pending', 'قادم')}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn onClick={() => { setShowChForm(false); setEditingCh(null); }}>{t('Cancel', 'إلغاء')}</Btn>
                <Btn variant="primary" onClick={saveChapter}>{editingCh ? t('Save Changes', 'حفظ التغييرات') : t('Add Chapter', 'إضافة الفصل')}</Btn>
              </div>
            </Card>
          )}
          <Card>
            {chapters.length === 0 && <Empty text={t('No chapters yet', 'لا توجد فصول بعد')} />}
            {chapters.map((ch: Chapter, i: number) => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6', animation: `fadeUp 0.3s ease ${i * 0.06}s both`, gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 14, marginBottom: 3 }}>{ch.title}</div>
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>{ch.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Badge variant={statusColors[ch.status]}>{ch.status === 'completed' ? t('Completed', 'مكتمل') : ch.status === 'in-progress' ? t('In Progress', 'قيد التنفيذ') : t('Pending', 'قادم')}</Badge>
                  <button onClick={() => openEditChapter(ch)} style={{ padding: '5px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 7, color: '#4338ca', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{t('Edit', 'تعديل')}</button>
                  <button onClick={() => deleteChapter(ch.id)} style={{ padding: '5px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{t('Delete', 'حذف')}</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── Pending ── */}
      {tab === 'pending' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>{t('Pending Approvals', 'طلبات الموافقة')}</h3>
            {pendingUsers.length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 800, padding: '2px 10px' }}>{pendingUsers.length}</span>}
          </div>
          <Card>
            {pendingUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{t('No pending approvals', 'لا توجد طلبات انتظار')}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{t('All requests have been processed.', 'تمت معالجة جميع الطلبات.')}</div>
              </div>
            )}
            {pendingUsers.map((u: PendingUser, i: number) => {
              const selectedRole = roleOverride[u.id] ?? UserType.Student;
              const roleC = roleColor[selectedRole as keyof typeof roleColor] || '#6366f1';
              const adminParentEmail = parentStudentEmails[u.id] || '';
              const linkedStudent = adminParentEmail
                ? mockUsers.find((s: User) => s.email === adminParentEmail && s.type === UserType.Student)
                : null;

              return (
                <div key={u.id} style={{ padding: '20px 0', borderBottom: i < pendingUsers.length - 1 ? '1px solid #f3f4f6' : 'none', animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Avatar name={u.name} color={roleC} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{u.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 13 }}>{u.email}</div>
                      <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                        {t('Requested at', 'وقت الطلب')}: {new Date(u.created_at ?? '').toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>{t('Approve as:', 'قبول كـ:')}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {([UserType.Student, UserType.Parent, UserType.Teacher] as UserType[]).map((r: UserType) => {
                        const active = selectedRole === r;
                        const rc = roleColor[r as keyof typeof roleColor] || '#6366f1';
                        return (
                          <button key={r} onClick={() => setRoleOverride(prev => ({ ...prev, [u.id]: r }))}
                            style={{ padding: '7px 18px', borderRadius: 9, border: `1.5px solid ${active ? rc : '#e5e7eb'}`, background: active ? `${rc}18` : '#f9fafb', color: active ? rc : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                            {language === 'ar' ? roleLabels[r].ar : roleLabels[r].en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedRole === UserType.Parent && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                        {t("Link to student (enter student's email):", "ربط بطالب (أدخل بريد الطالب):")}
                      </div>
                      <input type="text" value={adminParentEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParentStudentEmails(prev => ({ ...prev, [u.id]: e.target.value }))}
                        placeholder={t('student@example.com', 'بريد الطالب@example.com')}
                        style={{ width: '100%', boxSizing: 'border-box' as const, padding: '10px 14px', background: '#f8fafc', border: `1.5px solid ${linkedStudent ? '#6ee7b7' : adminParentEmail ? '#fca5a5' : '#e5e7eb'}`, borderRadius: 9, fontSize: 13, color: '#111827', fontFamily: 'inherit', direction: 'ltr', outline: 'none' }}
                      />
                      {adminParentEmail && (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: linkedStudent ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {linkedStudent
                            ? <>✅ {t('Linked to', 'مرتبط بـ')}: {(linkedStudent as User).name}</>
                            : <>⚠️ {t('No student found with this email', 'لا يوجد طالب بهذا البريد')}</>
                          }
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => approveUser(u.id, selectedRole, selectedRole === UserType.Parent ? adminParentEmail : undefined)}
                      style={{ padding: '8px 22px', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 9, color: '#059669', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                      ✓ {t('Approve', 'قبول')}
                    </button>
                    <button onClick={() => { if (window.confirm(t('Reject this request?', 'رفض هذا الطلب؟'))) rejectUser(u.id); }}
                      style={{ padding: '8px 22px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 9, color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                      ✕ {t('Reject', 'رفض')}
                    </button>
                    <button onClick={() => handleDeleteUser(u.id, u.name)}
                      style={{ padding: '8px 22px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 9, color: '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                      🗑 {t('Delete permanently', 'حذف نهائي')}
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </Page>
  );
};