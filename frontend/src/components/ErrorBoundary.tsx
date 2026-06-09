import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AskVES ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg, #060e1f)',
          color: 'var(--t1, #dce8f5)',
          gap: '16px',
          fontFamily: 'DM Sans, sans-serif',
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong</h1>
          <p style={{ color: 'var(--t2, #8ca4bf)', maxWidth: '400px', margin: 0 }}>
            {this.state.errorMessage || 'An unexpected error occurred.'}
          </p>
          <a
            href="/"
            style={{
              padding: '10px 24px',
              background: 'var(--accent, #1a7fa8)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go back home
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
