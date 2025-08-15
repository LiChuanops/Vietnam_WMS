import React, { useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'

const Sidebar = ({ isOpen, currentView, onViewChange }) => {
  const { t } = useLanguage()

  const menuItems = [
    {
      id: 'dashboard',
      name: t('dashboard'),
      icon: '📊',
    },
    {
      id: 'productList',
      name: t('productList'),
      icon: '📦',
    },
    {
      id: 'inventory',
      name: t('inventory'),
      icon: '🏪',
    },
  ]

  const handleMenuClick = useCallback((itemId, e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Menu item clicked:', itemId) // 调试日志
    onViewChange(itemId)
  }, [onViewChange])

  return (
    <div 
      className={`bg-white shadow-lg transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0'
      } overflow-hidden flex-shrink-0`}
      style={{ minHeight: '100vh' }} // 确保侧边栏高度
    >
      {isOpen && (
        <div className="p-6 w-64"> {/* 固定宽度避免内容压缩 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('navigation')}
            </h2>
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleMenuClick(item.id, e)}
                onMouseDown={(e) => e.stopPropagation()} // 防止与其他事件冲突
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  currentView === item.id
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`Navigate to ${item.name}`}
              >
                <span className="text-xl mr-3 flex-shrink-0">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

export default Sidebar
