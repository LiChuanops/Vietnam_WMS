// src/components/inventory/InventoryReports.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase/client';
import CustomDeclarationDetail from './reports/CustomDeclarationDetail';
import ArchivedShipmentsReport from './reports/ArchivedShipmentsReport';
import ArchivedShipmentDetail from './reports/ArchivedShipmentDetail';
import MonthlyStockReport from './reports/MonthlyStockReport';

const InventoryReports = () => {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const [customDeclarations, setCustomDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeReport, setActiveReport] = useState('monthlyStock'); // 'monthlyStock', 'declarations', or 'archives'

  useEffect(() => {
    if (activeReport === 'declarations') {
      fetchCustomDeclarations();
    }
  }, [activeReport]);

  const fetchCustomDeclarations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_declarations')
        .select(`*, profiles:created_by (name)`)
        .order('declaration_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomDeclarations(data || []);
    } catch (error) {
      console.error('Error fetching custom declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDeclaration = (declaration) => {
    setSelectedDeclaration(declaration);
    setShowDetail(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  if (showDetail && selectedDeclaration) {
    return (
      <CustomDeclarationDetail
        declaration={selectedDeclaration}
        onBack={() => {
          setShowDetail(false);
          setSelectedDeclaration(null);
        }}
      />
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

  const renderDeclarations = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading reports...</span>
        </div>
      );
    }

    return (
      <>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Custom Declaration Forms</h2>
            <p className="text-sm text-gray-600 mt-1">Click on any declaration to view details</p>
          </div>
          <button onClick={fetchCustomDeclarations} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Refresh
          </button>
        </div>
        {customDeclarations.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Declarations Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customDeclarations.map((declaration) => (
                  <tr key={declaration.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDeclaration(declaration)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{declaration.po_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(declaration.declaration_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{declaration.profiles?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={(e) => { e.stopPropagation(); handleViewDeclaration(declaration); }} className="text-indigo-600 hover:text-indigo-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">View reports and archived records.</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveReport('monthlyStock')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeReport === 'monthlyStock' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Monthly Stock Report
          </button>
          <button
            onClick={() => setActiveReport('declarations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeReport === 'declarations' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Custom Declarations
          </button>
          <button
            onClick={() => setActiveReport('archives')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeReport === 'archives' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Archived Shipments
          </button>
        </nav>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {activeReport === 'monthlyStock' && <MonthlyStockReport />}
        {activeReport === 'declarations' && renderDeclarations()}
        {activeReport === 'archives' && <ArchivedShipmentsReport onViewDetail={setSelectedArchiveId} />}
      </div>
    </div>
  );
};

export default InventoryReports;
