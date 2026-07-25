import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

(function preloadTheme() {
  try {
    const stored = localStorage.getItem('wa_theme_v2');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const useDark = stored ? stored === 'dark' : !!prefersDark;
    if (useDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  } catch {
    // noop
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
