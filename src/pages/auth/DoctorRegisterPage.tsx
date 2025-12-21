import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { MailIcon, LockIcon, UserIcon, PhoneIcon, BriefcaseIcon, MapPinIcon, AcademicCapIcon } from '../../components/ui/InputIcons';
import { Button } from '../../components/ui/button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { isValidEmail } from '../../utils/utils';
import { rateLimiter } from '../../utils/advancedRateLimit';
import api from '../../lib/axios';
import ApiEndpointHelper from '../../lib/apiEndpoints';
import { Specialization } from '../../types';

interface DoctorRegisterPageProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
  onBackToLanding?: () => void;
}

const DoctorRegisterPage: React.FC<DoctorRegisterPageProps> = ({ onSwitchToLogin, onRegisterSuccess, onBackToLanding }) => {
  const { i18n } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [specializationId, setSpecializationId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [instructions, setInstructions] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [provinceId, setProvinceId] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; phone?: string; password?: string; specialization?: string; address?: string; gender?: string; age?: string; latitude?: string; longitude?: string; provinceId?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockRemainingTime, setBlockRemainingTime] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Use refs to prevent duplicate calls in Strict Mode
  const provincesFetchedRef = useRef(false);
  const specializationsFetchedRef = useRef(false);
  const handleBack = () => {
    if (typeof onBackToLanding === 'function') {
      try { onBackToLanding(); return; } catch {}
    }
    if (window.history && window.history.length > 1) {
      window.history.back();
      return;
    }
    const fallback = import.meta?.env?.BASE_URL || '/';
    window.location.assign(fallback);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  
  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (provincesFetchedRef.current && specializationsFetchedRef.current) {
      return;
    }

    const fetchSpecializations = async () => {
      // Skip if already fetched or currently fetching
      if (specializationsFetchedRef.current || specializations.length > 0) {
        return;
      }
      
      specializationsFetchedRef.current = true;
      setIsLoadingSpecializations(true);
      try {
        const response = await ApiEndpointHelper.getSpecializations();
        if (response.data && Array.isArray(response.data)) {
          setSpecializations(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setSpecializations(response.data.data);
        }
      } catch (error) {
        
        setSpecializations([]);
        setErrors({ general: 'فشل في تحميل التخصصات من الخادم. يرجى المحاولة مرة أخرى لاحقاً.' });
        // Reset ref on error so it can retry if needed
        specializationsFetchedRef.current = false;
      } finally {
        setIsLoadingSpecializations(false);
      }
    };

    const fetchProvinces = async () => {
      // Skip if already fetched or currently fetching
      if (provincesFetchedRef.current || provinces.length > 0) {
        return;
      }
      
      provincesFetchedRef.current = true;
      setIsLoadingProvinces(true);
      try {
        const response = await ApiEndpointHelper.getProvinces();
        // Use the same logic as Profile component which works
        const provincesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setProvinces(provincesData);
        // Clear any previous errors if we got data
        if (provincesData.length > 0) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.general;
            return newErrors;
          });
        }
      } catch (error: any) {
        console.error('Error fetching provinces:', error);
        setProvinces([]);
        const errorMessage = error?.message || error?.response?.data?.message || 'فشل في تحميل المحافظات. يرجى المحاولة مرة أخرى.';
        setErrors((prev) => ({ ...prev, general: errorMessage }));
        // Reset ref on error so it can retry if needed (but only for non-rate-limit errors)
        if (error?.response?.status !== 429) {
          provincesFetchedRef.current = false;
        }
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchSpecializations();
    fetchProvinces();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!fullName) newErrors.fullName = '⚠️ الاسم الكامل مطلوب';
    if (!email) newErrors.email = '⚠️ البريد الإلكتروني مطلوب';
    else if (!isValidEmail(email)) newErrors.email = '❌ يرجى إدخال بريد إلكتروني صحيح';
    if (!phone) newErrors.phone = '⚠️ رقم الهاتف مطلوب';
    else if (!/^\d{8,15}$/.test(phone)) newErrors.phone = '❌ يرجى إدخال رقم هاتف صحيح (8-15 رقم)';
    if (!password) newErrors.password = '⚠️ كلمة المرور مطلوبة';
    else if (password.length < 6) newErrors.password = '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (!specializationId) newErrors.specialization = '⚠️ التخصص مطلوب';
    if (!address) newErrors.address = '⚠️ العنوان مطلوب';
    if (!gender) newErrors.gender = '⚠️ الجنس مطلوب';
    if (!age) newErrors.age = '⚠️ العمر مطلوب';
    else if (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) newErrors.age = '❌ يرجى إدخال عمر صحيح بين 18 و 100';
    if (!latitude) newErrors.latitude = '⚠️ خط العرض مطلوب';
    else if (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) newErrors.latitude = '❌ يرجى إدخال خط عرض صحيح (-90 إلى 90)';
    if (!longitude) newErrors.longitude = '⚠️ خط الطول مطلوب';
    else if (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) newErrors.longitude = '❌ يرجى إدخال خط طول صحيح (-180 إلى 180)';
    if (!provinceId) newErrors.provinceId = '⚠️ المحافظة مطلوبة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    
    const rateLimitKey = `doctor_register_${email}`;
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, 2, 900000, 1200000); 
    
    if (!rateLimitResult.allowed) {
      setIsBlocked(true);
      setBlockRemainingTime(rateLimitResult.resetTime - Date.now());
      setErrors({ general: `تم تجاوز الحد المسموح للمحاولات. يرجى الانتظار ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)} دقائق.` });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('full_name', fullName);
      formData.append('email', email);
      formData.append('phone_number', phone);
      formData.append('password', password);
      formData.append('password_confirmation', password);
      formData.append('specialization_id', String(specializationId));
      formData.append('address', address);
      formData.append('gender', gender);
      formData.append('age', String(age));
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('province_id', provinceId);
      if (instructions) {
        formData.append('profile_description', instructions);
      }

      const response = await ApiEndpointHelper.registerDoctor(formData);

      // دالة لتنظيف الرسائل من "and X more error(s)"
      const cleanMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .replace(/\(and \d+ more\)/gi, '')
          .replace(/and \d+ more errors?\.?/gi, '')
          .trim();
      };
      
      if (response.status === 200 || response.status === 201) {
        const successMsg = response.data?.message || 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعة طلبك قريبًا.';
        setSuccessMessage(cleanMessage(successMsg));
        setTimeout(() => {
          onRegisterSuccess();
        }, 2000);
      } else {
        const errorMsg = response.data?.message || response.data?.error || 'فشل في التسجيل';
        setErrors({ general: cleanMessage(errorMsg) });
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setErrors({
          general: 'خطأ في الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى.',
        });
        return;
      }
      
      const responseData = error.response?.data;
      const statusCode = error.response?.status;
      const newErrors: typeof errors = {};
      
      // دالة لتنظيف الرسائل من "and X more error(s)"
      const cleanErrorMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .replace(/\(and \d+ more\)/gi, '')
          .replace(/and \d+ more errors?\.?/gi, '')
          .trim();
      };
      
      // استخراج رسالة الخطأ الرئيسية من API
      const mainMessage = responseData?.message || responseData?.error || responseData?.msg || '';
      
      // استخراج أخطاء الحقول إن وجدت
      const validationErrors = responseData?.errors || {};
      
      // عرض الرسالة الرئيسية
      if (mainMessage) {
        newErrors.general = cleanErrorMessage(mainMessage);
      }
      
      // عرض أخطاء الحقول
      if (typeof validationErrors === 'object' && Object.keys(validationErrors).length > 0) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          const messageArray = Array.isArray(messages) ? messages : [messages];
          const message = cleanErrorMessage(String(messageArray[0] || ''));
          
          // تعيين الخطأ للحقل المناسب
          if (field === 'email') {
            newErrors.email = message;
          } else if (field === 'phone' || field === 'phone_number') {
            newErrors.phone = message;
          } else if (field === 'fullName' || field === 'full_name' || field === 'name') {
            newErrors.fullName = message;
          } else if (field === 'password') {
            newErrors.password = message;
          } else if (field === 'specialization' || field === 'specialization_id') {
            newErrors.specialization = message;
          } else if (field === 'address') {
            newErrors.address = message;
          } else if (field === 'age') {
            newErrors.age = message;
          } else if (field === 'gender') {
            newErrors.gender = message;
          }
          
          // إضافة للرسالة العامة إذا لم تكن موجودة
          if (!newErrors.general) {
            newErrors.general = message;
          }
        });
      }
      
      // إذا لم يكن هناك أي رسالة، عرض رسالة افتراضية
      if (!newErrors.general && Object.keys(newErrors).length === 0) {
        if (typeof responseData === 'string') {
          newErrors.general = responseData;
        } else if (error.message && error.message !== 'Request failed with status code ' + statusCode) {
          newErrors.general = error.message;
        } else {
          newErrors.general = "حدث خطأ. حاول مرة أخرى.";
        }
      }
      
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderInput = (
    field: string,
    value: string,
    placeholder: string,
    type: string = "text",
    icon: React.ReactNode,
    onChange: (value: string) => void,
    error?: string
  ) => {
  return (
      <div className="relative group">
        <div
          className={`absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400 dark:text-gray-500 transition-all duration-300 peer-focus:text-cyan-600 group-hover:text-cyan-500 ${
            error ? "text-red-500 dark:text-red-400" : ""
          }`}
        >
          {icon}
        </div>
            <input
          type={type}
          id={field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`peer bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full ps-10 p-2.5 transition-all duration-300 placeholder-transparent ${
            error
              ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500 shake"
              : "border-slate-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600"
          }`}
          placeholder={placeholder}
          required
          disabled={isLoading || isBlocked || !isOnline}
          autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : "off"}
        />
        <label
          htmlFor={field}
          className={`absolute text-xs bg-white dark:bg-gray-800 duration-300 transform -translate-y-3.5 scale-90 top-1.5 z-10 origin-[0] rtl:origin-[100] px-2 peer-focus:px-2 peer-focus:text-cyan-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1.5 peer-focus:scale-90 peer-focus:-translate-y-3.5 start-9 ${
            error
              ? "text-red-500 dark:text-red-400"
              : "text-slate-500 dark:text-gray-400"
          }`}
        >
          {placeholder}
        </label>
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-pulse">
            {error}
          </p>
        )}
          </div>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
      <button
        type="button"
        onClick={handleBack}
        aria-label="رجوع"
        title="رجوع"
        className="absolute top-2 right-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg.WHITE/60 dark:hover:bg-gray-700/60 backdrop-blur border border-white/40 dark:border-gray-600 transition-colors"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="text-sm font-medium">رجوع</span>
      </button>
      <header className="mb-3 text-center">
        <img
          src={`${import.meta.env.BASE_URL}assets/sihatelogo.png`}
          alt="شعار صحتي"
          className="mx-auto h-14 w-auto mb-2 drop-shadow-lg dark:filter-none transition-transform hover:scale-105 duration-300"
          style={{ filter: "drop-shadow(0 0 16px #ef4444cc)" }}
        />
        <h1 className="text-xl font-black text-cyan-700 dark:text-cyan-400">
          تسجيل طبيب جديد
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400">
          انضم إلى منصة صحتي كطبيب معتمد
        </p>
        {!isOnline && (
          <div className="mt-2 p-1.5 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
            <p className="text-xs text-red-600 dark:text-red-400">
              ⚠️ لا يوجد اتصال بالإنترنت
            </p>
          </div>
        )}
      </header>

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-cyan-200/50 dark:border-gray-600 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-xl">
        <form onSubmit={handleRegister} className="space-y-3">
          {/* Grid layout for better organization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderInput(
              "fullName",
              fullName,
              "الاسم الكامل",
              "text",
              <UserIcon />,
              setFullName,
              errors.fullName
            )}
            {renderInput(
              "email",
              email,
              "البريد الإلكتروني",
              "email",
              <MailIcon />,
              setEmail,
              errors.email
            )}
            {renderInput(
              "phone",
              phone,
              "رقم الهاتف",
              "tel",
              <PhoneIcon />,
              setPhone,
              errors.phone
            )}

            {/* Password with toggle */}
            <div className="relative group">
              <div
                className={`absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400 dark:text-gray-500 transition-all duration-300 peer-focus:text-cyan-600 ${
                  errors.password ? "text-red-500 dark:text-red-400" : ""
                }`}
              >
                <LockIcon />
        </div>
            <input
                type={showPassword ? "text" : "password"}
                id="password"
              value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`peer bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full ps-10 pe-10 p-2.5 transition-all duration-300 placeholder-transparent ${
                  errors.password
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500 shake"
                    : "border-slate-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600"
                }`}
              placeholder="كلمة المرور"
                required
                disabled={isLoading || isBlocked || !isOnline}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                disabled={isLoading || isBlocked || !isOnline}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
              <label
                htmlFor="password"
                className={`absolute text-xs bg-white dark:bg-gray-800 duration-300 transform -translate-y-3.5 scale-90 top-1.5 z-10 origin-[0] rtl:origin-[100] px-2 peer-focus:px-2 peer-focus:text-cyan-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1.5 peer-focus:scale-90 peer-focus:-translate-y-3.5 start-9 ${
                  errors.password
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-500 dark:text-gray-400"
                }`}
              >
                كلمة المرور
              </label>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-pulse">
                  {errors.password}
                </p>
              )}
        </div>
        
            {/* Specialization select */}
            <div className="relative group">
              <div
                className={`absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400 dark:text-gray-500 transition-all duration-300 peer-focus-within:text-cyan-600 ${
                  errors.specialization ? "text-red-500 dark:text-red-400" : ""
                }`}
              >
                <AcademicCapIcon />
              </div>
            <select
                id="specialization"
              value={specializationId}
                onChange={(e) => setSpecializationId(e.target.value)}
                className={`peer bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full ps-10 p-2.5 transition-all duration-300 ${
                  errors.specialization
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500 shake"
                    : "border-slate-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600"
                }`}
                required
                disabled={isLoading || isBlocked || !isOnline || isLoadingSpecializations}
            >
              <option value="" disabled>
                {isLoadingSpecializations ? "جاري تحميل التخصصات..." : "اختر التخصص"}
              </option>
              {specializations.map((spec) => (
                <option key={spec.id} value={String(spec.id)}>
                  {i18n.language === 'ar' ? spec.name_ar : spec.name_en}
                </option>
              ))}
            </select>
              {errors.specialization && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-pulse">
                  {errors.specialization}
                </p>
              )}
        </div>
       
            {/* Age */}
            {renderInput(
              "age",
              age,
              "العمر",
              "number",
              <UserIcon />,
              setAge,
              errors.age
            )}

            {/* Gender select */}
            <div className="relative group">
              <div
                className={`absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400 dark:text-gray-500 transition-all duration-300 peer-focus-within:text-cyan-600 ${
                  errors.gender ? "text-red-500 dark:text-red-400" : ""
                }`}
              >
                <UserIcon />
        </div>
            <select
                id="gender"
              value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`peer bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full ps-10 p-2.5 transition-all duration-300 ${
                  errors.gender
                    ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500 shake"
                    : "border-slate-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600"
                }`}
                required
                disabled={isLoading || isBlocked || !isOnline}
              >
                <option value="" disabled>
                  الجنس
                </option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
              {errors.gender && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-pulse">
                  {errors.gender}
                </p>
              )}
            </div>
          </div>

          {/* Full width fields */}
          {renderInput(
            "address",
            address,
            "عنوان العيادة",
            "text",
            <MapPinIcon />,
            setAddress,
            errors.address
          )}

          {/* Latitude and Longitude */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderInput(
              "latitude",
              latitude,
              "خط العرض (Latitude)",
              "number",
              <MapPinIcon />,
              setLatitude,
              errors.latitude
            )}
            {renderInput(
              "longitude",
              longitude,
              "خط الطول (Longitude)",
              "number",
              <MapPinIcon />,
              setLongitude,
              errors.longitude
            )}
          </div>

          {/* Province select */}
          <div className="relative group">
            <div
              className={`absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400 dark:text-gray-500 transition-all duration-300 peer-focus-within:text-cyan-600 ${
                errors.provinceId ? "text-red-500 dark:text-red-400" : ""
              }`}
            >
              <MapPinIcon />
            </div>
            <select
              id="province"
              value={provinceId}
              onChange={(e) => setProvinceId(e.target.value)}
              className={`peer bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full ps-10 p-2.5 transition-all duration-300 ${
                errors.provinceId
                  ? "border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500 shake"
                  : "border-slate-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600"
              }`}
              required
              disabled={isLoading || isBlocked || !isOnline || isLoadingProvinces}
            >
              <option value="" disabled>
                {isLoadingProvinces ? "جاري تحميل المحافظات..." : "اختر المحافظة"}
              </option>
              {provinces.map((province) => (
                <option key={province.id} value={String(province.id)}>
                  {province.name_ar || province.name_en || province.name}
                </option>
              ))}
            </select>
            {errors.provinceId && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400 animate-pulse">
                {errors.provinceId}
              </p>
            )}
          </div>

          {/* Instructions textarea */}
          <div className="relative group">
            <div
              className="absolute top-3 start-0 flex items-start ps-3 pointer-events-none text-slate-400 dark:text-gray-500 transition-all duration-300 peer-focus:text-cyan-600"
            >
              <BriefcaseIcon />
            </div>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="peer bg-white dark:bg-gray-800 border text-slate-900 dark:text-gray-100 text-sm rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full ps-10 p-2.5 transition-all duration-300 placeholder-slate-400 dark:placeholder-gray-500 resize-none border-slate-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600"
              placeholder="تعليمات قبل الحجز (اختياري)"
              rows={2}
              disabled={isLoading || isBlocked || !isOnline}
            />
          </div>

          {errors.general && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-xl shadow-lg">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300 text-center leading-relaxed">
                {errors.general}
              </p>
        </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600 rounded-xl shadow-lg">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 text-center leading-relaxed">
                {successMessage}
              </p>
        </div>
          )}

        {isBlocked && (
            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-600 rounded-xl shadow-lg">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 text-center mb-1">
                ⏳ تم حظر التسجيل مؤقتاً
              </p>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 text-center">
              الوقت المتبقي: {formatTime(blockRemainingTime)}
            </p>
          </div>
        )}

          <Button
            type="submit"
            disabled={isLoading || isBlocked || !isOnline || specializations.length === 0 || provinces.length === 0}
            className="w-full mt-3 text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-cyan-300 font-bold rounded-lg text-sm px-5 py-3 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                جاري التسجيل...
              </div>
            ) : isBlocked ? (
              "حساب محظور مؤقتاً"
            ) : specializations.length === 0 || provinces.length === 0 ? (
              "يرجى تحميل البيانات أولاً"
            ) : (
              "تسجيل كطبيب"
            )}
        </Button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-gray-400 mt-3">
        لديك حساب بالفعل؟{" "}
        <button
          onClick={onSwitchToLogin}
          disabled={isLoading || isBlocked || !isOnline}
          className="font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          تسجيل الدخول
          </button>
      </p>
    </div>
  );
};

export default DoctorRegisterPage;
