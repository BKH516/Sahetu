
export const API_CONFIG = {
  
  PRODUCTION: 'https://sahtee.evra-co.com',
  DEVELOPMENT: 'http://localhost:8000',
  
  
  ENDPOINTS: {
    SPECIALIZATIONS: {
      PUBLIC: '/api/public/specializations',    
      GENERAL: '/api/specializations',          
      DOCTOR: '/api/doctor/specializations',   
      ADMIN: '/api/admin/specializations',     
      FALLBACK: '/api/specs'                   
    },
    AUTH: {
      DOCTOR_LOGIN: '/api/doctor/login',
      DOCTOR_REGISTER: '/api/doctor/register',
      ADMIN_LOGIN: '/api/admin/login'
    },
    DOCTOR: {
      SERVICES: '/api/doctor/services',
      SCHEDULES: '/api/doctor/schedules',
      PROFILE: '/api/doctor/me',
      UPDATE_PROFILE: '/api/doctor/register' 
    },
    NOTIFICATIONS: {
      LIST: '/api/doctor/notifications',
      UNREAD_COUNT: '/api/doctor/notifications/unread',
      MARK_AS_READ: '/api/doctor/notifications/:id/read',
      MARK_ALL_READ: '/api/doctor/notifications/mark-all-read',
      DELETE: '/api/doctor/notifications/:id'
    },
    PROFILE: {
      DOCTOR_ME: '/api/doctor/me',
      DOCTOR_UPDATE: '/api/doctor/register', 
      USER_UPDATE: '/api/user/updateProfile',
      NURSE_UPDATE: '/api/nurse/updateProfile'
    }
  },
  
  
  HEADERS: {
    DEFAULT: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    ADMIN: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    FORM_DATA: {
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data'
    }
  },
  
  
  TIMEOUTS: {
    DEFAULT: 10000,
    UPLOAD: 30000,
    DOWNLOAD: 60000
  }
};


export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  if (import.meta.env.DEV) {
    return API_CONFIG.DEVELOPMENT;
  }
  
  return API_CONFIG.PRODUCTION;
};