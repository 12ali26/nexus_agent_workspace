import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

function dispatchComponentError(error, errorInfo, component) {
  window.dispatchEvent(
    new CustomEvent('nexus-error', {
      detail: {
        component,
        message: error?.message || 'Unknown render error',
        stack: error?.stack || errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        type: 'component',
      },
    }),
  )
}

export class BlockErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { error, hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    dispatchComponentError(error, errorInfo, this.props.blockType || 'Unknown')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="block-error-state">
          <div className="block-error-icon">
            <AlertTriangle size={20} color="var(--accent-red)" />
          </div>
          <div className="block-error-content">
            <div className="block-error-title">Block Error</div>
            <div className="block-error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <div className="block-error-actions">
              <button
                className="block-error-retry"
                type="button"
                onClick={() => this.setState({ error: null, hasError: false })}
              >
                <RefreshCw size={12} />
                Reload Block
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { error, hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    dispatchComponentError(error, errorInfo, 'App')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-screen">
          <div className="app-error-badge">N</div>
          <h1>NEXUS encountered an error</h1>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload NEXUS
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
