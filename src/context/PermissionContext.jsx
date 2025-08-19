// src/context/PermissionContext.jsx - 清理版本
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../supabase/client'

const PermissionContext = createContext({})
export const usePermissions = () => {
  return useContext(PermissionContext)
}

// 产品模块权限动作常量
export const PRODUCT_PERMISSIONS = {
  VIEW_PRODUCT_LIST: 'view_product_list',
  CHANGE_ACTIVE_BUTTON: 'change_active_button',
  EDIT_PRODUCT_INFORMATION: 'edit_product_information',
  ADD_NEW_PRODUCT: 'add_new_product',
  VIEW_ACCOUNT_CODE: 'view_account_code',
  EDIT_ACCOUNT_CODE: 'edit_account_code'
}

// 为了向后兼容，保留原有的 PERMISSIONS 常量
export const PERMISSIONS = {
  PRODUCT_VIEW: 'view_product_list',
  PRODUCT_CREATE: 'add_new_product',
  PRODUCT_EDIT: 'edit_product_information',
  PRODUCT_STATUS_CHANGE: 'change_active_button',
  PRODUCT_ACCOUNT_CODE_VIEW: 'view_account_code',
  PRODUCT_ACCOUNT_CODE_EDIT: 'edit_account_code'
}

export const PermissionProvider = ({ children }) => {
  const { user, userProfile } = useAuth()
  const [userPermissions, setUserPermissions] = useState({})
  const [loading, setLoading] = useState(true)

  // 从数据库获取用户权限
  const fetchUserPermissions = async (userId) => {
    if (!userId) {
      setUserPermissions({})
      setLoading(false)
      return
    }

    try {
      // 先获取用户角色
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user role:', userError)
        setUserPermissions({})
        setLoading(false)
        return
      }

      // 再获取该角色的权限
      const { data, error } = await supabase
        .from('role_permissions')
        .select('module, action, allowed')
        .eq('role', userData.role)

      if (error) {
        console.error('Error fetching permissions:', error)
        setUserPermissions({})
        setLoading(false)
        return
      }

      // 将权限数据转换为易于使用的格式
      const permissions = {}
      data.forEach(permission => {
        if (!permissions[permission.module]) {
          permissions[permission.module] = {}
        }
        permissions[permission.module][permission.action] = permission.allowed
      })

      setUserPermissions(permissions)
    } catch (error) {
      console.error('Error fetching permissions:', error)
      setUserPermissions({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchUserPermissions(user.id)
    } else {
      setUserPermissions({})
      setLoading(false)
    }
  }, [user?.id])

  // 检查特定权限
  const hasPermission = (action) => {
    // 如果传入的是旧格式的权限常量，转换一下
    let actualAction = action
    if (action === PERMISSIONS.PRODUCT_VIEW) actualAction = PRODUCT_PERMISSIONS.VIEW_PRODUCT_LIST
    if (action === PERMISSIONS.PRODUCT_CREATE) actualAction = PRODUCT_PERMISSIONS.ADD_NEW_PRODUCT
    if (action === PERMISSIONS.PRODUCT_EDIT) actualAction = PRODUCT_PERMISSIONS.EDIT_PRODUCT_INFORMATION
    if (action === PERMISSIONS.PRODUCT_STATUS_CHANGE) actualAction = PRODUCT_PERMISSIONS.CHANGE_ACTIVE_BUTTON
    
    return userPermissions.products?.[actualAction] === true
  }

  // 产品权限便捷方法
  const canViewProducts = () => hasPermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_LIST)
  const canAddProducts = () => hasPermission(PRODUCT_PERMISSIONS.ADD_NEW_PRODUCT)
  const canEditProducts = () => hasPermission(PRODUCT_PERMISSIONS.EDIT_PRODUCT_INFORMATION)
  const canChangeProductStatus = () => hasPermission(PRODUCT_PERMISSIONS.CHANGE_ACTIVE_BUTTON)
  const canViewAccountCode = () => hasPermission(PRODUCT_PERMISSIONS.VIEW_ACCOUNT_CODE)
  const canEditAccountCode = () => hasPermission(PRODUCT_PERMISSIONS.EDIT_ACCOUNT_CODE)

  // 权限门组件
  const PermissionGate = ({ 
    permission,
    permissions,
    requireAll = true, 
    fallback = null, 
    children 
  }) => {
    let hasAccess = false

    if (permission) {
      // 单个权限检查
      hasAccess = hasPermission(permission)
    } else if (permissions) {
      // 多个权限检查
      if (requireAll) {
        hasAccess = permissions.every(p => hasPermission(p))
      } else {
        hasAccess = permissions.some(p => hasPermission(p))
      }
    }

    if (!hasAccess) {
      return fallback
    }

    return children
  }

  // 获取用户角色
  const getUserRole = () => userProfile?.role || 'basic_user'

  const value = {
    userPermissions,
    loading,
    hasPermission,
    getUserRole,
    
    // 产品权限便捷方法
    canViewProducts,
    canAddProducts,
    canEditProducts,
    canChangeProductStatus,
    canViewAccountCode,
    canEditAccountCode,

    // 组件
    PermissionGate,

    // 常量（保持向后兼容）
    PERMISSIONS,
    PRODUCT_PERMISSIONS
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

// 便捷的权限检查 Hook
export const usePermissionCheck = () => {
  const { hasPermission } = usePermissions()
  return {
    canViewProducts: () => hasPermission(PRODUCT_PERMISSIONS.VIEW_PRODUCT_LIST),
    canCreateProducts: () => hasPermission(PRODUCT_PERMISSIONS.ADD_NEW_PRODUCT),
    canEditProducts: () => hasPermission(PRODUCT_PERMISSIONS.EDIT_PRODUCT_INFORMATION),
    canChangeStatus: () => hasPermission(PRODUCT_PERMISSIONS.CHANGE_ACTIVE_BUTTON),
    canViewAccountCode: () => hasPermission(PRODUCT_PERMISSIONS.VIEW_ACCOUNT_CODE),
    canEditAccountCode: () => hasPermission(PRODUCT_PERMISSIONS.EDIT_ACCOUNT_CODE),
  }
}
