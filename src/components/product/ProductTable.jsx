import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { usePermissions, PERMISSIONS } from '../../context/PermissionContext'

const ProductTable = ({
  filteredProducts,
  showVietnamese,
  uniqueWIP,
  updateLoading,
  onStatusUpdate,
  onEditProduct,
  onDeleteProduct
}) => {
  const { t } = useLanguage()
  const { PermissionGate } = usePermissions()

  if (filteredProducts.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg" style={{ maxHeight: '70vh' }}>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 sticky left-0 bg-gray-50 z-20">
                  {t('itemCode')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-64 sticky left-32 bg-gray-50 z-20">
                  {showVietnamese ? t('vietnameseName') : t('productName')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t('country')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  {t('vendor')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  {t('uom')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t('packingSize')}
                </th>
                {uniqueWIP.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    {t('workInProgress')}
                  </th>
                )}
                
                <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    {t('status')}
                  </th>
                </PermissionGate>
                
                <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT]} requireAll={false}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sticky right-0 bg-gray-50 z-20">
                    {t('actions')}
                  </th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 9l4 4L9 17" />
                    </svg>
                    <p className="text-lg font-medium">{t('noData')}</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters to see more results</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg" style={{ maxHeight: '70vh' }}>
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 sticky left-0 bg-gray-50 z-20">
                {t('itemCode')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-64 sticky left-32 bg-gray-50 z-20">
                {showVietnamese ? t('vietnameseName') : t('productName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                {t('country')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                {t('vendor')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                {t('uom')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                {t('packingSize')}
              </th>
              {uniqueWIP.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t('workInProgress')}
                </th>
              )}
              
              <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  {t('status')}
                </th>
              </PermissionGate>
              
              <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT]} requireAll={false}>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sticky right-0 bg-gray-50 z-20">
                  {t('actions')}
                </th>
              </PermissionGate>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <ProductRow
                key={product.system_code}
                product={product}
                showVietnamese={showVietnamese}
                uniqueWIP={uniqueWIP}
                updateLoading={updateLoading}
                onStatusUpdate={onStatusUpdate}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Individual Product Row Component
const ProductRow = ({
  product,
  showVietnamese,
  uniqueWIP,
  updateLoading,
  onStatusUpdate,
  onEditProduct,
  onDeleteProduct
}) => {
  const { t } = useLanguage()
  const { PermissionGate } = usePermissions()

  const handleStatusChange = (e) => {
    e.stopPropagation()
    onStatusUpdate(product.system_code, e.target.value)
  }

  const handleEditClick = () => {
    onEditProduct(product)
  }

  const handleDeleteClick = () => {
    onDeleteProduct(product)
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
        {product.system_code}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 break-words sticky left-32 bg-white z-10">
        {showVietnamese ? product.viet_name || product.product_name : product.product_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.country}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.vendor}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.uom}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {product.packing_size}
      </td>
      {uniqueWIP.length > 0 && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {product.work_in_progress || '-'}
        </td>
      )}
      
      <PermissionGate permission={PERMISSIONS.PRODUCT_STATUS_CHANGE}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <StatusDropdown
            currentStatus={product.status || 'Active'}
            onChange={handleStatusChange}
            disabled={updateLoading}
          />
        </td>
      </PermissionGate>
      
      <PermissionGate permissions={[PERMISSIONS.PRODUCT_EDIT]} requireAll={false}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky right-0 bg-white z-10">
          <div className="flex space-x-2">
            <PermissionGate permission={PERMISSIONS.PRODUCT_EDIT}>
              <button
                onClick={handleEditClick}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                {t('edit')}
              </button>
            </PermissionGate>
            
            <PermissionGate permission={PERMISSIONS.PRODUCT_DELETE}>
              <button
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-900 text-sm font-medium ml-2"
              >
                {t('delete')}
              </button>
            </PermissionGate>
          </div>
        </td>
      </PermissionGate>
    </tr>
  )
}

// Status Dropdown Component
const StatusDropdown = ({ currentStatus, onChange, disabled }) => {
  const { t } = useLanguage()

  return (
    <select
      value={currentStatus}
      onChange={onChange}
      disabled={disabled}
      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
    >
      <option value="Active">{t('active')}</option>
      <option value="Inactive">{t('inactive')}</option>
      <option value="Discontinued">{t('discontinued')}</option>
    </select>
  )
}

export default ProductTable
