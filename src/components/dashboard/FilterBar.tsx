import React from 'react';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full bg-white dark:bg-card-dark rounded-2xl card-shadow dark:shadow-[0_2px_16px_0_rgba(36,44,80,0.18)] p-4 mb-6 flex flex-wrap gap-4 items-end fade-in ${className}`} style={{ animationDelay: '0.05s' }}>
      {children}
    </div>
  );
};

export default FilterBar; 