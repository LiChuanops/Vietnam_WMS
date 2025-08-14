import React from 'react'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 導航欄 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Vietnam WMS Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                歡迎, {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容區域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 統計卡片 */}
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
                        總庫存
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        1,234 件
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
                        本月出貨
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        567 件
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
                        低庫存警告
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        12 項
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
                        待處理訂單
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        23 筆
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 快捷功能 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                快捷功能
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                常用的系統功能
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <div className="sm:divide-y sm:divide-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-left">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📋</span>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">庫存管理</h4>
                        <p className="text-sm text-blue-700">查看和管理庫存</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-left">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📦</span>
                      <div>
                        <h4 className="text-sm font-medium text-green-900">入庫作業</h4>
                        <p className="text-sm text-green-700">新增入庫單</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-left">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🚚</span>
                      <div>
                        <h4 className="text-sm font-medium text-purple-900">出庫作業</h4>
                        <p className="text-sm text-purple-700">處理出貨訂單</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 最近活動 */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                最近活動
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                系統最新的操作記錄
              </p>
            </div>
            <ul className="border-t border-gray-200 divide-y divide-gray-200">
              <li className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-2 w-2 bg-green-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">商品 ABC123 入庫 100 件</p>
                    <p className="text-sm text-gray-500">2 小時前</p>
                  </div>
                </div>
              </li>
              <li className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-2 w-2 bg-blue-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">訂單 #12345 已出貨</p>
                    <p className="text-sm text-gray-500">4 小時前</p>
                  </div>
                </div>
              </li>
              <li className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-block h-2 w-2 bg-yellow-400 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">商品 XYZ789 庫存不足警告</p>
                    <p className="text-sm text-gray-500">6 小時前</p>
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
