import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserType } from '../types';
import type { Chapter, Report, Homework, User } from '../types';
import { Page, PageHeader, Card, StatCard, Badge, Btn, Empty } from '../components/ui';
// @ts-ignore
import { useChapters, useReports, useHomework, useUsers } from '../hooks/useSupabaseData';

const statusBadge = (s: string, t: (a: string, b: string) => string): JSX.Element => ({
  completed:     <Badge variant="green">{t('Completed', 'مكتمل')}</Badge>,
  'in-progress': <Badge variant="indigo">{t('In Progress', 'قيد التنفيذ')}</Badge>,
  pending:       <Badge variant="gray">{t('Pending', 'قادم')}</Badge>,
}[s] ?? <Badge>{s}</Badge>);

export const Dashboard: React.FC = () => {
  const { currentUser, language, t } = useApp();
  const navigate = useNavigate();

  const { data: mockChapters = [] } = useChapters() as { data: Chapter[] };
  const { data: mockReports  = [] } = useReports()  as { data: Report[]  };
  const { data: mockHomework = [] } = useHomework()  as { data: Homework[] };
  const { data: mockUsers    = [] } = useUsers()     as { data: User[]    };

  if (!currentUser) return null;

  const myStudentId = currentUser.id;
  const myChildId   = currentUser.parentOfStudentId;

  const filteredReports = mockReports.filter((r: Report) =>
    currentUser.type === UserType.Student ? r.studentId === myStudentId :
    currentUser.type === UserType.Parent  ? r.studentId === myChildId   : true
  );

  const filteredHomework = mockHomework.filter((h: Homework) =>
    currentUser.type === UserType.Student ? h.studentId === myStudentId : true
  );

  const completed  = mockChapters.filter((c: Chapter) => c.status === 'completed').length;
  const inProgress = mockChapters.filter((c: Chapter) => c.status === 'in-progress').length;
  const pct        = mockChapters.length ? Math.round((completed / mockChapters.length) * 100) : 0;

  return (
    <Page>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .dash-row:hover{background:#fafafa!important;}`}</style>

      <PageHeader
        title={t('Dashboard', 'لوحة التحكم')}
        sub={t('Your learning overview', 'نظرة عامة على مسيرتك')}
        action={<Btn variant="primary" onClick={() => navigate('/videos')}>{t('Watch Lessons', 'شاهد الدروس')}</Btn>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard icon="" label={t('Chapters', 'الفصول')}        value={mockChapters.length}   color="#6366f1" />
        <StatCard icon="" label={t('Completed', 'مكتمل')}         value={completed}              color="#10b981" />
        <StatCard icon="" label={t('In Progress', 'قيد التنفيذ')} value={inProgress}             color="#f59e0b" />
        <StatCard icon="" label={t('Reports', 'التقارير')}         value={filteredReports.length} color="#8b5cf6" />
      </div>

      <Card style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease 0.2s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{t('Course Progress', 'تقدم الدورة')}</span>
          <span style={{ fontWeight: 700, color: '#10b981', fontSize: 15 }}>{pct}%</span>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#10b981)', borderRadius: 99, transition: 'width 1.2s cubic-bezier(.16,1,.3,1)' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          {[
            { label: t('Completed', 'مكتمل'), color: '#10b981', n: completed },
            { label: t('In Progress', 'قيد التنفيذ'), color: '#6366f1', n: inProgress },
            { label: t('Pending', 'قادم'), color: '#9ca3af', n: mockChapters.length - completed - inProgress },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>{s.label}: <strong style={{ color: '#374151' }}>{s.n}</strong></span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeUp 0.4s ease 0.3s both' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Chapters', 'الفصول')}</h3>
            <Btn size="sm" onClick={() => navigate('/roadmap')}>{t('Roadmap', 'خارطة الطريق')}</Btn>
          </div>
          {mockChapters.map((ch: Chapter) => (
            <div key={ch.id} className="dash-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{ch.title}</span>
              {statusBadge(ch.status, t)}
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{t('Recent Reports', 'آخر التقارير')}</h3>
            <Btn size="sm" onClick={() => navigate('/reports')}>→</Btn>
          </div>
          {filteredReports.length === 0
            ? <Empty icon="" text={t('No reports yet', 'لا توجد تقارير بعد')} />
            : filteredReports.slice(0, 3).map((r: Report) => {
                const student = mockUsers.find((u: User) => u.id === r.studentId);
                const bv: Record<string, 'green' | 'amber' | 'red'> = { excellent: 'green', good: 'amber', 'needs-improvement': 'red' };
                return (
                  <div key={r.id} style={{ padding: '11px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#6366f1' }}>{student?.name || t('Student', 'طالب')}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {r.behavior && <Badge variant={bv[r.behavior]}>{r.behavior === 'excellent' ? t('Excellent', 'ممتاز') : r.behavior === 'good' ? t('Good', 'جيد') : t('Needs Work', 'يحتاج تحسين')}</Badge>}
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>{r.date}</span>
                      </div>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{r.content}</p>
                  </div>
                );
              })
          }
        </Card>
      </div>
    </Page>
  );
};