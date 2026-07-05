import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useUsers, useGroups, useGroupAssignments } from '../hooks/useSupabaseData';
import * as db from '../services/db';
import { UserType } from '../types';
import { Page, PageHeader, Card, Badge } from '../components/ui';
const PALETTE = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b',
];

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export const GroupsPage: React.FC = () => {
  const { currentUser, t } = useApp();

  const canEdit =
    currentUser?.type === UserType.Admin ||
    currentUser?.type === UserType.Teacher;

  const { data: groups = [] } = useGroups();
  const { data: assignments = [] } = useGroupAssignments();
  const { data: mockUsers = [] } = useUsers();

  // New group form
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);
  const [showForm, setShowForm] = useState(false);

  // Rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

const students = mockUsers.filter((u: typeof mockUsers[0]) => u.type === UserType.Student);

  // `assignments` from useGroupAssignments() is an array of { id, studentId, groupId }
  // rows, not a map — build a studentId → groupId lookup for quick access below.
  const assignmentByStudent = Object.fromEntries(assignments.map(a => [a.studentId, a.groupId]));

  const addGroup = async () => {
    if (!newName.trim()) return;
    await db.saveGroup({ id: crypto.randomUUID(), name: newName.trim(), color: newColor });
    setNewName('');
    setNewColor(PALETTE[groups.length % PALETTE.length]);
    setShowForm(false);
  };

  const deleteGroup = async (id: string) => {
    if (!window.confirm(t('Delete this group?', 'حذف هذه المجموعة؟'))) return;
    await db.deleteGroup(id); // group_assignments rows cascade-delete in the DB
  };

  const saveRename = async (id: string) => {
    if (!editName.trim()) return;
    const g = groups.find(g => g.id === id);
    if (!g) return;
    await db.saveGroup({ ...g, name: editName.trim() });
    setEditingId(null);
  };

  const assignStudent = async (studentId: string, groupId: string) => {
    if (groupId === '') await db.removeGroupAssignment(studentId);
    else await db.setGroupAssignment(studentId, groupId);
  };

  const groupColor = (groupId: string) =>
    groups.find(g => g.id === groupId)?.color ?? '#9ca3af';

  const groupName = (groupId: string) =>
    groups.find(g => g.id === groupId)?.name ?? '';

  if (!canEdit) {
    return (
      <Page>
        <PageHeader title={t('Groups', 'المجموعات')} />
        <Card style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
          {t('You do not have permission to view this page.', 'ليس لديك صلاحية لعرض هذه الصفحة.')}
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .grp-row:hover{background:#f8fafc!important;}
        .del-btn:hover{background:#fef2f2!important;color:#dc2626!important;}
        .edit-btn:hover{background:#eef2ff!important;color:#4338ca!important;}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <PageHeader
          title={t('Student Groups', 'مجموعات الطلاب')}
          sub={t('Create groups and assign students', 'أنشئ مجموعات وعيّن الطلاب')}
        />
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ display:'flex', alignItems:'center', gap:6, background:'#6366f1', border:'none', borderRadius:10, padding:'9px 16px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            <IconPlus /> {t('New Group', 'مجموعة جديدة')}
          </button>
        )}
      </div>

      {/* New group form */}
      {showForm && (
        <Card style={{ marginBottom:20, border:'2px dashed #6366f1', background:'#fafbff', animation:'fadeUp 0.2s ease' }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#6366f1', marginBottom:14 }}>
            {t('Create New Group', 'إنشاء مجموعة جديدة')}
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:180 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
                {t('Group Name', 'اسم المجموعة')}
              </label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGroup()}
                placeholder={t('e.g. Private, School, Online…', 'مثال: خاص، مدرسة، أونلاين…')}
                style={{ width:'100%', boxSizing:'border-box' as const, padding:'9px 12px', border:'1.5px solid #c7d2fe', borderRadius:9, fontSize:13, fontFamily:'inherit', color:'#111827', outline:'none' }}
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#374151', marginBottom:5 }}>
                {t('Color', 'اللون')}
              </label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setNewColor(c)}
                    style={{ width:26, height:26, borderRadius:'50%', background:c, border:`3px solid ${newColor===c ? '#111827' : 'transparent'}`, cursor:'pointer', padding:0, transition:'border 0.15s' }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button onClick={addGroup}
              style={{ background:'#6366f1', border:'none', borderRadius:9, padding:'9px 20px', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              {t('Create', 'إنشاء')}
            </button>
            <button onClick={() => { setShowForm(false); setNewName(''); }}
              style={{ background:'#f4f6fb', border:'1.5px solid #e5e7eb', borderRadius:9, padding:'9px 16px', color:'#6b7280', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              {t('Cancel', 'إلغاء')}
            </button>
          </div>
        </Card>
      )}

      {/* Groups overview */}
      {groups.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:28 }}>
          {groups.map(g => {
            const count = students.filter(s => assignmentByStudent[s.id] === g.id).length;
            return (
              <Card key={g.id} style={{ borderLeft:`4px solid ${g.color}`, animation:'fadeUp 0.3s ease' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  {editingId === g.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter') saveRename(g.id); if (e.key==='Escape') setEditingId(null); }}
                      autoFocus
                      style={{ flex:1, padding:'5px 8px', border:`1.5px solid ${g.color}`, borderRadius:7, fontSize:13, fontFamily:'inherit', color:'#111827', outline:'none' }}
                    />
                  ) : (
                    <div style={{ fontWeight:700, fontSize:14, color:'#111827', flex:1 }}>{g.name}</div>
                  )}
                  <div style={{ display:'flex', gap:4 }}>
                    {editingId === g.id ? (
                      <>
                        <button onClick={() => saveRename(g.id)}
                          style={{ background:'#ecfdf5', border:'none', borderRadius:6, padding:'4px 8px', color:'#10b981', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                          ✓
                        </button>
                        <button onClick={() => setEditingId(null)}
                          style={{ background:'#f4f6fb', border:'none', borderRadius:6, padding:'4px 8px', color:'#9ca3af', fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="edit-btn" onClick={() => { setEditingId(g.id); setEditName(g.name); }}
                          style={{ background:'#f4f6fb', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 7px', color:'#6b7280', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s' }}>
                          <IconEdit />
                        </button>
                        <button className="del-btn" onClick={() => deleteGroup(g.id)}
                          style={{ background:'#f4f6fb', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 7px', color:'#9ca3af', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s' }}>
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ fontSize:12, color:'#9ca3af', marginTop:6 }}>
                  {count} {t('student(s)', 'طالب/طلاب')}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Students assignment table */}
      <Card>
        <div style={{ fontWeight:700, fontSize:15, color:'#111827', marginBottom:16 }}>
          {t('Assign Students to Groups', 'تعيين الطلاب للمجموعات')}
        </div>

        {students.length === 0 ? (
          <div style={{ color:'#9ca3af', fontSize:13 }}>{t('No students found.', 'لا يوجد طلاب.')}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 180px', gap:12, padding:'8px 14px', background:'#f8fafc', borderRadius:8, marginBottom:4 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5 }}>{t('Student', 'الطالب')}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5 }}>{t('Current Group', 'المجموعة الحالية')}</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5 }}>{t('Assign', 'تعيين')}</div>
            </div>

            {students.map((s, i) => {
              const sid = s.id;
              const currentGroupId = assignmentByStudent[sid] ?? '';
              return (
                <div key={s.id} className="grp-row"
                  style={{ display:'grid', gridTemplateColumns:'1fr 1fr 180px', gap:12, padding:'11px 14px', borderRadius:9, background:'#fff', transition:'background 0.15s', animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                  {/* Name */}
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, color:'#6366f1', flexShrink:0 }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:'#111827' }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{sid}</div>
                    </div>
                  </div>

                  {/* Current group badge */}
                  <div style={{ display:'flex', alignItems:'center' }}>
                    {currentGroupId ? (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, background:`${groupColor(currentGroupId)}18`, border:`1.5px solid ${groupColor(currentGroupId)}44`, fontSize:12, fontWeight:700, color:groupColor(currentGroupId) }}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:groupColor(currentGroupId), flexShrink:0 }} />
                        {groupName(currentGroupId)}
                      </span>
                    ) : (
                      <span style={{ fontSize:12, color:'#d1d5db', fontStyle:'italic' }}>{t('Unassigned', 'غير مُعيَّن')}</span>
                    )}
                  </div>

                  {/* Dropdown to assign */}
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <select
                      value={currentGroupId}
                      onChange={e => assignStudent(sid, e.target.value)}
                      style={{ width:'100%', padding:'7px 10px', border:'1.5px solid #e5e7eb', borderRadius:8, fontSize:12, fontFamily:'inherit', color:'#374151', background:'#fff', outline:'none', cursor:'pointer' }}>
                      <option value="">{t('— No group —', '— بلا مجموعة —')}</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {groups.length === 0 && (
          <div style={{ marginTop:14, padding:'14px 16px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, fontSize:13, color:'#92400e' }}>
            💡 {t('Create a group first using the button above.', 'أنشئ مجموعة أولاً باستخدام الزر أعلاه.')}
          </div>
        )}
      </Card>
    </Page>
  );
};