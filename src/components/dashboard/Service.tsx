import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import DialogCustom from "../ui/DialogCustom";
import { DoctorService } from "../../types";
import api from '../../lib/axios';
import { Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { UnifiedLoader } from '../ui';
import { useDoctorProfile } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';

type TranslatedService = DoctorService & { displayName: string };

const Service: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // Create translations object that updates when language changes
  // Use manual translations directly to bypass i18n.t() issues
  const translations = useMemo(() => {
    const lang = i18n.language || 'ar';
    
    // Complete manual translation map - these are the source of truth
    const manualTranslations: Record<string, Record<string, string>> = {
      en: {
        'services.addNewService': '+ Add New Service',
        'services.serviceName': 'Service Name',
        'services.price': 'Price (SYP)',
        'services.duration': 'Duration (minutes)',
        'services.actions': 'Actions',
        'services.page': 'Page',
        'services.of': 'of',
        'common.previous': 'Previous',
        'common.next': 'Next',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.cancel': 'Cancel',
        'services.addServiceTitle': 'Add New Service',
        'services.addServiceDescription': 'Enter new service details',
        'services.addServiceButton': 'Add Service',
        'services.serviceNameLabel': 'Service Name',
        'services.serviceNamePlaceholder': 'Enter service name',
        'services.priceLabel': 'Price (SYP)',
        'services.pricePlaceholder': 'Enter price',
        'services.durationLabel': 'Duration (minutes)',
        'services.durationPlaceholder': 'Enter duration',
        'services.editServiceTitle': 'Edit Service',
        'services.editServiceDescription': 'Update service details',
        'services.updateServiceButton': 'Update Service',
        'services.deleteConfirmTitle': 'Confirm Deletion',
        'services.deleteConfirmDescription': 'Are you sure you want to delete this service? This action cannot be undone.',
        'services.deleteWarning': 'Important Warning',
        'services.deleteWarningText': 'You are about to delete the service',
        'services.deleteWarningText2': 'permanently from the system.',
        'services.deleteWarningText3': 'This action cannot be undone!',
        'services.deleteServiceButton': 'Delete Service',
      },
      ar: {
        'services.addNewService': '+ إضافة خدمة جديدة',
        'services.serviceName': 'اسم الخدمة',
        'services.price': 'السعر (ل.س)',
        'services.duration': 'المدة (دقيقة)',
        'services.actions': 'الإجراءات',
        'services.page': 'صفحة',
        'services.of': 'من',
        'common.previous': 'السابق',
        'common.next': 'التالي',
        'common.edit': 'تعديل',
        'common.delete': 'حذف',
        'common.cancel': 'إلغاء',
        'services.addServiceTitle': 'إضافة خدمة جديدة',
        'services.addServiceDescription': 'أدخل تفاصيل الخدمة الجديدة',
        'services.addServiceButton': 'إضافة الخدمة',
        'services.serviceNameLabel': 'اسم الخدمة',
        'services.serviceNamePlaceholder': 'أدخل اسم الخدمة',
        'services.priceLabel': 'السعر (ل.س)',
        'services.pricePlaceholder': 'أدخل السعر',
        'services.durationLabel': 'المدة (دقيقة)',
        'services.durationPlaceholder': 'أدخل المدة',
        'services.editServiceTitle': 'تعديل الخدمة',
        'services.editServiceDescription': 'قم بتحديث تفاصيل الخدمة',
        'services.updateServiceButton': 'تحديث الخدمة',
        'services.deleteConfirmTitle': 'تأكيد الحذف',
        'services.deleteConfirmDescription': 'هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.',
        'services.deleteWarning': 'تحذير مهم',
        'services.deleteWarningText': 'أنت على وشك حذف الخدمة',
        'services.deleteWarningText2': 'نهائياً من النظام.',
        'services.deleteWarningText3': 'لا يمكن التراجع عن هذا الإجراء!',
        'services.deleteServiceButton': 'حذف الخدمة',
      }
    };
    
    const getTrans = (key: string): string => {
      return manualTranslations[lang]?.[key] || key;
    };
    
    return {
      addNewService: getTrans('services.addNewService'),
      serviceName: getTrans('services.serviceName'),
      price: getTrans('services.price'),
      duration: getTrans('services.duration'),
      actions: getTrans('services.actions'),
      page: getTrans('services.page'),
      of: getTrans('services.of'),
      previous: getTrans('common.previous'),
      next: getTrans('common.next'),
      edit: getTrans('common.edit'),
      delete: getTrans('common.delete'),
      cancel: getTrans('common.cancel'),
      addServiceTitle: getTrans('services.addServiceTitle'),
      addServiceDescription: getTrans('services.addServiceDescription'),
      addServiceButton: getTrans('services.addServiceButton'),
      serviceNameLabel: getTrans('services.serviceNameLabel'),
      serviceNamePlaceholder: getTrans('services.serviceNamePlaceholder'),
      priceLabel: getTrans('services.priceLabel'),
      pricePlaceholder: getTrans('services.pricePlaceholder'),
      durationLabel: getTrans('services.durationLabel'),
      durationPlaceholder: getTrans('services.durationPlaceholder'),
      editServiceTitle: getTrans('services.editServiceTitle'),
      editServiceDescription: getTrans('services.editServiceDescription'),
      updateServiceButton: getTrans('services.updateServiceButton'),
      deleteConfirmTitle: getTrans('services.deleteConfirmTitle'),
      deleteConfirmDescription: getTrans('services.deleteConfirmDescription'),
      deleteWarning: getTrans('services.deleteWarning'),
      deleteWarningText: getTrans('services.deleteWarningText'),
      deleteWarningText2: getTrans('services.deleteWarningText2'),
      deleteWarningText3: getTrans('services.deleteWarningText3'),
      deleteServiceButton: getTrans('services.deleteServiceButton'),
    };
  }, [i18n.language]);
  
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    if (language !== i18n.language) {
      setLanguage(i18n.language);
    }
  }, [i18n.language, language]);

  const fixedT = useMemo(() => i18n.getFixedT(language), [i18n, language]);

  const translate = useCallback((key: string, defaultValue?: string) => {
    return fixedT(key, defaultValue ?? t(key));
  }, [fixedT, t]);

  const translateServiceName = useCallback((serviceName: string | undefined | null) => {
    if (!serviceName) return '';
    if (language === 'ar') return serviceName;

    const resourceBundle = i18n.getResourceBundle(language, 'translation') as Record<string, any> | undefined;
    const serviceNameMap = resourceBundle?.services?.serviceNameMap as Record<string, string> | undefined;
    const trimmedName = serviceName.trim();

    return serviceNameMap?.[trimmedName] ?? trimmedName;
  }, [i18n, language]);
  const [services, setServices] = useState<DoctorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  
  const { profileData } = useDoctorProfile();
  const [isAddingService, setIsAddingService] = useState(false);

  const [editService, setEditService] = useState<DoctorService | null>(null);
  const [isOpenEditDialog, setIsOpenEditDialog] = useState(false);

  const [addService, setAddService] = useState({
    name: "",
    price: "",
    duration_minutes: 0,
  });
  const [isOpenAddDialog, setIsOpenAddDialog] = useState(false);

  const [isOpenConfirmDialog, setIsOpenConfirmDialog] = useState(false);
  const [confirmService, setConfirmService] = useState<DoctorService | null>(null);

  const [customAlert, setCustomAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Force re-render by using language in render - no memoization needed
  // react-i18next will handle translation updates automatically
  

  
  const showAlert = (message: string, type: 'success' | 'error') => {
    setCustomAlert({ message, type });
    setTimeout(() => setCustomAlert(null), 3000);
  };

  
  const [isMobile, setIsMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  
  const getRowsPerPage = () => {
    return isMobile ? 8 : 3; 
  };

  const translatedServices = useMemo<TranslatedService[]>(() => {
    return services.map((service) => ({
      ...service,
      displayName: translateServiceName(service.name),
    }));
  }, [services, translateServiceName]);
 
  const rowsPerPage = getRowsPerPage();
  const totalPages = Math.ceil(translatedServices.length / rowsPerPage);
  const currentItems = translatedServices.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); 
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  
  useEffect(() => {
    setCurrentPage(1);
  }, [isMobile]);

  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchServices();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (profileData && typeof profileData.id === 'number') {
      setDoctorId(profileData.id);
    } else {
      setDoctorId(null);
    }
  }, [profileData]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/doctor/services');
      const apiData = res.data;
      
      const servicesArray = Array.isArray(apiData) ? apiData : (Array.isArray(apiData.data) ? apiData.data : []);
      setServices(servicesArray);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('services.loadingError');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
  const onOpenAddDialog = () => setIsOpenAddDialog(true);
  const onCloseAddDialog = () => {
    setIsOpenAddDialog(false);
    setAddService({ name: "", price: "", duration_minutes: 0 });
  };

  const onOpenEditDialog = (srv: DoctorService) => {
    setIsOpenEditDialog(true);
    setEditService(srv);
  };
  const onCloseEditDialog = () => {
    setIsOpenEditDialog(false);
    setEditService(null);
  };

  const onOpenConfirmDialog = (srv: DoctorService) => {
    setIsOpenConfirmDialog(true);
    setConfirmService(srv);
  };
  const onCloseConfirmDialog = () => {
    setIsOpenConfirmDialog(false);
    setConfirmService(null);
  };

  
  const onChangeAddHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setAddService((prev) => ({
      ...prev,
      [name]: name === "duration_minutes" ? Number(value) : value,
    }));
  };

  const onSubmitAddHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingService(true);
    setError(null);

    try {
      const payload = {
        name: addService.name,
        price: addService.price,
        duration_minutes: addService.duration_minutes,
        doctor_id: doctorId
      };

      const res = await api.post('/api/doctor/services', payload);
      showAlert(t('services.addSuccess'), 'success');
      onCloseAddDialog();
      fetchServices();
    } catch (err: unknown) {
      const serverMsg = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : null;
      if (serverMsg === "The name has already been taken.") {
        
        const arabicMsg = t('services.nameAlreadyTaken');
        try {
          const trashedRes = await api.get('/api/doctor/services/trashed');
          const trashed = Array.isArray(trashedRes.data.data) ? trashedRes.data.data : [];
          const found = trashed.find((s: any) => s.name === addService.name);
          if (found) {
            await api.patch(`/api/doctor/services/restore/${found.id}`);
            fetchServices();
            showAlert(t('services.serviceRestored'), 'success');
            onCloseAddDialog();
            setIsAddingService(false);
            return;
          }
        } catch (findErr) {
          
        }
      }
      
      let arabicErrorMsg = serverMsg || t('services.addError');
      
      if (serverMsg && serverMsg.includes("already been taken")) {
        arabicErrorMsg = t('services.nameAlreadyTaken');
      } else if (serverMsg && serverMsg.includes("required")) {
        arabicErrorMsg = t('services.allFieldsRequired');
      } else if (err instanceof Error && 'response' in err && (err as any).response?.status === 422) {
        arabicErrorMsg = t('services.invalidData');
      }
      
      setError(arabicErrorMsg);
      showAlert(arabicErrorMsg, 'error');
    } finally {
      setIsAddingService(false);
    }
  };

  
  const onChangeEditHandler = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (!editService) return;
    const { name, value } = evt.target;
    setEditService((prev) => prev ? { ...prev, [name]: name === "duration_minutes" ? Number(value) : value } : null);
  };

  const onSubmitEditHandler = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    if (!editService) return;
    setSuccess(null);
    setError(null);
    try {
      const res = await api.post(`/api/doctor/services/${editService.id}`, editService, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      
      const updatedService = res.data && typeof res.data === 'object' && !Array.isArray(res.data)
        ? (res.data.data ? res.data.data : res.data)
        : res.data;
      setServices((prev) => prev.map((srv) => srv.id === editService.id ? updatedService : srv));
      showAlert(t('services.updateSuccess'), 'success');
      onCloseEditDialog();
    } catch (err: any) {
      setError(t('services.updateError'));
      showAlert(t('services.updateError'), 'error');
    }
  };

  
  const onDeleteHandler = async () => {
    if (!confirmService || !confirmService.id) return;
    setSuccess(null);
    setError(null);
    try {
      await api.delete(`/api/doctor/services/${confirmService.id}`);
      setServices((prev) => prev.filter((srv) => srv.id !== confirmService.id));
      showAlert(t('services.deleteSuccess'), 'success');
      onCloseConfirmDialog();
    } catch (err: any) {
      setError(t('services.deleteError'));
      showAlert(t('services.deleteError'), 'error');
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
    <div className="space-y-6 relative" key={`service-wrapper-${language}`}>
          <div className="flex justify-end gap-2">
            <Button 
              onClick={onOpenAddDialog}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md text-sm sm:text-base"
            >
              {translate('services.addNewService')}
            </Button>
          </div>

          {}
          {error && <div className="text-center text-red-500 py-2">{error}</div>}
          {success && <div className="text-center text-green-600 font-bold py-2">{success}</div>}

          {}
          <div className="relative rounded-3xl shadow-lg bg-white mt-4 fade-in dark:bg-card-dark dark:shadow-[0_2px_16px_0_rgba(36,44,80,0.18)] rounded-tl-[2.5rem] rounded-br-[2.5rem] overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="min-w-full w-full divide-y divide-gray-200 dark:divide-zinc-700 text-center align-middle">
                <thead className="bg-slate-50 dark:bg-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-white uppercase tracking-wide whitespace-nowrap bg-blue-600 dark:bg-blue-800">{translate('services.serviceName')}</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide whitespace-nowrap">{translate('services.price')}</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide whitespace-nowrap">{translate('services.duration')}</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide whitespace-nowrap">{translate('services.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {Array.isArray(currentItems) && currentItems.map((service, idx) => (
                    <tr key={service.id ?? idx}
                      className={`transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-gray-50 dark:bg-zinc-800'} hover:bg-accent/10 dark:hover:bg-zinc-700`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100 text-center align-middle text-sm sm:text-base">{service.displayName || service.name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 text-center align-middle text-sm sm:text-base">{service.price}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 text-center align-middle text-sm sm:text-base">{service.duration_minutes}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-center align-middle">
                        <div className="flex justify-center gap-2 sm:gap-3">
                          <button 
                            type="button"
                            onClick={() => onOpenEditDialog(service)}
                            className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow transition-all dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-white"
                            title={translate('services.edit')}>
                            <Edit2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => onOpenConfirmDialog(service)}
                            className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 shadow transition-all dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
                            title={translate('services.delete')}>
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="flex justify-center gap-2 sm:gap-4 mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-sm"
            >
              {translate('common.previous')}
            </Button>
            <span className="self-center text-gray-700 text-sm sm:text-base">
              {translate('services.page')} {currentPage} {translate('services.of')} {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-sm"
            >
              {translate('common.next')}
            </Button>
          </div>

          {}
          <DialogCustom
            open={isOpenAddDialog}
            onOpenChange={setIsOpenAddDialog}
            title={translate('services.addServiceTitle')}
            description={translate('services.addServiceDescription')}
          >
            <form className="space-y-6" onSubmit={onSubmitAddHandler}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {translate('services.serviceNameLabel')}
                  </label>
                  <Input
                    name="name"
                    value={addService.name}
                    onChange={onChangeAddHandler}
                    placeholder={translate('services.serviceNamePlaceholder')}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {translate('services.priceLabel')}
                    </label>
                    <Input
                      name="price"
                      type="number"
                      value={addService.price}
                      onChange={onChangeAddHandler}
                      placeholder={translate('services.pricePlaceholder')}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {translate('services.durationLabel')}
                    </label>
                    <Input
                      name="duration_minutes"
                      type="number"
                      value={addService.duration_minutes}
                      onChange={onChangeAddHandler}
                      placeholder={translate('services.durationPlaceholder')}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseAddDialog}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-all"
                >
                  {translate('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg transition-all"
                >
                  {translate('services.addServiceButton')}
                </Button>
              </div>
            </form>
          </DialogCustom>

          {}
          <DialogCustom
            open={isOpenEditDialog}
            onOpenChange={setIsOpenEditDialog}
            title={t('services.editServiceTitle')}
            description={t('services.editServiceDescription')}
          >
            <form className="space-y-6" onSubmit={onSubmitEditHandler}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {t('services.serviceNameLabel')}
                  </label>
                  <Input
                    name="name"
                    value={editService?.name || ''}
                    onChange={onChangeEditHandler}
                    placeholder={t('services.serviceNamePlaceholder')}
                    required
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {t('services.priceLabel')}
                    </label>
                    <Input
                      name="price"
                      type="number"
                      value={editService?.price || ''}
                      onChange={onChangeEditHandler}
                      placeholder={t('services.pricePlaceholder')}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {t('services.durationLabel')}
                    </label>
                    <Input
                      name="duration_minutes"
                      type="number"
                      value={editService?.duration_minutes || 0}
                      onChange={onChangeEditHandler}
                      placeholder={t('services.durationPlaceholder')}
                      required
                      className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseEditDialog}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-all"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium rounded-xl shadow-lg transition-all"
                >
                  {t('services.updateServiceButton')}
                </Button>
              </div>
            </form>
          </DialogCustom>

          {}
          <DialogCustom
            open={isOpenConfirmDialog}
            onOpenChange={setIsOpenConfirmDialog}
            title={t('services.deleteConfirmTitle')}
            description={t('services.deleteConfirmDescription')}
          >
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">{t('services.deleteWarning')}</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      {t('services.deleteWarningText')} <span className="font-semibold">"{translateServiceName(confirmService?.name ?? '')}"</span> {t('services.deleteWarningText2')}
                      <br />
                      <span className="text-red-600 dark:text-red-400 font-medium">{t('services.deleteWarningText3')}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseConfirmDialog}
                  className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-all"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={onDeleteHandler}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-lg transition-all"
                >
                  {t('services.deleteServiceButton')}
                </Button>
              </div>
            </div>
          </DialogCustom>

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
};

export default Service; 