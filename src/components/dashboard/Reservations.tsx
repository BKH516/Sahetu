import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useDebounce } from '../../hooks';
import { SimpleReservationStorage } from '../../utils/simpleStorage';
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
import StatisticsCard from './StatisticsCard';
import { CheckCircle, BarChart2, Clock, Eye } from 'lucide-react';
import FilterBar from './FilterBar';
import DialogCustom from "../ui/DialogCustom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import api from '../../lib/axios';
import { Reservation } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import DropdownFilterButton from '../ui/DropdownFilterButton';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationHelpers } from '../common/NotificationSystem';


function GenderDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const options = [
    { value: "male", label: t('auth.register.male') },
    { value: "female", label: t('auth.register.female') },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full px-3 py-2 border-2 border-pink-400 dark:border-pink-600 rounded-lg bg-white dark:bg-gray-800 text-right text-gray-800 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 dark:focus:ring-pink-700 transition"
        onClick={() => setOpen((prev) => !prev)}
      >
        {options.find(opt => opt.value === value)?.label || t('reservations.selectGender')}
        <span className="float-left">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-50 w-full bg-white dark:bg-gray-800 border-2 border-pink-400 dark:border-pink-600 rounded-lg shadow-lg text-sm max-h-[20vh] overflow-y-auto mt-2">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/30 text-gray-900 dark:text-gray-100 ${value === opt.value ? "bg-pink-100 dark:bg-pink-900/50 font-bold" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceDropdown({ value, onChange, options, forceDropUp = false, size = 'md' }: { value: string; onChange: (val: string) => void; options: { value: string; label: string }[]; forceDropUp?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const { t: translate } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  let btnClass = "w-full px-3 py-2 text-sm";
  let dropdownClass = "text-sm min-w-[120px]";
  if (size === 'sm') {
    btnClass = "w-full px-2 py-1.5 text-xs";
    dropdownClass = "text-xs min-w-[100px]";
  } else if (size === 'lg') {
    btnClass = "w-full px-4 py-3 text-base";
    dropdownClass = "text-base min-w-[160px]";
  }

  const selectedLabel = options.find(opt => opt.value === value)?.label || translate('reservations.selectService');

  
  return (
    <div className="relative" ref={dropdownRef} style={{width: '100%'}}>
      <button
        type="button"
        ref={buttonRef}
        className={btnClass + " border-2 border-orange-400 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-800 text-right text-gray-800 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-700 transition"}
        onClick={() => setOpen((prev) => !prev)}
        style={{width: '100%'}}
      >
        {selectedLabel}
        <span className="float-left">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className={
          `absolute z-50 w-full bg-white dark:bg-gray-800 border-2 border-orange-400 dark:border-orange-600 rounded-lg shadow-lg ${dropdownClass} max-h-[25vh] overflow-y-auto mt-2` +
          (forceDropUp ? ' bottom-full mb-2 mt-0' : '')
        }>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/30 text-gray-900 dark:text-gray-100 ${value === opt.value ? "bg-orange-100 dark:bg-orange-900/50 font-bold" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Reservations: React.FC = React.memo(() => {
  const { t, i18n } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search for better performance
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Reservation | null>(null);
  const [selectedReservationForStatus, setSelectedReservationForStatus] = useState<Reservation | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [newReservation, setNewReservation] = useState({
    full_name: '',
    age: '',
    phone_number: '',
    doctor_service_id: '',
    date: '',
    start_time: '',
    end_time: '',
    notes: '',
    gender: ''
  });

  const { isAuthenticated } = useAuth();
  const { showInfo } = useNotificationHelpers();
  const previousReservationsRef = useRef<Reservation[]>([]);

  const fetchReservations = useCallback(async ({ silent = false, notifyOnNew = false }: { silent?: boolean; notifyOnNew?: boolean } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.get('/api/doctor/reservations');
      
      
      if (res.status >= 400) {
        const errorMessage = res.data?.message || t('reservations.loadError');
        setError(errorMessage);
        setReservations([]);
        return;
      }
      
      const apiData = res.data;
      
      const reservationsArray: Reservation[] = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      
      if (notifyOnNew && previousReservationsRef.current.length > 0) {
        const previousIds = new Set(previousReservationsRef.current.map(res => res.id));
        const newReservations = reservationsArray.filter(res => !previousIds.has(res.id));
        if (newReservations.length > 0) {
          const latestReservation = newReservations[0];
          const localData = SimpleReservationStorage.get(latestReservation.id);
          const patientInfo = getPatientData(latestReservation, localData);
          const patientName = patientInfo.full_name || t('reservations.patientUnknown', { defaultValue: 'مريض' });
          const notificationTitle = t('reservations.newReservationTitle', { defaultValue: 'حجز جديد' });
          const notificationMessage = newReservations.length === 1
            ? t('reservations.newReservationMessageSingle', {
                defaultValue: 'تم استلام حجز جديد.',
                name: patientName
              })
            : t('reservations.newReservationMessageMultiple', {
                defaultValue: 'تم استلام {{count}} حجوزات جديدة.',
                count: newReservations.length
              });
          showInfo(notificationTitle, notificationMessage, { duration: 7000 });
        }
      }

      previousReservationsRef.current = reservationsArray;
      setReservations(reservationsArray);
      
      // Don't cleanup - this was causing data loss
      // Manual reservations data is stored locally and should persist
      // Cleanup only happens on manual deletion, not on fetch
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('reservations.loadError');
      setError(errorMessage);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [t, showInfo]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/api/doctor/services');
      
      
      if (res.status >= 400) {
        const errorMessage = res.data?.message || t('services.loadingError');
        setError(errorMessage);
        setServices([]);
        return;
      }
      
      const apiData = res.data;
      const servicesArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setServices(servicesArray);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('services.loadingError');
      setError(errorMessage);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchAvailableDates = useCallback(async () => {
    try {
      const res = await api.get('/api/doctor/available-dates');
      
      if (res.status === 404) {
        setAvailableDates([]);
        return;
      }
      
      if (res.status >= 400) {
        setAvailableDates([]);
        return;
      }
      
      const dates = Array.isArray(res.data) ? res.data : [];
      setAvailableDates(dates);
    } catch (err: any) {
      setAvailableDates([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setStorageReady(true);
    fetchReservations();
    fetchServices();
    fetchAvailableDates();
  }, [isAuthenticated, fetchReservations, fetchServices, fetchAvailableDates]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isPageVisible = !document.hidden;
    const visibilityHandler = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        fetchReservations({ silent: true, notifyOnNew: true });
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    const interval = setInterval(() => {
      if (isPageVisible && !document.hidden) {
        fetchReservations({ silent: true, notifyOnNew: true });
      }
    }, 20000);

    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
      clearInterval(interval);
    };
  }, [isAuthenticated, fetchReservations]);

  
  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    
    
    if (!newReservation.gender) {
      setError(t('reservations.selectGender'));
      showAlert(t('reservations.selectGender'), 'error');
      return;
    }
    
    if (!newReservation.doctor_service_id) {
      setError(t('reservations.selectService'));
      showAlert(t('reservations.selectService'), 'error');
      return;
    }
    
    if (!newReservation.full_name || !newReservation.age || !newReservation.phone_number || !newReservation.date || !newReservation.start_time || !newReservation.end_time) {
      setError(t('reservations.fillAllFields'));
      showAlert(t('reservations.fillAllFields'), 'error');
      return;
    }
    
    
    
    if (availableDates.length > 0 && !availableDates.includes(newReservation.date)) {
      setError(t('reservations.dateNotAvailable'));
      showAlert(t('reservations.dateNotAvailable'), 'error');
      return;
    }
    
    
    if (newReservation.start_time >= newReservation.end_time) {
      setError(t('reservations.startTimeMustBeLess'));
      showAlert(t('reservations.startTimeMustBeLess'), 'error');
      return;
    }
    
    // Validate time range (e.g., business hours 8 AM to 8 PM)
    const startHour = parseInt(newReservation.start_time.split(':')[0]);
    const endHour = parseInt(newReservation.end_time.split(':')[0]);
    
    if (startHour < 6 || startHour > 22) {
      setError(t('reservations.startTimeRange'));
      showAlert(t('reservations.startTimeRange'), 'error');
      return;
    }
    
    if (endHour < 6 || endHour > 23) {
      setError(t('reservations.endTimeRange'));
      showAlert(t('reservations.endTimeRange'), 'error');
      return;
    }
    
    
    const selectedDate = new Date(newReservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    if (selectedDate < today) {
      setError(t('reservations.cannotBookPast'));
      showAlert(t('reservations.cannotBookPast'), 'error');
      return;
    }
    
    try {
      
      const reservationData = {
        full_name: newReservation.full_name,
        age: newReservation.age,
        phone_number: newReservation.phone_number,
        doctor_service_id: newReservation.doctor_service_id,
        date: newReservation.date,
        start_time: newReservation.start_time,
        end_time: newReservation.end_time,
        notes: newReservation.notes,
        gender: newReservation.gender
      };

      const res = await api.post('/api/doctor/reservations', reservationData);
      
      
      if (res.status >= 400) {
        
        let errorMessage = res.data?.message || t('reservations.addError');
        
        if (res.status === 409) {
          const conflictMessage = res.data?.message;
          if (conflictMessage) {
            errorMessage = conflictMessage;
          } else {
            errorMessage = t('reservations.slotAlreadyBooked');
          }
         
        } else if (res.status === 422) {
          const validationErrors = res.data?.errors;
          if (validationErrors?.date) {
            errorMessage = t('reservations.dateMustBeTodayOrFuture');
          } else if (validationErrors) {
            const firstError = Object.values(validationErrors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          } else {
            errorMessage = t('reservations.invalidData');
          }
        } else if (res.status === 404) {
          errorMessage = t('reservations.serviceNotFound');
        }
        
        setError(errorMessage);
        showAlert(errorMessage, 'error');
        return;
      }
      
    
      
      
      const newReservationObj = res.data && typeof res.data === 'object' && !Array.isArray(res.data)
        ? (res.data.data ? res.data.data : res.data)
        : res.data;

      
      if (newReservationObj && !newReservationObj.status) {
        newReservationObj.status = 'pending';
      }

      
      if (newReservationObj && newReservationObj.id) {
        const localData = {
          full_name: newReservation.full_name,
          phone_number: newReservation.phone_number,
          age: newReservation.age,
          gender: newReservation.gender,
          notes: newReservation.notes
        };
        
        // Save to simple storage (synchronous, reliable)
        SimpleReservationStorage.save(newReservationObj.id, localData);
       
        
        
        if (!newReservationObj.doctor_service && newReservation.doctor_service_id) {
          
          const selectedService = services.find(s => s.id == newReservation.doctor_service_id);
          if (selectedService) {
            newReservationObj.doctor_service = selectedService;
          
          }
        }
        
        
        setReservations(prev => [...prev, newReservationObj]);
        
        // Fetch updated list after save is complete
        setTimeout(async () => {
          await fetchReservations();
        }, 500);
      }
      
      
      showAlert(t('reservations.addSuccess'), 'success');
      
      
      setIsAddDialogOpen(false);
      setNewReservation({ 
        full_name: '', 
        age: '', 
        phone_number: '', 
        doctor_service_id: '', 
        date: '', 
        start_time: '', 
        end_time: '', 
        notes: '',
        gender: ''
      });
    } catch (err: any) {
      let errorMessage = err?.response?.data?.message || t('reservations.addError');
      
      
      if (err?.response?.status === 422) {
        
        const validationErrors = err?.response?.data?.errors;
        if (validationErrors?.date) {
          errorMessage = t('reservations.dateMustBeTodayOrFuture');
        } else if (validationErrors) {
          
          const firstError = Object.values(validationErrors)[0];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        } else {
            errorMessage = t('reservations.invalidData');
        }
      } else if (err?.response?.status === 409) {
        
        const conflictMessage = err?.response?.data?.message;
        if (conflictMessage) {
          errorMessage = conflictMessage;
        } else {
          errorMessage = t('reservations.slotAlreadyBooked');
        }
       
      } else if (err?.response?.status === 400) {
        errorMessage = t('reservations.badRequest');
      } else if (err?.response?.status === 500) {
        errorMessage = t('reservations.serverError');
      } else if (err?.response?.status === 0 || err?.code === 'NETWORK_ERROR') {
        errorMessage = t('reservations.networkError');
      }
      
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    }
  };

  
  const updateReservationStatus = async (id: number, newStatus: Reservation['status']) => {
    setSuccess(null);
    setError(null);
    
    // Optimistic update
    const previousReservations = [...reservations];
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    
    try {
      const res = await api.patch(`/api/doctor/reservations/updateStatus/${id}`, { status: newStatus }, { headers: { 'Content-Type': 'application/json' } });
      
      if (res.status >= 400) {
        // Rollback on error
        setReservations(previousReservations);
        const errorMessage = res.data?.message || t('reservations.updateError');
        setError(errorMessage);
        showAlert(errorMessage, 'error');
        return;
      }
      
      // Reload reservations to get fresh data
      await fetchReservations();
      
      // Keep local data when status changes to completed or rejected
      // This ensures phone numbers are available in ReservationLog
      const localData = SimpleReservationStorage.get(id);
      if (localData && (newStatus === 'completed' || newStatus === 'rejected')) {
        // Re-save the data to ensure it persists
        SimpleReservationStorage.save(id, localData);
      }
      
      showAlert(t('reservations.updateSuccess', { status: getStatusText(newStatus) }), 'success');
    } catch (err: any) {
      // Rollback on error
      setReservations(previousReservations);
      const errorMessage = err?.response?.data?.message || t('reservations.updateError');
      setError(errorMessage);
      showAlert(errorMessage, 'error');
    }
  };

  
  const filteredReservations = useMemo(() => {
    // Don't filter until storage is ready to prevent flickering
    if (!storageReady) return [];
    
    return reservations.filter(reservation => {
      
      const allowedStatuses = ['pending', 'approved'];
      
      
      let matchesStatus = true;
      if (filterStatus !== "all") {
        
        matchesStatus = reservation.status === filterStatus;
      } else {
        
        matchesStatus = allowedStatuses.includes(reservation.status);
      }
      
      
      const localData = SimpleReservationStorage.get(reservation.id);
      const patientData = getPatientData(reservation, localData);
      
      const fullName = patientData.full_name || '';
      const serviceName = reservation.doctor_service?.name || '';
      const phoneNumber = patientData.phone_number || '';
      
      const matchesSearch = 
        fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        serviceName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        phoneNumber.includes(debouncedSearchTerm);
      
      return matchesStatus && matchesSearch;
    });
  }, [reservations, filterStatus, debouncedSearchTerm, storageReady]);

  
  const totalPages = useMemo(() => Math.ceil(filteredReservations.length / itemsPerPage), [filteredReservations.length]);
  const currentReservations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReservations.slice(startIndex, endIndex);
  }, [filteredReservations, currentPage]);

  
  const getStatusText = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return t('reservations.status.pending');
      case 'approved': return t('reservations.status.approved');
      case 'cancelled': return t('reservations.status.cancelled');
      case 'completed': return t('reservations.status.completed');
      case 'rejected': return t('reservations.status.rejected');
      default: return status;
    }
  };

  
  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved': return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light';
      case 'cancelled': return 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger-light';
      case 'completed': return 'bg-success/10 text-success dark:bg-success/20 dark:text-success-light';
      case 'rejected': return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  
  const showAlert = (message: string, type: 'success' | 'error') => {
    setCustomAlert({ message, type });
    setTimeout(() => setCustomAlert(null), 3000);
  };

  if (loading || !storageReady) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {}
        <div className="flex justify-end gap-2">
          <Button
            className=""
            section="bookings"
            size="sm"
            onClick={() => {
              setIsAddDialogOpen(true);
              fetchAvailableDates();
            }}
          >
            + {t('reservations.addManualReservation')}
          </Button>
        </div>
        {}
        {error && <div className="text-center text-red-500 py-2">{error}</div>}
        {success && <div className="text-center text-green-600 font-bold py-2">{success}</div>}
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
        <DialogCustom
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          title={t('reservations.addManualReservation')}
          description={t('reservations.addReservationDesc')}
        >
          <form className="space-y-3" onSubmit={handleAddReservation}>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {t('reservations.fullName')}
                  </label>
                  <Input 
                    id="full_name"
                    placeholder={t('reservations.fullNamePlaceholder')} 
                    value={newReservation.full_name} 
                    onChange={e => setNewReservation(r => ({ ...r, full_name: e.target.value }))} 
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all text-sm" 
                  />
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t('profile.age')}
                  </label>
                  <Input 
                    id="age"
                    type="number" 
                    placeholder={t('profile.agePlaceholder') || t('profile.age')} 
                    value={newReservation.age} 
                    onChange={e => setNewReservation(r => ({ ...r, age: e.target.value }))} 
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 transition-all text-sm" 
                  />
                </div>
                <div>
                  <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    {t('profile.phoneNumber')}
                  </label>
                  <Input 
                    id="phone_number"
                    type="tel" 
                    placeholder={t('profile.phoneNumberPlaceholder')} 
                    value={newReservation.phone_number} 
                    onChange={e => setNewReservation(r => ({ ...r, phone_number: e.target.value }))} 
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all text-sm" 
                  />
                </div>
                <div>
                  <label htmlFor="doctor_service_id" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    {t('services.serviceName')}
                  </label>
                  <ServiceDropdown
                    value={newReservation.doctor_service_id}
                    onChange={val => setNewReservation(r => ({ ...r, doctor_service_id: val }))}
                    options={services.map(s => ({ value: s.id, label: s.name }))}
                    size={reservations.length > 8 ? 'sm' : reservations.length > 4 ? 'md' : 'lg'}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    {t('profile.gender')} *
                  </label>
                  <GenderDropdown value={newReservation.gender} onChange={val => setNewReservation(r => ({ ...r, gender: val }))} />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {t('reservations.date')}
                  </label>
                  <Input 
                    id="date"
                    type="date" 
                    value={newReservation.date} 
                    onChange={e => setNewReservation(r => ({ ...r, date: e.target.value }))} 
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800 transition-all text-sm" 
                  />
                </div>
              </div>
            </div>
            
            {}
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    {t('schedule.startTime')}
                  </label>
                  <Input 
                    id="start_time"
                    type="time" 
                    value={newReservation.start_time} 
                    onChange={e => setNewReservation(r => ({ ...r, start_time: e.target.value }))} 
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all text-sm" 
                  />
                </div>
                <div>
                  <label htmlFor="end_time" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    {t('reservations.endTime')}
                  </label>
                  <Input 
                    id="end_time"
                    type="time" 
                    value={newReservation.end_time} 
                    onChange={e => setNewReservation(r => ({ ...r, end_time: e.target.value }))} 
                    required 
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-800 transition-all text-sm" 
                  />
                </div>
              </div>
              
              {}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  {t('reservations.notes')}
                </label>
                <Input 
                  id="notes"
                  placeholder={t('reservations.notesPlaceholder')} 
                  value={newReservation.notes} 
                  onChange={e => setNewReservation(r => ({ ...r, notes: e.target.value }))} 
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:border-yellow-500 dark:focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 dark:focus:ring-yellow-800 transition-all text-sm" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all text-sm"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg transition-all text-sm"
              >
                {t('reservations.addReservation')}
              </Button>
            </div>
          </form>
        </DialogCustom>
        {}
        {selectedPatient && (() => {
          const localData = SimpleReservationStorage.get(selectedPatient.id);
          const patientData = getPatientData(selectedPatient, localData);
          return (
            <DialogCustom
              open={isPatientInfoOpen}
              onOpenChange={setIsPatientInfoOpen}
              title={t('reservations.patientInfoTitle')}
              description={t('reservations.patientInfoDescription')}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('reservations.fullName')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {patientData.full_name || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('profile.age')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {patientData.age ? `${patientData.age} ${t('profile.years')}` : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('profile.gender')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {patientData.gender === 'male' ? t('auth.register.male') : patientData.gender === 'female' ? t('auth.register.female') : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('profile.phoneNumber')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {patientData.phone_number || (
                        <span className="text-gray-400 dark:text-gray-500 italic">{t('reservations.notAvailableOld')}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('services.serviceName')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {selectedPatient.doctor_service?.name || '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('reservations.date')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {selectedPatient.date
                        ? new Date(selectedPatient.date).toLocaleDateString(
                            i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )
                        : '-'}
                    </div>
                  </div>
                  <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('schedule.startTime')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {selectedPatient.start_time ? formatTime(selectedPatient.start_time) : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('reservations.endTime')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      {selectedPatient.end_time ? formatTime(selectedPatient.end_time) : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('reservations.statusLabel')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPatient.status)}`}>
                        {getStatusText(selectedPatient.status)}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedPatient.notes && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('reservations.notes')}</label>
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm min-h-[60px]">
                      {selectedPatient.notes}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsPatientInfoOpen(false)}
                  className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all text-sm"
                >
                  {t('reservations.close')}
                </Button>
              </div>
            </DialogCustom>
          );
        })()}

        {}
        {selectedReservationForStatus && (
          <DialogCustom
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            title={t('reservations.changeStatus')}
            description={t('reservations.selectNewStatus')}
          >
            <div className="space-y-3">
              {[
                { value: 'pending', label: t('reservations.status.pending'), icon: '⏳', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', borderColor: 'border-yellow-300 dark:border-yellow-700' },
                { value: 'approved', label: t('reservations.status.approved'), icon: '✅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', borderColor: 'border-blue-300 dark:border-blue-700' },
                { value: 'completed', label: t('reservations.status.completed'), icon: '✔️', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', borderColor: 'border-green-300 dark:border-green-700' },
                { value: 'cancelled', label: t('reservations.status.cancelled'), icon: '❌', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', borderColor: 'border-red-300 dark:border-red-700' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    updateReservationStatus(selectedReservationForStatus.id, status.value as Reservation['status']);
                    setIsStatusDialogOpen(false);
                    setSelectedReservationForStatus(null);
                  }}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${status.borderColor} ${
                    selectedReservationForStatus.status === status.value 
                      ? `${status.color} font-bold shadow-md` 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } transition-all duration-200 flex items-center gap-3`}
                >
                  <span className="text-2xl">{status.icon}</span>
                  <span className="text-base font-medium flex-1 text-right">{status.label}</span>
                  {selectedReservationForStatus.status === status.value && (
                    <span className="text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsStatusDialogOpen(false);
                  setSelectedReservationForStatus(null);
                }}
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium transition-all text-sm"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </DialogCustom>
        )}
        {}
        <FilterBar>
          <div className="flex-1 min-w-[180px]">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('common.search')} {searchTerm !== debouncedSearchTerm && <span className="text-xs text-gray-500">({t('common.searching')})</span>}
            </label>
            <Input
              id="search"
              placeholder={t('reservations.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <DropdownFilterButton
              options={[
                { value: 'all', label: t('reservations.allStatuses') },
                { value: 'pending', label: t('reservations.status.pending') },
                { value: 'approved', label: t('reservations.status.approved') },
                { value: 'completed', label: t('reservations.status.completed') },
                { value: 'cancelled', label: t('reservations.status.cancelled') },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder={t('reservations.selectStatus')}
              className="min-w-[140px]"
              section="bookings"
              size="sm"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
              }}
              section="bookings"
              size="sm"
              className="w-full"
            >
              {t('common.reset')}
            </Button>
          </div>
        </FilterBar>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          <StatisticsCard
            icon={<BarChart2 className="text-primary dark:text-primary-light" />}
            label={t('reservations.totalReservations')}
            value={filteredReservations.length}
            color="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
          />
          <StatisticsCard
          icon={<Clock className="text-yellow-600 dark:text-yellow-300" />}
            label={t('reservations.status.pending')}
            value={filteredReservations.filter(r => r.status === 'pending').length}
            color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          />
          <StatisticsCard
            icon={<CheckCircle className="text-green-600 dark:text-green-400" />}
            label={t('reservations.status.approved')}
            value={filteredReservations.filter(r => r.status === 'approved').length}
            color="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
          />
        </div>

        {}
        {currentReservations.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl border border-gray-100 dark:border-zinc-800 fade-in pb-4" style={{ marginBottom: '50px' }}>
            <div className="overflow-x-auto overflow-y-auto max-h-[80vh] custom-scrollbar">
              <table className="min-w-full divide-y-0">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800/90 sticky top-0 z-10 border-b-2 border-blue-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>{t('reservations.columns.patient')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>{t('reservations.columns.contact')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>{t('reservations.columns.service')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>{t('reservations.columns.appointment')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>{t('reservations.columns.status')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('services.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-100 dark:divide-zinc-800">
              {currentReservations.map((reservation, idx) => {
                    const localData = SimpleReservationStorage.get(reservation.id);
                const patientData = getPatientData(reservation, localData);
                return (
                    <tr 
                      key={reservation.id} 
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
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
                              {patientData.full_name || '-'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              {patientData.gender === 'male' ? '👨' : patientData.gender === 'female' ? '👩' : '👤'}
                              <span>{patientData.age ? `${patientData.age} ${t('profile.years')}` : '-'}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm">
                            <span className="text-purple-600 dark:text-purple-400">📱</span>
                          </div>
                          {patientData.phone_number ? (
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 dir-ltr">{patientData.phone_number}</span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">{t('reservations.notAvailable')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm">
                            <span className="text-orange-600 dark:text-orange-400">🏥</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{reservation.doctor_service?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-gray-100">
                            <span className="text-green-600 dark:text-green-400">📅</span>
                            <span>{
                              reservation.date
                                ? new Date(reservation.date).toLocaleDateString(
                                    i18n.language === 'ar' ? 'ar-EG' : 'en-US',
                                    { month: 'short', day: 'numeric' }
                                  )
                                : '-'
                            }</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>⏰</span>
                            <span className="font-mono">{reservation.start_time ? formatTime(reservation.start_time) : '-'}</span>
                            <span>→</span>
                            <span className="font-mono">{reservation.end_time ? formatTime(reservation.end_time) : '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-sm ${getStatusColor(reservation.status)} transition-all duration-200 hover:scale-105`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {getStatusText(reservation.status)}
                    </span>
                  </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                              const localData = SimpleReservationStorage.get(reservation.id);
                          const patientData = getPatientData(reservation, localData);
                          setSelectedPatient(reservation);
                          setIsPatientInfoOpen(true);
                        }}
                            className="group/btn relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                        title={t('reservations.viewPatientInfo')}
                      >
                            <Eye size={18} className="relative z-10" />
                            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover/btn:opacity-20 transition-opacity"></div>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReservationForStatus(reservation);
                          setIsStatusDialogOpen(true);
                        }}
                        className="group/status w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-zinc-700 dark:to-zinc-800 dark:hover:from-zinc-600 dark:hover:to-zinc-700 shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title={t('reservations.changeStatus')}
                      >
                        <span className="text-lg">⚙️</span>
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
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 border-2 border-dashed border-blue-300 dark:border-zinc-700 p-12 text-center fade-in"  style={{ marginBottom: '60px' }} >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-200 dark:bg-indigo-900/20 rounded-full -ml-20 -mb-20 opacity-50"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-4xl">
                📋
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('reservations.noReservations')}</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {t('reservations.noReservationsFound')}
              </p>
              <Button
                onClick={() => {
                  setIsAddDialogOpen(true);
                  fetchAvailableDates();
                }}
                section="bookings"
                className="mt-4"
              >
                + {t('reservations.addNewReservation')}
              </Button>
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
              className="dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
            >
              {t('common.previous')}
            </Button>
            <span className="flex items-center px-4 text-gray-700 dark:text-gray-300">
              {t('reservations.pageInfo', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="dark:border-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-800"
            >
              {t('common.next')}
            </Button>
          </div>
        )}
    </div>
  );
});


function formatTime(timeStr: string) {
  if (!timeStr) return '-';
  
  const [hh, mm] = timeStr.split(':');
  return `${hh}:${mm}`;
}


/**
 * Extracts patient data from reservation object or local storage
 * ALWAYS prioritizes localStorage first for manual reservations
 */
function getPatientData(reservation: any, localData?: any) {
  // ALWAYS check localStorage first (even if some fields are empty)
  // This is critical for manual reservations
  if (localData) {
    return {
      full_name: localData.full_name || reservation.full_name || reservation.user?.account?.full_name || reservation.user?.full_name || '',
      phone_number: localData.phone_number || reservation.phone_number || reservation.user?.account?.phone_number || reservation.user?.phone_number || '',
      age: localData.age || reservation.age || reservation.user?.age || '',
      gender: localData.gender || reservation.gender || reservation.user?.gender || ''
    };
  }
  
  // No localStorage data - check if it's a manual reservation (has direct fields)
  if (reservation.full_name && reservation.phone_number) {
    return {
      full_name: reservation.full_name,
      phone_number: reservation.phone_number,
      age: reservation.age || '',
      gender: reservation.gender || ''
    };
  }
  
  // Online reservation - get from user object
  const phoneNumber = reservation.user?.account?.phone_number || 
                      reservation.user?.phone_number ||
                      reservation.user?.account?.phone ||
                      reservation.user?.phone ||
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

export default Reservations; 