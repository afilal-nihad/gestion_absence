import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

const TIME_SLOTS = ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:00'];

function AdminAttendancePage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  
  const [trainees, setTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  
  const [bulkStatus, setBulkStatus] = useState('PRESENT');
  const [bulkArrivalTime, setBulkArrivalTime] = useState('');

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
        setTrainees(
          all.filter((tData) => String(tData.group_id) === String(selectedGroup))
        );
      } catch {
        // ignore
      }
    };
    loadTrainees();
  }, [selectedGroup, token]);

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

  const handleTimeSlotToggle = (slot) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleTraineeToggle = (id) => {
    setSelectedTrainees((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAllTrainees = () => {
    const assignableIds = trainees.filter(t => t.access_status !== 'BLOCKED').map(t => t.id);
    if (selectedTrainees.length === assignableIds.length) {
      setSelectedTrainees([]);
    } else {
      setSelectedTrainees(assignableIds);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup || !date || selectedTimeSlots.length === 0 || selectedTrainees.length === 0) {
      setMessage(t('attendance.messages.missingFields') || 'Veuillez sélectionner au moins un groupe, une date, un créneau et un stagiaire.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const records = selectedTrainees.map((id) => ({
        user_id: id,
        status: bulkStatus,
        arrival_time: bulkStatus === 'LATE' ? bulkArrivalTime : null
      }));
      await api.post(
        '/attendance/bulk',
        {
          group_id: Number(selectedGroup),
          date,
          time_slots: selectedTimeSlots,
          records
        },
        token
      );
      setMessage(t('attendance.messages.saved'));
      setSelectedTrainees([]);
    } catch (err) {
      setMessage(err.message || t('attendance.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const getTraineeRowClass = (tData) => {
    if (tData.access_status === 'BLOCKED') return 'attendance-row-blocked';
    return selectedTrainees.includes(tData.id) ? 'attendance-row-selected' : '';
  };

  return (
    <div className="page">
      <h1>{t('attendance.title')}</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div>
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
                    required={user?.role === 'ADMIN' || user?.role === 'TRAINER'}
                  >
                    <option value="">{t('attendance.filters.selectGroup')}</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              
              <div className="mt-md">
                <label className="field-label">{t('attendance.timeSlots') || 'Créneaux horaires'}</label>
                <div className="time-slot-group">
                  {TIME_SLOTS.map(slot => (
                    <label key={slot} className={`time-slot-pill ${selectedTimeSlots.includes(slot) ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedTimeSlots.includes(slot)} 
                        onChange={() => handleTimeSlotToggle(slot)} 
                        className="sr-only"
                      />
                      {slot}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="form-row" style={{ alignItems: 'flex-end' }}>
                <label>
                  {t('attendance.table.status')}
                  <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                    <option value="PRESENT">{t('common.status.PRESENT')}</option>
                    <option value="ABSENT">{t('common.status.ABSENT')}</option>
                    <option value="LATE">{t('common.status.LATE')}</option>
                  </select>
                </label>
                
                {bulkStatus === 'LATE' && (
                  <label>
                    {t('attendance.table.arrivalTime')}
                    <input 
                      type="time" 
                      value={bulkArrivalTime} 
                      onChange={(e) => setBulkArrivalTime(e.target.value)} 
                      required
                    />
                  </label>
                )}
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" disabled={saving || selectedTrainees.length === 0 || selectedTimeSlots.length === 0}>
                  {saving ? t('attendance.actions.saving') : t('attendance.actions.save')}
                </button>
                {message && <div className="form-info" style={{ marginTop: '0.5rem' }}>{message}</div>}
              </div>
            </div>
          </div>
        </form>
      </div>

      {trainees.length > 0 && (
        <div className="card mt-lg">
          <h3>{t('attendance.step3') || 'Sélectionner les stagiaires'}</h3>
          <div className="attendance-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllTrainees} 
                      checked={selectedTrainees.length > 0 && selectedTrainees.length === trainees.filter(t => t.access_status !== 'BLOCKED').length}
                    />
                  </th>
                  <th>{t('attendance.table.trainee')}</th>
                  <th>{t('trainees.columns.email')}</th>
                </tr>
              </thead>
              <tbody>
                {trainees.map((tData) => (
                  <tr key={tData.id} className={getTraineeRowClass(tData)} onClick={() => tData.access_status !== 'BLOCKED' && handleTraineeToggle(tData.id)} style={{ cursor: tData.access_status === 'BLOCKED' ? 'not-allowed' : 'pointer' }}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedTrainees.includes(tData.id)}
                        onChange={() => {}} 
                        disabled={tData.access_status === 'BLOCKED'}
                      />
                    </td>
                    <td>
                      {tData.last_name} {tData.first_name}
                      {tData.access_status === 'BLOCKED' && (
                        <span className="status-badge status-badge-danger" style={{ marginLeft: '1rem' }}>{t('common.accessStatus.BLOCKED')}</span>
                      )}
                    </td>
                    <td className="muted">{tData.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card mt-lg">
        <h2>{t('attendance.history.title')}</h2>
        <div className="form-row mb-md">
          <label>
            {t('attendance.filters.from')}
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label>
            {t('attendance.filters.to')}
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
        </div>
        <div className="attendance-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('attendance.history.columns.date')}</th>
                <th>{t('attendance.timeSlots') || 'Créneau'}</th>
                <th>{t('attendance.history.columns.trainee')}</th>
                <th>{t('attendance.history.columns.group')}</th>
                <th>{t('attendance.history.columns.status')}</th>
                <th>{t('attendance.history.columns.arrivalTime')}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6}>{t('attendance.history.empty')}</td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.time_slot}</td>
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
