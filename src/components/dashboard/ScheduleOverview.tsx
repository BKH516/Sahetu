import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Edit, Plus, ChevronRight, Sun, Moon } from 'lucide-react';
import api from '../../lib/axios';
import { DoctorWorkSchedule } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ScheduleOverviewProps {
  onNavigate: (tab: string) => void;
}

const ScheduleOverview: React.FC<ScheduleOverviewProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [schedule, setSchedule] = useState<DoctorWorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dayMap: Record<string, string> = {
    saturday: t('schedule.days.saturday'),
    sunday: t('schedule.days.sunday'),
    monday: t('schedule.days.monday'),
    tuesday: t('schedule.days.tuesday'),
    wednesday: t('schedule.days.wednesday'),
    thursday: t('schedule.days.thursday'),
    friday: t('schedule.days.friday'),
  };

  const dayIcons: Record<string, React.ReactNode> = {
    saturday: "🌅",
    sunday: "☀️",
    monday: "🌤️",
    tuesday: "⛅",
    wednesday: "🌥️",
    thursday: "🌦️",
    friday: "🌙",
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/api/doctor/schedules');
      const apiData = res.data;
      const scheduleArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setSchedule(scheduleArray);
    } catch (err: any) {
      setError('تعذر تحميل الجدول الزمني');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <button
          onClick={fetchSchedule}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const dayOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const sortedSchedule = [...schedule].sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week));
  const displaySchedule = sortedSchedule.slice(0, 3);

  const todayEn = dayOrder[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const isRTL = i18n.language === 'ar';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in">
      {/* Header */}
      <div className={`flex flex-col ${isRTL ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-start sm:items-center justify-between mb-6 gap-4`}>
        <div className="flex-1">
          <div className={`flex items-center gap-3 flex-wrap sm:flex-nowrap ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
            <div className="flex-shrink-0">
              <Calendar className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('schedule.workingHours') || 'أوقات الدوام'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('schedule.weeklyScheduleDesc') || 'جدول مواعيد العمل الأسبوعي'}
              </p>
            </div>
          </div>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse sm:flex-row-reverse' : 'flex-row sm:flex-row'}`}>
          <button
            onClick={() => onNavigate('schedule')}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <Plus size={16} />
            {t('schedule.addAppointment') || t('common.add')}
          </button>
          <button
            onClick={() => onNavigate('schedule')}
            className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <Edit size={16} />
            {t('common.edit')}
          </button>
        </div>
      </div>

      {displaySchedule.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg font-medium">{t('schedule.noSchedule')}</p>
          <button
            onClick={() => onNavigate('schedule')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus size={20} />
            {t('schedule.addWorkingHours') || 'إضافة أوقات دوام'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displaySchedule.map((item, index) => {
            const isToday = item.day_of_week === todayEn;
            
            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-lg ${
                  isToday
                    ? 'border-green-400 dark:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-green-300 dark:hover:border-green-700'
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Background Pattern */}
                <div className={`absolute top-0 left-0 w-20 h-20 ${isToday ? 'bg-green-200/30' : 'bg-gray-200/20'} dark:bg-white/5 rounded-full -translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500`}></div>
                
                {/* Content */}
                <div className={`relative flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                    {/* Day Icon */}
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${
                      isToday 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg' 
                        : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                    } group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-2xl">
                        {dayIcons[item.day_of_week] || '📅'}
                      </span>
                    </div>
                    
                    <div>
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                          {dayMap[item.day_of_week] || item.day_of_week}
                        </h3>
                        {isToday && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
                            {t('schedule.today') || 'اليوم'}
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-3 mt-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Sun className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{item.start_time}</span>
                        </div>
                        <span className="text-gray-400">{isRTL ? '←' : '→'}</span>
                        <div className={`flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Moon className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium">{item.end_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => onNavigate('schedule')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 shadow-md"
                  >
                    <Edit size={18} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* View All Button */}
          {sortedSchedule.length > 3 && (
            <button
              onClick={() => onNavigate('schedule')}
            className={`w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 rounded-xl transition-all	duration-300 font-medium hover:shadow-md group ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <span>{t('schedule.viewAllDays') || 'عرض جميع الأيام'} ({sortedSchedule.length})</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleOverview;
