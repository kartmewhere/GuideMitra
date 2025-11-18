# GuideMitra - AI-Powered Career Guidance Platform

GuideMitra is a modern, AI-powered career guidance platform designed to help students make informed decisions about their educational and career paths. Built with cutting-edge technology and a focus on user experience, it provides personalized recommendations, interactive roadmaps, and comprehensive support systems.

## Key Features

### AI-Powered Guidance

- **Intelligent Chat Assistant**: Multi-modal AI chat supporting career, academic, and wellness conversations
- **Personalized Recommendations**: Course and career suggestions based on aptitude, interests, and performance
- **Smart Course Mapping**: Detailed pathways showing how degrees lead to specific career opportunities
- **Contextual Insights**: AI-driven analysis of user progress and goal achievement

### MVP Features (Based on Requirements)

- **Aptitude & Interest-Based Course Suggestions**: Short quizzes assess personality traits and recommend suitable streams
- **Course-to-Career Path Mapping**: Visual charts showing degree programs and their career outcomes
- **Nearby Government Colleges Directory**: Location-based college listings with facilities and program information
- **Timeline Tracker**: Notification system for admission dates, scholarship deadlines, and entrance exams
- **Customization & Personalization**: User profiles tracking age, gender, class, and academic interests

### Modern UI/UX Design

- **Glass Morphism Effects**: Modern, translucent design elements with backdrop blur
- **Gradient Color Schemes**: Beautiful purple-blue primary theme with warm accent colors
- **Typography Excellence**: Inter font family with proper font weights and spacing
- **Responsive Design**: Mobile-first approach ensuring perfect experience across all devices
- **Micro-interactions**: Smooth animations, hover effects, and loading states
- **Accessibility**: WCAG compliant with proper contrast ratios and keyboard navigation

### Comprehensive Tracking

- **Wellness Monitoring**: Daily mood, stress, and sleep quality tracking
- **Progress Analytics**: Visual progress bars, completion rates, and milestone tracking
- **Goal Management**: Set and track academic and career objectives
- **Performance Insights**: AI-generated insights based on user activity and progress

## Technology Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **React Router v6** - Client-side routing with nested routes
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Lucide React** - Beautiful, customizable SVG icons
- **Axios** - Promise-based HTTP client
- **Recharts** - Responsive charting library

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Fast, unopinionated web framework
- **Prisma** - Next-generation ORM with type safety
- **PostgreSQL** - Advanced open-source relational database
- **JWT** - Secure authentication with JSON Web Tokens
- **bcrypt** - Password hashing for security

### Design System

- **Custom Color Palette**: Primary (purple-blue), Accent (warm orange), Success (green), Warning (amber), Error (red)
- **Typography Scale**: Responsive text sizing with proper hierarchy
- **Component Library**: Reusable components with consistent styling
- **Animation System**: CSS transitions and keyframe animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- PostgreSQL database (v12 or higher)

### Quick Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd guidemitra

   # Install all dependencies
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Environment Configuration**

   ```bash
   # Backend environment setup
   cd backend
   cp .env.example .env
   # Configure your database URL and JWT secret
   ```

3. **Database Setup**

   ```bash
   # Run migrations and generate Prisma client
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start Development Servers**

   ```bash
   # Terminal 1: Backend (port 5000)
   cd backend && npm run dev

   # Terminal 2: Frontend (port 3000)
   cd frontend && npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Architecture

```
guidemitra/
├── 📁 frontend/                    # React application
│   ├── 📁 public/                 # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/         # Reusable UI components
│   │   │   ├── LoadingSpinner.js  # Modern loading animations
│   │   │   ├── Navbar.js          # Navigation with glass morphism
│   │   │   ├── NotificationToast.js # Toast notifications
│   │   │   └── ProgressCard.js    # Progress visualization
│   │   ├── 📁 contexts/           # React context providers
│   │   │   └── AuthContext.js     # Authentication state management
│   │   ├── 📁 pages/              # Page components
│   │   │   ├── Dashboard.js       # Main dashboard with MVP features
│   │   │   ├── Chat.js            # AI chat interface
│   │   │   ├── Login.js           # Modern login form
│   │   │   ├── Register.js        # Enhanced registration
│   │   │   ├── Profile.js         # User profile & wellness tracking
│   │   │   └── Roadmaps.js        # Career roadmaps & course mapping
│   │   ├── App.js                 # Main application component
│   │   ├── App.css                # Global styles & design system
│   │   └── index.js               # Application entry point
│   ├── package.json               # Frontend dependencies
│   ├── tailwind.config.js         # Tailwind configuration
│   └── postcss.config.js          # PostCSS configuration
├── 📁 backend/                     # Node.js API server
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # Request handlers
│   │   ├── 📁 middleware/         # Express middleware
│   │   ├── 📁 routes/             # API route definitions
│   │   └── 📁 services/           # Business logic
│   ├── 📁 prisma/                 # Database schema & migrations
│   ├── package.json               # Backend dependencies
│   └── .env.example               # Environment template
└── README.md                      # This file
```

## API Documentation

### Authentication Endpoints

```
POST /api/auth/register    # User registration
POST /api/auth/login       # User authentication
GET  /api/auth/me          # Current user profile
```

### Chat System

```
POST /api/chat/message     # Send chat message
GET  /api/chat/sessions    # User chat history
GET  /api/chat/sessions/:id # Specific session
```

### User Management

```
GET  /api/user/profile           # User profile data
PUT  /api/user/profile           # Update profile
GET  /api/user/wellness-analytics # Wellness tracking data
```

### Recommendations

```
GET /api/recommendations/courses  # Course suggestions
GET /api/recommendations/careers  # Career recommendations
```

## MVP Implementation

### Completed Features

- **Aptitude Assessment System**: Interactive quizzes for personality and interest evaluation
- **Course Recommendation Engine**: AI-powered suggestions based on user profile
- **Career Path Mapping**: Visual representation of degree-to-career pathways
- **College Directory**: Location-based government college listings
- **Timeline Tracker**: Notification system for important dates
- **Personalization Hub**: Comprehensive user profiling and customization
- **Wellness Tracking**: Mental health monitoring and support
- **Modern UI/UX**: Glass morphism design with responsive layout

### Implementation Strategy

1. **Stakeholder Collaboration**: Integration with education departments and counselors
2. **Content Management**: Comprehensive database of courses, colleges, and career paths
3. **AI Training**: Machine learning models for personalized recommendations
4. **User Testing**: Continuous feedback collection and UI/UX improvements

## Deployment

### Production Build

```bash
# Frontend build
cd frontend && npm run build

# Backend production
cd backend && npm run start
```

### Environment Variables

```env
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/guidemitra"
JWT_SECRET="your-super-secret-jwt-key"
NODE_ENV="production"
PORT=5000

```
