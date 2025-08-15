import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PermissionProvider } from './context/PermissionContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

// 主应用组件 - 根据认证状态显示不同内容
function AppContent() {
  const { user, loading } = useAuth()

  console.log('AppContent render:', { user: !!user, loading })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
          <p className="text-sm text-gray-400 mt-2">如果加载时间过长，请刷新页面</p>
          
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              强制刷新
            </button>
          )}
        </div>
      </div>
    )
  }

  // 如果用户已登录，用权限提供器包装 Dashboard
  return user ? (
    <PermissionProvider>
      <Dashboard />
    </PermissionProvider>
  ) : (
    <Login />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
