
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GroupManagementPage from './pages/GroupManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import MasterlistPage from './pages/MasterlistPage';
import GradingSheetPage from './pages/GradingSheetPage';
import AwardsPage from './pages/AwardsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MaintenancePage from './pages/MaintenancePage';
import Layout from './components/layout/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { User, UserRole } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <HashRouter>
          <Main />
        </HashRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

const Main: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/*" element={
        user ? (
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/groups" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.COURSE_ADVISER]}><GroupManagementPage /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.COURSE_ADVISER]}><UserManagementPage /></ProtectedRoute>} />
              <Route path="/masterlist" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.COURSE_ADVISER]}><MasterlistPage /></ProtectedRoute>} />
              <Route path="/maintenance" element={<ProtectedRoute roles={[UserRole.ADMIN, UserRole.COURSE_ADVISER]}><MaintenancePage /></ProtectedRoute>} />
              <Route path="/grading/:groupId" element={<ProtectedRoute roles={[UserRole.PANEL, UserRole.EXTERNAL_PANEL]}><GradingSheetPage /></ProtectedRoute>} />
              <Route path="/awards" element={<AwardsPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
};

interface ProtectedRouteProps {
  // Fix: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  children: React.ReactElement;
  roles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
};


export default App;