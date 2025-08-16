import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import InventorySummary from './InventorySummary'
import InboundTransactions from './InboundTransactions'
import OutboundTransactions from './OutboundTransactions'
import InventoryReports from './InventoryReports'

const ExportInventory = () => {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('summary')

  const tabs = [
    { id: 'summary', name: 'Inventory Summary', icon: '📊' },
    { id: 'inbound', name: 'Inbound', icon: '📥' },
    { id: 'outbound', name: 'Outbound', icon: '📤' },
    { id: 'reports', name: 'Reports', icon: '📋' }
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && <InventorySummary />}
        {activeTab === 'inbound' && <InboundTransactions />}
        {activeTab === 'outbound' && <OutboundTransactions />}
        {activeTab === 'reports' && <InventoryReports />}
      </div>
    </div>
  )
}

export default ExportInventory
