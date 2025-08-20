# LI CHUAN FOOD PRODUCTS CO., LTD - WMS (Warehouse Management System)

## 🌟 Overview
A comprehensive and modern warehouse management system built specifically for Li Chuan Food Products Company. This web-based application provides complete inventory control, product management, transaction tracking, and reporting capabilities with multi-language support.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.0-purple)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-Styling-cyan)

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **Vite 5** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Context API** - State management for auth, permissions, and language

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Secure data access
- **Database Functions** - Complex business logic
- **Real-time subscriptions** - Live data updates

### Deployment & DevOps
- **Vercel** - Frontend hosting and deployment
- **Environment Variables** - Secure configuration management
- **Git-based deployment** - Automatic deployments

## 📁 Project Architecture

```
Vietnam_WMS/
├── 📁 public/                          # Static assets
├── 📁 src/
│   ├── 📁 components/                  # React Components
│   │   ├── 📄 Dashboard.jsx            # Main dashboard with responsive layout
│   │   ├── 📄 Login.jsx               # Authentication interface
│   │   ├── 📄 ProductList.jsx         # Complete product management
│   │   ├── 📄 Sidebar.jsx             # Navigation with role-based menus
│   │   ├── 📁 inventory/              # 📦 Inventory Management Module
│   │   │   ├── 📄 ExportInventory.jsx         # Main inventory container
│   │   │   ├── 📄 InboundTransactions.jsx     # Goods receipt management
│   │   │   ├── 📄 InboundTransactionList.jsx  # Inbound history & editing
│   │   │   ├── 📄 OutboundTransactions.jsx    # Goods issue management
│   │   │   ├── 📄 OutboundTransactionList.jsx # Outbound history & editing
│   │   │   ├── 📄 CustomDeclarationForm.jsx   # Export documentation
│   │   │   ├── 📄 PackageConversion.jsx       # WIP package conversion
│   │   │   ├── 📄 ConversionForm.jsx          # Package conversion logic
│   │   │   ├── 📄 InventorySummary.jsx        # Stock overview & analytics
│   │   │   ├── 📄 InventoryReports.jsx        # Comprehensive reporting
│   │   │   ├── 📄 inventory service.js        # Inventory API services
│   │   │   ├── 📁 shared/                     # Shared components
│   │   │   ├── 📁 customDeclaration/          # Custom declaration components
│   │   │   ├── 📁 outbound/                   # Outbound-specific components
│   │   │   └── 📁 reports/                    # Reporting components
│   │   └── 📁 product/                # 🏷️ Product Management Module
│   │       ├── 📄 ProductFilters.jsx          # Advanced filtering system
│   │       ├── 📄 ProductForm.jsx             # Product creation/editing
│   │       └── 📄 ProductTable.jsx            # Data table with inline editing
│   ├── 📁 context/                    # 🔄 React Context Providers
│   │   ├── 📄 AuthContext.jsx              # Authentication & user management
│   │   ├── 📄 LanguageContext.jsx          # Multi-language support (EN/VI)
│   │   └── 📄 PermissionContext.jsx        # Role-based access control
│   ├── 📁 utils/                      # 🛠️ Utility Functions
│   │   ├── 📄 ProductCodeGenerator.js      # Smart product code generation
│   │   ├── 📄 dateUtils.js                 # Date formatting utilities
│   │   └── 📄 storageUtils.js              # Local storage helpers
│   ├── 📁 supabase/
│   │   └── 📄 client.js               # Supabase configuration & client
│   ├── 📄 App.jsx                     # Root application component
│   ├── 📄 main.jsx                    # Application entry point
│   └── 📄 index.css                   # Global styles with Tailwind imports
├── 📄 index.html                      # HTML template with favicons
├── 📄 package.json                    # Dependencies and npm scripts
├── 📄 tailwind.config.js              # Tailwind customization
├── 📄 vite.config.js                  # Vite build configuration
├── 📄 postcss.config.js               # PostCSS configuration
├── 📄 vercel.json                     # Vercel deployment settings
└── 📄 .gitignore                      # Git ignore rules
```

## 🎯 Core Features

### 🔐 Authentication & Authorization
- **Multi-user Support** - Secure user authentication via Supabase Auth
- **Role-Based Access Control (RBAC)** - 5 distinct user roles with granular permissions
- **Session Management** - Automatic session refresh and secure logout
- **User Profiles** - Extended user information and preferences

**Supported Roles:**
- `admin` - Full system access
- `manager` - Management-level operations
- `staff` - Standard operations
- `warehouse_staff` - Warehouse-specific functions
- `viewer` - Read-only access

### 🏷️ Product Management
- **Smart Product Code Generation** - Automatic code assignment based on business rules
- **Multi-language Support** - English and Vietnamese product names
- **Advanced Filtering** - Filter by country, vendor, type, packing size, and status
- **Bulk Operations** - Mass status updates and exports
- **Status Management** - Active/Inactive/Discontinued with change tracking
- **Account Code Management** - Financial integration codes

**Key Features:**
- Automatic product code generation for different countries and vendors
- Special handling for WIP (Work in Progress) products
- Comprehensive search and filter capabilities
- CSV export functionality
- Inline editing for account codes (permission-based)

### 📦 Inventory Management

#### 📥 Inbound Transactions
- **Bulk Product Entry** - Add multiple products in one transaction
- **Smart Product Selection** - Filtered product selection with stock awareness
- **Date-controlled Transactions** - Restrict to current month entries
- **Package Conversion** - Convert WIP products between different packaging sizes
- **Transaction History** - View and edit past inbound transactions

#### 📤 Outbound Transactions  
- **Shipment Management** - Complete shipment information tracking
- **Batch Number Support** - Detailed batch tracking for traceability
- **Stock Validation** - Prevent overselling with real-time stock checks
- **Manual Entry** - Add products not in the system
- **Custom Declaration Forms** - Generate export documentation

#### 📊 Inventory Analytics
- **Real-time Stock Levels** - Current inventory with automatic calculations
- **Daily Transaction View** - Month-by-month transaction breakdown
- **Interactive Reports** - Multiple report formats with export capabilities
- **Low Stock Alerts** - Automatic warnings for inventory management

### 📋 Custom Declaration System
- **Export Documentation** - Professional export forms for customs
- **Weight Calculations** - Automatic net, carton, and gross weight calculations
- **Print-Ready Formats** - Optimized printing layouts
- **Multi-product Support** - Handle complex export shipments
- **Historical Records** - Complete audit trail of all declarations

### 🌍 Multi-Language Support
- **English/Vietnamese Toggle** - Instant language switching
- **Comprehensive Translations** - All UI elements translated
- **User Preference Storage** - Language settings persistence
- **Context-Aware Content** - Smart translation based on user context

## 🗄️ Database Schema

### Core Tables
```sql
-- Product master data
products (
  system_code,          -- Primary key, unique product identifier
  product_name,         -- English product name
  viet_name,           -- Vietnamese product name
  country,             -- Country of origin
  vendor,              -- Vendor/supplier name
  type,                -- Product category
  packing_size,        -- Package size description
  uom,                 -- Unit of measure (kg per carton)
  work_in_progress,    -- WIP status for convertible products
  status,              -- Active/Inactive/Discontinued
  account_code,        -- Financial system integration
  customer_code,       -- Customer-specific product code
  action_date,         -- Last modification date
  user,                -- Last modified by user
  note                 -- Change history and notes
)

-- All inventory movements
inventory_transactions (
  id,                  -- Primary key
  product_id,          -- Foreign key to products
  transaction_type,    -- IN/OUT/OPENING/CONVERSION
  quantity,            -- Transaction quantity
  transaction_date,    -- Transaction date
  batch_number,        -- Batch tracking
  notes,               -- Transaction notes
  reference_number,    -- External reference
  created_by,          -- User who created transaction
  created_at           -- Timestamp
)

-- User profiles and roles
profiles (
  id,                  -- Primary key (matches auth.users.id)
  name,                -- User display name
  role,                -- User role for permissions
  created_at,          -- Account creation date
  updated_at           -- Last profile update
)

-- Role-based permissions
role_permissions (
  role,                -- User role
  module,              -- System module (products, inventory, etc.)
  action,              -- Specific action (view, create, edit, etc.)
  allowed              -- Permission granted (boolean)
)

-- Custom declaration forms
custom_declarations (
  id,                  -- Primary key
  po_number,           -- Purchase order number
  declaration_date,    -- Declaration date
  total_quantity,      -- Total quantity in declaration
  net_weight,          -- Total net weight
  carton_weight,       -- Total carton weight
  gross_weight,        -- Total gross weight
  created_by,          -- User who created
  created_at           -- Creation timestamp
)

-- Custom declaration line items
custom_declaration_items (
  id,                  -- Primary key
  declaration_id,      -- Foreign key to custom_declarations
  serial_number,       -- Line item number
  product_id,          -- Product code
  customer_code,       -- Customer product code
  account_code,        -- Account code
  product_name,        -- Product description
  packing_size,        -- Package size
  batch_number,        -- Batch number
  quantity,            -- Line quantity
  uom,                 -- Unit of measure
  total_weight,        -- Line total weight
  is_manual            -- Manual entry flag
)
```

### Views and Functions
```sql
-- Real-time stock calculation
current_inventory      -- Calculated current stock levels per product

-- Export-ready data views
inventory_transactions_export  -- Formatted transaction data for exports
monthly_inventory_report      -- Monthly aggregated inventory data

-- Stored procedures
perform_package_conversion()  -- Handle WIP package conversions
calculate_month_end_stock()   -- Monthly closing calculations
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase account** with configured database
- **Git** for version control

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd Vietnam_WMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Set up your Supabase project
   - Run the database migrations
   - Configure Row Level Security (RLS) policies
   - Set up user roles and permissions

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

The application is configured for **Vercel** deployment:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

## 🔧 Configuration & Customization

### Product Code Generation
The system includes intelligent product code generation based on:
- **Country-specific rules** - Different patterns for different countries
- **Vendor integration** - Vendor-specific code formats
- **WIP product handling** - Special codes for work-in-progress items
- **Sequential numbering** - Automatic increment based on existing codes

### Permission System
Fine-grained permissions control access to:
- **Product Management** - View, create, edit, change status
- **Account Codes** - View and edit financial codes
- **Inventory Operations** - Inbound/outbound transaction management
- **Reporting** - Access to various reports and exports

### Multi-Language
Easy expansion to additional languages:
1. Add translations to `src/context/LanguageContext.jsx`
2. Update language selection in UI components
3. Test all user flows in new language

## 📊 Key Features Deep Dive

### Smart Product Management
- **Automatic Code Generation**: Intelligent product codes based on country, vendor, and product type
- **Change Tracking**: Complete audit trail of all product modifications
- **Bulk Operations**: Mass updates for efficiency
- **Advanced Search**: Multi-criteria filtering with real-time results

### Inventory Control
- **Real-time Stock**: Calculated from all transaction history
- **Transaction Validation**: Prevent negative stock and invalid operations
- **Batch Tracking**: Complete traceability through supply chain
- **Package Conversion**: Handle WIP products with different packaging

### Export Documentation
- **Custom Declarations**: Professional export forms
- **Weight Calculations**: Automatic weight computations
- **Print Optimization**: Clean, professional printing layouts
- **Audit Trail**: Complete history of all export documents

## 🔍 Development Guidelines

### Adding New Features
1. **Plan the Data Model** - Update database schema if needed
2. **Create Components** - Follow existing component patterns
3. **Add Permissions** - Define role-based access requirements
4. **Update Translations** - Add multi-language support
5. **Test Thoroughly** - Test with different user roles

### Code Organization
- **Components** - Reusable UI components in logical folders
- **Context** - Global state management with React Context
- **Utils** - Pure functions for common operations
- **Services** - API communication and business logic

### Best Practices
- **Permission Checks** - Always validate user permissions
- **Error Handling** - Graceful error handling with user feedback
- **Performance** - Optimize database queries and component rendering
- **Accessibility** - Ensure keyboard navigation and screen reader support

## 🐛 Troubleshooting

### Common Issues

**Loading Issues:**
- Check Supabase connection and credentials
- Verify network connectivity
- Check browser console for detailed errors

**Permission Errors:**
- Verify user role assignments in database
- Check role_permissions table for correct permissions
- Ensure RLS policies allow required operations

**Database Connection:**
- Validate environment variables
- Check Supabase project status
- Verify API keys and URL configuration

**Performance Issues:**
- Check for slow database queries
- Optimize component re-rendering
- Review network requests in browser dev tools

### Getting Help

1. **Check Console Logs** - Browser console provides detailed error information
2. **Database Logs** - Supabase dashboard shows query performance
3. **Network Tab** - Identify slow or failing API requests
4. **Component Props** - Verify correct data flow between components

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

### Code Standards
- **ESLint** configuration for code quality
- **Prettier** for consistent formatting
- **Component documentation** with PropTypes or TypeScript
- **Git commit messages** following conventional commits

## 📄 License

This project is proprietary software developed for Li Chuan Food Products Co., Ltd.

## 🆘 Support & Maintenance

For support requests or maintenance needs:

**When reporting issues, please include:**
- User role experiencing the issue
- Specific component/feature affected
- Browser and device information
- Steps to reproduce the problem
- Expected vs actual behavior
- Console error messages (if any)

**System Requirements:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection for real-time features
- Minimum screen resolution: 1024x768

---

*This README serves as comprehensive documentation for the Li Chuan Food Products WMS. For specific development tasks or troubleshooting, refer to the relevant sections above and ensure you have the necessary permissions and environment setup.*
