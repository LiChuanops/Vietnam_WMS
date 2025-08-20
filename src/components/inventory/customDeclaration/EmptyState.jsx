// 在 CustomDeclarationForm.jsx 中更新 handleSubmit 函数
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
