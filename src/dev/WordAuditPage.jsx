import { useMemo, useState } from 'react';
import { WORD_BANK } from '../wordBank.js';
import './wordAudit.css';

const STORAGE_KEY = 'asap-mob-word-audit-rejected-v1';

function loadRejected() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveRejected(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...words]));
}

function makeKey(category, word) {
  return `${category}:::${word}`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function WordAuditPage() {
  const [rejected, setRejected] = useState(loadRejected);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copied, setCopied] = useState(false);
  const [rolledCategory, setRolledCategory] = useState('');
  const [rolledWord, setRolledWord] = useState('');

  const categories = useMemo(() => Object.keys(WORD_BANK), []);
  const categorySummaries = useMemo(() => categories.map((category) => ({
    category,
    count: WORD_BANK[category].length,
    preview: WORD_BANK[category].slice(0, 4).join(', '),
  })), [categories]);
  const rows = useMemo(() => categories.flatMap((category) => WORD_BANK[category].map((word) => ({ category, word, key: makeKey(category, word) }))), [categories]);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesCategory = activeCategory === 'All' || row.category === activeCategory;
    const matchesQuery = !query.trim() || row.word.toLowerCase().includes(query.trim().toLowerCase()) || row.category.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  }), [rows, activeCategory, query]);
  const rejectedRows = useMemo(() => rows.filter((row) => rejected.has(row.key)), [rows, rejected]);
  const groupedRemovalList = useMemo(() => rejectedRows.reduce((acc, row) => ({ ...acc, [row.category]: [...(acc[row.category] || []), row.word] }), {}), [rejectedRows]);
  const removalText = useMemo(() => JSON.stringify(groupedRemovalList, null, 2), [groupedRemovalList]);

  function rollCategory() {
    const nextCategory = pickRandom(categories);
    setRolledCategory(nextCategory);
    setRolledWord('');
    setActiveCategory(nextCategory);
  }

  function rollWord() {
    if (!rolledCategory) return;
    setRolledWord(pickRandom(WORD_BANK[rolledCategory] || []));
  }

  function toggle(row) {
    setCopied(false);
    setRejected((current) => {
      const next = new Set(current);
      if (next.has(row.key)) next.delete(row.key);
      else next.add(row.key);
      saveRejected(next);
      return next;
    });
  }

  async function copyList() {
    await navigator.clipboard.writeText(removalText);
    setCopied(true);
  }

  function clearRejected() {
    const empty = new Set();
    setRejected(empty);
    saveRejected(empty);
    setCopied(false);
  }

  return (
    <main className="word-audit-shell">
      <section className="word-audit-hero">
        <p className="eyebrow">Hidden dev page</p>
        <h1>Word Audit</h1>
        <p>Updated to the new specific category system. Tap a category card to filter it, or use the car-game randomiser to roll a category first, then roll a word from that category.</p>
        <div className="word-audit-stats">
          <div><span>Categories</span><strong>{categories.length}</strong></div>
          <div><span>Total words</span><strong>{rows.length}</strong></div>
          <div><span>Selected</span><strong>{rejectedRows.length}</strong></div>
          <div><span>Visible</span><strong>{filteredRows.length}</strong></div>
        </div>
      </section>

      <section className="word-randomiser-card">
        <div className="word-audit-section-title">
          <p className="eyebrow">Le Mans car game</p>
          <h2>Roll category, then word</h2>
        </div>
        <div className="randomiser-result-grid">
          <div>
            <span>Category</span>
            <strong>{rolledCategory || 'Roll first'}</strong>
          </div>
          <div>
            <span>Word</span>
            <strong>{rolledWord || 'Roll after category'}</strong>
          </div>
        </div>
        <div className="randomiser-actions">
          <button type="button" onClick={rollCategory}>Roll Category</button>
          <button type="button" onClick={rollWord} disabled={!rolledCategory}>Roll Word</button>
        </div>
        <p className="randomiser-help">Use it like: roll a category, everyone thinks/says guesses, then roll the word from that exact category.</p>
      </section>

      <section className="word-audit-categories">
        <div className="word-audit-section-title">
          <p className="eyebrow">Current categories</p>
          <h2>New word bank</h2>
        </div>
        <div className="word-audit-category-grid">
          <button type="button" className={activeCategory === 'All' ? 'active' : ''} onClick={() => setActiveCategory('All')}>
            <strong>All categories</strong>
            <span>{rows.length} words</span>
            <small>Show everything</small>
          </button>
          {categorySummaries.map(({ category, count, preview }) => (
            <button key={category} type="button" className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>
              <strong>{category}</strong>
              <span>{count} words</span>
              <small>{preview}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="word-audit-controls">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search words or categories" />
        <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
          <option value="All">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </section>

      <section className="word-audit-actions">
        <button type="button" onClick={copyList} disabled={rejectedRows.length === 0}>{copied ? 'Copied' : 'Copy removal list'}</button>
        <button type="button" className="ghost" onClick={clearRejected} disabled={rejectedRows.length === 0}>Clear selected</button>
      </section>

      {rejectedRows.length > 0 && <section className="word-audit-output"><h2>Removal list</h2><pre>{removalText}</pre></section>}

      <section className="word-audit-list">
        {filteredRows.map((row) => {
          const selected = rejected.has(row.key);
          return (
            <button key={row.key} type="button" className={selected ? 'rejected' : ''} onClick={() => toggle(row)}>
              <span>{row.category}</span>
              <strong>{row.word}</strong>
              <small>{selected ? 'Remove' : 'Keep'}</small>
            </button>
          );
        })}
      </section>
    </main>
  );
}
