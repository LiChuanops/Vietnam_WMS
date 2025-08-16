import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const PermissionContext = createContext({})
export const usePermissions = () => {
  return useContext(PermissionContext)
}

// 基础权限常量 - 集中管理所有权限
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

// 新增的扩展权限
export const ADDITIONAL_PERMISSIONS = {
  // Inventory permissions
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_EDIT: 'inventory.edit',
  INVENTORY_EXPORT: 'inventory.export',
  INVENTORY_IMPORT: 'inventory.import',

  // Transaction permissions  
  TRANSACTION_CREATE: 'transaction.create',
  TRANSACTION_VIEW: 'transaction.view',
  TRANSACTION_EDIT: 'transaction.edit',
  TRANSACTION_DELETE: 'transaction.delete',

  // Report permissions
  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',
  REPORT_GENERATE: 'report.generate',

  // Stock management permissions
  STOCK_ADJUST: 'stock.adjust',
  STOCK_TRANSFER: 'stock.transfer',
  OPENING_STOCK: 'opening.stock.manage'
}

// 角色权限映射 - 基于 profiles.role
const getRolePermissions = (role) => {
  const roleKey = role?.toLowerCase()
  switch (roleKey) {
    case 'admin':
      return [
        // 产品
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.PRODUCT_DELETE,
        PERMISSIONS.PRODUCT_STATUS_CHANGE,

        // 新库存 & 交易 & 报表 & 库存管理权限
        ADDITIONAL_PERMISSIONS.INVENTORY_VIEW,
        ADDITIONAL_PERMISSIONS.INVENTORY_EDIT,
        ADDITIONAL_PERMISSIONS.INVENTORY_EXPORT,
        ADDITIONAL_PERMISSIONS.INVENTORY_IMPORT,

        ADDITIONAL_PERMISSIONS.TRANSACTION_CREATE,
        ADDITIONAL_PERMISSIONS.TRANSACTION_VIEW,
        ADDITIONAL_PERMISSIONS.TRANSACTION_EDIT,
        ADDITIONAL_PERMISSIONS.TRANSACTION_DELETE,

        ADDITIONAL_PERMISSIONS.REPORT_VIEW,
        ADDITIONAL_PERMISSIONS.REPORT_EXPORT,
        ADDITIONAL_PERMISSIONS.REPORT_GENERATE,

        ADDITIONAL_PERMISSIONS.STOCK_ADJUST,
        ADDITIONAL_PERMISSIONS.STOCK_TRANSFER,
        ADDITIONAL_PERMISSIONS.OPENING_STOCK,

        // 订单 & 用户
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_EDIT,
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.USER_EDIT
      ]

    case 'manager':
      return [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_EDIT,
        PERMISSIONS.PRODUCT_STATUS_CHANGE,

        ADDITIONAL_PERMISSIONS.INVENTORY_VIEW,
        ADDITIONAL_PERMISSIONS.INVENTORY_EDIT,
        ADDITIONAL_PERMISSIONS.INVENTORY_EXPORT,

        ADDITIONAL_PERMISSIONS.TRANSACTION_CREATE,
        ADDITIONAL_PERMISSIONS.TRANSACTION_VIEW,
        ADDITIONAL_PERMISSIONS.TRANSACTION_EDIT,

        ADDITIONAL_PERMISSIONS.REPORT_VIEW,
        ADDITIONAL_PERMISSIONS.REPORT_EXPORT,
        ADDITIONAL_PERMISSIONS.REPORT_GENERATE,

        ADDITIONAL_PERMISSIONS.STOCK_ADJUST,

        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_EDIT
      ]

    case 'staff':
    case 'warehouse_staff':
      return [
        PERMISSIONS.PRODUCT_VIEW,

        ADDITIONAL_PERMISSIONS.INVENTORY_VIEW,

        ADDITIONAL_PERMISSIONS.TRANSACTION_CREATE,
        ADDITIONAL_PERMISSIONS.TRANSACTION_VIEW,

        ADDITIONAL_PERMISSIONS.REPORT_VIEW,

        PERMISSIONS.ORDER_VIEW
      ]

    case 'viewer':
      return [
        PERMISSIONS.PRODUCT_VIEW,
        ADDITIONAL_PERMISSIONS.INVENTORY_VIEW,
        ADDITIONAL_PERMISSIONS.TRANSACTION_VIEW,
        ADDITIONAL_PERMISSIONS.REPORT_VIEW,
        PERMISSIONS.ORDER_VIEW
      ]

    default:
      return [
        PERMISSIONS.PRODUCT_VIEW,
        ADDITIONAL_PERMISSIONS.INVENTORY_VIEW,
        ADDITIONAL_PERMISSIONS.TRANSACTION_VIEW,
        PERMISSIONS.ORDER_VIEW
      ]
  }
}

export const PermissionProvider = ({ children }) => {
  const { userProfile } = useAuth()
  const [userPermissions, setUserPermissions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userProfile?.role) {
      const permissions = getRolePermissions(userProfile.role)
      setUserPermissions(permissions)
    } else {
      setUserPermissions([])
    }
    setLoading(false)
  }, [userProfile])

  const hasPermission = (permission) => userPermissions.includes(permission)
  const hasAllPermissions = (permissions) => permissions.every(p => userPermissions.includes(p))
  const hasAnyPermission = (permissions) => permissions.some(p => userPermissions.includes(p))
  const hasRole = (role) => userProfile?.role?.toLowerCase() === role.toLowerCase()

  const PermissionGate = ({ permission, permissions, requireAll = true, fallback = null, children }) => {
    if (permission && !hasPermission(permission)) return fallback
    if (permissions) {
      const ok = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
      if (!ok) return fallback
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
    PERMISSIONS,
    ADDITIONAL_PERMISSIONS
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
    canView: (resource) => hasPermission(`${resource}.view`),
    canCreate: (resource) => hasPermission(`${resource}.create`),
    canEdit: (resource) => hasPermission(`${resource}.edit`),
    canDelete: (resource) => hasPermission(`${resource}.delete`),

    canManage: (resource) => hasAllPermissions([
      `${resource}.view`,
      `${resource}.create`,
      `${resource}.edit`,
      `${resource}.delete`
    ]),

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
