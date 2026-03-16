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
const GuidePage = lazy(() => import('@/pages/guide'));
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password'));
const SharedReportPage = lazy(() => import('@/pages/shared-report'));
const TeamsPage = lazy(() => import('@/pages/teams'));
const CommunityPage = lazy(() => import('@/pages/community'));

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
    <div style={{ padding: '24px', animation: 'fadeIn 200ms ease-out' }}>
      {/* Skeleton page header */}
      <div style={{ marginBottom: 24, padding: '16px 0' }}>
        <div
          style={{
            width: 180,
            height: 20,
            borderRadius: 6,
            backgroundColor: 'var(--surface-hover)',
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
            marginBottom: 8,
          }}
        />
        <div
          style={{
            width: 320,
            height: 14,
            borderRadius: 6,
            backgroundColor: 'var(--surface-hover)',
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
          }}
        />
      </div>
      {/* Skeleton content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 120,
              borderRadius: 8,
              backgroundColor: 'var(--surface-hover)',
              animation: 'skeletonPulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.05}s`,
              border: '1px solid var(--border-default)',
            }}
          />
        ))}
      </div>
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
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPasswordPage />
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
              <Route path="guide" element={<GuidePage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="community" element={<CommunityPage />} />
            </Route>

            {/* Public shared report (no auth required) */}
            <Route path="report/:token" element={<SharedReportPage />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
