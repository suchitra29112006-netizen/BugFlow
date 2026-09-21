import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("BugFlow UI Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-main)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '1rem' }}>
            BugFlow UI Encountered a Runtime Exception
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {this.state.error?.toString() || 'An unexpected rendering error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              localStorage.removeItem('bugflow_token');
              window.location.reload();
            }}
          >
            Reset Session & Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
