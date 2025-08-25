import React, { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Sidebar from './Sidebar'
import ProductList from './ProductList'
import Inventory from './Inventory'
import ComingSoon from './ComingSoon'

const Dashboard = () => {
  const { user, userProfile, signOut } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')

  const handleSignOut = useCallback(async (e) => {
    e.preventDefault()
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [signOut])

  // Get display name from profile or fallback to email
  const getDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name
    }
    return user?.email || 'User'
  }

  // 修复：移除依赖项，使用函数式更新
  const toggleSidebar = useCallback((e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSidebarOpen(prev => !prev)
  }, []) // 空依赖数组

  const handleViewChange = useCallback((view) => {
    setCurrentView(view)
  }, [])

  // Render main content based on current view
  const renderMainContent = () => {
    switch (currentView) {
      case 'productList':
        return <ProductList />
      case 'inventory':
        return <Inventory />
      case 'localInventory':
        return <ComingSoon title={t('localInventory')} />
      case 'rawMaterial':
        return <ComingSoon title={t('rawMaterial')} />
      case 'packagingMaterial':
        return <ComingSoon title={t('packagingMaterial')} />
      case 'dashboard':
      default:
        return <ComingSoon title={t('dashboard')} />
    }
  }

  // 🔥 关键：根据当前视图决定滚动策略
  const mainContentClass = currentView === 'inventory' 
    ? "flex-1 flex flex-col min-h-screen overflow-x-hidden overflow-y-auto" // Inventory: 禁用水平滚动，保留垂直滚动
    : "flex-1 flex flex-col min-h-screen overflow-y-auto" // 其他: 允许正常滚动

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        currentView={currentView} 
        onViewChange={handleViewChange} 
      />

      {/* Main Content */}
      <div className={mainContentClass}>
        {/* Fixed Navigation Bar */}
        <nav className="bg-white shadow fixed top-0 right-0 z-30" style={{ left: sidebarOpen ? '256px' : '0px', transition: 'left 0.3s ease' }}>
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Sidebar Toggle Button - 修复版本 */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-200"
                  aria-label="Toggle sidebar"
                  style={{ zIndex: 10 }} // 确保按钮在最上层
                >
                  <svg
                    className="h-6 w-6 pointer-events-none" // 防止 SVG 干扰点击
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Li Chuan Food Products Co.,Ltd
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Language Toggle Button */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="mr-2">🌐</span>
                  {language === 'en' ? 'VI' : 'EN'}
                </button>
                
                <span className="text-gray-700">
                  {t('welcome')}, {getDisplayName()}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {t('signOut')}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area - 🔥 关键修改 */}
        <main className={currentView === 'inventory' ? "flex-1 pt-16 overflow-x-hidden" : "flex-1 pt-16 overflow-y-auto min-w-0"}>
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
