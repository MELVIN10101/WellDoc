import { CombinedData, InsightData, AttributeKey, DataTypeFilter } from '../types';

export const generateInsights = (
  data: CombinedData[],
  attribute: AttributeKey,
  dataTypeFilter: DataTypeFilter
): InsightData[] => {
  const insights: InsightData[] = [];
  
  if (data.length === 0) return insights;

  // Filter data based on attribute availability
  const validData = data.filter(d => d[attribute] !== undefined && d[attribute] !== null);
  
  if (validData.length === 0) return insights;

  // Compare historical vs predicted if both are available
  if (dataTypeFilter === 'Both') {
    const historicalData = validData.filter(d => d.dataType === 'Historical');
    const predictedData = validData.filter(d => d.dataType === 'Predicted');
    
    if (historicalData.length > 0 && predictedData.length > 0) {
      const historicalMean = historicalData.reduce((sum, d) => sum + (d[attribute] as number), 0) / historicalData.length;
      const predictedMean = predictedData.reduce((sum, d) => sum + (d[attribute] as number), 0) / predictedData.length;
      
      const changePercent = ((predictedMean - historicalMean) / historicalMean) * 100;
      
      if (changePercent > 10) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          message: `${attribute} is projected to increase by ${changePercent.toFixed(1)}%. Preventive measures recommended.`
        });
      } else if (changePercent < -10) {
        insights.push({
          type: 'success',
          icon: '✅',
          message: `${attribute} shows signs of improvement with a projected decrease of ${Math.abs(changePercent).toFixed(1)}%.`
        });
      } else {
        insights.push({
          type: 'info',
          icon: 'ℹ️',
          message: `${attribute} remains stable with minor fluctuations (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%).`
        });
      }
    }
  }

  // Trend analysis
  if (validData.length > 1) {
    const values = validData.map(d => d[attribute] as number);
    const timePoints = validData.map((_, index) => index);
    
    // Simple linear regression to detect trend
    const n = values.length;
    const sumX = timePoints.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    if (Math.abs(slope) > 0.01) {
      if (slope > 0) {
        insights.push({
          type: 'info',
          icon: '📈',
          message: `Trend Analysis: ${attribute} shows an upward trend over the selected period.`
        });
      } else {
        insights.push({
          type: 'info',
          icon: '📉',
          message: `Trend Analysis: ${attribute} shows a downward trend over the selected period.`
        });
      }
    } else {
      insights.push({
        type: 'info',
        icon: '➡️',
        message: `Trend Analysis: ${attribute} shows a stable trend over the selected period.`
      });
    }
  }

  // Variability analysis
  const values = validData.map(d => d[attribute] as number);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;

  if (coefficientOfVariation > 20) {
    insights.push({
      type: 'warning',
      icon: '📊',
      message: `Variability: High variability detected in ${attribute} (CV: ${coefficientOfVariation.toFixed(1)}%). Consider monitoring more closely.`
    });
  } else if (coefficientOfVariation < 10) {
    insights.push({
      type: 'success',
      icon: '📊',
      message: `Variability: Low variability in ${attribute} (CV: ${coefficientOfVariation.toFixed(1)}%). Values are relatively consistent.`
    });
  } else {
    insights.push({
      type: 'info',
      icon: '📊',
      message: `Variability: Moderate variability in ${attribute} (CV: ${coefficientOfVariation.toFixed(1)}%).`
    });
  }

  // Outlier detection
  const q1 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers = values.filter(v => v < lowerBound || v > upperBound);
  
  if (outliers.length > 0) {
    insights.push({
      type: 'warning',
      icon: '🎯',
      message: `Outliers: ${outliers.length} outlier value(s) detected in ${attribute}. Review for data quality or significant events.`
    });
  }

  return insights;
};

export const getAttributeLabel = (attribute: AttributeKey): string => {
  const labels: Record<AttributeKey, string> = {
    StressIndex: 'Stress Index',
    HeartRate: 'Heart Rate (BPM)',
    SystolicBP: 'Systolic Blood Pressure (mmHg)',
    DiastolicBP: 'Diastolic Blood Pressure (mmHg)'
  };
  return labels[attribute] || attribute;
};

export const getAttributeUnit = (attribute: AttributeKey): string => {
  const units: Record<AttributeKey, string> = {
    StressIndex: '',
    HeartRate: 'BPM',
    SystolicBP: 'mmHg',
    DiastolicBP: 'mmHg'
  };
  return units[attribute] || '';
};