import { useAuthStore } from '../store/auth.store';
import { getUserDisplayName } from '../utils/userUtils';

export const useAuth = () => {
  const { user, token, role, login, logout, _hasHydrated } = useAuthStore();
  const isAuthenticated = !!token;
  
  return {
    user,
    token,
    role,
    isAuthenticated,
    login,
    logout,
    hasHydrated: _hasHydrated,
  };
}; 