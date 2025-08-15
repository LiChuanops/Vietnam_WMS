import React from 'react'
import { useLanguage } from '../context/LanguageContext'

const Inventory = () => {
  const { t } = useLanguage()

  return (
    <div className="p-6">
      <div className="text-center">
        <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('inventory')}</h1>
        <p className="text-lg text-gray-500 mb-8">{t('comingSoon')}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Feature Under Development
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This inventory management feature is currently being developed. 
                  Please check back soon for updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inventory
