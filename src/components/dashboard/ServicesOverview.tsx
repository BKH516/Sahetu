import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Clock, DollarSign, Plus, Edit, TrendingUp, ChevronRight, Package } from 'lucide-react';
import api from '../../lib/axios';
import { DoctorService } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ServicesOverviewProps {
  onNavigate: (tab: string) => void;
}

const ServicesOverview: React.FC<ServicesOverviewProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [services, setServices] = useState<DoctorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/api/doctor/services');
      const apiData = res.data;
      const servicesArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setServices(servicesArray);
    } catch (err: any) {
      setError('تعذر تحميل الخدمات');
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
          onClick={fetchServices}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const displayServices = services.slice(0, 3);
  const totalPrice = services.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
  const averagePrice = services.length > 0 ? totalPrice / services.length : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex-1">
          <div className={`flex items-center gap-3 ${i18n.language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <Stethoscope className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={28} />
            <div className={`flex-1 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('services.availableServices') || 'الخدمات المتاحة'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('services.medicalServicesDesc') || 'الخدمات الطبية التي تقدمها'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigate('services')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md"
          >
            <Plus size={16} />
            {t('common.add')}
          </button>
          <button
            onClick={() => onNavigate('services')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 font-medium text-sm hover:scale-105 shadow-md"
          >
            <Edit size={16} />
            {t('common.edit')}
          </button>
        </div>
      </div>

      {displayServices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg font-medium">{t('services.noServices')}</p>
          <button
            onClick={() => onNavigate('services')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus size={20} />
            {t('services.addService')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayServices.map((service, index) => (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-xl p-5 border-2 border-gray-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-gray-600/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 dark:bg-blue-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Service Icon */}
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {typeof service.name === 'string' ? service.name : t('services.serviceWithoutName') || 'خدمة بدون اسم'}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => onNavigate('services')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 shadow-md"
                  >
                    <Edit size={18} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* Service Details */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {typeof service.price === 'string' || typeof service.price === 'number' 
                        ? parseFloat(service.price.toString()).toLocaleString() 
                        : '0'} {i18n.language === 'ar' ? 'ل.س' : 'SYR'}
                    </span>
                  </div>
                  
                  {service.duration && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {service.duration} {t('services.minutes') || 'دقيقة'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Stats Summary */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('services.totalServices') || 'إجمالي الخدمات'}</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{services.length}</p>
                </div>
                <Package className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('services.averagePrice') || 'متوسط السعر'}</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {averagePrice.toLocaleString(undefined, {maximumFractionDigits: 0})} 
                    <span className="text-sm font-normal mr-1">{i18n.language === 'ar' ? 'ل.س' : 'SYR'}</span>
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-600 dark:text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* View All Button */}
          {services.length > 3 && (
            <button
              onClick={() => onNavigate('services')}
              className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 rounded-xl transition-all duration-300 font-medium hover:shadow-md group"
            >
              <span>{t('services.viewAllServices') || 'عرض جميع الخدمات'} ({services.length})</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesOverview;
