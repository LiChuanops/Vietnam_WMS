import React, { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { usePermissions, PRODUCT_PERMISSIONS } from '../context/PermissionContext'
import { supabase } from '../supabase/client'

// Import child components
import ProductFilters from './product/ProductFilters'
import ProductForm from './product/ProductForm'
import ProductTable from './product/ProductTable'

const ProductList = () => {
  const { t } = useLanguage()
  const { user, userProfile } = useAuth()
  const { 
    hasPermission, 
    canAddProducts, 
    canEditProducts, 
    canChangeProductStatus,
    canViewAccountCode,
    canEditAccountCode,
    PermissionGate,
    loading: permissionLoading 
  } = usePermissions()

  // Main state
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState(false)
  
  // UI state
  const [showVietnamese, setShowVietnamese] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAccountCode, setShowAccountCode] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    country: '',
    vendor: '',
    workInProgress: '',
    type: '',
    status: 'Active'
  })
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [editingProduct, setEditingProduct] = useState(null)

  // Computed values for filters
  const uniqueCountries = [...new Set(products.map(p => p.country).filter(Boolean))]
  
  const filteredVendors = filters.country 
    ? [...new Set(products
        .filter(p => p.country === filters.country)
        .map(p => p.vendor)
        .filter(Boolean)
      )]
    : [...new Set(products.map(p => p.vendor).filter(Boolean))]
  
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

  const emptyAccountCodeCount = products.filter(p => !p.account_code).length

  // Filtered products for display
  const filteredAndSortedProducts = products.filter(product => {
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
  }).sort((a, b) => {
    if (showAccountCode) {
      if (!a.account_code && b.account_code) return -1
      if (a.account_code && !b.account_code) return 1
    }
    // Default sort by system_code if no other sorting is applied
    return a.system_code.localeCompare(b.system_code)
  })

  // Initialize component
  useEffect(() => {
    fetchProducts()
    
    // Keyboard shortcuts
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

  // Data fetching
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

  // Filter handlers
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

  // Product CRUD operations
  const handleAddProduct = () => {
    if (!canAddProducts()) {
      alert('No permission to create products')
      return
    }

    setModalMode('add')
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleEditProduct = (product) => {
    if (!canEditProducts()) {
      alert('No permission to edit products')
      return
    }

    setModalMode('edit')
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleAccountCodeUpdate = async (systemCode, newAccountCode) => {
    if (!canEditAccountCode()) {
      alert('No permission to edit account codes')
      return
    }

    setUpdateLoading(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({ account_code: newAccountCode })
        .eq('system_code', systemCode)

      if (error) {
        console.error('Error updating account code:', error)
        alert('Error updating account code')
        return
      }

      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.system_code === systemCode
            ? { ...product, account_code: newAccountCode }
            : product
        )
      )
      showNotification('Account code updated successfully!', 'success')
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleStatusUpdate = async (systemCode, newStatus) => {
    if (!canChangeProductStatus()) {
      alert('No permission to change product status')
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
      
      // Create status change note
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
      
      showNotification('Status updated successfully!', 'success')
      
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Form submission handler
  const handleFormSubmit = async (productData, mode, originalProduct) => {
    try {
      if (mode === 'add') {
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
        showNotification('Product added successfully!', 'success')
        
        // Refresh product list to get updated data
        await fetchProducts()
      } else {
        // Create detailed change log for edited product
        const changes = []

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

        // Create note with changes
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
          .eq('system_code', originalProduct.system_code)

        if (error) {
          console.error('Error updating product:', error)
          alert('Error updating product')
          return
        }

        setProducts(prev =>
          prev.map(product =>
            product.system_code === originalProduct.system_code
              ? { ...product, ...productData }
              : product
          )
        )
        showNotification('Product updated successfully!', 'success')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      throw error // Re-throw to let form handle the error
    }
  }

  // Utility function for notifications
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div')
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg z-50`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  // Loading states
  if (loading || permissionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loading')}</span>
      </div>
    )
  }

  // Permission check
  if (!hasPermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_LIST)) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-lg text-gray-500">You don't have permission to view the product list.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Filters Section */}
      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showVietnamese={showVietnamese}
        setShowVietnamese={setShowVietnamese}
        showAccountCode={showAccountCode}
        onToggleAccountCode={() => setShowAccountCode(prev => !prev)}
        emptyAccountCodeCount={emptyAccountCodeCount}
        filters={filters}
        onCountryChange={handleCountryChange}
        onVendorChange={handleVendorChange}
        onTypeChange={handleTypeChange}
        onWIPChange={handleWIPChange}
        onStatusFilterChange={handleStatusFilterChange}
        onAddProduct={handleAddProduct}
        uniqueCountries={uniqueCountries}
        filteredVendors={filteredVendors}
        filteredTypes={filteredTypes}
        uniqueWIP={uniqueWIP}
        filteredProductsCount={filteredAndSortedProducts.length}
        totalProductsCount={products.length}
        products={filteredAndSortedProducts}
        // 传递权限检查函数
        canAddProducts={canAddProducts}
        canViewAccountCode={canViewAccountCode}
      />

      {/* Product Table */}
      <ProductTable
        filteredProducts={filteredAndSortedProducts}
        showVietnamese={showVietnamese}
        showAccountCode={showAccountCode}
        onAccountCodeUpdate={handleAccountCodeUpdate}
        uniqueWIP={uniqueWIP}
        updateLoading={updateLoading}
        onStatusUpdate={handleStatusUpdate}
        onEditProduct={handleEditProduct}
        // 传递权限检查函数
        canEditProducts={canEditProducts}
        canChangeProductStatus={canChangeProductStatus}
        canEditAccountCode={canEditAccountCode}
      />

      {/* Product Form Modal */}
      {showModal && (
        <ProductForm
          showModal={showModal}
          setShowModal={setShowModal}
          modalMode={modalMode}
          editingProduct={editingProduct}
          products={products}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}

export default ProductList
