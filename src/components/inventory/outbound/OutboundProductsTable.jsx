// src/components/inventory/outbound/OutboundProductsTable.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useDebounce } from '../../../utils/useDebounce';

// Inner component to handle debounced input
const QuantityInput = ({ product, onQuantityChange }) => {
  const [quantity, setQuantity] = useState(product.quantity);
  const debouncedQuantity = useDebounce(quantity, 1500); // 1.5 second delay as requested

  useEffect(() => {
    // This effect runs only when the debounced value changes
    if (debouncedQuantity !== product.quantity) {
      onQuantityChange(product.uniqueId, debouncedQuantity);
    }
  }, [debouncedQuantity]);

  return (
    <input
      type="number"
      value={quantity}
      onChange={(e) => setQuantity(e.target.value)}
      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      min="0"
    />
  );
};


const OutboundProductsTable = ({ selectedProducts, setSelectedProducts, onDeleteProduct, addLogEntry }) => {
  const { t } = useLanguage();

  const handleQuantityChange = (uniqueId, newQuantity) => {
    const product = selectedProducts.find(p => p.uniqueId === uniqueId);
    const oldQuantity = product ? product.quantity : '0';

    if (product && oldQuantity !== newQuantity) {
      addLogEntry(`Changed quantity for ${product.product_name} from ${oldQuantity} to ${newQuantity || '0'}.`);
    }

    setSelectedProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.uniqueId === uniqueId) {
          const quant = parseFloat(newQuantity) || 0;
          const uom = parseFloat(p.uom) || 0;
          const total_weight = quant * uom;
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
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedProducts.map(product => (
              <tr key={product.uniqueId}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.product_id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.customer_code || '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <QuantityInput product={product} onQuantityChange={handleQuantityChange} />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{product.uom}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {product.total_weight ? product.total_weight.toFixed(2) : '0.00'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.uniqueId)}
                    className="text-red-600 hover:text-red-800 font-medium"
                    aria-label={`Delete ${product.product_name}`}
                  >
                    Delete
                  </button>
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
