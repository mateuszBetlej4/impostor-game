import { useState } from 'react';

export function Toggle({ label, checked, onChange, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);

  function toggleInfo(event) {
    event.stopPropagation();
    setShowTooltip((current) => !current);
  }

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <button
        className={`toggle-row ${checked ? 'on' : ''}`}
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: '100%',
          minWidth: 0,
          minHeight: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 12px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
            flex: '1 1 auto',
            textAlign: 'left',
          }}
        >
          <span style={{ minWidth: 0, whiteSpace: 'normal', lineHeight: 1.15 }}>{label}</span>
          {tooltip && (
            <span
              title={tooltip}
              aria-label={`${label} info`}
              onClick={toggleInfo}
              style={{
                width: 22,
                height: 22,
                flex: '0 0 auto',
                display: 'inline-grid',
                placeItems: 'center',
                border: '1px solid rgba(244, 208, 111, 0.28)',
                borderRadius: 999,
                color: '#f4d06f',
                background: 'rgba(0, 0, 0, 0.22)',
                fontSize: 12,
                fontWeight: 950,
                lineHeight: 1,
              }}
            >
              i
            </span>
          )}
        </span>
        <strong style={{ flex: '0 0 auto', minWidth: 34, textAlign: 'right' }}>{checked ? 'On' : 'Off'}</strong>
      </button>
      {tooltip && showTooltip && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 30,
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            padding: '12px 14px',
            border: '1px solid rgba(244, 208, 111, 0.28)',
            borderRadius: 16,
            color: 'rgba(255, 247, 223, 0.9)',
            background: 'rgba(8, 7, 5, 0.98)',
            boxShadow: '0 18px 44px rgba(0, 0, 0, 0.48)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
