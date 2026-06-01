import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

function Layout() {
  const { user, stats, logout } = useAuth();
  const { t } = useTranslation();

  const isAdmin = user && user.role === 'ADMIN';
  const isTrainer = user && user.role === 'TRAINER';
  const isTrainee = user && user.role === 'TRAINEE';
  const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">
          <span className="logo-mark" aria-hidden="true">A</span>
          <span>{t('layout.title')}</span>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <LanguageSwitcher />
          {user && (
            <>
              <div className="user-menu">
                <span className="user-avatar" aria-hidden="true">{userInitials}</span>
                <div className="user-info">
                  <span className="user-name">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="user-role">
                    {t(`common.roles.${user.role}`, user.role)}
                  </span>
                </div>
              </div>
              <button className="btn-outline" onClick={logout}>
                {t('layout.logout')}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          {!isTrainer && (
            <NavLink
              end
              to={isAdmin ? '/admin' : isTrainee ? '/stagiaire' : '/'}
            >
              <span className="nav-icon" aria-hidden="true">D</span>
              <span>{t('layout.sidebar.dashboard')}</span>
            </NavLink>
          )}

          {isTrainee && (
            <>
              <div className="sidebar-section-title">{t('layout.sidebar.traineeSection')}</div>
              <NavLink to="/stagiaire/presences">
                <span className="nav-icon" aria-hidden="true">A</span>
                <span>{t('layout.sidebar.myAttendance')}</span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="sidebar-section-title">{t('layout.sidebar.adminSection')}</div>
              <NavLink to="/admin/stagiaires">
                <span className="nav-icon" aria-hidden="true">T</span>
                <span>{t('layout.sidebar.trainees')}</span>
              </NavLink>
              <NavLink to="/admin/groupes">
                <span className="nav-icon" aria-hidden="true">G</span>
                <span>{t('layout.sidebar.groups')}</span>
              </NavLink>
              <NavLink to="/admin/validations">
                <span className="nav-icon" aria-hidden="true">V</span>
                <span>{t('layout.sidebar.validations')}</span>
              </NavLink>
              <NavLink to="/admin/presences">
                <span className="nav-icon" aria-hidden="true">A</span>
                <span>{t('layout.sidebar.attendance')}</span>
              </NavLink>
              <NavLink to="/admin/statistiques">
                <span className="nav-icon" aria-hidden="true">S</span>
                <span>{t('layout.sidebar.stats')}</span>
              </NavLink>
            </>
          )}

          {isTrainer && (
            <>
              <div className="sidebar-section-title">{t('layout.sidebar.trainerSection')}</div>
              <NavLink to="/formateur/stagiaires">
                <span className="nav-icon" aria-hidden="true">T</span>
                <span>{t('layout.sidebar.trainees')}</span>
              </NavLink>
              <NavLink to="/formateur/presences">
                <span className="nav-icon" aria-hidden="true">A</span>
                <span>{t('layout.sidebar.attendance')}</span>
              </NavLink>
            </>
          )}
        </nav>

        <main className="main-content">
          {stats && !isTrainer && (
            <div className="stats-bar">
              <div className="stat-pill">
                {t('layout.statsBar.presents')}: <strong>{stats.presents || 0}</strong>
              </div>
              <div className="stat-pill">
                {t('layout.statsBar.absences')}: <strong>{stats.absences || 0}</strong>
              </div>
              <div className="stat-pill">
                {t('layout.statsBar.lates')}: <strong>{stats.lates || 0}</strong>
              </div>
              <div className="stat-pill">
                {t('layout.statsBar.attendanceRate')}: <strong>{stats.attendance_rate || 0}%</strong>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
