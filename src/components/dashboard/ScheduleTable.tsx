import React, { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import EditScheduleModal from "./EditScheduleModal";
import ScheduleModal from "./ScheduleModal";
import { Button } from "../ui/button";
import api from '../../lib/axios';
import { DoctorWorkSchedule } from '../../types';
import { Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

const ScheduleTable = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const dayMap: Record<string, string> = {
    saturday: t('schedule.days.saturday'),
    sunday: t('schedule.days.sunday'),
    monday: t('schedule.days.monday'),
    tuesday: t('schedule.days.tuesday'),
    wednesday: t('schedule.days.wednesday'),
    thursday: t('schedule.days.thursday'),
    friday: t('schedule.days.friday'),
  };
  const reverseDayMap: Record<string, string> = Object.fromEntries(Object.entries(dayMap).map(([k, v]) => [v, k]));
  
  const [schedule, setSchedule] = useState<DoctorWorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  
  const showAlert = (message: string, type: 'success' | 'error') => {
    setCustomAlert({ message, type });
    setTimeout(() => setCustomAlert(null), 3000);
  };

  const dayOrder = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const sortedSchedule = [...schedule].sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week));
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditIndex, setModalEditIndex] = useState<number | null>(null);

  
  const todayEn = Object.keys(dayMap).find(key => dayMap[key] === dayMap[new Date().toLocaleDateString('ar-EG', { weekday: 'long' })]) || '';

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSchedule();
    }
  }, [isAuthenticated]);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/doctor/schedules');
      const apiData = res.data;
      
      const scheduleArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setSchedule(scheduleArray);
    } catch (err: any) {
      setError(t('schedule.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newItem: any) => {
    setSuccess(null);
    setError(null);
    try {
      const form = new URLSearchParams();
      form.append('day_of_week', reverseDayMap[newItem.day]);
      form.append('start_time', newItem.start?.slice(0,5));
      form.append('end_time', newItem.end?.slice(0,5));
      const res = await api.post('/api/doctor/schedules', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      
      const newSchedule = res.data && typeof res.data === 'object' && !Array.isArray(res.data)
        ? (res.data.data ? res.data.data : res.data)
        : res.data;
      setSchedule((prev) => [...prev, newSchedule]);
      showAlert(t('schedule.addSuccess'), 'success');
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      let arabicErrorMsg = t('schedule.addError');
      
      if (serverMsg && serverMsg.includes("validation")) {
        arabicErrorMsg = t('services.invalidData');
      } else if (serverMsg && serverMsg.includes("required")) {
        arabicErrorMsg = t('services.allFieldsRequired');
      } else if (serverMsg && serverMsg.includes("conflict")) {
        arabicErrorMsg = t('schedule.addError');
      }
      
      showAlert(arabicErrorMsg, 'error');
    }
  };

  const handleEdit = async (updatedItem: any) => {
    setSuccess(null);
    setError(null);
    if (!updatedItem || !updatedItem.id) {
      showAlert(t('schedule.updateError'), 'error');
      return;
    }
    try {
      const form = new URLSearchParams();
      form.append('day_of_week', reverseDayMap[updatedItem.day]);
      form.append('start_time', updatedItem.start?.slice(0,5));
      form.append('end_time', updatedItem.end?.slice(0,5));
      const res = await api.post(`/api/doctor/schedules/${updatedItem.id}`, form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      
      const updatedSchedule = res.data && typeof res.data === 'object' && !Array.isArray(res.data)
        ? (res.data.data ? res.data.data : res.data)
        : res.data;
      setSchedule((prev) => prev.map((item) => item.id === updatedItem.id ? updatedSchedule : item));
      showAlert(t('schedule.updateSuccess'), 'success');
    } catch (err: any) {
      showAlert(t('schedule.updateError'), 'error');
    }
  };

  
  const handleEditClick = (id: number) => () => {
    const index = schedule.findIndex((item) => item.id === id);
    if (index !== -1) {
      setModalEditIndex(index);
    }
  };

  const handleDeleteClick = (id: number) => () => {
    handleDelete(id);
  };

  const handleDelete = async (id: number) => {
    setSuccess(null);
    setError(null);
    if (!id) {
      showAlert(t('schedule.deleteError'), 'error');
      return;
    }
    try {
      await api.delete(`/api/doctor/schedules/${id}`);
      setSchedule((prev) => prev.filter((item) => item.id !== id));
      showAlert(t('schedule.deleteSuccess'), 'success');
    } catch (err: any) {
      showAlert(t('schedule.deleteError'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-0 relative">
      {}
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md text-sm sm:text-base font-medium"
          >
            + {t('schedule.addNewAppointment') || t('schedule.addAppointment')}
          </Button>
        </div>

        {}
        {error && <div className="text-center text-red-500 py-2">{error}</div>}
        {success && <div className="text-center text-green-600 font-bold py-2">{success}</div>}

        <ScheduleModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAdd={async (newItem) => {
            await handleAdd(newItem);
            setModalOpen(false);
          }}
          existingSchedule={schedule.map((item) => ({
            id: item.id,
            day: dayMap[item.day_of_week],
            start: item.start_time,
            end: item.end_time,
          }))}
        />

        {modalEditIndex !== null && (
          <EditScheduleModal
            isOpen={modalEditIndex !== null}
            onClose={() => setModalEditIndex(null)}
            onEdit={async (updatedItem) => {
              await handleEdit(updatedItem);
              setModalEditIndex(null);
            }}
            initialData={(() => {
              const item = schedule[modalEditIndex];
              return {
                id: item.id,
                day: dayMap[item.day_of_week],
                start: item.start_time,
                end: item.end_time,
              };
            })()}
          />
        )}

        {}
        <div className="relative rounded-3xl shadow-lg bg-white mt-4 fade-in dark:bg-card-dark dark:shadow-[0_2px_16px_0_rgba(36,44,80,0.18)] rounded-tl-[2.5rem] rounded-br-[2.5rem] overflow-hidden">
          {}
          {}
          <div className="w-full overflow-x-auto">
            <table className="min-w-full w-full divide-y divide-gray-200 dark:divide-zinc-700 text-center align-middle">
              <thead className="bg-slate-50 dark:bg-zinc-800 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap bg-green-600 dark:bg-green-800">{t('schedule.day') || 'اليوم'}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide whitespace-nowrap">{t('schedule.startTime')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide whitespace-nowrap">{t('schedule.endTime')}</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide whitespace-nowrap">{t('services.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {sortedSchedule.map((item, idx) => {
                  const isToday = item.day_of_week === todayEn;
                  return (
                    <tr key={item.id}
                      className={`transition-colors ${isToday ? 'bg-yellow-50 dark:bg-yellow-900/30' : (idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-gray-50 dark:bg-zinc-800')} hover:bg-accent/10 dark:hover:bg-zinc-700`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100 text-center align-middle text-sm sm:text-base">{dayMap[item.day_of_week]}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 text-center align-middle text-sm sm:text-base">{formatTime(item.start_time)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 text-center align-middle text-sm sm:text-base">{formatTime(item.end_time)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center align-middle">
                        <div className="flex justify-center gap-2 sm:gap-3">
                          <button 
                            type="button"
                            onClick={handleEditClick(item.id)}
                            className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow transition-all dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-white"
                            title={t('common.edit')}>
                            <Edit2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={handleDeleteClick(item.id)}
                            className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 shadow transition-all dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
                            title={t('common.delete')}>
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {}
        {customAlert && (
          <div
            style={{
              position: "fixed",
              bottom: 18,
              left: 18,
              zIndex: 99999,
              minWidth: 120,
              maxWidth: 220,
              padding: "7px 16px 7px 10px",
              borderRadius: "8px",
              background: customAlert.type === "success" ? "#22c55e" : "#ef4444",
              color: "#fff",
              fontWeight: 500,
              fontSize: "0.85rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <span style={{fontSize: '1.1em', marginRight: 6, display: 'flex', alignItems: 'center'}}>
              {customAlert.type === 'success' ? '✔️' : '⚠️'}
            </span>
            <span style={{flex: 1}}>{customAlert.message}</span>
          </div>
        )}
    </div>
  );
}

export default ScheduleTable; 


function formatTime(timeStr: string) {
  if (!timeStr) return '-';
  
  const [hh, mm] = timeStr.split(':');
  return `${hh}:${mm}`;
} 