export type HospitalType = 'PHC' | 'CHC';

export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface Hospital {
  id: string;
  name: string;
  district: string;
  type: HospitalType;
  capacity: number;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  totalScore: number;
  doctorSatisfactionScore: number;
  patientResponseScore: number; // Replaces attendanceScore: Patient queue response & promptness score (0-100%)
  avgResponseTimeMins?: number; // Avg time to respond once both patient & doctor are ready
  stockAvailabilityScore: number;
  sanitaryHygieneScore: number;
  volumeEfficiencyScore: number;
  trendDirection: TrendDirection;
  declinePercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  hospitalName?: string;
  name: string;
  specialization: string;
  employeeId: string;
  contact: string;
  shiftStartTime: string; // e.g. "08:00"
  overallRating?: number;
  feedbackCount?: number;
  createdAt: string;
}

export interface PatientFeedback {
  id: string;
  doctorId: string;
  hospitalId: string;
  patientIdentifier: string; // hashed fingerprint or token
  communicationClarity: number; // 0-1 or 1-5 scale
  conduct: number;
  userInteractiveness: number;
  dressCode: number;
  doctorHygiene?: number; // 0-1 scale (hand sanitization, gloves, personal cleanliness)
  facilityHygiene?: number; // 0-1 scale (general hospital hygiene, waste disposal, clean wards)
  comments?: string;
  createdAt: string;
  language?: string;
  offlineSynced?: boolean;
}

export interface PatientAppointmentRecord {
  id: string;
  doctorId: string;
  hospitalId: string;
  patientName: string;
  scheduledTime: string; // e.g. "09:30" or ISO string
  patientArrivalTime: string; // ISO string when patient checked in
  doctorAvailableTime: string; // ISO string when doctor marked free
  consultationStartTime?: string; // ISO string when doctor attended patient
  responseDelayMinutes?: number; // Minutes waited after readiness baseline
  status: 'scheduled' | 'in_progress' | 'completed' | 'prompt' | 'delayed' | 'severely_delayed';
  createdAt: string;
}

export interface StockRecord {
  id: string;
  hospitalId: string;
  medicineName: string;
  category: 'Antibiotics' | 'Vaccines' | 'Analgesics' | 'Maternal Care' | 'Chronic Care' | 'Emergency';
  currentQuantity: number;
  thresholdQuantity: number;
  available: boolean;
  severity: number; // 0 to 1
  date: string;
  createdAt: string;
}

export interface StockoutCorrelation {
  hospitalId: string;
  hospitalName: string;
  correlationCoefficient: number; // 0 - 100%
  significanceLevel: 'High' | 'Moderate' | 'Low';
  impactPercentage: number;
  topShortageMedicines: string[];
  interpretation: string;
  timeline: {
    date: string;
    stockAvailabilityPct: number;
    patientSatisfactionPct: number;
  }[];
}

export interface AIRecommendation {
  id: string;
  targetId: string;
  targetType: 'doctor' | 'hospital';
  recommendationType: 'individual' | 'systemic';
  content: string;
  category: 'performance' | 'stock' | 'response_time' | 'communication';
  generatedAt: string;
  implemented: boolean;
  effectivenessScore?: number;
}

export interface AlertItem {
  id: string;
  hospitalId: string;
  hospitalName: string;
  alertType: 'stockout' | 'declining_performance' | 'response_delay' | 'hygiene_violation';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  acknowledgedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DoctorPerformanceAnalytics {
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  overallScore: number;
  categoryScores: {
    communication: number;
    conduct: number;
    interactiveness: number;
    dressCode: number;
    doctorHygiene: number;
  };
  trendDirection: TrendDirection;
  weaknesses: { category: string; severity: 'critical' | 'warning' | 'minor'; percentage: number }[];
  patientResponseScore: number; // Replaces attendanceOnTimePct
  avgResponseTimeMins: number; // Average minutes waited once patient & doctor were ready
  totalFeedbacks: number;
  historicalScores: { date: string; score: number }[];
}

export interface ResourceRedistributionPlan {
  id: string;
  sourceHospitalId: string;
  sourceHospitalName: string;
  targetHospitalId: string;
  targetHospitalName: string;
  medicineName: string;
  quantity: number;
  urgency: 'critical' | 'high' | 'medium';
  reason: string;
  status: 'recommended' | 'approved' | 'transferred';
}

export type LanguageCode = 'en' | 'sw';
