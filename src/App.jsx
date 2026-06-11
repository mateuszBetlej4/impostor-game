import { Crown, Eye, EyeOff, RotateCcw, Shield, Skull, Sparkles, Trophy, Users, Vote } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORY_NAMES, WORD_BANK } from './wordBank.js';

const DEFAULT_PLAYERS = ['Mateusz', 'Patrick', 'Chappie'];
const MIN_PLAYERS = 3;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalisePlayerName(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function makeRound({ players, category, impostorCount }) {
  const chosenCategory = category === 'Random' ? pickRandom(CATEGORY_NAMES) : category;
  const word = pickRandom(WORD_BANK[chosenCategory]);
  const impostorNames = new Set(shuffle(players).slice(0, impostorCount));

  return {
    category: chosenCategory,
    word,
    impostors: impostorNames,
    revealIndex: 0,
    revealedPlayers: [],
    votes: {},
  };
}

function App() {
  const [screen, setScreen] = useState('home');
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [newPlayer, setNewPlayer] = useState('');
  const [category, setCategory] = useState('A$AP MOB');
  const [impostorCount, setImpostorCount] = useState(1);
  const [round, setRound] = useState(null);
  const [roleVisible, setRoleVisible] = useState(false);
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0);

  const canStart = players.length >= MIN_PLAYERS && impostorCount >= 1 && impostorCount < players.length;
  const currentRevealPlayer = round ? players[round.revealIndex] : null;
  const currentVotingPlayer = players[votingPlayerIndex];

  const voteResult = useMemo(() => {
    if (!round) return null;
    const counts = players.reduce((acc, player) => ({ ...acc, [player]: 0 }), {});
    Object.values(round.votes).forEach((vote) => {
      counts[vote] = (counts[vote] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const highest = sorted[0]?.[1] ?? 0;
    const top = sorted.filter(([, count]) => count === highest).map(([name]) => name);
    const caught = top.some((name) => round.impostors.has(name));

    return { counts, sorted, top, highest, caught };
  }, [players, round]);

  function addPlayer() {
    const name = normalisePlayerName(newPlayer);
    if (!name || players.includes(name)) return;
    setPlayers((current) => [...current, name]);
    setNewPlayer('');
  }

  function removePlayer(name) {
    const nextPlayers = players.filter((player) => player !== name);
    setPlayers(nextPlayers);
    setImpostorCount((current) => Math.min(current, Math.max(1, nextPlayers.length - 1)));
  }

  function startRound() {
    if (!canStart) return;
    setRound(makeRound({ players, category, impostorCount }));
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setScreen('reveal');
  }

  function finishCurrentReveal() {
    if (!round) return;
    const nextIndex = round.revealIndex + 1;
    setRoleVisible(false);

    if (nextIndex >= players.length) {
      setRound({
        ...round,
        revealedPlayers: [...round.revealedPlayers, currentRevealPlayer],
        revealIndex: nextIndex,
      });
      setScreen('clues');
      return;
    }

    setRound({
      ...round,
      revealedPlayers: [...round.revealedPlayers, currentRevealPlayer],
      revealIndex: nextIndex,
    });
  }

  function submitVote(target) {
    if (!round) return;
    const nextVotes = { ...round.votes, [currentVotingPlayer]: target };
    const nextIndex = votingPlayerIndex + 1;

    setRound({ ...round, votes: nextVotes });

    if (nextIndex >= players.length) {
      setScreen('result');
      return;
    }

    setVotingPlayerIndex(nextIndex);
  }

  function resetGame() {
    setRound(null);
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setScreen('home');
  }

  function playAgain() {
    setRound(makeRound({ players, category, impostorCount }));
    setRoleVisible(false);
    setVotingPlayerIndex(0);
    setScreen('reveal');
  }

  return (
    <main className="app-shell">
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <section className="phone-frame">
        <Header screen={screen} onReset={resetGame} />

        {screen === 'home' && (
          <HomeScreen
            players={players}
            newPlayer={newPlayer}
            setNewPlayer={setNewPlayer}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            category={category}
            setCategory={setCategory}
            impostorCount={impostorCount}
            setImpostorCount={setImpostorCount}
            canStart={canStart}
            startRound={startRound}
          />
        )}

        {screen === 'reveal' && round && (
          <RevealScreen
            player={currentRevealPlayer}
            roleVisible={roleVisible}
            setRoleVisible={setRoleVisible}
            isImpostor={round.impostors.has(currentRevealPlayer)}
            category={round.category}
            word={round.word}
            currentIndex={round.revealIndex}
            totalPlayers={players.length}
            finishCurrentReveal={finishCurrentReveal}
          />
        )}

        {screen === 'clues' && round && (
          <ClueScreen players={players} category={round.category} onStartVoting={() => setScreen('vote')} />
        )}

        {screen === 'vote' && round && (
          <VoteScreen
            players={players}
            currentVotingPlayer={currentVotingPlayer}
            votingPlayerIndex={votingPlayerIndex}
            submitVote={submitVote}
          />
        )}

        {screen === 'result' && round && voteResult && (
          <ResultScreen round={round} voteResult={voteResult} onPlayAgain={playAgain} onReset={resetGame} />
        )}
      </section>
    </main>
  );
}

function Header({ screen, onReset }) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="crest-mark" aria-hidden="true">
          <Crown size={22} />
        </div>
        <div>
          <p className="eyebrow">A$AP MOB</p>
          <h1>MOB Impostor</h1>
        </div>
      </div>
      {screen !== 'home' && (
        <button className="icon-button" type="button" onClick={onReset} aria-label="Reset game">
          <RotateCcw size={18} />
        </button>
      )}
    </header>
  );
}

function HomeScreen({
  players,
  newPlayer,
  setNewPlayer,
  addPlayer,
  removePlayer,
  category,
  setCategory,
  impostorCount,
  setImpostorCount,
  canStart,
  startRound,
}) {
  return (
    <div className="screen-stack">
      <section className="hero-card">
        <div className="hero-crown"><Crown size={42} /></div>
        <p className="eyebrow">Private MOB session</p>
        <h2>Find the snake before they steal the crown.</h2>
        <p className="hero-copy">Pass the phone, reveal your role, give clues, and vote out the impostor.</p>
        <div className="hero-stats">
          <span><strong>{players.length}</strong> players</span>
          <span><strong>{impostorCount}</strong> impostor</span>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Squad</p>
            <h3>Players</h3>
          </div>
          <Users size={20} />
        </div>

        <div className="player-chips">
          {players.map((player) => (
            <button key={player} className="player-chip" type="button" onClick={() => removePlayer(player)}>
              {player}<span>×</span>
            </button>
          ))}
        </div>

        <div className="input-row">
          <input
            value={newPlayer}
            onChange={(event) => setNewPlayer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addPlayer();
            }}
            placeholder="Add player name"
          />
          <button type="button" onClick={addPlayer}>Add</button>
        </div>
      </section>

      <section className="panel-card settings-card">
        <label>
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="Random">Random</option>
            {CATEGORY_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>

        <label>
          <span>Impostors</span>
          <select value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>
            {Array.from({ length: Math.max(1, players.length - 1) }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </label>
      </section>

      {!canStart && <p className="warning-text">You need at least 3 players, and impostors must be fewer than players.</p>}

      <button className="primary-action" type="button" disabled={!canStart} onClick={startRound}>
        <Sparkles size={20} /> Start MOB Round
      </button>
    </div>
  );
}

function RevealScreen({
  player,
  roleVisible,
  setRoleVisible,
  isImpostor,
  category,
  word,
  currentIndex,
  totalPlayers,
  finishCurrentReveal,
}) {
  return (
    <div className="screen-stack reveal-layout">
      <div className="progress-pill">Reveal {currentIndex + 1} of {totalPlayers}</div>
      <section className="role-card">
        <p className="eyebrow">Pass the crown to</p>
        <h2>{player}</h2>

        {!roleVisible ? (
          <button className="hold-card" type="button" onClick={() => setRoleVisible(true)}>
            <Eye size={34} />
            <span>Tap to reveal role</span>
            <small>Keep it hidden from the MOB.</small>
          </button>
        ) : (
          <div className={`secret-card ${isImpostor ? 'is-impostor' : 'is-crew'}`}>
            {isImpostor ? <Skull size={42} /> : <Shield size={42} />}
            <p className="eyebrow">{isImpostor ? 'You are the impostor' : 'You are in the MOB'}</p>
            <h3>{isImpostor ? 'Blend in.' : word}</h3>
            <p>Category: <strong>{category}</strong></p>
            <small>{isImpostor ? 'You only know the category. Fake a clue and survive the vote.' : 'Give a clue that proves you know the word, but do not make it too obvious.'}</small>
          </div>
        )}
      </section>

      {roleVisible && (
        <button className="primary-action" type="button" onClick={finishCurrentReveal}>
          <EyeOff size={20} /> Hide & Pass On
        </button>
      )}
    </div>
  );
}

function ClueScreen({ players, category, onStartVoting }) {
  return (
    <div className="screen-stack">
      <section className="hero-card compact-hero">
        <p className="eyebrow">Clue round</p>
        <h2>One clue each. No repeats. No obvious giveaways.</h2>
        <p className="hero-copy">Category: <strong>{category}</strong></p>
      </section>

      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Order</p>
            <h3>Clue lineup</h3>
          </div>
          <Trophy size={20} />
        </div>
        <ol className="ordered-list">
          {players.map((player, index) => <li key={player}><span>{index + 1}</span>{player}</li>)}
        </ol>
      </section>

      <button className="primary-action" type="button" onClick={onStartVoting}>
        <Vote size={20} /> Start Vote
      </button>
    </div>
  );
}

function VoteScreen({ players, currentVotingPlayer, votingPlayerIndex, submitVote }) {
  return (
    <div className="screen-stack">
      <div className="progress-pill">Vote {votingPlayerIndex + 1} of {players.length}</div>
      <section className="panel-card vote-panel">
        <p className="eyebrow">The MOB votes</p>
        <h2>{currentVotingPlayer}, who is the impostor?</h2>
        <div className="vote-grid">
          {players.map((player) => (
            <button key={player} type="button" onClick={() => submitVote(player)}>
              {player}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ResultScreen({ round, voteResult, onPlayAgain, onReset }) {
  const impostors = [...round.impostors];
  const title = voteResult.caught ? 'Impostor exposed' : 'The snake escaped';

  return (
    <div className="screen-stack">
      <section className={`result-card ${voteResult.caught ? 'caught' : 'escaped'}`}>
        <Crown size={46} />
        <p className="eyebrow">The MOB has spoken</p>
        <h2>{title}</h2>
        <div className="result-facts">
          <div><span>Impostor</span><strong>{impostors.join(', ')}</strong></div>
          <div><span>Secret word</span><strong>{round.word}</strong></div>
          <div><span>Category</span><strong>{round.category}</strong></div>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Votes</p>
            <h3>Final count</h3>
          </div>
          <Vote size={20} />
        </div>
        <div className="vote-results">
          {voteResult.sorted.map(([player, count]) => (
            <div key={player} className="vote-result-row">
              <span>{player}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="action-grid">
        <button className="secondary-action" type="button" onClick={onReset}>New Setup</button>
        <button className="primary-action" type="button" onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
}

export default App;
