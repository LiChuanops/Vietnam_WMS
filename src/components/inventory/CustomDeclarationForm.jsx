import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/client'
import ProductSelectionFilters from './shared/ProductSelectionFilters'
import CustomDeclarationTable from './customDeclaration/CustomDeclarationTable'

const CustomDeclarationForm = ({ customDeclarationData, setCustomDeclarationData, clearCustomDeclarationData }) => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const nextItemId = useRef(0)

  // 从父组件获取状态
  const { selectedProducts, poNumber, declarationDate, productFilters, showProductList } = customDeclarationData

  useEffect(() => {
    fetchAvailableProducts()
  }, [])

  const fetchAvailableProducts = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching from current_inventory view...')
      
      // 由于 current_inventory 是视图，我们可以直接查询所有需要的字段
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('current_inventory')
        .select(`
          product_id,
          product_name,
          viet_name,
          country,
          vendor,
          type,
          packing_size,
          uom,
          current_stock
        `)
        .gt('current_stock', 0)
        .order('product_name')

      if (inventoryError) {
        console.error('Error fetching from current_inventory view:', inventoryError)
        
        // 如果视图查询失败，回退到直接查询 products 表
        console.log('Falling back to products table...')
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('system_code, product_name, viet_name, country, vendor, type, packing_size, uom, customer_code, account_code')
          .eq('status', 'Active')
          .order('product_name')

        if (productsError) {
          console.error('Error fetching from products table:', productsError)
          return
        }

        // 转换 products 数据格式以匹配 current_inventory 格式
        const transformedData = productsData.map(item => ({
          product_id: item.system_code,
          product_name: item.product_name,
          viet_name: item.viet_name,
          country: item.country,
          vendor: item.vendor,
          type: item.type,
          packing_size: item.packing_size,
          current_stock: 999, // 假设有库存，因为没有库存计算
          uom: item.uom || 0,
          customer_code: item.customer_code || '', // 🔥 添加 customer_code
          account_code: item.account_code || '' // 🔥 添加 account_code
        }))

        setAvailableProducts(transformedData)
        return
      }

      // 成功从视图获取数据
      if (inventoryData && inventoryData.length > 0) {
        // 🔥 关键修改：获取 customer_code 和 account_code 信息（因为视图中没有包含这些字段）
        try {
          const productIds = inventoryData.map(item => item.product_id)
          const { data: additionalData, error: additionalError } = await supabase
            .from('products')
            .select('system_code, customer_code, account_code')
            .in('system_code', productIds)

          if (additionalError) {
            console.warn('Could not fetch customer_code and account_code:', additionalError)
          }

          // 合并数据，添加 customer_code 和 account_code
          const enrichedData = inventoryData.map(item => {
            const additionalInfo = additionalData?.find(p => p.system_code === item.product_id)
            return {
              ...item,
              customer_code: additionalInfo?.customer_code || '',
              account_code: additionalInfo?.account_code || ''
            }
          })

          setAvailableProducts(enrichedData)
        } catch (error) {
          console.warn('Error fetching customer_code and account_code:', error)
          // 即使获取 customer_code 和 account_code 失败，也使用库存数据
          const dataWithEmptyCodes = inventoryData.map(item => ({
            ...item,
            customer_code: '',
            account_code: ''
          }))
          setAvailableProducts(dataWithEmptyCodes)
        }
      } else {
        console.log('No products with stock found')
        setAvailableProducts([])
      }

    } catch (error) {
      console.error('Unexpected error in fetchAvailableProducts:', error)
      
      // 最终回退方案：使用 products 表
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('system_code, product_name, viet_name, country, vendor, type, packing_size, uom, customer_code, account_code')
          .eq('status', 'Active')
          .order('product_name')

        if (!fallbackError && fallbackData) {
          const transformedData = fallbackData.map(item => ({
            product_id: item.system_code,
            product_name: item.product_name,
            viet_name: item.viet_name,
            country: item.country,
            vendor: item.vendor,
            type: item.type,
            packing_size: item.packing_size,
            current_stock: 999,
            uom: item.uom || 0,
            customer_code: item.customer_code || '', // 🔥 添加 customer_code
            account_code: item.account_code || '' // 🔥 添加 account_code
          }))
          setAvailableProducts(transformedData)
        } else {
          setAvailableProducts([])
        }
      } catch (fallbackError) {
        console.error('All attempts failed:', fallbackError)
        setAvailableProducts([])
      }
    } finally {
      setLoading(false)
    }
  }

  // 更新状态的辅助函数
  const updateCustomDeclarationData = (updates) => {
    setCustomDeclarationData(prev => ({ ...prev, ...updates }))
  }

  const updateProductFilters = (filtersOrFunction) => {
    if (typeof filtersOrFunction === 'function') {
      const newFilters = filtersOrFunction(productFilters)
      updateCustomDeclarationData({ productFilters: newFilters })
    } else {
      updateCustomDeclarationData({ productFilters: filtersOrFunction })
    }
  }

  const updateShowProductList = (show) => {
    updateCustomDeclarationData({ showProductList: show })
  }

  const updatePONumber = (po) => {
    updateCustomDeclarationData({ poNumber: po })
  }

  const updateDeclarationDate = (date) => {
    updateCustomDeclarationData({ declarationDate: date })
  }

  const updateSelectedProducts = (productsOrFunction) => {
    if (typeof productsOrFunction === 'function') {
      setCustomDeclarationData(prevData => {
        const newSelectedProducts = productsOrFunction(prevData.selectedProducts)
        return {
          ...prevData,
          selectedProducts: newSelectedProducts
        }
      })
    } else {
      setCustomDeclarationData(prevData => ({
        ...prevData,
        selectedProducts: productsOrFunction
      }))
    }
  }

  // Filter products for selection
  const filteredProducts = availableProducts.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesPackingSize = !productFilters.packing_size || product.packing_size === productFilters.packing_size
    
    return matchesCountry && matchesVendor && matchesType && matchesPackingSize
  })

  const addProductToSelection = (productId) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return

    const newProduct = {
      uniqueId: nextItemId.current++,
      sn: selectedProducts.length + 1,
      product_id: productId,
      customer_code: product.customer_code || '',
      account_code: product.account_code || '', // 🔥 添加 account_code（不显示，但保存）
      product_name: product.product_name,
      packing_size: product.packing_size,
      available_stock: product.current_stock,
      batch_number: '',
      quantity: '',
      uom: product.uom || 0,
      total_weight: 0,
      isManual: false
    }

    updateSelectedProducts([...selectedProducts, newProduct])
  }

  // 计算重量相关的辅助函数
  const calculateTotalWeight = (quantity, uom) => {
    // 检查 quantity 是否为纯数字
    const numericQuantity = parseFloat(quantity)
    if (isNaN(numericQuantity) || !uom) {
      return 0
    }
    return numericQuantity * parseFloat(uom)
  }

  // 计算汇总数据
  const calculateSummary = () => {
    const totalQuantity = selectedProducts.reduce((sum, product) => {
      const numericQuantity = parseFloat(product.quantity)
      return sum + (isNaN(numericQuantity) ? 0 : numericQuantity)
    }, 0)

    const netWeight = selectedProducts.reduce((sum, product) => {
      return sum + (product.total_weight || 0)
    }, 0)

    // 修改计算公式：Carton Weight = Total Quantity × 0.65
    const cartonWeight = totalQuantity * 0.65
    const grossWeight = netWeight + cartonWeight

    return {
      totalQuantity,
      netWeight,
      cartonWeight,
      grossWeight
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedProducts.length === 0) {
      alert('Please add at least one product')
      return
    }

    if (!poNumber.trim()) {
      alert('Please enter PO Number')
      return
    }

    // 验证所有产品都有必填字段
    for (let product of selectedProducts) {
      if (!product.quantity || parseFloat(product.quantity) <= 0) {
        alert(`Please enter quantity for ${product.product_name}`)
        return
      }
      if (!product.batch_number.trim()) {
        alert(`Please enter batch number for ${product.product_name}`)
        return
      }
    }

    setFormLoading(true)

    try {
      const summary = calculateSummary()

      // 1. 保存主记录到 custom_declarations 表
      const { data: declarationData, error: declarationError } = await supabase
        .from('custom_declarations')
        .insert([{
          po_number: poNumber.trim(),
          declaration_date: declarationDate,
          total_quantity: summary.totalQuantity,
          net_weight: summary.netWeight,
          carton_weight: summary.cartonWeight,
          gross_weight: summary.grossWeight,
          created_by: userProfile?.id
        }])
        .select()
        .single()

      if (declarationError) {
        console.error('Error saving custom declaration:', declarationError)
        alert('Error saving custom declaration: ' + declarationError.message)
        return
      }

      // 2. 保存产品明细到 custom_declaration_items 表
      const declarationItems = selectedProducts.map(product => ({
        declaration_id: declarationData.id,
        serial_number: product.sn,
        product_id: product.product_id,
        customer_code: product.customer_code || null,
        account_code: product.account_code || null, // 🔥 保存 account_code
        product_name: product.product_name,
        packing_size: product.packing_size || null,
        batch_number: product.batch_number,
        quantity: product.quantity,
        uom: product.uom || null,
        total_weight: product.total_weight || null,
        is_manual: product.isManual || false
      }))

      const { error: itemsError } = await supabase
        .from('custom_declaration_items')
        .insert(declarationItems)

      if (itemsError) {
        console.error('Error saving declaration items:', itemsError)
        alert('Error saving declaration items: ' + itemsError.message)
        return
      }

      // 3. 成功提示和清理
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = `Custom Declaration Form "${poNumber}" saved successfully!`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)

      // 清除表单数据
      clearCustomDeclarationData()
      
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error occurred while saving')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading available products...</span>
      </div>
    )
  }

  // 临时的内联 EmptyState 组件
  const EmptyStateInline = () => (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
      <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Selected</h3>
      <p className="text-gray-500 mb-4">Select a country from the filters above to view available products for your custom declaration form.</p>
      <p className="text-sm text-gray-400">Once you select a country, products will appear below for you to add to your declaration.</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product Selection Filters */}
        <ProductSelectionFilters
          availableProducts={availableProducts}
          productFilters={productFilters}
          setProductFilters={updateProductFilters}
          showProductList={showProductList}
          setShowProductList={updateShowProductList}
          selectedProducts={selectedProducts}
          clearAllData={clearCustomDeclarationData}
          title="Product Selection"
        />

        {/* Product List */}
        {productFilters.country && showProductList && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h5 className="text-sm font-medium text-gray-700">
                Available Products {productFilters.country && `for ${productFilters.country}`}
                {filteredProducts.length > 0 && ` (${filteredProducts.length} products found)`}
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
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packing</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <tr key={product.product_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product_id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.customer_code || '-'}
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
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No products found matching the selected criteria.</p>
                {(productFilters.country || productFilters.vendor || productFilters.type || productFilters.packing_size) && (
                  <p className="text-xs mt-1">Try adjusting your filters.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Products Table or Empty State */}
        {selectedProducts.length > 0 ? (
          <CustomDeclarationTable
            selectedProducts={selectedProducts}
            setSelectedProducts={updateSelectedProducts}
            availableProducts={availableProducts}
            formLoading={formLoading}
            nextItemId={nextItemId}
            calculateTotalWeight={calculateTotalWeight}
            calculateSummary={calculateSummary}
            poNumber={poNumber}
            setPONumber={updatePONumber}
            declarationDate={declarationDate}
            setDeclarationDate={updateDeclarationDate}
          />
        ) : (
          <EmptyStateInline />
        )}
      </form>
    </div>
  )
}

export default CustomDeclarationForm
