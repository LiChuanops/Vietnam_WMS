// src/components/inventory/outbound/OutboundProductsTable.jsx
import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const OutboundProductsTable = ({ selectedProducts, setSelectedProducts }) => {
  const { t } = useLanguage();

  const handleQuantityChange = (uniqueId, newQuantity) => {
    setSelectedProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.uniqueId === uniqueId) {
          const quantity = parseFloat(newQuantity) || 0;
          const uom = parseFloat(p.uom) || 0;
          const total_weight = quantity * uom;
          return { ...p, quantity: newQuantity, total_weight };
        }
        return p;
      })
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Products for Outbound Shipment</h3>
        <p className="text-sm text-gray-600 mt-1">Verify the quantities for the products to be shipped.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedProducts.map(product => (
              <tr key={product.uniqueId}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.product_id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.customer_code || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={e => handleQuantityChange(product.uniqueId, e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.uom}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {product.total_weight ? product.total_weight.toFixed(2) : '0.00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutboundProductsTable;
