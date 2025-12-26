
import { securityLogger } from './securityLogger';

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorDetails {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  timestamp?: string;
  stack?: string;
  url?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorDetails[] = [];
  private maxQueueSize = 50;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  
  handleError(error: Error | any, details: Partial<ErrorDetails> = {}): UserFriendlyError {
    const errorDetails: ErrorDetails = {
      type: details.type || this.determineErrorType(error),
      severity: details.severity || this.determineSeverity(error),
      message: error.message || error.toString(),
      context: details.context || {},
      userId: details.userId,
      userEmail: details.userEmail,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      url: window.location.href,
      ...details
    };

    
    this.logError(errorDetails);

    
    this.addToQueue(errorDetails);

    
    return this.getUserFriendlyMessage(errorDetails);
  }

  
  private determineErrorType(error: any): ErrorType {
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
      return ErrorType.NETWORK;
    }
    if (error.response?.status === 401) {
      return ErrorType.AUTHENTICATION;
    }
    if (error.response?.status === 403) {
      return ErrorType.AUTHORIZATION;
    }
    if (error.response?.status >= 500) {
      return ErrorType.SERVER;
    }
    if (error.response?.status >= 400) {
      return ErrorType.VALIDATION;
    }
    return ErrorType.CLIENT;
  }

  
  private determineSeverity(error: any): ErrorSeverity {
    if (error.response?.status >= 500) {
      return ErrorSeverity.HIGH;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return ErrorSeverity.MEDIUM;
    }
    if (error.code === 'ERR_NETWORK') {
      return ErrorSeverity.MEDIUM;
    }
    return ErrorSeverity.LOW;
  }

  
  private logError(errorDetails: ErrorDetails): void {
    
    securityLogger.log({
      type: 'suspicious_activity',
      eventType: 'SECURITY_ALERT',
      userEmail: errorDetails.userEmail,
      details: {
        type: errorDetails.type,
        message: errorDetails.message,
        context: errorDetails.context
      },
      severity: errorDetails.severity
    });

    
    
    
    
    
    
    
    
    
    
  }

  
  private addToQueue(errorDetails: ErrorDetails): void {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); 
    }
    this.errorQueue.push(errorDetails);
  }

  
  private getUserFriendlyMessage(errorDetails: ErrorDetails): UserFriendlyError {
    
    return {
      title: 'خطأ',
      message: errorDetails.message || 'حدث خطأ غير متوقع',
      action: 'إعادة المحاولة',
      canRetry: true
    };
  }

  
  getRecentErrors(count: number = 10): ErrorDetails[] {
    return this.errorQueue.slice(-count);
  }

  
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = 0;
    });

    this.errorQueue.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }
}


export const errorHandler = ErrorHandler.getInstance();


export const handleNetworkError = (error: any, context?: Record<string, any>) => {
  return errorHandler.handleError(error, {
    type: ErrorType.NETWORK,
    context
  });
};

export const handleValidationError = (error: any, context?: Record<string, any>) => {
  return errorHandler.handleError(error, {
    type: ErrorType.VALIDATION,
    context
  });
};

export const handleAuthError = (error: any, context?: Record<string, any>) => {
  return errorHandler.handleError(error, {
    type: ErrorType.AUTHENTICATION,
    context
  });
};

export const handleServerError = (error: any, context?: Record<string, any>) => {
  return errorHandler.handleError(error, {
    type: ErrorType.SERVER,
    context
  });
};


export const useErrorHandler = () => {
  const handleError = (error: any, details?: Partial<ErrorDetails>) => {
    return errorHandler.handleError(error, details);
  };

  const getRecentErrors = () => {
    return errorHandler.getRecentErrors();
  };

  const getErrorStats = () => {
    return errorHandler.getErrorStats();
  };

  return {
    handleError,
    getRecentErrors,
    getErrorStats
  };
};