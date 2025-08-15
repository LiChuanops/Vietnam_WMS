import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const PermissionContext = createContext({})

export const usePermissions = () => {
  return useContext(PermissionContext)
}

// 权限常量 - 集中管理所有权限
export const PERMISSIONS = {
  // 产品权限
  PRODUCT_VIEW: 'product.view',
  PRODUCT_CREATE: 'product.create',
  PRODUCT_EDIT: 'product.edit',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_STATUS_CHANGE: 'product.status.change',
  
  // 库存权限
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',
  
  // 订单权限
  ORDER_VIEW: 'order.view',
  ORDER_CREATE: 'order.create',
  ORDER_EDIT: 'order.edit',
  
  // 报告权限
  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',
  
  // 用户管理权限
  USER_VIEW: 'user.view',
  USER_EDIT: 'user.edit'
}

// 角色权限映射 - 基于现有的 profiles.role 字段
const getRolePermissions = (role) => {
  const roleKey = role?.toLowerCase()
  
  switch (roleKey) {
    case 'admin':
      return [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.PRODUCT_DELETE,
        PERMISSIONS.PRODUCT_STATUS_CHANGE,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_EDIT,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_EDIT,
        PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.REPORT_EXPORT,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_EDIT
      ]
    
    case 'manager':
      return [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.PRODUCT_STATUS_CHANGE,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_EDIT,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_EDIT,
        PERMISSIONS.REPORT_VIEW
      ]
    
    case 'staff':
    case 'warehouse_staff':
      return [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.ORDER_VIEW
      ]
    
    case 'viewer':
      return [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.REPORT_VIEW
      ]
    
    default:
      // 默认给最基本的查看权限
      return [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.ORDER_VIEW
      ]
  }
}

export const PermissionProvider = ({ children }) => {
  const { userProfile } = useAuth()
  const [userPermissions, setUserPermissions] = useState([])
  const [loading, setLoading] = useState(false)

  // 根据用户角色设置权限
  useEffect(() => {
    if (userProfile?.role) {
      const permissions = getRolePermissions(userProfile.role)
      setUserPermissions(permissions)
    } else {
      setUserPermissions([])
    }
    setLoading(false)
  }, [userProfile])

  // 检查单个权限
  const hasPermission = (permission) => {
    return userPermissions.includes(permission)
  }

  // 检查多个权限（需要全部满足）
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => userPermissions.includes(permission))
  }

  // 检查多个权限（满足其中之一即可）
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => userPermissions.includes(permission))
  }

  // 检查角色
  const hasRole = (role) => {
    return userProfile?.role?.toLowerCase() === role.toLowerCase()
  }

  // 权限门控组件 - 条件渲染
  const PermissionGate = ({ 
    permission, 
    permissions, 
    requireAll = true, 
    fallback = null, 
    children 
  }) => {
    // 如果指定了单个权限
    if (permission && !hasPermission(permission)) {
      return fallback
    }
    
    // 如果指定了多个权限
    if (permissions) {
      const hasRequiredPermissions = requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions)
      
      if (!hasRequiredPermissions) {
        return fallback
      }
    }
    
    return children
  }

  const value = {
    userPermissions,
    loading,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    PermissionGate,
    PERMISSIONS
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

// 便捷的权限检查 Hook
export const usePermissionCheck = () => {
  const { hasPermission, hasAllPermissions } = usePermissions()
  
  return {
    // 通用权限检查
    canView: (resource) => hasPermission(`${resource}.view`),
    canCreate: (resource) => hasPermission(`${resource}.create`),
    canEdit: (resource) => hasPermission(`${resource}.edit`),
    canDelete: (resource) => hasPermission(`${resource}.delete`),
    
    // 完整管理权限
    canManage: (resource) => hasAllPermissions([
      `${resource}.view`,
      `${resource}.create`,
      `${resource}.edit`,
      `${resource}.delete`
    ]),
    
    // 产品相关快捷检查
    canManageProducts: () => hasAllPermissions([
      PERMISSIONS.PRODUCT_VIEW,
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_EDIT,
      PERMISSIONS.PRODUCT_DELETE
    ]),
    
    canViewProducts: () => hasPermission(PERMISSIONS.PRODUCT_VIEW),
    canEditProducts: () => hasPermission(PERMISSIONS.PRODUCT_EDIT)
  }
}
