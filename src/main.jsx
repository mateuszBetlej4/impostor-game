import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { WordAuditPage } from './dev/WordAuditPage.jsx';
import './styles.css';
import './passOrder.css';
import './modes.css';
import './logoTweaks.css';
import './dev/devCloud.css';

const WORD_AUDIT_HASH = '#breadcrumb-words';

function RootRouter() {
  const [isWordAuditRoute, setIsWordAuditRoute] = useState(window.location.hash === WORD_AUDIT_HASH);

  useEffect(() => {
    const handleHashChange = () => setIsWordAuditRoute(window.location.hash === WORD_AUDIT_HASH);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isWordAuditRoute) return <WordAuditPage />;

  return (
    <>
      <App />
      <button
        className="dev-cloud-button"
        type="button"
        aria-label="Open dev word audit"
        onClick={() => {
          window.location.hash = WORD_AUDIT_HASH;
          setIsWordAuditRoute(true);
        }}
      >
        ☁️
      </button>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>,
);
