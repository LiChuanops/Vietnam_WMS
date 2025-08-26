// src/components/inventory/shared/ProductSelectionFilters.jsx
import React from 'react'
import { useLanguage } from '../../../context/LanguageContext'

const ProductSelectionFilters = ({
  availableProducts,
  productFilters,
  setProductFilters,
  showProductList,
  setShowProductList,
  selectedProducts,
  clearAllData,
  title = "Product Selection",
  disabledFilters = []
}) => {
  const { t } = useLanguage()

  // Get unique filter options with smart filtering
  const uniqueCountries = [...new Set(availableProducts.map(p => p.country).filter(Boolean))].sort()
  
  // Smart vendor filtering based on country selection
  const uniqueVendors = productFilters.country 
    ? [...new Set(availableProducts.filter(p => p.country === productFilters.country).map(p => p.vendor).filter(Boolean))].sort()
    : [...new Set(availableProducts.map(p => p.vendor).filter(Boolean))].sort()
  
  // Smart type filtering based on country and vendor selection
  const getAvailableTypes = () => {
    let baseProducts = availableProducts
    
    if (productFilters.country) {
      baseProducts = baseProducts.filter(p => p.country === productFilters.country)
    }
    if (productFilters.vendor) {
      baseProducts = baseProducts.filter(p => p.vendor === productFilters.vendor)
    }
    
    return [...new Set(baseProducts.map(p => p.type).filter(Boolean))].sort()
  }
  
  const uniqueTypes = getAvailableTypes()

  const getAvailablePackingSizes = () => {
    let baseProducts = availableProducts

    if (productFilters.country) {
      baseProducts = baseProducts.filter(p => p.country === productFilters.country)
    }
    if (productFilters.vendor) {
      baseProducts = baseProducts.filter(p => p.vendor === productFilters.vendor)
    }
    if (productFilters.type) {
      baseProducts = baseProducts.filter(p => p.type === productFilters.type)
    }

    return [...new Set(baseProducts.map(p => p.packing_size).filter(Boolean))].sort()
  }

  const uniquePackingSizes = getAvailablePackingSizes()

  // Enhanced product filtering with smart type search
  const filteredProducts = availableProducts.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesPackingSize = !productFilters.packing_size || product.packing_size === productFilters.packing_size
    
    return matchesCountry && matchesVendor && matchesType && matchesPackingSize
  })

  // Clear dependent filters when parent filter changes
  const handleCountryChange = (country) => {
    setProductFilters(prev => ({
      ...prev,
      country,
      vendor: '',
      type: '',
      packing_size: ''
    }))
  }

  const handleVendorChange = (vendor) => {
    setProductFilters(prev => ({
      ...prev,
      vendor,
      type: '',
      packing_size: ''
    }))
  }

  const handleTypeChange = (type) => {
    setProductFilters(prev => ({
      ...prev,
      type,
      packing_size: ''
    }))
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{t('productSelection')}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('country')}</label>
          <select
            value={productFilters.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={disabledFilters.includes('country')}
          >
            <option value="">{t('allCountries')}</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t('vendor')}</label>
          <select
            value={productFilters.vendor}
            onChange={(e) => handleVendorChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={!productFilters.country}
          >
            <option value="">{t('allVendors')}</option>
            {uniqueVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('type')} 
            <span className="text-gray-400 font-normal ml-1">
              ({uniqueTypes.length} {t('available')})
            </span>
          </label>
          <select
            value={productFilters.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">{t('allTypes')}</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t('packingSize')}
            <span className="text-gray-400 font-normal ml-1">
              ({uniquePackingSizes.length} {t('available')})
            </span>
          </label>
          <select
            value={productFilters.packing_size}
            onChange={(e) => setProductFilters(prev => ({ ...prev, packing_size: e.target.value }))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={!productFilters.country}
          >
            <option value="">{t('allPackingSizes')}</option>
            {uniquePackingSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 显示当前活跃的过滤器 */}
      {(productFilters.country || productFilters.vendor || productFilters.type || productFilters.packing_size) && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">{t('activeFilters')}:</span>
          {productFilters.country && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              {t('countryFilter')} {productFilters.country}
              <button 
                onClick={() => handleCountryChange('')}
                className="ml-1 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {productFilters.vendor && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              {t('vendorFilter')} {productFilters.vendor}
              <button 
                onClick={() => handleVendorChange('')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {productFilters.type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
              {t('typeFilter')} {productFilters.type}
              <button 
                onClick={() => handleTypeChange('')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {productFilters.packing_size && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
              {t('packingSize')}: "{productFilters.packing_size}"
              <button 
                onClick={() => setProductFilters(prev => ({ ...prev, packing_size: '' }))}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {t('foundProducts')} {filteredProducts.length} {t('products')}
          {availableProducts.length !== filteredProducts.length && (
            <span className="ml-1 text-gray-400">
              ({t('ofTotal')} {availableProducts.length})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {productFilters.country && (
            <button
              type="button"
              onClick={() => setShowProductList(!showProductList)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {showProductList ? t('hideProducts') : t('showProducts')}
            </button>
          )}
          {selectedProducts.length > 0 && (
            <button
              type="button"
              onClick={clearAllData}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              {t('clearAll')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductSelectionFilters
