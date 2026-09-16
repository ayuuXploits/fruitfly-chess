import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Fruitfly Chess:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: '#16191f',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}>
          <h1 style={{ color: '#00f0ff', marginBottom: '16px' }}>Fruitfly Chess UI Error</h1>
          <p style={{ color: '#ef4444', maxWidth: '600px', marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.5)',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: '80vw',
            maxHeight: '40vh',
            overflow: 'auto',
            fontSize: '12px',
            textAlign: 'left',
          }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#00f0ff',
              color: '#000000',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Reload Game
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
