import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { useTranslation } from 'react-i18next';

function AdminGroupsPage() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const canManage = user?.role === 'ADMIN';
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/groups', token);
      setGroups(data);
    } catch (err) {
      setError(err.message || t('groups.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (group) => {
    setForm({
      id: group.id,
      name: group.name,
      description: group.description || ''
    });
  };

  const resetForm = () => {
    setForm({ id: null, name: '', description: '' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) {
      setError(t('groups.errorRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null
      };
      if (form.id) {
        await api.put(`/groups/${form.id}`, payload, token);
      } else {
        await api.post('/groups', payload, token);
      }
      await load();
      resetForm();
    } catch (err) {
      setError(err.message || t('groups.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('groups.confirmDelete'))) return;
    try {
      await api.del(`/groups/${id}`, token);
      await load();
    } catch (err) {
      setError(err.message || t('groups.errorDelete'));
    }
  };

  const columns = [
    { key: 'name', label: t('groups.columns.name') },
    { key: 'description', label: t('groups.columns.description') },
    { key: 'trainee_count', label: t('groups.columns.traineeCount') }
  ];

  return (
    <div className="page">
      <h1>{t('groups.title')}</h1>
      <div className="grid-2">
        <div>
          <h2>{t('groups.listTitle')}</h2>
          {loading ? (
            <div className="centered">
              <div className="loader" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={groups}
              emptyMessage={t('groups.emptyMessage')}
              onRowClick={canManage ? handleEdit : undefined}
            />
          )}
        </div>
        {canManage && (
          <div>
            <h2>{form.id ? t('groups.editTitle') : t('groups.addTitle')}</h2>
            <div className="card">
              <form className="form" onSubmit={handleSubmit}>
              <label>
                {t('groups.name')}
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                {t('groups.description')}
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                />
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

export default AdminGroupsPage;


