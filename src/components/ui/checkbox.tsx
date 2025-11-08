import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      ref={(el) => {
        if (el) {
          el.indeterminate = indeterminate;
        }
      }}
      className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${className}`}
    />
  );
}; 