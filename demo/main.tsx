/**
 * VSM Renderer Demo - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create root element
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
