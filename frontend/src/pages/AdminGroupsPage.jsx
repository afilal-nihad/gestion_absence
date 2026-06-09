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
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', description: '', trainer_ids: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/groups', token);
      setGroups(data);
      if (canManage) {
        const trainersData = await api.get('/users/trainers', token);
        setTrainers(trainersData);
      }
    } catch (err) {
      setError(err.message || t('groups.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, canManage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTrainerChange = (trainerId) => {
    setForm((prev) => {
      const current = prev.trainer_ids || [];
      if (current.includes(trainerId)) {
        return { ...prev, trainer_ids: current.filter(id => id !== trainerId) };
      } else {
        return { ...prev, trainer_ids: [...current, trainerId] };
      }
    });
  };

  const handleEdit = (group) => {
    setForm({
      id: group.id,
      name: group.name,
      description: group.description || '',
      trainer_ids: group.trainer_ids || []
    });
  };

  const resetForm = () => {
    setForm({ id: null, name: '', description: '', trainer_ids: [] });
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
        description: form.description || null,
        trainer_ids: form.trainer_ids
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
    { key: 'trainee_count', label: t('groups.columns.traineeCount') },
    { 
      key: 'trainer_ids', 
      label: 'Formateurs', 
      render: (val) => {
        if (!val || val.length === 0) return '0';
        if (trainers.length === 0) return val.length;
        const names = val.map(id => {
          const t = trainers.find(tr => tr.id === id);
          return t ? `${t.first_name} ${t.last_name}` : '';
        }).filter(Boolean);
        if (names.length === 0) return val.length;
        return `${val.length} (${names.join(', ')})`;
      }
    }
  ];

  return (
    <div className="page">
      <h1>{t('groups.title')}</h1>
      <div className={canManage ? "grid-2" : ""}>
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
              
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Assigner des formateurs
                </label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}>
                  {trainers.map(trainer => (
                    <label key={trainer.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input 
                        type="checkbox" 
                        checked={(form.trainer_ids || []).includes(trainer.id)} 
                        onChange={() => handleTrainerChange(trainer.id)} 
                        style={{ marginRight: '0.5rem' }}
                      />
                      {trainer.first_name} {trainer.last_name}
                    </label>
                  ))}
                  {trainers.length === 0 && (
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>Aucun formateur trouvé.</span>
                  )}
                </div>
              </div>

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


