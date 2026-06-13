import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './AppWithTimedClues.jsx';
import { WordAuditPage } from './dev/WordAuditPage.jsx';
import { GameGuards } from './gameGuards.jsx';
import './styles.css';
import './passOrder.css';
import './modes.css';
import './logoTweaks.css';
import './setupTabs.css';
import './gameGuards.css';
import './revealFit.css';
import './kioskMode.css';

const WORD_AUDIT_HASH = '#breadcrumb-words';

function RootRouter() {
  const [isWordAuditRoute, setIsWordAuditRoute] = useState(window.location.hash === WORD_AUDIT_HASH);

  useEffect(() => {
    const handleHashChange = () => setIsWordAuditRoute(window.location.hash === WORD_AUDIT_HASH);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return isWordAuditRoute ? <WordAuditPage /> : <><App /><GameGuards /></>;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>,
);
