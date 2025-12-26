import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const animationFrameRef = useRef<number>();
  const progressStartRef = useRef<number>();
  const autoDismissDuration =
    notification.persistent || notification.duration === 0
      ? undefined
      : notification.duration || 5000;

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 40);

    if (autoDismissDuration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, autoDismissDuration);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(timer);
      };
    }

    return () => {
      clearTimeout(showTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoDismissDuration) {
      setProgress(100);
      return;
    }

    const tick = (timestamp: number) => {
      if (!progressStartRef.current) {
        progressStartRef.current = timestamp;
      }
      const elapsed = timestamp - progressStartRef.current;
      const nextProgress = Math.max(0, 100 - (elapsed / autoDismissDuration) * 100);
      setProgress(nextProgress);
      if (nextProgress > 0 && !isLeaving) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoDismissDuration, isLeaving]);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 280);
  }, [notification.id, onRemove]);

  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5' };
    switch (notification.type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  const getPalette = () => {
    switch (notification.type) {
      case 'success':
        return {
          accent: 'bg-emerald-500',
          iconWrapper: 'bg-emerald-500/15 text-emerald-500',
          shadow: 'ring-emerald-400/25',
          progressBar: 'bg-emerald-500'
        };
      case 'error':
        return {
          accent: 'bg-rose-500',
          iconWrapper: 'bg-rose-500/15 text-rose-500',
          shadow: 'ring-rose-400/25',
          progressBar: 'bg-rose-500'
        };
      case 'warning':
        return {
          accent: 'bg-amber-500',
          iconWrapper: 'bg-amber-500/15 text-amber-500',
          shadow: 'ring-amber-400/25',
          progressBar: 'bg-amber-500'
        };
      case 'info':
      default:
        return {
          accent: 'bg-sky-500',
          iconWrapper: 'bg-sky-500/15 text-sky-500',
          shadow: 'ring-sky-400/25',
          progressBar: 'bg-sky-500'
        };
    }
  };

  const palette = getPalette();
  const isRTL = i18n.dir() === 'rtl';

  return (
    <div
      className={`relative w-full max-w-md pointer-events-auto transition-all duration-400 ease-[cubic-bezier(.21,1.02,.73,1)] ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : isRTL
          ? '-translate-x-full opacity-0'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-white/90 shadow-xl backdrop-blur dark:bg-gray-900/90 ${palette.shadow}`}
      >
        <span
          className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-0 h-full w-1 ${palette.accent}`}
        />

        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-start gap-4 px-5 py-4">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-inner ${palette.iconWrapper}`}
          >
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {notification.message}
                </p>
                {notification.action && (
                  <div className="mt-3">
                    <button
                      onClick={notification.action.onClick}
                      className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 transition-colors hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      <span>{notification.action.label}</span>
                      <span aria-hidden>↗</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleRemove}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100/80 hover:text-gray-600 dark:hover:bg-gray-800/70 dark:hover:text-gray-200"
                aria-label={t('notifications.close', { defaultValue: 'إغلاق الإشعار' })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {autoDismissDuration && (
          <div className="h-1.5 w-full bg-gray-200/80 dark:bg-gray-800/70">
            <div
              className={`h-full transition-[width] duration-100 ease-linear ${palette.progressBar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { i18n } = useTranslation();

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
      
      <div
        className={`fixed top-4 z-50 flex max-h-[80vh] flex-col space-y-4 overflow-hidden pointer-events-none ${
          i18n.dir() === 'rtl' ? 'left-4 right-auto items-start' : 'right-4 left-auto items-end'
        }`}
        aria-live="polite"
        aria-atomic="true"
        role="region"
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
