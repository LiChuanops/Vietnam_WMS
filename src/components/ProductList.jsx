import React, { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase/client'

const ProductList = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVietnamese, setShowVietnamese] = useState(false)
  const [filters, setFilters] = useState({
    country: '',
    vendor: '',
    workInProgress: ''
  })

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'Admin'

  // Get unique values for filters with smart filtering
  const uniqueCountries = [...new Set(products.map(p => p.country).filter(Boolean))]
  
  // Smart vendor filtering - only show vendors for selected country
  const availableVendors = filters.country 
    ? [...new Set(products
        .filter(p => p.country === filters.country)
        .map(p => p.vendor)
        .filter(Boolean)
      )]
    : [...new Set(products.map(p => p.vendor).filter(Boolean))]
  
  // Get actual WIP values (excluding empty/null values)
  const uniqueWIP = [...new Set(products
    .map(p => p.work_in_progress)
    .filter(wip => wip && wip.trim() !== '')
  )]

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('system_code')

      if (error) {
        console.error('Error fetching products:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle country filter change - reset vendor when country changes
  const handleCountryChange = (newCountry) => {
    setFilters(prev => ({
      ...prev,
      country: newCountry,
      vendor: '' // Reset vendor when country changes
    }))
  }

  // Handle vendor filter change
  const handleVendorChange = (newVendor) => {
    setFilters(prev => ({
      ...prev,
      vendor: newVendor
    }))
  }

  // Handle WIP filter change
  const handleWIPChange = (newWIP) => {
    setFilters(prev => ({
      ...prev,
      workInProgress: newWIP
    }))
  }

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    return (
      (!filters.country || product.country === filters.country) &&
      (!filters.vendor || product.vendor === filters.vendor) &&
      (!filters.workInProgress || product.work_in_progress === filters.workInProgress)
    )
  })

  // Handle status update (only for admin)
  const handleStatusUpdate = async (systemCode, newStatus) => {
    if (!isAdmin) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('system_code', systemCode)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.system_code === systemCode
            ? { ...product, status: newStatus }
            : product
        )
      )
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">{t('productList')}</h1>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Vietnamese Name Toggle */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showVietnamese}
              onChange={(e) => setShowVietnamese(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
            />
            <span className="ml-2 text-sm text-gray-700">{t('showVietnamese')}</span>
          </label>

          {/* Country Filter */}
          <select
            value={filters.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">{t('allCountries')}</option>
            {uniqueCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* Vendor Filter - Smart filtering based on country */}
          <select
            value={filters.vendor}
            onChange={(e) => handleVendorChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={availableVendors.length === 0}
          >
            <option value="">{t('allVendors')}</option>
            {availableVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>

          {/* WIP Filter - Only show actual values */}
          {uniqueWIP.length > 0 && (
            <select
              value={filters.workInProgress}
              onChange={(e) => handleWIPChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All WIP Status</option>
              {uniqueWIP.map(wip => (
                <option key={wip} value={wip}>{wip}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        {t('showing')} {filteredProducts.length} {t('of')} {products.length} {t('products')}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('itemCode')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {showVietnamese ? t('vietnameseName') : t('productName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('country')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('vendor')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('uom')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('packingSize')}
              </th>
              {uniqueWIP.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('workInProgress')}
                </th>
              )}
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={uniqueWIP.length > 0 ? (isAdmin ? 9 : 8) : (isAdmin ? 8 : 7)} className="px-6 py-4 text-center text-gray-500">
                  {t('noData')}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.system_code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.system_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {showVietnamese ? product.viet_name || product.product_name : product.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.uom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.packing_size}
                  </td>
                  {uniqueWIP.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.work_in_progress || '-'}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={product.status || ''}
                        onChange={(e) => handleStatusUpdate(product.system_code, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">{t('status')}</option>
                        <option value="Active">{t('active')}</option>
                        <option value="Inactive">{t('inactive')}</option>
                        <option value="Discontinued">{t('discontinued')}</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductList
