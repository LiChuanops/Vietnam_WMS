import React from 'react'

const ShipmentInfoForm = ({ shipmentInfo, setShipmentInfo }) => {
  const handleInputChange = (field, value) => {
    setShipmentInfo(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border">
      <h4 className="text-sm font-medium text-gray-700 mb-3">Shipment Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Shipment</label>
          <input
            type="text"
            value={shipmentInfo.shipment}
            onChange={(e) => handleInputChange('shipment', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Shipment name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Container Number</label>
          <input
            type="text"
            value={shipmentInfo.containerNumber}
            onChange={(e) => handleInputChange('containerNumber', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Container number"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Seal No</label>
          <input
            type="text"
            value={shipmentInfo.sealNo}
            onChange={(e) => handleInputChange('sealNo', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Seal number"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ETD</label>
          <input
            type="date"
            value={shipmentInfo.etd}
            onChange={(e) => handleInputChange('etd', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ETA</label>
          <input
            type="date"
            value={shipmentInfo.eta}
            onChange={(e) => handleInputChange('eta', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">PO Number</label>
          <input
            type="text"
            value={shipmentInfo.poNumber}
            onChange={(e) => handleInputChange('poNumber', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="PO number"
          />
        </div>
      </div>
    </div>
  )
}

export default ShipmentInfoForm
