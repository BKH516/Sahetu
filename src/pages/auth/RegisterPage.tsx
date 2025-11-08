import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Eye, 
  EyeOff, 
  Upload, 
  ArrowRight, 
  ArrowLeft,
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Briefcase, 
  FileText,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Award
} from "lucide-react";
import { authApi } from "../../lib/axios";
import { useAuth } from "../../hooks/useAuth";
import { ApiEndpointHelper } from "../../lib/apiEndpoints";
import { Specialization } from "../../types";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { Button } from "../../components/ui/button";
import Particles3D from "../../components/ui/Particles3D";
import FloatingElements from "../../components/ui/FloatingElements";
import { InfiniteTypewriterText } from "../../components/ui/InfiniteTypewriterText";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../../components/ui/LanguageSwitcher";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
  onBackToLanding?: () => void;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  phone_number?: string;
  specialization?: string;
  address?: string;
  age?: string;
  gender?: string;
  license_image?: string;
  profile_description?: string;
  fcm_token?: string;
  general?: string;
}

const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onRegisterSuccess,
  onBackToLanding,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const steps = [
    { id: 1, title: t('auth.register.steps.personal'), icon: User },
    { id: 2, title: t('auth.register.steps.professional'), icon: Briefcase },
    { id: 3, title: t('auth.register.steps.additional'), icon: FileText },
    { id: 4, title: t('auth.register.steps.confirm'), icon: CheckCircle2 },
  ];
  
  const [currentStep, setCurrentStep] = useState(1);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setPasswordConfirmation] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [license_image, setLicenseImage] = useState<File | null>(null);
  const [profile_description, setProfileDescription] = useState("");
  const [fcm_token, setFcmToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDesktop, setIsDesktop] = useState(false);
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0-5
  }, [password]);

  const { login } = useAuth();
  // Initialize theme hook to sync with theme changes
  useTheme();

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
      // Throttle observer callbacks to reduce forced reflow and message handler violations
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }
      observerTimeout = setTimeout(() => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme !== lastTheme) {
          applyThemeFromStorage();
        }
      }, 150); // Debounce observer callbacks (slightly longer than LoginPage for less frequent updates)
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
    window.addEventListener('resize', debouncedCheckScreenSize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', debouncedCheckScreenSize);
      if (resizeTimeout) {
        cancelAnimationFrame(resizeTimeout as unknown as number);
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []);
  
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
    const fetchSpecializations = async () => {
      setIsLoadingSpecializations(true);
      try {
        const response = await ApiEndpointHelper.getSpecializations();
        
        if (response.data && Array.isArray(response.data)) {
          setSpecializations(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setSpecializations(response.data.data);
        } else {
          setSpecializations([]);
        }
      } catch (error) {
        setSpecializations([]);
      } finally {
        setIsLoadingSpecializations(false);
      }
    };

    fetchSpecializations();
  }, []);

  const validateCurrentStep = () => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
    if (!full_name.trim()) {
        newErrors.full_name = t('auth.register.fullNameRequired');
    } else if (full_name.trim().length < 3) {
        newErrors.full_name = t('auth.register.fullNameMinLength');
    }
    
    if (!email) {
        newErrors.email = t('auth.register.emailRequired');
    } else if (!isValidEmail(email)) {
        newErrors.email = t('auth.register.emailInvalid');
    }
    
    if (!phone_number.trim()) {
        newErrors.phone_number = t('auth.register.phoneRequired');
    } else if (phone_number.trim().length < 10) {
        newErrors.phone_number = t('auth.register.phoneMinLength');
      }
    } else if (currentStep === 2) {
    if (!specializationId) {
      if (specializations.length === 0) {
          newErrors.specialization = t('auth.register.specializationLoading');
      } else {
          newErrors.specialization = t('auth.register.specializationRequired');
      }
    }
    
    if (!age) {
        newErrors.age = t('auth.register.ageRequired');
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
          newErrors.age = t('auth.register.ageRange');
      }
    }
    
    if (!gender) {
        newErrors.gender = t('auth.register.genderRequired');
      }
    } else if (currentStep === 3) {
      if (!address.trim()) {
        newErrors.address = t('auth.register.addressRequired');
      } else if (address.trim().length < 5) {
        newErrors.address = t('auth.register.addressMinLength');
      }
    
    if (!license_image) {
        newErrors.license_image = t('auth.register.licenseRequired');
    }
    
    if (!profile_description.trim()) {
        newErrors.profile_description = t('auth.register.profileDescriptionRequired');
    } else if (profile_description.trim().length < 10) {
        newErrors.profile_description = t('auth.register.profileDescriptionMinLength');
    }
    } else if (currentStep === 4) {
    if (!password) {
        newErrors.password = t('auth.register.passwordRequired');
    } else if (password.length < 8) {
        newErrors.password = t('auth.register.passwordMinLength');
    }
    
    if (!password_confirmation) {
        newErrors.password_confirmation = t('auth.register.confirmPasswordRequired');
    } else if (password !== password_confirmation) {
        newErrors.password_confirmation = t('auth.register.passwordMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      setErrors({});
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);
    
    try {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
      formData.append("password_confirmation", password_confirmation);
        formData.append("full_name", full_name);
        formData.append("phone_number", phone_number);
        formData.append("specialization_id", String(specializationId));
        formData.append("address", address);
        formData.append("age", age);
        formData.append("gender", gender);
      formData.append("profile_description", profile_description);
      
      if (fcm_token) {
        formData.append("fcm_token", fcm_token);
      }
      
      if (license_image) {
        formData.append("license_image", license_image);
        }

        const response = await authApi.post("/api/doctor/register", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            "Accept": "application/json",
          },
          timeout: 60000, 
        });
        
      const cleanMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .trim();
      };
      
      if (response.status === 200 || response.status === 201) {
        const successMsg = response.data?.message || t('auth.register.registerSuccess');
        setSuccessMessage(cleanMessage(successMsg));
        
        setTimeout(() => {
          onRegisterSuccess();
        }, 2000);
      } else {
        const errorMsg = response.data?.message || response.data?.error || t('auth.register.registerError');
        setErrors({ general: cleanMessage(errorMsg) });
      }
    } catch (error: any) {
      const responseData = error.response?.data;
      const newErrors: FormErrors = {};
      
      const cleanErrorMessage = (msg: string): string => {
        return String(msg)
          .replace(/\(and \d+ more errors?\)/gi, '')
          .trim();
      };
      
      const mainMessage = responseData?.message || responseData?.error || '';
      const validationErrors = responseData?.errors || {};
      
      if (mainMessage) {
        newErrors.general = cleanErrorMessage(mainMessage);
      }
      
      if (typeof validationErrors === 'object' && Object.keys(validationErrors).length > 0) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          const messageArray = Array.isArray(messages) ? messages : [messages];
          const message = cleanErrorMessage(String(messageArray[0] || ''));
          newErrors[field as keyof FormErrors] = message;
        });
      }

      if (!newErrors.general && Object.keys(newErrors).length === 0) {
          newErrors.general = t('auth.register.generalError');
      }
      
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormErrors, value: string) => {
    switch (field) {
      case "full_name":
        setFullName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "password_confirmation":
        setPasswordConfirmation(value);
        break;
      case "phone_number":
        setPhoneNumber(value);
        break;
      case "specialization":
        setSpecializationId(value);
        break;
      case "address":
        setAddress(value);
        break;
      case "age":
        setAge(value.replace(/[^0-9]/g, ""));
        break;
      case "gender":
        setGender(value);
        break;
      case "profile_description":
        setProfileDescription(value);
        break;
      case "fcm_token":
        setFcmToken(value);
        break;
    }
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseImage(file);
      if (errors.license_image) {
        setErrors((prev) => ({ ...prev, license_image: undefined }));
      }
    }
  };

  const renderInput = (
    field: keyof FormErrors,
    value: string,
    placeholder: string,
    type: string = "text",
    icon: React.ReactNode,
    showToggle?: boolean
  ) => {
    const isPassword = type === "password";
    const showToggleState = field === "password" ? showPassword : showConfirmPassword;
    const setShowToggleState = field === "password" ? setShowPassword : setShowConfirmPassword;

    return (
      <div className="space-y-2">
      <div className="relative group">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-500 dark:text-gray-400 transition-colors duration-300 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400">
          {icon}
        </div>
        <input
          type={isPassword && showToggleState ? "text" : type}
          id={field}
            value={value || ""}
          onChange={(e) => handleInputChange(field, e.target.value)}
          autoComplete={
            field === "password" 
              ? "new-password" 
              : field === "password_confirmation" 
              ? "new-password" 
              : field === "email"
              ? "email"
              : field === "phone"
              ? "tel"
              : "off"
          }
            className={`w-full ${
              icon ? "ps-12" : "ps-4"
            } ${showToggle && isPassword ? "pe-12" : "pe-4"} py-4 bg-white/80 dark:bg-gray-900/50 border-2 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 ${
            errors[field]
                ? "border-red-500 focus:ring-red-500/30 focus:border-red-500"
                : "border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-600"
          }`}
            placeholder={placeholder}
          required
          disabled={isLoading || !isOnline}
        />
        {showToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShowToggleState(!showToggleState)}
              className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-300"
            disabled={isLoading || !isOnline}
          >
              {showToggleState ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
        </div>
        {errors[field] && (
          <p className="text-sm text-red-500 dark:text-red-400 animate-in fade-in duration-200">
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
  return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center lg:text-right mb-6">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 dark:from-white to-blue-600 dark:to-blue-200 bg-clip-text text-transparent mb-2 transition-colors duration-300">
                {t('auth.register.step1Title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base transition-colors duration-300">{t('auth.register.step1Description')}</p>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.fullName')}
                </label>
                {renderInput("full_name", full_name, t('auth.register.fullNamePlaceholder'), "text", <User className="w-5 h-5" />)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.email')}
                </label>
                {renderInput("email", email, t('auth.register.emailPlaceholder'), "email", <Mail className="w-5 h-5" />)}
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.phone')}
                </label>
                {renderInput("phone_number", phone_number, t('auth.register.phonePlaceholder'), "tel", <Phone className="w-5 h-5" />)}
            </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center lg:text-right mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{t('auth.register.step2Title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{t('auth.register.step2Description')}</p>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                      {t('auth.register.specialization')}
                    </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    <Briefcase className="w-5 h-5" />
                </div>
                <select
                  id="specialization"
                  value={specializationId}
                  onChange={(e) => handleInputChange("specialization", e.target.value)}
                    className={`w-full ps-12 pe-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border-2 rounded-xl text-gray-900 dark:text-gray-100 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${
                    errors.specialization
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                  required
                  disabled={isLoading || !isOnline || isLoadingSpecializations}
                >
                  <option value="" disabled>
                      {isLoadingSpecializations ? t('auth.register.loadingSpecializations') : t('auth.register.selectSpecialization')}
                  </option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={String(spec.id)}>
                      {spec.name_ar}
                    </option>
                  ))}
                </select>
                    </div>
                {errors.specialization && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                    {errors.specialization}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.age')}
                </label>
                {renderInput("age", age, t('auth.register.agePlaceholder'), "number", <User className="w-5 h-5" />)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                      {t('auth.register.gender')}
                    </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    <User className="w-5 h-5" />
                </div>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                    className={`w-full ps-12 pe-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border-2 rounded-xl text-gray-900 dark:text-gray-100 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${
                    errors.gender
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                  required
                  disabled={isLoading || !isOnline}
                >
                        <option value="">{t('auth.register.selectGender')}</option>
                  <option value="male">{t('auth.register.male')}</option>
                  <option value="female">{t('auth.register.female')}</option>
                </select>
                    </div>
                {errors.gender && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                    {errors.gender}
                  </p>
                )}
                  </div>
              </div>
          </div>
        );

      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center lg:text-right mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{t('auth.register.step3Title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{t('auth.register.step3Description')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.address')}
                </label>
                {renderInput("address", address, t('auth.register.addressPlaceholder'), "text", <MapPin className="w-5 h-5" />)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                      {t('auth.register.licenseImage')}
                    </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    <Upload className="w-5 h-5" />
                </div>
                <input
                  type="file"
                  id="license_image"
                  onChange={handleFileChange}
                  accept="image/*"
                    className={`w-full ps-12 pe-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border-2 rounded-xl text-gray-900 dark:text-gray-100 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 ${
                    errors.license_image
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                  required
                  disabled={isLoading || !isOnline}
                />
                    </div>
                {license_image && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {license_image.name}
                  </p>
                )}
                {errors.license_image && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                    {errors.license_image}
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                      {t('auth.register.profileDescription')}
                    </label>
                <div className="relative">
                  <div className="absolute top-3 start-0 flex items-start ps-4 pointer-events-none text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    <FileText className="w-5 h-5" />
                </div>
                <textarea
                  id="profile_description"
                  value={profile_description}
                        onChange={(e) => handleInputChange("profile_description", e.target.value)}
                        rows={4}
                    className={`w-full ps-12 pe-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/50 border-2 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${
                    errors.profile_description
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                        placeholder={t('auth.register.profileDescriptionPlaceholder')}
                  required
                  disabled={isLoading || !isOnline}
                />
                    </div>
                {errors.profile_description && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                    {errors.profile_description}
                  </p>
                )}
                  </div>
                </div>
              </div>
        );

      case 4:
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center lg:text-right mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{t('auth.register.step4Title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">{t('auth.register.step4Description')}</p>
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.password')}
                </label>
                {renderInput("password", password, t('auth.register.passwordPlaceholder'), "password", <Lock className="w-5 h-5" />, true)}
                {/* Password strength */}
                <div className="mt-2">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-colors duration-300">
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    {t('auth.register.passwordStrengthHint')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  {t('auth.register.confirmPassword')}
                </label>
                {renderInput("password_confirmation", password_confirmation, t('auth.register.confirmPasswordPlaceholder'), "password", <Lock className="w-5 h-5" />, true)}
              </div>

              <input type="hidden" value={fcm_token} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-gray-100 dark:from-gray-900 via-gray-50 dark:via-gray-800 to-gray-100 dark:to-gray-900 flex items-center justify-center px-4 py-4 lg:py-0 transition-colors duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated Background */}
      <Particles3D />
      <FloatingElements />
      <div className="w-full max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 relative z-10 min-h-full lg:h-full flex items-center py-4 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-12 w-full min-h-full lg:h-full lg:items-center">
          {/* Left Panel - Branding */}
          <div className="hidden lg:block lg:col-span-5 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full flex items-center"
            >
              <div className="bg-gradient-to-br from-blue-400/90 dark:from-blue-600/95 via-indigo-400/90 dark:via-indigo-600/95 to-purple-400/90 dark:to-purple-600/95 rounded-3xl shadow-2xl relative overflow-hidden w-full h-[600px] p-10 flex flex-col justify-center transition-colors duration-300">
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
                    {/* Back Button and Language Switcher - Desktop */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <motion.button
                        type="button"
                        onClick={handleBack}
                        aria-label={t('auth.register.backButton')}
                        title={t('auth.register.backButton')}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        whileHover={{ scale: 1.05, x: isRTL ? -5 : 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl w-fit group"
                      >
                        <motion.div
                          animate={{ x: isRTL ? [0, -3, 0] : [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className={`w-5 h-5 ${!isRTL ? 'rotate-180' : ''}`} />
                        </motion.div>
                        <span className="text-sm font-semibold">{t('auth.register.backButton')}</span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </motion.button>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <LanguageSwitcher />
                      </motion.div>
                    </div>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-4xl font-bold text-white leading-tight"
                      >
                        <InfiniteTypewriterText
                          text={t('auth.register.welcome')}
                          className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 drop-shadow-lg"
                        />
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="text-blue-50 text-lg leading-relaxed font-medium"
                      >
                        {t('auth.register.description')}
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
                        { icon: Shield, text: t('auth.register.featureProtection'), color: "from-blue-400 to-cyan-400" },
                        { icon: Zap, text: t('auth.register.featureSupport'), color: "from-purple-400 to-pink-400" },
                        { icon: Clock, text: t('auth.register.featureInterface'), color: "from-indigo-400 to-blue-400" },
                        { icon: Award, text: t('auth.register.featureApproval'), color: "from-cyan-400 to-blue-400" },
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
                        <p className="text-sm text-red-100 text-center font-medium">{t('auth.register.noInternetWarning')}</p>
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

          {/* Right Panel - Form */}
          <div className="lg:col-span-7 min-w-0 flex flex-col items-stretch h-full lg:max-h-[600px]">
            {/* Inline Back Button and Language Switcher for small/medium screens */}
            <div className="lg:hidden mb-2 px-2 sm:px-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                aria-label={t('auth.register.backButton')}
                title={t('auth.register.backButton')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur border border-gray-300 dark:border-white/20 transition-colors duration-300 w-fit"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm font-medium">{t('auth.register.backButton')}</span>
              </button>
              <LanguageSwitcher />
            </div>
            {/* Progress Steps */}
            <div className="mb-6 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-xl p-4 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-xl transition-colors duration-300">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center flex-1">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive ? 'bg-blue-600 text-white scale-110 shadow-lg' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : isActive ? '' : 'bg-gray-700 text-gray-400'}
                      `}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                      </div>
                      <p className={`mt-2 text-xs font-medium text-center ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-700'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
              </div>
            </div>

            {/* Form Container */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700/50 flex-1 flex flex-col overflow-hidden transition-colors duration-300">
              <div className="p-4 sm:p-6 md:p-10 flex-1 min-w-0 overflow-y-auto flex flex-col premium-scrollbar">
            <form id="registerForm" onSubmit={currentStep === 4 ? handleRegister : (e) => { e.preventDefault(); nextStep(); }} className="space-y-5 min-w-0">
              {renderStepContent()}

              {/* Small helper note */}
              <div className="rounded-xl bg-gray-100/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-colors duration-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>{t('auth.register.helperNote')}</span>
              </div>

              {/* Errors */}
              {errors.general && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-in fade-in duration-200 flex-shrink-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 text-center">
                  {errors.general}
                </p>
            </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl animate-in fade-in duration-200 flex-shrink-0">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 text-center">
                  {successMessage}
                </p>
            </div>
              )}

            </form>
              </div>
              {/* Fixed Action Bar at bottom of panel container */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-xl p-4 flex items-center justify-between gap-4 transition-colors duration-300">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isLoading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium ${
                    currentStep === 1 || isLoading
                      ? 'text-gray-400 dark:text-gray-600 bg-gray-200 dark:bg-gray-700/30 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700'
                  } transition-colors duration-300`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t('auth.register.previousButton')}
                </button>

                <Button
                  type="submit"
                  form="registerForm"
                  disabled={isLoading || !isOnline || (specializations.length === 0 && !isLoadingSpecializations && currentStep === 2)}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      {t('auth.register.registering')}
                    </>
                  ) : currentStep === 4 ? (
                    <>
                      {t('auth.register.registerButton')}
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      {t('auth.register.nextButton')}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
          </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-400">
            {t('auth.register.hasAccount')}{" "}
            <button
              onClick={onSwitchToLogin}
              disabled={isLoading || !isOnline}
                  className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('auth.register.loginInstead')}
            </button>
          </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
