import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { useTranslation } from 'react-i18next';

function AdminTraineesPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const canManage = user?.role === 'ADMIN';
  const [trainees, setTrainees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    group_id: '',
    access_status: 'ALLOWED'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [tData, gData] = await Promise.all([
        api.get('/users/trainees', token),
        api.get('/groups', token)
      ]);
      setTrainees(tData);
      setGroups(gData);
    } catch (err) {
      setError(err.message || t('trainees.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const intervalId = window.setInterval(load, 30000);
    return () => window.clearInterval(intervalId);
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (trainee) => {
    setForm({
      id: trainee.id,
      first_name: trainee.first_name,
      last_name: trainee.last_name,
      email: trainee.email,
      password: '',
      group_id: trainee.group_id || '',
      access_status: trainee.access_status || 'ALLOWED'
    });
  };

  const resetForm = () => {
    setForm({
      id: null,
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      group_id: '',
      access_status: 'ALLOWED'
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name || !form.last_name || !form.email) {
      setError(t('trainees.errorRequired'));
      return;
    }
    if (!form.id && !form.password) {
      setError(t('trainees.errorPasswordRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        group_id: form.group_id || null,
        access_status: form.access_status
      };
      if (form.password) {
        payload.password = form.password;
      }
      if (form.id) {
        await api.put(`/users/trainees/${form.id}`, payload, token);
      } else {
        await api.post('/users/trainees', payload, token);
      }
      await load();
      resetForm();
    } catch (err) {
      setError(err.message || t('trainees.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('trainees.confirmDelete'))) return;
    try {
      await api.del(`/users/trainees/${id}`, token);
      await load();
    } catch (err) {
      setError(err.message || t('trainees.errorDelete'));
    }
  };

  const columns = [
    { key: 'last_name', label: t('trainees.columns.lastName') },
    { key: 'first_name', label: t('trainees.columns.firstName') },
    { key: 'email', label: t('trainees.columns.email') },
    { key: 'group_name', label: t('trainees.columns.group') },
    {
      key: 'access_status',
      label: t('trainees.columns.accessStatus'),
      render: (value) => t(`common.accessStatus.${value || 'ALLOWED'}`)
    }
  ];

  return (
    <div className="page">
      <h1>{t('trainees.title')}</h1>
      <div className="grid-2">
        <div>
          <h2>{t('trainees.listTitle')}</h2>
          {loading ? (
            <div className="centered">
              <div className="loader" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={trainees}
              emptyMessage={t('trainees.emptyMessage')}
              onRowClick={canManage ? handleEdit : undefined}
            />
          )}
        </div>
        {canManage && (
          <div>
            <h2>{form.id ? t('trainees.editTitle') : t('trainees.addTitle')}</h2>
            <div className="card">
              <form className="form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  {t('trainees.firstName')}
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  {t('trainees.lastName')}
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
              <label>
                {t('trainees.email')}
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                {t('trainees.password')} {form.id && <span className="muted">{t('trainees.passwordHint')}</span>}
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </label>
              <label>
                {t('trainees.group')}
                <select name="group_id" value={form.group_id} onChange={handleChange}>
                  <option value="">{t('common.noGroup')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('trainees.accessStatus')}
                <select name="access_status" value={form.access_status} onChange={handleChange}>
                  <option value="ALLOWED">{t('common.accessStatus.ALLOWED')}</option>
                  <option value="BLOCKED">{t('common.accessStatus.BLOCKED')}</option>
                </select>
              </label>
              {error && <div className="form-error">{error}</div>}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('common.saving') : t('common.save')}
                </button>
                {form.id && (
                  <>
                    <button type="button" className="btn-outline" onClick={resetForm}>
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(form.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </>
                )}
              </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTraineesPage;
