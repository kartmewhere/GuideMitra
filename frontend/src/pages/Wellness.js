import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import WellnessTrends from '../components/WellnessTrends';
import {
  Heart,
  Brain,
  Activity,
  Moon,
  Target,
  TrendingUp,
  Plus,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Smile,
  Award
} from 'lucide-react';

const Wellness = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/wellness/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching wellness dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'ACHIEVEMENT': return <Award className="h-5 w-5 text-green-600" />;
      case 'WARNING': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'TREND': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wellness dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Wellness Tracker 🌟
              </h1>
              <p className="text-gray-600">
                Monitor your mental, physical, and emotional wellbeing
              </p>
            </div>
            
            {!dashboardData?.todayCheckin && (
              <button
                onClick={() => setShowCheckinModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Daily Check-in</span>
              </button>
            )}
          </div>
        </div>

        {/* Today's Status */}
        {dashboardData?.todayCheckin ? (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Today's Check-in Complete! ✅</h2>
                <p className="text-green-100">
                  Overall wellness score: {dashboardData.todayCheckin.overallScore}/10
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">
                  {dashboardData.stats?.currentStreak || 0}
                </div>
                <div className="text-green-100 text-sm">Day Streak</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Ready for your daily check-in? 🎯</h2>
                <p className="text-blue-100">
                  Track your wellness and build healthy habits
                </p>
              </div>
              <button
                onClick={() => setShowCheckinModal(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Start Check-in
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'insights', label: 'Insights', icon: Brain }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'trends' && (
          <div className="space-y-8">
            <WellnessTrends period={30} />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {dashboardData?.stats?.averages && Object.entries({
                mood: { label: 'Mood', icon: Smile, color: 'blue' },
                energy: { label: 'Energy', icon: Zap, color: 'yellow' },
                sleep: { label: 'Sleep', icon: Moon, color: 'purple' },
                focus: { label: 'Focus', icon: Brain, color: 'green' },
                overall: { label: 'Overall', icon: Heart, color: 'red' }
              }).map(([key, config]) => {
                const score = dashboardData.stats.averages[key];
                return (
                  <div key={key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <config.icon className={`h-5 w-5 text-${config.color}-500`} />
                      <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(score)}`}>
                        {score?.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{config.label}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`bg-${config.color}-500 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Check-ins</h3>
              </div>
              <div className="p-6">
                {dashboardData?.recentCheckins?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentCheckins.slice(0, 5).map((checkin, _index) => (
                      <div key={checkin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            {new Date(checkin.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              Mood: {checkin.moodScore}
                            </span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              Energy: {checkin.energyLevel}
                            </span>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              Sleep: {checkin.sleepQuality}
                            </span>
                          </div>
                        </div>
                        <div className={`text-sm font-medium px-3 py-1 rounded-full ${getScoreColor(checkin.overallScore)}`}>
                          {checkin.overallScore}/10
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No check-ins yet</p>
                    <button
                      onClick={() => setShowCheckinModal(true)}
                      className="btn-primary"
                    >
                      Start Your First Check-in
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Goals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Active Goals</h3>
                  <Link to="/wellness/goals" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Manage Goals →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {dashboardData?.activeGoals?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboardData.activeGoals.slice(0, 4).map(goal => (
                      <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {goal.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Streak: {goal.currentStreak} days
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No active goals</p>
                    <Link to="/wellness/goals" className="btn-primary">
                      Set Your First Goal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Insights */}
        {dashboardData?.recentInsights?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Insights</h3>
                <Link to="/wellness/insights" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentInsights.slice(0, 3).map(insight => (
                  <div key={insight.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      {insight.recommendations?.length > 0 && (
                        <div className="text-xs text-gray-500">
                          💡 {insight.recommendations[0]}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Check-in Modal */}
        {showCheckinModal && (
          <CheckinModal
            onClose={() => setShowCheckinModal(false)}
            onComplete={() => {
              setShowCheckinModal(false);
              fetchDashboardData();
            }}
            existingCheckin={dashboardData?.todayCheckin}
          />
        )}
      </div>
    </div>
  );
};

// Check-in Modal Component
const CheckinModal = ({ onClose, onComplete, existingCheckin }) => {
  const [formData, setFormData] = useState({
    moodScore: existingCheckin?.moodScore || 5,
    stressLevel: existingCheckin?.stressLevel || 5,
    energyLevel: existingCheckin?.energyLevel || 5,
    sleepQuality: existingCheckin?.sleepQuality || 5,
    focusLevel: existingCheckin?.focusLevel || 5,
    hoursSlept: existingCheckin?.hoursSlept || '',
    exerciseMinutes: existingCheckin?.exerciseMinutes || '',
    screenTime: existingCheckin?.screenTime || '',
    socialTime: existingCheckin?.socialTime || '',
    studyHours: existingCheckin?.studyHours || '',
    productivityScore: existingCheckin?.productivityScore || 5,
    motivationLevel: existingCheckin?.motivationLevel || 5,
    anxietyLevel: existingCheckin?.anxietyLevel || 5,
    confidenceLevel: existingCheckin?.confidenceLevel || 5,
    activities: existingCheckin?.activities || [],
    gratitude: existingCheckin?.gratitude || [],
    challenges: existingCheckin?.challenges || [],
    notes: existingCheckin?.notes || '',
    goals: existingCheckin?.goals || []
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: 'Core Wellness', fields: ['moodScore', 'stressLevel', 'energyLevel', 'sleepQuality', 'focusLevel'] },
    { title: 'Lifestyle', fields: ['hoursSlept', 'exerciseMinutes', 'screenTime', 'socialTime', 'studyHours'] },
    { title: 'Mental State', fields: ['productivityScore', 'motivationLevel', 'anxietyLevel', 'confidenceLevel'] },
    { title: 'Reflection', fields: ['activities', 'gratitude', 'challenges', 'notes', 'goals'] }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const url = existingCheckin 
        ? `/api/wellness/checkin/${existingCheckin.id}`
        : '/api/wellness/checkin';
      
      const method = existingCheckin ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onComplete();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save check-in');
      }
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in');
    } finally {
      setLoading(false);
    }
  };

  const renderSlider = (field, label, min = 1, max = 10) => (
    <div className="mb-6">
      <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
        {label}: {formData[field]}
      </label>
      <input
        type="range"
        id={field}
        min={min}
        max={max}
        value={formData[field]}
        onChange={(e) => setFormData({ ...formData, [field]: parseInt(e.target.value) })}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );

  const renderInput = (field, label, type = 'number', placeholder = '') => (
    <div className="mb-4">
      <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        id={field}
        value={formData[field]}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {existingCheckin ? 'Update Today\'s Check-in' : 'Daily Wellness Check-in'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              {steps.map((step, index) => (
                <span key={index} className={index <= currentStep ? 'text-blue-600' : ''}>
                  {step.title}
                </span>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 0: Core Wellness */}
          {currentStep === 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">How are you feeling today?</h3>
              {renderSlider('moodScore', '😊 Mood')}
              {renderSlider('stressLevel', '😰 Stress Level')}
              {renderSlider('energyLevel', '⚡ Energy Level')}
              {renderSlider('sleepQuality', '😴 Sleep Quality')}
              {renderSlider('focusLevel', '🎯 Focus Level')}
            </div>
          )}

          {/* Step 1: Lifestyle */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lifestyle Factors</h3>
              {renderInput('hoursSlept', '💤 Hours Slept', 'number', '7.5')}
              {renderInput('exerciseMinutes', '🏃 Exercise (minutes)', 'number', '30')}
              {renderInput('screenTime', '📱 Screen Time (minutes)', 'number', '120')}
              {renderInput('socialTime', '👥 Social Time (minutes)', 'number', '60')}
              {renderInput('studyHours', '📚 Study Hours', 'number', '4')}
            </div>
          )}

          {/* Step 2: Mental State */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mental & Emotional State</h3>
              {renderSlider('productivityScore', '📈 Productivity')}
              {renderSlider('motivationLevel', '🔥 Motivation')}
              {renderSlider('anxietyLevel', '😟 Anxiety Level')}
              {renderSlider('confidenceLevel', '💪 Confidence')}
            </div>
          )}

          {/* Step 3: Reflection */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Reflection</h3>
              {renderInput('notes', '📝 Notes & Thoughts', 'textarea', 'How was your day?')}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gratitude" className="block text-sm font-medium text-gray-700 mb-2">
                    🙏 Grateful For (comma separated)
                  </label>
                  <input
                    type="text"
                    id="gratitude"
                    value={formData.gratitude.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      gratitude: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    })}
                    placeholder="Family, health, opportunities..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="goals" className="block text-sm font-medium text-gray-700 mb-2">
                    🎯 Tomorrow's Goals (comma separated)
                  </label>
                  <input
                    type="text"
                    id="goals"
                    value={formData.goals.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      goals: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    })}
                    placeholder="Study math, exercise, call friend..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : existingCheckin ? 'Update Check-in' : 'Complete Check-in'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

CheckinModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  existingCheckin: PropTypes.shape({
    moodScore: PropTypes.number,
    stressLevel: PropTypes.number,
    energyLevel: PropTypes.number,
    sleepQuality: PropTypes.number,
    focusLevel: PropTypes.number,
    hoursSlept: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    exerciseMinutes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    screenTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    socialTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    studyHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    productivityScore: PropTypes.number,
    motivationLevel: PropTypes.number,
    anxietyLevel: PropTypes.number,
    confidenceLevel: PropTypes.number,
    activities: PropTypes.arrayOf(PropTypes.string),
    gratitude: PropTypes.arrayOf(PropTypes.string),
    challenges: PropTypes.arrayOf(PropTypes.string),
    notes: PropTypes.string,
    goals: PropTypes.arrayOf(PropTypes.string),
    id: PropTypes.string,
  }),
};

export default Wellness;