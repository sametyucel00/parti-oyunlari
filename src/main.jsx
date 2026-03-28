import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const runTextDataMigration = () => {
  const FIX_KEY = 'party_games_text_migration_v1';
  try {
    if (localStorage.getItem(FIX_KEY) === '1') return;

    const keysToClear = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('game_pool_') || key.startsWith('party_games_pools_v')) {
        keysToClear.push(key);
      }
    }

    keysToClear.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(FIX_KEY, '1');
  } catch (e) {
    console.error('Text data migration failed:', e);
  }
};

runTextDataMigration();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: 'black', minHeight: '100vh' }}>
          <h1>Component Error</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.info && this.state.info.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
