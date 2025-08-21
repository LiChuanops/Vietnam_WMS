// src/components/inventory/reports/MonthlySummaryReport.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';

const MonthlySummaryReport = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('export_inventory_summary')
          .select('*')
          .order('product_name', { ascending: true });

        if (error) {
          throw error;
        }
        setSummaryData(data || []);
      } catch (err) {
        console.error("Error fetching summary data:", err);
        setError("Failed to fetch summary data. Make sure the database view 'export_inventory_summary' exists and you have permissions to read it.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading Monthly Summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-medium text-red-700 mb-2">{error}</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Monthly Inventory Summary</h2>
        <p className="text-sm text-gray-600 mt-1">
          This report provides a summary of stock levels and monthly transactions for each product.
        </p>
      </div>
      <div className="overflow-x-auto">
        {summaryData.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No summary data found.</h3>
            <p className="text-sm text-gray-600">There are currently no products with inventory activity to report.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryData.map((product) => (
                <React.Fragment key={product.product_id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.uom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">{product.current_stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setExpandedProductId(expandedProductId === product.product_id ? null : product.product_id)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        {expandedProductId === product.product_id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedProductId === product.product_id && (
                    <tr>
                      <td colSpan="6" className="p-0">
                        <div className="p-4 bg-gray-100">
                          <h4 className="font-semibold text-md mb-2 text-gray-800">Monthly Transaction Details</h4>
                          {product.monthly_transactions && Object.keys(product.monthly_transactions).length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-300 bg-white rounded-md shadow-sm">
                              <thead className="bg-gray-200">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Month</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Inbound</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Outbound</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Adjustment</th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Ending Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {Object.entries(product.monthly_transactions).sort().map(([month, txn]) => (
                                  <tr key={month}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">{month}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">{txn.inbound || 0}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right">{txn.outbound || 0}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 text-right">{txn.adjustment || 0}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-right">{txn.ending_balance || 0}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm text-gray-500">No monthly transaction data available for this product.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MonthlySummaryReport;
