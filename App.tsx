import React, { useEffect, Suspense, lazy, useCallback } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './src/i18n/config'; // Initialize i18n
import { LoadingOverlay } from './src/components/ui';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { NotificationProvider } from './src/components/common/NotificationSystem';
import { cleanOldUserData } from './src/utils/userUtils';
import { useTheme } from './src/hooks/useTheme';
import { useAuth } from './src/hooks/useAuth';
import ProtectedRoute from './src/routes/ProtectedRoute';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./src/pages/auth/LandingPage'));
const LoginPage = lazy(() => import('./src/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./src/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./src/pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./src/pages/dashboard').then(m => ({ default: m.DashboardPage })));
const PendingApprovalModal = lazy(() => import('./src/components/auth').then(m => ({ default: m.PendingApprovalModal })));

const SuspenseFallback: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  return (
    <LoadingOverlay
      isVisible
      message={isDashboard ? 'جاري تحميل لوحة التحكم...' : 'جاري التحميل...'}
    />
  );
};

const LandingPageRoute: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasHydrated } = useAuth();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleGetStarted = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const handleLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <LandingPage
      onGetStarted={handleGetStarted}
      onLogin={handleLogin}
    />
  );
};

const LoginPageRoute: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasHydrated } = useAuth();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleSwitchToRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const handleLoginSuccess = useCallback(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const handleForgotPassword = useCallback(() => {
    navigate('/forgot-password');
  }, [navigate]);

  const handleBackToLanding = useCallback(() => {
    navigate('/');
  }, [navigate]);

        return (
          <LoginPage
            onSwitchToRegister={handleSwitchToRegister}
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
            onBackToLanding={handleBackToLanding}
          />
        );
};

const RegisterPageRoute: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasHydrated } = useAuth();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleSwitchToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const handleRegisterSuccess = useCallback(() => {
    navigate('/pending-approval', { replace: true });
  }, [navigate]);

  const handleBackToLanding = useCallback(() => {
    navigate('/');
  }, [navigate]);

        return (
          <RegisterPage 
            onSwitchToLogin={handleSwitchToLogin}
            onRegisterSuccess={handleRegisterSuccess}
            onBackToLanding={handleBackToLanding}
          />
        );
};

const ForgotPasswordRoute: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasHydrated } = useAuth();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasHydrated, isAuthenticated, navigate]);

  const handleBackToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

        return (
          <ForgotPasswordPage 
            onBackToLogin={handleBackToLogin}
          />
        );
};

const PendingApprovalRoute: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

        return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-gray-700/70 p-8">
        <PendingApprovalModal onBackToLogin={handleBackToLogin} />
      </div>
    </div>
        );
};

const DashboardPageRoute: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    cleanOldUserData();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return <DashboardPage onLogout={handleLogout} />;
};

const App: React.FC = () => {
  useTheme();

  useEffect(() => {
    cleanOldUserData();
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <MotionConfig reducedMotion="user">
          <Router basename={import.meta.env.BASE_URL}>
          <div className="min-h-screen w-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-gray-100 font-sans transition-colors duration-300">
              <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                  <Route path="/" element={<LandingPageRoute />} />
                  <Route path="/login" element={<LoginPageRoute />} />
                  <Route path="/register" element={<RegisterPageRoute />} />
                  <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
                  <Route path="/pending-approval" element={<PendingApprovalRoute />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard/*" element={<DashboardPageRoute />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
          </div>
          </Router>
        </MotionConfig>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;