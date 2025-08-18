import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'

const ProductFilters = ({
  searchTerm,
  setSearchTerm,
  showVietnamese,
  setShowVietnamese,
  filters,
  onCountryChange,
  onVendorChange,
  onTypeChange,
  onWIPChange,
  onStatusFilterChange,
  onAddProduct,
  uniqueCountries,
  filteredVendors,
  filteredTypes,
  uniqueWIP,
  filteredProductsCount,
  totalProductsCount
}) => {
  const { t } = useLanguage()
  const { PermissionGate } = usePermissions()

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">{t('productList')}</h1>
      </div>
      
      {/* Search and Filter controls */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={`${t('searchProducts')} (Ctrl+F)`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <label className="flex items-center cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showVietnamese}
              onChange={(e) => setShowVietnamese(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
            />
            <span className="ml-2 text-sm text-gray-700 select-none">
              {t('showVietnamese')}
            </span>
          </label>
        </div>

        {/* Add New Product Button */}
        <div className="flex justify-start">
          <PermissionGate permission={PERMISSIONS.PRODUCT_CREATE}>
            <button
              onClick={onAddProduct}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              + {t('addNewProduct')}
            </button>
          </PermissionGate>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          >
            <option value="Active">{t('active')}</option>
            <option value="Inactive">{t('inactive')}</option>
            <option value="Discontinued">{t('discontinued')}</option>
          </select>

          <select
            value={filters.country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">{t('allCountries')}</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          <select
            value={filters.vendor}
            onChange={(e) => onVendorChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={filteredVendors.length === 0}
          >
            <option value="">{t('allVendors')}</option>
            {filteredVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          {filteredTypes.length > 0 && (
            <select
              value={filters.type}
              onChange={(e) => onTypeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              {filteredTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}

          {uniqueWIP.length > 0 && (
            <select
              value={filters.workInProgress}
              onChange={(e) => onWIPChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All WIP</option>
              {uniqueWIP.map(wip => (
                <option key={wip} value={wip}>{wip}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        {t('showing')} {filteredProductsCount} {t('of')} {totalProductsCount} {t('products')}
      </div>
    </div>
  )
}

export default ProductFilters
