import React from 'react';


export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
  </div>
);


export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    ))}
  </div>
);


export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
);


export const FormSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5 mb-2"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);


export const FastSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};


export const LoadingOverlay: React.FC<{ isVisible: boolean; message?: string }> = ({ 
  isVisible, 
  message = 'جاري التحميل...' 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
        <div className="mb-4">
          <FastSpinner size="lg" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};


export const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ 
  progress, 
  className = '' 
}) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
); 