-- Allow one vote per player per phase so Hot Seat revotes do not conflict with initial votes.

alter table public.online_votes
  drop constraint if exists online_votes_round_id_voter_player_id_key;

alter table public.online_votes
  add constraint online_votes_round_id_vote_phase_voter_player_id_key
  unique (round_id, vote_phase, voter_player_id);

alter table public.online_skip_votes
  drop constraint if exists online_skip_votes_round_id_voter_player_id_key;

alter table public.online_skip_votes
  add constraint online_skip_votes_round_id_vote_phase_voter_player_id_key
  unique (round_id, vote_phase, voter_player_id);
