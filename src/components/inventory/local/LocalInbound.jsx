import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDateToDDMMYYYY } from '../../../utils/dateUtils'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../supabase/client'
import ProductSelectionFilters from '../shared/ProductSelectionFilters'
import PackageConversion from '../PackageConversion' // 导入新组件

const formatToCtnPkt = (totalPackets, piecesPerCarton) => {
  if (!totalPackets || !piecesPerCarton || piecesPerCarton <= 0) {
    return '';
  }
  const ctn = Math.floor(totalPackets / piecesPerCarton);
  const pkt = totalPackets % piecesPerCarton;
  return `(= ${ctn} ctn ${pkt} pkt)`;
};

const LocalInbound = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const [products, setProducts] = useState([])
  const [inboundType, setInboundType] = useState('standard') // 'standard' or 'packageConversion'
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)

  // Define state for inbound data
  const [inboundData, setInboundData] = useState({
    bulkProducts: [],
    productFilters: {
      country: 'Vietnam',
      vendor: '',
      type: '',
      search: ''
    },
    showProductList: true,
    transactionDate: new Date().toISOString().split('T')[0]
  });

  // 从父组件获取状态
  const { bulkProducts, productFilters, showProductList, transactionDate } = inboundData

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('system_code, product_name, country, vendor, type, packing_size, pieces_per_carton')
        .eq('status', 'Active')
        .eq('country', 'Vietnam')
        .order('product_name')

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

  // 更新状态的辅助函数
  const updateInboundData = (updates) => {
    setInboundData(prev => ({ ...prev, ...updates }))
  }

  const updateProductFilters = (filtersOrFunction) => {
    if (typeof filtersOrFunction === 'function') {
      // 如果传入的是函数，先获取当前状态，然后应用函数
      const newFilters = filtersOrFunction(productFilters)
      updateInboundData({ productFilters: newFilters })
    } else {
      // 如果传入的是对象，直接更新
      updateInboundData({ productFilters: filtersOrFunction })
    }
  }

  const updateShowProductList = (show) => {
    updateInboundData({ showProductList: show })
  }

  const updateTransactionDate = (date) => {
    updateInboundData({ transactionDate: date })
  }

  const clearInboundData = () => {
    setInboundData({
      bulkProducts: [],
      productFilters: {
        country: '',
        vendor: '',
        type: '',
        search: ''
      },
      showProductList: true,
      transactionDate: new Date().toISOString().split('T')[0]
    });
  };

  // 获取日期限制
  const getMinDate = () => {
    const today = new Date()
    const currentMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0')
    return currentMonth + '-01' // 当月1号
  }

  const addProductToBulk = (productId) => {
    const product = products.find(p => p.system_code === productId)
    if (!product) return

    const newProduct = {
      sn: bulkProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      pieces_per_carton: product.pieces_per_carton,
      quantity: '',
      notes: ''
    }

    updateInboundData({
      bulkProducts: [...bulkProducts, newProduct]
    })
  }

  const removeProductFromBulk = (index) => {
    const updated = bulkProducts.filter((_, i) => i !== index)
    const renumbered = updated.map((item, i) => ({ ...item, sn: i + 1 }))
    updateInboundData({ bulkProducts: renumbered })
  }

  const updateProductInBulk = (index, field, value) => {
    const updated = bulkProducts.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    updateInboundData({ bulkProducts: updated })
  }

  // Filter products for selection
  const filteredProducts = products.filter(product => {
    const matchesCountry = !productFilters.country || product.country === productFilters.country
    const matchesVendor = !productFilters.vendor || product.vendor === productFilters.vendor
    const matchesType = !productFilters.type || product.type === productFilters.type
    const matchesPackingSize = !productFilters.packing_size || product.packing_size === productFilters.packing_size

    return matchesCountry && matchesVendor && matchesType && matchesPackingSize
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (bulkProducts.length === 0) {
      alert(t('pleaseAddAtLeastOneProduct'))
      return
    }

    // Validate all products have quantities
    for (let product of bulkProducts) {
      if (!product.quantity || parseFloat(product.quantity) <= 0) {
        alert(`${t('pleaseEnterQuantityFor')} ${product.product_name}`)
        return
      }
    }

    setFormLoading(true)

    try {
      const transactions = bulkProducts.map(product => ({
        product_id: product.product_id,
        transaction_type: 'IN',
        quantity: parseFloat(product.quantity),
        transaction_date: transactionDate,
        reference_number: null,
        notes: product.notes.trim() || null,
        created_by: userProfile?.id
      }));

      const { error } = await supabase
        .from('local_inventory')
        .insert(transactions)

      if (error) {
        console.error('Error adding transactions:', error)
        alert(t('errorAddingTransactions') + error.message)
        return
      }

      // 清除表单数据
      clearInboundData()

      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
      notification.textContent = `${transactions.length} ${t('inboundTransactionsAddedSuccessfully')}`
      document.body.appendChild(notification)

      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)

    } catch (error) {
      console.error('Error:', error)
      alert(t('unexpectedError'))
    } finally {
      setFormLoading(false)
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
    <div className="space-y-6">
      {/* Inbound Type Selection */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="inboundType"
              value="standard"
              checked={inboundType === 'standard'}
              onChange={() => setInboundType('standard')}
              className="form-radio h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">{t('standardInbound')}</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="inboundType"
              value="packageConversion"
              checked={inboundType === 'packageConversion'}
              onChange={() => setInboundType('packageConversion')}
              className="form-radio h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">{t('packageConversion')}</span>
          </label>
        </div>
      </div>

      {inboundType === 'standard' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 使用共用的 ProductSelectionFilters 组件 */}
          <ProductSelectionFilters
            availableProducts={products}
            productFilters={productFilters}
            setProductFilters={updateProductFilters}
            showProductList={showProductList}
            setShowProductList={updateShowProductList}
            selectedProducts={bulkProducts}
            clearAllData={clearInboundData}
            title={t('productSelection')}
          />

          {/* Product List - 可控制显示/隐藏 */}
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
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map(product => (
                        <tr key={product.system_code} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.system_code}
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
                          <td className="px-3 py-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => addProductToBulk(product.system_code)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
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
                  {(productFilters.country || productFilters.vendor || productFilters.type || productFilters.packing_size) && (
                    <p className="text-xs mt-1">{t('tryAdjustingFilters')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected Products Table */}
          {bulkProducts.length > 0 ? (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                <h5 className="text-sm font-medium text-gray-700">{t('selectedProductsForInbound')}</h5>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600">{t('transactionDate')}:</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => updateTransactionDate(e.target.value)}
                    min={getMinDate()}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('serialNumber')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productCode')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('productName')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('packing')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quantity')} ({t('pkt')})</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('notes')}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkProducts.map((product, index) => (
                      <tr key={`${product.product_id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.sn}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.product_id}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {product.packing_size || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={product.quantity}
                              onChange={(e) => updateProductInBulk(index, 'quantity', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder={t('totalPackets')}
                            />
                            <span className="text-xs text-gray-500">
                              {formatToCtnPkt(product.quantity, product.pieces_per_carton)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <input
                            type="text"
                            value={product.notes}
                            onChange={(e) => updateProductInBulk(index, 'notes', e.target.value)}
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder={t('notes')}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => removeProductFromBulk(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            {t('remove')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Submit */}
              <div className="bg-green-50 px-4 py-3 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('totalProducts')}: {bulkProducts.length}</span>
                  <span className="mx-2">|</span>
                  <span className="font-medium">{t('totalQuantity')}: {bulkProducts.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0).toLocaleString()} {t('pkts')}</span>
                  <span className="mx-2">|</span>
                  <span className="font-medium">{t('date')}: {formatDateToDDMMYYYY(transactionDate)}</span>
                </div>
                <button
                  type="submit"
                  disabled={formLoading || bulkProducts.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {formLoading
                    ? t('processing')
                    : `${t('addInboundTransactions')} ${bulkProducts.length}`
                  }
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noProductsSelected')}</h3>
              <p className="text-gray-500 mb-4">{t('selectCountryFromFilters')}</p>
              <p className="text-sm text-gray-400">{t('onceSelectCountry')}</p>
            </div>
          )}
        </form>
      )}

      {inboundType === 'packageConversion' && <PackageConversion />}
    </div>
  )
}

export default LocalInbound
