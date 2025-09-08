import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MetricCard } from './components/MetricCard';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { DistributionCharts } from './components/DistributionCharts';
import { InsightsPanel } from './components/InsightsPanel';
import { loadCSVData } from './utils/csvParser';
import { generateInsights, getAttributeLabel } from './utils/insights';
import { CombinedData, AttributeKey, DataTypeFilter } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeKey>('StressIndex');
  const [dataTypeFilter, setDataTypeFilter] = useState<DataTypeFilter>('Both');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const csvData = await loadCSVData();
        setData(csvData);
        
        // Set initial date range based on data
        if (csvData.length > 0) {
          const dates = csvData.map(d => d.datetime);
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          setDateRange({ start: minDate, end: maxDate });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get available attributes from data
  const availableAttributes = useMemo(() => {
    const attributes: AttributeKey[] = [];
    if (data.some(d => d.StressIndex !== undefined)) attributes.push('StressIndex');
    if (data.some(d => d.HeartRate !== undefined)) attributes.push('HeartRate');
    if (data.some(d => d.SystolicBP !== undefined)) attributes.push('SystolicBP');
    if (data.some(d => d.DiastolicBP !== undefined)) attributes.push('DiastolicBP');
    return attributes;
  }, [data]);

  // Filter data based on current selections
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const dateInRange = d.datetime >= dateRange.start && d.datetime <= dateRange.end;
      const hasAttribute = d[selectedAttribute] !== undefined && d[selectedAttribute] !== null;
      const matchesDataType = dataTypeFilter === 'Both' || d.dataType === dataTypeFilter;
      
      return dateInRange && hasAttribute && matchesDataType;
    });
  }, [data, dateRange, selectedAttribute, dataTypeFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        average: 0,
        max: 0,
        min: 0,
        totalRecords: 0,
        historicalRecords: 0,
        predictedRecords: 0,
        dateSpan: 0,
        changePercent: undefined
      };
    }

    const values = filteredData.map(d => d[selectedAttribute] as number);
    const historicalData = filteredData.filter(d => d.dataType === 'Historical');
    const predictedData = filteredData.filter(d => d.dataType === 'Predicted');
    
    let changePercent: number | undefined;
    if (historicalData.length > 0 && predictedData.length > 0) {
      const historicalMean = historicalData.reduce((sum, d) => sum + (d[selectedAttribute] as number), 0) / historicalData.length;
      const predictedMean = predictedData.reduce((sum, d) => sum + (d[selectedAttribute] as number), 0) / predictedData.length;
      changePercent = ((predictedMean - historicalMean) / historicalMean) * 100;
    }

    const dateSpan = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      totalRecords: filteredData.length,
      historicalRecords: historicalData.length,
      predictedRecords: predictedData.length,
      dateSpan,
      changePercent
    };
  }, [filteredData, selectedAttribute, dateRange]);

  // Generate insights
  const insights = useMemo(() => {
    return generateInsights(filteredData, selectedAttribute, dataTypeFilter);
  }, [filteredData, selectedAttribute, dataTypeFilter]);

  // Get min/max dates for date picker
  const { minDate, maxDate } = useMemo(() => {
    if (data.length === 0) {
      return { minDate: new Date(), maxDate: new Date() };
    }
    const dates = data.map(d => d.datetime);
    return {
      minDate: new Date(Math.min(...dates.map(d => d.getTime()))),
      maxDate: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        selectedAttribute={selectedAttribute}
        onAttributeChange={setSelectedAttribute}
        dataTypeFilter={dataTypeFilter}
        onDataTypeChange={setDataTypeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        availableAttributes={availableAttributes}
        minDate={minDate}
        maxDate={maxDate}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Patient Health Trend Analysis
            </h1>
            <p className="text-gray-600">
              Interactive dashboard analyzing {getAttributeLabel(selectedAttribute).toLowerCase()} trends 
              from {dateRange.start.toLocaleDateString()} to {dateRange.end.toLocaleDateString()}
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title={`Average ${getAttributeLabel(selectedAttribute)}`}
              value={metrics.average}
              change={metrics.changePercent}
              changeLabel="vs predicted"
            />
            <MetricCard
              title={`Max ${getAttributeLabel(selectedAttribute)}`}
              value={metrics.max}
              changeLabel={`Min: ${metrics.min.toFixed(2)}`}
            />
            <MetricCard
              title="Total Records"
              value={metrics.totalRecords}
              changeLabel={`${metrics.historicalRecords} historical`}
            />
            <MetricCard
              title="Date Span"
              value={metrics.dateSpan}
              changeLabel="days"
            />
          </div>

          {/* Main Chart */}
          <div className="mb-8">
            <TimeSeriesChart
              data={filteredData}
              attribute={selectedAttribute}
              dataTypeFilter={dataTypeFilter}
            />
          </div>

          {/* Distribution Charts */}
          <div className="mb-8">
            <DistributionCharts
              data={filteredData}
              attribute={selectedAttribute}
              dataTypeFilter={dataTypeFilter}
            />
          </div>

          {/* Insights Panel */}
          <InsightsPanel
            insights={insights}
            attribute={getAttributeLabel(selectedAttribute)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;