# LI CHUAN FOOD PRODUCTS CO., LTD - WMS (Warehouse Management System)

## Project Overview
A comprehensive warehouse management system built with React + Vite + Supabase, designed specifically for Li Chuan Food Products Company. The system handles product management, inventory control, inbound/outbound transactions, and reporting.

## Tech Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Language Support**: English + Vietnamese

## Project Structure

```
Vietnam_WMS/
├── public/
├── src/
│   ├── components/          # React Components
│   │   ├── Dashboard.jsx    # Main dashboard layout
│   │   ├── Login.jsx        # Authentication component
│   │   ├── ProductList.jsx  # Product management
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   └── inventory/       # Inventory module components
│   │       ├── ExportInventory.jsx      # Main inventory container
│   │       ├── InboundTransactions.jsx  # Goods receipt management
│   │       ├── InventoryReports.jsx     # Reporting and analytics
│   │       ├── InventorySummary.jsx     # Stock overview dashboard
│   │       ├── OutboundTransactions.jsx # Goods issue management
│   │       └── inventory service.js     # Inventory API services
│   ├── context/             # React Context Providers
│   │   ├── AuthContext.jsx      # Authentication state
│   │   ├── LanguageContext.jsx  # Multi-language support
│   │   └── PermissionContext.jsx # Role-based access control
│   ├── supabase/
│   │   └── client.js        # Supabase configuration
│   ├── App.jsx              # Root application component
│   ├── main.jsx             # Application entry point
│   ├── index.css            # Global styles with Tailwind
│   └── vercel.json          # Vercel deployment config
├── .gitignore               # Git ignore rules
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.js           # Vite build configuration
```

## Core Feature Modules

### 1. Authentication System (AuthContext)
- User login/logout functionality
- User profile management
- Supabase Auth integration
- Session management with auto-refresh

**Key Functions:**
- `signIn(email, password)` - User authentication
- `signOut()` - Session termination
- `fetchUserProfile(userId)` - Load user profile data

### 2. Permission Management (PermissionContext)
- Role-Based Access Control (RBAC)
- Supported roles: `admin`, `manager`, `staff`, `warehouse_staff`, `viewer`
- Permission constants and validation components
- Protected route components

**Permission Categories:**
- `PRODUCT_*` - Product management permissions
- `INVENTORY_*` - Inventory control permissions
- `TRANSACTION_*` - Transaction management permissions
- `REPORT_*` - Reporting and export permissions

### 3. Product Management (ProductList)
- Full CRUD operations for products
- Automatic product code generation
- Batch operations support
- Multi-language product names (English/Vietnamese)
- Advanced filtering and search capabilities
- Status management (Active/Inactive/Discontinued)

**Key Features:**
- Smart product code generation based on country/vendor/WIP status
- Form validation with real-time feedback
- Bulk status updates
- Export capabilities

### 4. Inventory Management (Inventory Module)
Comprehensive inventory control system with four main sub-modules:

#### 4.1 Inventory Summary (InventorySummary)
- Real-time stock overview
- Monthly transaction history
- Product-wise stock levels
- Daily transaction tracking
- Export to CSV functionality

#### 4.2 Inbound Transactions (InboundTransactions)
- Goods receipt processing
- Single and bulk transaction entry
- Product selection with filtering
- Transaction history with search
- Automatic stock updates

#### 4.3 Outbound Transactions (OutboundTransactions)
- Goods issue management
- System-based and manual product entry
- Shipment information tracking
- Batch number management
- Stock validation and controls

#### 4.4 Inventory Reports (InventoryReports)
- Multiple report types:
  - Current Stock Report
  - Transactions Summary
  - Monthly Summary
  - Low Stock Alerts
  - Shipment Details
- Export capabilities (CSV/Excel)
- Print functionality for shipment documents
- Date range filtering

### 5. Multi-Language Support (LanguageContext)
- English/Vietnamese language switching
- Comprehensive translation coverage
- Context-aware translations
- UI language persistence

## Database Schema (Supabase)

### Core Tables:
- `products` - Product master data
- `inventory_transactions` - All stock movements
- `profiles` - User profiles and roles
- `current_inventory` - Real-time stock levels (view)

### Views and Functions:
- `current_inventory` - Calculated current stock levels
- `inventory_transactions_export` - Export-ready transaction data
- `monthly_inventory_report` - Monthly aggregated data

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd Vietnam_WMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Configure Supabase credentials in `src/supabase/client.js`
   - Set up Supabase database schema
   - Configure user roles and permissions

4. **Development**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## File Dependencies & Critical Components

### When asking questions about this project, please ensure you include:

#### Core Configuration Files:
- `package.json` - Dependencies and versions
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Styling configuration

#### Essential Components:
- `src/App.jsx` - Main application structure
- `src/context/AuthContext.jsx` - Authentication logic
- `src/context/PermissionContext.jsx` - Access control
- `src/supabase/client.js` - Database connection

#### Feature-Specific Files:
**For Product Management Issues:**
- `src/components/ProductList.jsx`

**For Inventory Issues:**
- `src/components/inventory/InventorySummary.jsx`
- `src/components/inventory/InboundTransactions.jsx`
- `src/components/inventory/OutboundTransactions.jsx`
- `src/components/inventory/InventoryReports.jsx`
- `src/components/inventory/inventory service.js`

**For UI/Layout Issues:**
- `src/components/Dashboard.jsx`
- `src/components/Sidebar.jsx`
- `src/index.css`

**For Authentication Issues:**
- `src/components/Login.jsx`
- `src/context/AuthContext.jsx`

## Common Development Scenarios

### Adding New Features:
1. Check permission requirements in `PermissionContext.jsx`
2. Update language translations in `LanguageContext.jsx`
3. Add new API calls to appropriate service files
4. Update UI components with proper permission gates

### Debugging Issues:
1. Check browser console for errors
2. Verify Supabase connection and queries
3. Validate user permissions for the action
4. Check component props and state management

### Database Changes:
1. Update Supabase schema
2. Modify `inventory service.js` if needed
3. Update component queries and data handling
4. Test with different user roles

## Key Features to Remember:

1. **Smart Product Code Generation** - Automatic based on country/vendor/WIP status
2. **Role-Based Permissions** - Different access levels per user role
3. **Multi-Language Support** - English/Vietnamese switching
4. **Real-Time Stock Tracking** - Automatic calculation from transactions
5. **Comprehensive Reporting** - Multiple export formats and print options
6. **Shipment Management** - Detailed tracking with batch numbers
7. **Responsive Design** - Tailwind CSS for mobile compatibility

## Support & Maintenance

When reporting issues or requesting changes, please specify:
- User role experiencing the issue
- Specific component/feature affected
- Browser and device information
- Steps to reproduce the problem
- Expected vs actual behavior

This README serves as a reference for the complete project structure and should help identify which files are needed for specific development tasks or troubleshooting.
