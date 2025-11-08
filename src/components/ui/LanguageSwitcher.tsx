import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './button';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.language || 'ar';
  const isArabic = currentLanguage === 'ar';

  const toggleLanguage = () => {
    const newLanguage = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // Update document direction
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={t('language.switchLanguage')}
      title={t('language.switchLanguage')}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">
        {isArabic ? t('language.english') : t('language.arabic')}
      </span>
    </Button>
  );
};

export default LanguageSwitcher;

