// src/components/inventory/reports/ArchivedShipmentDetail.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../../context/LanguageContext';
import { inventoryService } from '../inventory service';

const ArchivedShipmentDetail = ({ archiveId, onBack }) => {
  const { t } = useLanguage();
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchiveDetail();
  }, [archiveId]);

  const fetchArchiveDetail = async () => {
    setLoading(true);
    const { data, error } = await inventoryService.getArchivedShipmentDetail(archiveId);
    if (error) {
      console.error('Error fetching archive detail:', error);
      alert(t('failedToLoadArchiveDetails'));
    } else {
      setArchive(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loadingArchiveDetails')}</span>
      </div>
    );
  }

  if (!archive) {
    return <p>{t('couldNotLoadArchive')}</p>;
  }

  const { shipment_info, items, activity_log, created_at } = archive;

  const handleDownload = () => {
    // --- Data Preparation ---
    const shipmentData = [
      ["Shipment Name:", shipment_info.shipment],
      ["PO Number:", shipment_info.poNumber],
      ["Container:", shipment_info.containerNumber],
      ["Seal No:", shipment_info.sealNo],
      ["ETD:", formatDate(shipment_info.etd)],
      ["ETA:", formatDate(shipment_info.eta)],
      ["Archived At:", formatDate(created_at)],
    ];
    
    const productsHeader = ["S/N", "Code", "Customer Code", "Account Code", "Product Name", "Packing", "Batch No", "Quantity", "UOM", "Total Weight"];
    const productsData = items.map((item, index) => [
      index + 1, 
      item.product_id, 
      item.customer_code, 
      item.account_code, 
      item.product_name,
      item.packing_size, 
      item.batch_number, 
      item.quantity, 
      item.uom,
      item.total_weight ? parseFloat(item.total_weight.toFixed(2)) : 0
    ]);
    
    const remarkData = [["Remark"], ...activity_log.map(log => [log])];
    const allData = [...shipmentData, [], productsHeader, ...productsData, [], ...remarkData];

    // --- Create Workbook and Worksheet ---
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // --- Calculate positions ---
    const productTableStartRow = shipmentData.length + 1; // +1 for empty row
    const productTableEndRow = productTableStartRow + productsData.length;
    const productTableEndCol = productsHeader.length - 1;

    // --- Apply borders to product table ---
    const borderStyle = {
      style: "thin",
      color: { rgb: "000000" }
    };

    const cellBorder = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle
    };

    // Apply borders to header and data rows
    for (let row = productTableStartRow; row <= productTableEndRow; row++) {
      for (let col = 0; col <= productTableEndCol; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) {
          ws[cellAddress] = { v: "" };
        }
        if (!ws[cellAddress].s) {
          ws[cellAddress].s = {};
        }
        ws[cellAddress].s.border = cellBorder;
      }
    }

    // --- Set column widths ---
    const colWidths = [];
    for (let col = 0; col <= productTableEndCol; col++) {
      let maxWidth = 10;
      
      // Check header width
      if (productsHeader[col]) {
        maxWidth = Math.max(maxWidth, productsHeader[col].toString().length);
      }
      
      // Check data widths
      for (let row = 0; row < productsData.length; row++) {
        if (productsData[row][col]) {
          maxWidth = Math.max(maxWidth, productsData[row][col].toString().length);
        }
      }
      
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    
    ws['!cols'] = colWidths;

    // --- Add worksheet to workbook and save ---
    XLSX.utils.book_append_sheet(wb, ws, "Shipment Details");
    const fileName = `Shipment_${shipment_info.poNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToReports')}
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {t('archivedShipment')}
            </h1>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {t('downloadToExcel')}
        </button>
      </div>

      {/* Shipment Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('shipmentInformation')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><strong className="block text-sm text-gray-500">{t('shipmentName')}:</strong> {shipment_info.shipment}</div>
          <div><strong className="block text-sm text-gray-500">{t('poNumber')}:</strong> {shipment_info.poNumber}</div>
          <div><strong className="block text-sm text-gray-500">{t('containerNumber')}:</strong> {shipment_info.containerNumber}</div>
          <div><strong className="block text-sm text-gray-500">{t('sealNo')}:</strong> {shipment_info.sealNo}</div>
          <div><strong className="block text-sm text-gray-500">{t('etd')}:</strong> {formatDate(shipment_info.etd)}</div>
          <div><strong className="block text-sm text-gray-500">{t('eta')}:</strong> {formatDate(shipment_info.eta)}</div>
        </div>
      </div>

      {/* Product Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">{t('shippedProducts')} ({items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('serialNumber')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('code')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('customerCode')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('accountCode')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packing')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('batchNo')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('uom')}</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('totalWeight')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_id}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.customer_code || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.account_code || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{item.product_name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.packing_size || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.batch_number}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.uom || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.total_weight ? item.total_weight.toFixed(2) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium">{t('remark')}</h3></div>
        <div className="max-h-64 overflow-y-auto p-4">
          <ul className="space-y-1">
            {activity_log.map((log, index) => (
              <li key={index} className="text-sm text-gray-700 font-mono">{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArchivedShipmentDetail;
