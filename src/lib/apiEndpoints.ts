
import { api, authApi } from './axios';
import { API_CONFIG } from '../config/api.config';


export class ApiEndpointHelper {




  
  static async registerDoctor(data: any): Promise<any> {
    const endpoints = [
      '/api/doctor/register',
      '/api/auth/doctor/register',
      '/api/register/doctor'
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const response = await authApi.post(endpoint, data);
        return response;
      } catch (error: any) {
        lastError = error;
        
        
        if (error.response?.status && error.response.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error('فشل في العثور على endpoint صالح للتسجيل');
  }

  
  static async getSpecializations(): Promise<any> {
    const endpoints = [
      API_CONFIG.ENDPOINTS.SPECIALIZATIONS.PUBLIC,   
      API_CONFIG.ENDPOINTS.SPECIALIZATIONS.GENERAL, 
      API_CONFIG.ENDPOINTS.SPECIALIZATIONS.DOCTOR,  
      API_CONFIG.ENDPOINTS.SPECIALIZATIONS.ADMIN,   
      API_CONFIG.ENDPOINTS.SPECIALIZATIONS.FALLBACK 
    ];

    let lastError: any = null;
    const timeout = 5000; // 5 seconds timeout per request

    // Try localhost first in development to avoid CORS issues
    if (import.meta.env.DEV) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const localResponse = await fetch(`${API_CONFIG.DEVELOPMENT}/api/specializations`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (localResponse.ok) {
          const data = await localResponse.json();
          if (data && (Array.isArray(data) || Array.isArray(data.data))) {
            return { data: Array.isArray(data) ? data : data.data };
          }
        }
      } catch (localError: any) {
        // Silently continue to try other endpoints
        if (localError.name !== 'AbortError') {
          console.debug('Local endpoint failed, trying remote endpoints');
        }
      }
    }

    // Try remote endpoints with timeout
    for (const endpoint of endpoints) {
      try {
        const headers = endpoint.includes('/admin/') 
          ? { 'Accept': 'application/json', 'Content-Type': 'application/json' }
          : {};
          
        const response = await authApi.get(endpoint, { 
          headers,
          timeout // axios timeout is already configured
        });
        
        if (response.data && (Array.isArray(response.data) || Array.isArray(response.data.data))) {
          return response;
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error: any) {
        lastError = error;
        
        // Skip CORS errors silently and continue to next endpoint
        if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS') || error.code === 'ERR_FAILED') {
          continue; // Try next endpoint on CORS errors
        }
        
        // Don't continue if it's a serious error (not 404/403)
        if (error.response?.status && ![404, 403].includes(error.response.status)) {
          // Only throw if we've tried all endpoints or got a server error
          const isLastEndpoint = endpoint === endpoints[endpoints.length - 1];
          if (isLastEndpoint || error.response.status >= 500) {
            throw error;
          }
        }
      }
    }
    
    
    
    const fallbackSpecializations = [
      { id: 1, name: 'طب عام', name_ar: 'طب عام', name_en: 'General Medicine' },
      { id: 2, name: 'طب أسنان', name_ar: 'طب أسنان', name_en: 'Dentistry' },
      { id: 3, name: 'طب عيون', name_ar: 'طب عيون', name_en: 'Ophthalmology' },
      { id: 4, name: 'طب جلدية', name_ar: 'طب جلدية', name_en: 'Dermatology' },
      { id: 5, name: 'طب قلب', name_ar: 'طب قلب', name_en: 'Cardiology' },
      { id: 6, name: 'طب أعصاب', name_ar: 'طب أعصاب', name_en: 'Neurology' },
      { id: 7, name: 'طب أطفال', name_ar: 'طب أطفال', name_en: 'Pediatrics' },
      { id: 8, name: 'طب نساء', name_ar: 'طب نساء', name_en: 'Gynecology' },
      { id: 9, name: 'طب عظام', name_ar: 'طب عظام', name_en: 'Orthopedics' },
      { id: 10, name: 'طب نفسي', name_ar: 'طب نفسي', name_en: 'Psychiatry' }
    ];
    
    return { data: fallbackSpecializations };
  }

  
  static async createUpdateEndpointIfNotExists(): Promise<boolean> {
    try {
      
      const response = await api.get('/api/doctor/updateProfile');
      return true; 
    } catch (error: any) {
      if (error.response?.status === 404) {
        
        return false;
      }
      return false;
    }
  }

  
  static async updateDoctorProfile(data: any): Promise<any> {
    const endpoints = [
      '/api/doctor/edit-profile', 
      '/api/doctor/updateProfile', 
      '/api/doctor/profile/update', 
      '/api/doctor/me/update', 
      '/api/doctor/register' 
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        
        
        
        const response = await api.post(endpoint, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          }
        });

        
        return response;
      } catch (error: any) {
        
        lastError = error;
        
        
        if (error.response?.status === 404) {
          
          continue;
        }
        
        
        if (error.response?.status === 405) {
          try {
            
            const response = await api.put(endpoint, data, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
              }
            });
            
            return response;
          } catch (putError: any) {
            
            lastError = putError;
            continue;
          }
        }
        
        
        if (error.response?.status === 422) {
          
          throw error;
        }
        
        
        if (endpoint === endpoints[endpoints.length - 1]) {
          break;
        }
      }
    }
    
    
    
    
    try {
      const response = await api.post('/api/doctor/register', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });
      
      
      return response;
    } catch (registerError: any) {
      
      throw lastError || registerError;
    }
  }

  
  static async getDoctorProfile(): Promise<any> {
    const endpoints = [
      '/api/doctor/me',
      '/api/doctor/profile',
      '/api/doctor/info'
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        
        const response = await api.get(endpoint);
        
        return response;
      } catch (error: any) {
        
        lastError = error;
        if (error.response?.status && ![404, 403].includes(error.response.status)) {
          throw error;
        }
      }
    }

    throw lastError || new Error('فشل في جلب الملف الشخصي');
  }

  
  static async getNotifications(): Promise<any> {
    const endpoints = [
      API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST,
      '/api/notifications',
      '/api/doctor/notifications'
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint);
        return response;
      } catch (error: any) {
        lastError = error;
        if (error.response?.status && ![404, 403].includes(error.response.status)) {
          throw error;
        }
      }
    }

    throw lastError || new Error('فشل في جلب الإشعارات');
  }

  
  static async markNotificationAsRead(notificationId: number): Promise<any> {
    const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_AS_READ.replace(':id', notificationId.toString());
    
    try {
      const response = await api.post(endpoint);
      return response;
    } catch (error: any) {
      
      if (error.response?.status === 404) {
        try {
          const alternativeEndpoint = `/api/doctor/notifications/${notificationId}/mark-read`;
          const response = await api.post(alternativeEndpoint);
          return response;
        } catch (altError: any) {
          throw error;
        }
      }
      throw error;
    }
  }

  
  static async markAllNotificationsAsRead(): Promise<any> {
    const endpoints = [
      API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      '/api/doctor/notifications/read-all',
      '/api/notifications/mark-all-read'
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint);
        return response;
      } catch (error: any) {
        lastError = error;
        if (error.response?.status && ![404, 405].includes(error.response.status)) {
          throw error;
        }
      }
    }

    throw lastError || new Error('فشل في تحديث الإشعارات');
  }

  
  static async deleteNotification(notificationId: number): Promise<any> {
    const endpoint = API_CONFIG.ENDPOINTS.NOTIFICATIONS.DELETE.replace(':id', notificationId.toString());
    
    try {
      const response = await api.delete(endpoint);
      return response;
    } catch (error: any) {
      
      if (error.response?.status === 404) {
        try {
          const alternativeEndpoint = `/api/doctor/notifications/${notificationId}`;
          const response = await api.delete(alternativeEndpoint);
          return response;
        } catch (altError: any) {
          throw error;
        }
      }
      throw error;
    }
  }
}

export default ApiEndpointHelper;