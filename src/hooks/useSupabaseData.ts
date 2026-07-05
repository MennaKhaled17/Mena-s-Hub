import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type {
  User, Report, Homework, Chapter, Video, Announcement, Group,
} from '../types';

// ── Generic realtime hook ─────────────────────────────────────

function useTable<T>(
  table: string,
  transform?: (rows: any[]) => T[],
  deps: any[] = [],
  // Optional: fetch related tables and merge them into the already-transformed rows.
  postFetch?: (rows: T[]) => Promise<T[]>,
  // Extra tables whose realtime changes should also trigger a refetch
  // (e.g. report_comments should refresh the reports list).
  watchTables: string[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    const { data: rows, error: err } = await supabase.from(table).select('*');
    if (err) { setError(err.message); return; }
    let result = transform ? transform(rows ?? []) : ((rows as T[]) ?? []);
    if (postFetch) result = await postFetch(result);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const channels = [table, ...watchTables].map(t =>
      supabase
        .channel(`${t}-watch-${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: t }, fetch)
        .subscribe()
    );
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetch };
}

// ── Users / Profiles ─────────────────────────────────────────

function profileToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    type: row.role,
    status: row.status,
    parentOfStudentId: row.parent_of_student_id ?? undefined,
  };
}

export function useUsers() {
  return useTable<User>('profiles', rows => rows.map(profileToUser));
}

// ── Reports ──────────────────────────────────────────────────

function rowToReport(row: any): Report {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    date: row.date,
    type: row.type,
    content: row.content,
    voiceUrl: row.voice_url ?? undefined,
    behavior: row.behavior ?? undefined,
    attachments: [],
    comments: [],
  };
}

async function attachReportExtras(reports: Report[]): Promise<Report[]> {
  if (!reports.length) return reports;
  const ids = reports.map(r => r.id);

  const [{ data: comments }, { data: attachments }] = await Promise.all([
    supabase.from('report_comments').select('*').in('report_id', ids),
    supabase.from('report_attachments').select('*').in('report_id', ids),
  ]);

  const commentsByReport = new Map<string, any[]>();
  (comments ?? []).forEach(c => {
    const list = commentsByReport.get(c.report_id) ?? [];
    list.push({ id: c.id, authorId: c.author_id, content: c.content, date: c.created_at });
    commentsByReport.set(c.report_id, list);
  });

  const attachmentsByReport = new Map<string, any[]>();
  (attachments ?? []).forEach(a => {
    const list = attachmentsByReport.get(a.report_id) ?? [];
    list.push({ id: a.id, name: a.name, url: a.url, type: a.type, size: a.size });
    attachmentsByReport.set(a.report_id, list);
  });

  return reports.map(r => ({
    ...r,
    comments: commentsByReport.get(r.id) ?? [],
    attachments: attachmentsByReport.get(r.id) ?? [],
  }));
}

export function useReports() {
  return useTable<Report>(
    'reports',
    rows => rows.map(rowToReport),
    [],
    attachReportExtras,
    ['report_comments', 'report_attachments']
  );
}

// ── Homework ─────────────────────────────────────────────────

function rowToHomework(row: any): Homework {
  return {
    id: row.id,
    studentId: row.student_id,
    chapter: row.chapter ?? '',      // ← plain text now
    content: row.content,
    submissionDate: row.submission_date,
    type: row.type ?? 'homework',    // ← add this
    attachments: [],
    comment: undefined,
  };
}

async function attachHomeworkExtras(items: Homework[]): Promise<Homework[]> {
  if (!items.length) return items;
  const ids = items.map(h => h.id);

  const [{ data: comments }, { data: attachments }] = await Promise.all([
    supabase.from('homework_comments').select('*').in('homework_id', ids),
    supabase.from('homework_attachments').select('*').in('homework_id', ids),
  ]);

  // One feedback comment per homework — keep the most recent if more than one exists.
  const commentByHomework = new Map<string, any>();
  (comments ?? []).forEach(c => {
    const existing = commentByHomework.get(c.homework_id);
    if (!existing || new Date(c.created_at) > new Date(existing.date)) {
      commentByHomework.set(c.homework_id, {
        id: c.id,
        teacherId: c.teacher_id,
        content: c.content,
        date: c.created_at,
      });
    }
  });

  const attachmentsByHomework = new Map<string, any[]>();
  (attachments ?? []).forEach(a => {
    const list = attachmentsByHomework.get(a.homework_id) ?? [];
    list.push({ id: a.id, name: a.name, url: a.url, type: a.mime_type, size: a.size });
    attachmentsByHomework.set(a.homework_id, list);
  });

  return items.map(h => ({
    ...h,
    comment: commentByHomework.get(h.id) ?? undefined,
    attachments: attachmentsByHomework.get(h.id) ?? [],
  }));
}

export function useHomework() {
  return useTable<Homework>(
    'homework',
    rows => rows.map(rowToHomework),
    [],
    attachHomeworkExtras,
    ['homework_comments', 'homework_attachments']
  );
}

// ── Chapters ─────────────────────────────────────────────────

function rowToChapter(row: any): Chapter {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
  };
}

export function useChapters() {
  return useTable<Chapter>('chapters', rows => rows.map(rowToChapter));
}

// ── Videos ───────────────────────────────────────────────────

function rowToVideo(row: any): Video {
  return {
    id: row.id,
    title: row.title,
    titleAr: row.title_ar,
    chapter: row.chapter ?? '',
    driveId: row.drive_id,
  };
}

export function useVideos() {
  return useTable<Video>('videos', rows => rows.map(rowToVideo));
}

// ── Announcements ─────────────────────────────────────────────

function rowToAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    contentAr: row.content_ar,
    date: row.date,
    audience: row.audience,
  };
}

export function useAnnouncements() {
  return useTable<Announcement>('announcements', rows => rows.map(rowToAnnouncement));
}

// ── Groups ────────────────────────────────────────────────────

function rowToGroup(row: any): Group {
  return { id: row.id, name: row.name, color: row.color };
}

export function useGroups() {
  return useTable<Group>('groups', rows => rows.map(rowToGroup));
}

// ── Group Assignments ─────────────────────────────────────────

export interface GroupAssignment {
  id: string;
  studentId: string;
  groupId: string;
}

function rowToAssignment(row: any): GroupAssignment {
  return { id: row.id, studentId: row.student_id, groupId: row.group_id };
}

export function useGroupAssignments() {
  return useTable<GroupAssignment>('group_assignments', rows => rows.map(rowToAssignment));
}