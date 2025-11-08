import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, LogOut, Bell, User as UserIcon } from 'lucide-react';
import { useDoctorProfile } from '../../hooks/useDoctorProfile';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import { translateName } from '../../utils/translate';

interface NavbarProps {
  onLogout: () => void;
  onMenuClick: () => void;
  userFullName?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = React.memo(({ onLogout, onMenuClick, userFullName, activeTab, onTabChange }) => {
  const { t, i18n } = useTranslation();
  const isRTL = useMemo(() => i18n.language === 'ar', [i18n.language]);

  const navItems = useMemo(() => [
    { key: 'overview', label: t('dashboard.main'), icon: '🏠' },
    { key: 'services', label: t('dashboard.services'), icon: '🏥' },
    { key: 'schedule', label: t('dashboard.scheduleShort'), icon: '📅' },
    { key: 'reservations', label: t('dashboard.reservations'), icon: '📋' },
    { key: 'history', label: t('dashboard.historyShort'), icon: '📊' },
    { key: 'profile', label: t('dashboard.profileShort'), icon: '👤' }
  ], [t]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const { profileData } = useDoctorProfile();
  const { stats } = useNotifications();
  const [translatedName, setTranslatedName] = useState<string>('');

  const toggleNotifications = useCallback(() => {
    setShowNotifications(prev => !prev);
  }, []);

  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  // Get raw name from profile data
  const getRawName = (): string => {
    if (!profileData) return '';
    
    const notSpecified = t('profile.notSpecified');
    
    // Helper function to get name from object
    const getNameFromObject = (obj: any): string | null => {
      if (!obj) return null;
      
      // Try language-specific names first
      if (obj.full_name_ar) return obj.full_name_ar;
      if (obj.full_name_en) return obj.full_name_en;
      
      // Fallback to full_name
      if (obj.full_name && obj.full_name !== notSpecified) return obj.full_name;
      if (obj.name && obj.name !== notSpecified) return obj.name;
      
      return null;
    };
    
    // Check hospital name
    const hospitalName = getNameFromObject(profileData.hospital);
    if (hospitalName) return hospitalName;
    
    // Check doctor name
    const doctorName = getNameFromObject(profileData.doctor);
    if (doctorName) return doctorName;
    
    // Check account/user name
    const accountName = getNameFromObject(profileData.account);
    if (accountName) return accountName;
    
    // Fallback to direct properties
    const fullName = profileData.full_name || profileData.name;
    if (fullName && fullName !== notSpecified && fullName !== 'دكتور بدون اسم') {
      return fullName;
    }
    
    return '';
  };

  // Translate name based on current language
  useEffect(() => {
    const rawName = getRawName();
    if (!rawName) {
      setTranslatedName('');
      return;
    }

    const currentLang = i18n.language as 'ar' | 'en';
    
    // Translate name asynchronously
    translateName(rawName, currentLang)
      .then(translated => {
        setTranslatedName(translated);
      })
      .catch(error => {
        console.warn('Translation error in Navbar:', error);
        // Fallback to original name if translation fails
        setTranslatedName(rawName);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, i18n.language]);

  const getDisplayName = () => {
    return translatedName || getRawName();
  };

  const displayName = getDisplayName();
  const formattedName = !displayName
    ? ''
    : displayName.includes(t('profile.hospitalManagement')) || displayName.includes('إدارة') 
    ? displayName 
    : isRTL ? `د. ${displayName}` : `Dr. ${displayName}`;

  return (
    <header className={`w-full h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm z-50 fixed top-0 ${isRTL ? 'right-0' : 'left-0'} animate-slide-down`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Right Section - Menu & User */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
              onClick={onMenuClick}
              aria-label={t('dashboard.openSidebar')}
            >
              <Menu size={24} />
            </button>

            {/* User Info */}
            {formattedName && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <UserIcon size={16} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {formattedName}
                </span>
              </div>
            )}
          </div>

          {/* Center Section - Navigation Items (Always visible on md+) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-1 justify-center max-w-3xl mx-4">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onTabChange && onTabChange(item.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTab === item.key
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:scale-105'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Left Section - Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="hidden sm:flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 relative group"
                aria-label={t('dashboard.notifications')}
              >
                <Bell size={20} />
                {stats.unread > 0 && (
                  <>
                    <span className={`absolute ${isRTL ? 'top-1 right-1' : 'top-1 left-1'} w-2 h-2 bg-red-500 rounded-full animate-pulse`}></span>
                    <span className={`absolute -top-1 ${isRTL ? '-right-1' : '-left-1'} bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                      {stats.unread > 9 ? '9+' : stats.unread}
                    </span>
                  </>
                )}
                <span className={`absolute -bottom-8 ${isRTL ? 'right-0' : 'left-0'} bg-gray-800 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                  {t('dashboard.notifications')}
                </span>
              </button>
              <NotificationDropdown 
                isOpen={showNotifications} 
                onClose={closeNotifications} 
              />
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 rounded-xl transition-all duration-300 font-semibold text-sm shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 active:scale-95 relative group"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('dashboard.logout')}</span>
              <span className={`sm:hidden absolute -bottom-8 ${isRTL ? 'right-0' : 'left-0'} bg-gray-800 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                {t('dashboard.logoutButton')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
