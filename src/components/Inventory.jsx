import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import ExportInventory from './inventory/ExportInventory'

const Inventory = () => {
  const { t } = useLanguage()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t('inventory')}</h1>
      </div>

      {/* Direct Export Inventory Content */}
      <ExportInventory />
    </div>
  )
}

export default Inventory
