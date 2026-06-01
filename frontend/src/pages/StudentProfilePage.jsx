import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

function StudentProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="page">
      <h1>{t('profile.title')}</h1>
      <div className="card">
        <div className="profile-row">
          <span className="profile-label">{t('profile.fullName')}</span>
          <span>
            {user.first_name} {user.last_name}
          </span>
        </div>
        <div className="profile-row">
          <span className="profile-label">{t('profile.email')}</span>
          <span>{user.email}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">{t('profile.role')}</span>
          <span>{t(`common.roles.${user.role}`, user.role)}</span>
        </div>
      </div>
    </div>
  );
}

export default StudentProfilePage;


