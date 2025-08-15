import React, { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../context/PermissionContext'
import { supabase } from '../supabase/client'

const ProductList = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission, PermissionGate } = usePermissions()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVietnamese, setShowVietnamese] = useState(false)
  const [filters, setFilters] = useState({
    country: '',
    vendor: '',
    workInProgress: ''
  })
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    system_code: '',
    product_name: '',
    viet_name: '',
    type: '',
    country: '',
    vendor: '',
    uom: '',
    packing_size: '',
    work_in_progress: '',
    status: 'Active'
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // 权限检查
  const canViewProducts = hasPermission(PERMISSIONS.PRODUCT_VIEW)
  const canCreateProducts = hasPermission(PERMISSIONS.PRODUCT_CREATE)
  const canEditProducts = hasPermission(PERMISSIONS.PRODUCT_EDIT)
  const canDeleteProducts = hasPermission(PERMISSIONS.PRODUCT_DELETE)
  const canChangeStatus = hasPermission(PERMISSIONS.PRODUCT_STATUS_CHANGE)

  // Get unique values for filters
  const uniqueCountries = [...new Set(products.map(p => p.country).filter(Boolean))]
  const availableVendors = filters.country 
    ? [...new Set(products
        .filter(p => p.country === filters.country)
        .map(p => p.vendor)
        .filter(Boolean)
      )]
    : [...new Set(products.map(p => p.vendor).filter(Boolean))]
  const uniqueWIP = [...new Set(products
    .map(p => p.work_in_progress)
    .filter(wip => wip && wip.trim() !== '')
  )]

  useEffect(() => {
    if (canViewProducts) {
      fetchProducts()
    } else {
      setLoading(false)
    }
  }, [canViewProducts])

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

  const handleCountryChange = (newCountry) => {
    setFilters(prev => ({
      ...prev,
      country: newCountry,
      vendor: ''
    }))
  }

  const handleVendorChange = (newVendor) => {
    setFilters(prev => ({
      ...prev,
      vendor: newVendor
    }))
  }

  const handleWIPChange = (newWIP) => {
    setFilters(prev => ({
      ...prev,
      workInProgress: newWIP
    }))
  }

  const filteredProducts = products.filter(product => {
    return (
      (!filters.country || product.country === filters.country) &&
      (!filters.vendor || product.vendor === filters.vendor) &&
      (!filters.workInProgress || product.work_in_progress === filters.workInProgress)
    )
  })

  const handleStatusUpdate = async (systemCode, newStatus) => {
    if (!canChangeStatus) {
      alert(t('noPermission'))
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('system_code', systemCode)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

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

  const handleAddProduct = () => {
    if (!canCreateProducts) {
      alert(t('noPermission'))
      return
    }

    setModalMode('add')
    setEditingProduct(null)
    setFormData({
      system_code: '',
      product_name: '',
      viet_name: '',
      type: '',
      country: '',
      vendor: '',
      uom: '',
      packing_size: '',
      work_in_progress: '',
      status: 'Active'
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleEditProduct = (product) => {
    if (!canEditProducts) {
      alert(t('noPermission'))
      return
    }

    setModalMode('edit')
    setEditingProduct(product)
    setFormData({
      system_code: product.system_code || '',
      product_name: product.product_name || '',
      viet_name: product.viet_name || '',
      type: product.type || '',
      country: product.country || '',
      vendor: product.vendor || '',
      uom: product.uom || '',
      packing_size: product.packing_size || '',
      work_in_progress: product.work_in_progress || '',
      status: product.status || 'Active'
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.system_code.trim()) {
      errors.system_code = t('systemCodeRequired')
    }
    
    if (!formData.product_name.trim()) {
      errors.product_name = t('productNameRequired')
    }

    if (modalMode === 'add') {
      const existingProduct = products.find(p => p.system_code === formData.system_code.trim())
      if (existingProduct) {
        errors.system_code = t('systemCodeExists')
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // 权限检查
    if (modalMode === 'add' && !canCreateProducts) {
      alert(t('noPermission'))
      return
    }
    
    if (modalMode === 'edit' && !canEditProducts) {
      alert(t('noPermission'))
      return
    }

    setFormLoading(true)

    try {
      const productData = {
        system_code: formData.system_code.trim(),
        product_name: formData.product_name.trim(),
        viet_name: formData.viet_name.trim() || null,
        type: formData.type.trim() || null,
        country: formData.country.trim() || null,
        vendor: formData.vendor.trim() || null,
        uom: formData.uom.trim() || null,
        packing_size: formData.packing_size.trim() || null,
        work_in_progress: formData.work_in_progress.trim() || null,
        status: formData.status
      }

      if (modalMode === 'add') {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()

        if (error) {
          console.error('Error adding product:', error)
          alert(t('errorAddingProduct'))
          return
        }

        setProducts(prev => [...prev, data[0]])
        alert(t('productAddedSuccessfully'))
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('system_code', editingProduct.system_code)

        if (error) {
          console.error('Error updating product:', error)
          alert(t('errorUpdatingProduct'))
          return
        }

        setProducts(prev =>
          prev.map(product =>
            product.system_code === editingProduct.system_code
              ? { ...product, ...productData }
              : product
          )
        )
        alert(t('productUpdatedSuccessfully'))
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error:', error)
      alert(t('unexpectedError'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!canDeleteProducts) {
      alert(t('noPermission'))
      return
    }

    if (!window.confirm(t('confirmDeleteProduct'))) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('system_code', product.system_code)

      if (error) {
        console.error('Error deleting product:', error)
        alert(t('errorDeletingProduct'))
        return
      }

      setProducts(prev => prev.filter(p => p.system_code !== product.system_code))
      alert(t('productDeletedSuccessfully'))
    } catch (error) {
      console.error('Error:', error)
      alert(t('unexpectedError'))
    }
  }

  // 如果没有查看权限，显示无权限页面
  if (!canViewProducts) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('accessDenied')}</h1>
          <p className="text-lg text-gray-500">{t('noPermissionToView')}</p>
        </div>
      </div>
    )
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">{t('productList')}</h1>
          
          {/* 使用权限门控组件 */}
          <PermissionGate permission={PERMISSIONS.PRODUCT_CREATE}>
            <button
              onClick={handleAddProduct}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              + {t('addNewProduct')}
            </button>
          </PermissionGate>
        </div>
        
        {/* 过滤器控件 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex items-center cursor-pointer">
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

          {uniqueWIP.length > 0 && (
            <select
              value={filters.workInProgress}
              onChange={(e) => handleWIPChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All</option>
              {uniqueWIP.map(wip => (
                <option key={wip} value={wip}>{wip}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {t('showing')} {filteredProducts.length} {t('of')} {products.length} {t('products')}
      </div>

      {/* 产品表格 */}
      <div className="overflow-x-auto max-w-full bg-white shadow rounded-lg">
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
              
              {/* 状态列 - 只有有权限的用户才能看到 */}
              <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
              </PermissionGate>
              
              {/* 操作列 - 只有有权限的用户才能看到 */}
              <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT, PERMISSIONS.PRODUCT_DELETE]} requireAll={false}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </PermissionGate>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 9l4 4L9 17" />
                    </svg>
                    <p className="text-lg font-medium">{t('noData')}</p>
                    <p className="text-sm mt-1">Try adjusting your filters to see more results</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.system_code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.system_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 break-words whitespace-normal max-w-xs">
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
                  
                  {/* 状态选择器 - 权限控制 */}
                  <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={product.status || ''}
                        onChange={(e) => handleStatusUpdate(product.system_code, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">{t('status')}</option>
                        <option value="Active">{t('active')}</option>
                        <option value="Inactive">{t('inactive')}</option>
                        <option value="Discontinued">{t('discontinued')}</option>
                      </select>
                    </td>
                  </PermissionGate>
                  
                  {/* 操作按钮 - 权限控制 */}
                  <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT, PERMISSIONS.PRODUCT_DELETE]} requireAll={false}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <PermissionGate permission={PERMISSIONS.PRODUCT_EDIT}>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            {t('edit')}
                          </button>
                        </PermissionGate>
                        
                        <PermissionGate permission={PERMISSIONS.PRODUCT_DELETE}>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            {t('delete')}
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </PermissionGate>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - 表单弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalMode === 'add' ? t('addNewProduct') : t('editProduct')}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* System Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('itemCode')} *
                    </label>
                    <input
                      type="text"
                      value={formData.system_code}
                      onChange={(e) => handleInputChange('system_code', e.target.value)}
                      disabled={modalMode === 'edit'}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        modalMode === 'edit' ? 'bg-gray-100' : ''
                      } ${formErrors.system_code ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder={t('enterItemCode')}
                    />
                    {formErrors.system_code && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.system_code}</p>
                    )}
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('productName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) => handleInputChange('product_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.product_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('enterProductName')}
                    />
                    {formErrors.product_name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.product_name}</p>
                    )}
                  </div>

                  {/* Vietnamese Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('vietnameseName')}
                    </label>
                    <input
                      type="text"
                      value={formData.viet_name}
                      onChange={(e) => handleInputChange('viet_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterVietnameseName')}
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('type')}
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterType')}
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('country')}
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterCountry')}
                    />
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('vendor')}
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterVendor')}
                    />
                  </div>

                  {/* UOM */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('uom')}
                    </label>
                    <input
                      type="text"
                      value={formData.uom}
                      onChange={(e) => handleInputChange('uom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterUOM')}
                    />
                  </div>

                  {/* Packing Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('packingSize')}
                    </label>
                    <input
                      type="text"
                      value={formData.packing_size}
                      onChange={(e) => handleInputChange('packing_size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterPackingSize')}
                    />
                  </div>

                  {/* Work in Progress */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('workInProgress')}
                    </label>
                    <input
                      type="text"
                      value={formData.work_in_progress}
                      onChange={(e) => handleInputChange('work_in_progress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={t('enterWorkInProgress')}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="Active">{t('active')}</option>
                      <option value="Inactive">{t('inactive')}</option>
                      <option value="Discontinued">{t('discontinued')}</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {formLoading ? t('saving') : (modalMode === 'add' ? t('addProduct') : t('updateProduct'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList
