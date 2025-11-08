import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = 'جاري التحميل...', 
  size = 'lg' 
}) => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner size={size} color="cyan" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageLoader;