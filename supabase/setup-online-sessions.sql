create extension if not exists pgcrypto;

create table if not exists online_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'lobby',
  host_key text not null,
  category text not null default 'Random',
  impostor_count integer not null default 1,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists online_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references online_sessions(id) on delete cascade,
  name text not null,
  player_key text not null,
  is_host boolean not null default false,
  order_index integer not null default 0,
  connected boolean not null default true,
  role text,
  can_see_word boolean not null default false,
  has_seen_role boolean not null default false,
  vote_target uuid,
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists online_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references online_sessions(id) on delete cascade,
  category text not null,
  word text not null,
  clue_round integer not null default 1,
  outcome text,
  impostor_guess text,
  created_at timestamptz not null default now()
);

create table if not exists online_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references online_sessions(id) on delete cascade,
  round_id uuid not null references online_rounds(id) on delete cascade,
  voter_player_id uuid not null references online_players(id) on delete cascade,
  target_player_id uuid not null references online_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(round_id, voter_player_id)
);

create index if not exists online_sessions_code_idx on online_sessions(code);
create index if not exists online_players_session_idx on online_players(session_id);
create index if not exists online_rounds_session_idx on online_rounds(session_id);
create index if not exists online_votes_round_idx on online_votes(round_id);
create index if not exists online_votes_session_idx on online_votes(session_id);

alter table online_sessions enable row level security;
alter table online_players enable row level security;
alter table online_rounds enable row level security;
alter table online_votes enable row level security;

-- MVP policies for no-login testing.
-- These intentionally allow anonymous read/write for room-code testing.
-- Harden later with RPC/Edge Functions before public release.
drop policy if exists "online_sessions_select" on online_sessions;
drop policy if exists "online_sessions_insert" on online_sessions;
drop policy if exists "online_sessions_update" on online_sessions;
drop policy if exists "online_sessions_delete" on online_sessions;
create policy "online_sessions_select" on online_sessions for select using (true);
create policy "online_sessions_insert" on online_sessions for insert with check (true);
create policy "online_sessions_update" on online_sessions for update using (true) with check (true);
create policy "online_sessions_delete" on online_sessions for delete using (true);

drop policy if exists "online_players_select" on online_players;
drop policy if exists "online_players_insert" on online_players;
drop policy if exists "online_players_update" on online_players;
drop policy if exists "online_players_delete" on online_players;
create policy "online_players_select" on online_players for select using (true);
create policy "online_players_insert" on online_players for insert with check (true);
create policy "online_players_update" on online_players for update using (true) with check (true);
create policy "online_players_delete" on online_players for delete using (true);

drop policy if exists "online_rounds_select" on online_rounds;
drop policy if exists "online_rounds_insert" on online_rounds;
drop policy if exists "online_rounds_update" on online_rounds;
drop policy if exists "online_rounds_delete" on online_rounds;
create policy "online_rounds_select" on online_rounds for select using (true);
create policy "online_rounds_insert" on online_rounds for insert with check (true);
create policy "online_rounds_update" on online_rounds for update using (true) with check (true);
create policy "online_rounds_delete" on online_rounds for delete using (true);

drop policy if exists "online_votes_select" on online_votes;
drop policy if exists "online_votes_insert" on online_votes;
drop policy if exists "online_votes_update" on online_votes;
drop policy if exists "online_votes_delete" on online_votes;
create policy "online_votes_select" on online_votes for select using (true);
create policy "online_votes_insert" on online_votes for insert with check (true);
create policy "online_votes_update" on online_votes for update using (true) with check (true);
create policy "online_votes_delete" on online_votes for delete using (true);

-- Enable realtime from Supabase dashboard after running this SQL:
-- Database > Replication > supabase_realtime > enable online_sessions, online_players, online_rounds, online_votes.
