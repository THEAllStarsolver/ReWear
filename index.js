import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
import './index.css'; // Your global styles
import App from './App'; // Your main App component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
