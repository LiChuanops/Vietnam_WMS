// src/components/inventory/outbound/WeightSummary.jsx
import React from 'react';

const WeightSummary = ({ summary }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-800 mb-3">Weight Summary</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-green-100 rounded-lg">
          <span className="text-xl font-bold text-green-900">{summary.netWeight.toFixed(2)}</span>
          <span className="text-xs text-gray-600 block mt-1">Net Weight (kg)</span>
        </div>
        <div className="text-center p-3 bg-orange-100 rounded-lg">
          <span className="text-xl font-bold text-orange-900">{summary.cartonWeight.toFixed(2)}</span>
          <span className="text-xs text-gray-600 block mt-1">Carton Weight (kg)</span>
        </div>
        <div className="text-center p-3 bg-purple-100 rounded-lg">
          <span className="text-xl font-bold text-purple-900">{summary.grossWeight.toFixed(2)}</span>
          <span className="text-xs text-gray-600 block mt-1">Gross Weight (kg)</span>
        </div>
      </div>
    </div>
  );
};

export default WeightSummary;
