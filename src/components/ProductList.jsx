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
  const [updateLoading, setUpdateLoading] = useState(false)
  const [showVietnamese, setShowVietnamese] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    country: '',
    vendor: '',
    workInProgress: '',
    type: '',
    status: 'Active'
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
  
  // New states for enhanced form functionality
  const [isNewCountry, setIsNewCountry] = useState(false)
  const [isNewVendor, setIsNewVendor] = useState(false)
  const [isNewType, setIsNewType] = useState(false)
  const [isNewPackingSize, setIsNewPackingSize] = useState(false)
  const [availableCountries, setAvailableCountries] = useState([])
  const [availableVendors, setAvailableVendors] = useState([])
  const [availableTypes, setAvailableTypes] = useState([])
  const [availablePackingSizes, setAvailablePackingSizes] = useState([])
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  // Permission checks
  const canCreateProducts = hasPermission(PERMISSIONS.PRODUCT_CREATE)
  const canEditProducts = hasPermission(PERMISSIONS.PRODUCT_EDIT)
  const canDeleteProducts = hasPermission(PERMISSIONS.PRODUCT_DELETE)
  const canChangeStatus = hasPermission(PERMISSIONS.PRODUCT_STATUS_CHANGE)

  // Get unique values for filters - 智能过滤
  const uniqueCountries = [...new Set(products.map(p => p.country).filter(Boolean))]
  
  // 根据已选择的 country 过滤 vendors
  const filteredVendors = filters.country 
    ? [...new Set(products
        .filter(p => p.country === filters.country)
        .map(p => p.vendor)
        .filter(Boolean)
      )]
    : [...new Set(products.map(p => p.vendor).filter(Boolean))]
  
  // 根据已选择的 country 和 vendor 过滤 types
  const filteredTypes = (() => {
    let filteredProducts = products
    
    if (filters.country) {
      filteredProducts = filteredProducts.filter(p => p.country === filters.country)
    }
    
    if (filters.vendor) {
      filteredProducts = filteredProducts.filter(p => p.vendor === filters.vendor)
    }
    
    return [...new Set(filteredProducts.map(p => p.type).filter(Boolean))]
  })()
  
  const uniqueWIP = [...new Set(products
    .map(p => p.work_in_progress)
    .filter(wip => wip && wip.trim() !== '')
  )]

  useEffect(() => {
    fetchProducts()
    
    // 键盘快捷键
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="Search"]')
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
      
      if (e.key === 'Escape') {
        setSearchTerm('')
        const searchInput = document.querySelector('input[placeholder*="Search"]')
        if (searchInput && document.activeElement === searchInput) {
          searchInput.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Initialize available options when modal opens
  useEffect(() => {
    if (showModal && modalMode === 'add') {
      setAvailableCountries([...new Set(products.map(p => p.country).filter(Boolean))])
      setAvailableTypes([...new Set(products.map(p => p.type).filter(Boolean))])
      setAvailablePackingSizes([...new Set(products.map(p => p.packing_size).filter(Boolean))])
    }
  }, [showModal, modalMode, products])

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
      generateItemCode()
    }
  }, [formData.country, formData.vendor, formData.work_in_progress, isNewCountry, isNewVendor, modalMode])

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

  const generateItemCode = async () => {
    console.log('=== Generate Item Code Called ===')
    console.log('Form Data:', {
      country: formData.country,
      vendor: formData.vendor,
      work_in_progress: formData.work_in_progress,
      isNewCountry,
      isNewVendor
    })

    if (isNewCountry) {
      // If new country, let user input manually
      console.log('New country detected, manual input required')
      setFormData(prev => ({ ...prev, system_code: '' }))
      return
    }

    // For non-WIP products, still need to check vendor
    if (formData.work_in_progress !== 'WIP' && isNewVendor && formData.vendor) {
      console.log('New vendor for non-WIP product, manual input required')
      setFormData(prev => ({ ...prev, system_code: '' }))
      return
    }

    if (!formData.country) {
      console.log('No country selected, cannot generate code')
      setFormData(prev => ({ ...prev, system_code: '' }))
      return
    }

    setIsGeneratingCode(true)
    
    try {
      const isWIP = formData.work_in_progress === 'WIP'
      console.log('Is WIP Product?', isWIP, '(work_in_progress value:', formData.work_in_progress, ')')
      
      if (isWIP) {
        console.log('=== WIP PRODUCT LOGIC ===')
        // For WIP products, ONLY use country + WIP (completely ignore vendor)
        const matchingWIPProducts = products.filter(p => 
          p.country === formData.country && 
          p.work_in_progress === 'WIP'
        )

        console.log('WIP Search - Country:', formData.country)
        console.log('WIP Products found:', matchingWIPProducts.length)
        console.log('WIP Products:', matchingWIPProducts.map(p => ({ 
          code: p.system_code, 
          vendor: p.vendor,
          wip: p.work_in_progress 
        })))

        if (matchingWIPProducts.length === 0) {
          // First WIP product for this country - start from 500
          const prefix = `${formData.country}-WIP-`
          const newCode = `${prefix}500`
          setFormData(prev => ({ ...prev, system_code: newCode }))
          console.log('Generated first WIP code:', newCode)
        } else {
          // Find the highest WIP system_code number for this country
          const wipCodes = matchingWIPProducts
            .map(p => p.system_code)
            .filter(code => code && /\d+$/.test(code))
            .map(code => {
              const match = code.match(/(\d+)$/)
              return match ? parseInt(match[1]) : 0
            })
            .filter(num => !isNaN(num) && num >= 500) // Only consider codes 500 and above

          console.log('WIP Codes found:', wipCodes)

          if (wipCodes.length > 0) {
            const maxCode = Math.max(...wipCodes)
            const newCode = maxCode + 1
            console.log('Max WIP code:', maxCode, 'New code:', newCode)
            
            // Maintain the same prefix pattern
            const lastWIPProduct = matchingWIPProducts
              .filter(p => p.system_code && /\d+$/.test(p.system_code))
              .map(p => {
                const num = parseInt(p.system_code.match(/(\d+)$/)[1])
                return { ...p, numCode: num }
              })
              .filter(p => p.numCode >= 500)
              .sort((a, b) => b.numCode - a.numCode)[0]

            if (lastWIPProduct) {
              const prefix = lastWIPProduct.system_code.replace(/\d+$/, '')
              const finalCode = `${prefix}${newCode}`
              setFormData(prev => ({ ...prev, system_code: finalCode }))
              console.log('Generated WIP code with existing prefix:', finalCode)
            } else {
              // Fallback to default prefix
              const prefix = `${formData.country}-WIP-`
              const finalCode = `${prefix}500`
              setFormData(prev => ({ ...prev, system_code: finalCode }))
              console.log('Generated WIP code with default prefix:', finalCode)
            }
          } else {
            // No existing WIP codes >= 500, start from 500
            const prefix = `${formData.country}-WIP-`
            const finalCode = `${prefix}500`
            setFormData(prev => ({ ...prev, system_code: finalCode }))
            console.log('No valid WIP codes found, starting from 500:', finalCode)
          }
        }
      } else {
        console.log('=== NORMAL PRODUCT LOGIC ===')
        // For non-WIP products, use country+vendor and exclude WIP products
        const matchingNonWIPProducts = products.filter(p => 
          p.country === formData.country && 
          (formData.vendor ? p.vendor === formData.vendor : !p.vendor) &&
          (!p.work_in_progress || p.work_in_progress !== 'WIP')
        )

        console.log('Normal Product Search - Country:', formData.country, 'Vendor:', formData.vendor)
        console.log('Normal Products found:', matchingNonWIPProducts.length)
        console.log('Normal Products:', matchingNonWIPProducts.map(p => ({ 
          code: p.system_code, 
          vendor: p.vendor,
          wip: p.work_in_progress 
        })))

        if (matchingNonWIPProducts.length === 0) {
          // First non-WIP product for this country/vendor combination
          console.log('No existing normal products found, manual input required')
          setFormData(prev => ({ ...prev, system_code: '' }))
        } else {
          // Find the highest non-WIP system_code number (excluding 500+ range)
          const nonWIPCodes = matchingNonWIPProducts
            .map(p => p.system_code)
            .filter(code => code && /\d+$/.test(code))
            .map(code => {
              const match = code.match(/(\d+)$/)
              return match ? parseInt(match[1]) : 0
            })
            .filter(num => !isNaN(num) && num < 500) // Only consider codes below 500

          console.log('Normal Codes found:', nonWIPCodes)

          if (nonWIPCodes.length > 0) {
            const maxCode = Math.max(...nonWIPCodes)
            const newCode = maxCode + 1
            console.log('Max normal code:', maxCode, 'New code:', newCode)
            
            // Don't let non-WIP codes reach 500 range
            if (newCode >= 500) {
              setFormData(prev => ({ ...prev, system_code: '' }))
              alert('Warning: Non-WIP product codes are approaching WIP range (500+). Please assign manually.')
              return
            }
            
            // Maintain the same prefix pattern and ensure 3-digit format
            const lastNonWIPProduct = matchingNonWIPProducts
              .filter(p => p.system_code && /\d+$/.test(p.system_code))
              .map(p => {
                const num = parseInt(p.system_code.match(/(\d+)$/)[1])
                return { ...p, numCode: num }
              })
              .filter(p => p.numCode < 500)
              .sort((a, b) => b.numCode - a.numCode)[0]

            if (lastNonWIPProduct) {
              const prefix = lastNonWIPProduct.system_code.replace(/\d+$/, '')
              // Format number with leading zeros (3 digits) for non-WIP
              const formattedCode = newCode.toString().padStart(3, '0')
              const finalCode = `${prefix}${formattedCode}`
              setFormData(prev => ({ ...prev, system_code: finalCode }))
              console.log('Generated normal code with existing prefix:', finalCode)
            } else {
              // Format as 3-digit number
              const formattedCode = newCode.toString().padStart(3, '0')
              setFormData(prev => ({ ...prev, system_code: formattedCode }))
              console.log('Generated normal code:', formattedCode)
            }
          } else {
            console.log('No valid normal codes found, manual input required')
            setFormData(prev => ({ ...prev, system_code: '' }))
          }
        }
      }
    } catch (error) {
      console.error('Error generating item code:', error)
      setFormData(prev => ({ ...prev, system_code: '' }))
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const handleCountryChange = (newCountry) => {
    setFilters(prev => ({
      ...prev,
      country: newCountry,
      vendor: '',
      type: ''
    }))
  }

  const handleVendorChange = (newVendor) => {
    setFilters(prev => ({
      ...prev,
      vendor: newVendor,
      type: ''
    }))
  }

  const handleWIPChange = (newWIP) => {
    setFilters(prev => ({
      ...prev,
      workInProgress: newWIP
    }))
  }

  const handleTypeChange = (newType) => {
    setFilters(prev => ({
      ...prev,
      type: newType
    }))
  }

  const handleStatusFilterChange = (newStatus) => {
    setFilters(prev => ({
      ...prev,
      status: newStatus
    }))
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.viet_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilters = (
      (!filters.country || product.country === filters.country) &&
      (!filters.vendor || product.vendor === filters.vendor) &&
      (!filters.workInProgress || product.work_in_progress === filters.workInProgress) &&
      (!filters.type || product.type === filters.type) &&
      (!filters.status || product.status === filters.status)
    )
    
    return matchesSearch && matchesFilters
  })

  const handleStatusUpdate = async (systemCode, newStatus) => {
    if (!canChangeStatus) {
      alert('No permission to change status')
      return
    }

    setUpdateLoading(true)
    
    try {
      // Get current date in English format
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Get user name from profile
      const userName = userProfile?.name || user?.email || 'Unknown User'

      // Find existing product to get current note and status
      const existingProduct = products.find(p => p.system_code === systemCode)
      const existingNote = existingProduct?.note || ''
      const oldStatus = existingProduct?.status || ''
      
      // Create status change note (no date/user as they're in separate fields)
      const changeNote = `Status changed from "${oldStatus}" to "${newStatus}"`
      const updatedNote = existingNote 
        ? `${existingNote}; ${changeNote}`
        : changeNote

      const { error } = await supabase
        .from('products')
        .update({ 
          status: newStatus,
          note: updatedNote,
          action_date: currentDate,
          user: userName
        })
        .eq('system_code', systemCode)

      if (error) {
        console.error('Error updating status:', error)
        alert('Error updating status')
        return
      }

      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.system_code === systemCode
            ? { 
                ...product, 
                status: newStatus, 
                note: updatedNote,
                action_date: currentDate,
                user: userName
              }
            : product
        )
      )
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = 'Status updated successfully!'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
      
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleAddProduct = () => {
    if (!canCreateProducts) {
      alert('No permission to create products')
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
    setIsNewCountry(false)
    setIsNewVendor(false)
    setIsNewType(false)
    setIsNewPackingSize(false)
    setShowModal(true)
  }

  const handleEditProduct = (product) => {
    if (!canEditProducts) {
      alert('No permission to edit products')
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
    setIsNewCountry(false)
    setIsNewVendor(false)
    setIsNewType(false)
    setIsNewPackingSize(false)
    setShowModal(true)
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
      // Don't regenerate code here - let useEffect handle it
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

    if (modalMode === 'add') {
      const existingProduct = products.find(p => p.system_code === formData.system_code.trim())
      if (existingProduct) {
        errors.system_code = 'Item code already exists'
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

    if (modalMode === 'add' && !canCreateProducts) {
      alert('No permission to create products')
      return
    }
    
    if (modalMode === 'edit' && !canEditProducts) {
      alert('No permission to edit products')
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

      if (modalMode === 'add') {
        // Add note for new product
        productData.note = `Created`
        
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()

        if (error) {
          console.error('Error adding product:', error)
          alert('Error adding product')
          return
        }

        setProducts(prev => [...prev, data[0]])
        alert('Product added successfully')
        
        // Refresh product list to get updated data
        await fetchProducts()
      } else {
        // Create detailed change log for edited product
        const changes = []
        const originalProduct = editingProduct

        // Check each field for changes
        if (originalProduct.product_name !== productData.product_name) {
          changes.push(`Product Name: "${originalProduct.product_name}" → "${productData.product_name}"`)
        }
        if (originalProduct.viet_name !== productData.viet_name) {
          changes.push(`Vietnamese Name: "${originalProduct.viet_name || ''}" → "${productData.viet_name || ''}"`)
        }
        if (originalProduct.type !== productData.type) {
          changes.push(`Type: "${originalProduct.type || ''}" → "${productData.type || ''}"`)
        }
        if (originalProduct.country !== productData.country) {
          changes.push(`Country: "${originalProduct.country || ''}" → "${productData.country || ''}"`)
        }
        if (originalProduct.vendor !== productData.vendor) {
          changes.push(`Vendor: "${originalProduct.vendor || ''}" → "${productData.vendor || ''}"`)
        }
        if (originalProduct.uom !== productData.uom) {
          changes.push(`UOM: "${originalProduct.uom || ''}" → "${productData.uom || ''}"`)
        }
        if (originalProduct.packing_size !== productData.packing_size) {
          changes.push(`Packing Size: "${originalProduct.packing_size || ''}" → "${productData.packing_size || ''}"`)
        }
        if (originalProduct.work_in_progress !== productData.work_in_progress) {
          changes.push(`Work in Progress: "${originalProduct.work_in_progress || ''}" → "${productData.work_in_progress || ''}"`)
        }
        if (originalProduct.status !== productData.status) {
          changes.push(`Status: "${originalProduct.status || ''}" → "${productData.status || ''}"`)
        }

        // Create note with changes only (no date/user as they're in separate fields)
        const existingNote = originalProduct.note || ''
        const changeNote = changes.length > 0 
          ? `Edited: ${changes.join('; ')}`
          : `Edited: No changes detected`
        
        productData.note = existingNote 
          ? `${existingNote}; ${changeNote}`
          : changeNote
        
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('system_code', editingProduct.system_code)

        if (error) {
          console.error('Error updating product:', error)
          alert('Error updating product')
          return
        }

        setProducts(prev =>
          prev.map(product =>
            product.system_code === editingProduct.system_code
              ? { ...product, ...productData }
              : product
          )
        )
        alert('Product updated successfully')
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!canDeleteProducts) {
      alert('No permission to delete products')
      return
    }

    const confirmMessage = `Are you sure you want to delete this product?\n\nItem Code: ${product.system_code}\nProduct Name: ${product.product_name}\n\nThis action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setUpdateLoading(true)

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('system_code', product.system_code)

      if (error) {
        console.error('Error deleting product:', error)
        alert('Error deleting product')
        return
      }

      setProducts(prev => prev.filter(p => p.system_code !== product.system_code))
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = 'Product deleted successfully!'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
      
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setUpdateLoading(false)
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
                onClick={handleAddProduct}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                + {t('addNewProduct')}
              </button>
            </PermissionGate>
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            >
              <option value="Active">{t('active')}</option>
              <option value="Inactive">{t('inactive')}</option>
              <option value="Discontinued">{t('discontinued')}</option>
            </select>

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
                onChange={(e) => handleTypeChange(e.target.value)}
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
                onChange={(e) => handleWIPChange(e.target.value)}
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
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {t('showing')} {filteredProducts.length} {t('of')} {products.length} {t('products')}
      </div>

      {/* Product table */}
      <div className="bg-white shadow rounded-lg" style={{ maxHeight: '70vh' }}>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 sticky left-0 bg-gray-50 z-20">
                  {t('itemCode')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-64 sticky left-32 bg-gray-50 z-20">
                  {showVietnamese ? t('vietnameseName') : t('productName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t('country')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  {t('vendor')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  {t('uom')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t('packingSize')}
                </th>
                {uniqueWIP.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    {t('workInProgress')}
                  </th>
                )}
                
                <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    {t('status')}
                  </th>
                </PermissionGate>
                
                <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT]} requireAll={false}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sticky right-0 bg-gray-50 z-20">
                    {t('actions')}
                  </th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 9l4 4L9 17" />
                      </svg>
                      <p className="text-lg font-medium">{t('noData')}</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters to see more results</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.system_code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                      {product.system_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 break-words sticky left-32 bg-white z-10">
                      {showVietnamese ? product.viet_name || product.product_name : product.product_name}
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
                    
                    <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <select
                          value={product.status || 'Active'}
                          onChange={(e) => handleStatusUpdate(product.system_code, e.target.value)}
                          disabled={updateLoading}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="Active">{t('active')}</option>
                          <option value="Inactive">{t('inactive')}</option>
                          <option value="Discontinued">{t('discontinued')}</option>
                        </select>
                      </td>
                    </PermissionGate>
                    
                    <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT]} requireAll={false}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky right-0 bg-white z-10">
                        <div className="flex space-x-2">
                          <PermissionGate permission={PERMISSIONS.PRODUCT_EDIT}>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              {t('edit')}
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
      </div>

      {/* Enhanced Modal */}
      {showModal && (
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
                          <div>
                            <input
                              type="text"
                              value={formData.country}
                              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                              placeholder="Enter new country name"
                              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                                formErrors.country ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                          </div>
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
                              <div>
                                <input
                                  type="text"
                                  value={formData.vendor}
                                  onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                                  placeholder="Enter new vendor name"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
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
                    {modalMode === 'add' && !isNewCountry && !isNewVendor && formData.country && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.work_in_progress === 'WIP' 
                          ? 'Auto-generated for WIP products (Country + WIP, starts from 500)'
                          : 'Auto-generated for regular products (Country + Vendor, 001-499)'
                        }
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
                          <div>
                            <input
                              type="text"
                              value={formData.type}
                              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                              placeholder="Enter new type"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
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
                          <div>
                            <input
                              type="text"
                              value={formData.packing_size}
                              onChange={(e) => setFormData(prev => ({ ...prev, packing_size: e.target.value }))}
                              placeholder="Enter new packing size"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
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
      )}
    </div>
  )
}

export default ProductList
