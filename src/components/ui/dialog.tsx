import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>{children}</h2>
);

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 dark:text-gray-400 mt-2 ${className}`}>{children}</p>
);

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>
); 