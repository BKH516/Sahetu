import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  selectedValue: string;
  selectedLabel: string;
  onSelect: (value: string, label: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  children, 
  placeholder,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleSelect = useCallback((value: string, label: string) => {
    setSelectedValue(value);
    setSelectedLabel(label);
    onValueChange?.(value);
    setIsOpen(false);
  }, [onValueChange]);

  const contextValue: SelectContextType = {
    selectedValue,
    selectedLabel,
    onSelect: handleSelect,
    isOpen,
    setIsOpen
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={selectRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
        >
          <span className="block truncate">
            {selectedLabel || placeholder || 'اختر...'}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {children}
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = '' }) => {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectItem must be used within a Select component');
  }

  const handleClick = () => {
    context.onSelect(value, children as string);
  };

  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectTrigger must be used within a Select component');
  }

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={className}
      style={{ width: '100%' }}
    >
      <span className="block truncate w-full text-right">{children}</span>
      {}
    </button>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  const context = useContext(SelectContext);
  
  if (!context) {
    throw new Error('SelectContent must be used within a Select component');
  }

  if (!context.isOpen) return null;

  return (
    <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${className}`}>
      {children}
    </div>
  );
};

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, children }) => {
  return <span>{children || placeholder}</span>;
}; 