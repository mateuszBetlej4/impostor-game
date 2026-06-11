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
