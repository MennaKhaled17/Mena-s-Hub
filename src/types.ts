export enum UserType {
  Student = 'Student',
  Teacher = 'Teacher',
  Parent  = 'Parent',
  Admin   = 'Admin',
}

export const UserTypeLabel: Record<UserType, { en: string; ar: string }> = {
  [UserType.Admin]:   { en: 'Mena',      ar: 'مينا'    },
  [UserType.Teacher]: { en: 'Assistant', ar: 'مساعد'   },
  [UserType.Student]: { en: 'Student',   ar: 'طالب'    },
  [UserType.Parent]:  { en: 'Parent',    ar: 'ولي أمر' },
};

export type ProfileStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;            // == auth.users.id == the value used everywhere else as "studentId"
  name: string;
  type: UserType;
  email: string;
  status: ProfileStatus;
  parentOfStudentId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;       // object URL or base64 data URL
  type: string;      // MIME type
  size: number;      // bytes
}

export interface ReportComment {
  id: string;
  authorId: string;
  content: string;
  date: string;
}

export interface Report {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  type: 'text' | 'voice';
  content: string;
  voiceUrl?: string;       // object URL for voice note
  behavior?: 'excellent' | 'good' | 'needs-improvement';
  attachments?: Attachment[];
  comments?: ReportComment[];
}

export interface HomeworkAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Homework {
  id: string;
  studentId: string;
  chapter: string;
  content: string;
  submissionDate: string;
  type?: 'homework' | 'exam';        // ← add this
  attachments?: HomeworkAttachment[];
  comment?: { teacherId: string; type: 'text'; content: string };
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface Video {
  id: string;
  title: string;
  titleAr: string;
  chapter: string;
  driveId: string;
}

export interface Announcement {
  id: string;
  authorId: string;
  content: string;
  contentAr: string;
  date: string;
  audience: UserType[];
}

export type Language = 'en' | 'ar';

export interface Group {
  id: string;
  name: string;
  color: string;
}