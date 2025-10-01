# 🎯 Gamified Activity Tracker

A comprehensive web application for tracking personal activities with gamification elements. Users can create customizable activities, log their completion with focus levels, and earn points to stay motivated and track progress across different life domains.

## 🌟 Features

### 🎮 Core Gamification Features

#### **Activity Logging with Focus Levels**
- **Real-time Point Calculation**: Activities earn points based on focus quality
- **Four Focus Levels**:
  - 🧘 **Low** (0.5x): Distracted, multitasking
  - 🤔 **Medium** (1.0x): Somewhat focused, occasional distractions
  - 🎯 **Good** (1.5x): Focused, productive work
  - 🧘‍♂️ **Zen** (2.0x): Deep concentration, flow state

#### **Flexible Activity Types**
- **Fixed-Point Activities**: Predetermined point values (e.g., "Code Review: 10 points")
- **Time-Based Activities**: Points calculated from duration (e.g., "Exercise: 60 min × 1.5 = 90 points")
- **Custom Categories**: Organize activities by life domains (Professional, Health, Personal, etc.)

#### **Point Calculation Methods**
- **Multipliers**: Points = base_value × focus_multiplier
- **Fixed Points**: Preset point values for each focus level
- **Real-time Preview**: See points earned before logging activities

### 📊 Dashboard & Analytics

#### **Comprehensive Dashboard**
- **Today's Progress**: Points earned today with category breakdown
- **Daily Benchmarks**: Goal tracking with progress bars
- **Weekly Comparison**: Compare this week vs last week performance
- **Monthly Trends**: Long-term progress visualization
- **Recent Activity Feed**: Timeline of completed activities

#### **Progress Tracking**
- **Category-based Organization**: Group activities by life domains
- **Benchmark System**: Achievement levels within each category
- **Point Aggregation**: Total points across all categories
- **Visual Progress Indicators**: Charts and progress bars

### ⚙️ Activity Management

#### **Activity Configuration**
- **CRUD Operations**: Create, read, update, delete activities
- **Custom Point Values**: Set base points for activities
- **Focus Multipliers**: Customize multipliers for each focus level
- **Category Assignment**: Organize activities under point categories

#### **Advanced Features**
- **Bulk Operations**: Delete activities with logged data handling
- **Validation**: Prevent duplicate activity names within categories
- **Real-time Updates**: Immediate UI updates after changes

### 🔐 Security & Authentication

#### **User Authentication**
- **Secure Login**: Email/password authentication with bcrypt hashing
- **Session Management**: JWT-based sessions with automatic refresh
- **User Isolation**: Complete data privacy and isolation
- **Password Security**: Industry-standard password hashing

### 🎨 User Interface

#### **Responsive Design**
- **Mobile-First**: Optimized for phones, tablets, and desktops
- **Progressive Web App**: Installable on mobile devices
- **Modern UI**: Clean, intuitive interface with consistent design
- **Accessibility**: WCAG-compliant design patterns

#### **Interactive Components**
- **Dynamic Forms**: Real-time validation and feedback
- **Loading States**: Smooth user experience during operations
- **Success/Error Messages**: Clear feedback for all actions
- **Color-coded Categories**: Visual organization with custom colors

## 🚀 Technology Stack

### **Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Modern icon library
- **Recharts**: Data visualization components

### **Backend**
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **NextAuth.js**: Authentication and session management

### **Development Tools**
- **Jest**: Testing framework
- **React Testing Library**: Component testing utilities
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting

## 🏗️ Architecture

### **Database Schema**
```
User (Authentication)
├── Point Categories (Organizational units)
│   ├── Activities (Configurable tasks)
│   │   └── Logged Activities (Completion records)
│   ├── Tasks (Daily/weekly goals)
│   │   └── Logged Tasks (Completion records)
│   └── Benchmarks (Achievement levels)
├── Badges (Gamification achievements)
├── Daily Logs (Daily summaries)
├── Insights (Reflections and learnings)
└── End-of-Day Questions (Custom reflections)
```

### **API Structure**
```
/api/auth/*          - Authentication endpoints
/api/point-categories - Category management
/api/activities       - Activity CRUD operations
/api/activities/log   - Activity logging with focus
/api/dashboard/*      - Analytics and reporting
/api/recent-activity  - Activity feed
```

### **Component Hierarchy**
```
App
├── Authentication (Login/Signup)
├── Dashboard
│   ├── Points Overview (Today's progress)
│   ├── Quick Actions (Activity logging shortcuts)
│   ├── Recent Activity (Timeline)
│   └── Calendar View (Date picker)
├── Settings
│   ├── Activity Management
│   ├── Goals & Benchmarks
│   ├── Profile Settings
│   ├── Notifications
│   ├── Appearance
│   └── Privacy
└── Shared Components (Forms, Modals, Navigation)
```

## 🎮 How It Works

### **1. Setup Your Categories**
Create point categories to organize your activities:
- "Professional Development"
- "Physical Health"
- "Mental Wellness"
- "Personal Growth"

### **2. Configure Activities**
For each category, create activities with point calculations:
- **Reading**: Time-based, 60 min × focus = points
- **Exercise**: Time-based, duration × focus = points
- **Meditation**: Fixed points × focus = points
- **Learning**: Time-based, study time × focus = points

### **3. Log Activities with Focus**
When completing activities, rate your focus level:
- **High Focus Session**: Reading for 45 minutes at "Zen" focus = 90 points
- **Productive Work**: Code review at "Good" focus = 15 points
- **Quick Task**: Email response at "Medium" focus = 5 points

### **4. Track Progress**
- View daily, weekly, and monthly progress
- Compare performance across time periods
- Earn badges for consistent achievement
- Reflect on patterns and insights

## 📱 Progressive Web App (PWA)

### **Installation**
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Add to Home Screen
- **Desktop**: Chrome → Install button in address bar

### **Offline Features**
- **Cached Interface**: App loads without internet
- **Local Data**: Recent activities stored locally
- **Sync on Reconnect**: Automatic data synchronization

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd gamified-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### **Environment Variables**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gamified_tracker"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### **Database Migration**
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# View database
npm run db:studio
```

## 🧪 Testing

### **Run Tests**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest tests/api/activities.test.js
```

### **Test Coverage**
- **API Endpoints**: Authentication, CRUD operations, data validation
- **Components**: Form interactions, state management, user feedback
- **Integration**: End-to-end workflows, error handling
- **Security**: Input validation, authentication checks

## 🚀 Deployment

### **Build for Production**
```bash
# Build the application
npm run build

# Start production server
npm start
```

### **Environment Setup**
- Configure production database
- Set secure NEXTAUTH_SECRET
- Configure domain for NEXTAUTH_URL
- Set up SSL certificates

### **Performance Optimization**
- Database query optimization
- Image optimization
- Code splitting
- Caching strategies

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit a pull request

### **Code Standards**
- TypeScript for type safety
- ESLint for code quality
- Prettier for consistent formatting
- Comprehensive test coverage
- Clear commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** for the amazing React framework
- **Prisma** for type-safe database operations
- **Tailwind CSS** for utility-first styling
- **NextAuth.js** for authentication
- **Vercel** for deployment platform

---

**Built with ❤️ for productivity and personal growth**