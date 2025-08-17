import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'
import { supabase } from '../../supabase/client'
import ProductSelectionFilters from './shared/ProductSelectionFilters'

const OutboundTransactions = () => {
  const { t } = useLanguage()
  const { userProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Shipment Information - 使用 localStorage 保持状态
  const [shipmentInfo, setShipmentInfo] = useState(() => {
    const saved = localStorage.getItem('outbound_shipment_info')
    return saved ? JSON.parse(saved) : {
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    }
  })

  // Selected Products for Outbound - 使用 localStorage 保持状态
  const [selectedProducts, setSelectedProducts] = useState(() => {
    const saved = localStorage.getItem('outbound_selected_products')
    return saved ? JSON.parse(saved) : []
  })
  
  // Product Selection Filters - 使用 localStorage 保持状态
  const [productFilters, setProductFilters] = useState(() => {
    const saved = localStorage.getItem('outbound_product_filters')
    return saved ? JSON.parse(saved) : {
      country: '',
      vendor: '',
      type: '',
      search: ''
    }
  })

  // 控制产品列表显示/隐藏
  const [showProductList, setShowProductList] = useState(() => {
    const saved = localStorage.getItem('outbound_show_product_list')
    return saved ? JSON.parse(saved) : true
  })

  // 手动添加模式
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [manualProduct, setManualProduct] = useState({
    product_id: '',
    product_name: '',
    packing_size: '',
    batch_number: '',
    quantity: ''
  })

  const [formLoading, setFormLoading] = useState(false)
  const canCreateTransaction = hasPermission(PERMISSIONS.INVENTORY_EDIT)

  // 保存状态到 localStorage
  useEffect(() => {
    localStorage.setItem('outbound_shipment_info', JSON.stringify(shipmentInfo))
  }, [shipmentInfo])

  useEffect(() => {
    localStorage.setItem('outbound_selected_products', JSON.stringify(selectedProducts))
  }, [selectedProducts])

  useEffect(() => {
    localStorage.setItem('outbound_product_filters', JSON.stringify(productFilters))
  }, [productFilters])

  useEffect(() => {
    localStorage.setItem('outbound_show_product_list', JSON.stringify(showProductList))
  }, [showProductList])

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
      sn: selectedProducts.length + 1,
      product_id: productId,
      product_name: product.product_name,
      packing_size: product.packing_size,
      available_stock: product.current_stock,
      batch_number: '',
      quantity: ''
    }

    setSelectedProducts(prev => [...prev, newProduct])
  }

  // 手动添加产品
  const addManualProduct = () => {
    if (!manualProduct.product_id.trim() || !manualProduct.product_name.trim()) {
      alert('Please enter product code and name')
      return
    }

    const newProduct = {
      sn: selectedProducts.length + 1,
      product_id: manualProduct.product_id.trim(),
      product_name: manualProduct.product_name.trim(),
      packing_size: manualProduct.packing_size.trim() || '-',
      batch_number: manualProduct.batch_number.trim(),
      quantity: manualProduct.quantity,
      isManual: true // 标记为手动添加
    }

    setSelectedProducts(prev => [...prev, newProduct])
    
    // 重置手动添加表单
    setManualProduct({
      product_id: '',
      product_name: '',
      packing_size: '',
      batch_number: '',
      quantity: ''
    })
    setShowManualAdd(false)
  }

  const removeProductFromSelection = (index) => {
    setSelectedProducts(prev => {
      const updated = prev.filter((_, i) => i !== index)
      return updated.map((item, i) => ({ ...item, sn: i + 1 }))
    })
  }

  const updateProductInSelection = (index, field, value) => {
    setSelectedProducts(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  // 清除所有状态
  const clearAllData = () => {
    setSelectedProducts([])
    setShipmentInfo({
      shipment: '',
      containerNumber: '',
      sealNo: '',
      etd: '',
      eta: '',
      poNumber: ''
    })
    localStorage.removeItem('outbound_selected_products')
    localStorage.removeItem('outbound_shipment_info')
  }

  const validateQuantity = (productId, requestedQuantity) => {
    const product = availableProducts.find(p => p.product_id === productId)
    if (!product) return true // 手动添加的产品跳过验证
    
    return parseFloat(requestedQuantity) <= parseFloat(product.current_stock)
  }
