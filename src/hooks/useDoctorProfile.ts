import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { useAuthStore } from '../store/auth.store';

interface DoctorProfileData {
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  hospital?: any;
  doctor?: any;
  account?: any;
  [key: string]: any;
}


let profileCache: {
  data: DoctorProfileData | null;
  loading: boolean;
  error: string | null;
  lastFetch: number;
} = {
  data: null,
  loading: false,
  error: null,
  lastFetch: 0
};


const CACHE_DURATION = 5 * 60 * 1000;

export const useDoctorProfile = () => {
  const [profileData, setProfileData] = useState<DoctorProfileData | null>(profileCache.data);
  const [loading, setLoading] = useState(profileCache.loading);
  const [error, setError] = useState<string | null>(profileCache.error);
  const { user } = useAuthStore();

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    
    if (!forceRefresh && 
        profileCache.data && 
        (Date.now() - profileCache.lastFetch) < CACHE_DURATION) {
      setProfileData(profileCache.data);
      setLoading(false);
      setError(null);
      return profileCache.data;
    }

    
    if (profileCache.loading) {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkLoading = () => {
          attempts++;
          
          if (!profileCache.loading) {
            if (profileCache.data) {
              resolve(profileCache.data);
            } else {
              reject(new Error(profileCache.error || 'Failed to fetch profile'));
            }
          } else if (attempts >= maxAttempts) {
            profileCache.loading = false;
            reject(new Error('Timeout waiting for profile data'));
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    try {
      profileCache.loading = true;
      setLoading(true);
      setError(null);

      const res = await api.get('/api/doctor/me');
      let profile: DoctorProfileData;

      if (Array.isArray(res.data)) {
        const validItems = res.data.filter(item => item !== null && item !== undefined);
        const itemWithHospital = validItems.find(item => item?.hospital);
        const itemWithDoctor = validItems.find(item => item?.doctor);
        profile = itemWithHospital || itemWithDoctor || validItems[0] || {};
      } else {
        profile = res.data || {};
      }

      
      profileCache.data = profile;
      profileCache.lastFetch = Date.now();
      profileCache.error = null;

      setProfileData(profile);
      setError(null);

      return profile;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile';
      
      profileCache.error = errorMessage;
      setError(errorMessage);

      
      if (err.response?.status === 401) {
        useAuthStore.getState().logout();
      }

      throw err;
    } finally {
      profileCache.loading = false;
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    profileCache = {
      data: null,
      loading: false,
      error: null,
      lastFetch: 0
    };
    setProfileData(null);
    setLoading(false);
    setError(null);
  }, []);

  const updateProfile = useCallback((updatedData: Partial<DoctorProfileData>) => {
    if (profileCache.data) {
      const newData = { ...profileCache.data, ...updatedData };
      profileCache.data = newData;
      profileCache.lastFetch = Date.now();
      setProfileData(newData);
    }
  }, []);

  
  useEffect(() => {
    if (user && !profileData && !loading) {
      fetchProfile();
    }
  }, [user, profileData, loading, fetchProfile]);

  return {
    profileData,
    loading,
    error,
    fetchProfile,
    clearCache,
    updateProfile,
    refetch: () => fetchProfile(true)
  };
};
