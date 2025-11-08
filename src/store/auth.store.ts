import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Account } from '../types';
import { encryptedStorage } from '../utils/encryptedStorage';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
let setAuthState: ((state: Partial<AuthState>) => void) | null = null;

type Role = 'admin' | 'doctor';

interface AuthState {
  user: Account | null;
  token: string | null;
  role: Role | null;
  _hasHydrated: boolean;
  login: (user: Account, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  updateUser: (userData: Partial<Account>) => void;
}

const AUTH_TOKEN_KEY = 'auth-token';
const AUTH_USER_KEY = 'auth-user';
const LEGACY_TOKEN_KEY = 'encoded-token';
const LEGACY_USER_KEY = 'encoded-user';
const LEGACY_STORE_KEY = 'auth-storage';

interface SecureTokenPayload {
  token: string;
}

const deriveRole = (user: Account | null): Role | null => {
  if (!user?.roles?.length) return null;
  const matchingRole = user.roles.find(role => role.name === 'admin' || role.name === 'doctor');
  return (matchingRole?.name as Role) ?? null;
};

const storeTokenSecurely = (token: string | null) => {
  if (!isBrowser) return;
  if (token) {
    encryptedStorage.setItem(AUTH_TOKEN_KEY, { token } as SecureTokenPayload);
  } else {
    encryptedStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

const storeUserSecurely = (user: Account | null) => {
  if (!isBrowser) return;
  if (user) {
    encryptedStorage.setItem(AUTH_USER_KEY, user);
  } else {
    encryptedStorage.removeItem(AUTH_USER_KEY);
  }
};

const decodeLegacyValue = (value: string | null): string | null => {
  if (!isBrowser) return null;
  if (!value) return null;
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return null;
  }
};

const migrateLegacyToken = (): string | null => {
  if (!isBrowser) return null;
  const decoded = decodeLegacyValue(localStorage.getItem(LEGACY_TOKEN_KEY));
  if (!decoded) {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return null;
  }
  storeTokenSecurely(decoded);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  return decoded;
};

const migrateLegacyUser = (): Account | null => {
  if (!isBrowser) return null;
  const decoded = decodeLegacyValue(localStorage.getItem(LEGACY_USER_KEY));
  if (!decoded) {
    localStorage.removeItem(LEGACY_USER_KEY);
    return null;
  }
  try {
    const parsed = JSON.parse(decoded) as Account;
    storeUserSecurely(parsed);
    localStorage.removeItem(LEGACY_USER_KEY);
    return parsed;
  } catch {
    localStorage.removeItem(LEGACY_USER_KEY);
    return null;
  }
};

const loadTokenFromStorage = (): string | null => {
  if (!isBrowser) return null;
  const payload = encryptedStorage.getItem<SecureTokenPayload>(AUTH_TOKEN_KEY);
  if (payload?.token) {
    return payload.token;
  }
  return migrateLegacyToken();
};

const loadUserFromStorage = (): Account | null => {
  if (!isBrowser) return null;
  const storedUser = encryptedStorage.getItem<Account>(AUTH_USER_KEY);
  if (storedUser) {
    return storedUser;
  }
  return migrateLegacyUser();
};

const clearAuthStorage = () => {
  if (!isBrowser) return;
  storeTokenSecurely(null);
  storeUserSecurely(null);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  localStorage.removeItem(LEGACY_STORE_KEY);
};

const initialToken = loadTokenFromStorage();
const initialUser = loadUserFromStorage();
const initialRole = deriveRole(initialUser);

const createStorage = () => {
  if (isBrowser) {
    return window.localStorage;
  }

  const memory = new Map<string, string>();

  return {
    get length() {
      return memory.size;
    },
    clear: () => memory.clear(),
    getItem: (key: string) => (memory.has(key) ? memory.get(key)! : null),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    removeItem: (key: string) => {
      memory.delete(key);
    },
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  } as Storage;
};


export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      setAuthState = set;
      return {
        user: initialUser,
        token: initialToken,
        role: initialRole,
        _hasHydrated: true,
        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },
        login: (user, token) => {
          const role = deriveRole(user);
          storeTokenSecurely(token);
          storeUserSecurely(user);
          set({ user, token, role });
        },
        logout: () => {
          clearAuthStorage();
          set({ user: null, token: null, role: null });
        },
        updateUser: (userData) => {
          set((current) => {
            if (!current.user) return current;
            const updatedUser = { ...current.user, ...userData };
            storeUserSecurely(updatedUser);
            return {
              user: updatedUser,
              role: deriveRole(updatedUser),
            };
          });
        },
      };
    },
    {
      name: 'auth-store-meta',
      storage: createJSONStorage(createStorage),
      partialize: () => ({}),
      onRehydrateStorage: () => (_, error) => {
        if (error) {
          clearAuthStorage();
          setAuthState?.({ user: null, token: null, role: null, _hasHydrated: true });
          return;
        }

        const user = loadUserFromStorage();
        const token = loadTokenFromStorage();

        setAuthState?.({
          user,
          token,
          role: deriveRole(user),
          _hasHydrated: true,
        });
      },
    }
  )
);

export const getDecodedToken = (): string | null => {
  return loadTokenFromStorage();
};

export const getDecodedUser = (): Account | null => {
  return loadUserFromStorage();
};

export const updateUserData = (userData: Partial<Account>): void => {
  try {
    const currentUser = loadUserFromStorage();
    if (!currentUser) {
      return;
    }
    
    const updatedUser = { ...currentUser, ...userData };
    
    storeUserSecurely(updatedUser);
    useAuthStore.setState({
      user: updatedUser,
      role: deriveRole(updatedUser),
    });
  } catch {
    
  }
}; 