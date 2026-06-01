import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

function DashboardPage() {
  const { user, stats, token } = useAuth();
  const { t } = useTranslation();
  const [globalStats, setGlobalStats] = useState(null);
  const isAdmin = user?.role === 'ADMIN';
  const isTrainee = user?.role === 'TRAINEE';

  useEffect(() => {
    const load = async () => {
      if (!isAdmin) return;
      try {
        const data = await api.get('/stats/global', token);
        setGlobalStats(data);
      } catch {
        // ignore
      }
    };
    load();
  }, [isAdmin, token]);

  return (
    <div className="page">
      <h1>{t('dashboard.title')}</h1>
      <p className="page-subtitle">
        {t('dashboard.welcome', { name: `${user.first_name} ${user.last_name}` })}
      </p>

      <div className="grid-3">
        <StatCard label={t('dashboard.cards.presents')} value={stats?.presents || 0} accent="success" />
        <StatCard label={t('dashboard.cards.absences')} value={stats?.absences || 0} accent="danger" />
        <StatCard label={t('dashboard.cards.attendanceRate')} value={(stats?.attendance_rate || 0) + '%'} />
      </div>

      {isTrainee && (
        <div className="card mt-lg">
          <h2>{t('dashboard.traineeSummary.title')}</h2>
          <p className="muted">{t('dashboard.traineeSummary.subtitle')}</p>
        </div>
      )}

      {isAdmin && globalStats && (
        <div className="card mt-lg">
          <h2>{t('dashboard.quickStats.title')}</h2>
          <p className="muted">
            {t('dashboard.quickStats.subtitle')}
          </p>
          <div className="grid-3">
            <StatCard
              label={t('dashboard.quickStats.traineeCount')}
              value={globalStats.byTrainee?.length || 0}
              accent="primary"
            />
            <StatCard
              label={t('dashboard.quickStats.groupCount')}
              value={globalStats.byGroup?.length || 0}
              accent="primary"
            />
            <StatCard
              label={t('dashboard.quickStats.daysRecorded')}
              value={globalStats.byDate?.length || 0}
              accent="primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
