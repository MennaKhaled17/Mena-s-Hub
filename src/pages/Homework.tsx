import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserType } from '../types';
import { useHomework, useUsers } from '../hooks/useSupabaseData';
import * as db from '../services/db';
import { Page, PageHeader, Card, Badge, Btn, Textarea, Avatar, Empty } from '../components/ui';
import { Homework, HomeworkAttachment } from '../types';

export const HomeworkPage: React.FC = () => {
  const { currentUser, language, t } = useApp();
  const { data: homeworks = [] } = useHomework();
  const { data: mockUsers = [] } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ type: 'homework' | 'exam'; chapter: string; content: string }>({ type: 'homework', chapter: '', content: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hwAttachments, setHwAttachments] = useState<HomeworkAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fmtSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

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
  const [commentForms, setCommentForms] = useState<Record<string, string>>({});
  const [editingComment, setEditingComment] = useState<Record<string, boolean>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});
  const [commentSaving, setCommentSaving] = useState<Record<string, boolean>>({});
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'homework' | 'exam'>('all');

  if (!currentUser) return null;

  const isTeacher = currentUser.type === UserType.Admin || currentUser.type === UserType.Teacher;
  const isStudent = currentUser.type === UserType.Student;
  const isParent = currentUser.type === UserType.Parent;

  const visible = homeworks.filter(h => {
    if (isStudent && h.studentId !== currentUser.id) return false;
    if (isParent && h.studentId !== currentUser.parentOfStudentId) return false;
    if (isTeacher && filterStudent !== 'all' && h.studentId !== filterStudent) return false;
    if (filterType !== 'all' && h.type !== filterType) return false;
    return true;
  });

  const students = mockUsers.filter(u => u.type === UserType.Student);

  const submitHW = async () => {
    setFormError(null);
    if (form.type === 'exam' ? !form.chapter.trim() : !form.chapter) {
      setFormError(form.type === 'exam'
        ? t('Please enter a title for the exam/quiz.', 'يرجى إدخال عنوان للامتحان/الاختبار.')
        : t('Please select a chapter.', 'يرجى اختيار فصل.'));
      return;
    }
    if (!form.content && hwAttachments.length === 0) {
      setFormError(t('Add a description or attach at least one file.', 'أضف وصفاً أو أرفق ملفاً واحداً على الأقل.'));
      return;
    }
    setSubmitting(true);
    try {
      await db.createHomework({
        studentId: currentUser.id, chapter: form.chapter, content: form.content, type: form.type,
        submissionDate: new Date().toISOString().split('T')[0], attachments: hwAttachments,
      });
      setForm({ type: 'homework', chapter: '', content: '' });
      setHwAttachments([]);
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.message || t('Something went wrong submitting this. Please try again.', 'حدث خطأ أثناء التسليم. حاول مرة أخرى.'));
    } finally {
      setSubmitting(false);
    }
  };

  const addComment = async (hwId: string) => {
    const text = commentForms[hwId];
    if (!text) return;
    setCommentErrors(p => { const n = {...p}; delete n[hwId]; return n; });
    setCommentSaving(p => ({ ...p, [hwId]: true }));
    try {
      await db.addHomeworkComment(hwId, currentUser.id, text);
      setCommentForms(p => { const n = {...p}; delete n[hwId]; return n; });
      setEditingComment(p => { const n = {...p}; delete n[hwId]; return n; });
    } catch (err: any) {
      setCommentErrors(p => ({ ...p, [hwId]: err?.message || t('Something went wrong saving this feedback.', 'حدث خطأ أثناء حفظ التعليق.') }));
    } finally {
      setCommentSaving(p => { const n = {...p}; delete n[hwId]; return n; });
    }
  };

  // Admin can edit any feedback. Teacher can only edit their own — never the admin's.
  const canEditOrDeleteComment = (authorId: string) => {
    if (currentUser.type === UserType.Admin) return true;
    return currentUser.type === UserType.Teacher && authorId === currentUser.id;
  };

  // All feedback is shown under Mena's name, regardless of which teacher/assistant wrote it.
  const feedbackLabel = () => t("Mena's feedback:", 'تعليق منى:');

  return (
    <Page>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <PageHeader
        title={t('Homework', 'الواجبات')}
        sub={isStudent ? t('Submit and track your homework','سلّم واجباتك وتابعها') : t('Review and comment on submissions','راجع التسليمات وعلّق عليها')}
        action={isStudent ? <Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ {t('Submit Homework','تسليم واجب')}</Btn> : undefined}
      />

      {/* Submit form (student) */}
      {showForm && isStudent && (
        <Card style={{ marginBottom: 24, border: '1.5px solid #c7d2fe', animation: 'fadeUp 0.3s ease forwards' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Submit Homework','تسليم واجب')}</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Type','النوع')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['homework', 'exam'] as const).map(ty => (
                <button
                  key={ty}
                  onClick={() => setForm(f => ({ ...f, type: ty, chapter: '' }))}
                  style={{
                    flex: 1, padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                    border: `1.5px solid ${form.type === ty ? '#c7d2fe' : '#e5e7eb'}`,
                    background: form.type === ty ? '#eef2ff' : '#fff',
                    color: form.type === ty ? '#4338ca' : '#6b7280',
                  }}
                >
                  {ty === 'homework' ? t('Homework', 'واجب') : t('Exam / Quiz / Mock', 'امتحان / اختبار / محاكاة')}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'homework' ? (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Chapter','الفصل')}</label>
              <select value={form.chapter} onChange={e => setForm(f=>({...f,chapter:e.target.value}))} style={{ width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:9,fontSize:14,fontFamily:'inherit',color:'#111827',background:'#fff',outline:'none' }}>
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
].map(ch => <option key={ch} value={ch}>{ch}</option>)}            </select>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('Exam / Quiz Title','عنوان الامتحان / الاختبار')}</label>
              <input
                value={form.chapter}
                onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))}
                placeholder={t('e.g. Mock Exam 1, Quiz — Chapter 3', 'مثال: امتحان تجريبي 1، اختبار — الفصل 3')}
                style={{ width:'100%',padding:'10px 12px',border:'1px solid #d1d5db',borderRadius:9,fontSize:14,fontFamily:'inherit',color:'#111827',background:'#fff',outline:'none',boxSizing:'border-box' as const }}
              />
            </div>
          )}

          <Textarea label={t('Your work','عملك')} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder={t('Describe what you completed…','اشرح ما أنجزته…')} />
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>{t('Attach Files (PDF, image, etc.)','إرفاق ملفات (PDF، صورة…)')}</label>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.mp4,.mp3,.zip" style={{ display:'none' }} onChange={e => handleHwFiles(e.target.files)} />
            <button onClick={() => fileInputRef.current?.click()} style={{ padding:'8px 18px', background:'#f0f9ff', border:'1.5px dashed #7dd3fc', borderRadius:9, color:'#0369a1', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
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

          {formError && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, padding:'10px 14px', color:'#b91c1c', fontSize:13, marginBottom:14 }}>
              {formError}
            </div>
          )}

          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <Btn onClick={()=>{ setShowForm(false); setFormError(null); }}>{t('Cancel','إلغاء')}</Btn>
            <Btn variant="primary" onClick={submitHW} disabled={submitting}>{submitting ? t('Submitting…','جارٍ التسليم…') : t('Submit','تسليم')}</Btn>
          </div>
        </Card>
      )}

      {/* Filter (teacher/admin) */}
      {isTeacher && (
        <>
          <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap' }}>
            {([['all', t('All Types','كل الأنواع')], ['homework', t('Homework','واجبات')], ['exam', t('Exams / Quizzes','امتحانات / اختبارات')]] as const).map(([id, name]) => (
              <button key={id} onClick={()=>setFilterType(id)} style={{ padding:'6px 14px',borderRadius:99,border:`1.5px solid ${filterType===id?'#c7d2fe':'#e5e7eb'}`,background:filterType===id?'#eef2ff':'#fff',color:filterType===id?'#4338ca':'#6b7280',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit' }}>
                {name}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:20,flexWrap:'wrap' }}>
            {[{id:'all',name:t('All Students','جميع الطلاب')}, ...students].map(s=>{
              const id = 'id' in s && s.id === 'all' ? 'all' : s.id;
              const name = s.name;
              return (
                <button key={id} onClick={()=>setFilterStudent(id)} style={{ padding:'6px 14px',borderRadius:99,border:`1.5px solid ${filterStudent===id?'#c7d2fe':'#e5e7eb'}`,background:filterStudent===id?'#eef2ff':'#fff',color:filterStudent===id?'#4338ca':'#6b7280',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit' }}>
                  {name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Homework list */}
      {visible.length === 0 ? <Card><Empty text={t('No homework yet','لا توجد واجبات بعد')} /></Card> : (
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {visible.map((h, i) => {
            const student = mockUsers.find(u=>u.id===h.studentId);
            return (
              <Card key={h.id} style={{ animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                <div style={{ display:'flex',alignItems:'flex-start',gap:14 }}>
                  <Avatar name={student?.name||'?'} color="#6366f1" size={42} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:8 }}>
                      <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                        <span style={{ fontWeight:700,fontSize:15,color:'#111827' }}>{student?.name}</span>
                        <Badge variant={h.type === 'exam' ? 'amber' : 'indigo'}>{h.type === 'exam' ? t('Exam/Quiz','امتحان/اختبار') : t('Homework','واجب')}</Badge>
                        <Badge variant="indigo">{h.chapter}</Badge>
                      </div>
                      <span style={{ color:'#9ca3af',fontSize:12 }}>{h.submissionDate}</span>
                    </div>
                    <p style={{ color:'#374151',fontSize:14,margin:'0 0 12px',lineHeight:1.6 }}>{h.content}</p>
                    {h.attachments && h.attachments.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
                        {h.attachments.map(a => (
                          <a key={a.id} href={a.url} download={a.name} style={{ display:'flex', alignItems:'center', gap:5, background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:7, padding:'4px 10px', fontSize:12, color:'#0369a1', textDecoration:'none' }}>
                            <span style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Feedback section */}
                    {h.comment && !editingComment[h.id] ? (
                      <div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 14px' }}>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
                          <span style={{ fontSize:13,fontWeight:700,color:'#065f46' }}>{feedbackLabel()}</span>
                          {canEditOrDeleteComment(h.comment.teacherId) && (
                            <button
                              onClick={() => {
                                setCommentForms(p => ({ ...p, [h.id]: h.comment!.content }));
                                setEditingComment(p => ({ ...p, [h.id]: true }));
                              }}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#059669', fontSize:12, fontWeight:600, fontFamily:'inherit', padding:0 }}
                            >
                              {t('Edit','تعديل')}
                            </button>
                          )}
                        </div>
                        <p style={{ color:'#047857',fontSize:14,margin:0,lineHeight:1.5 }}>{h.comment.content}</p>
                      </div>
                    ) : isTeacher ? (
                      <div>
                        <textarea
                          value={commentForms[h.id]||''}
                          onChange={e=>setCommentForms(p=>({...p,[h.id]:e.target.value}))}
                          placeholder={t('Write feedback…','اكتب تعليقاً…')}
                          rows={2}
                          style={{ width:'100%',padding:'9px 12px',border:'1px solid #d1d5db',borderRadius:9,fontSize:13,fontFamily:'inherit',color:'#111827',background:'#fff',outline:'none',resize:'vertical',boxSizing:'border-box' as const,marginBottom:8 }}
                        />
                        <div style={{ display:'flex', gap:8 }}>
                          <Btn size="sm" variant="primary" onClick={()=>addComment(h.id)} disabled={!!commentSaving[h.id]}>
                            {commentSaving[h.id] ? t('Saving…','جارٍ الحفظ…') : (h.comment ? t('Save','حفظ') : t('Add Feedback','إضافة تعليق'))}
                          </Btn>
                          {h.comment && (
                            <Btn size="sm" onClick={() => {
                              setEditingComment(p => { const n = {...p}; delete n[h.id]; return n; });
                              setCommentForms(p => { const n = {...p}; delete n[h.id]; return n; });
                              setCommentErrors(p => { const n = {...p}; delete n[h.id]; return n; });
                            }}>
                              {t('Cancel','إلغاء')}
                            </Btn>
                          )}
                        </div>
                        {commentErrors[h.id] && (
                          <div style={{ color:'#b91c1c', fontSize:12, marginTop:8 }}>{commentErrors[h.id]}</div>
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