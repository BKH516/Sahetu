import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingOverlay } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, hasHydrated } = useAuth();
  const location = useLocation();

  if (!hasHydrated) {
    return <LoadingOverlay isVisible message="جاري التحقق من الجلسة..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

