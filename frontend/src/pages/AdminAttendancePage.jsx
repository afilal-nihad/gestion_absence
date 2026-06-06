import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

function AdminAttendancePage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [trainees, setTrainees] = useState([]);
  const [history, setHistory] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await api.get('/groups', token);
        setGroups(data);
        if (user?.role === 'TRAINER' && data.length > 0) {
          setSelectedGroup(String(data[0].id));
        }
      } catch {
        // ignore
      }
    };
    loadGroups();
  }, [token, user?.role]);

  useEffect(() => {
    const loadTrainees = async () => {
      if (!selectedGroup) {
        setTrainees([]);
        return;
      }
      try {
        const all = await api.get('/users/trainees', token);
        const existingRows = selectedGroup && date
          ? await api.get(`/attendance?group_id=${selectedGroup}&date=${date}`, token)
          : [];
        const existingByUserId = new Map(existingRows.map((row) => [Number(row.user_id), row]));
        setTrainees(
          all
            .filter((tData) => String(tData.group_id) === String(selectedGroup))
            .map((tData) => {
              const existing = existingByUserId.get(Number(tData.id));
              return {
                ...tData,
                status: existing?.status || 'PRESENT',
                arrival_time: existing?.arrival_time || '',
                certificate_status: existing?.certificate_status || null
              };
            })
        );
      } catch {
        // ignore
      }
    };
    loadTrainees();
    const intervalId = window.setInterval(loadTrainees, 30000);
    return () => window.clearInterval(intervalId);
  }, [selectedGroup, date, token]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedGroup) params.set('group_id', selectedGroup);
        if (date) params.set('date', date);
        if (fromDate) params.set('from', fromDate);
        if (toDate) params.set('to', toDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        const rows = await api.get(`/attendance${query}`, token);
        setHistory(rows);
      } catch {
        // ignore
      }
    };
    loadHistory();
  }, [token, selectedGroup, date, fromDate, toDate, message]);

  const handleStatusChange = (id, status) => {
    setTrainees((prev) =>
      prev.map((tData) => (tData.id === id ? { ...tData, status } : tData))
    );
  };

  const handleTimeChange = (id, time) => {
    setTrainees((prev) =>
      prev.map((tData) => (tData.id === id ? { ...tData, arrival_time: time } : tData))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !date) return;
    setSaving(true);
    setMessage('');
    try {
      const records = trainees
        .filter((tData) => tData.access_status !== 'BLOCKED')
        .map((tData) => ({
          user_id: tData.id,
          status: tData.status,
          arrival_time: tData.arrival_time || null
        }));
      await api.post(
        '/attendance/bulk',
        {
          group_id: Number(selectedGroup),
          date,
          records
        },
        token
      );
      setMessage(t('attendance.messages.saved'));
    } catch (err) {
      setMessage(err.message || t('attendance.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const getTraineeRowClass = (tData) => {
    if (tData.access_status === 'BLOCKED') return 'attendance-row-blocked';
    if (tData.status === 'ABSENT' && tData.certificate_status !== 'APPROVED') {
      return 'attendance-row-warning';
    }
    return 'attendance-row-ok';
  };



  return (
    <div className="page">
      <h1>{t('attendance.title')}</h1>
      <form className="card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>
            {t('attendance.filters.date')}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label>
            {t('attendance.filters.group')}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              required={user?.role === 'ADMIN'}
              disabled={user?.role === 'TRAINER'}
            >
              <option value="">{t('attendance.filters.selectGroup')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('attendance.filters.from')}
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            {t('attendance.filters.to')}
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
        </div>

        {trainees.length > 0 && (
          <div className="attendance-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('attendance.table.trainee')}</th>
                  <th>{t('attendance.table.status')}</th>
                  <th>{t('attendance.table.arrivalTime')}</th>
                </tr>
              </thead>
              <tbody>
                {trainees.map((tData) => (
                  <tr key={tData.id} className={getTraineeRowClass(tData)}>
                    <td>
                      {tData.last_name} {tData.first_name}
                      {tData.access_status === 'BLOCKED' && (
                        <span className="status-badge status-badge-danger">{t('common.accessStatus.BLOCKED')}</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={tData.status}
                        onChange={(e) => handleStatusChange(tData.id, e.target.value)}
                        disabled={tData.access_status === 'BLOCKED'}
                      >
                        <option value="PRESENT">{t('common.status.PRESENT')}</option>
                        <option value="ABSENT">{t('common.status.ABSENT')}</option>
                        <option value="LATE">{t('common.status.LATE')}</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="time"
                        value={tData.arrival_time}
                        onChange={(e) => handleTimeChange(tData.id, e.target.value)}
                        disabled={tData.access_status === 'BLOCKED'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="form-actions mt-md">
          <button type="submit" className="btn-primary" disabled={saving || trainees.length === 0}>
            {saving ? t('attendance.actions.saving') : t('attendance.actions.save')}
          </button>
        </div>
        {message && <div className="form-info mt-sm">{message}</div>}
      </form>

      <div className="card mt-lg">
        <h2>{t('attendance.history.title')}</h2>
        <div className="attendance-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('attendance.history.columns.date')}</th>
                <th>{t('attendance.history.columns.trainee')}</th>
                <th>{t('attendance.history.columns.group')}</th>
                <th>{t('attendance.history.columns.status')}</th>
                <th>{t('attendance.history.columns.arrivalTime')}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5}>{t('attendance.history.empty')}</td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>
                      {row.last_name} {row.first_name}
                    </td>
                    <td>{row.group_name}</td>
                    <td>{t(`common.status.${row.status}`, row.status)}</td>
                    <td>{row.arrival_time || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminAttendancePage;
