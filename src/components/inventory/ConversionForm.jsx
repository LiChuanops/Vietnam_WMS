import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../context/AuthContext';
import ProductSelectionFilters from './shared/ProductSelectionFilters';

const ConversionForm = ({ product, onCancel }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [targetProductId, setTargetProductId] = useState('');
  const [productFilters, setProductFilters] = useState({
    country: '',
    vendor: '',
    type: '',
    packing_size: '',
  });
  const [quantity, setQuantity] = useState('');
  const [conversionDate, setConversionDate] = useState(new Date().toISOString().split('T')[0]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('system_code, product_name, country, vendor, type, packing_size')
        .order('product_name');

      if (error) {
        console.error('Error fetching all products:', error);
      } else {
        // Exclude the source product from the target list
        setAllProducts(data.filter(p => p.system_code !== product.product_id));
      }
    } catch (error) {
      console.error('Unexpected error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetProductId || !quantity || !conversionDate) {
      alert('Please fill all fields.');
      return;
    }

    const numericQuantity = parseFloat(quantity);
    if (numericQuantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }
    if (numericQuantity > product.current_stock) {
      alert('Conversion quantity cannot exceed available stock.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('perform_package_conversion', {
        source_product_id_param: product.product_id,
        target_product_id_param: targetProductId,
        quantity_param: numericQuantity,
        conversion_date_param: conversionDate,
        created_by_param: user.id,
      });

      if (error) {
        console.error('Error performing package conversion:', error);
        alert(`Error: ${error.message}`);
      } else {
        alert('Package conversion successful!');
        onCancel(); // Close form and return to list
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTargetProducts = useMemo(() => {
    return allProducts.filter(p => {
      const { country, vendor, type, packing_size } = productFilters;
      const matchesCountry = !country || p.country === country;
      const matchesVendor = !vendor || p.vendor === vendor;
      const matchesType = !type || p.type === type;
      const matchesPackingSize = !packing_size || p.packing_size === packing_size;
      return matchesCountry && matchesVendor && matchesType && matchesPackingSize;
    });
  }, [allProducts, productFilters]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Convert Package for: {product.product_name}</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">{t('sourceProduct')}</label>
        <input
          type="text"
          value={`${product.product_name} (Stock: ${parseFloat(product.current_stock).toLocaleString()})`}
          disabled
          className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{t('targetProduct')}</label>
        <ProductSelectionFilters
          availableProducts={allProducts}
          productFilters={productFilters}
          setProductFilters={setProductFilters}
          showProductList={false} // Don't need to show/hide a list
          setShowProductList={() => {}}
          selectedProducts={[]}
          clearAllData={() => setProductFilters({ country: '', vendor: '', type: '', packing_size: '' })}
        />
        <select
          id="targetProduct"
          value={targetProductId}
          onChange={(e) => setTargetProductId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="" disabled>{loading ? 'Loading...' : `Found ${filteredTargetProducts.length} products`}</option>
          {filteredTargetProducts.map(p => (
            <option key={p.system_code} value={p.system_code}>
              {p.product_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">{t('quantityToConvert')}</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          min="0.01"
          step="0.01"
          max={product.current_stock}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="conversionDate" className="block text-sm font-medium text-gray-700">{t('conversionDate')}</label>
        <input
          type="date"
          id="conversionDate"
          value={conversionDate}
          onChange={(e) => setConversionDate(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting || loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? t('processing') : t('submitConversion')}
        </button>
      </div>
    </form>
  );
};

export default ConversionForm;
