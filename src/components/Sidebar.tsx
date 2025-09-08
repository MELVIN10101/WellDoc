import React from 'react';
import { Calendar, Activity, Filter, BarChart3 } from 'lucide-react';
import { AttributeKey, DataTypeFilter } from '../types';
import { getAttributeLabel } from '../utils/insights';

interface SidebarProps {
  selectedAttribute: AttributeKey;
  onAttributeChange: (attribute: AttributeKey) => void;
  dataTypeFilter: DataTypeFilter;
  onDataTypeChange: (filter: DataTypeFilter) => void;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  availableAttributes: AttributeKey[];
  minDate: Date;
  maxDate: Date;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedAttribute,
  onAttributeChange,
  dataTypeFilter,
  onDataTypeChange,
  dateRange,
  onDateRangeChange,
  availableAttributes,
  minDate,
  maxDate
}) => {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    onDateRangeChange({ start: newStart, end: dateRange.end });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    onDateRangeChange({ start: dateRange.start, end: newEnd });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Health Trends</h1>
            <p className="text-sm text-gray-600">Interactive Dashboard</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Attribute Selector */}
          <div>
            <div className="flex items-center mb-3">
              <Activity className="w-5 h-5 text-gray-600 mr-2" />
              <label className="text-sm font-medium text-gray-900">
                Select Attribute
              </label>
            </div>
            <select
              value={selectedAttribute}
              onChange={(e) => onAttributeChange(e.target.value as AttributeKey)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
            >
              {availableAttributes.map((attr) => (
                <option key={attr} value={attr}>
                  {getAttributeLabel(attr)}
                </option>
              ))}
            </select>
          </div>

          {/* Data Type Filter */}
          <div>
            <div className="flex items-center mb-3">
              <Filter className="w-5 h-5 text-gray-600 mr-2" />
              <label className="text-sm font-medium text-gray-900">
                Data Type
              </label>
            </div>
            <div className="space-y-2">
              {(['Both', 'Historical', 'Predicted'] as DataTypeFilter[]).map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="dataType"
                    value={type}
                    checked={dataTypeFilter === type}
                    onChange={(e) => onDataTypeChange(e.target.value as DataTypeFilter)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type}</span>
                  {type === 'Historical' && (
                    <span className="ml-2 w-3 h-3 bg-blue-500 rounded-full"></span>
                  )}
                  {type === 'Predicted' && (
                    <span className="ml-2 w-3 h-3 bg-amber-500 rounded-full"></span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-gray-600 mr-2" />
              <label className="text-sm font-medium text-gray-900">
                Date Range
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formatDateForInput(dateRange.start)}
                  onChange={handleStartDateChange}
                  min={formatDateForInput(minDate)}
                  max={formatDateForInput(maxDate)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={formatDateForInput(dateRange.end)}
                  onChange={handleEndDateChange}
                  min={formatDateForInput(minDate)}
                  max={formatDateForInput(maxDate)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-blue-500 mr-3"></div>
                <span className="text-gray-600">Historical Data</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-amber-500 border-dashed border-t-2 border-amber-500 mr-3"></div>
                <span className="text-gray-600">Predicted Data</span>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Dashboard Info</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
              This dashboard analyzes patient health trends using historical data (past 180 days) 
              and predicted data (next 90 days). Use the filters above to explore different 
              metrics and time periods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};