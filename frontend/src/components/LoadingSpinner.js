import React from 'react';
import PropTypes from 'prop-types';
import { Brain } from 'lucide-react';

const LoadingSpinner = ({ size = 'large', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="text-center">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className={`${sizeClasses[size]} mx-auto mb-4 relative`}>
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 animate-spin border-t-primary-600"></div>
            <div className="absolute inset-2 rounded-full border-2 border-accent-200 animate-spin border-b-accent-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-600 animate-pulse" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium text-neutral-700">{message}</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
};

export default LoadingSpinner;