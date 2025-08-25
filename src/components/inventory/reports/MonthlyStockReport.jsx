// src/components/inventory/reports/MonthlyStockReport.jsx
import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../supabase/client';
import { useLanguage } from '../../../context/LanguageContext';

const MonthlyStockReport = () => {
  const { t } = useLanguage();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('detail');

  const handleGenerateReport = useCallback(async () => {
    if (!selectedMonth) {
      setError("Please select a month.");
      return;
    }
    setLoading(true);
    setError(null);
    setReportData([]);

    const rpc_function = viewMode === 'detail'
      ? 'get_monthly_inventory'
      : 'get_monthly_inventory_by_weight';

    try {
      const { data, error } = await supabase.rpc(rpc_function, {
        report_month: `${selectedMonth}-01`
      });

      if (error) throw error;
      setReportData(data || []);
    } catch (err) {
      console.error(`Error fetching monthly report (${viewMode}):`, err);
      setError(`Failed to generate report. Please ensure the database function '${rpc_function}' is set up correctly and you have the necessary permissions.`);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, viewMode]);

  useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);

  const handleDownloadExcel = () => {
    if (reportData.length === 0) {
      alert("No data available to download.");
      return;
    }

    let dataForSheet;
    let fileName;
    const monthStr = selectedMonth.replace('-', '/');

    if (viewMode === 'detail') {
      fileName = `Report for details ${monthStr}.xlsx`;
      dataForSheet = reportData.map(p => ({
        [t('systemCode')]: p.product_id,
        [t('productName')]: p.product_name,
        [t('packingSize')]: p.packing_size,
        [t('openingStock')]: p.opening_stock,
        [t('inbound')]: p.inbound_quantity,
        [t('outbound')]: p.outbound_quantity,
        [t('convert')]: p.convert_quantity,
        [t('adjustment')]: p.adjustment_quantity,
        [t('closingStock')]: p.closing_stock
      }));
    } else {
      fileName = `Report for Weight ${monthStr}.xlsx`;
      dataForSheet = reportData.map(p => ({
        [t('accountCode')]: p.account_code,
        [t('uom')]: p.uom,
        [t('openingStockKg')]: p.opening_stock_weight,
        [t('inboundKg')]: p.inbound_weight,
        [t('outboundKg')]: p.outbound_weight,
        [t('convertKg')]: p.convert_weight,
        [t('adjustmentKg')]: p.adjustment_weight,
        [t('closingStockKg')]: p.closing_stock_weight
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{t('monthlyStockReport')}</h2>
        <p className="text-sm text-gray-600 mt-1">{t('monthlyStockReportDesc')}</p>
      </div>

      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label htmlFor="month-selector" className="font-medium text-gray-700">{t('selectMonth')}</label>
          <input
            type="month"
            id="month-selector"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('detail')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'detail' ? 'bg-white text-gray-900 shadow' : 'bg-transparent text-gray-600 hover:bg-white/50'}`}
            >
              {t('viewDetails')}
            </button>
            <button
              onClick={() => setViewMode('by_weight')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'by_weight' ? 'bg-white text-gray-900 shadow' : 'bg-transparent text-gray-600 hover:bg-white/50'}`}
            >
              {t('viewByWeight')}
            </button>
          </div>
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 bg-dark-cyan text-white rounded-md hover:bg-dark-cyan/90 disabled:bg-gray-400"
            disabled={reportData.length === 0 || loading}
          >
            {t('downloadExcel')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">{t('loading')}</span>
        </div>
      )}

      {error && (
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-700 mb-2">{error}</h3>
        </div>
      )}

      <div className="px-6 overflow-x-auto">
        {viewMode === 'detail' && reportData.length > 0 && !loading && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('systemCode')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packingSize')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('openingStock')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inbound')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('outbound')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('convert')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adjustment')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('closingStock')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{product.product_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.packing_size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{product.opening_stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">+{product.inbound_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{product.outbound_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right">{product.convert_quantity > 0 ? '+' : ''}{product.convert_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">{product.adjustment_quantity > 0 ? '+' : ''}{product.adjustment_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">{product.closing_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {viewMode === 'by_weight' && reportData.length > 0 && !loading && (
           <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('accountCode')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('uom')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('openingStockKg')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('inboundKg')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('outboundKg')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('convertKg')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adjustmentKg')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('closingStockKg')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((item) => (
                <tr key={item.account_code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{item.account_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.uom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{item.opening_stock_weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">+{item.inbound_weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{item.outbound_weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 text-right">{item.convert_weight > 0 ? '+' : ''}{item.convert_weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">{item.adjustment_weight > 0 ? '+' : ''}{item.adjustment_weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold text-right">{item.closing_stock_weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {reportData.length === 0 && !loading && (
          <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noDataForMonth')}</h3>
            <p className="text-sm text-gray-600">{t('tryDifferentMonth')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyStockReport;
