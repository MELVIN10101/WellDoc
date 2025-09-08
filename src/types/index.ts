export interface PatientData {
  datetime: Date;
  StressIndex?: number;
  HeartRate?: number;
  SystolicBP?: number;
  DiastolicBP?: number;
  [key: string]: any;
}

export interface CombinedData extends PatientData {
  dataType: 'Historical' | 'Predicted';
}

export interface ChartData {
  datetime: string;
  value: number;
  dataType: 'Historical' | 'Predicted';
}

export interface InsightData {
  type: 'warning' | 'success' | 'info';
  message: string;
  icon: string;
}

export type DataTypeFilter = 'Both' | 'Historical' | 'Predicted';
export type AttributeKey = 'StressIndex' | 'HeartRate' | 'SystolicBP' | 'DiastolicBP';