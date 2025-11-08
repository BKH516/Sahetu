import React, { useState, useEffect } from 'react';
import { securityLogger, logSecurityAlert, logLoginSuccess, logLoginFailure } from '../../utils/securityLogger';

interface TwoFactorAuthProps {
  onVerify: (isValid: boolean) => void;
  onCancel: () => void;
  email: string;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onVerify, onCancel, email }) => {
  const [code, setCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(300); 
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    
    sendVerificationCode();
    
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email]); 

  
  const sendVerificationCode = async () => {
    try {
      setIsLoading(true);
      setError('');

      
      const csrfToken = getCSRFToken();
      
      
      const response = await fetch('https://evra-co.com/api/auth/2fa/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        logSecurityAlert({
          userEmail: email,
          details: '2FA code sent successfully',
          severity: 'MEDIUM'
        });
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (error) {
      setError('فشل في إرسال رمز التحقق. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleVerify = async () => {
    if (!code.trim() || code.length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      
      const csrfToken = getCSRFToken();
      
      
      const response = await fetch('https://evra-co.com/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email, code })
      });

      if (response.ok) {
        logLoginSuccess({
          userEmail: email,
          details: '2FA verification successful',
          severity: 'LOW'
        });
        onVerify(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'رمز التحقق غير صحيح');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'رمز التحقق غير صحيح');
      
      logLoginFailure({
        userEmail: email,
        details: '2FA verification failed',
        severity: 'MEDIUM'
      });
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setTimeLeft(300);
    setCode('');
    setError('');
    await sendVerificationCode();
  };

  
  const getCSRFToken = (): string => {
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return metaTag?.content || generateCSRFToken();
  };

  
  const generateCSRFToken = (): string => {
    const token = btoa(Math.random().toString()).substr(10, 32);
    sessionStorage.setItem('csrf-token', token);
    return token;
  };

  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            التحقق بخطوتين
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            تم إرسال رمز التحقق إلى بريدك الإلكتروني
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {email}
          </p>
        </div>

        <div className="space-y-4">
          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              رمز التحقق
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {}
          {error && (
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              الوقت المتبقي: {formatTime(timeLeft)}
            </p>
          </div>

          {}
          <div className="flex gap-3">
            <button
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري التحقق...' : 'تحقق'}
            </button>
            
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
          </div>

          {}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={!canResend || isLoading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              إعادة إرسال الرمز
            </button>
          </div>

          {}
          <div className="text-center text-xs text-gray-500 dark:text-gray-500">
            <p>لم تتلق الرمز؟ تحقق من مجلد الرسائل المزعجة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth; 