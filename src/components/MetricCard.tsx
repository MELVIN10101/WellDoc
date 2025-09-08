import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  change,
  changeLabel,
  className = ''
}) => {
  const getTrendIcon = () => {
    if (change === undefined) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-600';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value.toFixed(2)}
            {unit && <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center">
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-sm text-gray-500 ml-2">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};