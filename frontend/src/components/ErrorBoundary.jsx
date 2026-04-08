// components/ErrorBoundary.jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[WAF Dashboard] Page error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-10 text-center">
          <div className="text-4xl mb-4">⚠</div>
          <div className="font-display font-semibold text-white text-base mb-2">
            {this.props.title || 'Something went wrong'}
          </div>
          <div className="text-xs font-mono text-gray-500 mb-4 max-w-sm break-all">
            {this.state.error?.message || 'An unexpected error occurred in this panel.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-accent-red/20 hover:bg-accent-red/30 border border-accent-red/30 text-accent-red text-xs font-mono rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
