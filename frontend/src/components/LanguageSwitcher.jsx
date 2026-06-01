import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className="lang-select"
        aria-label="Select Language"
      >
        <option value="fr">FR</option>
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </div>
  );
}
