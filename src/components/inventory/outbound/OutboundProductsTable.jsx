// src/components/inventory/outbound/OutboundProductsTable.jsx
import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const OutboundProductsTable = ({ selectedProducts, setSelectedProducts }) => {
  const { t } = useLanguage();

  const handleQuantityChange = (uniqueId, newQuantity) => {
    const numericQuantity = parseFloat(newQuantity);

    setSelectedProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.uniqueId === uniqueId) {
          // Find the product to check available stock
          const currentProduct = prevProducts.find(prod => prod.uniqueId === uniqueId);
          const availableStock = currentProduct ? currentProduct.available_stock : 0;

          // Prevent quantity from exceeding available stock
          if (numericQuantity > availableStock) {
            alert(`Quantity for ${p.product_name} cannot exceed available stock of ${availableStock}.`);
            return { ...p, quantity: availableStock.toString() };
          }

          return { ...p, quantity: newQuantity };
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No.</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing Size</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ship Quantity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedProducts.map(product => (
              <tr key={product.uniqueId}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.sn}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{product.batch_number}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{product.packing_size}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-blue-600">{product.available_stock}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={e => handleQuantityChange(product.uniqueId, e.target.value)}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    max={product.available_stock}
                    min="0"
                  />
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
