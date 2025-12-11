import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console
    console.error('App Error:', error, errorInfo);
    
    // Optional: Send to your backend (only in production, and silently fail if endpoint doesn't exist)
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/log-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: error.message, 
            stack: error.stack,
            componentStack: errorInfo.componentStack 
          })
        }).then((response) => {
          // Suppress 405 and 404 errors - endpoint may not exist or support POST
          if (response && !response.ok && response.status !== 405 && response.status !== 404) {
            // Only log unexpected errors
            console.debug('Error logging failed:', response.status);
          }
        }).catch(() => {
          // Silently fail if error logging endpoint doesn't exist or returns an error
        });
      } catch (e) {
        // Silently fail if fetch is not available
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened.
            </p>
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left max-w-2xl mx-auto">
                <p className="text-sm font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-48">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

