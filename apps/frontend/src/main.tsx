import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga4';
import App from './App';
import './styles/globals.css';

ReactGA.initialize('G-TSDM4JCNVS', {
  gaOptions: {
    debug_mode: true,
  },
  gtagOptions: {
    debug_mode: true,
  },
});

console.log('GA4 initialized');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
