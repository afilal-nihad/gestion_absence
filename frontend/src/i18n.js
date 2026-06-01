import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';
import translationES from './locales/es.json';

const resources = {
  fr: { translation: translationFR },
  en: { translation: translationEN },
  es: { translation: translationES }
};

// Récupérer la langue sauvegardée dans localStorage ou détecter par défaut
const savedLanguage = localStorage.getItem('language') || 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false // react s'occupe déjà de l'échappement XSS
    }
  });

// Écouter les changements de langue pour les sauvegarder dans localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
