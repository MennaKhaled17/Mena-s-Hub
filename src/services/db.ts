import { supabase } from './supabase';
import { UserType } from '../types';

// ── Types ────────────────────────────────────────────────────

export interface Profile {
id: string;
email: string;
name: string;
role: UserType;
status: 'pending' | 'approved' | 'rejected';
parent_of_student_id?: string;
created_at?: string;
}

export interface VideoRequest {
id: string;
studentId: string;   // camelCase alias used in AppContext
videoId: string;
status: 'pending' | 'approved' | 'rejected';
}

// raw DB row shape (snake_case)
interface VideoRequestRow {
id: string;
student_id: string;
video_id: string;
status: 'pending' | 'approved' | 'rejected';
}

function toVideoRequest(row: VideoRequestRow): VideoRequest {
return { id: row.id, studentId: row.student_id, videoId: row.video_id, status: row.status };
}

// ── Profiles ─────────────────────────────────────────────────

export function subscribePendingUsers(cb: (users: Profile[]) => void): () => void {
supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending')
    .then(({ data }) => cb((data as Profile[]) ?? []));

const channel = supabase
    .channel('pending-users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
    supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .then(({ data }) => cb((data as Profile[]) ?? []));
    })
    .subscribe();

return () => { supabase.removeChannel(channel); };
}

export async function approveUser(
id: string,
role: UserType,
parentOfStudentEmail?: string
): Promise<void> {
let parent_of_student_id: string | undefined;

if (parentOfStudentEmail) {
    const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', parentOfStudentEmail)
    .single();
    parent_of_student_id = data?.id;
}

await supabase
    .from('profiles')
    .update({ role, status: 'approved', ...(parent_of_student_id ? { parent_of_student_id } : {}) })
    .eq('id', id);
}

export async function rejectUser(id: string): Promise<void> {
await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
}

// Permanently removes a user's profile (and, via cascading foreign keys,
// their group assignments, video requests, reports, and homework).
// Note: this does NOT delete their Supabase Auth account — the anon key
// used by the browser can't do that. Their login will simply stop working
// because the app can no longer find a profile for them (every RLS policy
// checks the profiles table). To fully remove the auth account too, delete
// it from Supabase Dashboard → Authentication → Users, or call
// `supabase.auth.admin.deleteUser(id)` from a server-side function that
// holds the service role key.
export async function deleteUser(id: string): Promise<void> {
// .select() after .delete() makes Postgres return the deleted rows.
// Without it, an RLS policy that blocks the delete looks IDENTICAL to a
// successful delete — Postgres just matches 0 rows and reports no error.
// Checking the returned rows is what lets us tell the two apart.
const { data, error } = await supabase.from('profiles').delete().eq('id', id).select('id');
if (error) throw error;
if (!data || data.length === 0) {
  throw new Error(
    'Delete did not remove any row. This usually means either the row no ' +
    'longer exists, or a database rule (row-level security / a foreign key ' +
    'reference from another table) is blocking it.'
  );
}
}

// ── Video Requests ────────────────────────────────────────────

export function subscribeVideoRequests(cb: (reqs: VideoRequest[]) => void): () => void {
supabase
    .from('video_requests')
    .select('*')
    .then(({ data }) => cb(((data as VideoRequestRow[]) ?? []).map(toVideoRequest)));

const channel = supabase
    .channel('video-requests')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'video_requests' }, () => {
    supabase
        .from('video_requests')
        .select('*')
        .then(({ data }) => cb(((data as VideoRequestRow[]) ?? []).map(toVideoRequest)));
    })
    .subscribe();

return () => { supabase.removeChannel(channel); };
}

export async function requestVideoAccess(studentId: string, videoId: string): Promise<void> {
await supabase
    .from('video_requests')
    .insert({ student_id: studentId, video_id: videoId, status: 'pending' });
}

export async function setVideoRequestStatus(
id: string,
status: 'approved' | 'rejected'
): Promise<void> {
await supabase.from('video_requests').update({ status }).eq('id', id);
}

export async function addVideo(v: { title: string; titleAr: string; chapter: string; driveId: string }) {
await supabase.from('videos').insert({
    title: v.title, title_ar: v.titleAr, chapter: v.chapter || '', drive_id: v.driveId,
});
}

export async function deleteVideo(id: string) {
await supabase.from('videos').delete().eq('id', id);
}

export async function saveChapter(ch: { id?: string; title: string; description: string; status: string }) {
if (ch.id) {
    await supabase.from('chapters').update({ title: ch.title, description: ch.description, status: ch.status }).eq('id', ch.id);
} else {
    await supabase.from('chapters').insert({ title: ch.title, description: ch.description, status: ch.status });
}
}

export async function deleteChapter(id: string) {
await supabase.from('chapters').delete().eq('id', id);
}
// ── Groups ────────────────────────────────────────────────────

export async function saveGroup(group: { id: string; name: string; color: string }): Promise<void> {
  await supabase.from('groups').upsert(group);
}

export async function deleteGroup(id: string): Promise<void> {
  await supabase.from('groups').delete().eq('id', id);
}

export async function setGroupAssignment(studentId: string, groupId: string): Promise<void> {
  await supabase
    .from('group_assignments')
    .upsert({ student_id: studentId, group_id: groupId });
}

export async function removeGroupAssignment(studentId: string): Promise<void> {
  await supabase.from('group_assignments').delete().eq('student_id', studentId);
}

// ── Reports ───────────────────────────────────────────────────

export interface NewReport {
  studentId: string;
  teacherId: string;
  date: string;
  type: 'text' | 'voice';
  content: string;
  behavior?: 'excellent' | 'good' | 'needs-improvement';
  attachments?: { id: string; name: string; url: string; type: string; size: number }[];
  voiceUrl?: string;
}

export async function createReport(r: NewReport): Promise<void> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      student_id: r.studentId,
      teacher_id: r.teacherId,
      date: r.date,
      type: r.type,
      content: r.content,
      behavior: r.behavior ?? null,
      voice_url: r.voiceUrl ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  if (r.attachments?.length) {
    await addReportAttachments(data.id, r.attachments);
  }
}

export async function updateReport(
  id: string,
  fields: { content?: string; behavior?: string; voiceUrl?: string; type?: 'text' | 'voice' }
): Promise<void> {
  await supabase
    .from('reports')
    .update({
      ...(fields.content !== undefined ? { content: fields.content } : {}),
      ...(fields.behavior !== undefined ? { behavior: fields.behavior } : {}),
      ...(fields.voiceUrl !== undefined ? { voice_url: fields.voiceUrl } : {}),
      ...(fields.type !== undefined ? { type: fields.type } : {}),
    })
    .eq('id', id);
}

export async function deleteReport(id: string): Promise<void> {
  await supabase.from('reports').delete().eq('id', id);
}

export async function addReportAttachments(
  reportId: string,
  attachments: { name: string; url: string; type: string; size: number }[]
): Promise<void> {
  await supabase.from('report_attachments').insert(
    attachments.map(a => ({
      report_id: reportId,
      name: a.name,
      url: a.url,
      type: a.type,
      size: a.size,
    }))
  );
}

export async function addReportComment(reportId: string, authorId: string, content: string): Promise<void> {
  const { data, error } = await supabase
    .from('report_comments')
    .insert({ report_id: reportId, author_id: authorId, content })
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      'Comment was not added. This usually means a database rule ' +
      '(row-level security) is blocking INSERT on report_comments.'
    );
  }
}

export async function updateReportComment(commentId: string, content: string): Promise<void> {
  const { data, error } = await supabase
    .from('report_comments')
    .update({ content })
    .eq('id', commentId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      'Comment was not updated. This usually means a database rule ' +
      '(row-level security) is blocking UPDATE on report_comments.'
    );
  }
}

export async function deleteReportComment(commentId: string): Promise<void> {
  await supabase.from('report_comments').delete().eq('id', commentId);
}

// ── Homework ──────────────────────────────────────────────────

export interface NewHomework {
  studentId: string;
  chapter: string;
  content: string;
  submissionDate: string;
  attachments?: { id: string; name: string; url: string; type: string; size: number }[];
}
export async function createHomework(hw: {
  studentId: string;
  chapter: string;
  content: string;
  type?: string;
  submissionDate: string;
  attachments?: any[];
}): Promise<void> {
  const { data, error } = await supabase
    .from('homework')
    .insert({
      student_id: hw.studentId,
      chapter: hw.chapter,          // plain text, not chapter_id
      content: hw.content,
      type: hw.type ?? 'homework',
      submission_date: hw.submissionDate,
    })
    .select('id')
    .single();

  if (error) throw error;

  if (hw.attachments && hw.attachments.length > 0) {
    await supabase.from('homework_attachments').insert(
      hw.attachments.map(a => ({
        homework_id: data.id,
        name: a.name,
        url: a.url,
        mime_type: a.type,
        size: a.size,
      }))
    );
  }
}

export async function deleteHomework(id: string): Promise<void> {
  const { data, error } = await supabase.from('homework').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      'Delete did not remove any row. This usually means either the ' +
      'submission no longer exists, or a database rule (row-level security) ' +
      'is blocking it — check the DELETE policy on the homework table.'
    );
  }
}

// Adds feedback on a homework submission. Since a homework can only ever
// carry one piece of feedback, this now upserts: if a comment already
// exists for this homework, it's updated in place (so teachers can revise
// feedback after the fact) instead of inserting a second, conflicting row.
//
// Uses .select() after write so a blocked write (e.g. an RLS policy that
// allows INSERT but not UPDATE on homework_comments) throws instead of
// silently doing nothing — see the note on deleteUser() above for why this
// check is necessary.
export async function addHomeworkComment(
  homeworkId: string,
  teacherId: string,
  content: string
): Promise<void> {
  const { data: existing, error: findErr } = await supabase
    .from('homework_comments')
    .select('id')
    .eq('homework_id', homeworkId)
    .maybeSingle();

  if (findErr) throw findErr;

  if (existing) {
    const { data, error } = await supabase
      .from('homework_comments')
      .update({ teacher_id: teacherId, content })
      .eq('id', existing.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(
        'Feedback was not updated. This usually means a database rule ' +
        '(row-level security) allows adding feedback but not editing it — ' +
        'check the UPDATE policy on homework_comments.'
      );
    }
  } else {
    const { data, error } = await supabase
      .from('homework_comments')
      .insert({ homework_id: homeworkId, teacher_id: teacherId, content })
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(
        'Feedback was not saved. This usually means a database rule ' +
        '(row-level security) is blocking INSERT on homework_comments.'
      );
    }
  }
}
// ── Contact messages ──────────────────────────────────────────

export async function addMessage(name: string, email: string, message: string): Promise<void> {
  await supabase.from('messages').insert({ name, email: email || null, message });
}