import React from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, CalendarIcon, ClockIcon, CogIcon, DocumentTextIcon, UserIcon, HomeIcon } from "../ui/Icons";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'overview' | 'services' | 'schedule' | 'reservations' | 'history' | 'profile';
  onTabChange: (tab: 'overview' | 'services' | 'schedule' | 'reservations' | 'history' | 'profile') => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange 
}) => {
  const { t } = useTranslation();
  
  const menuItems = [
    { 
      id: 'overview', 
      label: t('dashboard.main'), 
      icon: HomeIcon,
      activeColor: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-700'
    },
    { 
      id: 'services', 
      label: t('dashboard.services'), 
      icon: CogIcon,
      activeColor: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-700'
    },
    { 
      id: 'schedule', 
      label: t('dashboard.schedule'), 
      icon: ClockIcon,
      activeColor: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-700'
    },
    { 
      id: 'reservations', 
      label: t('dashboard.reservations'), 
      icon: CalendarIcon,
      activeColor: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-700'
    },
    { 
      id: 'history', 
      label: t('dashboard.history'), 
      icon: DocumentTextIcon,
      activeColor: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-700'
    },
    { 
      id: 'profile', 
      label: t('dashboard.profile'), 
      icon: UserIcon,
      activeColor: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-700'
    },
  ];

  return (
    <>
      {}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {}
      <div className={`
        fixed top-0 right-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full w-full relative bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700 shadow-lg">
          {}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-lg transition-colors duration-200 ease-in-out text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
          
          {}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 pt-16">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">ص</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('dashboard.platformName')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.platformNameShort') || 'المنصة الموثوقة'}</p>
              </div>
            </div>
          </div>

          {}
          <nav className="mt-6 px-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onTabChange(item.id as MobileSidebarProps["activeTab"]);
                        onClose();
                      }}
                      className={`
                        w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg
                        transition-all duration-200 ease-in-out text-right
                        ${isActive 
                          ? `bg-gradient-to-l ${item.activeColor} text-white shadow-lg` 
                          : `text-gray-600 dark:text-gray-300 ${item.hoverColor} hover:text-gray-900 dark:hover:text-gray-100`
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar; 