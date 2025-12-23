import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({ errorInfo });

    // Log to console
    console.error('App Error:', error, errorInfo);
    
    // Handle error with global error handler
    import('../utils/errorHandler').then(({ ErrorHandler }) => {
      ErrorHandler.handle(error, {
        module: 'ErrorBoundary',
        action: 'component_error',
        showNotification: true,
        metadata: {
          componentStack: errorInfo.componentStack,
        },
      });
    }).catch(() => {
      // Silently fail if error handler can't be loaded
    });
    
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
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

