import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { Navbar } from './components/shared/Navbar';
import { Footer } from './components/shared/Footer';
import { ToastContainer } from './components/shared/ToastContainer';
import { SessionDetailModal } from './components/shared/SessionDetailModal';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

// Marketing Pages
import { HomePage } from './pages/marketing/HomePage';
import { PlatformPage } from './pages/marketing/PlatformPage';
import { SolutionsPage } from './pages/marketing/SolutionsPage';
import { TechnologyPage } from './pages/marketing/TechnologyPage';
import { PricingPage } from './pages/marketing/PricingPage';
import { DocsPage } from './pages/marketing/DocsPage';
import { AboutPage } from './pages/marketing/AboutPage';
import { ContactPage } from './pages/marketing/ContactPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage, UnauthorizedPage, SessionExpiredPage } from './pages/auth/VerifyEmailPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

// Dashboard Pages
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { LiveMonitoringPage } from './pages/dashboard/LiveMonitoringPage';
import { TrafficAnalyticsPage } from './pages/dashboard/TrafficAnalyticsPage';
import { SessionExplorerPage } from './pages/dashboard/SessionExplorerPage';
import { ThreatIntelligencePage } from './pages/dashboard/ThreatIntelligencePage';
import { AIAgentActivityPage } from './pages/dashboard/AIAgentActivityPage';
import { ThreatPreventionPage } from './pages/dashboard/ThreatPreventionPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { IntegrationsPage } from './pages/dashboard/IntegrationsPage';
import { TeamManagementPage } from './pages/dashboard/TeamManagementPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Public Layout Wrapper
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-void text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Dashboard Route Wrapper with Authentication Guard
const DashboardRouteWrapper: React.FC = () => {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#080B09] flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-mono text-[#43D6A0]">
          <span className="w-2 h-2 rounded-full bg-[#43D6A0] animate-pulse" />
          <span>AUTHENTICATING SOC ZERO-TRUST SESSION...</span>
        </div>
      </div>
    );
  }

  if (!user && !localStorage.getItem('bp_token')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
      <SessionDetailModal />
    </DashboardLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Marketing Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/platform" element={<PlatformPage />} />
          <Route path="/features" element={<PlatformPage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/technology" element={<TechnologyPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Authentication & Onboarding Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/session-expired" element={<SessionExpiredPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route path="/app" element={<DashboardRouteWrapper />}>
              <Route index element={<Navigate to="/app/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="live" element={<LiveMonitoringPage />} />
              <Route path="analytics" element={<TrafficAnalyticsPage />} />
              <Route path="sessions" element={<SessionExplorerPage />} />
              <Route path="threats" element={<ThreatIntelligencePage />} />
              <Route path="agents" element={<AIAgentActivityPage />} />
              <Route path="prevention" element={<ThreatPreventionPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="team" element={<TeamManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <ToastContainer />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
