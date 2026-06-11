# Supabase setup for online sessions

This folder will contain the database setup for no-login online sessions.

Planned tables:

## online_sessions

Stores one room/session.

Fields:

- id
- code
- status
- host_key
- category
- impostor_count
- settings
- created_at
- last_active_at

## online_players

Stores players in a session and supports reconnect.

Fields:

- id
- session_id
- name
- player_key
- is_host
- order_index
- connected
- role
- can_see_word
- has_seen_role
- vote_target
- score
- joined_at
- last_seen_at

## online_rounds

Stores the active round.

Fields:

- id
- session_id
- category
- word
- clue_round
- outcome
- impostor_guess
- created_at

## online_votes

Stores votes per round.

Fields:

- id
- session_id
- round_id
- voter_player_id
- target_player_id
- created_at

## Reconnect

The app stores session id, session code, player id, player key and host key in browser localStorage. On refresh or short connection loss, the app will use those values to reload the session and return the player to the correct state.
