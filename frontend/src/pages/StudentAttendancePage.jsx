import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { useTranslation } from 'react-i18next';

function StudentAttendancePage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const data = await api.get('/users/me/attendance', token);
      setRecords(data.records || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.id, token]);

  const uploadCertificate = async (attendanceId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(',')[1];
        await api.post(
          `/users/me/attendance/${attendanceId}/certificate`,
          {
            file_name: file.name,
            mime_type: file.type || 'application/octet-stream',
            file_data: base64
          },
          token
        );
        setMessage(t('studentAttendance.certificateUploaded'));
        await load();
      } catch (err) {
        setMessage(err.message || t('common.error'));
      }
    };
    reader.readAsDataURL(file);
  };

  const columns = [
    { key: 'date', label: t('studentAttendance.columns.date') },
    {
      key: 'status',
      label: t('studentAttendance.columns.status'),
      render: (value) => {
        if (value === 'PRESENT') return t('common.status.PRESENT');
        if (value === 'ABSENT') return t('common.status.ABSENT');
        if (value === 'LATE') return t('common.status.LATE');
        return value;
      }
    },
    { key: 'group_name', label: t('studentAttendance.columns.group') },
    { key: 'arrival_time', label: t('studentAttendance.columns.arrivalTime') },
    {
      key: 'certificate_status',
      label: t('studentAttendance.columns.certificate'),
      render: (value, row) => {
        if (row.status !== 'ABSENT') return '-';
        if (value) return t(`common.reviewStatus.${value}`);
        return (
          <label className="file-upload-inline">
            {t('studentAttendance.uploadCertificate')}
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                  alert(t('common.error') + ': PDF only');
                  e.target.value = '';
                  return;
                }
                uploadCertificate(row.id, file);
              }}
            />
          </label>
        );
      }
    }
  ];

  return (
    <div className="page">
      <h1>{t('studentAttendance.title')}</h1>
      <p className="page-subtitle">{t('studentAttendance.subtitle')}</p>
      {message && <div className="form-info mt-sm">{message}</div>}
      {loading ? (
        <div className="centered">
          <div className="loader" />
        </div>
      ) : (
        <DataTable columns={columns} data={records} emptyMessage={t('studentAttendance.emptyMessage')} />
      )}
    </div>
  );
}

export default StudentAttendancePage;

