import React, { useState, useEffect } from 'react';
import { authApi } from '../../lib/axios';
import { isValidEmail } from '../../utils/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  EnvelopeIcon, 
  ArrowLeftIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '../../components/ui/InputIcons';

interface VerificationPageProps {
  email: string;
  onVerificationSuccess: () => void;
  onBackToRegister: () => void;
}

interface VerificationErrors {
  code?: string;
  email?: string;
  general?: string;
}

const VerificationPage: React.FC<VerificationPageProps> = ({ 
  email, 
  onVerificationSuccess, 
  onBackToRegister 
}) => {

  
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState<VerificationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const validateForm = () => {
    const newErrors: VerificationErrors = {};

    if (!verificationCode.trim()) {
      newErrors.code = 'كود التحقق مطلوب';
    } else if (verificationCode.trim().length !== 6) {
      newErrors.code = 'كود التحقق يجب أن يكون 6 أرقام';
    } else if (!/^\d{6}$/.test(verificationCode.trim())) {
      newErrors.code = 'كود التحقق يجب أن يحتوي على أرقام فقط';
    }

    if (!email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      setErrors({ general: 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('code', verificationCode.trim());

      const response = await authApi.post('/api/doctor/verifyCode', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.access_token) {
        
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('token_type', response.data.token_type);
        
        setSuccessMessage('تم التحقق من الكود بنجاح! جاري تحويلك إلى لوحة التحكم...');
        
        setTimeout(() => {
          onVerificationSuccess();
        }, 2000);
      }
    } catch (error: any) {

      
      // دالة لتنظيف الرسائل من "and X more error(s)"
      const cleanErrorMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .replace(/\(and \d+ more\)/gi, '')
          .replace(/and \d+ more errors?\.?/gi, '')
          .trim();
      };
      
      if (error.response?.status === 401) {
        const errorMsg = error.response.data?.message || 'كود التحقق غير صحيح أو منتهي الصلاحية';
        setErrors({ code: cleanErrorMessage(errorMsg) });
      } else if (error.response?.status === 422) {
        if (error.response.data.errors) {
          const apiErrors = error.response.data.errors;
          const newErrors: VerificationErrors = {};
          
          if (apiErrors.code) {
            const codeMsg = Array.isArray(apiErrors.code) ? apiErrors.code[0] : apiErrors.code;
            newErrors.code = cleanErrorMessage(codeMsg);
          }
          if (apiErrors.email) {
            const emailMsg = Array.isArray(apiErrors.email) ? apiErrors.email[0] : apiErrors.email;
            newErrors.email = cleanErrorMessage(emailMsg);
          }
          
          setErrors(newErrors);
        } else {
          const errorMsg = error.response.data.message || 'حدث خطأ في التحقق من الكود';
          setErrors({ general: cleanErrorMessage(errorMsg) });
        }
      } else if (error.response?.status === 429) {
        setErrors({ general: 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قبل المحاولة مرة أخرى.' });
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
        setErrors({ general: cleanErrorMessage(errorMsg) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    
    const numericValue = value.replace(/[^0-9]/g, '');
    
    
    if (numericValue.length <= 6) {
      setVerificationCode(numericValue);
    }
    
    
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full space-y-8">
        {}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-cyan-100 dark:bg-cyan-900/20 rounded-full flex items-center justify-center">
            <EnvelopeIcon />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            التحقق من البريد الإلكتروني
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            تم إرسال كود تحقق مكون من 6 أرقام إلى
          </p>
          <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
            {email}
          </p>
        </div>

        {}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex">
              <CheckCircleIcon />
              <p className="ml-3 text-sm text-green-800 dark:text-green-200">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {}
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon />
              <p className="ml-3 text-sm text-red-800 dark:text-red-200">
                {errors.general}
              </p>
            </div>
          </div>
        )}

        {}
        <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
          <div className="space-y-4">
            {}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon />
              </div>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border text-gray-900 dark:text-white text-center text-lg font-mono bg-white dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-300 ${
                  errors.code 
                    ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="000000"
                maxLength={6}
                disabled={isLoading || !isOnline}
                autoComplete="one-time-code"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-500 dark:text-red-400 text-center">
                  {errors.code}
                </p>
              )}
            </div>

            {}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                أدخل كود التحقق المكون من 6 أرقام
              </p>
            </div>
          </div>

          {}
          <button
            type="submit"
            disabled={isLoading || !isOnline || verificationCode.length !== 6}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
          >
            {isLoading ? (
              <LoadingSpinner color="white" />
            ) : (
              'تحقق من الكود'
            )}
          </button>

          {}
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToRegister}
              disabled={isLoading}
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition duration-300"
            >
              <ArrowLeftIcon />
              العودة إلى التسجيل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationPage; 