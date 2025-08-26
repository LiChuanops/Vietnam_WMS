import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const LocalReports = () => {
  const { t } = useLanguage();
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">{t('localReports')}</h2>
      <p>{t('localReportsContent')}</p>
    </div>
  );
};

export default LocalReports;
