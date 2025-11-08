import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  DollarSign,
  Activity,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/axios';
import { DoctorService, DoctorWorkSchedule, Reservation } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useDoctorProfile } from '../../hooks';
import { useTranslation } from 'react-i18next';

interface QuickStatsProps {
  onNavigate: (tab: string) => void;
}

const QuickStats: React.FC<QuickStatsProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    services: 0,
    scheduleDays: 0,
    activeReservations: 0,
    totalEarnings: 0,
    todayReservations: 0,
    weeklyReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { profileData } = useDoctorProfile();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (profileData) {
      fetchStats();
    }
  }, [profileData]);

  const fetchStats = async () => {
    try {
      const [servicesRes, scheduleRes, reservationsRes] = await Promise.all([
        api.get('/api/doctor/services'),
        api.get('/api/doctor/schedules'),
        api.get('/api/doctor/reservations')
      ]);

      const services = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const schedule = Array.isArray(scheduleRes.data) ? scheduleRes.data : [];
      const reservations = Array.isArray(reservationsRes.data) ? reservationsRes.data : [];
      
      const totalEarnings = services.reduce((sum: number, service: DoctorService) => {
        return sum + (parseFloat(service.price) || 0);
      }, 0);

      const today = new Date().toISOString().split('T')[0];
      const todayReservations = reservations.filter((res: Reservation) => {
        return res.appointment_date === today;
      }).length;

      const weeklyReservations = reservations.filter((res: Reservation) => {
        const resDate = new Date(res.appointment_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return resDate >= weekAgo;
      }).length;

      setStats({
        services: services.length,
        scheduleDays: schedule.length,
        activeReservations: reservations.length,
        totalEarnings,
        todayReservations,
        weeklyReservations
      });
    } catch (err: any) {
      setError('تعذر تحميل الإحصائيات');
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
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'الخدمات المتاحة',
      value: stats.services,
      icon: <Stethoscope size={24} />,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      onClick: () => onNavigate('services')
    },
    {
      title: 'أيام العمل',
      value: stats.scheduleDays,
      icon: <Calendar size={24} />,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      onClick: () => onNavigate('schedule')
    },
    {
      title: 'الحجوزات النشطة',
      value: stats.activeReservations,
      icon: <Users size={24} />,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      onClick: () => onNavigate('reservations')
    },
    {
      title: 'حجوزات اليوم',
      value: stats.todayReservations,
      icon: <Clock size={24} />,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      onClick: () => onNavigate('reservations')
    },
    {
      title: 'حجوزات الأسبوع',
      value: stats.weeklyReservations,
      icon: <Activity size={24} />,
      gradient: 'from-indigo-500 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
      onClick: () => onNavigate('reservations')
    },
    {
      title: 'إجمالي الأسعار',
      value: `${stats.totalEarnings.toLocaleString()}`,
    subValue: i18n.language === 'ar' ? 'ل.س' : 'SYR',
      icon: <DollarSign size={24} />,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      onClick: () => onNavigate('services')
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-cyan-600 dark:text-cyan-400" size={28} />
            إحصائيات سريعة
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            نظرة شاملة على نشاطك الطبي
          </p>
        </div>
        <button
          onClick={() => onNavigate('reservations')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md"
        >
          عرض التفاصيل
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className={`group relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:scale-[1.03]`}
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 dark:bg-white/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
            
            {/* Content */}
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                    {stat.subValue && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-1">
                        {stat.subValue}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <div className="text-white">
                    {stat.icon}
                  </div>
                </div>
              </div>
              
              {/* Action Hint */}
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>انقر للتفاصيل</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Bottom Line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right`}></div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="mt-6 p-5 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
              <TrendingUp className="text-cyan-600 dark:text-cyan-400" size={20} />
              ملخص الأداء
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              لديك <span className="font-bold text-cyan-600 dark:text-cyan-400">{stats.services}</span> خدمة متاحة 
              و <span className="font-bold text-cyan-600 dark:text-cyan-400">{stats.scheduleDays}</span> يوم عمل
              {stats.todayReservations > 0 && (
                <>, مع <span className="font-bold text-orange-600 dark:text-orange-400">{stats.todayReservations}</span> حجز اليوم</>
              )}
            </p>
          </div>
          <Activity className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
        </div>
      </div>
    </div>
  );
};

export default QuickStats; 
