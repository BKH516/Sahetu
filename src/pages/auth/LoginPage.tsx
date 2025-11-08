import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Sparkles, Shield, Zap, Clock, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { authApi } from "../../lib/axios";
import { api } from "../../lib/axios";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/button";
import Particles3D from "../../components/ui/Particles3D";
import FloatingElements from "../../components/ui/FloatingElements";
import { InfiniteTypewriterText } from "../../components/ui/InfiniteTypewriterText";
import LanguageSwitcher from "../../components/ui/LanguageSwitcher";
import { isValidEmail } from "../../utils/utils";
import { rateLimiter } from "../../utils/advancedRateLimit";
import { logLoginFailure } from "../../utils/securityLogger";
import { useTheme } from "../../hooks/useTheme";

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
  onForgotPassword?: () => void;
  onBackToLanding?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC<LoginPageProps> = React.memo(({
  onSwitchToRegister,
  onLoginSuccess,
  onForgotPassword,
  onBackToLanding,
}) => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockRemainingTime, setBlockRemainingTime] = useState(0);

  const { login } = useAuth();
  // Initialize theme hook to sync with theme changes
  useTheme();
  
  const isRTL = useMemo(() => i18n.language === 'ar', [i18n.language]);

  // Memoize handlers - use ref to avoid dependency on errors
  const errorsRef = useRef(errors);
  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errorsRef.current.email) setErrors((prev) => ({ ...prev, email: undefined }));
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorsRef.current.password) setErrors((prev) => ({ ...prev, password: undefined }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Listen for theme changes in real-time
  useEffect(() => {
    let lastTheme = localStorage.getItem('theme');
    
    const applyThemeFromStorage = () => {
      const root = document.documentElement;
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let shouldBeDark = false;
      if (savedTheme === 'dark') {
        shouldBeDark = true;
      } else if (savedTheme === 'light') {
        shouldBeDark = false;
      } else if (savedTheme === 'auto' || !savedTheme) {
        shouldBeDark = prefersDark;
      }
      
      const hasDarkClass = root.classList.contains('dark');
      
      // Only update if there's a mismatch
      if (shouldBeDark && !hasDarkClass) {
        root.classList.add('dark');
      } else if (!shouldBeDark && hasDarkClass) {
        root.classList.remove('dark');
      }
      
      lastTheme = savedTheme;
    };

    // Apply theme immediately on mount
    applyThemeFromStorage();

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        applyThemeFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom theme change events (same tab) - CRITICAL for same-tab changes
    const handleThemeChange = () => {
      applyThemeFromStorage();
    };
    window.addEventListener('themechange', handleThemeChange);
    
    // Use MutationObserver to watch for class changes on document.documentElement
    // This catches direct DOM manipulations - throttled to reduce performance impact
    let observerTimeout: NodeJS.Timeout | null = null;
    const observer = new MutationObserver(() => {
      // Throttle observer callbacks to reduce forced reflow
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
      observerTimeout = setTimeout(() => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme !== lastTheme) {
          applyThemeFromStorage();
        }
      }, 100); // Debounce observer callbacks
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Removed setInterval polling to reduce 'message' handler violations

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
      observer.disconnect();
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
    };
  }, []);

  const checkBlockStatus = () => {
    const blockInfo = rateLimiter.getBlockInfo(`login_${email}`);
    if (blockInfo?.blocked) {
      setIsBlocked(true);
      setBlockRemainingTime(blockInfo.remainingTime);
    } else {
      setIsBlocked(false);
      setBlockRemainingTime(0);
    }
  };

  useEffect(() => {
    // Throttle resize handler to reduce forced reflow
    let resizeTimeout: NodeJS.Timeout | null = null;
    let lastWidth = window.innerWidth;
    
    const checkScreenSize = () => {
      // Use requestAnimationFrame to batch resize checks
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout as unknown as number);
      }
      
      resizeTimeout = requestAnimationFrame(() => {
        const currentWidth = window.innerWidth;
        // Only update if width changed significantly (avoid unnecessary re-renders)
        if (Math.abs(currentWidth - lastWidth) > 10) {
          setIsDesktop(currentWidth >= 1024);
          lastWidth = currentWidth;
        }
      }) as unknown as NodeJS.Timeout;
    };
    
    // Debounce resize events to reduce handler calls
    let debounceTimeout: NodeJS.Timeout | null = null;
    const debouncedCheckScreenSize = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(checkScreenSize, 150);
    };
    
    checkScreenSize(); // Initial check
    window.addEventListener("resize", debouncedCheckScreenSize, { passive: true });
    
    return () => {
      window.removeEventListener("resize", debouncedCheckScreenSize);
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout as unknown as number);
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []);

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
    checkBlockStatus();
    
    if (isBlocked && blockRemainingTime > 0) {
      const timer = setInterval(() => {
        setBlockRemainingTime(prev => {
          if (prev <= 1000) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [email, isBlocked, blockRemainingTime]);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0-5
  }, [password]);

  const handleBack = useCallback(() => {
    if (typeof onBackToLanding === "function") {
      try {
        onBackToLanding();
        return;
      } catch {}
    }
    if (window.history && window.history.length > 1) {
      window.history.back();
      return;
    }
    const fallback = import.meta?.env?.BASE_URL || "/";
    window.location.assign(fallback);
  }, [onBackToLanding]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email) newErrors.email = t('auth.login.emailRequired');
    else if (!isValidEmail(email)) newErrors.email = t('auth.login.emailInvalid');
    if (!password) newErrors.password = t('auth.login.passwordRequired');
    else if (password.length < 6) newErrors.password = t('auth.login.passwordMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const cleanMessage = (msg: string): string => {
    return String(msg)
      .replace(/\(and \d+ more errors?\)/gi, '')
      .replace(/\(and \d+ more\)/gi, '')
      .replace(/and \d+ more errors?\.?/gi, '')
      .trim();
  };

  const tryLoginEndpoints = async (basePayload: any) => {
    const endpoints = [
      "/api/doctor/login",
      "/api/login",
      "/api/auth/login",
      "/login",
    ];
    
    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        const response = await authApi.post(endpoint, basePayload);
        if (response.status >= 200 && response.status < 300) {
          return response;
        }
        lastError = response;
      } catch (error: any) {
        lastError = error;
        // Retry next endpoint on 404 only; otherwise bubble up
        if (error.response?.status && error.response.status !== 404) {
          throw error;
        }
      }
    }
    
    if (!lastError) {
      throw new Error(t('auth.login.loginFailed'));
    }
    throw lastError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!navigator.onLine) {
      setErrors({ general: t('auth.login.noInternet') });
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrors({ general: t('auth.login.enterCredentials') });
      return;
    }
    
    // Rate limiting check
    const rateLimitKey = `login_${email}`;
    const rateLimitResult = rateLimiter.checkLimit(rateLimitKey, 5, 300000, 600000);
    if (!rateLimitResult.allowed) {
      setIsBlocked(true);
      setBlockRemainingTime(rateLimitResult.resetTime - Date.now());
      const minutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
      setErrors({ general: t('auth.login.rateLimitExceeded', { minutes }) });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    try {
      const payload = { email, password };
      const doctorResponse = await tryLoginEndpoints(payload);

      // استخراج token من response
      if (doctorResponse.data.token) {
        // دالة لاستخراج الاسم من البريد الإلكتروني
        const extractNameFromEmail = (email: string): string => {
          const username = email.split('@')[0];
          let name = username.replace(/[._-]/g, ' ');
          name = name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          return `دكتور ${name}`;
        };

        // إنشاء user object مباشرة من response
        const user = {
          id: doctorResponse.data.user?.id || 1,
          email: email,
          full_name: doctorResponse.data.user?.name || doctorResponse.data.user?.full_name || extractNameFromEmail(email),
          phone_number: doctorResponse.data.user?.phone_number || '',
          role: 'doctor',
          status: doctorResponse.data.user?.status || 'active',
          is_approved: doctorResponse.data.user?.is_approved || 'approved',
          created_at: doctorResponse.data.user?.created_at || new Date().toISOString(),
          updated_at: doctorResponse.data.user?.updated_at || new Date().toISOString(),
          roles: [
            {
              id: 1,
              name: 'doctor',
              guard_name: 'web',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        } as any;

        try {
          login(user, doctorResponse.data.token);
          
          onLoginSuccess();
          return;
        } catch (error) {
          setErrors({ general: t('auth.login.generalError') });
        }
      }
      
      // دالة لتنظيف الرسائل من "and X more error(s)"
      const cleanErrorMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .replace(/\(and \d+ more\)/gi, '')
          .replace(/and \d+ more errors?\.?/gi, '')
          .trim();
      };
      
      const errorMessage = doctorResponse?.data?.message || 
                          doctorResponse?.data?.error || 
                          t('auth.login.invalidCredentials');
      setErrors({ general: cleanErrorMessage(errorMessage) });
      logLoginFailure({ eventType: 'LOGIN_FAILURE', userEmail: email, details: 'Doctor login failed - no user/token returned', severity: 'MEDIUM' });
    } catch (error: any) {
      const responseData = error?.response?.data;
      const newErrors: FormErrors = {};
      
      if (error.code === 'ERR_NETWORK') {
        setErrors({ general: t('auth.login.serverError') });
      } else {
        const mainMessage = responseData?.message || responseData?.error || error?.message || t('auth.login.loginError');
        if (mainMessage) newErrors.general = cleanMessage(String(mainMessage));

        // Laravel validation errors
        const validationErrors = responseData?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          if (validationErrors.email?.[0]) newErrors.email = cleanMessage(String(validationErrors.email[0]));
          if (validationErrors.password?.[0]) newErrors.password = cleanMessage(String(validationErrors.password[0]));
        }

        // Common auth statuses
        const status = error?.response?.status;
        if (status === 401 && !newErrors.general) newErrors.general = t('auth.login.invalidCreds');
        if (status === 403 && !newErrors.general) newErrors.general = t('auth.login.noPermission');

        if (!newErrors.general) newErrors.general = t('auth.login.generalError');
        setErrors(newErrors);
      }
      
      // Log login failure for security monitoring
      logLoginFailure({ 
        eventType: 'LOGIN_FAILURE', 
        userEmail: email, 
        details: error?.response?.data?.message || error?.message || 'Unknown error', 
        severity: 'MEDIUM' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification flow removed as per request (login is email+password only)

  const renderInput = (
    field: keyof FormErrors,
    value: string,
    placeholder: string,
    type: string,
    icon: React.ReactNode,
    showToggle?: boolean
  ) => {
    const isPassword = type === "password";
    return (
      <div className="space-y-2">
        <div className="relative group">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-400 transition-colors duration-300 group-focus-within:text-blue-600">
            {icon}
          </div>
          <input
            type={isPassword && showToggle && showPassword ? "text" : type}
            id={field}
            value={value || ""}
            onChange={(e) => {
              if (field === "email") handleEmailChange(e as React.ChangeEvent<HTMLInputElement>);
              if (field === "password") handlePasswordChange(e as React.ChangeEvent<HTMLInputElement>);
            }}
            className={`w-full ps-12 ${showToggle && isPassword ? "pe-12" : "pe-4"} py-4 bg-white/80 dark:bg-gray-900/50 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 ${
              errors[field] ? "border-red-500 focus:ring-red-500/30 focus:border-red-500" : "border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-600"
            }`}
            placeholder={placeholder}
            required
            disabled={isLoading || !isOnline || isBlocked}
          />
          {showToggle && isPassword && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-300 transition-colors"
              disabled={isLoading || !isOnline || isBlocked}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {errors[field] && (
          <p className="text-sm text-red-500 dark:text-red-400 animate-in fade-in duration-200">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-900 via-gray-50 dark:via-gray-800 to-gray-100 dark:to-gray-900 flex items-center justify-center px-4 py-4 lg:py-0 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      <Particles3D />
      <FloatingElements />
      <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 relative z-10 min-h-full lg:h-full flex items-center py-4 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-12 w-full min-h-full lg:h-full lg:items-center">
          <div className="hidden lg:block lg:col-span-5 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full flex items-center"
            >
              <div className="bg-gradient-to-br from-blue-400/90 dark:from-blue-600/95 via-indigo-400/90 dark:via-indigo-600/95 to-purple-400/90 dark:to-purple-600/95 rounded-3xl shadow-2xl relative overflow-hidden w-full h-[600px] p-10 flex flex-col justify-center transition-colors duration-300">
                {/* Language Switcher */}
                <div className="absolute top-4 end-4 z-20">
                  <LanguageSwitcher />
                </div>
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20 pointer-events-none select-none">
                  <motion.div
                    className="absolute top-0 left-0 w-80 h-80 bg-blue-300 dark:bg-blue-400 rounded-full blur-3xl transition-colors duration-300"
                    animate={{
                      scale: [1, 1.2, 1],
                      x: [0, 50, 0],
                      y: [0, 30, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute bottom-0 right-0 w-80 h-80 bg-purple-300 dark:bg-purple-400 rounded-full blur-3xl transition-colors duration-300"
                    animate={{
                      scale: [1, 1.3, 1],
                      x: [0, -40, 0],
                      y: [0, -50, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-300 dark:bg-indigo-400 rounded-full blur-3xl transition-colors duration-300"
                    animate={{
                      scale: [1, 1.4, 1],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>

                {/* Floating Orbs */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/30 rounded-full"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 3) * 20}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Header Section */}
                    <div className="space-y-5">
                      <motion.button
                        type="button"
                        onClick={handleBack}
                        aria-label={t('common.back')}
                        title={t('common.back')}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        whileHover={{ scale: 1.05, x: isRTL ? -5 : 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl w-fit group mb-4"
                      >
                        <motion.div
                          animate={{ x: isRTL ? [0, -3, 0] : [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className={`w-5 h-5 ${!isRTL ? 'rotate-180' : ''}`} />
                        </motion.div>
                        <span className="text-sm font-semibold">{t('common.back')}</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </motion.button>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-5xl font-bold text-white leading-tight"
                      >
                        <InfiniteTypewriterText
                          text={t('auth.login.welcomeBack')}
                          className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 drop-shadow-lg"
                        />
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="text-blue-50 text-lg leading-relaxed font-medium"
                      >
                        {t('auth.login.description')}
                      </motion.p>
                    </div>

                    {/* Features Grid */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.9 }}
                      className="grid grid-cols-2 gap-4 mt-4"
                    >
                      {[
                        { icon: Shield, text: t('auth.login.features.dataProtection'), color: "from-blue-400 to-cyan-400" },
                        { icon: Zap, text: t('auth.login.features.fastSupport'), color: "from-purple-400 to-pink-400" },
                        { icon: Clock, text: t('auth.login.features.arabicInterface'), color: "from-indigo-400 to-blue-400" },
                        { icon: Award, text: t('auth.login.features.secureLogin'), color: "from-cyan-400 to-blue-400" },
                      ].map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 1 + idx * 0.1 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className="group relative overflow-hidden bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                          <div className="relative flex items-start gap-3">
                            <motion.div
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                              className={`p-2 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                            >
                              <feature.icon className="w-5 h-5 text-white" />
                            </motion.div>
                            <span className="text-sm font-medium text-blue-50 flex-1 leading-relaxed pt-1">
                              {feature.text}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Status Indicator */}
                    {!isOnline && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm"
                      >
                        <p className="text-sm text-red-100 text-center font-medium">⚠️ {t('common.noInternetConnection')}</p>
                      </motion.div>
                    )}

                    {/* Decorative Bottom Line */}
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 1, delay: 1.4 }}
                      className="mt-6 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 min-w-0 flex flex-col items-stretch h-full lg:max-h-[600px]">
            <div className="lg:hidden mb-2 px-2 sm:px-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                aria-label={t('common.back')}
                title={t('common.back')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur border border-gray-300 dark:border-white/20 transition-colors duration-300 w-fit"
              >
                <ArrowRight className={`w-5 h-5 ${!isRTL ? 'rotate-180' : ''}`} />
                <span className="text-sm font-medium">{t('common.back')}</span>
              </button>
              <LanguageSwitcher />
            </div>

            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/50 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
              <div className="p-4 sm:p-6 md:p-10 flex-1 min-w-0 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 min-w-0" id="loginForm">
                  <div className={`text-center ${isRTL ? 'lg:text-right' : 'lg:text-left'} mb-1 sm:mb-2`}>
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 dark:from-white to-blue-600 dark:to-blue-200 bg-clip-text text-transparent mb-1 sm:mb-2 transition-colors duration-300">{t('auth.login.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base transition-colors duration-300">{t('auth.login.subtitle')}</p>
                  </div>

                  <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{t('auth.login.email')}</label>
                    {renderInput("email", email, t('auth.login.emailPlaceholder'), "email", <Mail className="w-5 h-5" />)}
                  </div>

                  <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">{t('auth.login.password')}</label>
                    {renderInput("password", password, t('auth.login.passwordPlaceholder'), "password", <Lock className="w-5 h-5" />, true)}
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-colors duration-300">
                        <div
                          className={`h-full transition-all duration-500 ${
                            passwordStrength <= 1
                              ? "bg-red-500 w-1/5"
                              : passwordStrength === 2
                              ? "bg-orange-500 w-2/5"
                              : passwordStrength === 3
                              ? "bg-yellow-500 w-3/5"
                              : passwordStrength === 4
                              ? "bg-green-500 w-4/5"
                              : "bg-emerald-500 w-full"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {errors.general && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-in fade-in duration-200">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 text-center">{errors.general}</p>
                      {(errors.general.includes('اتصال') || errors.general.includes('خادم')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrors({});
                            if (navigator.onLine) {
                              handleSubmit(new Event('submit') as any);
                            }
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium mt-2"
                        >
                          🔁 {t('common.retry')}
                        </button>
                      )}
                    </div>
                  )}
                </form>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-xl p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
                  onClick={onForgotPassword}
                  disabled={isLoading || !isOnline || isBlocked}
                >
                  {t('auth.login.forgotPassword')}
                </Button>

                <Button
                  type="submit"
                  form="loginForm"
                  disabled={isLoading || !isOnline || isBlocked}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.login.loggingIn')}
                    </>
                  ) : (
                    <>
                      {t('auth.login.loginButton')}
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-center mt-4 sm:mt-6 lg:mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                {t('auth.login.noAccount')}{" "}
                <button
                  onClick={onSwitchToRegister}
                  disabled={isLoading || !isOnline || isBlocked}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('auth.login.createAccount')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;


