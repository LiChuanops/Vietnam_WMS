// src/components/inventory/outbound/ActivityLog.jsx
import React from 'react';

const ActivityLog = ({ logs }) => {
  if (logs.length === 0) {
    return null; // Don't render anything if there are no logs
  }

  return (
    <div className="mt-6 bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
        <p className="text-sm text-gray-600 mt-1">A record of changes made to this shipment.</p>
      </div>
      <div className="max-h-48 overflow-y-auto p-4">
        <ul className="space-y-2">
          {logs.map((log, index) => (
            <li key={index} className="text-sm text-gray-700 border-b border-gray-100 pb-1">
              {log}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityLog;
