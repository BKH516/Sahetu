import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, LayoutDashboard, Calendar, ClipboardList, BookOpen, User, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ activeTab, onTabChange }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

const navItems = [
  { 
    key: 'overview', 
      label: t('dashboard.overview'), 
    icon: Home,
    gradient: 'from-cyan-500 to-blue-600',
    hoverBg: 'hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-900/20 dark:hover:to-blue-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400'
  },
  { 
    key: 'services', 
      label: t('dashboard.services'), 
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-indigo-600',
    hoverBg: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  { 
    key: 'schedule', 
      label: t('dashboard.schedule'), 
    icon: Calendar,
    gradient: 'from-green-500 to-emerald-600',
    hoverBg: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  { 
    key: 'reservations', 
      label: t('dashboard.reservations'), 
    icon: ClipboardList,
    gradient: 'from-purple-500 to-pink-600',
    hoverBg: 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  { 
    key: 'history', 
      label: t('dashboard.history'), 
    icon: BookOpen,
    gradient: 'from-orange-500 to-red-600',
    hoverBg: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-900/20 dark:hover:to-red-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400'
  },
  { 
    key: 'profile', 
      label: t('dashboard.profile'), 
    icon: User,
    gradient: 'from-indigo-500 to-purple-600',
    hoverBg: 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400'
  },
];
  return (
    <aside className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-16 h-[calc(100vh-64px)] w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl ${isRTL ? 'border-l' : 'border-r'} border-gray-200/50 dark:border-gray-700/50 flex flex-col py-6 px-3 gap-2 overflow-y-auto z-40 animate-slide-left`}>
      {/* Navigation Items */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item, index) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;
          
          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden
                ${isActive
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient}/20 scale-[1.02]`
                  : `text-gray-700 dark:text-gray-300 ${item.hoverBg} hover:scale-[1.01]`}
              `}
              aria-current={isActive ? 'page' : undefined}
              style={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {/* Background Animation on Hover */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 dark:via-gray-700/50 to-transparent translate-x-full group-hover:translate-x-[-100%] transition-transform duration-700"></div>
              )}
              
              {/* Icon Container */}
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300
                ${isActive 
                  ? 'bg-white/20 backdrop-blur-sm shadow-inner' 
                  : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700'
                }
              `}>
                <Icon 
                  size={20} 
                  className={`transition-all duration-300 ${
                    isActive 
                      ? 'text-white' 
                      : `${item.iconColor} group-hover:scale-110`
                  }`}
                />
              </div>
              
              {/* Label */}
              <span className={`relative flex-1 truncate ${isRTL ? 'text-right' : 'text-left'}`}>{item.label}</span>
              
              {/* Active Indicator */}
              {isActive && (
                <ChevronRight 
                  size={18} 
                  className={`relative animate-pulse ${isRTL ? 'rotate-180' : ''}`} 
                />
              )}
              
              {/* Hover Indicator */}
              {!isActive && (
                <ChevronRight 
                  size={18} 
                  className={`relative opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${item.iconColor} ${isRTL ? 'rotate-180' : ''}`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('dashboard.platformName')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} {t('dashboard.copyright')}
          </p>
        </div>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
