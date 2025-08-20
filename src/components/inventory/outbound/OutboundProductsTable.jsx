// src/components/inventory/outbound/OutboundProductsTable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

// Using a custom hook for debouncing from within the component
const useDebounce = (callback, delay) => {
    const timeoutId = useRef(null);
    useEffect(() => {
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, []);
    return (...args) => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

const QuantityInput = ({ product, onQuantityChange }) => {
  const [quantity, setQuantity] = useState(product.quantity);

  const debouncedChangeHandler = useDebounce(onQuantityChange, 1500);

  useEffect(() => {
    // This effect ensures the input updates if the parent state changes for any reason
    setQuantity(product.quantity);
  }, [product.quantity]);

  const handleChange = (e) => {
    const newQuantity = e.target.value;
    setQuantity(newQuantity);
    debouncedChangeHandler(product.uniqueId, newQuantity);
  };

  return (
    <input
      type="number"
      value={quantity}
      onChange={handleChange}
      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      min="0"
    />
  );
};

const OutboundProductsTable = ({ selectedProducts, setSelectedProducts, onDeleteProduct, addLogEntry, transactionDate, setTransactionDate }) => {
  const { t } = useLanguage();

  const handleQuantityChange = (uniqueId, newQuantityStr) => {
    const product = selectedProducts.find(p => p.uniqueId === uniqueId);
    if (!product) return;

    const oldQuantity = parseFloat(product.quantity) || 0;
    const newQuantity = parseFloat(newQuantityStr) || 0;

    if (oldQuantity !== newQuantity) {
      const diff = newQuantity - oldQuantity;
      const packingSize = product.packing_size ? ` ${product.packing_size}` : '';
      let logMessage = '';

      if (diff > 0) {
        logMessage = `Export extra ${diff} ctns ${product.product_name}${packingSize}`;
      } else {
        logMessage = `Export short ${Math.abs(diff)} ctns ${product.product_name}${packingSize}`;
      }
      addLogEntry(logMessage.trim());
    }

    setSelectedProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.uniqueId === uniqueId) {
          const uom = parseFloat(p.uom) || 0;
          const total_weight = newQuantity * uom;
          return { ...p, quantity: newQuantityStr, total_weight };
        }
        return p;
      })
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
            <h3 className="text-lg font-medium text-gray-900">Products for Outbound Shipment</h3>
            <p className="text-sm text-gray-600 mt-1">Verify the quantities for the products to be shipped.</p>
        </div>
        <div className="flex items-center space-x-2">
            <label htmlFor="transactionDate" className="text-sm font-medium text-gray-700">Date:</label>
            <input
                type="date"
                id="transactionDate"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing Size</th>
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
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{product.packing_size || '-'}</td>
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
