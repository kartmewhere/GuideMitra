import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Activity,
} from 'lucide-react';

const WellnessWidget = () => {
  const [wellnessData, setWellnessData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const fetchWellnessData = async () => {
    try {
      const response = await fetch('/api/wellness/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWellnessData(data);
      }
    } catch (error) {
      console.error('Error fetching wellness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 flex items-center">
          <Heart className="h-5 w-5 text-pink-500 mr-2" />
          Wellness
        </h2>
        <Link
          to="/wellness"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {wellnessData?.todayCheckin ? (
        <div className="space-y-4">
          {/* Today's Score */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">
                  Today's Check-in Complete
                </div>
                <div className="text-sm text-green-700">
                  Overall Score: {wellnessData.todayCheckin.overallScore}/10
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {wellnessData.stats?.currentStreak || 0}
              </div>
              <div className="text-xs text-green-600">day streak</div>
            </div>
          </div>

          {/* Quick Stats */}
          {wellnessData.stats?.averages && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div
                  className={`text-lg font-bold ${getScoreColor(wellnessData.stats.averages.mood)}`}
                >
                  {wellnessData.stats.averages.mood.toFixed(1)}
                </div>
                <div className="text-xs text-blue-600">Mood</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div
                  className={`text-lg font-bold ${getScoreColor(wellnessData.stats.averages.energy)}`}
                >
                  {wellnessData.stats.averages.energy.toFixed(1)}
                </div>
                <div className="text-xs text-purple-600">Energy</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div
                  className={`text-lg font-bold ${getScoreColor(wellnessData.stats.averages.sleep)}`}
                >
                  {wellnessData.stats.averages.sleep.toFixed(1)}
                </div>
                <div className="text-xs text-indigo-600">Sleep</div>
              </div>
            </div>
          )}

          {/* Recent Insights */}
          {wellnessData.recentInsights?.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">
                Recent Insights
              </div>
              {wellnessData.recentInsights.slice(0, 2).map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {insight.type === 'ACHIEVEMENT' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {insight.type === 'WARNING' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {insight.type === 'TREND' && (
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {insight.title}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {insight.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-600 mb-4">
            <div className="font-medium">Ready for your daily check-in?</div>
            <div className="text-sm">
              Track your wellness and build healthy habits
            </div>
          </div>
          <Link to="/wellness" className="btn-primary inline-flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Start Check-in
          </Link>
        </div>
      )}

      {/* Active Goals Preview */}
      {wellnessData?.activeGoals?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Active Goals
          </div>
          <div className="space-y-2">
            {wellnessData.activeGoals.slice(0, 2).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {goal.title}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {goal.currentStreak}d streak
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WellnessWidget;

