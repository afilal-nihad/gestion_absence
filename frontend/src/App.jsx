import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentAttendancePage from './pages/StudentAttendancePage';
import StudentProfilePage from './pages/StudentProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminGroupsPage from './pages/AdminGroupsPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminStatsPage from './pages/AdminStatsPage';
import AdminApprovalsPage from './pages/AdminApprovalsPage';

function App() {
  const { user } = useAuth();
  const homeByRole = user
    ? user.role === 'ADMIN'
      ? '/admin'
      : user.role === 'TRAINER'
        ? '/formateur/presences'
        : '/stagiaire'
    : '/login';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeByRole} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={homeByRole} replace /> : <RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={homeByRole} replace />} />

        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="formateur"
          element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <Navigate to="/formateur/presences" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="stagiaire"
          element={
            <ProtectedRoute allowedRoles={['TRAINEE']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Stagiaire */}
        <Route
          path="stagiaire/presences"
          element={
            <ProtectedRoute allowedRoles={['TRAINEE']}>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route path="stagiaire/profil" element={<Navigate to="/stagiaire" replace />} />

        {/* Admin / Formateur */}
        <Route
          path="admin/stagiaires"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TRAINER']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/groupes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminGroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/validations"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/presences"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TRAINER']}>
              <AdminAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/statistiques"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminStatsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="formateur/stagiaires"
          element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="formateur/groupes"
          element={
            <Navigate to="/formateur/presences" replace />
          }
        />
        <Route
          path="formateur/presences"
          element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
              <AdminAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="formateur/statistiques"
          element={
            <Navigate to="/formateur/presences" replace />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={homeByRole} replace />} />
    </Routes>
  );
}

export default App;
