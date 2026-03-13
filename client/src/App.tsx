import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/use-auth';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';

const DashboardPage = lazy(() => import('@/pages/dashboard'));
const SetupPage = lazy(() => import('@/pages/setup'));
const FigmaPage = lazy(() => import('@/pages/figma'));
const TemplatesPage = lazy(() => import('@/pages/templates'));
const AnimationsPage = lazy(() => import('@/pages/animations'));
const SpeedPage = lazy(() => import('@/pages/speed'));
const SeoPage = lazy(() => import('@/pages/seo'));
const AeoPage = lazy(() => import('@/pages/aeo'));
const ActivityPage = lazy(() => import('@/pages/activity'));
const ReportsPage = lazy(() => import('@/pages/reports'));
const HealthPage = lazy(() => import('@/pages/health'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: '100%',
        opacity: 0,
        animation: 'fadeIn 200ms ease-out 200ms forwards',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          border: '2px solid var(--border-default)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) {
    return <PageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const restoreSession = useAuth((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Protected app routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="setup" element={<SetupPage />} />
              <Route path="figma" element={<FigmaPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="animations" element={<AnimationsPage />} />
              <Route path="speed" element={<SpeedPage />} />
              <Route path="seo" element={<SeoPage />} />
              <Route path="aeo" element={<AeoPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
