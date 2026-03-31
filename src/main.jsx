import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import './index.css';

if (typeof window !== 'undefined' && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys
          .filter((key) => key.startsWith('bayios'))
          .forEach((key) => caches.delete(key));
      }).catch(() => {});
    }
  });
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

const showStartupError = (error) => {
  root.render(
    <div style={{ padding: '20px', color: '#b91c1c', background: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Uygulama baslatilamadi.</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error?.stack || error?.message || String(error)}</pre>
      <button onClick={() => window.location.reload()}>Sayfayi Yenile</button>
    </div>
  );
};

window.addEventListener('error', (event) => {
  console.error('Global startup error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', background: '#fff' }}>
          <h1>Bir hata olustu.</h1>
          <pre>{this.state.error?.toString?.() || 'Bilinmeyen hata'}</pre>
          <button onClick={() => window.location.reload()}>Sayfayi Yenile</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const boot = async () => {
  try {
    const { default: App } = await import('./App.jsx');

    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('App boot failed:', error);
    showStartupError(error);
  }
};

boot();
