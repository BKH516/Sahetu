import i18n, { type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'ar';

const initOptions: InitOptions = {
  resources: {
    ar: {
      translation: ar,
    },
    en: {
      translation: en,
    },
  },
  lng: savedLanguage,
  fallbackLng: 'ar',
  supportedLngs: ['ar', 'en'],
  nonExplicitSupportedLngs: true,
  defaultNS: 'translation',
  ns: ['translation'],
  load: 'languageOnly',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
  },
};

i18n.use(initReactI18next).init(initOptions);

// Ensure resource bundles are registered for all languages
if (!i18n.hasResourceBundle('ar', 'translation')) {
  i18n.addResourceBundle('ar', 'translation', ar, true, true);
}

if (!i18n.hasResourceBundle('en', 'translation')) {
  i18n.addResourceBundle('en', 'translation', en, true, true);
}

// Preload available languages
i18n.loadLanguages(['ar', 'en']).catch((err) => {
  console.error('Failed to preload languages', err);
});

// Set initial document direction and language
if (typeof document !== 'undefined') {
  document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = savedLanguage;
  
  // Listen for language changes
  i18n.on('languageChanged', (lng) => {
    i18n.loadLanguages(lng).catch((err) => {
      console.error('Failed to load language', lng, err);
    });
    i18n.reloadResources([lng]).catch((err) => {
      console.error('Failed to reload resources for', lng, err);
    });
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
    localStorage.setItem('language', lng);
  });
}

export default i18n;

