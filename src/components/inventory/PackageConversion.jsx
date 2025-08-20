import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const PackageConversion = () => {
  const { t } = useLanguage();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">{t('packageConversion')}</h2>
      <div className="text-center text-gray-500">
        <p>{t('comingSoon')}</p>
        <p className="mt-2">This feature for package conversion is under construction.</p>
      </div>
    </div>
  );
};

export default PackageConversion;
