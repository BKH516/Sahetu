import React, { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string;
}

interface DropdownFilterButtonProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  section?: 'bookings' | 'history'; 
  size?: 'sm' | 'md'; 
}

const DropdownFilterButton: React.FC<DropdownFilterButtonProps> = ({
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  className = '',
  section = 'bookings', 
  size = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const selected = options.find(opt => opt.value === value);

  
  const sectionClass = section === 'history'
    ? 'bg-green-100 border-green-400 text-green-800 focus:ring-green-300 dark:bg-green-900 dark:border-green-600 dark:text-green-300 dark:focus:ring-green-500'
    : 'bg-blue-100 border-blue-400 text-blue-800 focus:ring-blue-300 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300 dark:focus:ring-blue-500';
  const baseBtn = 'w-full flex items-center justify-between rounded-xl font-medium focus:outline-none transition-all';
  const sizeBtn = size === 'sm' ? 'px-2 py-2 text-xs' : 'px-4 py-2.5 text-sm';
  const btnClass = `${baseBtn} ${sectionClass} ${sizeBtn}`;
  const dropdownClass = `${sectionClass} rounded-xl shadow-lg py-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={btnClass}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-right flex-1">{selected ? selected.label : placeholder}</span>
        <span className="ml-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="9,13 4,7 14,7" fill="currentColor" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </svg>
        </span>
      </button>
      {open && (
        <div
          ref={listRef}
          className={`absolute z-50 mt-2 w-full ${dropdownClass}`}
          tabIndex={-1}
        >
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-4 py-2 cursor-pointer rounded-lg transition-all ${value === opt.value ? (section === 'history' ? 'bg-green-400 text-white dark:bg-green-600' : 'bg-blue-400 text-white dark:bg-blue-600') : (section === 'history' ? 'hover:bg-green-200 dark:hover:bg-green-800' : 'hover:bg-blue-200 dark:hover:bg-blue-800')}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownFilterButton; 