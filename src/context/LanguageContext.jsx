import React, { createContext, useContext, useState } from 'react'

const LanguageContext = createContext({})

export const useLanguage = () => {
  return useContext(LanguageContext)
}

// Language translations
const translations = {
  en: {
    // Navigation
    dashboard: 'LI CHUAN FOOD PRODUCTS CO., LTD',
    navigation: 'Navigation',
    welcome: 'Welcome',
    signOut: 'Sign out',
    
    // Login
    signInToAccount: 'Sign in to your account',
    managementSystem: 'LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Email address',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    unexpectedError: 'An unexpected error occurred',
    
    // Dashboard Stats
    totalInventory: 'Total Inventory',
    monthlyShipments: 'Monthly Shipments',
    lowStockAlert: 'Low Stock Alert',
    pendingOrders: 'Pending Orders',
    items: 'items',
    orders: 'orders',
    
    // Quick Actions
    quickActions: 'Quick Actions',
    quickActionsDesc: 'Commonly used system functions',
    inventoryManagement: 'Inventory Management',
    inventoryManagementDesc: 'View and manage inventory',
    inboundOperations: 'Inbound Operations',
    inboundOperationsDesc: 'Create inbound orders',
    outboundOperations: 'Outbound Operations',
    outboundOperationsDesc: 'Process shipping orders',
    
    // Recent Activities
    recentActivities: 'Recent Activities',
    recentActivitiesDesc: 'Latest system operation records',
    productInbound: 'Product ABC123 inbound 100 items',
    orderShipped: 'Order #12345 shipped',
    lowStockWarning: 'Product XYZ789 low stock warning',
    hoursAgo: 'hours ago',
    
    // Sidebar
    productList: 'Product List',
    inventory: 'Inventory',
    comingSoon: 'Coming Soon',
    
    // Product List
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
    active: 'Active',
    inactive: 'Inactive',
    discontinued: 'Discontinued',
    filterBy: 'Filter by',
    allCountries: 'All Countries',
    allVendors: 'All Vendors',
    allWIP: 'All',
    showVietnamese: 'Hiển thị tên tiếng Việt',
    loading: 'Loading...',
    noData: 'No data available',
    showing: 'Showing',
    of: 'of',
    products: 'products'
  },
  vi: {
    // Navigation
    dashboard: 'LI CHUAN FOOD PRODUCTS CO., LTD',
    navigation: 'Điều hướng',
    welcome: 'Chào mừng',
    signOut: 'Đăng xuất',
    
    // Login
    signInToAccount: 'Đăng nhập vào tài khoản của bạn',
    managementSystem: 'Hệ thống quản lý LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Địa chỉ email',
    password: 'Mật khẩu',
    signIn: 'Đăng nhập',
    signingIn: 'Đang đăng nhập...',
    unexpectedError: 'Đã xảy ra lỗi không mong muốn',
    
    // Dashboard Stats
    totalInventory: 'Tổng kho hàng',
    monthlyShipments: 'Xuất kho tháng này',
    lowStockAlert: 'Cảnh báo hết hàng',
    pendingOrders: 'Đơn hàng chờ xử lý',
    items: 'sản phẩm',
    orders: 'đơn hàng',
    
    // Quick Actions
    quickActions: 'Thao tác nhanh',
    quickActionsDesc: 'Các chức năng hệ thống thường dùng',
    inventoryManagement: 'Quản lý kho hàng',
    inventoryManagementDesc: 'Xem và quản lý kho hàng',
    inboundOperations: 'Nhập kho',
    inboundOperationsDesc: 'Tạo phiếu nhập kho',
    outboundOperations: 'Xuất kho',
    outboundOperationsDesc: 'Xử lý đơn hàng xuất kho',
    
    // Recent Activities
    recentActivities: 'Hoạt động gần đây',
    recentActivitiesDesc: 'Bản ghi hoạt động mới nhất của hệ thống',
    productInbound: 'Sản phẩm ABC123 nhập kho 100 sản phẩm',
    orderShipped: 'Đơn hàng #12345 đã được giao',
    lowStockWarning: 'Sản phẩm XYZ789 cảnh báo hết hàng',
    hoursAgo: 'giờ trước',
    
    // Sidebar
    productList: 'Danh sách sản phẩm',
    inventory: 'Kho hàng',
    comingSoon: 'Sắp có',
    
    // Product List
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
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    discontinued: 'Ngừng sản xuất',
    filterBy: 'Lọc theo',
    allCountries: 'Tất cả quốc gia',
    allVendors: 'Tất cả nhà cung cấp',
    allWIP: 'Tất cả WIP',
    showVietnamese: 'Hiển thị tên tiếng Việt',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
    showing: 'Hiển thị',
    of: 'của',
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
