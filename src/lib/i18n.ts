import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import thTranslations from '../locales/th.json';
import enTranslations from '../locales/en.json';

const resources = {
  th: {
    translation: thTranslations,
  },
  en: {
    translation: enTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  });

export default i18n;