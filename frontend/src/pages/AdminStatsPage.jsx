import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

function AdminStatsPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams();
        if (groupId) params.set('group_id', groupId);
        if (fromDate) params.set('from', fromDate);
        if (toDate) params.set('to', toDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const stats = await api.get(`/stats/global${query}`, token);
        setData(stats);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, groupId, fromDate, toDate]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await api.get('/groups', token);
        setGroups(res);
      } catch {
        // ignore
      }
    };
    loadGroups();
  }, [token]);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (groupId) params.set('group_id', groupId);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `http://localhost:4000/api/stats/global/export${query}`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = 'stats-globales.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        // ignore
      });
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams();
    if (groupId) params.set('group_id', groupId);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `http://localhost:4000/api/stats/global/export-pdf${query}`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = 'stats-globales.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        // ignore
      });
  };

  if (loading) {
    return (
      <div className="page">
        <h1>{t('stats.title')}</h1>
        <div className="centered">
          <div className="loader" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <h1>{t('stats.title')}</h1>
        <p>{t('stats.empty')}</p>
      </div>
    );
  }

  const traineeData = data.byTrainee.map((tData) => ({
    name: `${tData.last_name} ${tData.first_name}`,
    presence: tData.attendance_rate
  }));

  const groupData = data.byGroup.map((g) => ({
    name: g.group_name,
    presence: g.attendance_rate
  }));

  const dateData = data.byDate.map((d) => ({
    name: d.date,
    presence: d.attendance_rate
  }));
  const chartTextColor = 'var(--theme-muted)';
  const chartGridColor = 'var(--theme-border)';
  const chartTooltipStyle = {
    background: 'var(--theme-surface-strong)',
    border: '1px solid var(--theme-border)',
    borderRadius: '0.6rem',
    color: 'var(--theme-text)'
  };

  return (
    <div className="page">
      <h1>{t('stats.title')}</h1>
      <div className="card mb-md">
        <div className="form-row">
          <label>
            {t('stats.filters.from')}
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            {t('stats.filters.to')}
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label>
            {t('stats.filters.group')}
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={user?.role === 'TRAINER'}>
              <option value="">{t('stats.filters.allGroups')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions mt-sm">
          <button type="button" className="btn-secondary" onClick={handleExportCsv}>
            {t('stats.actions.exportCsv')}
          </button>
          <button type="button" className="btn-secondary" onClick={handleExportPdf}>
            {t('stats.actions.exportPdf')}
          </button>
        </div>
      </div>
      <div className="grid-1">
        <div className="card">
          <h2>{t('stats.charts.traineeRate')}</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={traineeData}>
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--theme-text)' }} />
                <Legend wrapperStyle={{ color: chartTextColor }} />
                <Bar dataKey="presence" fill="var(--theme-chart-primary)" name={t('stats.charts.rateName')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2>{t('stats.charts.groupRate')}</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={groupData}>
                <XAxis dataKey="name" tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <YAxis tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--theme-text)' }} />
                <Legend wrapperStyle={{ color: chartTextColor }} />
                <Bar dataKey="presence" fill="var(--theme-chart-success)" name={t('stats.charts.rateName')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2>{t('stats.charts.dateRate')}</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dateData}>
                <XAxis dataKey="name" tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <YAxis tick={{ fill: chartTextColor }} axisLine={{ stroke: chartGridColor }} tickLine={{ stroke: chartGridColor }} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: 'var(--theme-text)' }} />
                <Legend wrapperStyle={{ color: chartTextColor }} />
                <Bar dataKey="presence" fill="var(--theme-chart-warning)" name={t('stats.charts.rateName')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStatsPage;

