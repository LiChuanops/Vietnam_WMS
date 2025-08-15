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
    
accessDenied: 'Access Denied',
    noPermission: 'You do not have permission to perform this action',
    noPermissionToView: 'You do not have permission to view this page',
    
    // 更多表单字段
    enterItemCode: 'Enter item code',
    enterProductName: 'Enter product name',
    enterVietnameseName: 'Enter Vietnamese name',
    enterType: 'Enter type',
    enterCountry: 'Enter country',
    enterVendor: 'Enter vendor',
    enterUOM: 'Enter UOM',
    enterPackingSize: 'Enter packing size',
    enterWorkInProgress: 'Enter work in progress',
    
    // 验证消息
    systemCodeRequired: 'Item code is required',
    productNameRequired: 'Product name is required',
    systemCodeExists: 'Item code already exists',
    
    // 成功/错误消息
    productAddedSuccessfully: 'Product added successfully',
    productUpdatedSuccessfully: 'Product updated successfully',
    productDeletedSuccessfully: 'Product deleted successfully',
    errorAddingProduct: 'Error adding product',
    errorUpdatingProduct: 'Error updating product',
    errorDeletingProduct: 'Error deleting product',
    confirmDeleteProduct: 'Are you sure you want to delete this product? This action cannot be undone.'
  },

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
accessDenied: 'Truy cập bị từ chối',
    noPermission: 'Bạn không có quyền thực hiện hành động này',
    noPermissionToView: 'Bạn không có quyền xem trang này',
    
    // 更多表单字段
    enterItemCode: 'Nhập mã sản phẩm',
    enterProductName: 'Nhập tên sản phẩm',
    enterVietnameseName: 'Nhập tên tiếng Việt',
    enterType: 'Nhập loại sản phẩm',
    enterCountry: 'Nhập quốc gia',
    enterVendor: 'Nhập nhà cung cấp',
    enterUOM: 'Nhập đơn vị',
    enterPackingSize: 'Nhập kích thước đóng gói',
    enterWorkInProgress: 'Nhập trạng thái thực hiện',
    
    // 验证消息
    systemCodeRequired: 'Mã sản phẩm là bắt buộc',
    productNameRequired: 'Tên sản phẩm là bắt buộc',
    systemCodeExists: 'Mã sản phẩm đã tồn tại',
    
    // 成功/错误消息
    productAddedSuccessfully: 'Thêm sản phẩm thành công',
    productUpdatedSuccessfully: 'Cập nhật sản phẩm thành công',
    productDeletedSuccessfully: 'Xóa sản phẩm thành công',
    errorAddingProduct: 'Lỗi khi thêm sản phẩm',
    errorUpdatingProduct: 'Lỗi khi cập nhật sản phẩm',
    errorDeletingProduct: 'Lỗi khi xóa sản phẩm',
    confirmDeleteProduct: 'Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.',
    
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
