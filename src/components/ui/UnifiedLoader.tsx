import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface UnifiedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

const UnifiedLoader: React.FC<UnifiedLoaderProps> = ({ 
  size = 'lg', 
  message = 'جاري التحميل...',
  className = ''
}) => {
  return (
    <div className={`flex justify-center items-center h-64 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size={size} color="cyan" />
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default UnifiedLoader;