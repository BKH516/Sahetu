import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}




export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^07[0-9]{9}$/;
  return phoneRegex.test(phone);
};


export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
  }
  
  return { isValid: true, message: 'كلمة المرور قوية' };
};


export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/on\w+=/gi, '') 
    .trim();
};


export const validateAge = (age: string): boolean => {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum > 0 && ageNum < 150;
};


export const validateDate = (date: string): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};


export const validateTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};


export const validateName = (name: string): boolean => {
  const nameRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s]+$/;
  return nameRegex.test(name) && name.length >= 2;
};


export const validatePrice = (price: string): boolean => {
  const priceNum = parseFloat(price);
  return !isNaN(priceNum) && priceNum > 0;
};


export const validateDuration = (duration: string): boolean => {
  const durationNum = parseInt(duration);
  return !isNaN(durationNum) && durationNum > 0 && durationNum <= 480; 
};


export const formatPhone = (phone: string): string => {
  if (phone.startsWith('07')) {
    return `+964 ${phone.substring(1)}`;
  }
  return phone;
};


export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};


export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};


export const generateVerificationCode = (length: number = 6): string => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};


export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};


const CSRF_TOKEN_LENGTH = 32;

export function generateCSRFToken(): string {
  try {
    const array = new Uint8Array(CSRF_TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    
    
    return btoa(Math.random().toString() + Date.now().toString()).substr(0, CSRF_TOKEN_LENGTH);
  }
}


export function setSessionTimeout(timeoutMinutes: number = 30): void {
  const timeout = timeoutMinutes * 60 * 1000;
  setTimeout(() => {
    
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }, timeout);
}


export function resetSessionTimeout(): void {
  localStorage.setItem('lastActivity', Date.now().toString());
}

export function checkSessionExpiry(timeoutMinutes: number = 30): boolean {
  const lastActivity = localStorage.getItem('lastActivity');
  if (!lastActivity) return true;
  
  const timeout = timeoutMinutes * 60 * 1000;
  const now = Date.now();
  const timeSinceLastActivity = now - parseInt(lastActivity);
  
  return timeSinceLastActivity > timeout;
}


export const isValidEmail = validateEmail;
export const isValidPhoneNumber = validatePhone;

export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency
  }).format(amount);
}


export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function isMobile(): boolean {
  return window.innerWidth < 768;
}

export function getTheme(): 'light' | 'dark' {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    return 'dark';
  }
  return 'light';
}

export function setTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem('theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function toggleTheme(): 'light' | 'dark' {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
}

export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toArabicNumbers(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (match) => arabicNumbers[parseInt(match)]);
}

export function fromArabicNumbers(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (match) => arabicNumbers.indexOf(match).toString());
}

export { cn }; 


import { securityLogger, logSecurityAlert, logLoginSuccess, logLoginFailure } from './securityLogger';




export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  
  if (password.length < 8) {
    feedback.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  } else {
    score += 1;
  }

  
  if (!/[A-Z]/.test(password)) {
    feedback.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  } else {
    score += 1;
  }

  
  if (!/[a-z]/.test(password)) {
    feedback.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  } else {
    score += 1;
  }

  
  if (!/\d/.test(password)) {
    feedback.push('يجب أن تحتوي على رقم واحد على الأقل');
  } else {
    score += 1;
  }

  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
};


export const formatErrorMessage = (error: any, context: string = ''): string => {
  if (!error) return 'حدث خطأ غير متوقع. حاول مرة أخرى.';

  
  let message = 'حدث خطأ غير متوقع. حاول مرة أخرى.';

  if (typeof error === 'string') {
    message = error;
  } else if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.message) {
    message = error.message;
  }

  
  return message;
};


export const formatSuccessMessage = (action: string, context: string = ''): string => {
  
  return action || 'تم تنفيذ العملية بنجاح';
};


export const formatDateTime = (date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'time') {
    return dateObj.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return dateObj.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'الآن';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : 'ساعات'}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : 'أيام'}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `منذ ${diffInWeeks} ${diffInWeeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `منذ ${diffInMonths} ${diffInMonths === 1 ? 'شهر' : 'أشهر'}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `منذ ${diffInYears} ${diffInYears === 1 ? 'سنة' : 'سنوات'}`;
};


export const formatNumber = (num: number): string => {
  return num.toLocaleString('ar-SA');
};





export const validatePhoneNumber = (phone: string): boolean => {
  
  const phoneRegex = /^(\+966|966|0)?[5-9][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};


export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('966')) {
    return `+966 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
  }
  
  if (cleaned.startsWith('0')) {
    return `+966 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  
  if (cleaned.length === 9) {
    return `+966 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone;
};


export const validateNationalId = (id: string): boolean => {
  if (!/^\d{10}$/.test(id)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(id[i]);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(id[9]);
};


export const formatNationalId = (id: string): string => {
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 5)}-${cleaned.substring(5, 9)}-${cleaned.substring(9)}`;
  }
  return id;
};


export const validateCivilId = (id: string): boolean => {
  return /^\d{10}$/.test(id);
};


export const formatCivilId = (id: string): string => {
  const cleaned = id.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 5)}-${cleaned.substring(5, 9)}-${cleaned.substring(9)}`;
  }
  return id;
};


export const logError = (error: any, context: string = '', userId?: number): void => {
  securityLogger.log({
    eventType: 'SECURITY_ALERT',
    details: `Error in ${context}: ${error?.message || error}`,
    severity: 'MEDIUM',
    userId: userId?.toString()
  });
};


export const logSuccess = (action: string, context: string = '', userId?: number): void => {
  securityLogger.log({
    eventType: 'LOGIN_SUCCESS',
    details: `Success in ${context}: ${action}`,
    severity: 'LOW',
    userId: userId?.toString()
  });
};


export const isOnline = (): boolean => {
  return navigator.onLine;
};


export const addOnlineListener = (callback: (online: boolean) => void): void => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
};


export const removeOnlineListener = (callback: (online: boolean) => void): void => {
  window.removeEventListener('online', () => callback(true));
  window.removeEventListener('offline', () => callback(false));
};


export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};





export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


export const isStrongPassword = (password: string): boolean => {
  const { isValid } = validatePasswordStrength(password);
  return isValid;
};


export const generateStrongPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let result = '';
  
  
  result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  result += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  result += '0123456789'[Math.floor(Math.random() * 10)];
  result += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  
  for (let i = 4; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  
  
  return result.split('').sort(() => Math.random() - 0.5).join('');
}; 