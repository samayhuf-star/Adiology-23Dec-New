/**
 * Global Error Handler
 * Provides centralized error handling with user-friendly messages and notifications
 */

import { notifications } from './notifications';
import { captureError } from './errorTracking';

export interface ErrorContext {
  module?: string;
  action?: string;
  metadata?: Record<string, any>;
  showNotification?: boolean;
  fallbackMessage?: string;
}

export class ErrorHandler {
  /**
   * Handle errors with user-friendly messages
   */
  static handle(error: unknown, context?: ErrorContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message || 'An unexpected error occurred';
    
    // Log error for debugging
    console.error('Error handled:', errorObj, context);
    
    // Capture error for tracking
    captureError(errorObj, {
      module: context?.module || 'unknown',
      action: context?.action || 'unknown',
      metadata: context?.metadata || {},
    });

    // Determine user-friendly message
    const userMessage = this.getUserFriendlyMessage(errorObj, context);
    
    // Show notification if requested (default: true for errors)
    if (context?.showNotification !== false) {
      notifications.error(userMessage, {
        title: 'Error',
        description: this.getErrorDescription(errorObj, context),
        priority: 'high',
        duration: 6000,
      });
    }
  }

  /**
   * Handle API errors specifically
   */
  static handleApiError(error: unknown, endpoint?: string, context?: ErrorContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Check for network errors
    if (this.isNetworkError(errorObj)) {
      this.handleNetworkError(endpoint);
      return;
    }

    // Check for timeout errors
    if (this.isTimeoutError(errorObj)) {
      this.handleTimeoutError(endpoint);
      return;
    }

    // Check for authentication errors
    if (this.isAuthError(errorObj)) {
      this.handleAuthError();
      return;
    }

    // Handle other API errors
    this.handle(errorObj, {
      ...context,
      module: context?.module || 'API',
      metadata: {
        ...context?.metadata,
        endpoint,
      },
    });
  }

  /**
   * Handle workspace errors
   */
  static handleWorkspaceError(error: unknown, action?: string): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    let message = 'Failed to load workspace';
    let description = 'Please try refreshing the page or contact support if the issue persists.';

    if (action === 'load') {
      message = 'Failed to load workspaces';
      description = 'Unable to fetch your workspaces. You can still create a new workspace.';
    } else if (action === 'create') {
      message = 'Failed to create workspace';
      description = 'There was an error creating your workspace. Please try again.';
    } else if (action === 'switch') {
      message = 'Failed to switch workspace';
      description = 'Unable to switch to the selected workspace. Please try again.';
    }

    this.handle(errorObj, {
      module: 'Workspace',
      action: action || 'unknown',
      showNotification: true,
      fallbackMessage: message,
      metadata: { action },
    });
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(endpoint?: string): void {
    notifications.error('Connection Error', {
      title: 'Network Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      priority: 'high',
      duration: 8000,
      action: {
        label: 'Retry',
        onClick: () => {
          if (endpoint) {
            window.location.reload();
          }
        },
      },
    });
  }

  /**
   * Handle timeout errors
   */
  static handleTimeoutError(endpoint?: string): void {
    notifications.warning('Request Timeout', {
      title: 'Request Taking Too Long',
      description: 'The request is taking longer than expected. Please try again or check your connection.',
      priority: 'medium',
      duration: 6000,
    });
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(): void {
    notifications.error('Authentication Required', {
      title: 'Session Expired',
      description: 'Please log in again to continue.',
      priority: 'critical',
      persistent: true,
      action: {
        label: 'Go to Login',
        onClick: () => {
          window.location.href = '/';
        },
      },
    });
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(error: Error, context?: ErrorContext): string {
    // Use fallback message if provided
    if (context?.fallbackMessage) {
      return context.fallbackMessage;
    }

    const message = error.message.toLowerCase();

    // Network errors
    if (this.isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    // Timeout errors
    if (this.isTimeoutError(error)) {
      return 'Request timed out. Please try again.';
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return 'Your session has expired. Please log in again.';
    }

    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'You don\'t have permission to perform this action.';
    }

    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.';
    }

    // Database errors
    if (message.includes('database') || message.includes('rls') || message.includes('policy')) {
      return 'A database error occurred. Please try again or contact support.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Invalid input. Please check your data and try again.';
    }

    // Generic error
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get error description for notifications
   */
  private static getErrorDescription(error: Error, context?: ErrorContext): string {
    if (context?.module && context?.action) {
      return `Error in ${context.module} while ${context.action}.`;
    }
    return 'Please try again or contact support if the issue persists.';
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      error.name === 'TypeError' && message.includes('fetch')
    );
  }

  /**
   * Check if error is a timeout error
   */
  static isTimeoutError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('timed out') ||
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'
    );
  }

  /**
   * Check if error is an authentication error
   */
  static isAuthError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('session') ||
      message.includes('token') ||
      message.includes('401') ||
      message.includes('403')
    );
  }

  /**
   * Wrap async function with error handling
   */
  static async wrap<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return null;
    }
  }

  /**
   * Wrap async function with error handling and return error
   */
  static async wrapWithError<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const data = await fn();
      return { data, error: null };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handle(errorObj, context);
      return { data: null, error: errorObj };
    }
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const handleApiError = ErrorHandler.handleApiError.bind(ErrorHandler);
export const handleWorkspaceError = ErrorHandler.handleWorkspaceError.bind(ErrorHandler);

export default ErrorHandler;

