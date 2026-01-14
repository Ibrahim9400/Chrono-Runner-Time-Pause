
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global protection against "Uncaught [object Object]" which often comes from 
// third-party SDKs (like CrazyGames) rejecting promises with raw objects.
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's one of those pesky object rejections with no stack trace
  if (event.reason && typeof event.reason === 'object' && !event.reason.stack) {
    event.preventDefault();
    console.debug('Silenced unhandled object rejection:', event.reason);
  }
});

window.addEventListener('error', (event) => {
  if (event.error && typeof event.error === 'object' && !event.error.stack) {
    event.preventDefault();
    console.debug('Silenced uncaught error object');
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
