import { useState, useCallback, useEffect } from 'react';
import { EncryptedStorage } from '../utils/encryptedStorage';

interface LocalReservationData {
  full_name: string;
  phone_number: string;
  age: string;
  gender: string;
  notes?: string;
}

interface ReservationStorageData {
  [reservationId: number]: LocalReservationData;
}

/**
 * Custom hook for securely storing and retrieving reservation data
 * Uses encrypted storage to protect patient sensitive information
 */
export const useSecureReservationStorage = () => {
  const [localReservationData, setLocalReservationData] = useState<ReservationStorageData>({});
  const encryptedStorage = EncryptedStorage.getInstance();

  // Get user-specific storage key
  const getStorageKey = useCallback((): string => {
    const userInfo = localStorage.getItem('userInfo');
    let userId = 'default';
    
    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        userId = parsedUserInfo.id || parsedUserInfo.user_id || 'default';
      } catch (error) {
        
      }
    }
    
    return `reservationData_${userId}`;
  }, []);

  // Load reservation data from encrypted storage
  const loadLocalReservationData = useCallback(() => {
    const storageKey = getStorageKey();
    
    try {
      // Try to get from encrypted storage first
      const encryptedData = encryptedStorage.getItem<ReservationStorageData>(storageKey);
      
      if (encryptedData && typeof encryptedData === 'object') {
        // Validate that the data is properly decrypted (not empty strings or corrupted)
        const isValid = Object.values(encryptedData).every(item => 
          item && typeof item === 'object' && item.phone_number && item.full_name
        );
        
        if (isValid || Object.keys(encryptedData).length === 0) {
          setLocalReservationData(encryptedData);
          return;
        } else {
          // Data is corrupted (old encryption), clear it
          encryptedStorage.removeItem(storageKey);
          setLocalReservationData({});
          return;
        }
      }

      // Fallback: migrate old unencrypted data if exists
      const oldKey = `localReservationData_${storageKey.split('_')[1]}`;
      const oldData = localStorage.getItem(oldKey);
      
      if (oldData) {
        try {
          const parsedData = JSON.parse(oldData);
          // Migrate to encrypted storage with new encryption
          encryptedStorage.setItem(storageKey, parsedData);
          setLocalReservationData(parsedData);
          // Remove old unencrypted data
          localStorage.removeItem(oldKey);
        } catch (error) {
          // Silent error - migration failed
        }
      } else {
        // No data found, start fresh
        setLocalReservationData({});
      }
    } catch (error) {
      // Silent error - loading failed, start fresh
      setLocalReservationData({});
    }
  }, [getStorageKey, encryptedStorage]);

  // Save single reservation data
  const saveReservationData = useCallback((reservationId: number, data: LocalReservationData) => {
    const storageKey = getStorageKey();
    
    // Read current data from localStorage to avoid state race conditions
    const currentData = encryptedStorage.getItem<ReservationStorageData>(storageKey) || {};
    
    const newData = {
      ...currentData,
      [reservationId]: data
    };
    
    setLocalReservationData(newData);
    
    try {
      encryptedStorage.setItem(storageKey, newData);
    } catch (error) {
      // Silent error - no console logs
    }
  }, [getStorageKey, encryptedStorage]);

  // Get single reservation data
  const getReservationData = useCallback((reservationId: number): LocalReservationData | null => {
    // ALWAYS read from localStorage first to ensure fresh data
    // This prevents state sync issues
    const storageKey = getStorageKey();
    const currentData = encryptedStorage.getItem<ReservationStorageData>(storageKey) || {};
    
    // If found in localStorage, use it
    if (currentData[reservationId]) {
      return currentData[reservationId];
    }
    
    // Fallback to state (for backward compatibility)
    return localReservationData[reservationId] || null;
  }, [localReservationData, getStorageKey, encryptedStorage]);

  // Cleanup old reservation data
  const cleanupReservationData = useCallback((validReservationIds: number[]) => {
    const storageKey = getStorageKey();
    
    // Read directly from localStorage instead of relying on state
    // This prevents race condition where state might be empty while localStorage has data
    const currentData = encryptedStorage.getItem<ReservationStorageData>(storageKey) || {};
    
    const cleanedData = Object.keys(currentData)
      .filter(id => validReservationIds.includes(parseInt(id)))
      .reduce((acc, id) => {
        acc[parseInt(id)] = currentData[parseInt(id)];
        return acc;
      }, {} as ReservationStorageData);
    
    if (Object.keys(cleanedData).length !== Object.keys(currentData).length) {
      setLocalReservationData(cleanedData);
      
      try {
        encryptedStorage.setItem(storageKey, cleanedData);
      } catch (error) {
        // Silent error - no console logs as per user request
      }
    } else {
      // Even if no cleanup needed, update state to match localStorage
      setLocalReservationData(cleanedData);
    }
  }, [getStorageKey, encryptedStorage]);

  // Clear all reservation data
  const clearAllData = useCallback(() => {
    const storageKey = getStorageKey();
    setLocalReservationData({});
    
    try {
      encryptedStorage.removeItem(storageKey);
    } catch (error) {
      // Silent error - clearing failed
    }
  }, [getStorageKey, encryptedStorage]);

  // Load data on mount
  useEffect(() => {
    loadLocalReservationData();
  }, [loadLocalReservationData]);

  // Listen for storage changes (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('reservationData_')) {
        loadLocalReservationData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadLocalReservationData]);

  return {
    localReservationData,
    saveReservationData,
    getReservationData,
    cleanupReservationData,
    clearAllData,
    reloadData: loadLocalReservationData
  };
};
