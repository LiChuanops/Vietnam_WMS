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
    productCategoryClassification: 'Product category/classification',
    
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
    // ===== SYSTEM & NAVIGATION =====
    dashboard: 'Bang dieu khien',
    navigation: 'Dieu huong',
    welcome: 'Chao mung',
    signOut: 'Dang xuat',
    comingSoon: 'Sap co',
    loading: 'Dang tai...',
    noData: 'Khong co du lieu',
    showing: 'Hien thi',
    of: 'cua',
    cancel: 'Huy',
    edit: 'Chinh sua',
    delete: 'Xoa',
    actions: 'Thao tac',
    
    // ===== LOGIN =====
    signInToAccount: 'Dang nhap vao tai khoan cua ban',
    managementSystem: 'He thong quan ly LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Dia chi email',
    password: 'Mat khau',
    signIn: 'Dang nhap',
    signingIn: 'Dang dang nhap...',
    unexpectedError: 'Da xay ra loi khong mong muon',
    
    // ===== SIDEBAR MENU =====
    productList: 'Danh sach san pham',
    inventory: 'Kho hang',
    
    // ===== PRODUCT MANAGEMENT =====
    itemCode: 'Ma san pham',
    productName: 'Ten san pham',
    vietnameseName: 'Ten tieng Viet',
    type: 'Loai',
    country: 'Quoc gia',
    vendor: 'Nha cung cap',
    workInProgress: 'Dang thuc hien',
    uom: 'Don vi tinh',
    packingSize: 'Kich thuoc dong goi',
    status: 'Trang thai',
    
    // Product Status
    active: 'Hoat dong',
    inactive: 'Khong hoat dong',
    discontinued: 'Ngung san xuat',
    
    // Product Actions
    addNewProduct: 'Them san pham moi',
    addProduct: 'Them san pham',
    editProduct: 'Chinh sua san pham',
    updateProduct: 'Cap nhat san pham',
    
    // Product Filters
    allCountries: 'Tat ca quoc gia',
    allVendors: 'Tat ca nha cung cap',
    showVietnamese: 'Hien thi ten tieng Viet',
    searchProducts: 'Tim kiem san pham...',
    products: 'san pham',
    
    // Form Helper Text
    pleaseSelectCountry: 'Vui long chon quoc gia',
    pleaseSelectCompanyName: 'Vui long chon ten cong ty',
    howManyKgPerCarton: 'Bao nhieu kg moi thung',
    productCategoryClassification: 'Phan loai danh muc san pham',
    
    // ===== INVENTORY =====
    exportInventory: 'Xuat Kho',
    importInventory: 'Nhap Kho',
    inventorySummary: 'Tom Tat Kho Hang',
    inbound: 'Nhap Kho',
    outbound: 'Xuat Kho',
    reports: 'Bao Cao',
    
    // Inventory Summary
    currentStock: 'Ton Kho Hien Tai',
    availableStock: 'Kho Co San',
    month: 'Thang',
    export: 'Xuat',
    exportToCSV: 'Xuat ra CSV',
    showingProducts: 'Hien thi san pham co ton kho',
    
    // Transactions
    addInbound: 'Them Nhap Kho',
    addOutbound: 'Them Xuat Kho',
    addTransaction: 'Them Giao Dich',
    transactionDate: 'Ngay Giao Dich',
    referenceNumber: 'So Tham Chieu',
    unitPrice: 'Don Gia',
    totalAmount: 'Tong Tien',
    notes: 'Ghi Chu',
    quantity: 'So Luong',
    
    // Transaction Types
    inboundTransactions: 'Giao Dich Nhap Kho',
    outboundTransactions: 'Giao Dich Xuat Kho',
    openingStock: 'Ton Kho Dau Ky',
    
    // Filters
    startDate: 'Ngay Bat Dau',
    endDate: 'Ngay Ket Thuc',
    dateRange: 'Khoang Thoi Gian',
    
    // Summary Stats
    totalTransactions: 'Tong Giao Dich',
    totalQuantity: 'Tong So Luong',
    totalProducts: 'Tong San Pham',
    
    // Reports
    reportType: 'Loai Bao Cao',
    generateReport: 'Tao Bao Cao',
    currentStockReport: 'Bao Cao Ton Kho',
    transactionsSummary: 'Tom Tat Giao Dich',
    monthlySummary: 'Tom Tat Thang',
    lowStockAlert: 'Canh Bao Het Hang',
    
    // Stock Status
    insufficientStock: 'Khong Du Hang',
    stockLevel: 'Muc Ton Kho',
    lowStock: 'Sap Het Hang',
    
    // Messages
    transactionAdded: 'Da them giao dich thanh cong',
    stockUpdated: 'Da cap nhat ton kho thanh cong',
    noTransactions: 'Khong tim thay giao dich',
    noInventoryData: 'Khong co du lieu kho hang',
    
    // Actions
    addStock: 'Them Hang',
    removeStock: 'Xuat Hang',
    adjustStock: 'Dieu Chinh Ton Kho',
    
    // Validation
    quantityRequired: 'So luong la bat buoc',
    productRequired: 'San pham la bat buoc',
    dateRequired: 'Ngay la bat buoc',
    insufficientStockError: 'So luong vuot qua ton kho co san'
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
