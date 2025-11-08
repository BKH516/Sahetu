import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/axios';
import { API_CONFIG } from '../config/api.config';
import type { AppNotification, NotificationStats } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST);
      
      const notificationsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setNotifications(notificationsData);
      
      // حساب الإحصائيات
      const unreadCount = notificationsData.filter((n: AppNotification) => !n.read_at).length;
      setStats({
        total: notificationsData.length,
        unread: unreadCount
      });
    } catch (err: any) {
      // تجاهل خطأ 404 بصمت (الـ endpoint غير متوفر)
      if (err.response?.status === 404) {
        setNotifications([]);
        setStats({ total: 0, unread: 0 });
        setError(null);
        return;
      }
      
      // فقط سجل الأخطاء الأخرى
      if (err.response?.status !== 404) {
        console.error('Error fetching notifications:', err);
        setError(err.response?.data?.message || 'فشل في جلب الإشعارات');
      }
      setNotifications([]);
      setStats({ total: 0, unread: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل الإشعارات عند أول استخدام
  useEffect(() => {
    fetchNotifications();
    
    // تحديث الإشعارات كل 30 ثانية (مع تحسينات للأداء)
    let interval: NodeJS.Timeout;
    let isPageVisible = !document.hidden;
    
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        // تحديث فوري عند عودة المستخدم للصفحة
        fetchNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    interval = setInterval(() => {
      // تحديث فقط إذا كانت الصفحة مرئية (لا تحديث في الخلفية)
      if (isPageVisible && !document.hidden) {
        fetchNotifications();
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  // تحديد إشعار كمقروء
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(':id', notificationId.toString());
      await api.post(endpoint);
      
      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      
      // تحديث الحالة المحلية
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, []);

  // حذف إشعار
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE.replace(':id', notificationId.toString());
      await api.delete(endpoint);
      
      // تحديث الحالة المحلية
      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.read_at;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setStats(prev => ({
        total: prev.total - 1,
        unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread
      }));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [notifications]);

  return {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};


