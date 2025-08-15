import React, { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Sidebar from './Sidebar'
import ProductList from './ProductList'
import Inventory from './Inventory'

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
      default:
        return <DashboardHome />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        currentView={currentView} 
        onViewChange={handleViewChange} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-white shadow">
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
                  {t('dashboard')}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}

// Dashboard Home Component - Coming Soon版本
const DashboardHome = () => {
  const { t } = useLanguage()

  return (
    <div className="p-6">
      <div className="text-center">
        <div className="mx-auto h-32 w-32 text-gray-400 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{t('dashboard')}</h1>
        <p className="text-lg text-gray-500 mb-8">{t('comingSoon')}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Feature Under Development
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This dashboard feature is currently being developed. 
                  Please check back soon for updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
