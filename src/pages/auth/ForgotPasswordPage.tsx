import React, { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MailIcon, LockIcon } from '../../components/ui/InputIcons';
import { Button } from '../../components/ui/button';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Clock, Sparkles } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { isValidEmail } from '../../utils/utils';
import api from '../../lib/axios';
import Particles3D from '../../components/ui/Particles3D';
import FloatingElements from '../../components/ui/FloatingElements';
import { InfiniteTypewriterText } from '../../components/ui/InfiniteTypewriterText';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

type StepKey = 'email' | 'reset';

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [step, setStep] = useState<StepKey>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const highlightItems = useMemo(() => (
    [
      { icon: Shield, label: t('auth.login.features.dataProtection') },
      { icon: Clock, label: t('auth.login.features.fastSupport') },
      { icon: Sparkles, label: t('auth.login.features.secureLogin') },
    ]
  ), [t]);

  const stepsMeta = useMemo(() => (
    [
      {
        key: 'email' as StepKey,
        title: t('auth.forgotPassword.sendCode'),
        description: t('auth.forgotPassword.enterEmailForCode'),
      },
      {
        key: 'reset' as StepKey,
        title: t('auth.forgotPassword.resetPasswordButton'),
        description: email
          ? `${t('auth.forgotPassword.verificationCodeSent')} ${email}`
          : t('auth.forgotPassword.verificationCodePlaceholder'),
      },
    ]
  ), [t, email]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (!error) return fallback;
    const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: Record<string, string[]> }>;
    const responseData = axiosError.response?.data;
    const explicitMessage = responseData?.message || responseData?.error;
    if (explicitMessage) return explicitMessage;
    if (responseData?.errors) {
      const firstKey = Object.keys(responseData.errors)[0];
      if (firstKey && responseData.errors[firstKey]?.length) {
        return responseData.errors[firstKey][0];
      }
    }
    if (axiosError.message && axiosError.message !== 'Network Error') {
      return axiosError.message;
    }
    return fallback;
  };

  const validateEmail = () => {
    if (!email) {
      setErrors({ email: t('auth.forgotPassword.emailRequired') });
      return false;
    }
    if (!isValidEmail(email)) {
      setErrors({ email: t('auth.forgotPassword.emailInvalid') });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateResetForm = () => {
    const newErrors: { code?: string; newPassword?: string; confirmPassword?: string } = {};

    if (!verificationCode) {
      newErrors.code = t('auth.forgotPassword.codeRequired');
    } else if (verificationCode.length !== 6) {
      newErrors.code = t('auth.forgotPassword.codeLength');
    }

    if (!newPassword) {
      newErrors.newPassword = t('auth.forgotPassword.newPasswordRequired');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t('auth.forgotPassword.newPasswordMinLength');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.forgotPassword.confirmPasswordRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('auth.forgotPassword.passwordsMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);
    try {
      await api.post('/api/password/forgot', { email: email.trim() });
      setSuccessMessage(t('auth.forgotPassword.codeSentSuccess'));
      setStep('reset');
      setErrors({});
    } catch (error) {
      setApiError(getErrorMessage(error, t('auth.forgotPassword.sendCodeFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetForm()) return;
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);
    try {
      await api.post('/api/password/reset', {
        email: email.trim(),
        code: verificationCode.trim(),
        password: newPassword
      });
      setSuccessMessage(t('auth.forgotPassword.passwordResetSuccess'));
      setTimeout(() => {
        onBackToLogin();
      }, 1200);
    } catch (error) {
      setApiError(getErrorMessage(error, t('auth.forgotPassword.resetPasswordFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'code':
        setVerificationCode(value.replace(/[^0-9]/g, ''));
        break;
      case 'newPassword':
        setNewPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
    
    
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleSendCode} className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-semibold text-slate-700 dark:text-gray-200"
        >
          {t('auth.forgotPassword.email')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 dark:text-gray-500 group-focus-within:text-cyan-500 transition-colors">
            <MailIcon />
          </div>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full ps-11 pe-4 py-3.5 rounded-xl border-2 bg-white/90 dark:bg-gray-900/60 text-slate-900 dark:text-gray-100 shadow-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 placeholder:text-sm placeholder:text-slate-400 ${
              errors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 dark:border-gray-700 hover:border-cyan-400/70'
            }`}
            placeholder={t('auth.forgotPassword.email')}
            required
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            {t('auth.forgotPassword.sending')}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {t('auth.forgotPassword.sendCode')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        )}
      </Button>
    </form>
  );

  const renderResetStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <label
          htmlFor="code"
          className="text-sm font-semibold text-slate-700 dark:text-gray-200"
        >
          {t('auth.forgotPassword.verificationCode')}
        </label>
        <input
          type="text"
          id="code"
          value={verificationCode}
          onChange={(e) => handleInputChange('code', e.target.value)}
          maxLength={6}
          className={`w-full px-4 py-3.5 text-center tracking-[0.4em] uppercase rounded-xl border-2 bg-white/90 dark:bg-gray-900/60 text-lg font-semibold text-slate-900 dark:text-gray-100 shadow-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 placeholder:text-sm placeholder:text-slate-400 ${
            errors.code
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 dark:border-gray-700 hover:border-cyan-400/70'
          }`}
          placeholder={t('auth.forgotPassword.verificationCodePlaceholder')}
          required
          disabled={isLoading}
        />
        {errors.code && (
          <p className="text-sm text-red-500 dark:text-red-400">{errors.code}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="text-sm font-semibold text-slate-700 dark:text-gray-200"
        >
          {t('auth.forgotPassword.newPassword')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 dark:text-gray-500 group-focus-within:text-cyan-500 transition-colors">
            <LockIcon />
          </div>
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            value={newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            className={`w-full ps-11 pe-12 py-3.5 rounded-xl border-2 bg-white/90 dark:bg-gray-900/60 text-slate-900 dark:text-gray-100 shadow-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 placeholder:text-sm placeholder:text-slate-400 ${
              errors.newPassword
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 dark:border-gray-700 hover:border-cyan-400/70'
            }`}
            placeholder={t('auth.forgotPassword.newPassword')}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className={`absolute inset-y-0 ${isRTL ? 'start-0 ps-3' : 'end-0 pe-3'} flex items-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors`}
            disabled={isLoading}
          >
            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-red-500 dark:text-red-400">{errors.newPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-semibold text-slate-700 dark:text-gray-200"
        >
          {t('auth.forgotPassword.confirmPassword')}
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400 dark:text-gray-500 group-focus-within:text-cyan-500 transition-colors">
            <LockIcon />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full ps-11 pe-12 py-3.5 rounded-xl border-2 bg-white/90 dark:bg-gray-900/60 text-slate-900 dark:text-gray-100 shadow-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 placeholder:text-sm placeholder:text-slate-400 ${
              errors.confirmPassword
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-200 dark:border-gray-700 hover:border-cyan-400/70'
            }`}
            placeholder={t('auth.forgotPassword.confirmPassword')}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className={`absolute inset-y-0 ${isRTL ? 'start-0 ps-3' : 'end-0 pe-3'} flex items-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors`}
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 dark:text-red-400">{errors.confirmPassword}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" color="white" />
            {t('auth.forgotPassword.resettingPassword')}
          </div>
        ) : (
          t('auth.forgotPassword.resetPasswordButton')
        )}
      </Button>
    </form>
  );

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
    setApiError(null);
    setSuccessMessage(null);
  };

  return (
    <div
      className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-8 lg:py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Particles3D />
      <FloatingElements />

      <div className="w-full max-w-7xl xl:max-w-8xl mx-auto px-2 sm:px-6 lg:px-8 xl:px-12 relative z-10 min-h-full lg:h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 w-full">
          <div className="hidden lg:flex lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/90 via-blue-600/95 to-indigo-700/95 shadow-2xl border border-white/10 px-10 py-12 flex flex-col justify-between text-white w-full"
            >
              <div className="absolute top-4 end-4">
                <LanguageSwitcher />
              </div>

              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <motion.div
                  className="absolute -top-16 -start-16 w-72 h-72 bg-white/30 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 15, 0],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute bottom-0 end-0 w-80 h-80 bg-white/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1.1, 0.9, 1.1],
                    rotate: [0, -20, 0],
                  }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              <div className="relative z-10 space-y-8">
                <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm uppercase tracking-[0.35em] text-white/70">
                    {t('auth.forgotPassword.forgotPasswordTitle')}
                  </p>
                  <h1 className="mt-4 text-4xl font-black leading-tight">
                    <InfiniteTypewriterText
                      text={t('auth.forgotPassword.title')}
                      className="bg-gradient-to-r from-white via-cyan-100 to-white/80 bg-clip-text text-transparent drop-shadow-lg"
                    />
                  </h1>
                  <p className="mt-4 text-base text-white/80 max-w-md">
                    {t('auth.forgotPassword.enterEmailForCode')}
                  </p>
                </div>

                <div className="space-y-4">
                  {highlightItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 * index }}
                      className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg px-5 py-4 flex items-center gap-4"
                    >
                      <div className="rounded-xl bg-white/20 p-2 shadow-lg">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white/80">
                        {item.label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-6 py-5 text-sm text-white/80"
                >
                  {t('auth.login.features.arabicInterface')}
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="lg:hidden mb-6 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToLogin}
                className="flex items-center gap-2 text-slate-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'}`} />
                <span className="text-sm font-medium">{t('auth.forgotPassword.backToLogin')}</span>
              </Button>
              <LanguageSwitcher />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="bg-white/85 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-gray-800/70 flex-1"
            >
              <div className="p-5 sm:p-8 md:p-10 flex flex-col gap-6 h-full">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onBackToLogin}
                    className="hidden lg:inline-flex items-center gap-2 text-slate-700 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'}`} />
                    <span className="text-sm font-medium">{t('auth.forgotPassword.backToLogin')}</span>
                  </Button>
                  <span className="hidden lg:block text-xs font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                    {t('auth.forgotPassword.title')}
                  </span>
                </div>

                <div className={`space-y-3 text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'}`}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                    <InfiniteTypewriterText
                      text={t('auth.forgotPassword.title')}
                      className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-cyan-600 to-blue-600 dark:from-white dark:via-cyan-300 dark:to-blue-300"
                    />
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-gray-300">
                    {step === 'email'
                      ? t('auth.forgotPassword.enterEmailForCode')
                      : `${t('auth.forgotPassword.verificationCodeSent')} ${email}`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stepsMeta.map((meta) => {
                    const isActive = step === meta.key;
                    const isCompleted = step === 'reset' && meta.key === 'email';
                    const baseClasses = 'rounded-2xl border px-4 py-3 shadow-sm transition-all duration-300 flex flex-col gap-1';
                    const stateClasses = isActive
                      ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-500/5 text-cyan-700 dark:text-cyan-300 shadow-lg'
                      : isCompleted
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 shadow-lg'
                        : 'border-slate-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-slate-600 dark:text-gray-300';

                    return (
                      <motion.div
                        key={meta.key}
                        whileHover={{ scale: isActive || isCompleted ? 1.02 : 1.01 }}
                        className={`${baseClasses} ${stateClasses} ${isRTL ? 'text-right' : 'text-left'}`}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {meta.title}
                        </span>
                        <span className="text-sm leading-relaxed opacity-80">
                          {meta.description}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  {step === 'email' ? renderEmailStep() : renderResetStep()}

                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/90 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-300"
                    >
                      {apiError}
                    </motion.div>
                  )}

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/90 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300"
                    >
                      {successMessage}
                    </motion.div>
                  )}

                  {step === 'email' ? (
                    <p className="text-center text-sm text-slate-500 dark:text-gray-300">
                      {t('auth.forgotPassword.rememberPassword')}{' '}
                      <button
                        onClick={onBackToLogin}
                        disabled={isLoading}
                        className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 underline-offset-4 hover:underline transition-colors disabled:opacity-50"
                      >
                        {t('auth.forgotPassword.backToLogin')}
                      </button>
                    </p>
                  ) : (
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleBackToEmail}
                        disabled={isLoading}
                        className="mx-auto flex items-center gap-2 text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-200"
                      >
                        <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        {t('auth.forgotPassword.backToChangeEmail')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 