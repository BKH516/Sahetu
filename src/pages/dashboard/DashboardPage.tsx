import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';

import Navbar from '../../components/dashboard/Navbar';
import MobileSidebar from '../../components/dashboard/MobileSidebar';
import DashboardOverview from '../../components/dashboard/DashboardOverview';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

import { cleanOldUserData } from '../../utils/userUtils';
import { useDoctorProfile } from '../../hooks';

// Lazy load heavy dashboard components
// Temporarily remove lazy loading for Service to fix language switching issue
import Service from '../../components/dashboard/Service';
const ScheduleTable = lazy(() => import('../../components/dashboard/ScheduleTable'));
const Reservations = lazy(() => import('../../components/dashboard/Reservations'));
const ReservationLog = lazy(() => import('../../components/dashboard/ReservationLog'));
const Profile = lazy(() => import('../../components/dashboard/Profile'));

type ActiveTab = 'overview' | 'services' | 'schedule' | 'reservations' | 'history' | 'profile';

const DashboardPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');
  
  const { profileData } = useDoctorProfile();

  
  useEffect(() => {
    cleanOldUserData();
  }, []);

  
  useEffect(() => {
    if (profileData) {
      const fullName = profileData.hospital?.full_name || 
                      profileData.doctor?.full_name || 
                      profileData.full_name || 
                      profileData.name || 
                      profileData.account?.full_name;
      
      if (fullName && fullName !== 'دكتور بدون اسم' && fullName !== 'غير محدد') {
        setUserFullName(fullName);
      }
    }
  }, [profileData]);

  
  const handleNavigate = useCallback((tab: string) => {
    if (tab === 'overview' || tab === 'services' || tab === 'schedule' || 
        tab === 'reservations' || tab === 'history' || tab === 'profile') {
      setActiveTab(tab as ActiveTab);
    }
  }, []);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleTabChangeWithClose = useCallback((tab: any) => {
    setActiveTab(tab as ActiveTab);
    setSidebarOpen(false);
  }, []);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview onNavigate={handleNavigate} userFullName={userFullName} />;
      case 'services':
        // Service is no longer lazy loaded, so we can use key directly
        return (
          <Service key={`service-${i18n.language}`} />
        );
      case 'schedule':
        return (
          <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
            <ScheduleTable />
          </Suspense>
        );
      case 'reservations':
        return (
          <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
            <Reservations />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
            <ReservationLog />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}>
            <Profile />
          </Suspense>
        );
      default:
        return <DashboardOverview onNavigate={handleNavigate} userFullName={userFullName} />;
    }
  }, [activeTab, handleNavigate, userFullName, i18n.language]);

  const tabInfo = useMemo(() => {
    switch (activeTab) {
      case 'overview':
        return null; 
      case 'services':
        return {
          title: t('dashboard.servicesManagement'),
          description: t('dashboard.servicesDescription'),
          icon: '🏥',
          color: 'from-blue-500 to-cyan-600'
        };
      case 'schedule':
        return {
          title: t('dashboard.scheduleTitle'),
          description: t('dashboard.scheduleDescription'),
          icon: '📅',
          color: 'from-green-500 to-emerald-600'
        };
      case 'reservations':
        return {
          title: t('dashboard.reservationsTitle'),
          description: t('dashboard.reservationsDescription'),
          icon: '📋',
          color: 'from-purple-500 to-indigo-600'
        };
      case 'history':
        return {
          title: t('dashboard.historyTitle'),
          description: t('dashboard.historyDescription'),
          icon: '📊',
          color: 'from-orange-500 to-red-600'
        };
      case 'profile':
        return null; 
      default:
        return null;
    }
  }, [activeTab, t]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-x-hidden">
      <Navbar 
        onLogout={onLogout} 
        onMenuClick={handleMenuClick} 
        userFullName={userFullName}
        activeTab={activeTab}
        onTabChange={handleNavigate}
      />

      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose}
        activeTab={activeTab as any}
        onTabChange={handleTabChangeWithClose}
      />

      <div className="flex-1 flex flex-col pt-20">
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-900">
          {tabInfo && (
            <div className={`bg-gradient-to-r ${tabInfo.color} text-white shadow-xl w-full relative overflow-hidden`}>
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-3xl"></div>
              
              <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7">
                {i18n.language === 'ar' ? (
                  <div className="flex items-center gap-4 sm:gap-5 lg:gap-6 justify-end" dir="rtl">
                    <div className="text-3xl sm:text-4xl lg:text-5xl flex-shrink-0 drop-shadow-lg transform hover:scale-110 transition-transform duration-300">
                      {tabInfo.icon}
                    </div>
                    <div className="flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2 sm:mb-3 text-right drop-shadow-md">
                        {tabInfo.title}
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg opacity-95 leading-relaxed text-right font-medium">
                        {tabInfo.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 sm:gap-5 lg:gap-6 justify-start" dir="ltr">
                    <div className="text-3xl sm:text-4xl lg:text-5xl flex-shrink-0 drop-shadow-lg transform hover:scale-110 transition-transform duration-300">
                      {tabInfo.icon}
                    </div>
                    <div className="flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2 sm:mb-3 text-left drop-shadow-md">
                        {tabInfo.title}
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg opacity-95 leading-relaxed text-left font-medium">
                        {tabInfo.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {}
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col overflow-x-hidden">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage; 