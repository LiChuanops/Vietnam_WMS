import React from 'react'
import { useLanguage } from '../../context/LanguageContext'

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
  showAccountCode,
  onToggleAccountCode,
  emptyAccountCodeCount,
  uniqueCountries,
  filteredVendors,
  filteredTypes,
  uniqueWIP,
  filteredProductsCount,
  totalProductsCount,
  products,
  // 新增的权限检查函数
  canAddProducts,
  canViewAccountCode
}) => {
  const { t } = useLanguage()
  const handleExportCSV = () => {
    const headers = [
      'system_code', 'product_name', 'viet_name', 'packing_size', 'account_code',
      'country', 'vendor', 'uom', 'work_in_progress'
    ];

    const csvContent = [
      headers.join(','),
      ...products.map(p => headers.map(h => `"${p[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="mb-6">
      {/* Search and Filter controls */}
      <div className="space-y-4 mb-6">
        {/* First row: Search and Vietnamese checkbox */}
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

        {/* Second row: Filter dropdowns and buttons */}
        <div className="flex flex-wrap gap-4 items-center">
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

          <div className="flex-grow"></div>

          <div className="flex items-center space-x-2">
          <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('exportCsv')}
            </button>
            {/* Account Code Toggle - 基于权限显示 */}
            {canViewAccountCode && canViewAccountCode() && (
              <button
                onClick={onToggleAccountCode}
                className={`relative inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  showAccountCode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400'
                }`}
              >
                {showAccountCode ? t('hideAccountCode') : t('showAccountCode')}
                {emptyAccountCodeCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {emptyAccountCodeCount}
                  </span>
                )}
              </button>
            )}

            {/* Add Product Button - 基于权限显示 */}
            {canAddProducts && canAddProducts() && (
              <button
                onClick={onAddProduct}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('addNewProduct')}
              </button>
            )}
          </div>
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
