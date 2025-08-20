// src/components/inventory/reports/ArchivedShipmentsReport.jsx
import React, { useState, useEffect } from 'react';
import { inventoryService } from '../inventory service';
import ArchivedShipmentDetail from './ArchivedShipmentDetail';

const ArchivedShipmentsReport = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setLoading(true);
    const { data, error } = await inventoryService.getArchivedShipments();
    if (error) {
      console.error('Error fetching archived shipments:', error);
      alert('Failed to load archived shipments.');
    } else {
      setArchives(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading archived shipments...</span>
      </div>
    );
  }

  if (selectedArchiveId) {
    return (
      <ArchivedShipmentDetail
        archiveId={selectedArchiveId}
        onBack={() => setSelectedArchiveId(null)}
      />
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Archived Shipments</h2>
          <p className="text-sm text-gray-600 mt-1">
            A record of all processed outbound shipments.
          </p>
        </div>
        <button
          onClick={fetchArchives}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Refresh
        </button>
      </div>

      {archives.length === 0 ? (
        <div className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Archived Shipments Found</h3>
          <p className="text-gray-500">Process an outbound shipment to see its archive here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archived At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archives.map((archive) => (
                <tr key={archive.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    {archive.shipment_info?.poNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {archive.shipment_info?.shipment || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(archive.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedArchiveId(archive.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArchivedShipmentsReport;
