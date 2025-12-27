// AWS Error Handling Utilities for VM Management

export class VMError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'VMError';
  }
}

export class VMOperationError extends VMError {
  constructor(message: string, originalError?: Error) {
    super('VM_OPERATION_ERROR', message, originalError);
    this.name = 'VMOperationError';
  }
}

export class DatabaseError extends VMError {
  constructor(message: string, originalError?: Error) {
    super('DATABASE_ERROR', message, originalError);
    this.name = 'DatabaseError';
  }
}

export class CleanupError extends VMError {
  constructor(message: string, originalError?: Error) {
    super('CLEANUP_ERROR', message, originalError);
    this.name = 'CleanupError';
  }
}

export class AWSErrorHandler {
  /**
   * Retry operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) break;
        
        // Don't retry certain error types
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new VMOperationError(`Operation failed after ${maxRetries + 1} attempts`, lastError);
  }

  /**
   * Handle EC2-specific errors
   */
  static handleEC2Error(error: any): VMError {
    const errorCode = error.name || error.Code || error.code;
    const errorMessage = error.message || error.Message || 'Unknown AWS error';
    
    switch (errorCode) {
      case 'InsufficientInstanceCapacity':
        return new VMError(
          'CAPACITY_ERROR', 
          'No capacity available in the selected region/instance type. Please try a different region or instance type.',
          error
        );
        
      case 'InvalidAMIID.NotFound':
        return new VMError(
          'INVALID_AMI', 
          'The selected operating system image is not available in this region.',
          error
        );
        
      case 'UnauthorizedOperation':
        return new VMError(
          'AUTH_ERROR', 
          'AWS credentials are insufficient for this operation. Please check your AWS permissions.',
          error
        );
        
      case 'RequestLimitExceeded':
      case 'Throttling':
        return new VMError(
          'RATE_LIMIT', 
          'Too many requests to AWS. Please try again in a few minutes.',
          error
        );
        
      case 'InvalidInstanceID.NotFound':
        return new VMError(
          'INSTANCE_NOT_FOUND', 
          'The virtual machine instance was not found. It may have been terminated.',
          error
        );
        
      case 'IncorrectInstanceState':
        return new VMError(
          'INVALID_STATE', 
          'The virtual machine is not in the correct state for this operation.',
          error
        );
        
      case 'InvalidKeyPair.NotFound':
        return new VMError(
          'KEY_PAIR_ERROR', 
          'SSH key pair not found. Please try creating the VM again.',
          error
        );
        
      case 'InvalidGroup.NotFound':
        return new VMError(
          'SECURITY_GROUP_ERROR', 
          'Security group not found. Please try creating the VM again.',
          error
        );
        
      case 'VolumeInUse':
        return new VMError(
          'VOLUME_IN_USE', 
          'Storage volume is currently in use and cannot be modified.',
          error
        );
        
      case 'InvalidParameterValue':
        return new VMError(
          'INVALID_PARAMETER', 
          'Invalid configuration parameter provided to AWS.',
          error
        );
        
      case 'DryRunOperation':
        return new VMError(
          'DRY_RUN', 
          'This was a dry run operation - no actual resources were created.',
          error
        );
        
      case 'PendingVerification':
        return new VMError(
          'ACCOUNT_VERIFICATION', 
          'Your AWS account requires verification before launching instances.',
          error
        );
        
      case 'OptInRequired':
        return new VMError(
          'OPT_IN_REQUIRED', 
          'You must opt-in to use this AWS service in your account.',
          error
        );
        
      case 'NetworkError':
      case 'TimeoutError':
        return new VMError(
          'NETWORK_ERROR', 
          'Network connection to AWS failed. Please check your internet connection and try again.',
          error
        );
        
      default:
        return new VMError(
          'AWS_ERROR', 
          `AWS operation failed: ${errorMessage}`,
          error
        );
    }
  }

  /**
   * Handle CloudWatch-specific errors
   */
  static handleCloudWatchError(error: any): VMError {
    const errorCode = error.name || error.Code || error.code;
    const errorMessage = error.message || error.Message || 'Unknown CloudWatch error';
    
    switch (errorCode) {
      case 'InvalidParameterValue':
        return new VMError(
          'INVALID_METRIC_PARAMETER', 
          'Invalid parameter provided for metrics collection.',
          error
        );
        
      case 'ResourceNotFound':
        return new VMError(
          'METRIC_NOT_FOUND', 
          'Metrics not available for this instance. It may be too new or already terminated.',
          error
        );
        
      default:
        return new VMError(
          'CLOUDWATCH_ERROR', 
          `CloudWatch operation failed: ${errorMessage}`,
          error
        );
    }
  }

  /**
   * Check if error should not be retried
   */
  private static isNonRetryableError(error: any): boolean {
    const errorCode = error.name || error.Code || error.code;
    
    const nonRetryableErrors = [
      'UnauthorizedOperation',
      'InvalidAMIID.NotFound',
      'InvalidInstanceID.NotFound',
      'InvalidKeyPair.NotFound',
      'InvalidGroup.NotFound',
      'InvalidParameterValue',
      'PendingVerification',
      'OptInRequired',
      'DryRunOperation'
    ];
    
    return nonRetryableErrors.includes(errorCode);
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: VMError): string {
    switch (error.code) {
      case 'CAPACITY_ERROR':
        return 'No virtual machines are available in your selected region right now. Try choosing a different region or instance size.';
        
      case 'INVALID_AMI':
        return 'The operating system you selected is not available in this region. Please choose a different region or operating system.';
        
      case 'AUTH_ERROR':
        return 'There was an authentication problem with AWS. Please contact support if this continues.';
        
      case 'RATE_LIMIT':
        return 'Too many requests were made too quickly. Please wait a few minutes and try again.';
        
      case 'INSTANCE_NOT_FOUND':
        return 'This virtual machine no longer exists. It may have been deleted or terminated.';
        
      case 'INVALID_STATE':
        return 'This virtual machine is not ready for that operation. Please wait for it to finish starting or stopping.';
        
      case 'NETWORK_ERROR':
        return 'Connection to AWS failed. Please check your internet connection and try again.';
        
      case 'ACCOUNT_VERIFICATION':
        return 'Your AWS account needs verification before you can create virtual machines. Please contact AWS support.';
        
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem continues.';
    }
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: VMError, context?: Record<string, any>): void {
    const logData = {
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack
      },
      originalError: error.originalError ? {
        name: error.originalError.name,
        message: error.originalError.message,
        stack: error.originalError.stack
      } : undefined,
      context,
      timestamp: new Date().toISOString()
    };
    
    // In production, this would go to a proper logging service
    if (error.code === 'AUTH_ERROR' || error.code === 'ACCOUNT_VERIFICATION') {
      console.error('CRITICAL VM Error:', JSON.stringify(logData, null, 2));
    } else if (error.code === 'CAPACITY_ERROR' || error.code === 'RATE_LIMIT') {
      console.warn('VM Warning:', JSON.stringify(logData, null, 2));
    } else {
      console.error('VM Error:', JSON.stringify(logData, null, 2));
    }
  }
}

/**
 * Wrapper for database operations with transaction support
 */
export class DatabaseErrorHandler {
  static async withTransaction<T>(
    prisma: any, // PrismaClient type
    operation: (tx: any) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(async (tx: any) => {
      try {
        return await operation(tx);
      } catch (error) {
        // Transaction will automatically rollback
        throw new DatabaseError('Transaction failed', error as Error);
      }
    }, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
      isolationLevel: 'ReadCommitted'
    });
  }

  static handlePrismaError(error: any): DatabaseError {
    const errorCode = error.code;
    const errorMessage = error.message || 'Database operation failed';
    
    switch (errorCode) {
      case 'P2002':
        return new DatabaseError('A record with this information already exists.', error);
        
      case 'P2025':
        return new DatabaseError('The requested record was not found.', error);
        
      case 'P2003':
        return new DatabaseError('This operation would violate a database constraint.', error);
        
      case 'P2024':
        return new DatabaseError('Database connection timeout. Please try again.', error);
        
      default:
        return new DatabaseError(errorMessage, error);
    }
  }
}