import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/use-auth';
import { lazy, Suspense, type ReactNode } from 'react';

const DashboardPage = lazy(() => import('@/pages/dashboard'));
const SetupPage = lazy(() => import('@/pages/setup'));
const TemplatesPage = lazy(() => import('@/pages/templates'));
const AnimationsPage = lazy(() => import('@/pages/animations'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const GuidePage = lazy(() => import('@/pages/guide'));
const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password'));

// Project workflow step pages
const ProjectFigmaPage = lazy(() => import('@/pages/project-figma'));
const ProjectStructurePage = lazy(() => import('@/pages/project-structure'));
const ProjectStylePage = lazy(() => import('@/pages/project-style'));
const ProjectReviewPage = lazy(() => import('@/pages/project-review'));

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
              <Route path="setup" element={<SetupPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="animations" element={<AnimationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="guide" element={<GuidePage />} />

              {/* Project workflow routes */}
              <Route path="project/:projectId/setup" element={<SetupPage />} />
              <Route path="project/:projectId/figma" element={<ProjectFigmaPage />} />
              <Route path="project/:projectId/structure" element={<ProjectStructurePage />} />
              <Route path="project/:projectId/style" element={<ProjectStylePage />} />
              <Route path="project/:projectId/review" element={<ProjectReviewPage />} />
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
