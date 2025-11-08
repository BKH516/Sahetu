import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import StatisticsCard from './StatisticsCard';
import { CheckCircle, TrendingUp, XCircle, Info } from 'lucide-react';
import FilterBar from './FilterBar';
import api from '../../lib/axios';
import { Reservation } from '../../types';
import DropdownFilterButton from '../ui/DropdownFilterButton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { SimpleReservationStorage } from '../../utils/simpleStorage';

const ReservationLog: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [reservationLogs, setReservationLogs] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Reservation | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    setStorageReady(true);
    fetchReservations();
  }, []);

  // Listen for storage changes (when reservations are updated)
  useEffect(() => {
    const handleStorageChange = () => {
      fetchReservations();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/doctor/reservations');
      const apiData = res.data;
      const reservationsArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setReservationLogs(reservationsArray);
    } catch (err: any) {
      setReservationLogs([]); 
    } finally {
      setLoading(false);
    }
  };

  
  const filteredLogs = (() => {
    // Don't filter until storage is ready to prevent missing data
    if (!storageReady) return [];
    
    return reservationLogs.filter(log => {
      
      const allowedStatuses = ['completed', 'rejected'];
      const matchesStatus = allowedStatuses.includes(log.status) && (filterStatus === "all" || log.status === filterStatus);
      const matchesDate = filterDate === "all" || (log.date && log.date.includes(filterDate));
      
      // Get patient data from all sources (including localStorage)
      const localData = SimpleReservationStorage.get(log.id);
      const patientData = getPatientData(log, localData);
      
      const matchesSearch =
        (patientData.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.doctor_service?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patientData.phone_number || '').includes(searchTerm);
      return matchesStatus && matchesDate && matchesSearch;
    });
  })();

  
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  
  const getStatusText = (status: Reservation['status']) => {
    switch (status) {
      case 'completed': return t('reservations.status.completed');
      case 'cancelled': return t('reservations.status.cancelled');
      case 'rejected': return t('reservations.status.rejected');
      default: return status;
    }
  };

  
  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success dark:bg-success/20 dark:text-success-light';
      case 'cancelled': return 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger-light';
      case 'rejected': return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleShowPatientInfo = (reservation: Reservation) => {
    setSelectedPatient(reservation);
    setIsPatientModalOpen(true);
  };

  
  const totalCompleted = reservationLogs.filter(log => log.status === 'completed').length;
  const totalRejected = reservationLogs.filter(log => log.status === 'rejected').length;
  const totalRevenue = reservationLogs
    .filter(log => log.status === 'completed' && log.doctor_service?.price)
    .reduce((sum, log) => sum + Number(log.doctor_service?.price || 0), 0);

  if (loading || !storageReady) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <FilterBar>
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.search')}</label>
          <Input
            id="search"
            placeholder={t('history.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
        <DropdownFilterButton
          options={[
            { value: 'all', label: t('history.allStatuses') },
            { value: 'completed', label: t('history.completedStatus') },
            { value: 'rejected', label: t('reservations.status.rejected') },
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder={t('reservations.selectStatus')}
          className="min-w-[140px]"
          section="history"
          size="sm"
        />
        <div className="flex-1 min-w-[140px]">
          <Input
            placeholder={t('history.searchByDate')}
            value={filterDate === "all" ? "" : filterDate}
            onChange={(e) => setFilterDate(e.target.value || "all")}
            className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-end">
          <Button 
            onClick={() => {
              setSearchTerm("");
              setFilterStatus("all");
              setFilterDate("all");
            }}
            section="history"
            size="sm"
            variant="outline"
            className="w-full"
          >
            {t('common.reset')}
          </Button>
        </div>
      </FilterBar>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        <StatisticsCard
          icon={<CheckCircle className="text-green-600 dark:text-green-400" />}
          label={t('history.completedStatus')}
          value={totalCompleted}
          color="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
        />
        <StatisticsCard
          icon={<XCircle className="text-red-600 dark:text-red-400" />}
          label={t('reservations.status.rejected')}
          value={totalRejected}
          color="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
        />
        <StatisticsCard
          icon={<TrendingUp className="text-primary dark:text-primary-light" />}
          label={t('reservations.totalRevenue')}
          value={`${totalRevenue} ${t('reservations.currencyShort')}`}
          color="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
        />
      </div>

      {}
      {currentLogs.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl border border-gray-100 dark:border-zinc-800 fade-in pb-6"  style={{ marginBottom: '50px' }}>
          <div className="overflow-x-auto overflow-y-auto max-h-[80vh] custom-scrollbar">
            <table className="min-w-full divide-y-0">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800/90 sticky top-0 z-10 border-b-2 border-blue-200 dark:border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>{t('history.columns.patient')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>{t('history.columns.service')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>{t('history.columns.dateAndTime')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>{t('history.columns.durationAndPrice')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>{t('history.columns.status')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100 dark:divide-zinc-800">
                {currentLogs.map((log, idx) => {
                  const localData = SimpleReservationStorage.get(log.id);
                  const patientData = getPatientData(log, localData);
                  return (
                  <tr 
                    key={log.id} 
                    className={`group transition-all duration-200 hover:bg-blue-50 dark:hover:bg-zinc-800 ${
                      idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-gray-100 dark:bg-zinc-800/80'
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg text-sm">
                          {(patientData.full_name || t('reservations.defaultInitial'))[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {patientData.full_name || '-'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleShowPatientInfo(log)}
                          className="flex-shrink-0 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 group"
                          title={t('reservations.viewPatientInfo')}
                        >
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm">
                          <span className="text-orange-600 dark:text-orange-400">🏥</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{log.doctor_service?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                          <span className="text-green-600 dark:text-green-400">📅</span>
                          <span>{
                            log.date
                              ? new Date(log.date).toLocaleDateString(
                                  i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                                  { month: 'short', day: 'numeric' }
                                )
                              : '-'
                          }</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>⏰</span>
                          <span className="font-mono">{log.start_time ? formatTime(log.start_time) : '-'}</span>
                          <span>→</span>
                          <span className="font-mono">{log.end_time ? formatTime(log.end_time) : '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-100">
                          <span>⏱️</span>
                          <span className="font-medium">{log.doctor_service?.duration_minutes ? `${log.doctor_service.duration_minutes} ${t('services.minutes')}` : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>💰</span>
                          <span className="font-medium">{log.doctor_service?.price ? `${log.doctor_service.price} ${t('reservations.currencyShort')}` : '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-sm ${getStatusColor(log.status)} transition-all duration-200 hover:scale-105`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        {getStatusText(log.status)}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 border-2 border-dashed border-blue-300 dark:border-zinc-700 p-12 text-center fade-in"  style={{ marginBottom: '55px' }} >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 dark:bg-indigo-900/20 rounded-full -ml-20 -mb-20 opacity-50"></div>
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl">
              📊
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('history.noHistory')}</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {t('history.noHistoryFound')}
            </p>
          </div>
        </div>
      )}

      {}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            section="history"
            size="sm"
            className="dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
          >
            {t('common.previous')}
          </Button>
          <span className="flex items-center px-4 text-gray-700 dark:text-gray-300">
            {t('history.pageInfo', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            section="history"
            size="sm"
            className="dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      {/* Patient Info Modal */}
      {selectedPatient && (() => {
        const localData = SimpleReservationStorage.get(selectedPatient.id);
        const patientData = getPatientData(selectedPatient, localData);
        return (
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                {(patientData.full_name || t('reservations.defaultInitial'))[0].toUpperCase()}
              </div>
              {t('reservations.patientInfoTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg">👤</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('reservations.fullName')}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {patientData.full_name || '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
                  <span className="text-white text-lg">📞</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.phoneNumber')}</p>
                  {patientData.phone_number ? (
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 dir-ltr text-right">
                      {patientData.phone_number}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic text-right">
                      {t('history.notAvailableOld')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500 dark:bg-orange-600 flex items-center justify-center">
                  <span className="text-white text-lg">🏥</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('services.serviceName')}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedPatient?.doctor_service?.name || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
                  <span className="text-white text-lg">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('reservations.date')}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {selectedPatient?.date
                      ? new Date(selectedPatient.date).toLocaleDateString(
                          i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-lg">⏰</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('history.columns.dateAndTime')}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 dir-ltr text-right">
                    {selectedPatient?.start_time ? formatTime(selectedPatient.start_time) : '-'} - {selectedPatient?.end_time ? formatTime(selectedPatient.end_time) : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setIsPatientModalOpen(false)}
                variant="outline"
                className="dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        );
      })()}
    </div>
  );
};


function formatTime(timeStr: string) {
  if (!timeStr) return '-';
  
  const [hh, mm] = timeStr.split(':');
  return `${hh}:${mm}`;
}

/**
 * Extracts patient data from reservation object or local storage
 * Prioritizes local data (for manual reservations) then falls back to API data
 */
function getPatientData(reservation: any, localData?: any) {
  // Priority 1: Local data (for manual reservations with sensitive info)
  if (localData && localData.phone_number) {
    return {
      full_name: localData.full_name || reservation.user?.full_name || reservation.full_name || '',
      phone_number: localData.phone_number || '',
      age: localData.age || reservation.user?.age || reservation.age || '',
      gender: localData.gender || reservation.user?.gender || reservation.gender || ''
    };
  }
  
  // Priority 2: Direct reservation fields (for manual reservations)
  if (reservation.full_name && reservation.phone_number) {
    return {
      full_name: reservation.full_name,
      phone_number: reservation.phone_number,
      age: reservation.age || '',
      gender: reservation.gender || ''
    };
  }
  
  // Priority 3: Nested user data (for online reservations)
  // Try multiple possible locations for phone number
  const phoneNumber = reservation.user?.account?.phone_number || 
                      reservation.user?.phone_number ||
                      reservation.user?.phone ||
                      reservation.user?.account?.phone ||
                      reservation.phone_number ||
                      reservation.phone ||
                      reservation.mobile ||
                      reservation.user?.mobile ||
                      reservation.user?.account?.mobile ||
                      reservation.user?.contact_number ||
                      reservation.contact_number ||
                      reservation.user?.telephone ||
                      reservation.telephone || '';
  
  return {
    full_name: reservation.user?.account?.full_name || reservation.user?.full_name || '',
    phone_number: phoneNumber,
    age: reservation.user?.age || reservation.age || '',
    gender: reservation.user?.gender || reservation.gender || ''
  };
}

export default ReservationLog;