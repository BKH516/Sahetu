import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, Check, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from '../../utils/utils';
import type { AppNotification } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { notifications, stats, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getNotificationIcon = (type: AppNotification['type']) => {
    const iconProps = { size: 16, className: 'flex-shrink-0' };
    
    switch (type) {
      case 'reservation':
        return <span className="text-blue-500">📋</span>;
      case 'service':
        return <span className="text-green-500">🏥</span>;
      case 'schedule':
        return <span className="text-purple-500">📅</span>;
      case 'approval':
        return <span className="text-yellow-500">✅</span>;
      case 'system':
      default:
        return <span className="text-gray-500">🔔</span>;
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 animate-slide-down overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-cyan-600 dark:text-cyan-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            الإشعارات
          </h3>
          {stats.unread > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {stats.unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stats.unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title="تحديد الكل كمقروء"
            >
              <CheckCheck size={16} />
              <span className="hidden sm:inline">تحديد الكل</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
            <Bell size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">{t('notifications.noNotifications')}</p>
            <p className="text-xs mt-1">{t('notifications.noNotificationsDesc')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  !notification.read_at
                    ? 'bg-cyan-50/50 dark:bg-cyan-900/10 border-r-4 border-cyan-500'
                    : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} />
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at))}
                        </span>
                      </div>
                      {!notification.read_at && (
                        <span className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                          جديد
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
          <button className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors">
            {t('notifications.viewAll') || 'عرض جميع الإشعارات'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;


