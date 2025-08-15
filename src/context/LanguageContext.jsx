import React, { createContext, useContext, useState } from 'react'

const LanguageContext = createContext({})

export const useLanguage = () => {
  return useContext(LanguageContext)
}

// Language translations
const translations = {
  en: {
    // Navigation
    dashboard: 'Vietnam WMS Dashboard',
    welcome: 'Welcome',
    signOut: 'Sign out',
    
    // Login
    signInToAccount: 'Sign in to your account',
    managementSystem: 'Vietnam WMS Management System',
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
    hoursAgo: 'hours ago'
  },
  vi: {
    // Navigation
    dashboard: 'Bảng điều khiển Vietnam WMS',
    welcome: 'Chào mừng',
    signOut: 'Đăng xuất',
    
    // Login
    signInToAccount: 'Đăng nhập vào tài khoản của bạn',
    managementSystem: 'Hệ thống quản lý Vietnam WMS',
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
    hoursAgo: 'giờ trước'
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
