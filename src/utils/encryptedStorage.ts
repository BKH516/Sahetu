
import CryptoJS from 'crypto-js';
import { securityLogger, logSecurityAlert, logLoginSuccess, logLoginFailure } from './securityLogger';


const getSecureKey = (): string => {
  const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
  if (!envKey) {
    // Generate a secure key based on origin (fallback)
    return CryptoJS.SHA256(window.location.origin + 'secure-key').toString();
  }
  return envKey;
};

const getSecureSalt = (): string => {
  const envSalt = import.meta.env.VITE_ENCRYPTION_SALT;
  if (!envSalt) {
    // Generate a secure salt based on user agent (fallback)
    return CryptoJS.SHA256(navigator.userAgent + 'secure-salt').toString();
  }
  return envSalt;
};

const ENCRYPTION_KEY = getSecureKey();
const SALT = getSecureSalt();

export class EncryptedStorage {
  private static instance: EncryptedStorage;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; 
  private accessAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts = 10; 
  private blockDuration = 15 * 60 * 1000; 

  static getInstance(): EncryptedStorage {
    if (!EncryptedStorage.instance) {
      EncryptedStorage.instance = new EncryptedStorage();
    }
    return EncryptedStorage.instance;
  }

  
  private getEncryptionKey(): string {
    // Use a consistent key derived from ENCRYPTION_KEY and SALT only
    // This ensures encrypt and decrypt use the same key
    return CryptoJS.SHA256(ENCRYPTION_KEY + SALT).toString();
  }

  
  private encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Combine IV + encrypted data
      const result = iv.toString() + encrypted.toString();
      return result;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Encryption failed: ${error}`,
        severity: 'HIGH'
      });
      return data; 
    }
  }

  
  private decrypt(encryptedData: string): string {
    try {
      // Extract IV from the first 32 characters
      const iv = CryptoJS.enc.Hex.parse(encryptedData.substring(0, 32));
      const ciphertext = encryptedData.substring(32);
      
      const key = this.getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      // Return empty string if decryption failed (instead of encrypted data)
      if (!result || result.trim() === '') {
        return '';
      }
      
      return result;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Decryption failed: ${error}`,
        severity: 'HIGH'
      });
      return ''; 
    }
  }

  
  private checkAccessAttempts(key: string): boolean {
    const now = Date.now();
    const attempts = this.accessAttempts.get(key);
    
    if (!attempts) {
      this.accessAttempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }
    
    
    if (now - attempts.lastAttempt > this.blockDuration) {
      this.accessAttempts.set(key, { count: 1, lastAttempt: now });
      return true;
    }
    
    
    if (attempts.count >= this.maxAttempts) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Too many access attempts for key: ${key}`,
        severity: 'HIGH'
      });
      return false;
    }
    
    
    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }

  
  setItem(key: string, value: any): boolean {
    try {
      if (!this.checkAccessAttempts(key)) {
        return false;
      }

      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const encryptedValue = this.encrypt(stringValue);
      
      
      localStorage.setItem(`encrypted_${key}`, encryptedValue);
      
      
      this.cache.set(key, {
        value,
        timestamp: Date.now()
      });

      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Data encrypted and stored: ${key}`,
        severity: 'LOW'
      });

      return true;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to store encrypted data: ${key} - ${error}`,
        severity: 'MEDIUM'
      });
      return false;
    }
  }

  
  getItem<T = any>(key: string): T | null {
    try {
      if (!this.checkAccessAttempts(key)) {
        return null;
      }

      
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }

      
      const encryptedValue = localStorage.getItem(`encrypted_${key}`);
      if (!encryptedValue) return null;

      const decryptedValue = this.decrypt(encryptedValue);
      
      // If decryption failed (empty string returned), remove corrupted data and return null
      if (!decryptedValue || decryptedValue.trim().length === 0) {
        this.removeItem(key);
        return null;
      }
      
      
      let parsedValue: T;
      try {
        parsedValue = JSON.parse(decryptedValue);
      } catch {
        // If JSON parse fails, return null (data is corrupted)
        this.removeItem(key);
        return null;
      }

      
      this.cache.set(key, {
        value: parsedValue,
        timestamp: Date.now()
      });

      return parsedValue;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to retrieve encrypted data: ${key} - ${error}`,
        severity: 'MEDIUM'
      });
      return null;
    }
  }

  
  removeItem(key: string): boolean {
    try {
      
      localStorage.removeItem(`encrypted_${key}`);
      
      
      this.cache.delete(key);
      
      
      this.accessAttempts.delete(key);

      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Encrypted data removed: ${key}`,
        severity: 'LOW'
      });

      return true;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to remove encrypted data: ${key} - ${error}`,
        severity: 'MEDIUM'
      });
      return false;
    }
  }

  
  clear(): boolean {
    try {
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('encrypted_')) {
          localStorage.removeItem(key);
        }
      });
      
      
      this.cache.clear();
      
      
      this.accessAttempts.clear();

      logSecurityAlert({
        details: 'All encrypted data cleared',
        severity: 'MEDIUM'
      });

      return true;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to clear encrypted data: ${error}`,
        severity: 'HIGH'
      });
      return false;
    }
  }

  
  keys(): string[] {
    try {
      const keys: string[] = [];
      const localStorageKeys = Object.keys(localStorage);
      
      localStorageKeys.forEach(key => {
        if (key.startsWith('encrypted_')) {
          keys.push(key.substring(10)); 
        }
      });
      
      return keys;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to get encrypted keys: ${error}`,
        severity: 'MEDIUM'
      });
      return [];
    }
  }

  
  hasItem(key: string): boolean {
    try {
      return localStorage.getItem(`encrypted_${key}`) !== null;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to check encrypted item: ${key} - ${error}`,
        severity: 'MEDIUM'
      });
      return false;
    }
  }

  
  getSize(): number {
    try {
      let totalSize = 0;
      const keys = this.keys();
      
      keys.forEach(key => {
        const encryptedValue = localStorage.getItem(`encrypted_${key}`);
        if (encryptedValue) {
          totalSize += encryptedValue.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to calculate encrypted data size: ${error}`,
        severity: 'MEDIUM'
      });
      return 0;
    }
  }

  
  clearCache(): void {
    this.cache.clear();
  }

  
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  
  getAccessStats(): { totalAttempts: number; blockedKeys: number } {
    let totalAttempts = 0;
    let blockedKeys = 0;
    
    this.accessAttempts.forEach(attempt => {
      totalAttempts += attempt.count;
      if (attempt.count >= this.maxAttempts) {
        blockedKeys++;
      }
    });
    
    return { totalAttempts, blockedKeys };
  }
}


export const encryptedStorage = EncryptedStorage.getInstance();


export const useEncryptedStorage = () => {
  const setItem = (key: string, value: any) => {
    return encryptedStorage.setItem(key, value);
  };

  const getItem = <T = any>(key: string): T | null => {
    return encryptedStorage.getItem<T>(key);
  };

  const removeItem = (key: string) => {
    return encryptedStorage.removeItem(key);
  };

  const clear = () => {
    return encryptedStorage.clear();
  };

  const hasItem = (key: string): boolean => {
    return encryptedStorage.hasItem(key);
  };

  const keys = (): string[] => {
    return encryptedStorage.keys();
  };

  const getSize = (): number => {
    return encryptedStorage.getSize();
  };

  const getStats = () => {
    return {
      cache: encryptedStorage.getCacheStats(),
      access: encryptedStorage.getAccessStats()
    };
  };

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    hasItem,
    keys,
    getSize,
    getStats
  };
}; 