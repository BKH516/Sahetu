import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Clock, Calendar, User, Phone, Eye, TrendingUp, ChevronRight, CalendarCheck, AlertCircle, DollarSign } from 'lucide-react';
import api from '../../lib/axios';
import { Reservation } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { SimpleReservationStorage } from '../../utils/simpleStorage';

interface ReservationsOverviewProps {
  onNavigate: (tab: string) => void;
}

const ReservationsOverview: React.FC<ReservationsOverviewProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/api/doctor/reservations');
      const apiData = res.data;
      const reservationsArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setReservations(reservationsArray);
    } catch (err: any) {
      setError(t('reservations.loadError') || t('common.loading'));
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
          onClick={fetchReservations}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }
  
  // Helpers
  const formatNumberEn = (value: number): string => {
    return Number(value || 0).toLocaleString('en-US');
  };

  // Calculate statistics
  const today = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(res => res.date === today);
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyReservations = reservations.filter(res => {
    const resDate = new Date(res.date);
    return resDate >= weekAgo;
  });

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const monthlyReservations = reservations.filter(res => {
    const resDate = new Date(res.date);
    return resDate >= monthAgo;
  });

  const approvedReservations = reservations.filter(res => res.status === 'approved');
  const cancelledReservations = reservations.filter(res => res.status === 'cancelled');
  const pendingReservations = reservations.filter(res => res.status === 'pending');
  const completedReservations = reservations.filter(res => res.status === 'completed');

  // Calculate total revenue using doctor_service.price (string) for approved/completed reservations
  const parsePriceToNumber = (price: any): number => {
    if (price == null) return 0;
    try {
      const normalized = String(price).replace(/[^0-9.]/g, '');
      const value = parseFloat(normalized);
      return isNaN(value) ? 0 : value;
    } catch {
      return 0;
    }
  };

  const totalRevenue = reservations
    .filter(res => res.status === 'approved' || res.status === 'completed')
    .reduce((sum, res) => sum + parsePriceToNumber(res.doctor_service?.price), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex-1">
          <div className={`flex items-center gap-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <CalendarCheck className="text-purple-600 dark:text-purple-400 flex-shrink-0" size={28} />
            <div className={`flex-1 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('reservations.statistics') || 'إحصائيات الحجوزات'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('reservations.statisticsDesc') || 'حالة وتفاصيل حجوزات المرضى'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('reservations')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md"
        >
          {t('common.viewAll') || 'عرض الكل'}
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Cancelled */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">{t('reservations.status.cancelled')}</p>
          <p className="text-3xl font-bold text-red-800 dark:text-red-300">{formatNumberEn(cancelledReservations.length)}</p>
                        </div>

        {/* Approved (Confirmed) */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">{t('reservations.status.approved')}</p>
          <p className="text-3xl font-bold text-green-800 dark:text-green-300">{formatNumberEn(approvedReservations.length)}</p>
                     </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2">{t('reservations.status.pending')}</p>
          <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-300">{formatNumberEn(pendingReservations.length)}</p>
        </div>

        {/* Total Reservations */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">{t('reservations.totalReservations') || 'إجمالي الحجوزات'}</p>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-300">{formatNumberEn(reservations.length)}</p>
            </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mb-2">{t('reservations.thisMonth') || 'هذا الشهر'}</p>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-300">{formatNumberEn(monthlyReservations.length)}</p>
          </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">{t('reservations.thisWeek') || 'هذا الأسبوع'}</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{formatNumberEn(weeklyReservations.length)}</p>
        </div>

        {/* Today's Reservations */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">{t('reservations.todayReservations') || 'حجوزات اليوم'}</p>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{formatNumberEn(todayReservations.length)}</p>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-xl p-4 border border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => onNavigate('reservations')}>
          <p className="text-sm font-medium text-teal-700 dark:text-teal-400 mb-2">{t('reservations.status.completed')}</p>
          <p className="text-3xl font-bold text-teal-800 dark:text-teal-300">{formatNumberEn(completedReservations.length)}</p>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-green-300 dark:border-green-700 shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">{t('reservations.totalRevenue') || 'إجمالي الإيرادات'}</p>
              <p className="text-3xl font-bold text-green-800 dark:text-green-300">{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {i18n.language === 'ar' ? 'ل.س' : 'SYR'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationsOverview; 
