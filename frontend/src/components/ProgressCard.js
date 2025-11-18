import { Target, Clock } from 'lucide-react';

const ProgressCard = ({
  title,
  progress,
  target,
  timeRemaining,
  color = 'primary',
  icon: Icon = Target,
  description,
}) => {
  return (
    <div className="card p-6 group hover:shadow-medium transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-${color}-100 group-hover:bg-${color}-200 transition-colors duration-200`}
        >
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold text-${color}-600`}>
            {progress}%
          </div>
          <div className="text-xs text-neutral-500">Complete</div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-600 mb-4">{description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="progress-bar">
          <div
            className={`progress-fill bg-gradient-to-r from-${color}-500 to-${color}-600`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-neutral-600">
        {target && (
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>{target}</span>
          </div>
        )}
        {timeRemaining && (
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;

