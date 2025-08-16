import React, { createContext, useContext, useState } from 'react'

const LanguageContext = createContext({})

export const useLanguage = () => {
  return useContext(LanguageContext)
}

// Language translations
const translations = {
  en: {
    // ===== SYSTEM & NAVIGATION =====
    dashboard: 'Dashboard',
    navigation: 'Navigation',
    welcome: 'Welcome',
    signOut: 'Sign out',
    comingSoon: 'Coming Soon',
    loading: 'Loading...',
    noData: 'No data available',
    showing: 'Showing',
    of: 'of',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    actions: 'Actions',
    
    // ===== LOGIN =====
    signInToAccount: 'Sign in to your account',
    managementSystem: 'LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Email address',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    unexpectedError: 'An unexpected error occurred',
    
    // ===== SIDEBAR MENU =====
    productList: 'Product List',
    inventory: 'Inventory',
    
    // ===== PRODUCT MANAGEMENT =====
    itemCode: 'Item Code',
    productName: 'Product Name',
    vietnameseName: 'Vietnamese Name',
    type: 'Type',
    country: 'Country',
    vendor: 'Vendor',
    workInProgress: 'Work In Progress',
    uom: 'UOM',
    packingSize: 'Packing Size',
    status: 'Status',
    
    // Product Status
    active: 'Active',
    inactive: 'Inactive',
    discontinued: 'Discontinued',
    
    // Product Actions
    addNewProduct: 'Add New Product',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    updateProduct: 'Update Product',
    
    // Product Filters
    allCountries: 'All Countries',
    allVendors: 'All Vendors',
    showVietnamese: 'Show Vietnamese Names',
    searchProducts: 'Search products...',
    products: 'products',
    
    // Form Helper Text
    pleaseSelectCountry: 'Please select country',
    pleaseSelectCompanyName: 'Please select company name',
    howManyKgPerCarton: 'How many kg per carton',
    productCategoryClassification: 'Product category/classification'
  },
// ===== INVENTORY =====
    exportInventory: 'Export Inventory',
    importInventory: 'Import Inventory',
    inventorySummary: 'Inventory Summary',
    inbound: 'Inbound',
    outbound: 'Outbound',
    reports: 'Reports',
    
    // Inventory Summary
    currentStock: 'Current Stock',
    availableStock: 'Available Stock',
    month: 'Month',
    export: 'Export',
    exportToCSV: 'Export to CSV',
    showingProducts: 'Showing products with stock',
    
    // Transactions
    addInbound: 'Add Inbound',
    addOutbound: 'Add Outbound',
    addTransaction: 'Add Transaction',
    transactionDate: 'Transaction Date',
    referenceNumber: 'Reference Number',
    unitPrice: 'Unit Price',
    totalAmount: 'Total Amount',
    notes: 'Notes',
    quantity: 'Quantity',
    
    // Transaction Types
    inboundTransactions: 'Inbound Transactions',
    outboundTransactions: 'Outbound Transactions',
    openingStock: 'Opening Stock',
    
    // Filters
    startDate: 'Start Date',
    endDate: 'End Date',
    dateRange: 'Date Range',
    
    // Summary Stats
    totalTransactions: 'Total Transactions',
    totalQuantity: 'Total Quantity',
    totalProducts: 'Total Products',
    
    // Reports
    reportType: 'Report Type',
    generateReport: 'Generate Report',
    currentStockReport: 'Current Stock Report',
    transactionsSummary: 'Transactions Summary',
    monthlySummary: 'Monthly Summary',
    lowStockAlert: 'Low Stock Alert',
    
    // Stock Status
    insufficientStock: 'Insufficient Stock',
    stockLevel: 'Stock Level',
    lowStock: 'Low Stock',
    
    // Messages
    transactionAdded: 'Transaction added successfully',
    stockUpdated: 'Stock updated successfully',
    noTransactions: 'No transactions found',
    noInventoryData: 'No inventory data',
    
    // Actions
    addStock: 'Add Stock',
    removeStock: 'Remove Stock',
    adjustStock: 'Adjust Stock',
    
    // Validation
    quantityRequired: 'Quantity is required',
    productRequired: 'Product is required',
    dateRequired: 'Date is required',
    insufficientStockError: 'Quantity exceeds available stock'
  },
  
  vi: {
    // ===== HỆ THỐNG & ĐIỀU HƯỚNG =====
    dashboard: 'Bảng điều khiển',
    navigation: 'Điều hướng',
    welcome: 'Chào mừng',
    signOut: 'Đăng xuất',
    comingSoon: 'Sắp có',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
    showing: 'Hiển thị',
    of: 'của',
    cancel: 'Hủy',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    actions: 'Thao tác',
    
    // ===== ĐĂNG NHẬP =====
    signInToAccount: 'Đăng nhập vào tài khoản của bạn',
    managementSystem: 'Hệ thống quản lý LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Địa chỉ email',
    password: 'Mật khẩu',
    signIn: 'Đăng nhập',
    signingIn: 'Đang đăng nhập...',
    unexpectedError: 'Đã xảy ra lỗi không mong muốn',
    
    // ===== MENU SIDEBAR =====
    productList: 'Danh sách sản phẩm',
    inventory: 'Kho hàng',
    
    // ===== QUẢN LÝ SẢN PHẨM =====
    itemCode: 'Mã sản phẩm',
    productName: 'Tên sản phẩm',
    vietnameseName: 'Tên tiếng Việt',
    type: 'Loại',
    country: 'Quốc gia',
    vendor: 'Nhà cung cấp',
    workInProgress: 'Đang thực hiện',
    uom: 'Đơn vị tính',
    packingSize: 'Kích thước đóng gói',
    status: 'Trạng thái',
    
    // Trạng thái sản phẩm
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    discontinued: 'Ngừng sản xuất',
    
    // Thao tác sản phẩm
    addNewProduct: 'Thêm sản phẩm mới',
    addProduct: 'Thêm sản phẩm',
    editProduct: 'Chỉnh sửa sản phẩm',
    updateProduct: 'Cập nhật sản phẩm',
    
    // Bộ lọc sản phẩm
    allCountries: 'Tất cả quốc gia',
    allVendors: 'Tất cả nhà cung cấp',
    showVietnamese: 'Hiển thị tên tiếng Việt',
    searchProducts: 'Tìm kiếm sản phẩm...',
    products: 'sản phẩm',
    
    // Văn bản hướng dẫn form
    pleaseSelectCountry: 'Vui lòng chọn quốc gia',
    pleaseSelectCompanyName: 'Vui lòng chọn tên công ty',
    howManyKgPerCarton: 'Bao nhiêu kg mỗi thùng',
    productCategoryClassification: 'Phân loại danh mục sản phẩm',
  // ===== INVENTORY (Vietnamese) =====
    exportInventory: 'Xuất Kho',
    importInventory: 'Nhập Kho',
    inventorySummary: 'Tóm Tắt Kho Hàng',
    inbound: 'Nhập Kho',
    outbound: 'Xuất Kho',
    reports: 'Báo Cáo',
    
    // Inventory Summary
    currentStock: 'Tồn Kho Hiện Tại',
    availableStock: 'Kho Có Sẵn',
    month: 'Tháng',
    export: 'Xuất',
    exportToCSV: 'Xuất ra CSV',
    showingProducts: 'Hiển thị sản phẩm có tồn kho',
    
    // Transactions
    addInbound: 'Thêm Nhập Kho',
    addOutbound: 'Thêm Xuất Kho',
    addTransaction: 'Thêm Giao Dịch',
    transactionDate: 'Ngày Giao Dịch',
    referenceNumber: 'Số Tham Chiếu',
    unitPrice: 'Đơn Giá',
    totalAmount: 'Tổng Tiền',
    notes: 'Ghi Chú',
    quantity: 'Số Lượng',
    
    // Transaction Types
    inboundTransactions: 'Giao Dịch Nhập Kho',
    outboundTransactions: 'Giao Dịch Xuất Kho',
    openingStock: 'Tồn Kho Đầu Kỳ',
    
    // Filters
    startDate: 'Ngày Bắt Đầu',
    endDate: 'Ngày Kết Thúc',
    dateRange: 'Khoảng Thời Gian',
    
    // Summary Stats
    totalTransactions: 'Tổng Giao Dịch',
    totalQuantity: 'Tổng Số Lượng',
    totalProducts: 'Tổng Sản Phẩm',
    
    // Reports
    reportType: 'Loại Báo Cáo',
    generateReport: 'Tạo Báo Cáo',
    currentStockReport: 'Báo Cáo Tồn Kho',
    transactionsSummary: 'Tóm Tắt Giao Dịch',
    monthlySummary: 'Tóm Tắt Tháng',
    lowStockAlert: 'Cảnh Báo Hết Hàng',
    
    // Stock Status
    insufficientStock: 'Không Đủ Hàng',
    stockLevel: 'Mức Tồn Kho',
    lowStock: 'Sắp Hết Hàng',
    
    // Messages
    transactionAdded: 'Đã thêm giao dịch thành công',
    stockUpdated: 'Đã cập nhật tồn kho thành công',
    noTransactions: 'Không tìm thấy giao dịch',
    noInventoryData: 'Không có dữ liệu kho hàng',
    
    // Actions
    addStock: 'Thêm Hàng',
    removeStock: 'Xuất Hàng',
    adjustStock: 'Điều Chỉnh Tồn Kho',
    
    // Validation
    quantityRequired: 'Số lượng là bắt buộc',
    productRequired: 'Sản phẩm là bắt buộc',
    dateRequired: 'Ngày là bắt buộc',
    insufficientStockError: 'Số lượng vượt quá tồn kho có sẵn'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en') // Default to English

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'vi' : 'en')
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
