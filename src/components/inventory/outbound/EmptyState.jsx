// src/components/inventory/outbound/EmptyState.jsx
import React from 'react'
import { useLanguage } from '../../../context/LanguageContext'

const EmptyState = () => {
  const { t } = useLanguage()

  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
            d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noProductsSelected')}</h3>
      <p className="text-gray-500 mb-4">{t('selectCountryFromFilters')}</p>
      <p className="text-sm text-gray-400">{t('onceSelectCountry')}</p>
    </div>
  )
}

export default EmptyState
