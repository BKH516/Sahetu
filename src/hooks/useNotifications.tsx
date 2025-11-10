import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { api } from '../lib/axios';
import { API_CONFIG } from '../config/api.config';
import type { AppNotification, NotificationStats } from '../types';

interface FetchNotificationsOptions {
  silent?: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  stats: NotificationStats;
  loading: boolean;
  error: string | null;
  fetchNotifications: (options?: FetchNotificationsOptions) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateFromPayload = useCallback((payload: AppNotification[]) => {
    if (!isMountedRef.current) {
      return;
    }

    setNotifications(payload);
    const unreadCount = payload.filter(notification => !notification.read_at).length;
    setStats({
      total: payload.length,
      unread: unreadCount
    });
  }, []);

  const fetchNotifications = useCallback(
    async (options: FetchNotificationsOptions = {}) => {
      if (!options.silent) {
        setLoading(true);
      }

      setError(null);
      isFetchingRef.current = true;

      try {
        const response = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
        const notificationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        updateFromPayload(notificationsData);
      } catch (err: any) {
        if (err.response?.status === 404) {
          updateFromPayload([]);
          setError(null);
          return;
        }

        console.error('Error fetching notifications:', err);
        updateFromPayload([]);
        setError(err.response?.data?.message || 'فشل في جلب الإشعارات');
      } finally {
        isFetchingRef.current = false;
        if (!options.silent && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [updateFromPayload]
  );

  useEffect(() => {
    fetchNotifications().catch(() => undefined);

    let interval: ReturnType<typeof setInterval> | undefined;
    let isPageVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        fetchNotifications({ silent: true }).catch(() => undefined);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    interval = setInterval(() => {
      if (typeof document !== 'undefined') {
        if (isPageVisible && !document.hidden) {
          fetchNotifications({ silent: true }).catch(() => undefined);
        }
      } else {
        fetchNotifications({ silent: true }).catch(() => undefined);
      }
    }, 30000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(
        ':id',
        notificationId.toString()
      );
      try {
        await api.post(endpoint);

        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        );

        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        }));
      } catch (err) {
        console.error('Error marking notification as read:', err);
        throw err;
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);

      const now = new Date().toISOString();
      setNotifications(prev => prev.map(notification => ({ ...notification, read_at: now })));
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: number) => {
    const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE.replace(
      ':id',
      notificationId.toString()
    );

    try {
      await api.delete(endpoint);

      let removedNotification: AppNotification | undefined;

      setNotifications(prev => {
        removedNotification = prev.find(notification => notification.id === notificationId);
        return prev.filter(notification => notification.id !== notificationId);
      });

      setStats(prev => ({
        total: Math.max(0, prev.total - 1),
        unread:
          removedNotification && !removedNotification.read_at
            ? Math.max(0, prev.unread - 1)
            : prev.unread
      }));
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  const contextValue = useMemo<NotificationsContextType>(
    () => ({
      notifications,
      stats,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification
    }),
    [notifications, stats, loading, error, fetchNotifications, markAsRead, markAllAsRead, deleteNotification]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
};


