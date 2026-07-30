import {
  Hospital,
  Doctor,
  StockRecord,
  AttendanceRecord,
  PatientFeedback,
  AlertItem,
  ResourceRedistributionPlan,
  StockoutCorrelation,
  DoctorPerformanceAnalytics,
} from '../types';

export const api = {
  // Full State
  async getFullState() {
    const res = await fetch('/api/state/full');
    return res.json() as Promise<{
      hospitals: Hospital[];
      doctors: Doctor[];
      stocks: StockRecord[];
      attendanceRecords: AttendanceRecord[];
      alerts: AlertItem[];
      feedbacks: PatientFeedback[];
      redistributionPlans: ResourceRedistributionPlan[];
    }>;
  },

  // Patient Feedback
  async submitFeedback(data: {
    doctor_id: string;
    hospital_id: string;
    fingerprint_hash?: string;
    communication_clarity: number;
    conduct: number;
    user_interactiveness: number;
    dress_code: number;
    comments?: string;
    language?: string;
  }) {
    const res = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Doctor Attendance Clock-In
  async clockInAttendance(data: { doctor_id: string; hospital_id: string; first_patient_contact_time?: string }) {
    const res = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Stock update
  async updateStock(data: { hospital_id: string; medicine_name: string; quantity: number; threshold: number; category?: string }) {
    const res = await fetch('/api/stock/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Stockout Correlation
  async getStockoutCorrelation(hospitalId: string) {
    const res = await fetch(`/api/stock/correlation/${hospitalId}`);
    return res.json() as Promise<StockoutCorrelation>;
  },

  // Doctor Performance
  async getDoctorPerformance(doctorId: string) {
    const res = await fetch(`/api/performance/doctor/${doctorId}`);
    return res.json() as Promise<DoctorPerformanceAnalytics>;
  },

  // AI Doctor Advice
  async getAIDoctorAdvice(doctorId: string) {
    const res = await fetch('/api/ai/doctor-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: doctorId }),
    });
    return res.json() as Promise<{ doctorId: string; doctorName: string; recommendations: string; generatedAt: string }>;
  },

  // AI Hospital Intervention
  async getAIHospitalIntervention(hospitalId: string) {
    const res = await fetch('/api/ai/hospital-intervention', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital_id: hospitalId }),
    });
    return res.json() as Promise<{ hospitalId: string; hospitalName: string; plan: string; generatedAt: string }>;
  },

  // AI District Executive Summary
  async getAIDistrictSummary() {
    const res = await fetch('/api/ai/district-summary');
    return res.json() as Promise<{ district: string; summary: string; generatedAt: string }>;
  },

  // Alerts
  async acknowledgeAlert(alertId: string, acknowledgedBy?: string) {
    const res = await fetch('/api/alerts/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_id: alertId, acknowledged_by: acknowledgedBy }),
    });
    return res.json();
  },

  // Execute Resource Redistribution Transfer
  async executeRedistribution(planId: string) {
    const res = await fetch('/api/redistribution/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
    });
    return res.json();
  },
};
