import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('auth.errorLoginFieldsRequired'));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || t('auth.errorLogin'));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>{t('auth.loginTitle')}</h1>
          <div className="auth-card-actions">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

        <form onSubmit={handleSubmit} className="form">
          <label>
            {t('auth.emailLabel')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
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
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>

        <p className="auth-subtitle" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
          {t('auth.noAccount')} <Link to="/register" className="text-link">{t('auth.registerLink')}</Link>
        </p>


      </div>
    </div>
  );
}

export default LoginPage;

