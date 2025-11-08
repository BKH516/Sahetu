import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, ErrorType, ErrorSeverity } from '../../utils/errorHandler';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    
    const userFriendlyError = errorHandler.handleError(error, {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.HIGH,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    this.setState({ 
      errorMessage: userFriendlyError.message 
    });

    
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorMessage: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      
      if (this.props.fallback) {
        return this.props.fallback;
      }

      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                حدث خطأ غير متوقع
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {this.state.errorMessage || 'عذراً، حدث خطأ أثناء تحميل التطبيق. يرجى المحاولة مرة أخرى.'}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  المحاولة مرة أخرى
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  إعادة تحميل الصفحة
                </Button>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    تفاصيل الخطأ (للمطورين)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}