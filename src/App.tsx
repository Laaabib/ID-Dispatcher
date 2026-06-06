import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import AdminPanel from './pages/AdminPanel';
import AdminDashboard from './pages/AdminDashboard';
import AdminActivityLog from './pages/AdminActivityLog';
import Reports from './pages/Reports';
import NametagForm from './pages/NametagForm';
import NametagAdmin from './pages/NametagAdmin';
import DailyWorksPage from './pages/DailyWorksPage';
import InventoryManagement from './pages/InventoryManagement';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import UserManagement from './pages/UserManagement';
import LeaveApplication from './pages/LeaveApplication';
import LeaveAdmin from './pages/LeaveAdmin';
import HRManagement from './pages/HRManagement';
import Departments from './pages/Departments';
import Designations from './pages/Designations';
import Trainees from './pages/Trainees';
import IDGeneration from './pages/IDGeneration';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="apply" element={<ApplicationForm />} />
                <Route path="admin-dashboard" element={<AdminDashboard />} />
                <Route path="activity-log" element={<AdminActivityLog />} />
                <Route path="reports" element={<Reports />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="nametag-request" element={<NametagForm />} />
                <Route path="nametag-admin" element={<NametagAdmin />} />
                <Route path="daily-works" element={<DailyWorksPage />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="employees" element={<Employees />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="hr" element={<HRManagement />} />
                <Route path="departments" element={<Departments />} />
                <Route path="designations" element={<Designations />} />
                <Route path="trainees" element={<Trainees />} />
                <Route path="employee-id-generation" element={<IDGeneration />} />
                <Route path="leave" element={<LeaveApplication />} />
                <Route path="leave-admin" element={<LeaveAdmin />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
