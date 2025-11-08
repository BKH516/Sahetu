import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ScheduleOverview from './ScheduleOverview';
import ServicesOverview from './ServicesOverview';
import ReservationsOverview from './ReservationsOverview';
import { useAuthStore } from '../../store/auth.store';
import { useDoctorProfile } from '../../hooks';
import { translateName } from '../../utils/translate';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
  userFullName?: string;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate, userFullName }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { profileData, loading: profileLoading } = useDoctorProfile();
  const [doctorData, setDoctorData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [translatedName, setTranslatedName] = useState<string>('');

  
  const getSpecializationText = (specialization: any): string => {
    if (!specialization) return t('profile.notSpecified');
    const isRTL = i18n.language === 'ar';
    
    if (typeof specialization === 'string') return specialization;
    if (typeof specialization === 'object') {
      // Prefer language-specific name based on current language
      if (isRTL && specialization.name_ar) return specialization.name_ar;
      if (!isRTL && specialization.name_en) return specialization.name_en;
      // Fallback to other language if preferred not available
      if (specialization.name_ar) return specialization.name_ar;
      if (specialization.name_en) return specialization.name_en;
      if (specialization.name) return specialization.name;
      if (Array.isArray(specialization) && specialization.length > 0) {
        const first = specialization[0];
        if (typeof first === 'string') return first;
        // Prefer language-specific name based on current language
        if (isRTL && first.name_ar) return first.name_ar;
        if (!isRTL && first.name_en) return first.name_en;
        // Fallback to other language if preferred not available
        if (first.name_ar) return first.name_ar;
        if (first.name_en) return first.name_en;
        if (first.name) return first.name;
      }
    }
    return t('profile.notSpecified');
  };

  useEffect(() => {
    
    if (profileData) {
      setUserData(profileData);
      
      
      if (profileData.hospital) {
        setDoctorData({
          id: profileData.hospital.id,
          account_id: profileData.id,
          specialization: t('profile.hospitalManagement'),
          address: profileData.hospital.address || t('profile.notSpecified'),
          age: 0,
          gender: 'male',
          instructions_before_booking: null,
          profile_description: t('profile.hospitalManager'),
          created_at: profileData.hospital.created_at,
          updated_at: profileData.hospital.updated_at
        });
      } else if (profileData.doctor) {
        setDoctorData(profileData.doctor);
      } else {
        setDoctorData({
          id: 0,
          account_id: profileData.id || 0,
          specialization: t('profile.notSpecified'),
          address: t('profile.notSpecified'),
          age: 0,
          gender: 'male',
          instructions_before_booking: null,
          profile_description: t('profile.noDescription'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }, [profileData, t, i18n.language]);

  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 17) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  
  const getCurrentDate = () => {
    const now = new Date();
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString(locale, options);
  };


  // Get raw name from profile data
  const getRawName = (): string => {
    const notSpecified = t('profile.notSpecified');
    
    // Helper function to get name from object
    const getNameFromObject = (obj: any): string | null => {
      if (!obj) return null;
      
      // Try language-specific names first
      if (obj.full_name_ar) return obj.full_name_ar;
      if (obj.full_name_en) return obj.full_name_en;
      
      // Fallback to full_name
      if (obj.full_name && obj.full_name !== notSpecified) return obj.full_name;
      
      return null;
    };
    
    // Check hospital name
    const hospitalName = getNameFromObject(userData?.hospital);
    if (hospitalName) return hospitalName;
    
    // Check doctor name
    const doctorName = getNameFromObject(userData?.doctor);
    if (doctorName) return doctorName;
    
    // Check account/user name
    const accountName = getNameFromObject(userData);
    if (accountName) return accountName;
    
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
    
    // If name is already in the target language, use it directly
    // Otherwise, translate it
    translateName(rawName, currentLang)
      .then(translated => {
        setTranslatedName(translated);
      })
      .catch(error => {
        console.warn('Translation error:', error);
        // Fallback to original name if translation fails
        setTranslatedName(rawName);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, i18n.language]);

  const getDisplayName = () => {
    return translatedName || getRawName();
  };

  
  const getSpecialization = () => {
    if (doctorData?.specialization) {
      const result = getSpecializationText(doctorData.specialization);
      return result;
    }
    if (userData?.hospital) {
      return t('profile.hospitalManagement');
    }
    if (userData?.doctor?.specialization) {
      const result = getSpecializationText(userData.doctor.specialization);
      return result;
    }
    if (user?.doctor?.specialization) {
      const result = getSpecializationText(user.doctor.specialization);
      return result;
    }
    if (user?.hospital) {
      return t('profile.hospitalManagement');
    }
    return t('profile.notSpecified');
  };

  // Helper function to format greeting with name
  const formatGreeting = () => {
    const greeting = getGreeting();
    const displayName = getDisplayName();
    if (displayName) {
      // Use appropriate separator based on language
      const separator = i18n.language === 'ar' ? '، ' : ', ';
      return `${greeting}${separator}${displayName}`;
    }
    return greeting;
  };

  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6">
      {}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-3xl">
        {}
        <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-32 h-32 bg-white/10 rounded-full ${isRTL ? '-translate-y-16 translate-x-16' : '-translate-y-16 -translate-x-16'} animate-pulse`}></div>
        <div className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-24 h-24 bg-white/10 rounded-full ${isRTL ? 'translate-y-12 -translate-x-12' : 'translate-y-12 translate-x-12'} animate-pulse`} style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        
        <div className="relative z-10">
        <div className={`flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 lg:gap-8 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
            {}
            <div className={`flex-1 w-full ${isRTL ? 'text-center lg:text-right' : 'text-center lg:text-left'}`}>
              <div className="mb-4 lg:mb-5 space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight animate-fade-in">
                  {formatGreeting()}
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-cyan-100 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  {getSpecialization() !== t('profile.notSpecified') ? 
                    (getSpecialization().includes(t('profile.hospitalManagement')) ? getSpecialization() : `${t('dashboard.specializationLabel')} ${getSpecialization()}`) : 
                    t('dashboard.welcomeMessage')}
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-cyan-200 opacity-90 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  {getCurrentDate()}
                </p>
              </div>
              
              {}
              <div className={`flex flex-wrap gap-2 lg:gap-3 ${isRTL ? 'justify-center lg:justify-end' : 'justify-center lg:justify-start'}`}>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 lg:px-5 lg:py-2.5 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2">
                  <span className="text-lg lg:text-xl">🏥</span>
                  <span className="font-medium text-xs sm:text-sm lg:text-base">{t('dashboard.platformName')}</span>
                </div>
                <div className="group cursor-pointer" onClick={() => onNavigate('services')}>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 lg:px-5 lg:py-2.5 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                    <span className="text-lg lg:text-xl">📱</span>
                    <span className="font-medium text-xs sm:text-sm lg:text-base">{t('dashboard.servicesManagement')}</span>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 lg:px-5 lg:py-2.5 border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2">
                  <span className="text-lg lg:text-xl">⚡</span>
                  <span className="font-medium text-xs sm:text-sm lg:text-base">{t('overview.performanceSpeed')}</span>
                </div>
              </div>
            </div>

            {}
            <div className="flex-shrink-0">
              <div className={`w-24 h-24 lg:w-36 lg:h-36 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer ${isRTL ? 'lg:order-first' : ''}`}>
                <span className="text-4xl lg:text-6xl">👨‍⚕️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <ScheduleOverview onNavigate={onNavigate} />
        </div>
        <div className="transform transition-all duration-300 hover:scale-[1.02]">
          <ServicesOverview onNavigate={onNavigate} />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 gap-6">
        <div className="transform transition-all duration-300 hover:scale-[1.01]">
          <ReservationsOverview onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview; 