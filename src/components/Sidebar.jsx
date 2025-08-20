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
        <div className="p-4 w-64"> {/* 减少padding从p-6到p-4 */}
          <div className="mb-4"> {/* 减少margin从mb-6到mb-4 */}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('dashboard')}
            </h2>
          </div>
          <nav className="space-y-1"> {/* 减少间距从space-y-2到space-y-1 */}
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleMenuClick(item.id, e)}
                onMouseDown={(e) => e.stopPropagation()} // 防止与其他事件冲突
                className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  currentView === item.id
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`} // 减少padding从px-4 py-3到px-3 py-2
                aria-label={`Navigate to ${item.name}`}
              >
                <span className="text-lg mr-2 flex-shrink-0">{item.icon}</span> {/* 减少图标大小从text-xl到text-lg，margin从mr-3到mr-2 */}
                <span className="font-medium text-sm">{item.name}</span> {/* 减少字体大小到text-sm */}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

export default Sidebar
