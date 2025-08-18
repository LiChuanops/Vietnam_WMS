import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import ExportInventory from './inventory/ExportInventory'

const Inventory = () => {
  const { t } = useLanguage()

  return (
    <div className="p-6">
      {/* Direct Export Inventory Content */}
      <ExportInventory />
    </div>
  )
}

export default Inventory
