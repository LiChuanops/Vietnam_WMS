import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'
import ProductSelectionFilters from './shared/ProductSelectionFilters'
import ShipmentInfoForm from './outbound/ShipmentInfoForm'
import SelectedProductsTable from './outbound/SelectedProductsTable'
import EmptyState from './outbound/EmptyState'

const OutboundTransactions = ({ outboundData, setOutboundData, clearOutboundData }) => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const nextItemId = useRef(0)

  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  // 从父组件获取状态
  const { selectedProducts, shipmentInfo, productFilters, showProductList } = outboundData

  useEffect(() => {
    fetchAvailableProducts()
  }, [])

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('current_inventory')
        .select('*')
        .gt('current_stock', 0)
        .order('product_name')

      if (error) {
        console.error('Error fetching available products:', error)
        return
      }

      setAvailableProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 更新状态的辅助函数
  const updateOutboundData = (updates) => {
    setOutboundData(prev => ({ ...prev, ...updates }))
  }

  const updateProductFilters = (filtersOrFunction) => {
    if (typeof filtersOrFunction === 'function') {
      // 如果传入的是函数，先获取当前状态，然后应用函数
      const newFilters = filtersOrFunction(productFilters)
      updateOutboundData({ productFilters: newFilters })
    } else {
      // 如果传入的是对象，直接更新
      updateOutboundData({ productFilters: filtersOrFunction })
    }
  }

  const updateShowProductList = (show) => {
    updateOutboundData({ showProductList: show })
  }

  const updateShipmentInfo = (info) => {
    updateOutboundData({ shipmentInfo: info })
  }

  const updateSelectedProducts = (productsOrFunction) => {
    if (typeof productsOrFunction === 'function') {
        setOutboundData(prevOutboundData => {
            const newSelectedProducts = productsOrFunction(prevOutboundData.selectedProducts);
            return {
                ...prevOutboundData,
                selectedProducts: newSelectedProducts
            };
        });
    } else {
        setOutboundData(prevOutboundData => ({
            ...prevOutboundData,
            selectedProducts: productsOrFunction
        }));
    }
  }

  // Filter products for selection
  const filteredProducts = availableProducts.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesSearch = !productFilters.search || 
      product.product_name?.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.product_id?.toLowerCase().includes(productFilters.search.toLowerCase())
    
    return matchesCountry && matchesVendor && matchesType && matchesSearch
  })

  const addProductToSelection = (productId) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return

    const newProduct = {
      uniqueId: nextItemId.current++,
      sn: selectedProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      available_stock: product.current_stock,
      batch_number: '',
      quantity: '',
      isManual: false
    }

    updateSelectedProducts([...selectedProducts, newProduct])
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return true // 手动添加的产品跳过验证
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedProducts.length === 0) {
      alert(t('pleaseAddAtLeastOneProduct'))
      return
    }

    // Validate all quantities and batch numbers
    for (let product of selectedProducts) {
      if (!product.quantity || parseFloat(product.quantity) <= 0) {
        alert(`${t('pleaseEnterQuantityFor')} ${product.product_name}`)
        return
      }
      if (!product.batch_number.trim()) {
        alert(`${t('pleaseEnterBatchNumberFor')} ${product.product_name}`)
        return
      }
      // 只对系统产品进行库存验证
      if (!product.isManual && !validateQuantity(product.product_id, product.quantity)) {
        alert(`${t('insufficientStockFor')} ${product.product_name}! ${t('availableStock')}: ${product.available_stock}`)
        return
      }
    }

    setFormLoading(true)

    try {
      const transactionDate = new Date().toISOString().split('T')[0]
      
      const shipmentNotes = `${t('shipment')}: ${shipmentInfo.shipment || 'N/A'}, ${t('containerNumber')}: ${shipmentInfo.containerNumber || 'N/A'}, ${t('sealNo')}: ${shipmentInfo.sealNo || 'N/A'}, ${t('etd')}: ${shipmentInfo.etd || 'N/A'}, ${t('eta')}: ${shipmentInfo.eta || 'N/A'}, ${t('poNumber')}: ${shipmentInfo.poNumber || 'N/A'}`

      const transactions = selectedProducts.map(product => ({
        product_id: product.product_id,
        transaction_type: 'OUT',
        quantity: parseFloat(product.quantity),
        unit_price: null,
        total_amount: null,
        transaction_date: transactionDate,
        reference_number: null,
        notes: `${shipmentNotes}, ${t('batchNo')}: ${product.batch_number}${product.isManual ? ` (${t('manualEntry')})` : ''}`,
        batch_number: product.batch_number,
        created_by: userProfile?.id
      }))

      const { error } = await supabase
        .from('inventory_transactions')
        .insert(transactions)

      if (error) {
        console.error('Error adding transactions:', error)
        alert('Error adding transactions: ' + error.message)
        return
      }

      // 清除所有数据
      clearOutboundData()
      
      await fetchAvailableProducts()
      
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = t('outboundTransactionsAddedSuccessfully')
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)

    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">{t('loadingAvailableProducts')}</span>
      </div>
    )
  }

  if (!canCreateTransaction) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('accessDenied')}</h1>
        <p className="text-lg text-gray-500">{t('noPermissionToAddOutbound')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 货运信息表单组件 */}
        <ShipmentInfoForm 
          shipmentInfo={shipmentInfo}
          setShipmentInfo={updateShipmentInfo}
        />

        {/* 使用共用的产品选择过滤器组件 */}
        <ProductSelectionFilters
          availableProducts={availableProducts}
          productFilters={productFilters}
          setProductFilters={updateProductFilters}
          showProductList={showProductList}
          setShowProductList={updateShowProductList}
          selectedProducts={selectedProducts}
          clearAllData={clearOutboundData}
          title={t('productSelection')}
        />

        {/* Product List */}
        {productFilters.country && showProductList && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-700">
                {t('availableProducts')} {productFilters.country && `${t('countryFilter')} ${productFilters.country}`}
                {filteredProducts.length > 0 && ` (${filteredProducts.length} ${t('foundProducts')})`}
              </h5>
              <button
                type="button"
                onClick={() => updateShowProductList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('code')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vendor')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packing')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('availableStock')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.product_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product_id}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.vendor}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.type}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.packing_size || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {parseFloat(product.current_stock || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => addProductToSelection(product.product_id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            {t('add')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>{t('noProductsFoundMatching')}</p>
                {productFilters.search && (
                  <p className="text-xs mt-1">{t('tryAdjustingFilters')}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 已选产品表格组件 或 空状态组件 */}
        {selectedProducts.length > 0 ? (
          <SelectedProductsTable
            selectedProducts={selectedProducts}
            setSelectedProducts={updateSelectedProducts}
            availableProducts={availableProducts}
            formLoading={formLoading}
            nextItemId={nextItemId}
          />
        ) : (
          <EmptyState />
        )}
      </form>
    </div>
  )
}

export default OutboundTransactions
