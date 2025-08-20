import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabase/client'
import ProductSelectionFilters from './shared/ProductSelectionFilters'
import CustomDeclarationTable from './customDeclaration/CustomDeclarationTable'
import EmptyState from './customDeclaration/EmptyState'

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
      // 获取有库存的产品，同时获取 customer_code 和 uom
      const { data, error } = await supabase
        .from('current_inventory')
        .select(`
          *,
          products!inner (
            customer_code,
            uom
          )
        `)
        .gt('current_stock', 0)
        .order('product_name')

      if (error) {
        console.error('Error fetching available products:', error)
        return
      }

      // 重构数据结构，将 products 表的字段提升到顶层
      const enrichedData = data.map(item => ({
        ...item,
        customer_code: item.products?.customer_code || '',
        uom: item.products?.uom || 0
      }))

      setAvailableProducts(enrichedData || [])
    } catch (error) {
      console.error('Error:', error)
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

    const cartonWeight = netWeight * 0.65
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

      // 保存到数据库的逻辑将在下一部分提供
      console.log('Data to save:', {
        poNumber,
        declarationDate,
        selectedProducts,
        summary
      })

      // 临时成功提示
      alert('Custom Declaration Form saved successfully!')
      clearCustomDeclarationData()
      
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
        <span className="ml-3 text-gray-600">Loading available products...</span>
      </div>
    )
  }

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
          <EmptyState />
        )}
      </form>
    </div>
  )
}

export default CustomDeclarationForm
