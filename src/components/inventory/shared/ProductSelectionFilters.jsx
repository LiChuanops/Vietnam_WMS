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
  title = "Product Selection" // 可自定义标题
}) => {
  // Get unique filter options
  const uniqueCountries = [...new Set(availableProducts.map(p => p.country).filter(Boolean))].sort()
  const uniqueVendors = productFilters.country 
    ? [...new Set(availableProducts.filter(p => p.country === productFilters.country).map(p => p.vendor).filter(Boolean))].sort()
    : [...new Set(availableProducts.map(p => p.vendor).filter(Boolean))].sort()
  const uniqueTypes = [...new Set(availableProducts.map(p => p.type).filter(Boolean))].sort()

  // Filter products for counting
  const filteredProducts = availableProducts.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesSearch = !productFilters.search || 
      product.product_name?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.product_id?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.system_code?.toLowerCase().includes(productFilters.search.toLowerCase())
    
    return matchesCountry && matchesVendor && matchesType && matchesSearch
  })

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
          <select
            value={productFilters.country}
            onChange={(e) => setProductFilters(prev => ({ ...prev, country: e.target.value, vendor: '' }))}
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
            onChange={(e) => setProductFilters(prev => ({ ...prev, vendor: e.target.value }))}
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
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
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            value={productFilters.search}
            onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Product name or code..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Found {filteredProducts.length} products
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
