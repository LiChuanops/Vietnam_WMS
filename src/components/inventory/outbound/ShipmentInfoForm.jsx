// src/components/inventory/outbound/ShipmentInfoForm.jsx
import React from 'react'
import { useLanguage } from '../../../context/LanguageContext'

const ShipmentInfoForm = ({ shipmentInfo, setShipmentInfo }) => {
  const { t } = useLanguage()

  const handleInputChange = (field, value) => {
    setShipmentInfo(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{t('shipmentInformation')}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('shipment')}</label>
          <input
            type="text"
            value={shipmentInfo.shipment}
            onChange={(e) => handleInputChange('shipment', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={t('shipmentName')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('containerNumber')}</label>
          <input
            type="text"
            value={shipmentInfo.containerNumber}
            onChange={(e) => handleInputChange('containerNumber', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={t('containerNumberPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('sealNo')}</label>
          <input
            type="text"
            value={shipmentInfo.sealNo}
            onChange={(e) => handleInputChange('sealNo', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={t('sealNumber')}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('etd')}</label>
          <input
            type="date"
            value={shipmentInfo.etd}
            onChange={(e) => handleInputChange('etd', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('eta')}</label>
          <input
            type="date"
            value={shipmentInfo.eta}
            onChange={(e) => handleInputChange('eta', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('poNumber')}</label>
          <input
            type="text"
            value={shipmentInfo.poNumber}
            onChange={(e) => handleInputChange('poNumber', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={t('poNumber')}
          />
        </div>
      </div>
    </div>
  )
}

export default ShipmentInfoForm
