import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BoxPlot
} from 'recharts';
import { CombinedData, AttributeKey, DataTypeFilter } from '../types';
import { getAttributeLabel, getAttributeUnit } from '../utils/insights';

interface DistributionChartsProps {
  data: CombinedData[];
  attribute: AttributeKey;
  dataTypeFilter: DataTypeFilter;
}

export const DistributionCharts: React.FC<DistributionChartsProps> = ({
  data,
  attribute,
  dataTypeFilter
}) => {
  // Filter and prepare data
  const filteredData = data
    .filter(d => {
      if (dataTypeFilter === 'Both') return true;
      return d.dataType === dataTypeFilter;
    })
    .filter(d => d[attribute] !== undefined && d[attribute] !== null);

  // Create histogram data
  const createHistogramData = () => {
    const values = filteredData.map(d => d[attribute] as number);
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binWidth = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      midpoint: min + (i + 0.5) * binWidth,
      Historical: 0,
      Predicted: 0,
      total: 0
    }));

    filteredData.forEach(d => {
      const value = d[attribute] as number;
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex][d.dataType]++;
        bins[binIndex].total++;
      }
    });

    return bins;
  };

  // Create box plot data
  const createBoxPlotData = () => {
    const historicalValues = filteredData
      .filter(d => d.dataType === 'Historical')
      .map(d => d[attribute] as number)
      .sort((a, b) => a - b);
    
    const predictedValues = filteredData
      .filter(d => d.dataType === 'Predicted')
      .map(d => d[attribute] as number)
      .sort((a, b) => a - b);

    const getQuartiles = (values: number[]) => {
      if (values.length === 0) return null;
      
      const q1Index = Math.floor(values.length * 0.25);
      const q2Index = Math.floor(values.length * 0.5);
      const q3Index = Math.floor(values.length * 0.75);
      
      return {
        min: values[0],
        q1: values[q1Index],
        median: values[q2Index],
        q3: values[q3Index],
        max: values[values.length - 1],
        mean: values.reduce((a, b) => a + b, 0) / values.length
      };
    };

    const result = [];
    
    if (dataTypeFilter === 'Both' || dataTypeFilter === 'Historical') {
      const histStats = getQuartiles(historicalValues);
      if (histStats) {
        result.push({
          name: 'Historical',
          ...histStats
        });
      }
    }
    
    if (dataTypeFilter === 'Both' || dataTypeFilter === 'Predicted') {
      const predStats = getQuartiles(predictedValues);
      if (predStats) {
        result.push({
          name: 'Predicted',
          ...predStats
        });
      }
    }

    return result;
  };

  const histogramData = createHistogramData();
  const boxPlotData = createBoxPlotData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            Range: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.dataKey}:</span> {entry.value} records
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Histogram */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Distribution Histogram
          </h3>
          <p className="text-sm text-gray-600">
            Frequency distribution of {getAttributeLabel(attribute)} values
          </p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="range"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                label={{ 
                  value: 'Frequency', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {dataTypeFilter === 'Both' ? (
                <>
                  <Bar dataKey="Historical" fill="#3b82f6" name="Historical" />
                  <Bar dataKey="Predicted" fill="#f59e0b" name="Predicted" />
                </>
              ) : (
                <Bar 
                  dataKey="total" 
                  fill={dataTypeFilter === 'Historical' ? '#3b82f6' : '#f59e0b'} 
                  name={dataTypeFilter}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Box Plot Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Statistical Summary
          </h3>
          <p className="text-sm text-gray-600">
            Key statistics for {getAttributeLabel(attribute)}
          </p>
        </div>
        
        <div className="space-y-4">
          {boxPlotData.map((stats, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <div 
                  className={`w-3 h-3 rounded-full mr-2 ${
                    stats.name === 'Historical' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                />
                {stats.name} Data
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mean:</span>
                  <span className="font-medium ml-2">
                    {stats.mean.toFixed(2)} {getAttributeUnit(attribute)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Median:</span>
                  <span className="font-medium ml-2">
                    {stats.median.toFixed(2)} {getAttributeUnit(attribute)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Min:</span>
                  <span className="font-medium ml-2">
                    {stats.min.toFixed(2)} {getAttributeUnit(attribute)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Max:</span>
                  <span className="font-medium ml-2">
                    {stats.max.toFixed(2)} {getAttributeUnit(attribute)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Q1:</span>
                  <span className="font-medium ml-2">
                    {stats.q1.toFixed(2)} {getAttributeUnit(attribute)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Q3:</span>
                  <span className="font-medium ml-2">
                    {stats.q3.toFixed(2)} {getAttributeUnit(attribute)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};