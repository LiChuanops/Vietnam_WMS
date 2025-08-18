import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { generateProductCode, validateProductCode, getCodeGenerationInfo } from '../../utils/ProductCodeGenerator'

const ProductForm = ({
  showModal,
  setShowModal,
  modalMode,
  editingProduct,
  products,
  onSubmit
}) => {
  const { t } = useLanguage()
  const { user, userProfile } = useAuth()

  // Form state
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
  
  // Enhanced form functionality states
  const [isNewCountry, setIsNewCountry] = useState(false)
  const [isNewVendor, setIsNewVendor] = useState(false)
  const [isNewType, setIsNewType] = useState(false)
  const [isNewPackingSize, setIsNewPackingSize] = useState(false)
  const [availableCountries, setAvailableCountries] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])
  const [availableTypes, setAvailableTypes] = useState([])
  const [availablePackingSizes, setAvailablePackingSizes] = useState([])
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  // Initialize form when modal opens
  useEffect(() => {
    if (showModal) {
      if (modalMode === 'edit' && editingProduct) {
        setFormData({
          system_code: editingProduct.system_code || '',
          product_name: editingProduct.product_name || '',
          viet_name: editingProduct.viet_name || '',
          type: editingProduct.type || '',
          country: editingProduct.country || '',
          vendor: editingProduct.vendor || '',
          uom: editingProduct.uom || '',
          packing_size: editingProduct.packing_size || '',
          work_in_progress: editingProduct.work_in_progress || '',
          status: editingProduct.status || 'Active'
        })
      } else {
        // Reset for add mode
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
      }
      
      setFormErrors({})
      setIsNewCountry(false)
      setIsNewVendor(false)
      setIsNewType(false)
      setIsNewPackingSize(false)
      
      // Initialize available options for add mode
      if (modalMode === 'add') {
        setAvailableCountries([...new Set(products.map(p => p.country).filter(Boolean))])
        setAvailableTypes([...new Set(products.map(p => p.type).filter(Boolean))])
        setAvailablePackingSizes([...new Set(products.map(p => p.packing_size).filter(Boolean))])
      }
    }
  }, [showModal, modalMode, editingProduct, products])

  // Update available vendors when country changes
  useEffect(() => {
    if (formData.country && !isNewCountry) {
      const vendors = [...new Set(products
        .filter(p => p.country === formData.country)
        .map(p => p.vendor)
        .filter(Boolean)
      )]
      setAvailableVendors(vendors)
    } else {
      setAvailableVendors([])
    }
  }, [formData.country, isNewCountry, products])

  // Generate item code when country, vendor, and WIP are selected
  useEffect(() => {
    if (modalMode === 'add' && formData.country && !isNewCountry && !isNewVendor) {
      handleGenerateCode()
    }
  }, [formData.country, formData.vendor, formData.work_in_progress, isNewCountry, isNewVendor, modalMode])

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true)
    
    try {
      const result = generateProductCode({
        country: formData.country,
        vendor: formData.vendor,
        workInProgress: formData.work_in_progress,
        existingProducts: products,
        isNewCountry,
        isNewVendor
      })

      if (result.success) {
        setFormData(prev => ({ ...prev, system_code: result.code }))
      } else {
        setFormData(prev => ({ ...prev, system_code: '' }))
        if (result.message.includes('Warning:')) {
          alert(result.message)
        }
      }
    } catch (error) {
      console.error('Error generating item code:', error)
      setFormData(prev => ({ ...prev, system_code: '' }))
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleFormInputChange = (field, value) => {
    if (field === 'country') {
      if (value === 'NEW') {
        setIsNewCountry(true)
        setFormData(prev => ({ ...prev, vendor: '', system_code: '' }))
        setIsNewVendor(false)
      } else {
        setIsNewCountry(false)
        setFormData(prev => ({ ...prev, country: value, vendor: '', system_code: '' }))
        setIsNewVendor(false)
      }
    } else if (field === 'vendor') {
      if (value === 'NEW') {
        setIsNewVendor(true)
        setFormData(prev => ({ ...prev, system_code: '' }))
      } else {
        setIsNewVendor(false)
        setFormData(prev => ({ ...prev, vendor: value, system_code: '' }))
      }
    } else if (field === 'type') {
      if (value === 'NEW') {
        setIsNewType(true)
        setFormData(prev => ({ ...prev, type: '' }))
      } else {
        setIsNewType(false)
        setFormData(prev => ({ ...prev, type: value }))
      }
    } else if (field === 'packing_size') {
      if (value === 'NEW') {
        setIsNewPackingSize(true)
        setFormData(prev => ({ ...prev, packing_size: '' }))
      } else {
        setIsNewPackingSize(false)
        setFormData(prev => ({ ...prev, packing_size: value }))
      }
    } else if (field === 'work_in_progress') {
      // Convert "Yes" to "WIP" for storage
      const wipValue = value === 'Yes' ? 'WIP' : ''
      console.log('WIP Selection changed:', value, '-> Storage value:', wipValue)
      setFormData(prev => ({ ...prev, work_in_progress: wipValue, system_code: '' }))
    } else if (field === 'uom') {
      // Only allow numbers and decimal point for UOM
      const numericValue = value.replace(/[^0-9.]/g, '')
      // Prevent multiple decimal points
      const parts = numericValue.split('.')
      if (parts.length > 2) {
        return // Don't update if more than one decimal point
      }
      setFormData(prev => ({ ...prev, uom: numericValue }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.system_code.trim()) {
      errors.system_code = 'Item code is required'
    }
    
    if (!formData.product_name.trim()) {
      errors.product_name = 'Product name is required'
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required'
    }

    // Check for duplicate code in add mode
    if (modalMode === 'add') {
      const validation = validateProductCode(formData.system_code, products)
      if (!validation.isAvailable) {
        errors.system_code = validation.message
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

    setFormLoading(true)

    try {
      // Get current date in English format
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Get user name from profile
      const userName = userProfile?.name || user?.email || 'Unknown User'

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
        status: formData.status,
        action_date: currentDate,
        user: userName
      }

      // Call parent submit handler
      await onSubmit(productData, modalMode, editingProduct)
      
      setShowModal(false)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Unexpected error occurred')
    } finally {
      setFormLoading(false)
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {modalMode === 'add' ? t('addNewProduct') : t('editProduct')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('country')} *
                  <span className="text-xs text-gray-500 ml-1">({t('pleaseSelectCountry')})</span>
                </label>
                {modalMode === 'add' ? (
                  <div className="space-y-2">
                    <select
                      value={isNewCountry ? 'NEW' : formData.country}
                      onChange={(e) => handleFormInputChange('country', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.country ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select existing country</option>
                      {availableCountries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                      <option value="NEW">+ Add New Country</option>
                    </select>
                    
                    {isNewCountry && (
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Enter new country name"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                          formErrors.country ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                      formErrors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                )}
                {formErrors.country && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
                )}
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('vendor')}
                  <span className="text-xs text-gray-500 ml-1">({t('pleaseSelectCompanyName')})</span>
                </label>
                {modalMode === 'add' ? (
                  <div className="space-y-2">
                    {isNewCountry ? (
                      <input
                        type="text"
                        value={formData.vendor}
                        onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                        placeholder="Enter vendor name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <>
                        <select
                          value={isNewVendor ? 'NEW' : formData.vendor}
                          onChange={(e) => handleFormInputChange('vendor', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={!formData.country || isNewCountry}
                        >
                          <option value="">Select existing vendor or leave empty</option>
                          {availableVendors.map(vendor => (
                            <option key={vendor} value={vendor}>{vendor}</option>
                          ))}
                          <option value="NEW">+ Add New Vendor</option>
                        </select>
                        
                        {isNewVendor && (
                          <input
                            type="text"
                            value={formData.vendor}
                            onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                            placeholder="Enter new vendor name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Item Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('itemCode')} *
                  {isGeneratingCode && (
                    <span className="ml-2 text-xs text-gray-500">(Generating...)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.system_code}
                  onChange={(e) => handleFormInputChange('system_code', e.target.value)}
                  disabled={modalMode === 'edit' || isGeneratingCode}
                  placeholder={
                    modalMode === 'add' && (isNewCountry || isNewVendor)
                      ? "Enter item code manually"
                      : "Will be generated automatically"
                  }
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                    modalMode === 'edit' || isGeneratingCode ? 'bg-gray-100' : ''
                  } ${formErrors.system_code ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.system_code && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.system_code}</p>
                )}
                {modalMode === 'add' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {getCodeGenerationInfo({
                      country: formData.country,
                      vendor: formData.vendor,
                      workInProgress: formData.work_in_progress,
                      isNewCountry,
                      isNewVendor
                    })}
                  </p>
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
                  onChange={(e) => handleFormInputChange('product_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                    formErrors.product_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
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
                  onChange={(e) => handleFormInputChange('viet_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter Vietnamese name"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('type')}
                  <span className="text-xs text-gray-500 ml-1">({t('productCategoryClassification')})</span>
                </label>
                {modalMode === 'add' ? (
                  <div className="space-y-2">
                    <select
                      value={isNewType ? 'NEW' : formData.type}
                      onChange={(e) => handleFormInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select existing type or leave empty</option>
                      {availableTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="NEW">+ Add New Type</option>
                    </select>
                    
                    {isNewType && (
                      <input
                        type="text"
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="Enter new type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => handleFormInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter type"
                  />
                )}
              </div>

              {/* UOM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('uom')}
                  <span className="text-xs text-gray-500 ml-1">({t('howManyKgPerCarton')})</span>
                </label>
                <input
                  type="text"
                  value={formData.uom}
                  onChange={(e) => handleFormInputChange('uom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter weight in kg (e.g., 25 or 12.5)"
                  inputMode="decimal"
                />
              </div>

              {/* Packing Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('packingSize')}
                </label>
                {modalMode === 'add' ? (
                  <div className="space-y-2">
                    <select
                      value={isNewPackingSize ? 'NEW' : formData.packing_size}
                      onChange={(e) => handleFormInputChange('packing_size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select existing packing size or leave empty</option>
                      {availablePackingSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                      <option value="NEW">+ Add New Packing Size</option>
                    </select>
                    
                    {isNewPackingSize && (
                      <input
                        type="text"
                        value={formData.packing_size}
                        onChange={(e) => setFormData(prev => ({ ...prev, packing_size: e.target.value }))}
                        placeholder="Enter new packing size"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.packing_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, packing_size: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter packing size"
                  />
                )}
              </div>

              {/* Work in Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('workInProgress')}
                  <span className="text-xs text-gray-500 ml-1">(11KG convertible packaging option)</span>
                </label>
                <select
                  value={formData.work_in_progress === 'WIP' ? 'Yes' : formData.work_in_progress || ''}
                  onChange={(e) => handleFormInputChange('work_in_progress', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={formLoading || isGeneratingCode}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {formLoading 
                  ? 'Saving...' 
                  : (modalMode === 'add' ? t('addProduct') : t('updateProduct'))
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProductForm
