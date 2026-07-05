import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { useVideos, useChapters } from '../hooks/useSupabaseData';
import * as db from '../services/db';
import { Page, PageHeader, Card, Badge, Btn, Input, Textarea } from '../components/ui';
import { UserType } from '../types';
import type { Chapter } from '../types';


/* ───────────────────── VIDEOS ───────────────────── */
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const IconLock2 = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconFolder = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

// Sorts labels like "Chapter 2", "Chapter 10" by the number inside them,
// so 2 comes before 10 instead of alphabetical ("Chapter 10" < "Chapter 2").
function sortChaptersNaturally(chapters: string[]): string[] {
  return [...chapters].sort((a, b) => {
    const numA = a.match(/\d+/);
    const numB = b.match(/\d+/);
    if (numA && numB) return parseInt(numA[0], 10) - parseInt(numB[0], 10);
    if (numA) return -1;
    if (numB) return 1;
    return a.localeCompare(b);
  });
}

export const Videos: React.FC = () => {
  const { language, t } = useApp();
  const { data: mockVideos = [] } = useVideos();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const isRTL = language === 'ar';

  const selected = mockVideos.find(v => v.id === selectedId) ?? mockVideos[0];
  const chapters = sortChaptersNaturally(Array.from(new Set(mockVideos.map(v => v.chapter))));
  const filtered = filterChapter === 'all' ? mockVideos : mockVideos.filter(v => v.chapter === filterChapter);

  if (!selected) {
    return (
      <Page>
        <PageHeader title={t('Lesson Videos','فيديوهات الدروس')} />
        <Card style={{ textAlign:'center', padding:'48px 24px', color:'#9ca3af' }}>
          {t('No videos yet.','لا توجد فيديوهات بعد.')}
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .vitem:hover{background:#f0f2f8!important;border-color:#c7d2fe!important;}
        .chapter-tab:hover{background:#eef2ff!important;color:#4338ca!important;}
        .chapter-tab.active{background:#6366f1!important;color:#fff!important;border-color:#6366f1!important;}
      `}</style>

      <PageHeader
        title={t('Lesson Videos','فيديوهات الدروس')}
        sub={t('View-only · Downloading is disabled','للمشاهدة فقط · التنزيل معطّل')}
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24 }}>
        {/* Player */}
        <div>
          {/* Video embed */}
          <div style={{ background:'#0f172a', borderRadius:16, overflow:'hidden', border:'1px solid #1e293b', position:'relative', paddingTop:'56.25%' }}>
            <iframe
              key={selected.id}
              src={`https://drive.google.com/file/d/${selected.driveId}/preview`}
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
              allow="autoplay"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>

          {/* Video info card */}
          <Card style={{ marginTop:14 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:'0 0 8px', lineHeight:1.3 }}>
                  {language==='ar' ? selected.titleAr : selected.title}
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <Badge variant="indigo">{selected.chapter}</Badge>
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'#9ca3af', fontSize:12, fontWeight:500 }}>
                    <IconLock2 /> {t('View only – no download','عرض فقط – لا تنزيل')}
                  </div>
                </div>
              </div>
              <div style={{ width:40, height:40, borderRadius:10, background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <IconVideo />
              </div>
            </div>
          </Card>

          {/* Drive ID hint */}
          
        </div>

        {/* Playlist panel */}
        <div>
          {/* Chapter filter tabs */}
          <div style={{ marginBottom:14 }}>
            <h3 style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
              {t('Filter by Chapter','تصفية حسب الفصل')}
            </h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              <button className={`chapter-tab${filterChapter==='all'?' active':''}`} onClick={()=>setFilterChapter('all')}
                style={{ padding:'5px 12px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:600, color:'#6b7280', fontFamily:'inherit', transition:'all 0.15s' }}>
                {t('All','الكل')}
              </button>
              {chapters.map(ch => (
                <button key={ch} className={`chapter-tab${filterChapter===ch?' active':''}`} onClick={()=>setFilterChapter(ch)}
                  style={{ padding:'5px 12px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:999, cursor:'pointer', fontSize:12, fontWeight:600, color:'#6b7280', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Video list */}
          <h3 style={{ fontSize:12, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
            {t('Lessons','الدروس')} ({filtered.length})
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map((v,i)=>{
              const active = v.id===selected.id;
              return (
                <button key={v.id} className="vitem" onClick={()=>setSelectedId(v.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:active?'#eef2ff':'#fff', border:`1.5px solid ${active?'#c7d2fe':'#e5e7eb'}`, borderRadius:12, cursor:'pointer', textAlign:isRTL?'right':'left', fontFamily:'inherit', transition:'all 0.15s', animation:`fadeUp 0.3s ease ${i*0.06}s both` }}>
                  <div style={{ width:36,height:36,borderRadius:9,background:active?'#6366f1':'#f4f6fb',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:active?'#fff':'#9ca3af' }}>
                    <IconPlay />
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:active?700:500,color:active?'#4338ca':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {language==='ar'?v.titleAr:v.title}
                    </div>
                    <div style={{ fontSize:11,color:'#9ca3af',marginTop:2 }}>{v.chapter}</div>
                  </div>
                  {active && <div style={{ width:6,height:6,borderRadius:'50%',background:'#6366f1',flexShrink:0 }}/>}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ background:'#f4f6fb', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#6366f1' }}>{mockVideos.length}</div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{t('Total Videos','إجمالي الفيديوهات')}</div>
            </div>
            <div style={{ background:'#f4f6fb', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#10b981' }}>{chapters.length}</div>
              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{t('Chapters','الفصول')}</div>
            </div>
          </div>
        </div>
      </div>
    </Page>
    
  );
};

/* ───────────────────── ROADMAP ───────────────────── */
const STATUS_ORDER: Chapter['status'][] = ['pending', 'in-progress', 'completed'];

export const Roadmap: React.FC = () => {
  const { language, t, currentUser } = useApp();
  const { data: mockChapters = [] } = useChapters();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Only Admin ("Mena") and Teacher ("Assistant") can edit chapter status.
  const canEdit = currentUser?.type === UserType.Admin || currentUser?.type === UserType.Teacher;

  const completed = mockChapters.filter(c=>c.status==='completed').length;
  const pct = mockChapters.length ? Math.round((completed/mockChapters.length)*100) : 0;

  const MENU_WIDTH = 170;

  const toggleMenu = (chId: string) => {
    if (openMenuId === chId) {
      setOpenMenuId(null);
      setMenuPos(null);
      return;
    }
    const btn = buttonRefs.current.get(chId);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const left = Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8);
      setMenuPos({ top: rect.bottom + 8, left: Math.max(8, left) });
    }
    setOpenMenuId(chId);
  };

  const closeMenu = () => { setOpenMenuId(null); setMenuPos(null); };

  const changeStatus = async (ch: Chapter, status: Chapter['status']) => {
    closeMenu();
    setSavingId(ch.id);
    try {
      await db.saveChapter({ id: ch.id, title: ch.title, description: ch.description, status });
      // No local state update needed — useChapters() is realtime, so this page
      // AND every student/parent page watching chapters updates automatically.
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Page>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes menuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <PageHeader title={t('Course Roadmap','خارطة طريق الدورة')} sub={t('Your IGCSE Statistics journey','رحلتك عبر أحياء IGCSE')} />

      {/* Overall progress */}
      <Card style={{ marginBottom:28, background:'linear-gradient(135deg,#6366f1,#4f46e5)', border:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', color:'#fff', marginBottom:10 }}>
          <span style={{ fontWeight:700, fontSize:16 }}>{t('Overall Progress','التقدم الكلي')}</span>
          <span style={{ fontWeight:800, fontSize:22 }}>{pct}%</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:99, height:8, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:'rgba(255,255,255,0.9)', borderRadius:99, transition:'width 0.3s ease' }} />
        </div>
        <p style={{ color:'rgba(255,255,255,0.75)', fontSize:13, margin:'10px 0 0' }}>
          {completed} {t('of','من')} {mockChapters.length} {t('chapters completed','فصول مكتملة')}
        </p>
      </Card>

      {/* Timeline */}
      <div style={{ position:'relative', paddingLeft:32 }}>
        <div style={{ position:'absolute', left:12, top:0, bottom:0, width:2, background:'#e5e7eb' }} />
        {mockChapters.map((ch,i)=>{
          const color = ch.status==='completed'?'#10b981':ch.status==='in-progress'?'#6366f1':'#d1d5db';
          const bv: Record<string,'green'|'indigo'|'gray'> = {completed:'green','in-progress':'indigo',pending:'gray'};
          const isOpen = openMenuId === ch.id;
          const isSaving = savingId === ch.id;
          return (
            <div key={ch.id} style={{ display:'flex', gap:20, marginBottom:20, animation:`fadeUp 0.4s ease ${i*0.1}s both` }}>
              <div style={{ position:'absolute', left:4, width:18, height:18, borderRadius:'50%', background:color, border:`3px solid ${ch.status==='in-progress'?'#eef2ff':'#fff'}`, boxShadow:`0 0 0 3px ${color}33`, flexShrink:0, marginTop:14 }} />
              <Card style={{ flex:1, overflow:'visible', position:'relative', borderLeft:ch.status==='in-progress'?'3px solid #6366f1':undefined, borderRadius:ch.status==='in-progress'?'0 12px 12px 0':undefined, boxShadow:ch.status==='in-progress'?'0 4px 14px rgba(99,102,241,0.12)':undefined }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:4 }}>{ch.title}</div>
                    <div style={{ fontSize:13, color:'#9ca3af' }}>{ch.description}</div>
                  </div>

                  <div>
                    <button
                      ref={el => { if (el) buttonRefs.current.set(ch.id, el); }}
                      onClick={() => canEdit && toggleMenu(ch.id)}
                      disabled={isSaving}
                      style={{
                        background: canEdit ? '#fff' : 'none',
                        border: canEdit ? '1px solid #d1d5db' : 'none',
                        borderRadius: 8,
                        padding: canEdit ? '4px 8px' : 0,
                        cursor: canEdit ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      <Badge variant={bv[ch.status]}>
                        {isSaving ? t('Saving…','جارٍ الحفظ…') : ch.status==='completed'?t('Completed','مكتمل'):ch.status==='in-progress'?t('In Progress','قيد التنفيذ'):t('Coming Soon','قريباً')}
                      </Badge>
                      {canEdit && !isSaving && (
                        <span style={{ fontSize:11, color:'#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.15s' }}>▾</span>
                      )}
                    </button>

                    {canEdit && isOpen && menuPos && createPortal(
                      <>
                        <div onClick={closeMenu} style={{ position:'fixed', inset:0, zIndex:9998 }} />
                        <div
                          style={{
                            position:'fixed', top:menuPos.top, left:menuPos.left, zIndex:9999,
                            background:'#fff', borderRadius:12,
                            boxShadow:'0 12px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
                            overflow:'hidden', minWidth:170, animation:'menuIn 0.15s ease',
                          }}
                        >
                          {STATUS_ORDER.map(s => (
                            <div
                              key={s}
                              onClick={() => changeStatus(ch, s)}
                              style={{
                                padding:'11px 16px', fontSize:13.5, cursor:'pointer',
                                background: s === ch.status ? '#eef2ff' : '#fff',
                                fontWeight: s === ch.status ? 700 : 500,
                                color: s === ch.status ? '#4f46e5' : '#111827',
                                display:'flex', alignItems:'center', justifyContent:'space-between',
                                borderBottom: s !== 'completed' ? '1px solid #f3f4f6' : 'none',
                              }}
                              onMouseEnter={e => { if (s !== ch.status) e.currentTarget.style.background = '#f9fafb'; }}
                              onMouseLeave={e => { if (s !== ch.status) e.currentTarget.style.background = '#fff'; }}
                            >
                              <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <span style={{ width:9, height:9, borderRadius:'50%', background: s==='completed'?'#10b981':s==='in-progress'?'#6366f1':'#d1d5db' }} />
                                {s==='completed'?t('Completed','مكتمل'):s==='in-progress'?t('In Progress','قيد التنفيذ'):t('Coming Soon','قريباً')}
                              </span>
                              {s === ch.status && <span style={{ color:'#4f46e5', fontSize:13 }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </Page>
  );
};

/* ───────────────────── ABOUT ───────────────────── */
export const AboutUs: React.FC = () => {
  const { t } = useApp();
  const features = [
    { en:'Video Lessons', ar:'دروس مرئية',    descEn:'Watch curated IGCSE lessons anytime',       descAr:'شاهد دروس IGCSE في أي وقت' },
    { en:'Progress',      ar:'تتبع التقدم',   descEn:'Monitor chapter-by-chapter progress',       descAr:'راقب تقدمك فصلاً بفصل' },
    { en:'Reports',       ar:'التقارير',       descEn:'Detailed performance & behavior reports',   descAr:'تقارير أداء وسلوك مفصّلة' },
  ];
  return (
    <Page>
      <PageHeader title={t("About Mena's Hub","عن مركز منى")} />
      <Card style={{ marginBottom:24 }}>
        <p style={{ color:'#374151', lineHeight:1.8, fontSize:15, margin:0 }}>
          {t("Mena's Hub is a dedicated IGCSE learning platform connecting students, assistants, and parents. It provides lesson videos, progress tracking, homework management, and detailed reports — all in one place, in Arabic and English.",
             "مركز منى هو منصة تعليمية متخصصة لـ IGCSE تربط الطلاب والمساعدين وأولياء الأمور. يقدم فيديوهات تعليمية وتتبع للتقدم وإدارة الواجبات وتقارير مفصّلة — كل ذلك في مكان واحد، بالعربية والإنجليزية.")}
        </p>
      </Card>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
        {features.map(f=>(
          <Card key={f.en}>
            <div style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:6 }}>{t(f.en,f.ar)}</div>
            <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.5 }}>{t(f.descEn,f.descAr)}</div>
          </Card>
        ))}
      </div>
    </Page>
  );
};

/* ───────────────────── CONTACT ───────────────────── */
export const ContactUs: React.FC = () => {
  const { t } = useApp();
  const [sent, setSent] = useState(false);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cMsg, setCMsg] = useState('');

  const handleSend = async () => {
    if (!cName.trim() || !cMsg.trim()) return;
    const text = encodeURIComponent(
      `📩 New message from Mena's Hub\n\nName: ${cName.trim()}\nEmail: ${cEmail.trim()}\n\nMessage:\n${cMsg.trim()}`
    );
    db.addMessage(cName.trim(), cEmail.trim(), cMsg.trim()).catch(() => {});
    window.open(`https://wa.me/201148841234?text=${text}`, '_blank');
    setSent(true);
  };

  return (
    <Page>
      <PageHeader title={t('Contact Us','تواصل معنا')} sub={t("We'd love to hear from you","يسعدنا سماعك")} />
      <div style={{ maxWidth:520 }}>
        {sent ? (
          <Card style={{ textAlign:'center', padding:'48px 24px' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#ecfdf5', border:'2px solid #6ee7b7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:'#065f46' }}>{t('Message sent!','تم إرسال الرسالة!')}</div>
            <div style={{ color:'#6b7280', fontSize:14, marginTop:6 }}>{t("We'll get back to you soon.","سنرد عليك قريباً.")}</div>
            <button onClick={() => { setSent(false); setCName(''); setCEmail(''); setCMsg(''); }}
              style={{ marginTop:18, padding:'8px 20px', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:9, color:'#4338ca', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>
              {t('Send another','إرسال رسالة أخرى')}
            </button>
          </Card>
        ) : (
          <Card>
            <Input label={t('Your name','اسمك')} placeholder={t('Enter your name','أدخل اسمك')} value={cName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCName(e.target.value)} />
            <Input label={t('Email','البريد الإلكتروني')} type="email" placeholder="you@example.com" value={cEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCEmail(e.target.value)} />
            <Textarea label={t('Message','الرسالة')} placeholder={t('Type your message…','اكتب رسالتك…')} value={cMsg} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCMsg(e.target.value)} />
            <div style={{ fontSize:12, color:'#9ca3af', marginBottom:14, display:'flex', alignItems:'center', gap:5 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#25d366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              {t('Sends directly via WhatsApp','يُرسل مباشرةً عبر واتساب')}
            </div>
            <Btn variant="primary" onClick={handleSend} style={{ width:'100%', justifyContent:'center' }}>
              {t('Send Message','إرسال الرسالة')}
            </Btn>
          </Card>
        )}
      </div>
    </Page>
  );
};