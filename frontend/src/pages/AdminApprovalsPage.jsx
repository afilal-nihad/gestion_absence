import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function AdminApprovalsPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [pendingUsers, groupData, certificateData] = await Promise.all([
      api.get('/users/pending', token),
      api.get('/groups', token),
      api.get('/users/certificates?review_status=PENDING', token)
    ]);
    setUsers(pendingUsers);
    setGroups(groupData);
    setCertificates(certificateData);
  };

  useEffect(() => {
    load().catch(() => setMessage(t('common.error')));
  }, [token]);

  const updateUser = async (user, accountStatus) => {
    const role = user.role || 'TRAINEE';
    
    if (accountStatus === 'APPROVED' && role === 'TRAINEE' && !user.group_id) {
      setMessage(t('common.error') + ' : ' + t('common.noGroup'));
      return;
    }

    await api.put(
      `/users/${user.id}/status`,
      {
        account_status: accountStatus,
        role,
        group_id: role === 'TRAINEE' || role === 'TRAINER' ? user.group_id || null : null,
        access_status: user.access_status || 'ALLOWED'
      },
      token
    );
    setMessage(t('approvals.messages.userUpdated'));
    await load();
  };

  const updateCertificate = async (id, reviewStatus) => {
    await api.put(`/users/certificates/${id}/status`, { review_status: reviewStatus }, token);
    setMessage(t('approvals.messages.certificateUpdated'));
    await load();
  };

  const updateLocalUser = (id, field, value) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, [field]: value } : user)));
  };

  return (
    <div className="page">
      <h1>{t('approvals.title')}</h1>
      <p className="page-subtitle">{t('approvals.subtitle')}</p>
      {message && <div className="form-info mt-sm">{message}</div>}

      <div className="grid-1 mt-md">
        <div className="card">
          <h2>{t('approvals.accountsTitle')}</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('trainees.columns.lastName')}</th>
                  <th>{t('trainees.columns.firstName')}</th>
                  <th>{t('trainees.columns.email')}</th>
                  <th>{t('profile.role')}</th>
                  <th>{t('trainees.group')}</th>
                  <th>{t('trainees.accessStatus')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">{t('approvals.emptyAccounts')}</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.last_name}</td>
                      <td>{user.first_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select value={user.role || 'TRAINEE'} onChange={(e) => updateLocalUser(user.id, 'role', e.target.value)}>
                          <option value="TRAINEE">{t('common.roles.TRAINEE')}</option>
                          <option value="TRAINER">{t('common.roles.TRAINER')}</option>
                          <option value="ADMIN">{t('common.roles.ADMIN')}</option>
                        </select>
                      </td>
                      <td>
                        <select value={user.group_id || ''} onChange={(e) => updateLocalUser(user.id, 'group_id', e.target.value)}>
                          <option value="">{t('common.noGroup')}</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select value={user.access_status || 'ALLOWED'} onChange={(e) => updateLocalUser(user.id, 'access_status', e.target.value)}>
                          <option value="ALLOWED">{t('common.accessStatus.ALLOWED')}</option>
                          <option value="BLOCKED">{t('common.accessStatus.BLOCKED')}</option>
                        </select>
                      </td>
                      <td className="table-actions">
                        <button type="button" className="btn-primary" onClick={() => updateUser(user, 'APPROVED')}>
                          {t('approvals.actions.approve')}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => updateUser(user, 'REJECTED')}>
                          {t('approvals.actions.reject')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>{t('approvals.certificatesTitle')}</h2>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('attendance.history.columns.date')}</th>
                  <th>{t('attendance.history.columns.trainee')}</th>
                  <th>{t('attendance.history.columns.group')}</th>
                  <th>{t('studentAttendance.columns.certificate')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">{t('approvals.emptyCertificates')}</td>
                  </tr>
                ) : (
                  certificates.map((certificate) => (
                    <tr key={certificate.id}>
                      <td>{certificate.date}</td>
                      <td>{certificate.last_name} {certificate.first_name}</td>
                      <td>{certificate.group_name}</td>
                      <td>
                        <a className="text-link" href={`data:${certificate.mime_type};base64,${certificate.file_data}`} download={certificate.file_name}>
                          {certificate.file_name}
                        </a>
                      </td>
                      <td className="table-actions">
                        <button type="button" className="btn-primary" onClick={() => updateCertificate(certificate.id, 'APPROVED')}>
                          {t('approvals.actions.approve')}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => updateCertificate(certificate.id, 'REJECTED')}>
                          {t('approvals.actions.reject')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminApprovalsPage;
