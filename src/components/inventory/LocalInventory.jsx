import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LocalInventorySummary from './local/LocalInventorySummary';
import LocalInbound from './local/LocalInbound';
import LocalOutbound from './local/LocalOutbound';
import LocalReports from './local/LocalReports';
import LocalInboundTransactionList from './local/LocalInboundTransactionList';
import LocalOutboundTransactionList from './local/LocalOutboundTransactionList';
import LocalAdjustment from './local/LocalAdjustment';

const LocalInventory = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', name: t('inventorySummary'), icon: '📊' },
    { id: 'inbound', name: t('inbound'), icon: '📥' },
    { id: 'inboundTransaction', name: t('inboundTransaction'), icon: '📜' },
    { id: 'outbound', name: t('outbound'), icon: '📤' },
    { id: 'outboundTransaction', name: t('outboundTransaction'), icon: '📜' },
    { id: 'adjustment', name: t('stockAdjustment'), icon: '🔧' },
    { id: 'reports', name: t('reports'), icon: '📋' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return <LocalInventorySummary />;
      case 'inbound':
        return <LocalInbound />;
      case 'inboundTransaction':
        return <LocalInboundTransactionList />;
      case 'outbound':
        return <LocalOutbound />;
      case 'outboundTransaction':
        return <LocalOutboundTransactionList />;
      case 'adjustment':
        return <LocalAdjustment />;
      case 'reports':
        return <LocalReports />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
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

      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default LocalInventory;
