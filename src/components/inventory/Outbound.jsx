// src/components/inventory/Outbound.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase/client';
import { inventoryService } from './inventory service';
import ShipmentInfoForm from './outbound/ShipmentInfoForm';
import OutboundProductsTable from './outbound/OutboundProductsTable';
import WeightSummary from './outbound/WeightSummary';
import ActivityLog from './outbound/ActivityLog';

const Outbound = ({ outboundData, setOutboundData, clearOutboundData }) => {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { shipmentInfo, selectedProducts } = outboundData;
  const [customDeclarations, setCustomDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    netWeight: 0,
    cartonWeight: 0,
    grossWeight: 0,
  });

  useEffect(() => {
    if (!selectedDeclaration) {
      fetchCustomDeclarations();
    } else {
      setActivityLog([]);
    }
  }, [selectedDeclaration]);

  useEffect(() => {
    const totalQuantity = selectedProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
    const netWeight = selectedProducts.reduce((sum, p) => sum + (p.total_weight || 0), 0);
    const cartonWeight = totalQuantity * 0.65;
    const grossWeight = netWeight + cartonWeight;
    setSummary({ totalQuantity, netWeight, cartonWeight, grossWeight });
  }, [selectedProducts]);

  const addLogEntry = (message) => {
    setActivityLog(prevLog => [message, ...prevLog]);
  };

  const fetchCustomDeclarations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_declarations')
        .select(`*, profiles:created_by (name)`)
        .eq('status', 'pending')
        .order('declaration_date', { ascending: false });

      if (error) throw error;
      setCustomDeclarations(data || []);
    } catch (error) {
      console.error('Error fetching custom declarations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeclaration = async (declaration) => {
    setLoadingProducts(true);
    setSelectedDeclaration(declaration);
    addLogEntry(`Selected Custom Declaration with PO: ${declaration.po_number}.`);

    try {
      const { data: items, error: itemsError } = await supabase
        .from('custom_declaration_items')
        .select('*')
        .eq('declaration_id', declaration.id)
        .order('serial_number');

      if (itemsError) throw itemsError;

      const newSelectedProducts = items.map(item => ({
        uniqueId: item.id,
        sn: item.serial_number,
        product_id: item.product_id,
        customer_code: item.customer_code,
        account_code: item.account_code,
        product_name: item.product_name,
        packing_size: item.packing_size,
        batch_number: item.batch_number,
        quantity: item.quantity.toString(),
        uom: item.uom,
        total_weight: item.total_weight,
        is_manual: item.is_manual || false,
      }));

      setOutboundData(prev => ({
        ...prev,
        shipmentInfo: {
          ...prev.shipmentInfo,
          poNumber: declaration.po_number,
          declarationDate: declaration.declaration_date,
        },
        selectedProducts: newSelectedProducts,
      }));

    } catch (error) {
      console.error('Error loading declaration products:', error);
      addLogEntry(`Error: Failed to load products for PO: ${declaration.po_number}.`);
      alert('Failed to load products for the selected declaration.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['shipment', 'containerNumber', 'sealNo', 'etd', 'eta', 'poNumber'];
    for (const field of requiredFields) {
      if (!shipmentInfo[field] || String(shipmentInfo[field]).trim() === '') {
        alert(`Please ensure all shipment information fields are filled. Missing or empty: ${field}`);
        return;
      }
    }
    if (shipmentInfo.etd === shipmentInfo.eta) {
      alert('ETD and ETA dates cannot be the same. Please check the shipment dates.');
      return;
    }
    if (selectedProducts.some(p => p.quantity === '' || parseFloat(p.quantity) < 0)) {
      alert('Please enter a valid, non-negative quantity for all products.');
      return;
    }

    setIsSubmitting(true);
    addLogEntry('Submission process started...');

    const archiveData = {
      shipmentInfo,
      activityLog,
      selectedProducts,
      userId: userProfile?.id,
      declarationId: selectedDeclaration.id,
    };

    const { data: archiveResult, error: archiveError } = await inventoryService.archiveShipment(archiveData);

    if (archiveError) {
      alert('Error archiving shipment: ' + archiveError.message);
      addLogEntry(`Error: Failed to archive shipment. ${archiveError.message}`);
      setIsSubmitting(false);
      return;
    }

    addLogEntry(`Shipment successfully archived with ID: ${archiveResult.id}.`);

    const transactions = selectedProducts
      .filter(p => !p.is_manual && parseFloat(p.quantity) > 0)
      .map(p => ({
        product_id: p.product_id,
        transaction_type: 'OUT',
        quantity: parseFloat(p.quantity),
        transaction_date: transactionDate, // Use selected date
        reference_number: shipmentInfo.poNumber,
        notes: `Shipment: ${shipmentInfo.shipment}, Container: ${shipmentInfo.containerNumber || 'N/A'}, Seal: ${shipmentInfo.sealNo || 'N/A'}`,
        created_by: userProfile?.id,
    }));

    if (transactions.length > 0) {
      addLogEntry(`Processing inventory deduction for ${transactions.length} items...`);
      const { error: transactionError } = await inventoryService.addTransaction(transactions);

      if (transactionError) {
        alert('Shipment was archived, but failed to create inventory transactions: ' + transactionError.message);
        addLogEntry(`Error: Failed to deduct inventory. ${transactionError.message}`);
        setIsSubmitting(false);
        return;
      } else {
        addLogEntry('Inventory deduction successful.');
      }
    } else {
      addLogEntry('No inventory items to deduct (all items were manual or zero quantity).');
    }

    const { error: updateError } = await supabase
      .from('custom_declarations')
      .update({ status: 'completed' })
      .eq('id', selectedDeclaration.id);

    if (updateError) {
      addLogEntry(`Warning: Failed to update declaration status to completed. ${updateError.message}`);
      alert('Warning: Shipment was processed, but failed to update the declaration status. Please do it manually.');
    } else {
      addLogEntry(`Declaration PO ${selectedDeclaration.po_number} marked as completed.`);
    }

    alert('Outbound shipment has been successfully processed and archived!');
    clearOutboundData();
    setSelectedDeclaration(null);
    setActivityLog([]);

    setIsSubmitting(false);
  };

  const handleDeleteProduct = (uniqueId) => {
    const product = selectedProducts.find(p => p.uniqueId === uniqueId);
    if (product) {
      addLogEntry(`Deleted product: ${product.product_name} (Code: ${product.product_id}).`);
    }
    setOutboundData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p.uniqueId !== uniqueId)
    }));
  };

  const setSelectedProducts = (setter) => {
    setOutboundData(prev => ({
      ...prev,
      selectedProducts: typeof setter === 'function' ? setter(prev.selectedProducts) : setter
    }))
  }

  const setShipmentInfo = (newInfo) => {
    setOutboundData(prev => ({
      ...prev,
      shipmentInfo: typeof newInfo === 'function' ? newInfo(prev.shipmentInfo) : newInfo
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {!selectedDeclaration ? (
        loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading available declarations...</span>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Select a Custom Declaration for Outbound</h2>
              <p className="text-sm text-gray-600 mt-1">Select a declaration to populate the shipment information and product list.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Declaration Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customDeclarations.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{d.po_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(d.declaration_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.profiles?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSelectDeclaration(d)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Selected Declaration PO: <span className="font-bold text-indigo-600">{selectedDeclaration.po_number}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Declaration Date: {formatDate(selectedDeclaration.declaration_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeclaration(null);
                  clearOutboundData();
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Change Selection
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading products...</span>
              </div>
            ) : (
              <>
                <ShipmentInfoForm
                  shipmentInfo={shipmentInfo}
                  setShipmentInfo={setShipmentInfo}
                />
                <WeightSummary summary={summary} />
                <OutboundProductsTable
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                  onDeleteProduct={handleDeleteProduct}
                  addLogEntry={addLogEntry}
                  transactionDate={transactionDate}
                  setTransactionDate={setTransactionDate}
                />
                <ActivityLog logs={activityLog} />
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedProducts.length === 0}
                    className="px-6 py-3 font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit Outbound Shipment (${selectedProducts.length} items)`}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Outbound;
