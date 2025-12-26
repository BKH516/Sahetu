import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <label 
      className={`block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}; 