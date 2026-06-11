# A$AP MOB Impostor

Mobile-first pass-and-play impostor party game for the A$AP MOB group.

## Current version

This first version is intentionally local-only. There is no multiplayer or backend yet.

Flow:

1. Add players.
2. Pick a category.
3. Start a round.
4. Pass the phone around so each player reveals their role privately.
5. Everyone gives one clue out loud.
6. Players vote on who they think the impostor is.
7. Reveal the impostor and secret word.

## Tech stack

- Vite
- React
- CSS only styling
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

## Vercel

Use the default Vite settings:

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

The included `vercel.json` is already configured for static Vite deployment.

## Theme

The design is based on the supplied A$AP MOB FC crest: black background, metallic gold accents, royal football-club feel, large mobile touch targets, and iPhone safe-area support.

## Next ideas

- Add the actual logo file to `public/assets/logo.png` and show it in the header.
- Add an impostor guess phase.
- Add round history and score tracking.
- Add custom word/category editor.
- Add multiplayer rooms later.
