// src/components/inventory/shared/ProductSelectionFilters.jsx
import React from 'react'

const ProductSelectionFilters = ({
  availableProducts,
  productFilters,
  setProductFilters,
  showProductList,
  setShowProductList,
  selectedProducts,
  clearAllData,
  title = "Product Selection"
}) => {
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

  // Enhanced product filtering with smart type search
  const filteredProducts = availableProducts.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    
    // Enhanced search that includes type field
    const matchesSearch = !productFilters.search || 
      product.product_name?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.product_id?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.system_code?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.type?.toLowerCase().includes(productFilters.search.toLowerCase())
    
    return matchesCountry && matchesVendor && matchesType && matchesSearch
  })

  // Clear dependent filters when parent filter changes
  const handleCountryChange = (country) => {
    setProductFilters(prev => ({ 
      ...prev, 
      country, 
      vendor: '', 
      type: ''
    }))
  }

  const handleVendorChange = (vendor) => {
    setProductFilters(prev => ({ 
      ...prev, 
      vendor,
      type: ''
    }))
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
          <select
            value={productFilters.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Countries</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
          <select
            value={productFilters.vendor}
            onChange={(e) => handleVendorChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={!productFilters.country}
          >
            <option value="">All Vendors</option>
            {uniqueVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Type 
            <span className="text-gray-400 font-normal ml-1">
              ({uniqueTypes.length} available)
            </span>
          </label>
          <select
            value={productFilters.type}
            onChange={(e) => setProductFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Search
            <span className="text-gray-400 font-normal ml-1">
              (name, code, type)
            </span>
          </label>
          <input
            type="text"
            value={productFilters.search}
            onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search by name, code, or type..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      {/* 显示当前活跃的过滤器 */}
      {(productFilters.country || productFilters.vendor || productFilters.type || productFilters.search) && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Active filters:</span>
          {productFilters.country && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
              Country: {productFilters.country}
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
              Vendor: {productFilters.vendor}
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
              Type: {productFilters.type}
              <button 
                onClick={() => setProductFilters(prev => ({ ...prev, type: '' }))}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
          {productFilters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
              Search: "{productFilters.search}"
              <button 
                onClick={() => setProductFilters(prev => ({ ...prev, search: '' }))}
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
          Found {filteredProducts.length} products
          {availableProducts.length !== filteredProducts.length && (
            <span className="ml-1 text-gray-400">
              (of {availableProducts.length} total)
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
              {showProductList ? 'Hide' : 'Show'} Products
            </button>
          )}
          {selectedProducts.length > 0 && (
            <button
              type="button"
              onClick={clearAllData}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductSelectionFilters
