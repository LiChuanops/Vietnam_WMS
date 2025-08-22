import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils';

const OutboundTransactionList = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [editingId, setEditingId] = useState(null);
  // const [editingQuantity, setEditingQuantity] = useState('');
  // const [isSaving, setIsSaving] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth}`;

    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          products (
            product_name,
            packing_size
          )
        `)
        .eq('transaction_type', 'OUT')
        .gte('transaction_date', firstDay)
        .lte('transaction_date', lastDay)
        .order('transaction_date', { ascending: false });

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching outbound transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // const handleEditClick = (tx) => {
  //   setEditingId(tx.id);
  //   setEditingQuantity(tx.quantity);
  // };

  // const handleCancelClick = () => {
  //   setEditingId(null);
  //   setEditingQuantity('');
  // };

  // const handleSaveClick = async (transactionId) => {
  //   setIsSaving(true);
  //   try {
  //     const { error } = await supabase
  //       .from('inventory_transactions')
  //       .update({ quantity: parseFloat(editingQuantity) })
  //       .eq('id', transactionId);

  //     if (error) {
  //       throw error;
  //     }

  //     setEditingId(null);
  //     setEditingQuantity('');
  //     await fetchTransactions(); // Re-fetch data to show the update
  //   } catch (err) {
  //     console.error("Error updating transaction:", err);
  //     alert('Failed to update transaction.');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loading')}...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-12">{t('unexpectedError')}: {error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {t('outbound')} {t('transaction')} ({t('month')})
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packing')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('batchNo')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('notes')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDateToDDMMYYYY(tx.transaction_date)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {tx.products?.product_name || t('noData')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{tx.products?.packing_size || '-'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{tx.batch_number}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className="text-red-600 font-medium">{tx.quantity.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{tx.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">{t('noData')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutboundTransactionList;
