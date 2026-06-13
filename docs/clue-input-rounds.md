# Clue input rounds

This branch changes local clue rounds from a passive discussion screen into a pass-the-phone clue entry flow.

## Flow

1. Players reveal their role as before.
2. After all reveals, the phone moves to the first player in pass order.
3. Each player enters one clue.
4. The clue input screen shows clue history, including who said each clue and which clue round it came from.
5. After all players submit a clue, the next configured clue round begins.
6. After the final clue round, the game moves to voting.

## State added to each round

- `cluePlayerIndex`: current player position in the clue-entry pass order.
- `clues`: list of submitted clue objects: `{ round, player, clue }`.

## Vercel test path

- Start a local game with 1 clue round and confirm it goes reveal -> clue input for each player -> vote.
- Start a local game with 2+ clue rounds and confirm it loops through every player for each round.
- Confirm previous clues are visible on each player's clue input screen.
