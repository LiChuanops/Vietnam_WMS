// src/components/inventory/reports/MonthlyStockReport.jsx
import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { useLanguage } from '../../../context/LanguageContext';

const MonthlyStockReport = () => {
  const { t } = useLanguage();
  // Default to the current month in YYYY-MM format
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    if (!selectedMonth) {
      setError("Please select a month.");
      return;
    }
    setLoading(true);
    setError(null);
    setReportData([]);

    try {
      const { data, error } = await supabase.rpc('get_monthly_inventory', {
        report_month: `${selectedMonth}-01`
      });

      if (error) {
        throw error;
      }

      setReportData(data || []);
    } catch (err) {
      console.error("Error fetching monthly report:", err);
      setError("Failed to generate report. Please ensure the database function 'get_monthly_inventory' is set up correctly and you have the necessary permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Monthly Stock Movement Report</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select a month to view the opening stock, monthly movements, and closing stock for all products.
        </p>
      </div>

      <div className="px-6 flex items-center space-x-4">
        <label htmlFor="month-selector" className="font-medium text-gray-700">Select Month:</label>
        <input
          type="month"
          id="month-selector"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading Report Data...</span>
        </div>
      )}

      {error && (
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-700 mb-2">{error}</h3>
        </div>
      )}

      <div className="px-6 overflow-x-auto">
        {reportData.length > 0 && !loading && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Inbound</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Outbound</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.uom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{product.opening_stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">+{product.inbound_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{product.outbound_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">{product.adjustment_quantity > 0 ? '+' : ''}{product.adjustment_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">{product.closing_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {reportData.length === 0 && !loading && (
          <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data for the selected month.</h3>
            <p className="text-sm text-gray-600">Please select a month and click "Generate Report", or try a different month.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyStockReport;
