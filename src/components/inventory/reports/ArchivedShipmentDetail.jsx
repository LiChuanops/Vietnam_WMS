// src/components/inventory/reports/ArchivedShipmentDetail.jsx
import React, { useState, useEffect } from 'react';
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
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
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

  const { shipment_info, items, activity_log, created_at, profiles } = archive;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-indigo-600 hover:underline mb-2">
            &larr; Back to Archived Shipments
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Archived Shipment: {shipment_info?.shipment}
          </h1>
          <p className="text-gray-600 mt-1">
            PO: {shipment_info?.poNumber} | Archived on {formatDate(created_at)} by {profiles?.name || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Shipment Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Shipment Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><strong className="block text-sm text-gray-500">Container:</strong> {shipment_info.containerNumber}</div>
          <div><strong className="block text-sm text-gray-500">Seal No:</strong> {shipment_info.sealNo}</div>
          <div><strong className="block text-sm text-gray-500">ETD:</strong> {formatDate(shipment_info.etd)}</div>
          <div><strong className="block text-sm text-gray-500">ETA:</strong> {formatDate(shipment_info.eta)}</div>
        </div>
      </div>

      {/* Product Items */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium">Shipped Products ({items.length})</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Product Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Batch No.</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase">Manual?</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-sm">{item.product_id}</td>
                  <td className="px-4 py-2 text-sm font-medium">{item.product_name}</td>
                  <td className="px-4 py-2 text-sm">{item.batch_number}</td>
                  <td className="px-4 py-2 text-sm">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm">{item.is_manual ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium">Activity Log</h3></div>
        <div className="max-h-64 overflow-y-auto p-4">
          <ul className="space-y-1">
            {activity_log.map((log, index) => (
              <li key={index} className="text-xs text-gray-600 font-mono">{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArchivedShipmentDetail;
