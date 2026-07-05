  -- ============================================================================
  -- MENA'S HUB — Supabase database schema
  -- ----------------------------------------------------------------------------
  -- Run this whole file once in your Supabase project's SQL Editor
  -- (Dashboard -> SQL Editor -> New query -> paste -> Run).
  -- It is safe to re-run: every statement is idempotent.
  -- ============================================================================

  create extension if not exists pgcrypto;

  -- ============================================================================
  -- 1. TABLES
  -- ============================================================================

  -- One row per app user. id = the Supabase Auth user id (auth.users.id).
  -- A user's profile.id IS their "studentId" / "teacherId" / etc — every other
  -- table just references profiles(id) directly, no separate code needed.
  create table if not exists public.profiles (
    id                      uuid primary key references auth.users(id) on delete cascade,
    email                   text not null,
    name                    text not null,
    role                    text not null default 'pending'
                            check (role in ('admin','teacher','student','parent','pending')),
    status                  text not null default 'pending'
                            check (status in ('pending','approved','rejected')),
    requested_role          text check (requested_role in ('admin','teacher','student','parent')),
    parent_of_student_id    uuid references public.profiles(id) on delete set null,
    parent_of_student_email text,
    created_at              timestamptz not null default now()
  );

  create table if not exists public.groups (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    color      text not null default '#6366f1',
    created_at timestamptz not null default now()
  );

  create table if not exists public.group_assignments (
    student_id uuid primary key references public.profiles(id) on delete cascade,
    group_id   uuid not null references public.groups(id) on delete cascade,
    updated_at timestamptz not null default now()
  );

  create table if not exists public.parent_assignments (
    parent_id  uuid primary key references public.profiles(id) on delete cascade,
    student_id uuid not null references public.profiles(id) on delete cascade,
    updated_at timestamptz not null default now()
  );

  create table if not exists public.chapters (
    id          uuid primary key default gen_random_uuid(),
    title       text not null unique,
    description text not null default '',
    status      text not null default 'pending'
                check (status in ('completed','in-progress','pending')),
    sort_order  int not null default 0,
    created_at  timestamptz not null default now()
  );

  create table if not exists public.videos (
    id         uuid primary key default gen_random_uuid(),
    title      text not null,
    title_ar   text not null default '',
    chapter    text not null default '',
    drive_id   text not null unique,
    created_at timestamptz not null default now()
  );

  create table if not exists public.video_requests (
    id            uuid primary key default gen_random_uuid(),
    student_id    uuid not null references public.profiles(id) on delete cascade,
    video_id      uuid not null references public.videos(id) on delete cascade,
    status        text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
    requested_at  timestamptz not null default now(),
    unique (student_id, video_id)
  );

  create table if not exists public.reports (
    id         uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.profiles(id) on delete cascade,
    teacher_id uuid not null references public.profiles(id),
    date       date not null default current_date,
    type       text not null default 'text' check (type in ('text','voice')),
    content    text not null default '',
    voice_url  text,
    behavior   text check (behavior in ('excellent','good','needs-improvement')),
    created_at timestamptz not null default now()
  );

  create table if not exists public.report_comments (
    id         uuid primary key default gen_random_uuid(),
    report_id  uuid not null references public.reports(id) on delete cascade,
    author_id  uuid not null references public.profiles(id),
    content    text not null,
    created_at timestamptz not null default now()
  );

  create table if not exists public.report_attachments (
    id         uuid primary key default gen_random_uuid(),
    report_id  uuid not null references public.reports(id) on delete cascade,
    name       text not null,
    url        text not null,
    type       text,
    size       bigint,
    created_at timestamptz not null default now()
  );

  create table if not exists public.homework (
    id                 uuid primary key default gen_random_uuid(),
    student_id         uuid not null references public.profiles(id) on delete cascade,
    chapter            text not null default '',
    content            text not null default '',
    submission_date    date not null default current_date,
    comment_teacher_id uuid references public.profiles(id),
    comment_content    text,
    created_at         timestamptz not null default now()
  );

  create table if not exists public.homework_attachments (
    id           uuid primary key default gen_random_uuid(),
    homework_id  uuid not null references public.homework(id) on delete cascade,
    name         text not null,
    url          text not null,
    type         text,
    size         bigint,
    created_at   timestamptz not null default now()
  );

  create table if not exists public.announcements (
    id         uuid primary key default gen_random_uuid(),
    author_id  uuid references public.profiles(id),
    content    text not null,
    content_ar text not null default '',
    date       date not null default current_date,
    audience   text[] not null default '{}',
    created_at timestamptz not null default now()
  );

  create table if not exists public.messages (
    id      uuid primary key default gen_random_uuid(),
    name    text not null,
    email   text,
    message text not null,
    sent_at timestamptz not null default now(),
    read    boolean not null default false
  );

  -- ============================================================================
  -- 2. INDEXES
  -- ============================================================================
  create index if not exists idx_profiles_status            on public.profiles(status);
  create index if not exists idx_profiles_role               on public.profiles(role);
  create index if not exists idx_group_assignments_group     on public.group_assignments(group_id);
  create index if not exists idx_parent_assignments_student  on public.parent_assignments(student_id);
  create index if not exists idx_video_requests_student      on public.video_requests(student_id);
  create index if not exists idx_video_requests_video        on public.video_requests(video_id);
  create index if not exists idx_reports_student             on public.reports(student_id);
  create index if not exists idx_reports_teacher             on public.reports(teacher_id);
  create index if not exists idx_report_comments_report      on public.report_comments(report_id);
  create index if not exists idx_report_attachments_report   on public.report_attachments(report_id);
  create index if not exists idx_homework_student            on public.homework(student_id);
  create index if not exists idx_homework_attachments_hw     on public.homework_attachments(homework_id);

  -- ============================================================================
  -- 3. HELPER FUNCTIONS (security definer — safe to call from RLS policies
  --    without causing recursive-policy errors)
  -- ============================================================================

  create or replace function public.is_admin()
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'approved');
  $$;

  create or replace function public.is_staff()
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','teacher') and status = 'approved');
  $$;

  create or replace function public.is_approved()
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved');
  $$;

  create or replace function public.is_parent_of(sid uuid)
  returns boolean language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from public.parent_assignments
      where parent_id = auth.uid() and student_id = sid
    );
  $$;

  -- ============================================================================
  -- 4. TRIGGERS
  -- ============================================================================

  -- 4a. Auto-create a profile row whenever someone signs up via Supabase Auth.
  --     The very FIRST person to ever sign up becomes an approved Admin
  --     automatically (bootstraps "Mena" without a chicken/egg approval problem).
  --     Everyone after that starts out as role='pending' / status='pending'
  --     and needs an admin to approve them from the Pending Approvals tab.
  create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
  declare
    is_first boolean;
  begin
    select not exists (select 1 from public.profiles) into is_first;

    insert into public.profiles (id, email, name, role, status, requested_role, parent_of_student_email)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      case when is_first then 'admin' else 'pending' end,
      case when is_first then 'approved' else 'pending' end,
      coalesce(new.raw_user_meta_data->>'requestedRole', 'student'),
      new.raw_user_meta_data->>'parentOfStudentEmail'
    );
    return new;
  end;
  $$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

  -- 4b. Prevent non-admins from promoting themselves (role/status are only
  --     changeable by an admin, enforced server-side regardless of the UI).
  create or replace function public.protect_profile_fields()
  returns trigger language plpgsql security definer set search_path = public as $$
  begin
    if public.is_admin() then
      return new;
    end if;
    if new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.parent_of_student_id is distinct from old.parent_of_student_id then
      raise exception 'Only an admin can change role, status or parent_of_student_id';
    end if;
    return new;
  end;
  $$;

  drop trigger if exists protect_profile_fields_trg on public.profiles;
  create trigger protect_profile_fields_trg
    before update on public.profiles
    for each row execute function public.protect_profile_fields();

  -- ============================================================================
  -- 5. ROW LEVEL SECURITY
  -- ============================================================================

  alter table public.profiles            enable row level security;
  alter table public.groups              enable row level security;
  alter table public.group_assignments   enable row level security;
  alter table public.parent_assignments  enable row level security;
  alter table public.chapters            enable row level security;
  alter table public.videos              enable row level security;
  alter table public.video_requests      enable row level security;
  alter table public.reports             enable row level security;
  alter table public.report_comments     enable row level security;
  alter table public.report_attachments  enable row level security;
  alter table public.homework            enable row level security;
  alter table public.homework_attachments enable row level security;
  alter table public.announcements       enable row level security;
  alter table public.messages            enable row level security;

  -- ── profiles ────────────────────────────────────────────────────────────
  -- Everyone can always read their own row (so a pending user can see their
  -- own status); only approved users can see everyone else's profile.
  drop policy if exists "profiles_select_authenticated" on public.profiles;
  create policy "profiles_select_authenticated" on public.profiles
    for select to authenticated using (id = auth.uid() or public.is_approved());

  drop policy if exists "profiles_update_own_or_admin" on public.profiles;
  create policy "profiles_update_own_or_admin" on public.profiles
    for update to authenticated
    using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());

  drop policy if exists "profiles_delete_admin" on public.profiles;
  create policy "profiles_delete_admin" on public.profiles
    for delete to authenticated using (public.is_admin());

  -- ── groups ──────────────────────────────────────────────────────────────
  drop policy if exists "groups_select" on public.groups;
  create policy "groups_select" on public.groups for select to authenticated using (public.is_approved());
  drop policy if exists "groups_write" on public.groups;
  create policy "groups_write" on public.groups for all to authenticated
    using (public.is_staff()) with check (public.is_staff());

  -- ── group_assignments ──────────────────────────────────────────────────
  drop policy if exists "group_assignments_select" on public.group_assignments;
  create policy "group_assignments_select" on public.group_assignments for select to authenticated using (public.is_approved());
  drop policy if exists "group_assignments_write" on public.group_assignments;
  create policy "group_assignments_write" on public.group_assignments for all to authenticated
    using (public.is_staff()) with check (public.is_staff());

  -- ── parent_assignments ─────────────────────────────────────────────────
  drop policy if exists "parent_assignments_select" on public.parent_assignments;
  create policy "parent_assignments_select" on public.parent_assignments for select to authenticated
    using (public.is_staff() or (public.is_approved() and (parent_id = auth.uid() or student_id = auth.uid())));
  drop policy if exists "parent_assignments_write" on public.parent_assignments;
  create policy "parent_assignments_write" on public.parent_assignments for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

  -- ── chapters ───────────────────────────────────────────────────────────
  drop policy if exists "chapters_select" on public.chapters;
  create policy "chapters_select" on public.chapters for select to authenticated using (public.is_approved());
  drop policy if exists "chapters_write" on public.chapters;
  create policy "chapters_write" on public.chapters for all to authenticated
    using (public.is_staff()) with check (public.is_staff());

  -- ── videos ─────────────────────────────────────────────────────────────
  drop policy if exists "videos_select" on public.videos;
  create policy "videos_select" on public.videos for select to authenticated using (public.is_approved());
  drop policy if exists "videos_write" on public.videos;
  create policy "videos_write" on public.videos for all to authenticated
    using (public.is_staff()) with check (public.is_staff());

  -- ── video_requests ────────────────────────────────────────────────────
  drop policy if exists "video_requests_select" on public.video_requests;
  create policy "video_requests_select" on public.video_requests for select to authenticated
    using (public.is_staff() or (public.is_approved() and student_id = auth.uid()));
  drop policy if exists "video_requests_insert" on public.video_requests;
  create policy "video_requests_insert" on public.video_requests for insert to authenticated
    with check (public.is_staff() or (public.is_approved() and student_id = auth.uid()));
  drop policy if exists "video_requests_update" on public.video_requests;
  create policy "video_requests_update" on public.video_requests for update to authenticated
    using (public.is_staff()) with check (public.is_staff());
  drop policy if exists "video_requests_delete" on public.video_requests;
  create policy "video_requests_delete" on public.video_requests for delete to authenticated
    using (public.is_staff());

  -- ── reports ────────────────────────────────────────────────────────────
  drop policy if exists "reports_select" on public.reports;
  create policy "reports_select" on public.reports for select to authenticated
    using (public.is_staff() or (public.is_approved() and (student_id = auth.uid() or public.is_parent_of(student_id))));
  drop policy if exists "reports_insert" on public.reports;
  create policy "reports_insert" on public.reports for insert to authenticated
    with check (public.is_staff());
  drop policy if exists "reports_update" on public.reports;
  create policy "reports_update" on public.reports for update to authenticated
    using (public.is_admin() or teacher_id = auth.uid())
    with check (public.is_admin() or teacher_id = auth.uid());
  drop policy if exists "reports_delete" on public.reports;
  create policy "reports_delete" on public.reports for delete to authenticated
    using (public.is_admin() or teacher_id = auth.uid());

  -- ── report_comments ───────────────────────────────────────────────────
  drop policy if exists "report_comments_select" on public.report_comments;
  create policy "report_comments_select" on public.report_comments for select to authenticated
    using (exists (
      select 1 from public.reports r where r.id = report_id
      and (public.is_staff() or (public.is_approved() and (r.student_id = auth.uid() or public.is_parent_of(r.student_id))))
    ));
  drop policy if exists "report_comments_insert" on public.report_comments;
  create policy "report_comments_insert" on public.report_comments for insert to authenticated
    with check (
      author_id = auth.uid()
      and exists (
        select 1 from public.reports r where r.id = report_id
        and (public.is_staff() or (public.is_approved() and (r.student_id = auth.uid() or public.is_parent_of(r.student_id))))
      )
    );
  drop policy if exists "report_comments_delete" on public.report_comments;
  create policy "report_comments_delete" on public.report_comments for delete to authenticated
    using (public.is_admin());

  -- ── report_attachments ───────────────────────────────────────────────
  drop policy if exists "report_attachments_select" on public.report_attachments;
  create policy "report_attachments_select" on public.report_attachments for select to authenticated
    using (exists (
      select 1 from public.reports r where r.id = report_id
      and (public.is_staff() or (public.is_approved() and (r.student_id = auth.uid() or public.is_parent_of(r.student_id))))
    ));
  drop policy if exists "report_attachments_write" on public.report_attachments;
  create policy "report_attachments_write" on public.report_attachments for all to authenticated
    using (public.is_staff()) with check (public.is_staff());

  -- ── homework ──────────────────────────────────────────────────────────
  drop policy if exists "homework_select" on public.homework;
  create policy "homework_select" on public.homework for select to authenticated
    using (public.is_staff() or (public.is_approved() and (student_id = auth.uid() or public.is_parent_of(student_id))));
  drop policy if exists "homework_insert" on public.homework;
  create policy "homework_insert" on public.homework for insert to authenticated
    with check (public.is_staff() or (public.is_approved() and student_id = auth.uid()));
  drop policy if exists "homework_update" on public.homework;
  create policy "homework_update" on public.homework for update to authenticated
    using (public.is_staff() or (public.is_approved() and student_id = auth.uid()))
    with check (public.is_staff() or (public.is_approved() and student_id = auth.uid()));
  drop policy if exists "homework_delete" on public.homework;
  create policy "homework_delete" on public.homework for delete to authenticated
    using (public.is_staff() or (public.is_approved() and student_id = auth.uid()));

  -- ── homework_attachments ─────────────────────────────────────────────
  drop policy if exists "homework_attachments_select" on public.homework_attachments;
  create policy "homework_attachments_select" on public.homework_attachments for select to authenticated
    using (exists (
      select 1 from public.homework h where h.id = homework_id
      and (public.is_staff() or (public.is_approved() and (h.student_id = auth.uid() or public.is_parent_of(h.student_id))))
    ));
  drop policy if exists "homework_attachments_write" on public.homework_attachments;
  create policy "homework_attachments_write" on public.homework_attachments for all to authenticated
    using (exists (
      select 1 from public.homework h where h.id = homework_id
      and (public.is_staff() or (public.is_approved() and h.student_id = auth.uid()))
    ))
    with check (exists (
      select 1 from public.homework h where h.id = homework_id
      and (public.is_staff() or (public.is_approved() and h.student_id = auth.uid()))
    ));

  -- ── announcements ─────────────────────────────────────────────────────
  drop policy if exists "announcements_select" on public.announcements;
  create policy "announcements_select" on public.announcements for select to authenticated using (public.is_approved());
  drop policy if exists "announcements_write" on public.announcements;
  create policy "announcements_write" on public.announcements for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

  -- ── messages (public contact form) ──────────────────────────────────
  drop policy if exists "messages_insert_anyone" on public.messages;
  create policy "messages_insert_anyone" on public.messages
    for insert to anon, authenticated with check (true);
  drop policy if exists "messages_manage_admin" on public.messages;
  create policy "messages_manage_admin" on public.messages
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
  drop policy if exists "messages_select_admin" on public.messages;
  create policy "messages_select_admin" on public.messages
    for select to authenticated using (public.is_admin());

  -- ============================================================================
  -- 6. REALTIME — "make sure everything listens to the db"
  --    This publishes every table's INSERT/UPDATE/DELETE events so the app's
  --    `supabase.channel(...).on('postgres_changes', ...)` subscriptions
  --    (see src/services/db.ts) receive live updates automatically.
  -- ============================================================================

  do $$
  declare
    t text;
  begin
    for t in select unnest(array[
      'profiles','groups','group_assignments','parent_assignments',
      'chapters','videos','video_requests',
      'reports','report_comments','report_attachments',
      'homework','homework_attachments',
      'announcements','messages'
    ])
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end $$;

  -- ============================================================================
  -- 7. SEED DATA — chapters & videos from the original mock content.
  --    Edit/extend freely; safe to re-run thanks to the unique constraints.
  -- ============================================================================

  insert into public.chapters (title, description, status, sort_order) values
    ('Chapter 1 – Correlation & Coding',        '', 'completed',   1),
    ('Chapter 2 – Probability',                 '', 'in-progress',2),
    ('Chapter 3 – Statistics',                  '', 'pending',    3),
    ('Chapter 4 – Discrete Random Variable',    '', 'pending',    4),
    ('Chapter 5 – Normal Distribution',         '', 'pending',    5)
  on conflict (title) do nothing;

  insert into public.videos (title, title_ar, chapter, drive_id) values
    ('Correlation',                                            'Correlation',                                  'Chapter 1', '1DxvKbXOqksqKWe_z9zFaU9JgW5k8LfY-'),
    ('Correlation & Coding',                                   'Correlation & Coding',                         'Chapter 1', '17kst8-nSQ52vRIi66YmHEW4Pyugx_zQs'),
    ('Probability Tree Diagram',                               'Probability Tree Diagram',                     'Chapter 2', '1MsGZozL8rI7N1cgxvoqi-RNEC0P15u3B'),
    ('Probability Venn Diagram & Notation',                    'Venn Diagram & Notation',                      'Chapter 2', '1152R0j-c5SBe9ZUPGm1ROUpuaGpJJaIo'),
    ('Statistics Box Plot & Stem & Leaf',                      'Statistics Box Plot & Stem & Leaf',             'Chapter 3', '1FSQDfmE-PBCIDhU5_Idzn9mlXjcOEqj6'),
    ('Statistics Continuous Data',                             'Statistics Continuous Data',                    'Chapter 3', '1iKg6oh5JUs8U0GceZTlyLO8so_admLki'),
    ('Statistics Histogram',                                   'Statistics Histogram',                          'Chapter 3', '10z4xhMMDJpgdR6FBiJvtBLuZR_jwzjuS'),
    ('Discrete Random Variable',                               'Discrete Random Variable',                      'Chapter 4', '1Vjdl4gUwU56VAiM2y4l72meXRT57EiqH'),
    ('Discrete Random Variable (Tricky)',                      'Discrete Random Variable (Tricky)',             'Chapter 4', '1AMsShYRejBoS9bPHt0GoWtHMTtnrh2xc'),
    ('Discrete Random Variable (Level El Wash)',               'Discrete Random Variable (Level El Wash)',      'Chapter 4', '1JlwsaUutQ1Mq41FMHQ_BXNOsaeK6aqmv'),
    ('Normal Distribution (Basics)',                           'Normal Distribution (Basics)',                  'Chapter 5', '1xPejAxJfp_GjQlcKFMYDgLKO-F9fkt0d'),
    ('Normal Distribution (Simultaneous & Given That)',        'Normal Distribution (Simultaneous & Given That)','Chapter 5', '132fLcy_u3HzwZgCwLK9HfdfGrKEpdVw9')
  on conflict (drive_id) do nothing;

  insert into public.announcements (content, content_ar, date, audience)
  select
    'Welcome to Mena''s Hub! All lesson videos are now available.',
    'مرحباً بكم في مركز منى! جميع فيديوهات الدروس متاحة الآن.',
    current_date,
    array['Student','Parent','Teacher']
  where not exists (select 1 from public.announcements);

  -- ============================================================================
  -- Done. Next steps (see README_SUPABASE.md):
  --   1. Get your Project URL + anon key from Project Settings -> API.
  --   2. Put them in .env as VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
  --   3. Sign up through the app once — that first account becomes Admin.
  -- ============================================================================