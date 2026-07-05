import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserType } from '../types';
import { useReports, useUsers, useHomework } from '../hooks/useSupabaseData';
import * as db from '../services/db';
import { Page, PageHeader, Card, Badge, Btn, Textarea, Avatar, Empty } from '../components/ui';
import { Report, Attachment, Homework, HomeworkAttachment } from '../types';

export const Reports: React.FC = () => {
  const { currentUser, language, t } = useApp();
  const isRTL = language === 'ar';
  const { data: reports = [] } = useReports();
  const { data: homeworks = [] } = useHomework();
  const { data: mockUsers = [] } = useUsers();

  // ── General report form state (teacher/admin) ──────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: '', content: '', behavior: 'good' as Report['behavior'] });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string>('');
  const [recording, setRecording] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [showCommentFor, setShowCommentFor] = useState<string | null>(null);
  const [addCommentErrors, setAddCommentErrors] = useState<Record<string, string>>({});
  const [addCommentSaving, setAddCommentSaving] = useState<Record<string, boolean>>({});
  const [editingReportComment, setEditingReportComment] = useState<Record<string, boolean>>({});
  const [editCommentText, setEditCommentText] = useState<Record<string, string>>({});
  const [editCommentErrors, setEditCommentErrors] = useState<Record<string, string>>({});
  const [editCommentSaving, setEditCommentSaving] = useState<Record<string, boolean>>({});
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalAttachmentIds, setOriginalAttachmentIds] = useState<Set<string>>(new Set());

  // ── Homework/exam submission form state (student) ──────────
  const [showHwForm, setShowHwForm] = useState(false);
  const [hwForm, setHwForm] = useState<{ type: 'homework' | 'exam'; chapter: string; content: string }>({ type: 'homework', chapter: '', content: '' });
  const [hwFormError, setHwFormError] = useState<string | null>(null);
  const [hwSubmitting, setHwSubmitting] = useState(false);
  const [hwAttachments, setHwAttachments] = useState<HomeworkAttachment[]>([]);
  const hwFileInputRef = useRef<HTMLInputElement>(null);

  // ── Homework feedback state (edit-in-place, teacher/admin) ─
  const [hwCommentForms, setHwCommentForms] = useState<Record<string, string>>({});
  const [hwEditingComment, setHwEditingComment] = useState<Record<string, boolean>>({});
  const [hwCommentErrors, setHwCommentErrors] = useState<Record<string, string>>({});
  const [hwCommentSaving, setHwCommentSaving] = useState<Record<string, boolean>>({});

  // ── Filters ─────────────────────────────────────────────────
  const [filter, setFilter] = useState('all'); // student filter (teacher/admin)
  const [contentFilter, setContentFilter] = useState<'all' | 'reports' | 'homework' | 'exam'>('all');

  const fmtSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

  if (!currentUser) return null;

  const isMena = currentUser.type === UserType.Admin;
  const isTeacher = isMena || currentUser.type === UserType.Teacher;
  const canCreate = isTeacher;
  const isStudent = currentUser.type === UserType.Student;
  const isParent = currentUser.type === UserType.Parent;
  const myChildId = currentUser.parentOfStudentId;

  const students = mockUsers.filter(u => u.type === UserType.Student);

  // ── General report helpers ─────────────────────────────────

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const att: Attachment = { id: `a${Date.now()}-${Math.random()}`, name: file.name, url: ev.target?.result as string, type: file.type, size: file.size };
        setAttachments(prev => [...prev, att]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { alert(t('Microphone access denied.', 'تم رفض الوصول إلى الميكروفون.')); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const addReport = async () => {
    if (!form.studentId || (!form.content && !voiceUrl)) return;
    if (editingId) {
      await db.updateReport(editingId, { content: form.content, behavior: form.behavior, voiceUrl: voiceUrl || undefined, type: voiceUrl ? 'voice' : 'text' });
      if (attachments.length) {
        const newOnes = attachments.filter(a => !originalAttachmentIds.has(a.id));
        if (newOnes.length) await db.addReportAttachments(editingId, newOnes);
      }
      setEditingId(null);
    } else {
      await db.createReport({
        studentId: form.studentId, teacherId: currentUser.id,
        date: new Date().toISOString().split('T')[0], type: voiceUrl ? 'voice' : 'text',
        content: form.content, behavior: form.behavior, attachments, voiceUrl: voiceUrl || undefined,
      });
    }
    setForm({ studentId: '', content: '', behavior: 'good' });
    setAttachments([]);
    setVoiceBlob(null);
    setVoiceUrl('');
    setShowForm(false);
  };

  const startEdit = (r: Report) => {
    setForm({ studentId: r.studentId, content: r.content, behavior: r.behavior || 'good' });
    setAttachments(r.attachments || []);
    setOriginalAttachmentIds(new Set((r.attachments || []).map(a => a.id)));
    setVoiceUrl(r.voiceUrl || '');
    setEditingId(r.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteReport = async (id: string) => {
    if (window.confirm(t('Delete this report?', 'حذف هذا التقرير؟'))) {
      await db.deleteReport(id);
    }
  };

  const addComment = async (reportId: string) => {
    const text = commentMap[reportId]?.trim();
    if (!text) return;
    setAddCommentErrors(p => { const n = {...p}; delete n[reportId]; return n; });
    setAddCommentSaving(p => ({ ...p, [reportId]: true }));
    try {
      await db.addReportComment(reportId, currentUser.id, text);
      setCommentMap(prev => ({ ...prev, [reportId]: '' }));
      setShowCommentFor(null);
    } catch (err: any) {
      setAddCommentErrors(p => ({ ...p, [reportId]: err?.message || t('Something went wrong posting this comment.', 'حدث خطأ أثناء نشر التعليق.') }));
    } finally {
      setAddCommentSaving(p => { const n = {...p}; delete n[reportId]; return n; });
    }
  };

  // Admin can edit/delete any comment. Teacher can only edit/delete their own — never the admin's.
  const canEditOrDeleteComment = (authorId: string) => {
    if (isMena) return true;
    return currentUser.type === UserType.Teacher && authorId === currentUser.id;
  };

  const startEditReportComment = (commentId: string, currentContent: string) => {
    setEditCommentText(p => ({ ...p, [commentId]: currentContent }));
    setEditingReportComment(p => ({ ...p, [commentId]: true }));
  };

  const cancelEditReportComment = (commentId: string) => {
    setEditingReportComment(p => { const n = {...p}; delete n[commentId]; return n; });
    setEditCommentText(p => { const n = {...p}; delete n[commentId]; return n; });
    setEditCommentErrors(p => { const n = {...p}; delete n[commentId]; return n; });
  };

  const saveEditReportComment = async (commentId: string) => {
    const text = editCommentText[commentId]?.trim();
    if (!text) return;
    setEditCommentErrors(p => { const n = {...p}; delete n[commentId]; return n; });
    setEditCommentSaving(p => ({ ...p, [commentId]: true }));
    try {
      await db.updateReportComment(commentId, text);
      cancelEditReportComment(commentId);
    } catch (err: any) {
      setEditCommentErrors(p => ({ ...p, [commentId]: err?.message || t('Something went wrong saving this edit.', 'حدث خطأ أثناء حفظ التعديل.') }));
    } finally {
      setEditCommentSaving(p => { const n = {...p}; delete n[commentId]; return n; });
    }
  };

  const deleteComment = async (_reportId: string, commentId: string) => {
    await db.deleteReportComment(commentId);
  };

  const commentAuthorLabel = (authorId: string) => {
    const author = mockUsers.find(u => u.id === authorId);
    if (!author) return t('Unknown', 'غير معروف');
    if (author.type === UserType.Admin) return t("Mena's comment", 'تعليق منى');
    if (author.type === UserType.Teacher) return t("Assistant's comment", 'تعليق المساعد');
    return author.name;
  };

  const bv: Record<string, 'green'|'amber'|'red'> = { excellent:'green', good:'amber', 'needs-improvement':'red' };

  // ── Homework/exam submission helpers (student) ─────────────

  const handleHwFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const att: HomeworkAttachment = { id: `ha${Date.now()}-${Math.random()}`, name: file.name, url: ev.target?.result as string, type: file.type, size: file.size };
        setHwAttachments(prev => [...prev, att]);
      };
      reader.readAsDataURL(file);
    });
  };

  const submitHW = async () => {
    setHwFormError(null);
    if (hwForm.type === 'exam' ? !hwForm.chapter.trim() : !hwForm.chapter) {
      setHwFormError(hwForm.type === 'exam'
        ? t('Please enter a title for the exam/quiz.', 'يرجى إدخال عنوان للامتحان/الاختبار.')
        : t('Please select a chapter.', 'يرجى اختيار فصل.'));
      return;
    }
    if (!hwForm.content && hwAttachments.length === 0) {
      setHwFormError(t('Add a description or attach at least one file.', 'أضف وصفاً أو أرفق ملفاً واحداً على الأقل.'));
      return;
    }
    setHwSubmitting(true);
    try {
      await db.createHomework({
        studentId: currentUser.id, chapter: hwForm.chapter, content: hwForm.content, type: hwForm.type,
        submissionDate: new Date().toISOString().split('T')[0], attachments: hwAttachments,
      });
      setHwForm({ type: 'homework', chapter: '', content: '' });
      setHwAttachments([]);
      setShowHwForm(false);
    } catch (err: any) {
      setHwFormError(err?.message || t('Something went wrong submitting this. Please try again.', 'حدث خطأ أثناء التسليم. حاول مرة أخرى.'));
    } finally {
      setHwSubmitting(false);
    }
  };

  // Homework feedback: adds or edits the single feedback comment on a homework item.
  const addHwComment = async (hwId: string) => {
    const text = hwCommentForms[hwId];
    if (!text) return;
    setHwCommentErrors(p => { const n = {...p}; delete n[hwId]; return n; });
    setHwCommentSaving(p => ({ ...p, [hwId]: true }));
    try {
      await db.addHomeworkComment(hwId, currentUser.id, text);
      setHwCommentForms(p => { const n = {...p}; delete n[hwId]; return n; });
      setHwEditingComment(p => { const n = {...p}; delete n[hwId]; return n; });
    } catch (err: any) {
      setHwCommentErrors(p => ({ ...p, [hwId]: err?.message || t('Something went wrong saving this feedback.', 'حدث خطأ أثناء حفظ التعليق.') }));
    } finally {
      setHwCommentSaving(p => { const n = {...p}; delete n[hwId]; return n; });
    }
  };

  // All homework feedback is shown under Mena's name, regardless of which teacher/assistant wrote it.
  const hwFeedbackLabel = () => t("Mena's feedback:", 'تعليق منى:');

  // ── Visibility + unified feed ───────────────────────────────

  const visibleReports = reports.filter(r => {
    if (isStudent) return r.studentId === currentUser.id;
    if (isParent)  return r.studentId === myChildId;
    if (isTeacher && filter !== 'all') return r.studentId === filter;
    return true;
  });

  const visibleHomeworks = homeworks.filter(h => {
    if (isStudent) return h.studentId === currentUser.id;
    if (isParent)  return h.studentId === myChildId;
    if (isTeacher && filter !== 'all') return h.studentId === filter;
    return true;
  });

  type FeedItem =
    | { kind: 'report'; id: string; date: string; report: Report }
    | { kind: 'homework'; id: string; date: string; homework: Homework };

  const feed: FeedItem[] = [
    ...(contentFilter === 'homework' || contentFilter === 'exam' ? [] : visibleReports.map(r => ({ kind: 'report' as const, id: r.id, date: r.date, report: r }))),
    ...visibleHomeworks
      .filter(h => contentFilter === 'all' || contentFilter === h.type)
      .filter(h => contentFilter !== 'reports')
      .map(h => ({ kind: 'homework' as const, id: h.id, date: h.submissionDate, homework: h })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <Page>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .rrow:hover{background:#fafafa!important}
        .att-chip:hover{background:#eef2ff!important}
        .rec-pulse { animation: recPulse 1s ease-in-out infinite; }
        @keyframes recPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
      `}</style>

      <PageHeader
        title={t('Report', 'التقرير')}
        sub={t('Weekly reports, homework, and mock/quiz submissions — all in one place', 'التقارير الأسبوعية والواجبات والامتحانات التجريبية والاختبارات في مكان واحد')}
        action={
          isStudent
            ? <Btn variant="primary" onClick={() => setShowHwForm(!showHwForm)}>+ {t('Submit Homework / Exam', 'تسليم واجب / امتحان')}</Btn>
            : canCreate
              ? <Btn variant="primary" onClick={() => { setEditingId(null); setForm({ studentId:'', content:'', behavior:'good' }); setAttachments([]); setVoiceUrl(''); setShowForm(!showForm); }}>+ {t('New Report', 'تقرير جديد')}</Btn>
              : undefined
        }
      />

      {/* Homework / exam submission form (student) */}
      {showHwForm && isStudent && (
        <Card style={{ marginBottom: 24, border: '1.5px solid #c7d2fe', animation: 'fadeUp 0.3s ease forwards' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Submit Homework / Exam','تسليم واجب / امتحان')}</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Type','النوع')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['homework', 'exam'] as const).map(ty => (
                <button
                  key={ty}
                  onClick={() => setHwForm(f => ({ ...f, type: ty, chapter: '' }))}
                  style={{
                    flex: 1, padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                    border: `1.5px solid ${hwForm.type === ty ? '#c7d2fe' : '#e5e7eb'}`,
                    background: hwForm.type === ty ? '#eef2ff' : '#fff',
                    color: hwForm.type === ty ? '#4338ca' : '#6b7280',
                  }}
                >
                  {ty === 'homework' ? t('Homework', 'واجب') : t('Exam / Quiz / Mock', 'امتحان / اختبار / محاكاة')}
                </button>
              ))}
            </div>
          </div>

          {hwForm.type === 'homework' ? (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Chapter','الفصل')}</label>
              <select value={hwForm.chapter} onChange={e => setHwForm(f=>({...f,chapter:e.target.value}))} style={{ width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:9,fontSize:14,fontFamily:'inherit',color:'#111827',background:'#fff',outline:'none' }}>
                <option value="">{t('Select chapter…','اختر فصلاً…')}</option>
                {[
                  'Correlation',
                  'Coding',
                  'Venn Diagram',
                  'Tree Diagram',
                  'Boxplot & Stem and Leaf',
                  'Continuous Data',
                  'Histogram',
                  'Discrete Basic',
                  'Discrete Tricky',
                  'Discrete Level El Wash',
                  'Normal Distribution Basics',
                  'Normal Distribution Simultaneous & Given That',
                ].map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Exam / Quiz Title','عنوان الامتحان / الاختبار')}</label>
              <input
                value={hwForm.chapter}
                onChange={e => setHwForm(f => ({ ...f, chapter: e.target.value }))}
                placeholder={t('e.g. Mock Exam 1, Quiz — Chapter 3', 'مثال: امتحان تجريبي 1، اختبار — الفصل 3')}
                style={{ width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:9,fontSize:14,fontFamily:'inherit',color:'#111827',background:'#fff',outline:'none',boxSizing:'border-box' as const }}
              />
            </div>
          )}

          <Textarea label={t('Your work','عملك')} value={hwForm.content} onChange={e=>setHwForm(f=>({...f,content:e.target.value}))} placeholder={t('Describe what you completed…','اشرح ما أنجزته…')} />
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>{t('Attach Files (PDF, image, etc.)','إرفاق ملفات (PDF، صورة…)')}</label>
            <input ref={hwFileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.mp4,.mp3,.zip" style={{ display:'none' }} onChange={e => handleHwFiles(e.target.files)} />
            <button onClick={() => hwFileInputRef.current?.click()} style={{ padding:'8px 18px', background:'#f0f9ff', border:'1.5px dashed #7dd3fc', borderRadius:9, color:'#0369a1', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
              + {t('Add File','إضافة ملف')}
            </button>
            {hwAttachments.length > 0 && (
              <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:8 }}>
                {hwAttachments.map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, background:'#f4f6fb', border:'1px solid #e5e7eb', borderRadius:8, padding:'5px 10px', fontSize:12, color:'#374151' }}>
                    <span style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                    <span style={{ color:'#9ca3af' }}>({fmtSize(a.size)})</span>
                    <button onClick={() => setHwAttachments(prev => prev.filter(x=>x.id!==a.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14, padding:0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hwFormError && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', color:'#b91c1c', fontSize:13, marginBottom:14 }}>
              {hwFormError}
            </div>
          )}

          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ setShowHwForm(false); setHwFormError(null); }}>{t('Cancel','إلغاء')}</Btn>
            <Btn variant="primary" onClick={submitHW} disabled={hwSubmitting}>{hwSubmitting ? t('Submitting…','جارٍ التسليم…') : t('Submit','تسليم')}</Btn>
          </div>
        </Card>
      )}

      {/* New / Edit general report form (teacher/admin) */}
      {showForm && canCreate && (
        <Card style={{ marginBottom: 24, border: '1.5px solid #c7d2fe', animation: 'fadeUp 0.3s ease forwards' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {editingId ? t('Edit Report', 'تعديل التقرير') : t('New Report', 'تقرير جديد')}
          </h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Student', 'الطالب')}</label>
            <select value={form.studentId} onChange={e => setForm(f => ({...f, studentId: e.target.value}))} disabled={!!editingId} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: '#111827', background: editingId ? '#f9fafb' : '#fff', outline: 'none' }}>
              <option value="">{t('Select student…', 'اختر طالباً…')}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Behavior', 'السلوك')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([['excellent', t('Excellent','ممتاز'), 'green'], ['good', t('Good','جيد'), 'amber'], ['needs-improvement', t('Needs Work','يحتاج تحسين'), 'red']] as [string,string,string][]).map(([val, lbl, col]) => (
                <button key={val} onClick={() => setForm(f => ({...f, behavior: val as Report['behavior']}))} style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1.5px solid ${form.behavior === val ? (col==='green'?'#6ee7b7':col==='amber'?'#fcd34d':'#fca5a5') : '#e5e7eb'}`, background: form.behavior === val ? (col==='green'?'#ecfdf5':col==='amber'?'#fffbeb':'#fef2f2') : '#fff', color: form.behavior === val ? (col==='green'?'#065f46':col==='amber'?'#92400e':'#991b1b') : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <Textarea label={t('Report content', 'محتوى التقرير')} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder={t('Write your observations…', 'اكتب ملاحظاتك…')} />

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{t('Voice Note', 'ملاحظة صوتية')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!recording ? (
                <button onClick={startRecording} style={{ padding: '8px 18px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 9, color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                  {t('Start Recording', 'بدء التسجيل')}
                </button>
              ) : (
                <button onClick={stopRecording} className="rec-pulse" style={{ padding: '8px 18px', background: '#dc2626', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t('Stop Recording', 'إيقاف التسجيل')}
                </button>
              )}
              {voiceUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <audio controls src={voiceUrl} style={{ height: 32, flex: 1 }} />
                  <button onClick={() => { setVoiceUrl(''); setVoiceBlob(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}>×</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{t('Attachments', 'المرفقات')}</label>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.mp4,.mp3,.zip" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 18px', background: '#f0f9ff', border: '1.5px dashed #7dd3fc', borderRadius: 9, color: '#0369a1', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}>
              + {t('Add File (PDF, image, etc.)', 'إضافة ملف (PDF، صورة…)')}
            </button>
            {attachments.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {attachments.map(a => (
                  <div key={a.id} className="att-chip" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#374151', cursor: 'default', transition: 'background 0.15s' }}>
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                    <span style={{ color: '#9ca3af' }}>({fmtSize(a.size)})</span>
                    <button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={() => { setShowForm(false); setEditingId(null); }}>{t('Cancel', 'إلغاء')}</Btn>
            <Btn variant="primary" onClick={addReport}>{editingId ? t('Save Changes', 'حفظ التغييرات') : t('Save Report', 'حفظ التقرير')}</Btn>
          </div>
        </Card>
      )}

      {/* Content type filter — everyone can narrow the feed */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {([['all', t('All','الكل')], ['reports', t('Weekly Reports','التقارير الأسبوعية')], ['homework', t('Homework','الواجبات')], ['exam', t('Mock/Quiz','امتحانات/اختبارات')]] as const).map(([id, name]) => (
          <button key={id} onClick={() => setContentFilter(id)} style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${contentFilter===id?'#c7d2fe':'#e5e7eb'}`, background: contentFilter===id?'#eef2ff':'#fff', color: contentFilter===id?'#4338ca':'#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            {name}
          </button>
        ))}
      </div>

      {/* Student filter (teacher/admin only) */}
      {isTeacher && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${filter==='all'?'#c7d2fe':'#e5e7eb'}`, background: filter==='all'?'#eef2ff':'#fff', color: filter==='all'?'#4338ca':'#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            {t('All Students', 'جميع الطلاب')}
          </button>
          {students.map(s => (
            <button key={s.id} onClick={() => setFilter(s.id||'')} style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${filter===s.id?'#c7d2fe':'#e5e7eb'}`, background: filter===s.id?'#eef2ff':'#fff', color: filter===s.id?'#4338ca':'#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Unified feed: weekly reports + homework + mock/quiz */}
      {feed.length === 0 ? <Card><Empty text={t('No reports yet','لا توجد تقارير بعد')} /></Card> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {feed.map((item, i) => {
            if (item.kind === 'report') {
              const r = item.report;
              const student = mockUsers.find(u => u.id === r.studentId);
              const teacher = mockUsers.find(u => u.id === r.teacherId);
              const canEdit = isMena || (currentUser.type === UserType.Teacher && r.teacherId === currentUser.id);
              return (
                <Card key={`report-${r.id}`} style={{ animation: `fadeUp 0.3s ease ${i*0.05}s both` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <Avatar name={student?.name||'?'} color="#6366f1" size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{student?.name}</span>
                          <Badge variant="indigo">{t('Weekly Report','تقرير أسبوعي')}</Badge>
                          {r.behavior && <Badge variant={bv[r.behavior]}>{r.behavior==='excellent'?t('Excellent','ممتاز'):r.behavior==='good'?t('Good','جيد'):t('Needs Work','يحتاج تحسين')}</Badge>}
                          {r.type === 'voice' && <Badge variant="indigo">{t('Voice','صوتي')}</Badge>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>{teacher?.name}</span>
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>{r.date}</span>
                          {canEdit && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => startEdit(r)} title={t('Edit','تعديل')} style={{ padding: '4px 10px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 7, color: '#4338ca', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{t('Edit','تعديل')}</button>
                              <button onClick={() => deleteReport(r.id)} title={t('Delete','حذف')} style={{ padding: '4px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{t('Delete','حذف')}</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {r.content && <p style={{ color: '#374151', fontSize: 14, margin: '0 0 10px', lineHeight: 1.6 }}>{r.content}</p>}

                      {r.voiceUrl && (
                        <div style={{ marginBottom: 10 }}>
                          <audio controls src={r.voiceUrl} style={{ width: '100%', height: 32 }} />
                        </div>
                      )}

                      {r.attachments && r.attachments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {r.attachments.map(a => (
                            <a key={a.id} href={a.url} download={a.name} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f4f6fb', border: '1px solid #e5e7eb', borderRadius: 7, padding: '4px 10px', fontSize: 12, color: '#4338ca', textDecoration: 'none', transition: 'background 0.15s' }}>
                              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {(r.comments||[]).length > 0 && (
                        <div style={{ marginBottom: 8, borderLeft: '2px solid #e5e7eb', paddingLeft: 12 }}>
                          {(r.comments||[]).map(c => {
                            const authorLabel = commentAuthorLabel(c.authorId);
                            const author = mockUsers.find(u => u.id === c.authorId);
                            const isAdminComment = author?.type === UserType.Admin;
                            const canManage = canEditOrDeleteComment(c.authorId);
                            const isEditingThis = !!editingReportComment[c.id];
                            return (
                              <div key={c.id} style={{ marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <Avatar name={author?.name||'?'} color={isAdminComment ? '#6366f1' : '#10b981'} size={26} />
                                <div style={{ flex: 1, background: isAdminComment ? '#eef2ff' : '#f0fdf4', border: `1px solid ${isAdminComment ? '#c7d2fe' : '#bbf7d0'}`, borderRadius: 8, padding: '6px 10px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: isAdminComment ? '#4338ca' : '#065f46' }}>{authorLabel}</span>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.date}</span>
                                      {canManage && !isEditingThis && (
                                        <button onClick={() => startEditReportComment(c.id, c.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 11, fontWeight: 600, padding: 0 }}>{t('Edit','تعديل')}</button>
                                      )}
                                      {canManage && (
                                        <button onClick={() => deleteComment(r.id, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: 0 }}>×</button>
                                      )}
                                    </div>
                                  </div>
                                  {isEditingThis ? (
                                    <div style={{ marginTop: 4 }}>
                                      <textarea
                                        value={editCommentText[c.id] ?? ''}
                                        onChange={e => setEditCommentText(p => ({ ...p, [c.id]: e.target.value }))}
                                        rows={2}
                                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, marginBottom: 6 }}
                                      />
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <Btn size="sm" variant="primary" onClick={() => saveEditReportComment(c.id)} disabled={!!editCommentSaving[c.id]}>
                                          {editCommentSaving[c.id] ? t('Saving…','جارٍ الحفظ…') : t('Save','حفظ')}
                                        </Btn>
                                        <Btn size="sm" onClick={() => cancelEditReportComment(c.id)}>{t('Cancel','إلغاء')}</Btn>
                                      </div>
                                      {editCommentErrors[c.id] && (
                                        <div style={{ color: '#b91c1c', fontSize: 11, marginTop: 6 }}>{editCommentErrors[c.id]}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <p style={{ margin: '3px 0 0', fontSize: 13, color: '#374151' }}>{c.content}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(isMena || currentUser.type === UserType.Teacher) && (
                        showCommentFor === r.id ? (
                          <div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                              <textarea value={commentMap[r.id]||''} onChange={e => setCommentMap(p => ({...p, [r.id]: e.target.value}))} placeholder={t('Write a comment…','اكتب تعليقاً…')} rows={2} style={{ flex: 1, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Btn variant="primary" onClick={() => addComment(r.id)} disabled={!!addCommentSaving[r.id]}>
                                  {addCommentSaving[r.id] ? t('Posting…','جارٍ النشر…') : t('Post','نشر')}
                                </Btn>
                                <Btn onClick={() => setShowCommentFor(null)}>{t('Cancel','إلغاء')}</Btn>
                              </div>
                            </div>
                            {addCommentErrors[r.id] && (
                              <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 6 }}>{addCommentErrors[r.id]}</div>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => setShowCommentFor(r.id)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '4px 0', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {t('Add comment', 'إضافة تعليق')}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            // Homework / exam item
            const h = item.homework;
            const student = mockUsers.find(u => u.id === h.studentId);
            return (
              <Card key={`hw-${h.id}`} style={{ animation: `fadeUp 0.3s ease ${i*0.05}s both` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <Avatar name={student?.name||'?'} color="#6366f1" size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{student?.name}</span>
                        <Badge variant={h.type === 'exam' ? 'amber' : 'indigo'}>{h.type === 'exam' ? t('Mock/Quiz','امتحان/اختبار') : t('Homework','واجب')}</Badge>
                        <Badge variant="indigo">{h.chapter}</Badge>
                      </div>
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>{h.submissionDate}</span>
                    </div>
                    <p style={{ color: '#374151', fontSize: 14, margin: '0 0 12px', lineHeight: 1.6 }}>{h.content}</p>

                    {h.attachments && h.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        {h.attachments.map(a => (
                          <a key={a.id} href={a.url} download={a.name} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 7, padding: '4px 10px', fontSize: 12, color: '#0369a1', textDecoration: 'none' }}>
                            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {h.comment && !hwEditingComment[h.id] ? (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>{hwFeedbackLabel()}</span>
                          {canEditOrDeleteComment(h.comment.teacherId) && (
                            <button
                              onClick={() => {
                                setHwCommentForms(p => ({ ...p, [h.id]: h.comment!.content }));
                                setHwEditingComment(p => ({ ...p, [h.id]: true }));
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: 0 }}
                            >
                              {t('Edit','تعديل')}
                            </button>
                          )}
                        </div>
                        <p style={{ color: '#047857', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{h.comment.content}</p>
                      </div>
                    ) : isTeacher ? (
                      <div>
                        <textarea
                          value={hwCommentForms[h.id]||''}
                          onChange={e => setHwCommentForms(p => ({...p, [h.id]: e.target.value}))}
                          placeholder={t('Write feedback…','اكتب تعليقاً…')}
                          rows={2}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#111827', background: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, marginBottom: 8 }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn size="sm" variant="primary" onClick={() => addHwComment(h.id)} disabled={!!hwCommentSaving[h.id]}>
                            {hwCommentSaving[h.id] ? t('Saving…','جارٍ الحفظ…') : (h.comment ? t('Save','حفظ') : t('Add Feedback','إضافة تعليق'))}
                          </Btn>
                          {h.comment && (
                            <Btn size="sm" onClick={() => {
                              setHwEditingComment(p => { const n = {...p}; delete n[h.id]; return n; });
                              setHwCommentForms(p => { const n = {...p}; delete n[h.id]; return n; });
                              setHwCommentErrors(p => { const n = {...p}; delete n[h.id]; return n; });
                            }}>
                              {t('Cancel','إلغاء')}
                            </Btn>
                          )}
                        </div>
                        {hwCommentErrors[h.id] && (
                          <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{hwCommentErrors[h.id]}</div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="amber">{t('Awaiting feedback','بانتظار التعليق')}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
};