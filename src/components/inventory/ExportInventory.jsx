import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import InventorySummary from './InventorySummary'
import InboundTransactions from './InboundTransactions'
import CustomDeclarationForm from './CustomDeclarationForm' // 重命名
import InventoryReports from './InventoryReports'
import InboundTransactionList from './InboundTransactionList'
import OutboundTransactionList from './OutboundTransactionList'
import Outbound from './Outbound'
import Adjustment from './Adjustment'

const ExportInventory = () => {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState('summary')

  // Inbound 相关状态
  const [inboundData, setInboundData] = useState({
    bulkProducts: [],
    productFilters: {
      country: '',
      vendor: '',
      type: '',
      search: ''
    },
    showProductList: true,
    transactionDate: new Date().toISOString().split('T')[0]
  })

  // Custom Declaration 相关状态 (原 Outbound)
  const [customDeclarationData, setCustomDeclarationData] = useState({
    selectedProducts: [],
    poNumber: '', // 新增 PO 字段
    declarationDate: new Date().toISOString().split('T')[0], // 新增日期字段
    productFilters: {
      country: '',
      vendor: '',
      type: '',
      search: ''
    },
    showProductList: true
  })

  // 清除 Inbound 数据
  const clearInboundData = () => {
    setInboundData({
      bulkProducts: [],
      productFilters: {
        country: '',
        vendor: '',
        type: '',
        search: ''
      },
      showProductList: true,
      transactionDate: new Date().toISOString().split('T')[0]
    })
  }

  // Outbound Shipment 相关状态
  const [outboundData, setOutboundData] = useState({
    selectedProducts: [],
    shipmentInfo: {
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: new Date().toISOString().split('T')[0],
      eta: new Date().toISOString().split('T')[0],
      poNumber: ''
    },
    productFilters: {
      country: '',
      vendor: '',
      type: '',
      search: ''
    },
    showProductList: true
  });

  // 清除 Outbound Shipment 数据
  const clearOutboundData = () => {
    setOutboundData({
      selectedProducts: [],
      shipmentInfo: {
        shipment: '',
        containerNumber: '',
        sealNo: '',
        etd: new Date().toISOString().split('T')[0],
        eta: new Date().toISOString().split('T')[0],
        poNumber: ''
      },
      productFilters: {
        country: '',
        vendor: '',
        type: '',
        search: ''
      },
      showProductList: true
    });
  };

  // 清除 Custom Declaration 数据
  const clearCustomDeclarationData = () => {
    setCustomDeclarationData({
      selectedProducts: [],
      poNumber: '',
      declarationDate: new Date().toISOString().split('T')[0],
      productFilters: {
        country: '',
        vendor: '',
        type: '',
        search: ''
      },
      showProductList: true
    })
  }

  const tabs = [
    { id: 'summary', name: t('inventorySummary'), icon: '📊' },
    { id: 'inbound', name: t('inbound'), icon: '📥' },
    { id: 'inbound-list', name: t('inbound') + ' ' + t('transaction'), icon: '📜' },
    { id: 'custom-declaration', name: t('customDeclaration'), icon: '📋' }, // 修改
    { id: 'outbound', name: t('outbound'), icon: '📤' },
    { id: 'outbound-list', name: t('outbound') + ' ' + t('transaction'), icon: '📜' },
    { id: 'adjustment', name: t('adjustment'), icon: '🔧' },
    { id: 'reports', name: t('reports'), icon: '📋' }
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
              {/* 显示数据状态指示器 */}
              {tab.id === 'inbound' && inboundData.bulkProducts.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                  {inboundData.bulkProducts.length}
                </span>
              )}
              {tab.id === 'custom-declaration' && customDeclarationData.selectedProducts.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                  {customDeclarationData.selectedProducts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && <InventorySummary key={language} />}
        {activeTab === 'inbound' && (
          <InboundTransactions 
            key={language}
            inboundData={inboundData}
            setInboundData={setInboundData}
            clearInboundData={clearInboundData}
          />
        )}
        {activeTab === 'inbound-list' && <InboundTransactionList key={language} />}
        {activeTab === 'custom-declaration' && (
          <CustomDeclarationForm 
            key={language}
            customDeclarationData={customDeclarationData}
            setCustomDeclarationData={setCustomDeclarationData}
            clearCustomDeclarationData={clearCustomDeclarationData}
          />
        )}
        {activeTab === 'outbound' && (
          <Outbound
            key={language}
            outboundData={outboundData}
            setOutboundData={setOutboundData}
            clearOutboundData={clearOutboundData}
          />
        )}
        {activeTab === 'outbound-list' && <OutboundTransactionList key={language} />}
        {activeTab === 'adjustment' && <Adjustment key={language} />}
        {activeTab === 'reports' && <InventoryReports key={language} />}
      </div>
    </div>
  )
}

export default ExportInventory
