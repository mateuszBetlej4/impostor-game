import { Sparkles } from 'lucide-react';

export function SessionSetupCard({ category, setCategory, categoryNames, impostorCount, setImpostorCount, maxImpostors }) {
  return (
    <section className="panel-card settings-card priority-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Session</p>
          <h3>Game setup</h3>
        </div>
        <Sparkles size={20} />
      </div>
      <label>
        <span>Category / set</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="Random">Random</option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Impostors</span>
        <select value={impostorCount} onChange={(event) => setImpostorCount(Number(event.target.value))}>
          {Array.from({ length: maxImpostors }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>{count}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
