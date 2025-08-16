import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ExportInventory from './inventory/ExportInventory'

const Inventory = () => {
  const { t } = useLanguage()
  const [activeSection, setActiveSection] = useState('export')

  const sections = [
    { id: 'export', name: 'Export Inventory', icon: '📤' },
    { id: 'import', name: 'Import Inventory', icon: '📥', disabled: true }
  ]

  return (
    <div className="p-6">
      {/* Section Navigation */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t('inventory')}</h1>
        
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => !section.disabled && setActiveSection(section.id)}
                disabled={section.disabled}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-indigo-500 text-indigo-600'
                    : section.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.name}
                {section.disabled && (
                  <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Section Content */}
      <div className="section-content">
        {activeSection === 'export' && <ExportInventory />}
        {activeSection === 'import' && (
          <div className="text-center py-12">
            <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Import Inventory</h2>
            <p className="text-gray-500 mb-8">This feature is coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory
