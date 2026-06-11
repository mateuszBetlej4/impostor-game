# Online sessions testing pass

## 1. Create Supabase project

1. Create a new Supabase project.
2. Open SQL Editor.
3. Paste and run `supabase/setup-online-sessions.sql`.
4. Go to Database > Replication > `supabase_realtime`.
5. Enable realtime for:
   - `online_sessions`
   - `online_players`
   - `online_rounds`
   - `online_votes`

## 2. Add environment variables

Local testing:

```bash
cp .env.example .env.local
```

Fill:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Vercel testing:

Add the same variables in:

Project Settings > Environment Variables

Then redeploy the preview branch.

## 3. Local smoke test

```bash
npm install
npm run build
npm run dev
```

Expected:

- Online beta no longer shows the Supabase configuration warning.
- Create Code creates a six-digit session code.
- Join Session works in another browser/incognito window.
- Lobby updates when another player joins.
- Refresh browser and reconnect using saved session.

## 4. Game flow test

Use 3 browser windows or 3 phones:

1. Host creates session.
2. Two players join using the code.
3. Host starts online round.
4. Each player taps to reveal.
5. Host moves to Clues.
6. Host moves to Vote.
7. Each player votes.
8. Host finishes vote.
9. Results show for everyone.
10. Host clicks Play Again.
11. Confirm same code is reused and everyone returns to reveal.

## 5. Reconnect checks

Test refresh during:

- Lobby
- Reveal
- Clues
- Vote
- Guess
- Results

Expected:

- Player returns to the same session code.
- Player role and seen state are preserved.
- Vote state is preserved.
- Results are restored.

## 6. Known MVP limitations

- RLS policies are permissive for quick no-login testing.
- Secret word is still readable from the client for MVP testing.
- A hardened version should move sensitive actions to Supabase RPC or Edge Functions.
- Connected/away status is currently only updated on reconnect, not on tab close.
