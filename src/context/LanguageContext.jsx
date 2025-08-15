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
    showVietnamese: 'Hiển thị tên tiếng Việt',
    searchProducts: 'Search products...',
    products: 'products'
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
    edit: 'Sửa',
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
    uom: 'Đơn vị',
    packingSize: 'Kích thước đóng gói',
    status: 'Trạng thái',
    
    // Trạng thái sản phẩm
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    discontinued: 'Ngừng sản xuất',
    
    // Thao tác sản phẩm
    addNewProduct: 'Thêm sản phẩm mới',
    addProduct: 'Thêm sản phẩm',
    editProduct: 'Sửa sản phẩm',
    updateProduct: 'Cập nhật sản phẩm',
    
    // Bộ lọc sản phẩm
    allCountries: 'Tất cả quốc gia',
    allVendors: 'Tất cả nhà cung cấp',
    showVietnamese: 'Hiển thị tên tiếng Việt',
    searchProducts: 'Tìm kiếm sản phẩm...',
    products: 'sản phẩm'
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
