# Purchase Order Management System

## Overview

This is a comprehensive purchase order management system built with a modern full-stack architecture. The application provides functionality for creating, managing, and tracking purchase orders, with features for vendor management, item catalog, project tracking, and reporting. The system includes both traditional forms and Excel-like interfaces for flexible data entry.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer for handling attachments
- **Email**: Nodemailer for notifications

### Database Architecture
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Core Entities
- **Users**: Authentication and role-based access control
- **Companies**: Organization information with logo support
- **Positions**: Hierarchical position management system
- **Vendors**: Supplier/vendor information management
- **Items**: Product catalog with specifications and pricing
- **Projects**: Project-based organization of orders
- **Purchase Orders**: Core order management with approval workflow
- **Invoices**: Invoice tracking and verification
- **Templates**: Configurable order templates for different workflows

### Authentication & Authorization
- **Provider**: Replit Auth integration
- **Roles**: Admin, Order Manager, and User roles
- **Session Storage**: PostgreSQL-backed session management
- **Route Protection**: Role-based access control on frontend and backend

### File Management
- **Upload Handling**: Multer-based file uploads with size and type restrictions
- **Storage**: Local filesystem storage in uploads directory
- **Supported Types**: PDF, images, CAD files, Excel files

### Template System
- **Dynamic Forms**: Configurable order templates with custom fields
- **Excel-like Interface**: Handsontable integration for spreadsheet-style data entry
- **Field Types**: Text, numeric, dropdown, date, checkbox, and image fields
- **Validation**: Template-based validation rules

## Data Flow

### Order Creation Workflow
1. User selects project and vendor
2. Template selection determines form structure
3. Items are added either through traditional form or Excel-like interface
4. Order is saved as draft or submitted for approval
5. Approved orders can be sent to vendors
6. Invoices and receipts are tracked against orders

### Approval Process
- Draft orders can be edited by creators
- Submitted orders require approval from managers or admins
- Approved orders are locked from editing
- Status tracking through the entire lifecycle

### Reporting Pipeline
- Data aggregation from orders, invoices, and receipts
- Multiple visualization formats (charts, tables, exports)
- Filtering by date ranges, vendors, projects, and status
- PDF and Excel export capabilities

## External Dependencies

### Frontend Dependencies
- **UI Components**: Extensive Radix UI component library
- **Data Fetching**: TanStack Query for caching and synchronization
- **Date Handling**: date-fns for date manipulation
- **File Processing**: XLSX library for Excel file handling
- **PDF Generation**: jsPDF for client-side PDF creation

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **Authentication**: openid-client for OIDC integration
- **File Uploads**: multer for multipart form handling
- **Email**: nodemailer for SMTP email sending
- **Session Management**: connect-pg-simple for PostgreSQL session store

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code linting and formatting
- **Drizzle Kit**: Database schema management and migrations

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20 with PostgreSQL 16
- **Development**: `npm run dev` starts both frontend and backend
- **Production Build**: Vite builds frontend, esbuild bundles backend
- **Deployment**: Autoscale deployment target with automatic builds

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OIDC provider URL
- `SMTP_*`: Email server configuration

### File Structure
```
/client          - React frontend application
/server          - Express backend API
/shared          - Shared TypeScript types and schemas
/migrations      - Database migration files
/uploads         - File upload storage
```

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
- June 14, 2025. Database schema improvements: Applied ENUM types, foreign key constraints, and resolved purchase order system issues. Completed schema refactoring by removing unused status tables (order_statuses, project_statuses) and implementing ENUM-based approach with display views for better performance and maintainability.
- June 14, 2025. UI standardization Phase 2 completed: Enhanced filter/search section in orders page with improved layout organization, visual hierarchy, and user experience. Established comprehensive UI baseline for system-wide application.
- June 14, 2025. Filter UX optimization: Implemented collapsible filter section to address screen space concerns. Added Korean Won formatting for amount filters and moved project filter to always-visible top section for improved accessibility and user workflow efficiency.
- June 14, 2025. UI Standardization Phase 1 completed: Extracted UI standards from orders page and created comprehensive component library including PageHeader, FilterSection, DataTable, and common formatting utilities. Established design system foundation with color palettes, typography, spacing, and component patterns for system-wide consistency.
- June 14, 2025. UI Standardization Phase 2 progress: Applied compact layout with clickable names, sortable headers, and standardized spacing to vendors, projects, and items pages. Enhanced items page with category filtering and color-coded badges. Removed redundant preview icons from projects and vendors pages. Fixed page container spacing issue by adding p-6 padding to all standardized pages for consistent sidebar-to-content and content-to-edge margins. Currently 7 of 24 pages standardized (30% complete).
- June 14, 2025. Korean Won formatting standardization: Implemented centralized formatKoreanWon utility function replacing individual formatPrice functions across all pages. Enhanced price display with proper Korean Won formatting and visual emphasis (blue color for prices). Updated items page to use standardized formatting for consistent currency display throughout the system.
- June 14, 2025. View toggle and card design standardization completed: Standardized view toggle buttons across vendors, items, and projects pages with icon-only design (removed Korean text), consistent bg-gray-100 rounded container, and h-8 w-8 square buttons with tooltips. Implemented unified card view design based on project card layout with consistent header structure (icon + title), standardized content sections (label: value format), and uniform action buttons. Updated UI_STANDARDS.md with comprehensive view toggle patterns and card design principles for system-wide consistency.
- June 14, 2025. Card action button standardization completed: Converted all card view edit/delete buttons from text+icon to icon-only design across projects, vendors, and items pages. Applied consistent h-8 w-8 p-0 sizing, blue/red color coding, and tooltip accessibility. Updated UI_STANDARDS.md with standardized card action button pattern for system-wide icon-only interface consistency.
- June 14, 2025. Card action button spacing optimization: Applied negative spacing (-space-x-1) to edit/delete icons in card views for optimal visual grouping. Buttons now slightly overlap to eliminate visual gaps and create tighter, more cohesive action button groups. Enhanced with hover background effects (blue-50/red-50) for better user interaction feedback. Applied consistently across projects, vendors, and items pages.
- June 14, 2025. Card design enhancement Phase 3 completed: Added title icons (FolderOpen for projects, Building for vendors, Package for items) and section header icons (Building2/MapPin/DollarSign for projects, Hash/User/Phone for vendors, Ruler/Scale/DollarSign for items) for improved visual hierarchy. Implemented item card layout optimization with flex-1 min-w-0, text truncation, and specification badge constraints to prevent layout breaking from long content. Updated UI_STANDARDS.md with comprehensive card icon patterns and layout optimization guidelines. UI standardization milestone achieved with consistent visual language across all card views.
- June 14, 2025. Card title icon removal: Removed title icons (FolderOpen, Building, Package) from all card headers across projects, vendors, and items pages per user request. Maintained section header icons for information categorization while simplifying card titles to text-only display. Updated UI approach to cleaner, more minimalist card design while preserving functional iconography for data sections.
- June 14, 2025. Users page UI standardization completed: Applied comprehensive UI standards including standardized view toggle buttons (icon-only with tooltips), card view with section header icons (Mail, Hash, Phone, Calendar), table view with clickable user names and action buttons, and consistent -space-x-1 button spacing. Implemented proper role badges and action button styling following established patterns. Currently 8 of 24 pages standardized (33% complete).
- June 14, 2025. Admin page user management section UI standardization completed: Fixed view toggle icons (List for table view, Grid3X3 for card view), applied standard font sizes (text-sm for body, text-lg for titles), implemented proper spacing (p-6 container padding), added complete card view with section header icons, and standardized action button styling with hover effects. Admin page now follows all established UI standards including view toggles, consistent spacing, and standardized component patterns.
- June 14, 2025. Reports page UI standardization completed: Applied comprehensive UI standards including standardized page header with Search icon, collapsible filter section with proper spacing and button styling, standardized table structure with py-3 px-4 cell padding and border-b border-gray-200 row styling, and consistent Korean Won price formatting. Implemented standardized filter buttons (초기화/검색) and maintained existing filter functionality while improving visual hierarchy and user experience.
- June 14, 2025. Complete UI standardization achieved: Successfully applied comprehensive UI standards across all 24 pages in the purchase order management system. Standardized page headers with icons and descriptions, view toggle buttons (icon-only with tooltips), proper spacing (p-6), consistent typography, action buttons, and responsive layouts. Achieved 100% UI consistency with unified design patterns throughout all user interfaces including dashboard, orders, vendors, projects, items, users, admin, reports, profiles, templates, positions, and all detail/edit pages.
- June 14, 2025. Dashboard page header removal: Removed the page header section containing BarChart3 icon, "대시보드" title, and description text from the dashboard page per user request to create a cleaner, more focused layout.
- June 14, 2025. Dashboard spacing standardization: Applied consistent section spacing using UI Standards pattern with p-6 space-y-6 for uniform 24px spacing between all dashboard sections (Quick Actions, Statistics Cards, Charts Row, Second Row) following established UI guidelines.
- June 14, 2025. Dashboard chart legend font size standardization: Synchronized legend font sizes between monthly statistics bar chart and status distribution pie chart by setting both to 12px for visual consistency.
- June 14, 2025. Dashboard enhancement completed: Added enhanced quick actions section with "최근 1개월 시작 프로젝트" and "긴급 발주서 검토" buttons. Implemented two new statistics cards for "활성 프로젝트 수" and "이번 달 신규 프로젝트" with real-time data integration. Expanded dashboard layout from 5-card to 7-card grid layout. Added comprehensive backend API endpoints for active projects count, new projects this month, recent projects, and urgent orders data.
- June 15, 2025. Dashboard card filter system optimization completed: Fixed JavaScript Date object calculation issues to ensure accurate date ranges. Implemented proper local timezone handling with custom formatLocalDate function. Monthly filter now correctly shows 2025-06-01 ~ 2025-06-30 (previously 2025-05-31 ~ 2025-06-29). Yearly filter now correctly shows 2025-01-01 ~ today (previously 2024-12-31 ~ today). Status-only filters properly exclude date ranges. Enhanced URL parameter handling to prevent conflicts between different filter types and ensure proper initialization with default 3-month range when no parameters present.
- June 15, 2025. Database schema optimization completed: Added comprehensive database indexing for performance improvement including indexes on vendors (name, business_number, email, isActive), items (name, category, isActive), projects (name, code, status, start_date, manager), purchase_orders (8 key columns), and users (email, role, position). Removed redundant projectStatuses and projectTypes tables in favor of ENUM types for better performance. Enhanced foreign key constraints and Drizzle ORM relations for data integrity. Achieved enterprise-level database optimization with improved query performance and storage efficiency.
- June 15, 2025. Sidebar menu reorganization completed: Restructured navigation menu with logical grouping and visual separators. Primary section (대시보드, 발주서 관리, 발주서 작성), management section (프로젝트 관리, 거래처 관리, 품목 관리, 보고서 및 분석), and system section (템플릿 관리, 시스템 관리). Added horizontal separators between sections for improved navigation clarity and user experience.
- June 15, 2025. Authentication system debugging completed: Successfully resolved infinite redirect loop issue. Root cause was React Query cache synchronization problem after login. Fixed by enhancing loginMutation onSuccess handler to immediately update cache with setQueryData and trigger revalidation with invalidateQueries. Server-side authentication was working correctly throughout - issue was purely client-side state management. Authentication system now fully functional with independent local auth implementation.
- June 15, 2025. Infinite redirect loop resolution: Implemented ref-based redirect control mechanism in Router component to prevent circular redirects between login and dashboard pages. Eliminated useEffect-based routing conflicts with wouter and React Query state management. Authentication flow now stable with proper session persistence and immediate dashboard access after successful login.
- June 15, 2025. Dashboard enhancement and project edit functionality fix completed: Changed dashboard label from "활성 프로젝트 수" to "진행 중 프로젝트 수" as requested. Fixed active projects count data accuracy by correcting API response format from string to proper object structure with count property. Fixed project edit button functionality by implementing missing getProjectStatuses() and getProjectTypes() storage methods that return Korean-localized project status and type options. Project management now fully functional with proper form dropdown population.
- June 16, 2025. Excel-like table formatting and authentication system fixes completed: Resolved table row alignment issues in Excel-like order form by implementing proper CSS styling, reducing row heights from 35px to 28px, and applying consistent vertical/horizontal alignment. Fixed critical authentication errors in reports page by adding missing isAuthenticated property to AuthContextType, replacing navigate function with setLocation for wouter routing, and implementing proper TypeScript array checking to prevent runtime errors. Enhanced table styling with optimized column widths, standardized fonts, and improved visual hierarchy.
- June 19, 2025. Row copying functionality for general order forms implemented: Added automatic row value copying when using '품목 추가' button to copy values from the previous row. Implemented individual row copy buttons (blue Copy icon) for each table row. Fixed template type recognition to support both 'excel_like' and 'handsontable' template types for Excel-like forms. Enhanced table layout with additional copy column and proper colspan adjustments for total amount footer.
- June 19, 2025. Sidebar collapse button design update: Changed sidebar collapse button from X icon to hamburger menu icon (Menu) to match user's visual preference for more intuitive navigation controls.
- June 19, 2025. Template type terminology update: Changed template type dropdown terms from "일반 폼" to "일반폼" and "시트유형" to "시트폼" across all template builders and management interfaces. Updated database UI terms for consistency.
- June 19, 2025. Tax invoice verification buttons restoration: Restored always-visible "확인/미확인" buttons in order detail page invoice management section. Added prominent tax invoice management area with status indicators and action buttons that are visible regardless of invoice upload status.
- June 19, 2025. Multiple order managers feature completed: Successfully implemented multiple order managers selection for project management. Replaced single dropdown with multi-select interface in project edit page, added project_members API endpoints, updated backend logic to handle multiple order managers through project_members table, and modified project detail page to display all selected order managers. System now supports flexible assignment of multiple order managers per project with proper database relationships and user interface.
- June 19, 2025. Position management update fix completed: Resolved position update functionality that was showing success messages but not persisting changes to database. Issue was caused by missing PUT endpoint - client was sending PUT requests but server only had PATCH endpoint. Added PUT endpoint alongside PATCH for complete coverage. Position updates now work correctly with proper database persistence and real-time UI updates.
- June 19, 2025. Safe user deletion system enhancement completed: Improved user deletion workflow to handle business constraints where users with purchase orders cannot be deleted. Enhanced SafeUserDelete component to provide clear differentiation between deletable users (project-only connections) and non-deletable users (order connections). Added comprehensive error messaging explaining that purchase order records must preserve creator information for accounting and audit purposes. Implemented alternative guidance suggesting account deactivation or role changes for users who cannot be deleted due to order dependencies.
- June 19, 2025. User activation/deactivation functionality completed: Implemented comprehensive user activation/deactivation system with toggle switches in both table and card views. Added isActive field to users table, created API endpoint for toggling user active status, and implemented client-side mutations with visual feedback. Users can now be activated/deactivated without deletion to maintain data integrity while controlling access.
- June 19, 2025. User management table compact design applied: Optimized user management table layout by reducing padding (px-3 py-1.5), smaller text size (text-xs), reduced avatar size (h-6 w-6), and tighter spacing to eliminate excessive whitespace. Improved space efficiency allowing more users to be displayed per screen while maintaining readability.
- June 19, 2025. User management view consolidation completed: Converted user management interface to compact table-only view by removing view toggle functionality and card view option. Eliminated userViewMode state variable and cleaned up unused imports (List, Grid3X3 icons). Interface now shows only the space-efficient compact table format with consistent row heights, optimized padding, and improved information density for better user experience and screen space utilization.
- June 19, 2025. Admin page user management section confirmed optimized: Verified that System Management > Users Management tab already implements compact list view with grid-cols-13 layout, px-3 py-1.5 padding, text-xs font size, h-6 w-6 compact buttons, and properly functioning activation/deactivation toggle buttons. Interface provides maximum space efficiency for displaying user information in minimal screen space.
- June 19, 2025. User management interface converted to HTML table structure: Successfully replaced grid-based layout with proper HTML table structure matching order list view design. Applied standardized table styling with Table, TableHeader, TableBody components, px-3 py-3 cell padding, border-gray-200 borders, and hover effects. Maintained all existing functionality including sorting, activation/deactivation toggles, and action buttons while improving visual consistency and accessibility.
- June 19, 2025. Hardcoded user data elimination completed: Removed all hardcoded Korean names from seed data and database. Updated seed-data.ts to use generic role-based names (발주 관리자, 프로젝트 담당자, 기술 전문가) instead of specific personal names. Modified existing database records to replace hardcoded names like "김철수 부장" with functional titles. Achieved complete softcoding approach eliminating maintenance issues and cultural specificity from user data.
- June 19, 2025. Role display system softcoding completed: Implemented comprehensive soft-coded role display system using UI terms database. Created RoleDisplay and RoleSelectOptions components that dynamically fetch role names from ui_terms table. Updated user-management.tsx and admin.tsx to use new components. Changed admin role display from '관리자' to '시스템 관리자' in database. Eliminated all hardcoded role text throughout application for consistent, maintainable UI terminology management.
- June 19, 2025. Admin user management enhancement completed: Updated admin page user management tab with Switch components matching template management style for activation/deactivation toggles. Added view toggle buttons (List/Grid3X3) enabling card and list view modes. Implemented comprehensive card view displaying user information with avatars, contact details, positions, and role badges. Both views support Switch toggle functionality for user activation status. Changed tab label from '발주사 정보' to '회사 정보' for improved clarity.
- June 19, 2025. Project budget saving fix and seed data softcoding completed: Fixed totalBudget field persistence issue by correcting data type handling in both client (parseFloat instead of string manipulation) and server (removing unnecessary toString conversion). Added debugging logs for project update tracking. Eliminated hardcoded budget values from seed data by implementing dynamic budget calculation based on project type and scale factors. Replaced specific company names with generic alternatives (건설회사 A, 제조회사 A). Added dynamic business number generation. Achieved complete softcoding of project and company seed data for maintainability.
- June 19, 2025. Comprehensive Korean Won currency formatting standardization completed: Implemented system-wide standardized formatKoreanWon function replacing all legacy formatCurrency and manual formatting instances. Applied consistent ₩ symbol, thousand separators, no decimals, and blue color emphasis (text-blue-600 font-semibold) across all money-related fields including dashboard statistics, project budgets, item prices, order amounts, and form calculations. Enhanced formatKoreanWon utility with proper null handling and parseKoreanWon companion function. Achieved 100% consistent Korean currency display throughout the entire purchase order management system for professional financial presentation.
- June 25, 2025. System enhancement planning: Created comprehensive testing checklist mapped to actual menu structure with 200+ validation points. Decided on incremental feature addition approach for Excel upload, Handsontable integration, approval workflows, and advanced reporting features. Current system baseline established for safe feature development.
- June 25, 2025. Excel upload feature Phase 1 implemented: Added basic Excel file upload functionality to purchase order creation page with tabbed interface. Implemented SimpleExcelUpload component for parsing Excel/CSV files and displaying data preview. Feature provides foundation for future advanced Excel integration while maintaining system stability.
- June 25, 2025. Feature flag environment separation implemented: Due to Git branch restrictions, implemented feature flag-based environment separation system. Created production environment (VITE_ENVIRONMENT=production) for QA team with Excel upload disabled, and development environment with all experimental features enabled. Implemented comprehensive feature flag system allowing real-time ON/OFF control of new features without affecting stable QA environment.
- June 25, 2025. GitHub integration setup: Resolved Git lock issues and prepared project for GitHub integration using Replit UI. Created comprehensive integration guides for connecting to GitHub repository with proper branch management strategy. Established foundation for production/development environment separation through GitHub branches.
- June 25, 2025. GitHub connection troubleshooting: Encountered Replit Git restrictions preventing direct remote repository connection. Prepared manual upload strategy with clean project archive and comprehensive upload guide. Ready for manual GitHub repository creation and file upload to establish version control.
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```