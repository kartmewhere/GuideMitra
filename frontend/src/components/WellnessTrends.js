import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const WellnessTrends = ({ period = 30 }) => {
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState([
    'mood',
    'energy',
    'sleep',
  ]);

  const fetchTrendsData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wellness/analytics?period=${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrendsData(data);
      }
    } catch (error) {
      console.error('Error fetching trends data:', error);
    } finally {
      setLoading(false);
    }
  }, [period]); // localStorage is a global object, so it doesn't need to be in deps

  useEffect(() => {
    fetchTrendsData();
  }, [fetchTrendsData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const metricColors = {
    mood: '#3B82F6', // Blue
    energy: '#F59E0B', // Yellow
    sleep: '#8B5CF6', // Purple
    focus: '#10B981', // Green
    stress: '#EF4444', // Red
    overall: '#6366F1', // Indigo
  };

  const metricLabels = {
    mood: 'Mood',
    energy: 'Energy',
    sleep: 'Sleep Quality',
    focus: 'Focus',
    stress: 'Stress Level',
    overall: 'Overall Score',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!trendsData || trendsData.dailyData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Wellness Trends
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-500">
            No data available for the selected period
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Complete daily check-ins to see your wellness trends
          </div>
        </div>
      </div>
    );
  }

  const chartData = trendsData.dailyData.map((item) => ({
    ...item,
    date: formatDate(item.date),
    stress: 11 - item.stress, // Invert stress for better visualization
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Wellness Trends</h3>
        <div className="text-sm text-gray-500">
          Last {period} days • {trendsData.totalCheckins} check-ins
        </div>
      </div>

      {/* Metric Selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(metricLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              if (selectedMetrics.includes(key)) {
                setSelectedMetrics(selectedMetrics.filter((m) => m !== key));
              } else {
                setSelectedMetrics([...selectedMetrics, key]);
              }
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetrics.includes(key)
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: selectedMetrics.includes(key)
                ? metricColors[key]
                : undefined,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => [
                `${value.toFixed(1)}/10`,
                metricLabels[name] || name,
              ]}
            />
            <Legend />

            {selectedMetrics.map((metric) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={metricColors[metric]}
                strokeWidth={2}
                dot={{ fill: metricColors[metric], strokeWidth: 2, r: 3 }}
                activeDot={{
                  r: 5,
                  stroke: metricColors[metric],
                  strokeWidth: 2,
                }}
                name={metricLabels[metric]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      {trendsData.averages && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(trendsData.averages).map(([key, value]) => (
              <div key={key} className="text-center">
                <div
                  className="text-lg font-bold"
                  style={{ color: metricColors[key] }}
                >
                  {value.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  Avg {metricLabels[key] || key}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlations */}
      {trendsData.correlations && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Key Insights
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {trendsData.correlations.sleepMood && (
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">Sleep ↔ Mood</div>
                <div className="text-blue-700">
                  {(trendsData.correlations.sleepMood * 100).toFixed(0)}%
                  correlation
                </div>
              </div>
            )}
            {trendsData.correlations.stressEnergy && (
              <div className="p-2 bg-red-50 rounded-lg">
                <div className="font-medium text-red-900">Stress ↔ Energy</div>
                <div className="text-red-700">
                  {(
                    Math.abs(trendsData.correlations.stressEnergy) * 100
                  ).toFixed(0)}
                  % correlation
                </div>
              </div>
            )}
            {trendsData.correlations.exerciseMood && (
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900">
                  Exercise ↔ Mood
                </div>
                <div className="text-green-700">
                  {(trendsData.correlations.exerciseMood * 100).toFixed(0)}%
                  correlation
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

WellnessTrends.propTypes = {
  period: PropTypes.number,
};

export default WellnessTrends;

