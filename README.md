# A$AP MOB Impostor

Mobile-first impostor party game for the A$AP MOB group. The app is designed to feel like a polished phone app rather than a webpage: fixed mobile shell, black/gold theme, large touch targets, safe-area support, and no page scrolling during normal setup/game screens.

## Current version

The game supports both local pass-and-play sessions and an online beta powered by Supabase.

### Local flow

1. Add and reorder players.
2. Pick local or online mode.
3. Choose a word category/custom set and impostor count.
4. Review the compact setup summary.
5. Pass the phone around so each player reveals their role privately.
6. Players give timed clues, if clue rounds are enabled.
7. Players vote on who they think the impostor is.
8. Ties go to a bonus vote.
9. If enabled, a caught impostor gets one final guess at the secret word.
10. Show the result, vote count, impostor, secret word, category, and play-again actions.

### Online beta flow

Online mode lets players create or join a session using a room code. The online panel supports:

- create/join room code flow
- reconnect after refresh
- lobby player list
- host start/play-again controls
- private online role reveal
- hidden secret-word skip votes
- clue, vote, final-guess, and result phases
- realtime session refresh through Supabase

Online mode requires Supabase configuration for production deployments.

## Main features

- Local pass-and-play impostor game
- Online room-code beta
- Custom word/category builder
- Word history tracking and reset
- Score tracking
- Session presets: Casual, Chaos, Quickfire, Interrogation
- Configurable clue rounds, discussion timer, points, pass order, category hints, and final impostor guess
- Compact player management with paged mobile-friendly player lists
- Compact voting with paged target lists for larger groups
- Mobile viewport fit for iPhone-sized screens, including Safari safe-area constraints

## Tech stack

- Vite
- React
- Supabase client for online beta
- CSS-only styling
- Vercel-ready static deployment

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment variables

For online mode, configure these variables in the deployment environment:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The app can still be used for local pass-and-play without online sessions.

## Vercel

Use the default Vite settings:

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

The included `vercel.json` is configured for static Vite deployment.

## Theme and mobile layout

The design is based on the supplied A$AP MOB FC crest: black background, metallic gold accents, rounded cards, bold typography, royal football-club feel, and large mobile touch targets.

The current UI targets iPhone-style mobile viewports around 390-430 px wide and 700-930 px tall. Normal setup and game screens are intended to fit in one visible viewport with header, content, primary actions, and bottom navigation always reachable.

## Notes

- Online mode is still labelled beta in the UI.
- The exported legacy clue screens are kept consistent with the current mobile layout, even though the timed clue flow is the primary in-game clue screen.
- If changing screen layouts, test at 390x844 and 430x932 and avoid reintroducing body/page scrolling.
