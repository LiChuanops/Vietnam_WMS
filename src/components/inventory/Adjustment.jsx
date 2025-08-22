import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { inventoryService } from './inventory service.js';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const Adjustment = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [adjustments, setAdjustments] = useState({});
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const { data, error } = await inventoryService.getCurrentInventory();
        if (error) throw error;
        setInventory(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleAdjustmentChange = useCallback((productId, field, value) => {
    setAdjustments(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  }, []);

  const adjustedItems = useMemo(() => {
    return inventory
      .map(item => {
        const adjustment = adjustments[item.product_id];
        if (!adjustment || !adjustment.newStock) return null;

        const newStock = parseFloat(adjustment.newStock);
        const currentStock = parseFloat(item.current_stock);

        if (isNaN(newStock) || newStock === currentStock) return null;

        return {
          ...item,
          newStock: newStock,
          reason: adjustment.reason || t('monthlyStockAdjustment'),
          change: newStock - currentStock,
        };
      })
      .filter(Boolean);
  }, [inventory, adjustments, t]);

  const handleSubmitClick = () => {
    if (adjustedItems.length > 0) {
      setShowConfirmation(true);
    } else {
      alert(t('noChangesToSubmit'));
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);

    const transactions = adjustedItems.map(item => ({
      product_id: item.product_id,
      transaction_type: 'ADJUSTMENT',
      quantity: item.change,
      transaction_date: adjustmentDate,
      notes: item.reason,
      created_by: user.id,
    }));

    try {
      const { error } = await inventoryService.addTransaction(transactions);
      if (error) throw error;

      alert(t('adjustmentSuccess'));
      setAdjustments({});
      // Refetch inventory to show updated stock
      const { data, error: fetchError } = await inventoryService.getCurrentInventory();
      if (fetchError) throw fetchError;
      setInventory(data || []);

    } catch (err) {
      setError(err.message);
      alert(`${t('adjustmentFailed')}: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  if (loading) return <div className="p-6 text-center">{t('loading')}...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{t('error')}: {error}</div>;

  return (
    <div className="p-4">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h2 className="text-xl font-bold mb-4">{t('stockAdjustment')}</h2>
        <div className="mb-4">
          <label htmlFor="adjustmentDate" className="block text-sm font-medium text-gray-700 mb-1">
            {t('adjustmentDate')}
          </label>
          <input
            type="date"
            id="adjustmentDate"
            value={adjustmentDate}
            onChange={e => setAdjustmentDate(e.target.value)}
            min={firstDayOfMonth}
            max={lastDayOfMonth}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('itemCode')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packingSize')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('country')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vendor')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('currentStock')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adjustmentStock')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('reason')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map(item => (
              <tr key={item.product_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.product_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.packing_size}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.country}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.vendor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.current_stock}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={adjustments[item.product_id]?.newStock ?? ''}
                    onChange={e => handleAdjustmentChange(item.product_id, 'newStock', e.target.value)}
                    placeholder={t('newStock')}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={adjustments[item.product_id]?.reason ?? ''}
                    onChange={e => handleAdjustmentChange(item.product_id, 'reason', e.target.value)}
                    placeholder={t('monthlyStockAdjustment')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmitClick}
          disabled={isSubmitting || adjustedItems.length === 0}
          className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isSubmitting ? `${t('submitting')}...` : t('submit')}
        </button>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{t('confirmAdjustment')}</h3>
            <div className="mt-2 py-3">
              <p className="text-sm text-gray-500 mb-4">{t('confirmAdjustmentMessage')}</p>
              <div className="overflow-y-auto max-h-60">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('productName')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('currentStock')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('newStock')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('change')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">{t('reason')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adjustedItems.map(item => (
                      <tr key={item.product_id}>
                        <td className="px-4 py-2 text-sm">{item.product_name}</td>
                        <td className="px-4 py-2 text-sm">{item.current_stock}</td>
                        <td className="px-4 py-2 text-sm font-bold text-blue-600">{item.newStock}</td>
                        <td className={`px-4 py-2 text-sm font-bold ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.change > 0 ? `+${item.change}` : item.change}
                        </td>
                         <td className="px-4 py-2 text-sm">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adjustment;
