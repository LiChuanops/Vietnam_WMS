// src/components/inventory/reports/ArchivedShipmentDetail.jsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { inventoryService } from '../inventory service';

const ArchivedShipmentDetail = ({ archiveId, onBack }) => {
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
      alert('Failed to load archive details.');
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
        <span className="ml-3 text-gray-600">Loading archive details...</span>
      </div>
    );
  }

  if (!archive) {
    return <p>Could not load archive data.</p>;
  }

  const { shipment_info, items, activity_log, created_at } = archive;

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

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
      item.total_weight ? item.total_weight.toFixed(2) : '0.00'
    ]);

    const remarkData = [
        ["Remark"],
        ...activity_log.map(log => [log])
    ];

    const allData = [
        ...shipmentData,
        [], // Blank row
        productsHeader,
        ...productsData,
        [], // Blank row
        ...remarkData
    ];

    const ws = XLSX.utils.aoa_to_sheet(allData);

    // --- Styling ---

    // 1. Column Widths
    const maxCols = allData.reduce((max, row) => Math.max(max, row.length), 0);
    const colWidths = Array.from({ length: maxCols }, () => ({ wch: 10 }));

    allData.forEach(row => {
        row.forEach((cell, colIndex) => {
            const cellContent = cell ? String(cell) : '';
            if (colWidths[colIndex].wch < cellContent.length) {
                colWidths[colIndex].wch = cellContent.length + 2; // Add padding
            }
        });
    });
    ws['!cols'] = colWidths;

    // 2. Table Borders
    const borderStyle = { style: "thin", color: { auto: 1 } };
    const border = {
        top: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle
    };

    const productTableStartRow = shipmentData.length + 1; // After shipment data and a blank row
    const productTableEndRow = productTableStartRow + productsData.length;

    for (let R = productTableStartRow; R <= productTableEndRow; ++R) {
        for (let C = 0; C < productsHeader.length; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            if (!ws[cell_ref]) continue; // Skip empty cells
            if (!ws[cell_ref].s) ws[cell_ref].s = {}; // Create style object if it doesn't exist
            ws[cell_ref].s.border = border;
        }
    }

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
            Back to Reports
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Archived Shipment
            </h1>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download to Excel
        </button>
      </div>

      {/* Shipment Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><strong className="block text-sm text-gray-500">Shipment Name:</strong> {shipment_info.shipment}</div>
          <div><strong className="block text-sm text-gray-500">PO Number:</strong> {shipment_info.poNumber}</div>
          <div><strong className="block text-sm text-gray-500">Container:</strong> {shipment_info.containerNumber}</div>
          <div><strong className="block text-sm text-gray-500">Seal No:</strong> {shipment_info.sealNo}</div>
          <div><strong className="block text-sm text-gray-500">ETD:</strong> {formatDate(shipment_info.etd)}</div>
          <div><strong className="block text-sm text-gray-500">ETA:</strong> {formatDate(shipment_info.eta)}</div>
        </div>
      </div>

      {/* Product Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">Shipped Products ({items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S/N</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Weight</th>
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
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium">Remark</h3></div>
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
