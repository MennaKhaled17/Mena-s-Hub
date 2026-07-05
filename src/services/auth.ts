import { supabase } from './supabase';
import type { User } from '../types';
import { UserType } from '../types';

export type LoginResult = true | string;

// ── Get current session user ──────────────────────────────────
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return fetchProfile(session.user.id);
}

// ── Listen for auth changes ───────────────────────────────────
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = await fetchProfile(session.user.id);
      callback(user);
    } else {
      callback(null);
    }
  });
  return () => subscription.unsubscribe();
}

// ── Sign up ───────────────────────────────────────────────────
export async function register(
  email: string,
  password: string,
  name: string,
  requestedRole: UserType = UserType.Student,
  parentOfStudentEmail?: string,
): Promise<LoginResult> {
  // Pass everything as auth metadata — the `handle_new_user` trigger reads
  // this and creates the profile row itself (role='pending', status='pending')
  // in the same transaction. We deliberately do NOT follow up with a manual
  // update to `profiles` here: role/status can only be changed by an admin
  // (enforced by the protect_profile_fields trigger), so an update attempt
  // from a fresh signup would be rejected anyway.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        requestedRole,
        parentOfStudentEmail,
      },
    },
  });

  if (error) return error.message;
  if (!data.user) return 'Signup failed — no user returned.';

  return true;
}

// ── Sign in ───────────────────────────────────────────────────
export async function login(
  email: string,
  password: string,
  name?: string,
  requestedRole: UserType = UserType.Student,
  parentOfStudentEmail?: string
): Promise<LoginResult> {
  // If name provided → registration flow
  if (name) {
    return register(email, password, name, requestedRole, parentOfStudentEmail);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return error.message;
  return true;
}

// ── Sign out ──────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Fetch full profile from DB ────────────────────────────────
async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    type: data.role as UserType,
    status: data.status,
    parentOfStudentId: data.parent_of_student_id ?? undefined,
  };
}