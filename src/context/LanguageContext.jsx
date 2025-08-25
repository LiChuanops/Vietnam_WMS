import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext({})

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Language translations
const translations = {
  en: {
    // ===== SYSTEM & NAVIGATION =====
    dashboard: 'Dashboard',
    navigation: 'Navigation',
    welcome: 'Welcome',
    signOut: 'Sign out',
    comingSoon: 'Coming Soon',
    loading: 'Loading...',
    noData: 'No data available',
    showing: 'Showing',
    of: 'of',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    actions: 'Actions',
    save: 'Save',
    select: 'Select',
    submit: 'Submit',
    confirm: 'Confirm',
    print: 'Print',
    
    // ===== LOGIN =====
    signInToAccount: 'Sign in to your account',
    managementSystem: 'LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Email address',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    
    // ===== SIDEBAR MENU =====
    productList: 'Product List',
    inventory: 'Export-Inventory',
    localInventory: 'Local-Inventory',
    rawMaterial: 'Raw Material',
    packagingMaterial: 'Packaging Material',
    
    // ===== PRODUCT MANAGEMENT =====
    itemCode: 'Item Code',
    productName: 'Product Name',
    vietnameseName: 'Vietnamese Name',
    type: 'Type',
    country: 'Country',
    vendor: 'Vendor',
    workInProgress: 'Work In Progress',
    uom: 'UOM',
    packingSize: 'Packing Size',
    status: 'Status',
    
    // Product Status
    active: 'Active',
    inactive: 'Inactive',
    discontinued: 'Discontinued',
    
    // Product Actions
    addNewProduct: 'Add New Product',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    updateProduct: 'Update Product',
    
    // Product Filters
    allCountries: 'All Countries',
    allVendors: 'All Vendors',
    allPackingSizes: 'All Packing Sizes',
    showVietnamese: 'Show Vietnamese Names',
    searchProducts: 'Search products...',
    products: 'products',
    showAccountCode: 'Show Account Code',
    hideAccountCode: 'Hide Account Code',
    accountCode: 'Account Code',
    exportCsv: 'Export CSV',
    
    // Form Helper Text
    pleaseSelectCountry: 'Please select country',
    pleaseSelectCompanyName: 'Please select company name',
    howManyKgPerCarton: 'How many kg per carton',
    productCategoryClassification: 'Product category/classification',
    
    // ===== INVENTORY MANAGEMENT =====
    exportInventory: 'Export Inventory',
    importInventory: 'Import Inventory',
    inventorySummary: 'Inventory Summary',
    inbound: 'Inbound',
    outbound: 'Outbound',
    reports: 'Reports',
    transaction: 'Transaction',
    packageConversion: 'Package Conversion',
    standardInbound: 'Standard Inbound',
    sourceProduct: 'Source Product',
    targetProduct: 'Target Product',
    quantityToConvert: 'Quantity to Convert',
    conversionDate: 'Conversion Date',
    submitConversion: 'Submit Conversion',
    
    // Inventory Summary
    currentStock: 'Current Stock',
    availableStock: 'Available Stock',
    totalInbound: 'Total Inbound',
    totalOutbound: 'Total Outbound',
    month: 'Month',
    export: 'Export',
    exportToExcel: 'Export to Excel',
    showingProducts: 'Showing products with stock',
    loadingInventorySummary: 'Loading inventory summary...',
    
    // ===== INBOUND TRANSACTIONS =====
    productSelection: 'Product Selection',
    availableProducts: 'Available Products',
    selectedProductsForInbound: 'Selected Products for Inbound',
    addInbound: 'Add Inbound',
    transactionDate: 'Transaction Date',
    noProductsSelected: 'No Products Selected',
    selectCountryFromFilters: 'Select a country from the filters above to view available products.',
    onceSelectCountry: 'Once you select a country, products will appear below for you to add to your inbound transaction.',
    
    // Inbound Form Fields
    serialNumber: 'S/N',
    productCode: 'Product Code',
    productDescription: 'Product Name',
    packing: 'Packing',
    quantity: 'Quantity',
    notes: 'Notes',
    add: 'Add',
    remove: 'Remove',
    
    // Inbound Summary
    totalProducts: 'Total Products',
    totalQuantity: 'Total Quantity',
    date: 'Date',
    processing: 'Processing...',
    addInboundTransactions: 'Add Inbound Transaction',
    
    // Messages
    pleaseAddAtLeastOneProduct: 'Please add at least one product',
    pleaseEnterQuantityFor: 'Please enter quantity for',
    inboundTransactionsAddedSuccessfully: 'inbound transactions added successfully!',
    
    // ===== OUTBOUND TRANSACTIONS =====
    selectedProductsForOutbound: 'Selected Products for Outbound',
    shipmentInformation: 'Shipment Information',
    shipment: 'Shipment',
    containerNumber: 'Container Number',
    sealNo: 'Seal No',
    etd: 'ETD',
    eta: 'ETA',
    poNumber: 'PO Number',
    
    // Outbound Form Fields
    batchNo: 'Batch No',
    manualAdd: 'Manual Add',
    batchNumber: 'Batch number',
    exceedsStock: 'Exceeds stock',
    
    // Manual Add Form
    enterNewProductCode: 'Product Code *',
    enterNewProductName: 'Product Name *',
    enterNewPacking: 'Packing',
    enterNewBatchNo: 'Batch No',
    enterNewQuantity: 'Quantity',
    manualEntry: 'Manual Entry',
    
    // Outbound Summary
    createOutboundTransaction: 'Create Outbound Transaction',
    createOutboundTransactions: 'Create Outbound Transactions',
    outboundTransactionsAddedSuccessfully: 'Outbound transactions added successfully!',
    
    // ===== PRODUCT SELECTION FILTERS =====
    allTypes: 'All Types',
    available: 'available',
    searchByNameCodeType: 'Search by name, code, or type...',
    activeFilters: 'Active filters:',
    foundProducts: 'Found products',
    ofTotal: 'of total',
    hideProducts: 'Hide Products',
    showProducts: 'Show Products',
    clearAll: 'Clear All',
    
    // Filter Tags
    countryFilter: 'Country:',
    vendorFilter: 'Vendor:',
    typeFilter: 'Type:',
    searchFilter: 'Search:',
    
    // ===== SHIPMENT INFO =====
    shipmentName: 'Shipment name',
    containerNumberPlaceholder: 'Container number',
    sealNumber: 'Seal number',
    
    // ===== REPORTS =====
    featureUnderDevelopment: 'Feature Under Development',
    reportingFeatureBeingDeveloped: 'The reporting feature is currently being developed. Please check back soon for updates.',
    
    // ===== PERMISSIONS & ACCESS =====
    accessDenied: 'Access Denied',
    noPermissionToAddInbound: "You don't have permission to add inbound transactions",
    noPermissionToAddOutbound: "You don't have permission to add outbound transactions",
    
    // ===== TABLE HEADERS =====
    code: 'Code',
    action: 'Action',
    
    // ===== VALIDATION MESSAGES =====
    noProductsFoundMatching: 'No products found matching the selected criteria.',
    tryAdjustingFilters: 'Try adjusting your search terms or filters.',
    pleaseEnterProductCodeAndName: 'Please enter product code and name',
    pleaseEnterBatchNumberFor: 'Please enter batch number for',
    insufficientStockFor: 'Insufficient stock for',
    
    // ===== GENERAL INVENTORY =====
    loadingAvailableProducts: 'Loading available products...',
    refreshPage: 'refresh the page',
    noInventoryData: 'No inventory data',
    tryAdjustingFiltersInventory: 'No products have current stock or try adjusting your filters',
    customDeclaration: 'Custom Declaration',
    toggleView: 'Toggle View',
    showMonthlyInOut: 'Show Monthly In/Out',
    showCurrentStock: 'Show Current Stock',
    in: 'In',
    out: 'Out',
    errorAddingTransactions: 'Error adding transactions: ',
    unexpectedError: 'Unexpected error',
    notAvailable: 'N/A',
    unexpectedErrorFetchingProducts: 'Unexpected error fetching products:',
    accountExcelDownload: 'Account Excel Download',
    exporting: 'Exporting...',

    // ===== STOCK ADJUSTMENT =====
    stockAdjustment: 'Stock Adjustment',
    adjustmentDate: 'Adjustment Date',
    adjustmentStock: 'Adjustment Stock',
    newStock: 'New Stock',
    reason: 'Reason',
    monthlyStockAdjustment: 'Monthly Stock Adjustment',
    noChangesToSubmit: 'No changes to submit.',
    adjustmentSuccess: 'Stock adjustment submitted successfully.',
    adjustmentFailed: 'Failed to submit stock adjustment',
    confirmAdjustment: 'Confirm Adjustment',
    confirmAdjustmentMessage: 'Are you sure you want to submit these stock adjustments?',
    submitting: 'Submitting',
    change: 'Change',
    adj_short: 'Adj',

    // ===== REPORTS (New section) =====
    reportsDescription: 'View reports and archived records.',
    archivedShipments: 'Archived Shipments',
    noCustomDeclarationsFound: 'No Custom Declarations Found',
    noArchivedShipmentsFound: 'No Archived Shipments Found',
    backToReports: 'Back to Reports',
    clickToViewDetails: 'Click on any declaration to view details',
    refresh: 'Refresh',
    loadingArchivedShipments: 'Loading archived shipments...',
    archivedShipmentsDescription: 'A record of all processed outbound shipments.',
    processOutboundToSeeArchive: 'Process an outbound shipment to see its archive here.',
    archivedAt: 'Archived At',
    failedToLoadArchivedShipments: 'Failed to load archived shipments.',
    loadingArchiveDetails: 'Loading archive details...',
    couldNotLoadArchive: 'Could not load archive data.',
    archivedShipment: 'Archived Shipment',
    downloadToExcel: 'Download to Excel',
    shippedProducts: 'Shipped Products',
    customerCode: 'Customer Code',
    totalWeight: 'Total Weight',
    remark: 'Remark',
    failedToLoadArchiveDetails: 'Failed to load archive details.',
    loadingDeclarationDetails: 'Loading declaration details...',
    customDeclarationForm: 'Custom Declaration Form',
    declarationDate: 'Declaration Date',
    createdAt: 'Created At',
    weightSummary: 'Weight Summary',
    netWeight: 'Net Weight (kg)',
    cartonWeight: 'Carton Weight (kg)',
    grossWeight: 'Gross Weight (kg)',
    productDetails: 'Product Details',
    productsInDeclaration: '{count} products in this declaration',
    print: 'Print',

    // Monthly Stock Report
    monthlyStockReport: 'Monthly Stock Movement Report',
    monthlyStockReportDesc: 'Select a month to view the opening stock, monthly movements, and closing stock for all products.',
    selectMonth: 'Select Month:',
    viewDetails: 'View Details',
    viewByWeight: 'View By Weight',
    downloadExcel: 'Download Excel',
    openingStock: 'Opening Stock',
    adjustment: 'Adjustment',
    closingStock: 'Closing Stock',
    systemCode: 'System Code',
    openingStockKg: 'Opening Stock (kg)',
    inboundKg: 'Inbound (kg)',
    outboundKg: 'Outbound (kg)',
    adjustmentKg: 'Adjustment (kg)',
    closingStockKg: 'Closing Stock (kg)',
    noDataForMonth: 'No data for the selected month.',
    tryDifferentMonth: 'Please select a month, or try a different month.'
  },
  
  vi: {
    // ===== SYSTEM & NAVIGATION =====
    dashboard: 'Bảng điều khiển',
    navigation: 'Điều hướng',
    welcome: 'Chào mừng',
    signOut: 'Đăng xuất',
    comingSoon: 'Sắp có',
    loading: 'Đang tải...',
    noData: 'Không có dữ liệu',
    showing: 'Hiển thị',
    of: 'của',
    cancel: 'Hủy',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    actions: 'Thao tác',
    save: 'Lưu',
    select: 'Chọn',
    submit: 'Gửi',
    confirm: 'Xác nhận',
    print: 'In',
    
    // ===== LOGIN =====
    signInToAccount: 'Đăng nhập vào tài khoản của bạn',
    managementSystem: 'Hệ thống quản lý LI CHUAN FOOD PRODUCTS CO., LTD',
    emailAddress: 'Địa chỉ email',
    password: 'Mật khẩu',
    signIn: 'Đăng nhập',
    signingIn: 'Đang đăng nhập...',
    
    // ===== SIDEBAR MENU =====
    productList: 'Danh sách sản phẩm',
    inventory: 'Xuất-Kho hàng',
    localInventory: 'Local-Inventory',
    rawMaterial: 'Raw Material',
    packagingMaterial: 'Packaging Material',

    // ===== PRODUCT MANAGEMENT =====
    itemCode: 'Mã sản phẩm',
    productName: 'Tên sản phẩm',
    vietnameseName: 'Tên tiếng Việt',
    type: 'Loại',
    country: 'Quốc gia',
    vendor: 'Nhà cung cấp',
    workInProgress: 'Đang thực hiện',
    uom: 'Đơn vị tính',
    packingSize: 'Kích thước đóng gói',
    status: 'Trạng thái',
    
    // Product Status
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    discontinued: 'Ngừng sản xuất',
    
    // Product Actions
    addNewProduct: 'Thêm sản phẩm mới',
    addProduct: 'Thêm sản phẩm',
    editProduct: 'Chỉnh sửa sản phẩm',
    updateProduct: 'Cập nhật sản phẩm',
    
    // Product Filters
    allCountries: 'Tất cả quốc gia',
    allVendors: 'Tất cả nhà cung cấp',
    allPackingSizes: 'Tất cả các kích thước đóng gói',
    showVietnamese: 'Hiển thị tên tiếng Việt',
    searchProducts: 'Tìm kiếm sản phẩm...',
    products: 'sản phẩm',
    showAccountCode: 'Hiện mã tài khoản',
    hideAccountCode: 'Ẩn mã tài khoản',
    accountCode: 'Mã tài khoản',
    exportCsv: 'Xuất CSV',
    
    // Form Helper Text
    pleaseSelectCountry: 'Vui lòng chọn quốc gia',
    pleaseSelectCompanyName: 'Vui lòng chọn tên công ty',
    howManyKgPerCarton: 'Bao nhiêu kg mỗi thùng',
    productCategoryClassification: 'Phân loại danh mục sản phẩm',
    
    // ===== INVENTORY MANAGEMENT =====
    exportInventory: 'Xuất kho',
    importInventory: 'Nhập kho',
    inventorySummary: 'Tóm tắt kho hàng',
    inbound: 'Nhập kho',
    outbound: 'Xuất kho',
    reports: 'Báo cáo',
    transaction: 'Giao dịch',
    packageConversion: 'Chuyển đổi bao bì',
    standardInbound: 'Nhập kho tiêu chuẩn',
    sourceProduct: 'Sản phẩm nguồn',
    targetProduct: 'Sản phẩm đích',
    quantityToConvert: 'Số lượng chuyển đổi',
    conversionDate: 'Ngày chuyển đổi',
    submitConversion: 'Gửi chuyển đổi',
    
    // Inventory Summary
    currentStock: 'Tồn kho hiện tại',
    availableStock: 'Kho có sẵn',
    totalInbound: 'Tổng nhập',
    totalOutbound: 'Tổng xuất',
    month: 'Tháng',
    export: 'Xuất',
    exportToExcel: 'Xuất ra Excel',
    showingProducts: 'Hiển thị sản phẩm có tồn kho',
    loadingInventorySummary: 'Đang tải tóm tắt kho hàng...',
    
    // ===== INBOUND TRANSACTIONS =====
    productSelection: 'Lựa chọn sản phẩm',
    availableProducts: 'Sản phẩm có sẵn',
    selectedProductsForInbound: 'Sản phẩm đã chọn để nhập kho',
    addInbound: 'Thêm nhập kho',
    transactionDate: 'Ngày giao dịch',
    noProductsSelected: 'Không có sản phẩm nào được chọn',
    selectCountryFromFilters: 'Chọn một quốc gia từ bộ lọc ở trên để xem các sản phẩm có sẵn.',
    onceSelectCountry: 'Khi bạn chọn một quốc gia, các sản phẩm sẽ xuất hiện bên dưới để bạn thêm vào giao dịch nhập kho.',
    
    // Inbound Form Fields
    serialNumber: 'STT',
    productCode: 'Mã sản phẩm',
    productDescription: 'Tên sản phẩm',
    packing: 'Đóng gói',
    quantity: 'Số lượng',
    notes: 'Ghi chú',
    add: 'Thêm',
    remove: 'Xóa',
    
    // Inbound Summary
    totalProducts: 'Tổng sản phẩm',
    totalQuantity: 'Tổng số lượng',
    date: 'Ngày',
    processing: 'Đang xử lý...',
    addInboundTransactions: 'Thêm giao dịch nhập kho',
    
    // Messages
    pleaseAddAtLeastOneProduct: 'Vui lòng thêm ít nhất một sản phẩm',
    pleaseEnterQuantityFor: 'Vui lòng nhập số lượng cho',
    inboundTransactionsAddedSuccessfully: 'giao dịch nhập kho đã được thêm thành công!',
    
    // ===== OUTBOUND TRANSACTIONS =====
    selectedProductsForOutbound: 'Sản phẩm đã chọn để xuất kho',
    shipmentInformation: 'Thông tin lô hàng',
    shipment: 'Lô hàng',
    containerNumber: 'Số container',
    sealNo: 'Số seal',
    etd: 'Ngày khởi hành dự kiến',
    eta: 'Ngày đến dự kiến',
    poNumber: 'Số PO',
    
    // Outbound Form Fields
    batchNo: 'Số lô',
    manualAdd: 'Thêm thủ công',
    batchNumber: 'Số lô hàng',
    exceedsStock: 'Vượt quá tồn kho',
    
    // Manual Add Form
    enterNewProductCode: 'Mã sản phẩm *',
    enterNewProductName: 'Tên sản phẩm *',
    enterNewPacking: 'Đóng gói',
    enterNewBatchNo: 'Số lô',
    enterNewQuantity: 'Số lượng',
    manualEntry: 'Nhập thủ công',
    
    // Outbound Summary
    createOutboundTransaction: 'Tạo giao dịch xuất kho',
    createOutboundTransactions: 'Tạo các giao dịch xuất kho',
    outboundTransactionsAddedSuccessfully: 'Giao dịch xuất kho đã được thêm thành công!',
    
    // ===== PRODUCT SELECTION FILTERS =====
    allTypes: 'Tất cả loại',
    available: 'có sẵn',
    searchByNameCodeType: 'Tìm kiếm theo tên, mã hoặc loại...',
    activeFilters: 'Bộ lọc đang hoạt động:',
    foundProducts: 'Tìm thấy sản phẩm',
    ofTotal: 'của tổng số',
    hideProducts: 'Ẩn sản phẩm',
    showProducts: 'Hiển thị sản phẩm',
    clearAll: 'Xóa tất cả',
    
    // Filter Tags
    countryFilter: 'Quốc gia:',
    vendorFilter: 'Nhà cung cấp:',
    typeFilter: 'Loại:',
    searchFilter: 'Tìm kiếm:',
    
    // ===== SHIPMENT INFO =====
    shipmentName: 'Tên lô hàng',
    containerNumberPlaceholder: 'Số container',
    sealNumber: 'Số seal',
    
    // ===== REPORTS =====
    featureUnderDevelopment: 'Tính năng đang phát triển',
    reportingFeatureBeingDeveloped: 'Tính năng báo cáo hiện đang được phát triển. Vui lòng kiểm tra lại sau để có cập nhật.',
    
    // ===== PERMISSIONS & ACCESS =====
    accessDenied: 'Truy cập bị từ chối',
    noPermissionToAddInbound: 'Bạn không có quyền thêm giao dịch nhập kho',
    noPermissionToAddOutbound: 'Bạn không có quyền thêm giao dịch xuất kho',
    
    // ===== TABLE HEADERS =====
    code: 'Mã',
    action: 'Thao tác',
    
    // ===== VALIDATION MESSAGES =====
    noProductsFoundMatching: 'Không tìm thấy sản phẩm nào phù hợp với tiêu chí đã chọn.',
    tryAdjustingFilters: 'Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc của bạn.',
    pleaseEnterProductCodeAndName: 'Vui lòng nhập mã sản phẩm và tên',
    pleaseEnterBatchNumberFor: 'Vui lòng nhập số lô cho',
    insufficientStockFor: 'Không đủ hàng cho',
    
    // ===== GENERAL INVENTORY =====
    loadingAvailableProducts: 'Đang tải sản phẩm có sẵn...',
    refreshPage: 'làm mới trang',
    noInventoryData: 'Không có dữ liệu kho hàng',
    tryAdjustingFiltersInventory: 'Không có sản phẩm nào có tồn kho hiện tại hoặc thử điều chỉnh bộ lọc của bạn',
    customDeclaration: 'Tờ khai hải quan',
    toggleView: 'Chuyển đổi chế độ xem',
    showMonthlyInOut: 'Hiển thị Nhập/Xuất hàng tháng',
    showCurrentStock: 'Hiển thị hàng tồn kho hiện tại',
    in: 'Nhập',
    out: 'Xuất',
    errorAddingTransactions: 'Lỗi khi thêm giao dịch: ',
    unexpectedError: 'Lỗi không mong muốn',
    notAvailable: 'Không có',
    unexpectedErrorFetchingProducts: 'Lỗi không mong muốn khi tìm nạp sản phẩm:',
    accountExcelDownload: 'Tải xuống Excel Tài khoản',
    exporting: 'Đang xuất...',

    // ===== STOCK ADJUSTMENT =====
    stockAdjustment: 'Điều chỉnh kho',
    adjustmentDate: 'Ngày điều chỉnh',
    adjustmentStock: 'Tồn kho điều chỉnh',
    newStock: 'Tồn kho mới',
    reason: 'Lý do',
    monthlyStockAdjustment: 'Điều chỉnh tồn kho hàng tháng',
    noChangesToSubmit: 'Không có thay đổi nào để gửi.',
    adjustmentSuccess: 'Gửi điều chỉnh tồn kho thành công.',
    adjustmentFailed: 'Gửi điều chỉnh tồn kho thất bại',
    confirmAdjustment: 'Xác nhận điều chỉnh',
    confirmAdjustmentMessage: 'Bạn có chắc chắn muốn gửi những điều chỉnh tồn kho này không?',
    submitting: 'Đang gửi',
    change: 'Thay đổi',
    adj_short: 'Adj',

    // ===== REPORTS (New section) =====
    reportsDescription: 'Xem báo cáo và hồ sơ lưu trữ.',
    archivedShipments: 'Lô hàng lưu trữ',
    noCustomDeclarationsFound: 'Không tìm thấy tờ khai hải quan nào',
    noArchivedShipmentsFound: 'Không tìm thấy lô hàng lưu trữ nào',
    backToReports: 'Quay lại Báo cáo',
    clickToViewDetails: 'Nhấp vào bất kỳ tờ khai nào để xem chi tiết',
    refresh: 'Làm mới',
    loadingArchivedShipments: 'Đang tải các lô hàng đã lưu trữ...',
    archivedShipmentsDescription: 'Hồ sơ của tất cả các lô hàng xuất kho đã được xử lý.',
    processOutboundToSeeArchive: 'Xử lý một lô hàng xuất kho để xem kho lưu trữ của nó ở đây.',
    archivedAt: 'Lưu trữ tại',
    failedToLoadArchivedShipments: 'Không thể tải các lô hàng đã lưu trữ.',
    loadingArchiveDetails: 'Đang tải chi tiết lưu trữ...',
    couldNotLoadArchive: 'Không thể tải dữ liệu lưu trữ.',
    archivedShipment: 'Lô hàng đã lưu trữ',
    downloadToExcel: 'Tải xuống Excel',
    shippedProducts: 'Sản phẩm đã vận chuyển',
    customerCode: 'Mã khách hàng',
    totalWeight: 'Tổng trọng lượng',
    remark: 'Ghi chú',
    failedToLoadArchiveDetails: 'Không thể tải chi tiết lưu trữ.',
    loadingDeclarationDetails: 'Đang tải chi tiết tờ khai...',
    customDeclarationForm: 'Tờ khai hải quan',
    declarationDate: 'Ngày khai báo',
    createdAt: 'Tạo lúc',
    weightSummary: 'Tóm tắt trọng lượng',
    netWeight: 'Trọng lượng tịnh (kg)',
    cartonWeight: 'Trọng lượng thùng (kg)',
    grossWeight: 'Trọng lượng cả bì (kg)',
    productDetails: 'Chi tiết sản phẩm',
    productsInDeclaration: '{count} sản phẩm trong tờ khai này',
    print: 'In',

    // Monthly Stock Report
    monthlyStockReport: 'Báo cáo biến động kho hàng tháng',
    monthlyStockReportDesc: 'Chọn một tháng để xem tồn kho đầu kỳ, biến động trong tháng và tồn kho cuối kỳ của tất cả sản phẩm.',
    selectMonth: 'Chọn tháng:',
    viewDetails: 'Xem chi tiết',
    viewByWeight: 'Xem theo trọng lượng',
    downloadExcel: 'Tải xuống Excel',
    openingStock: 'Tồn kho đầu kỳ',
    adjustment: 'Điều chỉnh',
    closingStock: 'Tồn kho cuối kỳ',
    systemCode: 'Mã hệ thống',
    openingStockKg: 'Tồn kho đầu kỳ (kg)',
    inboundKg: 'Nhập kho (kg)',
    outboundKg: 'Xuất kho (kg)',
    adjustmentKg: 'Điều chỉnh (kg)',
    closingStockKg: 'Tồn kho cuối kỳ (kg)',
    noDataForMonth: 'Không có dữ liệu cho tháng đã chọn.',
    tryDifferentMonth: 'Vui lòng chọn một tháng, hoặc thử một tháng khác.'
  }
}

// 获取初始语言设置
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('wms-language')
    return savedLanguage && ['en', 'vi'].includes(savedLanguage) ? savedLanguage : 'en'
  } catch (error) {
    console.warn('Failed to get language from localStorage:', error)
    return 'en'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage)

  // 保存语言设置到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wms-language', language)
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error)
    }
  }, [language])

  const toggleLanguage = () => {
    console.log('Toggling language from', language, 'to', language === 'en' ? 'vi' : 'en')
    setLanguage(prev => prev === 'en' ? 'vi' : 'en')
  }

  const setLanguageDirectly = (lang) => {
    if (['en', 'vi'].includes(lang)) {
      console.log('Setting language directly to:', lang)
      setLanguage(lang)
    }
  }

  const t = (key) => {
    const translation = translations[language]?.[key]
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`)
      return key
    }
    return translation
  }

  const value = {
    language,
    setLanguage: setLanguageDirectly,
    toggleLanguage,
    t,
    translations: translations[language] // 提供完整的翻译对象，以防需要
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
