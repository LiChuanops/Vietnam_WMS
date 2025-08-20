import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabase/client';
import ConversionForm from './ConversionForm'; // Assuming this will be the new form component

const PackageConversion = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Do not fetch products if a product is already selected for conversion
    if (!selectedProduct) {
      fetchProductsWithStock();
    }
  }, [selectedProduct]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };

  const handleCancelConversion = () => {
    setSelectedProduct(null);
  };

  const fetchProductsWithStock = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch products with stock > 0
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('current_inventory')
        .select('product_id, product_name, packing_size, current_stock')
        .gt('current_stock', 0);

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        setProducts([]);
        return;
      }

      // Step 2: Fetch products that are 'under WIP'
      const { data: wipProducts, error: wipError } = await supabase
        .from('products')
        .select('system_code')
        .eq('work_in_progress', 'under WIP');

      if (wipError) {
        console.error('Error fetching WIP products:', wipError);
        setProducts([]);
        return;
      }

      // Step 3: Filter inventory to include only WIP products
      const wipProductIds = new Set(wipProducts.map(p => p.system_code));
      const filteredProducts = inventoryData.filter(p => wipProductIds.has(p.product_id));

      // Sort the final list by product name
      filteredProducts.sort((a, b) => a.product_name.localeCompare(b.product_name));

      setProducts(filteredProducts);

    } catch (error) {
      console.error('Unexpected error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loadingAvailableProducts')}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">{t('packageConversion')}</h2>

      {selectedProduct ? (
        <ConversionForm
          product={selectedProduct}
          onCancel={handleCancelConversion}
        />
      ) : (
        <>
          {products.length === 0 && !loading ? (
            <div className="text-center text-gray-500 py-10">
              <p>{t('noInventoryData')}</p>
              <p className="text-sm mt-1">{t('tryAdjustingFiltersInventory')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productCode')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packingSize')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('currentStock')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{product.product_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{product.packing_size}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-blue-600">{parseFloat(product.current_stock).toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSelectProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('select')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PackageConversion;
