import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};


const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    
    setTimeout(() => setIsVisible(true), 50);

    
    if (!notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        handleRemove();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5" };
    switch (notification.type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info {...iconProps} className="w-5 h-5 text-blue-500" />;
      default:
        return <Info {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
        max-w-sm w-full border rounded-lg shadow-lg p-4 pointer-events-auto
      `}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {notification.message}
          </p>
          {notification.action && (
            <div className="mt-2">
              <button
                onClick={notification.action.onClick}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      
      {}
      <div 
        className="fixed top-4 right-4 z-50 flex flex-col space-y-4 pointer-events-none"
        style={{ maxHeight: '80vh', overflow: 'hidden' }}
      >
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};


export const useNotificationHelpers = () => {
  const { addNotification } = useNotification();

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 8000, 
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};