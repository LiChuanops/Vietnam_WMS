import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import ExportInventory from './inventory/ExportInventory'

const Inventory = () => {
  const { t } = useLanguage()

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Inventory Content Container - 跟着screen变化 */}
      <div className="flex-1 w-full h-full">
        <ExportInventory />
      </div>
    </div>
  )
}

export default Inventory
