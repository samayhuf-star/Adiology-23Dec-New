import { supabase } from './supabase/client';

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    url: string;
    userAgent: string;
    userId?: string;
    component?: string;
    action?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class ErrorHandlerClass {
  private errorQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;
  private maxQueueSize = 50;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  private handleOnline() {
    this.isOnline = true;
    this.flushErrorQueue();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private handleGlobalError(event: ErrorEvent) {
    this.captureError(event.error || new Error(event.message), {
      component: 'Global',
      action: 'JavaScript Error',
    }, 'high');
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.captureError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        component: 'Global',
        action: 'Unhandled Promise Rejection',
      },
      'high'
    );
  }

  /**
   * Capture and report an error
   */
  async captureError(
    error: Error | string,
    context: {
      component?: string;
      action?: string;
      userId?: string;
      metadata?: Record<string, any>;
    } = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      
      // Get current user if not provided
      let userId = context.userId;
      if (!userId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
        } catch (e) {
          // Ignore auth errors when capturing errors
        }
      }

      const errorReport: ErrorReport = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        error: {
          name: errorObj.name,
          message: errorObj.message,
          stack: errorObj.stack,
        },
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId,
          component: context.component,
          action: context.action,
          ...context.metadata,
        },
        severity,
        resolved: false,
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Captured [${severity.toUpperCase()}]`);
        console.error('Error:', errorObj);
        console.log('Context:', errorReport.context);
        console.groupEnd();
      }

      // Add to queue
      this.addToQueue(errorReport);

      // Try to send immediately if online
      if (this.isOnline) {
        await this.sendErrorReport(errorReport);
      }
    } catch (e) {
      console.error('Failed to capture error:', e);
    }
  }

  /**
   * Handle API errors specifically
   */
  handleApiError(
    error: any,
    endpoint: string,
    method: string = 'GET',
    context: Record<string, any> = {}
  ): void {
    const errorMessage = this.extractErrorMessage(error);
    
    this.captureError(
      new Error(`API Error: ${errorMessage}`),
      {
        component: 'API',
        action: `${method} ${endpoint}`,
        metadata: {
          endpoint,
          method,
          status: error?.status || error?.response?.status,
          ...context,
        },
      },
      this.getApiErrorSeverity(error)
    );
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: any, action: string): void {
    this.captureError(
      error,
      {
        component: 'Authentication',
        action,
      },
      'high'
    );
  }

  /**
   * Handle workspace errors
   */
  handleWorkspaceError(error: any, action: string): void {
    this.captureError(
      error,
      {
        component: 'Workspace',
        action,
      },
      'medium'
    );
  }

  /**
   * Handle form errors
   */
  handleFormError(error: any, formId?: string, action?: string): void {
    this.captureError(
      error,
      {
        component: 'Forms',
        action: action || 'Form Operation',
        metadata: { formId },
      },
      'low'
    );
  }

  /**
   * Handle payment/billing errors
   */
  handlePaymentError(error: any, action: string): void {
    this.captureError(
      error,
      {
        component: 'Payment',
        action,
      },
      'critical'
    );
  }

  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      try {
        await this.sendErrorReport(error);
      } catch (e) {
        // Re-add to queue if failed to send
        this.errorQueue.push(error);
      }
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // In production, you might want to send to an external service like Sentry
      // For now, we'll store in local database or send to your backend
      
      if (process.env.NODE_ENV === 'production') {
        // Send to backend error logging endpoint
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        });
      }
      
      // Store in localStorage as backup
      this.storeErrorLocally(errorReport);
    } catch (e) {
      console.error('Failed to send error report:', e);
      throw e;
    }
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    try {
      const stored = localStorage.getItem('error_reports');
      const errors = stored ? JSON.parse(stored) : [];
      
      errors.push(errorReport);
      
      // Keep only last 20 errors locally
      if (errors.length > 20) {
        errors.splice(0, errors.length - 20);
      }
      
      localStorage.setItem('error_reports', JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.data?.message) return error.data.message;
    if (error?.data?.error) return error.data.error;
    return 'Unknown error occurred';
  }

  private getApiErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const status = error?.status || error?.response?.status;
    
    if (status >= 500) return 'critical';
    if (status >= 400 && status < 500) return 'medium';
    if (status >= 300) return 'low';
    
    return 'medium';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored error reports for debugging
   */
  getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear stored error reports
   */
  clearStoredErrors(): void {
    try {
      localStorage.removeItem('error_reports');
    } catch (e) {
      // Ignore
    }
  }
}

// Export singleton instance
export const ErrorHandler = new ErrorHandlerClass();

// Export types for use in components
export type { ErrorReport };