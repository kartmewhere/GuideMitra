import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Roadmaps from './pages/Roadmaps';
import Assessments from './pages/Assessments';
import AssessmentResults from './pages/AssessmentResults';
import Colleges from './pages/Colleges';
import Timeline from './pages/Timeline';
import Wellness from './pages/Wellness';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
}

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-1 relative">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/roadmaps" element={<Roadmaps />} />
                      <Route path="/assessments" element={<Assessments />} />
                      <Route path="/assessments/:assessmentId/results" element={<AssessmentResults />} />
                      <Route path="/colleges" element={<Colleges />} />
                      <Route path="/timeline" element={<Timeline />} />
                      <Route path="/wellness" element={<Wellness />} />
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;