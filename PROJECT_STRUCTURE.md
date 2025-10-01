# 📁 Project Structure & File Organization

This document provides a comprehensive overview of the Gamified Activity Tracker project structure, explaining the purpose and contents of each directory and key file.

## 🏗️ Overall Architecture

```
gamified-tracker/
├── 📁 prisma/           # Database schema and migrations
├── 📁 src/              # Application source code
│   ├── 📁 app/          # Next.js App Router pages and API routes
│   ├── 📁 components/   # React components
│   ├── 📁 lib/          # Utility libraries and configurations
│   └── 📁 types/        # TypeScript type definitions
├── 📁 tests/            # Test suites and test utilities
├── 📁 public/           # Static assets and PWA files
└── 📄 Configuration files (package.json, tailwind.config.js, etc.)
```

## 📂 Directory Breakdown

### **📁 prisma/** - Database Layer
- **`schema.prisma`**: Complete database schema with all models, relationships, and constraints
- **`migrations/`**: Database migration files (if using migrations instead of push)

**Purpose**: Defines the data model, relationships, and database structure using Prisma ORM.

### **📁 src/app/** - Application Pages & API Routes

#### **Pages (Frontend Routes)**
- **`layout.tsx`**: Root layout with global providers and styling
- **`page.tsx`**: Landing page with authentication routing
- **`globals.css`**: Global CSS styles and Tailwind imports
- **`dashboard/page.tsx`**: Main dashboard with activity overview
- **`dashboard/log-activity/page.tsx`**: Activity logging interface
- **`dashboard/settings/page.tsx`**: Settings and activity management
- **`auth/signin/page.tsx`**: User login form
- **`auth/signup/page.tsx`**: User registration form

#### **API Routes (Backend)**
- **`api/auth/[...nextauth]/route.ts`**: NextAuth.js authentication handlers
- **`api/auth/signup/route.ts`**: User registration endpoint
- **`api/point-categories/route.ts`**: Category management (CRUD)
- **`api/activities/route.ts`**: Activity management (CRUD)
- **`api/activities/log/route.ts`**: Activity logging with focus calculation
- **`api/dashboard/weekly-data/route.ts`**: Analytics and reporting data
- **`api/recent-activity/route.ts`**: Recent activity feed

### **📁 src/components/** - React Components

#### **Core UI Components**
- **`Providers.tsx`**: NextAuth SessionProvider wrapper
- **`DashboardHeader.tsx`**: Navigation header with user menu

#### **Dashboard Components**
- **`PointsOverview.tsx`**: Today's progress, benchmarks, comparisons
- **`QuickActions.tsx`**: Fast access to common actions
- **`RecentActivity.tsx`**: Timeline of completed activities
- **`CalendarView.tsx`**: Date picker and calendar interface

#### **Form Components**
- **`LogActivityForm.tsx`**: Activity logging with focus selection
- **`SettingsManager.tsx`**: Settings tabs and activity management

### **📁 src/lib/** - Utilities & Configuration

#### **Core Utilities**
- **`auth.ts`**: NextAuth.js configuration and options
- **`prisma.ts`**: Prisma client initialization and configuration

### **📁 tests/** - Test Suites

#### **API Tests**
- **`api/point-categories.test.js`**: Category CRUD operations
- **`api/activities.test.js`**: Activity management and validation
- **`api/activities-log.test.js`**: Activity logging with error handling

#### **Component Tests**
- **`components/LogActivityForm.test.js`**: Form interactions and validation
- **`components/SettingsManager.test.js`**: Settings management workflows

#### **Integration Tests**
- **`integration/workflow.test.js`**: End-to-end user journeys

### **📁 public/** - Static Assets

#### **PWA Files**
- **`manifest.json`**: Progressive Web App configuration
- **`icon-*.png`**: App icons for different sizes
- **`robots.txt`**: Search engine crawling rules
- **`sitemap.xml`**: Site structure for search engines

## 🔄 Data Flow Architecture

### **User Authentication Flow**
```
User Input → Login Form → NextAuth Provider → Database (User table) → JWT Token → Session Cookie
```

### **Activity Logging Flow**
```
User Selection → Form Validation → API Call (/api/activities/log) → Point Calculation → Database Storage → UI Update
```

### **Dashboard Data Flow**
```
Page Load → Parallel API Calls → Data Aggregation → Component Rendering → User Interface
```

## 🎯 Key Design Patterns

### **Component Organization**
- **Container Components**: Handle data fetching and state management
- **Presentational Components**: Focus on UI rendering and user interactions
- **Custom Hooks**: Reusable logic for API calls and state management

### **API Design**
- **RESTful Endpoints**: Consistent URL patterns and HTTP methods
- **Error Handling**: Standardized error responses with status codes
- **Validation**: Input validation with detailed error messages
- **Authentication**: Session-based auth on all protected routes

### **Database Design**
- **User Isolation**: All data scoped to individual users
- **Referential Integrity**: Foreign key constraints and cascading deletes
- **Indexing**: Optimized queries with appropriate indexes
- **Flexibility**: JSON fields for configurable data

## 🚀 Deployment & Production

### **Build Output**
- **`next build`**: Creates optimized production bundle
- **`next start`**: Serves production build
- **Static Assets**: Optimized images and fonts
- **API Routes**: Serverless function deployment

### **Environment Configuration**
- **Development**: Hot reloading, detailed logging, debug mode
- **Production**: Optimized builds, error monitoring, caching
- **Database**: Connection pooling, query optimization, backups

## 🔧 Development Workflow

### **Local Development**
```bash
npm run dev          # Start development server
npm run db:studio    # View database in browser
npm test            # Run test suites
npm run build       # Create production build
```

### **Code Organization**
- **TypeScript**: Type safety across the entire application
- **ESLint**: Code quality and consistency enforcement
- **Prettier**: Automated code formatting
- **Jest**: Comprehensive test coverage

This project structure provides a scalable, maintainable, and well-documented codebase for the gamified activity tracking application.
