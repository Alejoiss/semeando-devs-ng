create table public.xp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_xp integer not null default 0
);

create table public.xp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamp with time zone default now()
);

create table public.xp_week (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  week integer not null,
  xp_amount integer not null default 0,
  unique(user_id, year, week)
);

create table public.xp_month (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null,
  month integer not null,
  xp_amount integer not null default 0,
  unique(user_id, year, month)
);

alter table public.xp enable row level security;
alter table public.xp_log enable row level security;
alter table public.xp_week enable row level security;
alter table public.xp_month enable row level security;

create policy "Users can read own xp." on public.xp for select using (auth.uid() = user_id);
create policy "Users can read own xp log." on public.xp_log for select using (auth.uid() = user_id);
create policy "Users can read own xp week." on public.xp_week for select using (auth.uid() = user_id);
create policy "Users can read own xp month." on public.xp_month for select using (auth.uid() = user_id);
