// src/components/inventory/Outbound.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase/client';
import { inventoryService } from './inventory service';
import ShipmentInfoForm from './outbound/ShipmentInfoForm';
import OutboundProductsTable from './outbound/OutboundProductsTable';

const Outbound = ({ outboundData, setOutboundData, clearOutboundData }) => {
  const { t } = useLanguage();
  const { userProfile } = useAuth();
  const { shipmentInfo, selectedProducts } = outboundData;
  const [customDeclarations, setCustomDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);

  useEffect(() => {
    if (!selectedDeclaration) {
      fetchCustomDeclarations();
    }
  }, [selectedDeclaration]);

  const fetchCustomDeclarations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_declarations')
        .select(`*, profiles:created_by (name)`)
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
        product_name: item.product_name,
        packing_size: item.packing_size,
        batch_number: item.batch_number,
        quantity: item.quantity.toString(),
        uom: item.uom,
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
      alert('Failed to load products for the selected declaration.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedProducts.some(p => !p.quantity || parseFloat(p.quantity) < 0)) {
      alert('Please enter a valid quantity for all products.');
      return;
    }
    if (!shipmentInfo.shipment.trim() || !shipmentInfo.poNumber.trim()) {
        alert('Please fill in all required shipment information fields.');
        return;
    }

    setIsSubmitting(true);

    const transactions = selectedProducts
      .filter(p => parseFloat(p.quantity) > 0)
      .map(p => ({
        product_id: p.product_id,
        transaction_type: 'OUT',
        quantity: parseFloat(p.quantity),
        transaction_date: new Date().toISOString().split('T')[0],
        reference_number: shipmentInfo.poNumber,
        notes: `Shipment: ${shipmentInfo.shipment}, Container: ${shipmentInfo.containerNumber || 'N/A'}, Seal: ${shipmentInfo.sealNo || 'N/A'}`,
        created_by: userProfile?.id,
        source_declaration_id: selectedDeclaration.id
    }));

    if (transactions.length === 0) {
      alert("No products with quantity > 0 to submit.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await inventoryService.addTransaction(transactions);

    if (error) {
      alert('Error creating outbound transaction: ' + error.message);
    } else {
      alert('Outbound shipment transaction created successfully!');
      clearOutboundData();
      setSelectedDeclaration(null);
    }

    setIsSubmitting(false);
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
                <OutboundProductsTable
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                />
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
