# Online sessions plan

This branch introduces the foundation for no-login online sessions using Supabase.

## Target flow

1. Host creates an online session and receives a short session code.
2. Players join with the code and a display name.
3. Each browser stores a private reconnect identity in localStorage.
4. If a player refreshes or loses connection, the app reads that identity and reconnects them to the same session, player row, phase and state.
5. Host starts the round only after confirming settings.
6. The online session follows the same phases as local mode: lobby, confirm, reveal, clues, vote, impostor guess and results.

## Why Supabase direct from frontend

The first implementation should not use Vercel API routes for normal gameplay. Vercel should host the React app, while Supabase handles shared state and realtime updates.

## Tables planned

- online_sessions
- online_players
- online_rounds
- online_votes

## Reconnect state

Each browser stores:

- session id
- session code
- player id
- player private key
- whether the browser is the host

This allows the UI to restore the user into the exact phase they were in after a refresh or short disconnect.
