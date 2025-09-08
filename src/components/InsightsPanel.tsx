import React from 'react';
import { AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { InsightData } from '../types';

interface InsightsPanelProps {
  insights: InsightData[];
  attribute: string;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, attribute }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-6 h-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">
            Automated Insights & Recommendations
          </h3>
        </div>
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No insights available for the current selection. Try adjusting your filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-6">
        <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          Automated Insights & Recommendations
        </h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getCardStyle(insight.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> These insights are automatically generated based on statistical analysis 
          of your {attribute} data. Please consult with healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
};