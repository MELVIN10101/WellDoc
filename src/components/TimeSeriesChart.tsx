import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { CombinedData, AttributeKey, DataTypeFilter } from '../types';
import { getAttributeLabel, getAttributeUnit } from '../utils/insights';

interface TimeSeriesChartProps {
  data: CombinedData[];
  attribute: AttributeKey;
  dataTypeFilter: DataTypeFilter;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  attribute,
  dataTypeFilter
}) => {
  // Prepare chart data
  const chartData = data
    .filter(d => {
      if (dataTypeFilter === 'Both') return true;
      return d.dataType === dataTypeFilter;
    })
    .filter(d => d[attribute] !== undefined && d[attribute] !== null)
    .map(d => ({
      datetime: d.datetime.getTime(),
      dateLabel: format(d.datetime, 'MMM dd, HH:mm'),
      value: d[attribute] as number,
      dataType: d.dataType,
      Historical: d.dataType === 'Historical' ? d[attribute] as number : null,
      Predicted: d.dataType === 'Predicted' ? d[attribute] as number : null,
    }))
    .sort((a, b) => a.datetime - b.datetime);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {format(new Date(label), 'MMM dd, yyyy HH:mm')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.dataKey}:</span>{' '}
              {entry.value?.toFixed(2)} {getAttributeUnit(attribute)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const shouldShowBothLines = dataTypeFilter === 'Both' && 
    data.some(d => d.dataType === 'Historical') && 
    data.some(d => d.dataType === 'Predicted');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {getAttributeLabel(attribute)} Trend Analysis
        </h3>
        <p className="text-sm text-gray-600">
          Time series visualization showing {dataTypeFilter.toLowerCase()} data trends
        </p>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="datetime"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              label={{ 
                value: getAttributeUnit(attribute), 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {shouldShowBothLines ? (
              <>
                <Line
                  type="monotone"
                  dataKey="Historical"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  name="Historical Data"
                />
                <Line
                  type="monotone"
                  dataKey="Predicted"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                  name="Predicted Data"
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={dataTypeFilter === 'Historical' ? '#3b82f6' : '#f59e0b'}
                strokeWidth={2}
                strokeDasharray={dataTypeFilter === 'Predicted' ? '5 5' : '0'}
                dot={false}
                name={`${dataTypeFilter} Data`}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};