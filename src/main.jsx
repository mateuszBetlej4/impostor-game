import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { WordAuditPage } from './dev/WordAuditPage.jsx';
import './styles.css';
import './passOrder.css';
import './modes.css';
import './logoTweaks.css';

const isWordAuditRoute = window.location.hash === '#breadcrumb-words';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isWordAuditRoute ? <WordAuditPage /> : <App />}
  </React.StrictMode>,
);
