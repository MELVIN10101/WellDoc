import Papa from 'papaparse';
import { PatientData, CombinedData } from '../types';

export const parseCSV = (csvText: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      },
      error: (error) => reject(error)
    });
  });
};

export const processPatientData = (rawData: any[], dataType: 'Historical' | 'Predicted'): CombinedData[] => {
  return rawData.map((row, index) => {
    // Try to parse datetime from various possible column names
    let datetime: Date;
    
    if (row.datetime) {
      datetime = new Date(row.datetime);
    } else if (row.date) {
      datetime = new Date(row.date);
    } else if (row.timestamp) {
      datetime = new Date(row.timestamp);
    } else {
      // Create a synthetic datetime if none exists
      const baseDate = dataType === 'Historical' 
        ? new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)) // 180 days ago
        : new Date(); // Start from now for predictions
      datetime = new Date(baseDate.getTime() + (index * 60 * 60 * 1000)); // Add hours
    }

    // Ensure datetime is valid
    if (isNaN(datetime.getTime())) {
      const baseDate = dataType === 'Historical' 
        ? new Date(Date.now() - (180 * 24 * 60 * 60 * 1000))
        : new Date();
      datetime = new Date(baseDate.getTime() + (index * 60 * 60 * 1000));
    }

    return {
      ...row,
      datetime,
      dataType,
      StressIndex: typeof row.StressIndex === 'number' ? row.StressIndex : undefined,
      HeartRate: typeof row.HeartRate === 'number' ? row.HeartRate : undefined,
      SystolicBP: typeof row.SystolicBP === 'number' ? row.SystolicBP : undefined,
      DiastolicBP: typeof row.DiastolicBP === 'number' ? row.DiastolicBP : undefined,
    };
  });
};

export const loadCSVData = async (): Promise<CombinedData[]> => {
  try {
    // Try to load the actual CSV files
    const [historicalResponse, predictedResponse] = await Promise.all([
      fetch('/data/patient_180days_hourly.csv'),
      fetch('/data/Prediction_with_StressIndex.csv')
    ]);

    if (historicalResponse.ok && predictedResponse.ok) {
      const [historicalText, predictedText] = await Promise.all([
        historicalResponse.text(),
        predictedResponse.text()
      ]);

      const [historicalRaw, predictedRaw] = await Promise.all([
        parseCSV(historicalText),
        parseCSV(predictedText)
      ]);

      const historicalData = processPatientData(historicalRaw, 'Historical');
      const predictedData = processPatientData(predictedRaw, 'Predicted');

      return [...historicalData, ...predictedData].sort((a, b) => 
        a.datetime.getTime() - b.datetime.getTime()
      );
    }
  } catch (error) {
    console.warn('Could not load CSV files, generating sample data:', error);
  }

  // Generate sample data if CSV files are not available
  return generateSampleData();
};

const generateSampleData = (): CombinedData[] => {
  const data: CombinedData[] = [];
  const now = new Date();
  
  // Generate historical data (past 180 days, hourly)
  for (let i = 180 * 24; i >= 0; i--) {
    const datetime = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const baseStress = 45 + Math.sin(i / 100) * 10;
    const baseHR = 72 + Math.sin(i / 80) * 8;
    const baseSystolic = 118 + Math.sin(i / 120) * 12;
    const baseDiastolic = 78 + Math.sin(i / 100) * 8;
    
    data.push({
      datetime,
      dataType: 'Historical',
      StressIndex: Math.max(0, Math.min(100, baseStress + (Math.random() - 0.5) * 15)),
      HeartRate: Math.max(50, Math.min(120, baseHR + (Math.random() - 0.5) * 12)),
      SystolicBP: Math.max(90, Math.min(180, baseSystolic + (Math.random() - 0.5) * 20)),
      DiastolicBP: Math.max(60, Math.min(120, baseDiastolic + (Math.random() - 0.5) * 15)),
    });
  }
  
  // Generate predicted data (next 90 days, hourly)
  for (let i = 1; i <= 90 * 24; i++) {
    const datetime = new Date(now.getTime() + (i * 60 * 60 * 1000));
    const baseStress = 48 + Math.sin(i / 100) * 8;
    const baseHR = 74 + Math.sin(i / 80) * 6;
    const baseSystolic = 120 + Math.sin(i / 120) * 10;
    const baseDiastolic = 80 + Math.sin(i / 100) * 6;
    
    data.push({
      datetime,
      dataType: 'Predicted',
      StressIndex: Math.max(0, Math.min(100, baseStress + (Math.random() - 0.5) * 12)),
      HeartRate: Math.max(50, Math.min(120, baseHR + (Math.random() - 0.5) * 10)),
      SystolicBP: Math.max(90, Math.min(180, baseSystolic + (Math.random() - 0.5) * 18)),
      DiastolicBP: Math.max(60, Math.min(120, baseDiastolic + (Math.random() - 0.5) * 12)),
    });
  }
  
  return data;
};