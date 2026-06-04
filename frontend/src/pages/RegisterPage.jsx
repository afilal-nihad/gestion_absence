import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName || !lastName || !email || !password) {
      setError(t('auth.errorFieldsRequired'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        first_name: firstName,
        last_name: lastName,
        email,
        password
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || t('auth.errorRegister'));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>{t('auth.registerTitle')}</h1>
          <div className="auth-card-actions">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        <form onSubmit={handleSubmit} className="form">
          <label>
            {t('auth.firstNameLabel')}
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label>
            {t('auth.lastNameLabel')}
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
          <label>
            {t('auth.emailLabel')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="off"
              required
            />
          </label>
          <label>
            {t('auth.passwordLabel')}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="new-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('auth.registering') : t('auth.registerButton')}
          </button>
        </form>

        <p className="auth-subtitle" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          {t('auth.alreadyRegistered')} <Link to="/login" className="text-link">{t('auth.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
