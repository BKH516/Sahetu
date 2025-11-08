import React, { forwardRef, useCallback } from 'react';
import { cn } from '../../utils/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  section?: 'auth' | 'dashboard' | 'general' | 'history' | 'bookings';
}

const Button = React.memo(forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'default',
  size = 'default',
  section = 'general',
  children,
  disabled,
  onClick,
  ...props
}, ref) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
  }, [disabled, onClick]);

  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };

  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  };

  const sectionClasses = {
    auth: 'bg-cyan-600 hover:bg-cyan-700 text-white font-bold',
    dashboard: 'bg-gray-800 hover:bg-gray-900 text-white dark:bg-gray-700 dark:hover:bg-gray-600',
    general: '',
    history: 'bg-orange-600 hover:bg-orange-700 text-white font-bold',
    bookings: 'bg-purple-600 hover:bg-purple-700 text-white font-bold'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        sectionClasses[section],
        className
      )}
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}));

Button.displayName = 'Button';

export { Button }; 