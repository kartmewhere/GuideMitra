import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WellnessWidget from '../components/WellnessWidget';
import {
  MessageCircle,
  Target,
  Brain,
  GraduationCap,
  MapPin,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock,
  BookOpen,
  Heart
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    recentSessions: [],
    upcomingEvents: [],
    wellnessScore: 8.2,
    studyStreak: 12,
    completedAssessments: 2,
    activeGoals: 3
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual endpoints
      setTimeout(() => {
        setDashboardData({
          recentSessions: [
            { id: 1, title: 'Career Guidance Session', type: 'CAREER', updatedAt: new Date() },
            { id: 2, title: 'Study Planning', type: 'ACADEMIC', updatedAt: new Date() }
          ],
          upcomingEvents: [
            { title: 'JEE Main Registration', date: '2024-12-15', type: 'exam', urgent: true },
            { title: 'Scholarship Deadline', date: '2024-12-20', type: 'deadline', urgent: false }
          ],
          wellnessScore: 8.2,
          studyStreak: 12,
          completedAssessments: 2,
          activeGoals: 3
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Clean Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {getGreeting()}, {user?.name}! 👋
          </h1>
          <p className="text-neutral-600 text-lg">
            Let's continue building your future together.
          </p>
        </div>

        {/* Key Metrics - Simplified */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="dashboard-metric dashboard-card-hover">
            <div className="text-2xl font-bold text-primary-600 mb-1">{dashboardData.studyStreak}</div>
            <div className="text-sm text-neutral-500">Day Streak</div>
          </div>
          <div className="dashboard-metric dashboard-card-hover">
            <div className="text-2xl font-bold text-success-600 mb-1">{dashboardData.completedAssessments}</div>
            <div className="text-sm text-neutral-500">Assessments</div>
          </div>
          <div className="dashboard-metric dashboard-card-hover">
            <div className="text-2xl font-bold text-accent-600 mb-1">{dashboardData.wellnessScore}</div>
            <div className="text-sm text-neutral-500">Wellness Score</div>
          </div>
          <div className="dashboard-metric dashboard-card-hover">
            <div className="text-2xl font-bold text-warning-600 mb-1">{dashboardData.activeGoals}</div>
            <div className="text-sm text-neutral-500">Active Goals</div>
          </div>
        </div>

        {/* Main Action Cards - Cleaner Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* AI Chat Card */}
          <Link to="/chat" className="block group">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 dashboard-action-primary rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <Brain className="h-12 w-12 mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-2">AI Career Chat</h3>
                <p className="text-primary-100 mb-6">Get instant, personalized career guidance powered by AI</p>
                <div className="flex items-center text-sm font-medium">
                  <span>Start Conversation</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Assessments Card */}
          <Link to="/assessments" className="block group">
            <div className="bg-gradient-to-br from-success-500 to-success-600 dashboard-action-primary rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <Target className="h-12 w-12 mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-2">Take Assessment</h3>
                <p className="text-success-100 mb-6">Discover your strengths and ideal career paths</p>
                <div className="flex items-center text-sm font-medium">
                  <span>Start Assessment</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link to="/wellness" className="dashboard-secondary-card dashboard-card-hover group">
            <Heart className="h-8 w-8 text-pink-500 mb-3" />
            <h4 className="font-semibold text-neutral-900 mb-2">Wellness Tracker</h4>
            <p className="text-sm text-neutral-600 mb-3">Monitor your mental & physical health</p>
            <div className="text-pink-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Track <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Link>

          <Link to="/colleges" className="dashboard-secondary-card dashboard-card-hover group">
            <MapPin className="h-8 w-8 text-accent-500 mb-3" />
            <h4 className="font-semibold text-neutral-900 mb-2">Find Colleges</h4>
            <p className="text-sm text-neutral-600 mb-3">Explore nearby institutions</p>
            <div className="text-accent-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Browse <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Link>

          <Link to="/roadmaps" className="dashboard-secondary-card dashboard-card-hover group">
            <GraduationCap className="h-8 w-8 text-warning-500 mb-3" />
            <h4 className="font-semibold text-neutral-900 mb-2">Career Roadmaps</h4>
            <p className="text-sm text-neutral-600 mb-3">Plan your educational journey</p>
            <div className="text-warning-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              Explore <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Link>

          <Link to="/timeline" className="dashboard-secondary-card dashboard-card-hover group">
            <Calendar className="h-8 w-8 text-error-500 mb-3" />
            <h4 className="font-semibold text-neutral-900 mb-2">Important Dates</h4>
            <p className="text-sm text-neutral-600 mb-3">Track deadlines and exams</p>
            <div className="text-error-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center">
              View <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </Link>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Wellness Widget */}
          <WellnessWidget />

          {/* Recent Activity */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Recent Activity</h2>
              <TrendingUp className="h-5 w-5 text-neutral-400" />
            </div>
            
            {dashboardData.recentSessions.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-xl">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-neutral-900">{session.title}</h3>
                      <p className="text-sm text-neutral-500 capitalize">
                        {session.type.toLowerCase().replace('_', ' ')} • Just now
                      </p>
                    </div>
                  </div>
                ))}
                <Link
                  to="/chat"
                  className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium py-2"
                >
                  View All Conversations →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500 mb-4">No recent activity</p>
                <Link to="/chat" className="btn-primary">
                  Start Your First Chat
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">Upcoming Events</h2>
              <Calendar className="h-5 w-5 text-neutral-400" />
            </div>
            
            <div className="space-y-4">
              {dashboardData.upcomingEvents.map((event, index) => (
                <div key={index} className={`p-4 rounded-xl border ${
                  event.urgent ? 'border-warning-200 bg-warning-50' : 'border-neutral-100 bg-neutral-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-neutral-900">{event.title}</h3>
                      <p className="text-sm text-neutral-500">
                        {new Date(event.date).toLocaleDateString()}
                        {event.urgent && <span className="ml-2 text-warning-600 font-medium">• Urgent</span>}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      event.type === 'exam' ? 'bg-error-100 text-error-600' : 'bg-warning-100 text-warning-600'
                    }`}>
                      {event.type === 'exam' ? <BookOpen className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              ))}
              
              <Link
                to="/timeline"
                className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium py-2"
              >
                View All Events →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 dashboard-card">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Need Help Getting Started?</h3>
            <p className="text-neutral-600 mb-6">Our AI assistant is here to guide you through your educational journey</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chat?type=career" className="btn-primary">
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Career Questions
              </Link>
              <Link to="/assessments" className="btn-secondary">
                <Target className="h-4 w-4 mr-2" />
                Take Assessment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;