import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

// Lazy load all page components
const LoginPage    = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LeadsPage    = lazy(() => import('./pages/LeadsPage'));
const PipelinePage = lazy(() => import('./pages/PipelinePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner" />
  </div>
);

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <main className={user ? 'main-content' : ''}>
        {children}
      </main>
    </>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login"    element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/leads"     element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
          <Route path="/pipeline"  element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

          <Route path="/"  element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="*"  element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
