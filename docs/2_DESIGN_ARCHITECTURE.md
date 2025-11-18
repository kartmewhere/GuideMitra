# 2. DESIGN, ARCHITECTURE AND WORKFLOW DOCUMENTATION

## 2.1 System Architecture Overview

### Architecture Pattern: Three-Tier Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                     (React Frontend)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │ Contexts │  │  Routing │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                  (Node.js + Express Backend)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │  │Middleware│  │Controllers│ │ Services │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│                   (PostgreSQL Database)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Users   │  │Assessments│ │ Wellness │  │ Roadmaps │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### External Integrations
```
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Google Gemini│  │  Email SMTP  │  │  File Storage│     │
│  │   AI API     │  │   Service    │  │   (Future)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2.2 Database Schema Design

### Entity Relationship Diagram (ERD)

#### Core Entities
```
User (1) ──────── (1) UserProfile
  │
  ├── (1:N) ChatSession ──── (1:N) ChatMessage
  │
  ├── (1:N) CareerRoadmap ──── (1:N) RoadmapMilestone
  │
  ├── (1:N) WellnessCheckin
  ├── (1:N) WellnessGoal
  ├── (1:N) WellnessInsight
  │
  └── (1:N) Assessment
           │
           ├── (1:N) AssessmentQuestion ──── (1:N) AssessmentResponse
           │
           └── (1:1) AssessmentResult
```

### Database Models (Implemented)

#### 1. User Management
- **User**: Core user authentication and identification
- **UserProfile**: Extended user information (education, skills, interests)

#### 2. Assessment System
- **Assessment**: Assessment metadata and configuration
- **AssessmentQuestion**: Individual questions with options and weights
- **AssessmentResponse**: User answers to questions
- **AssessmentResult**: Analyzed results with scores and recommendations

#### 3. Chat System
- **ChatSession**: Conversation sessions with type classification
- **ChatMessage**: Individual messages with role (user/assistant/system)

#### 4. Career Planning
- **CareerRoadmap**: Personalized career paths
- **RoadmapMilestone**: Individual steps with resources and completion tracking

#### 5. Wellness Tracking
- **WellnessCheckin**: Daily wellness metrics (mood, stress, sleep, etc.)
- **WellnessGoal**: User-defined wellness objectives
- **WellnessInsight**: AI-generated wellness recommendations

---

## 2.3 Frontend Architecture

### Component Hierarchy
```
App
├── AuthContext (Global State)
├── Navbar (Navigation)
└── Routes
    ├── Dashboard
    │   ├── ProgressCard
    │   ├── WellnessWidget
    │   └── NotificationToast
    ├── Assessments
    │   ├── LoadingSpinner (with animations)
    │   └── Progress Indicators
    ├── AssessmentResults
    │   └── Technical Notes Section
    ├── Chat
    │   └── Message Components
    ├── Wellness
    │   ├── WellnessWidget
    │   └── WellnessTrends
    ├── Roadmaps
    │   └── Milestone Cards
    ├── Colleges
    │   └── College Cards
    ├── Timeline
    │   └── Event Cards
    ├── Profile
    │   └── Profile Forms
    ├── Login
    └── Register
```

### State Management Strategy

#### 1. Global State (React Context)
- **AuthContext**: User authentication state, token management
- **Location**: `/frontend/src/contexts/AuthContext.js`

#### 2. Local State (React Hooks)
- **useState**: Component-level state (forms, UI toggles)
- **useEffect**: Side effects (API calls, subscriptions)
- **useNavigate**: Programmatic navigation
- **useParams**: Route parameters

#### 3. API State Management
- **Axios**: HTTP client for API communication
- **Error Handling**: Try-catch blocks with user-friendly messages
- **Loading States**: Spinner components during async operations

### Routing Structure
```javascript
/ (Root)
├── /login
├── /register
├── /dashboard (Protected)
├── /assessments (Protected)
├── /assessments/:id/results (Protected)
├── /chat (Protected)
├── /wellness (Protected)
├── /roadmaps (Protected)
├── /colleges (Protected)
├── /timeline (Protected)
└── /profile (Protected)
```

---

## 2.4 Backend Architecture

### API Route Structure
```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── GET  /me
├── /user
│   ├── GET  /profile
│   ├── PUT  /profile
│   └── GET  /wellness-analytics
├── /assessments
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── POST   /:id/submit
│   └── GET    /:id/results
├── /chat
│   ├── POST /message
│   ├── GET  /sessions
│   └── GET  /sessions/:id
├── /wellness
│   ├── POST /checkin
│   ├── GET  /checkins
│   ├── POST /goals
│   ├── GET  /goals
│   ├── GET  /insights
│   └── GET  /trends
├── /recommendations
│   ├── GET /courses
│   └── GET /careers
├── /colleges
│   ├── GET /
│   └── GET /:id
└── /timeline
    ├── GET  /events
    └── POST /events
```

### Middleware Stack
```javascript
1. CORS Configuration
2. JSON Body Parser
3. Authentication Middleware (JWT verification)
4. Error Handling Middleware
5. Request Logging (development)
```

### Service Layer Pattern
```
Routes → Controllers → Services → Database (Prisma)
```

**Benefits:**
- Separation of concerns
- Reusable business logic
- Easier testing
- Better maintainability

---

## 2.5 Workflow Documentation

### 2..1 User Registration & Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─ 1. Navigate to /register
       │
       ├─ 2. Fill registration form
       │     (name, email, password)
       │
       ├─ 3. Submit form
       │
       ▼
┌─────────────────────────────────┐
│  Frontend Validation            │
│  - Email format                 │
│  - Password strength            │
│  - Required fields              │
└──────────┬──────────────────────┘
           │
           ├─ 4. POST /api/auth/register
           │
           ▼
┌─────────────────────────────────┐
│  Backend Processing             │
│  - Check email uniqueness       │
│  - Hash password (bcrypt)       │
│  - Create user record           │
│  - Generate JWT token           │
└──────────┬──────────────────────┘
           │
           ├─ 5. Return token + user data
           │
           ▼
┌─────────────────────────────────┐
│  Frontend State Update          │
│  - Store token in localStorage  │
│  - Update AuthContext           │
│  - Redirect to /dashboard       │
└─────────────────────────────────┘
```

### 2.6.2 Assessment Taking Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─ 1. Navigate to /assessments
       │
       ├─ 2. View available assessments
       │
       ├─ 3. Click "Start Assessment"
       │
       ▼
┌─────────────────────────────────┐
│  Assessment Initialization      │
│  - POST /api/assessments        │
│  - Generate questions           │
│  - Create assessment record     │
└──────────┬──────────────────────┘
           │
           ├─ 4. Display questions one by one
           │
           ▼
┌─────────────────────────────────┐
│  Question Answering Loop        │
│  For each question:             │
│  - Display question & options   │
│  - Show progress indicator      │
│  - Store answer locally         │
│  - Move to next question        │
└──────────┬──────────────────────┘
           │
           ├─ 5. All questions answered
           │
           ├─ 6. Show loading animation
           │     (Brain icon, progress ring)
           │
           ├─ 7. POST /api/assessments/:id/submit
           │
           ▼
┌─────────────────────────────────┐
│  Backend Analysis               │
│  - Calculate scores             │
│  - Call Google Gemini API       │
│  - Generate insights            │
│  - Fallback if API fails        │
│  - Store results                │
└──────────┬──────────────────────┘
           │
           ├─ 8. Return results
           │
           ▼
┌─────────────────────────────────┐
│  Display Results                │
│  - Navigate to /assessments/:id/results
│  - Show scores & insights       │
│  - Display recommendations      │
│  - Show technical notes         │
└─────────────────────────────────┘
```

### 2.6.3 Wellness Check-in Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─ 1. Navigate to /wellness
       │
       ├─ 2. Click "Daily Check-in"
       │
       ▼
┌─────────────────────────────────┐
│  Check-in Form                  │
│  - Mood score (1-10)            │
│  - Stress level (1-10)          │
│  - Energy level (1-10)          │
│  - Sleep quality (1-10)         │
│  - Focus level (1-10)           │
│  - Optional: lifestyle factors  │
└──────────┬──────────────────────┘
           │
           ├─ 3. Submit check-in
           │
           ├─ 4. POST /api/wellness/checkin
           │
           ▼
┌─────────────────────────────────┐
│  Backend Processing             │
│  - Validate data                │
│  - Calculate overall score      │
│  - Store check-in record        │
│  - Analyze trends               │
│  - Generate insights (if needed)│
└──────────┬──────────────────────┘
           │
           ├─ 5. Return confirmation
           │
           ▼
┌─────────────────────────────────┐
│  Update Dashboard               │
│  - Show success message         │
│  - Update wellness widget       │
│  - Display new insights         │
│  - Update trend charts          │
└─────────────────────────────────┘
```

### 2.6.4 AI Chat Interaction Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─ 1. Navigate to /chat
       │
       ├─ 2. Select chat type
       │     (Career/Academic/Wellness)
       │
       ├─ 3. Type message
       │
       ├─ 4. Click send
       │
       ▼
┌─────────────────────────────────┐
│  Frontend Processing            │
│  - Display user message         │
│  - Show typing indicator        │
│  - POST /api/chat/message       │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  Backend AI Processing          │
│  - Load chat context            │
│  - Prepare prompt               │
│  - Call Google Gemini API       │
│  - Process AI response          │
│  - Store message history        │
└──────────┬──────────────────────┘
           │
           ├─ 5. Return AI response
           │
           ▼
┌─────────────────────────────────┐
│  Display Response               │
│  - Hide typing indicator        │
│  - Show AI message              │
│  - Enable input for next message│
└─────────────────────────────────┘
```

### 2.6.5 Career Roadmap Creation Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─ 1. Navigate to /roadmaps
       │
       ├─ 2. Click "Create Roadmap"
       │
       ├─ 3. Fill roadmap form
       │     (title, target role, description)
       │
       ├─ 4. Submit form
       │
       ▼
┌─────────────────────────────────┐
│  Backend Processing             │
│  - Create roadmap record        │
│  - Generate AI recommendations  │
│  - Create milestone suggestions │
│  - Link resources               │
└──────────┬──────────────────────┘
           │
           ├─ 5. Return roadmap with milestones
           │
           ▼
┌─────────────────────────────────┐
│  Display Roadmap                │
│  - Show milestone timeline      │
│  - Display progress tracker     │
│  - List resources               │
│  - Enable milestone completion  │
└─────────────────────────────────┘
```

---

## 2.7 Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Verify Credentials (bcrypt compare)
   ↓
3. Generate JWT Token
   - Payload: { userId, email }
   - Expiry: 7 days
   ↓
4. Return Token to Client
   ↓
5. Client Stores Token (localStorage)
   ↓
6. Include Token in API Requests (Authorization header)
   ↓
7. Server Verifies Token (JWT middleware)
   ↓
8. Grant/Deny Access
```

### Security Measures Implemented

#### 1. Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Length**: 6 characters (can be increased)
- **Storage**: Never store plain text passwords

#### 2. Authentication
- **JWT Tokens**: Stateless authentication
- **Token Expiry**: 7-day expiration
- **Protected Routes**: Middleware verification

#### 3. Input Validation
- **Frontend**: Form validation before submission
- **Backend**: Server-side validation
- **Prisma**: Type-safe database queries

#### 4. SQL Injection Prevention
- **Prisma ORM**: Parameterized queries
- **No Raw SQL**: Avoid direct SQL execution

#### 5. XSS Prevention
- **React**: Automatic escaping of user input
- **Content Security Policy**: (Can be added)

#### 6. CORS Configuration
- **Allowed Origins**: Configured for frontend domain
- **Credentials**: Enabled for cookie-based auth

---

## 2.8 Performance Optimization

### Frontend Optimizations
1. **Code Splitting**: React.lazy() for route-based splitting
2. **Memoization**: React.memo() for expensive components
3. **Debouncing**: Search inputs and API calls
4. **Image Optimization**: Lazy loading, proper formats
5. **Bundle Size**: Tree shaking, minification

### Backend Optimizations
1. **Database Indexing**: Primary keys, foreign keys, unique constraints
2. **Query Optimization**: Select only needed fields
3. **Caching**: (Can be implemented with Redis)
4. **Connection Pooling**: Prisma connection management
5. **Compression**: gzip compression for responses

### Database Optimizations
1. **Proper Indexing**: On frequently queried fields
2. **Relationship Optimization**: Efficient joins
3. **Data Types**: Appropriate column types
4. **Cascading Deletes**: Automatic cleanup

---



### Production Environment (Recommended)
```
Frontend: Vercel / Netlify (Static hosting)
Backend:  Heroku / Railway / DigitalOcean (Node.js hosting)
Database: Heroku Postgres / Supabase / AWS RDS
```

### CI/CD Pipeline (Future)
```
1. Code Push to GitHub
   ↓
2. Run Tests (Jest, Cypress)
   ↓
3. Build Frontend (npm run build)
   ↓
4. Deploy Frontend (Vercel)
   ↓
5. Deploy Backend (Heroku)
   ↓
6. Run Database Migrations
   ↓
7. Health Check
```
