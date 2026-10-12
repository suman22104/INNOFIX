import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NavSearch from './components/NavSearch';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailsPage from './pages/CommunityDetailsPage';
import EventsPage from './pages/EventsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import MessagesPage from './pages/MessagesPage';
import SavedPage from './pages/SavedPage';
import TagFeedPage from './pages/TagFeedPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AboutAIPage from './pages/AboutAIPage';
import NotFoundPage from './pages/NotFoundPage';
import SearchPage from './pages/SearchPage';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Public Route wrapper component (prevents logged in users from seeing auth pages)
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // We remove the forced redirect to '/admin' so admins can explore the platform in Ghost Mode.
    // The LoginPage handles the specific redirect (Admin vs User login).
    // If they hit a public route while logged in without a specific intent, default to dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Admin-only route wrapper
function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  const isLandingPage = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showSidebar = isAuthenticated && !isLandingPage && !isAdminRoute && !isAuthPage;
  const showMobileNav = isAuthenticated && !isLandingPage && !isAdminRoute && !isAuthPage;
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Mobile top navbar for authenticated users */}
      {showMobileNav && (
        <div className="xl:hidden sticky top-0 z-40">
          <Navbar />
        </div>
      )}
      {/* Desktop top bar for signed-in users: INNOFIX + search (all roles) */}
      {showSidebar && (
        <div className="hidden xl:block sticky top-0 z-30 xl:pl-[72px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center h-16 px-6 lg:px-8">
            <Link to="/dashboard" className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
              INNO<span className="text-amber-500">FIX</span>
            </Link>
            <NavSearch />
          </div>
        </div>
      )}
      <div className="flex flex-1 w-full relative">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 w-full overflow-x-hidden ${showSidebar ? 'xl:pl-[72px]' : ''}`}>
          <Routes>
            {/* Public / Landing Routes */}
            <Route path="/" element={<LandingPage />} />
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
            <Route path="/about/ai" element={<AboutAIPage />} />

            {/* Authenticated Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Platform Feature Routes - Protected */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities"
              element={
                <ProtectedRoute>
                  <CommunitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities/:idOrSlug"
              element={
                <ProtectedRoute>
                  <CommunityDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/opportunities"
              element={
                <ProtectedRoute>
                  <OpportunitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tags/:tag"
              element={
                <ProtectedRoute>
                  <TagFeedPage />
                </ProtectedRoute>
              }
            />

            {/* Social Network & User Protected Routes */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Console */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <AppLayout />
      </SocketProvider>
    </ErrorBoundary>
  );
}
