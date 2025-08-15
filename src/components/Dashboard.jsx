import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const Dashboard = () => {
  const { user, userProfile, signOut } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()

  const handleSignOut = async () => {
    await signOut()
  }

  // Get display name from profile or fallback to email
  const getDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name
    }
    return user?.email || 'User'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {t('dashboard')}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Toggle Button */}
              <button
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📦</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('totalInventory')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        1,234 {t('items')}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">📈</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('monthlyShipments')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        567 {t('items')}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">⚠️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('lowStockAlert')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        12 {t('items')}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm">🚚</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('pendingOrders')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        23 {t('orders')}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {t('quickActions')}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {t('quickActionsDesc')}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <div className="sm:divide-y sm:divide-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📋</span>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">
                          {t('inventoryManagement')}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {t('inventoryManagementDesc')}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📦</span>
                      <div>
                        <h4 className="text-sm font-medium text-green-900">
                          {t('inboundOperations')}
                        </h4>
                        <p className="text-sm text-green-700">
                          {t('inboundOperationsDesc')}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🚚</span>
                      <div>
                        <h4 className="text-sm font-medium text-purple-900">
                          {t('outboundOperations')}
                        </h4>
                        <p className="text-sm text-purple-700">
                          {t('outboundOperationsDesc')}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {t('recentActivities')}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {t('recentActivitiesDesc')}
              </p>
            </div>
            <ul className="border-t border-gray-200 divide-y divide-gray-200">
              <li className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-2 w-2 bg-green-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {t('productInbound')}
                    </p>
                    <p className="text-sm text-gray-500">2 {t('hoursAgo')}</p>
                  </div>
                </div>
              </li>
              <li className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-2 w-2 bg-blue-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {t('orderShipped')}
                    </p>
                    <p className="text-sm text-gray-500">4 {t('hoursAgo')}</p>
                  </div>
                </div>
              </li>
              <li className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-2 w-2 bg-yellow-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {t('lowStockWarning')}
                    </p>
                    <p className="text-sm text-gray-500">6 {t('hoursAgo')}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
