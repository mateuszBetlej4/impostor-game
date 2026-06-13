export function Toggle({ label, checked, onChange }) {
  return (
    <button className={`toggle-row ${checked ? 'on' : ''}`} type="button" onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <strong>{checked ? 'On' : 'Off'}</strong>
    </button>
  );
}
