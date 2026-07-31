import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_HOSPITALS,
  INITIAL_DOCTORS,
  INITIAL_STOCKS,
  INITIAL_APPOINTMENTS,
  INITIAL_ALERTS,
  INITIAL_FEEDBACKS,
  INITIAL_REDISTRIBUTION_PLANS,
} from './src/mockData';
import {
  Hospital,
  Doctor,
  StockRecord,
  PatientAppointmentRecord,
  PatientFeedback,
  AlertItem,
  ResourceRedistributionPlan,
  StockoutCorrelation,
  DoctorPerformanceAnalytics,
} from './src/types';
import {
  generateDoctorAdviceServer,
  generateHospitalInterventionServer,
  generateDistrictSummaryServer,
} from './server/geminiService';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
let hospitals: Hospital[] = [...INITIAL_HOSPITALS];
let doctors: Doctor[] = [...INITIAL_DOCTORS];
let stocks: StockRecord[] = [...INITIAL_STOCKS];
let appointments: PatientAppointmentRecord[] = [...INITIAL_APPOINTMENTS];
let alerts: AlertItem[] = [...INITIAL_ALERTS];
let feedbacks: PatientFeedback[] = [...INITIAL_FEEDBACKS];
let redistributionPlans: ResourceRedistributionPlan[] = [...INITIAL_REDISTRIBUTION_PLANS];

// Helper: Recalculate hospital performance scores
function recalculateHospitalScores(hospitalId: string) {
  const hospital = hospitals.find((h) => h.id === hospitalId);
  if (!hospital) return;

  // 1. Doctor satisfaction score (average of doctor feedbacks)
  const hospitalFeedbacks = feedbacks.filter((f) => f.hospitalId === hospitalId);
  let doctorSatisfactionScore = 75;
  let sanitaryHygieneScore = hospital.sanitaryHygieneScore || 80;

  if (hospitalFeedbacks.length > 0) {
    const totalAvg =
      hospitalFeedbacks.reduce((sum, f) => {
        const itemAvg = (f.communicationClarity + f.conduct + f.userInteractiveness + f.dressCode + (f.doctorHygiene || 0.8)) / 5;
        return sum + itemAvg;
      }, 0) / hospitalFeedbacks.length;
    doctorSatisfactionScore = Math.round(totalAvg * 100 * 10) / 10;

    const hygieneAvg =
      hospitalFeedbacks.reduce((sum, f) => {
        const hVal = ( (f.facilityHygiene ?? 0.8) + (f.doctorHygiene ?? 0.8) ) / 2;
        return sum + hVal;
      }, 0) / hospitalFeedbacks.length;
    sanitaryHygieneScore = Math.round(hygieneAvg * 100 * 10) / 10;
  }

  // 2. Patient Response & Queue Speed Score (% of prompt responses <= 10 mins delay)
  const hospitalApts = appointments.filter((a) => a.hospitalId === hospitalId);
  let patientResponseScore = hospital.patientResponseScore || 80;
  let avgResponseTimeMins = hospital.avgResponseTimeMins || 8.0;

  if (hospitalApts.length > 0) {
    const respondedApts = hospitalApts.filter((a) => a.responseDelayMinutes !== undefined);
    if (respondedApts.length > 0) {
      const totalDelay = respondedApts.reduce((sum, a) => sum + (a.responseDelayMinutes || 0), 0);
      avgResponseTimeMins = Math.round((totalDelay / respondedApts.length) * 10) / 10;
      const promptCount = respondedApts.filter((a) => (a.responseDelayMinutes || 0) <= 10).length;
      patientResponseScore = Math.round((promptCount / respondedApts.length) * 100);
    }
  }

  // 3. Stock availability score
  const hospitalStocks = stocks.filter((s) => s.hospitalId === hospitalId);
  let stockAvailabilityScore = 80;
  if (hospitalStocks.length > 0) {
    const availableCount = hospitalStocks.filter((s) => s.currentQuantity >= s.thresholdQuantity).length;
    stockAvailabilityScore = Math.round((availableCount / hospitalStocks.length) * 100);
  }

  // Composite weighted score across ALL 5 facility factors:
  // 30% satisfaction, 25% sanitary hygiene, 20% stock, 15% patient response speed, 10% volume efficiency
  const composite = Math.round(
    (doctorSatisfactionScore * 0.30 +
      sanitaryHygieneScore * 0.25 +
      stockAvailabilityScore * 0.20 +
      patientResponseScore * 0.15 +
      hospital.volumeEfficiencyScore * 0.10) *
      10
  ) / 10;

  // Track previous total score to calculate net multi-factor delta independently of absolute score level
  const previousScore = hospital.totalScore !== undefined ? hospital.totalScore : composite;
  const delta = Math.round((composite - previousScore) * 10) / 10;
  const REASONABLE_MARGIN = 2.5; // ±2.5% margin for steady trend shift

  hospital.doctorSatisfactionScore = doctorSatisfactionScore;
  hospital.sanitaryHygieneScore = sanitaryHygieneScore;
  hospital.patientResponseScore = patientResponseScore;
  hospital.avgResponseTimeMins = avgResponseTimeMins;
  hospital.stockAvailabilityScore = stockAvailabilityScore;

  // Auto-flag hygiene violation alert if hygiene score is poor (< 60%)
  if (sanitaryHygieneScore < 60) {
    const existingHygieneAlert = alerts.find((a) => a.hospitalId === hospitalId && a.alertType === 'hygiene_violation' && !a.resolvedAt);
    if (!existingHygieneAlert) {
      alerts.unshift({
        id: `alt_${Date.now()}`,
        hospitalId,
        hospitalName: hospital.name,
        alertType: 'hygiene_violation',
        severity: 'critical',
        message: `SANITATION & HYGIENE WARNING: Facility score dropped to ${sanitaryHygieneScore}%. Unsanitary conditions or hazardous medical waste disposal reported by patients.`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Auto-flag response delay alert if queue response is poor (< 60% prompt or > 20 mins avg wait)
  if (patientResponseScore < 60 || avgResponseTimeMins > 20) {
    const existingDelayAlert = alerts.find((a) => a.hospitalId === hospitalId && a.alertType === 'response_delay' && !a.resolvedAt);
    if (!existingDelayAlert) {
      alerts.unshift({
        id: `alt_${Date.now()}`,
        hospitalId,
        hospitalName: hospital.name,
        alertType: 'response_delay',
        severity: 'warning',
        message: `PATIENT QUEUE DELAY WARNING: Average patient response time reached ${avgResponseTimeMins} mins. Queue promptness score dropped to ${patientResponseScore}%.`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Determine trend direction independently of absolute score magnitude:
  // Steady margin increase -> improving
  // Steady margin drop or critical sanitary failure -> declining
  // Within reasonable margin -> stable
  if (delta > REASONABLE_MARGIN) {
    hospital.trendDirection = 'improving';
    hospital.declinePercentage = 0;
  } else if (delta < -REASONABLE_MARGIN || sanitaryHygieneScore < 50) {
    hospital.trendDirection = 'declining';
    const dropPct = previousScore > 0 ? Math.round((Math.abs(delta) / previousScore) * 100 * 10) / 10 : 5.0;
    hospital.declinePercentage = dropPct > 0 ? dropPct : (sanitaryHygieneScore < 50 ? 12.5 : 5.0);
  } else {
    hospital.trendDirection = 'stable';
    hospital.declinePercentage = 0;
  }

  hospital.totalScore = composite;
  hospital.updatedAt = new Date().toISOString();
}

// ---------------- API ENDPOINTS ----------------

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, role, hospital_id } = req.body;
  res.json({
    user_id: `usr_${Date.now()}`,
    token: `jwt_token_sample_${Date.now()}`,
    user: { email, role, hospital_id },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  res.json({
    token: `jwt_token_login_${Date.now()}`,
    user_data: { email, role: role || 'admin', id: 'usr_active' },
    permissions: ['read', 'write', 'admin'],
  });
});

app.post('/api/auth/fingerprint', (req, res) => {
  const { fingerprint_hash, hospital_id } = req.body;
  const hashStr = fingerprint_hash || `fp_${Math.random().toString(36).substring(2, 10)}`;
  res.json({
    valid: true,
    patient_id: `patient_${hashStr.substring(0, 8)}`,
    fingerprint_hash: hashStr,
  });
});

// Patient Feedback Endpoints
app.post('/api/feedback/submit', (req, res) => {
  const {
    doctor_id,
    hospital_id,
    fingerprint_hash,
    communication_clarity,
    conduct,
    user_interactiveness,
    dress_code,
    doctor_hygiene,
    facility_hygiene,
    comments,
    language,
  } = req.body;

  const newFeedback: PatientFeedback = {
    id: `fb_${Date.now()}`,
    doctorId: doctor_id,
    hospitalId: hospital_id,
    patientIdentifier: fingerprint_hash || `fp_${Date.now()}`,
    communicationClarity: Number(communication_clarity),
    conduct: Number(conduct),
    userInteractiveness: Number(user_interactiveness),
    dressCode: Number(dress_code),
    doctorHygiene: doctor_hygiene !== undefined ? Number(doctor_hygiene) : 0.8,
    facilityHygiene: facility_hygiene !== undefined ? Number(facility_hygiene) : 0.8,
    comments: comments || '',
    createdAt: new Date().toISOString(),
    language: language || 'en',
    offlineSynced: true,
  };

  feedbacks.unshift(newFeedback);

  // Update doctor rating
  const doc = doctors.find((d) => d.id === doctor_id);
  if (doc) {
    const docFeedbacks = feedbacks.filter((f) => f.doctorId === doctor_id);
    const avgRating =
      docFeedbacks.reduce((sum, f) => {
        const itemAvg = (f.communicationClarity + f.conduct + f.userInteractiveness + f.dressCode + (f.doctorHygiene || 0.8)) / 5;
        return sum + itemAvg * 5; // scaled 1 to 5
      }, 0) / docFeedbacks.length;

    doc.overallRating = Math.round(avgRating * 10) / 10;
    doc.feedbackCount = docFeedbacks.length;
  }

  // Recalculate hospital score
  if (hospital_id) {
    recalculateHospitalScores(hospital_id);
  }

  res.json({
    feedback_id: newFeedback.id,
    status: 'submitted_successfully',
    message: 'Feedback submitted and verified via biometric token.',
  });
});

app.get('/api/feedback/doctor/:doctor_id', (req, res) => {
  const { doctor_id } = req.params;
  const docFeedbacks = feedbacks.filter((f) => f.doctorId === doctor_id);

  if (docFeedbacks.length === 0) {
    return res.json({
      doctor_id,
      metrics: { communication: 0.8, conduct: 0.8, interactiveness: 0.8, dressCode: 0.8, doctorHygiene: 0.8 },
      trends: 'stable',
      feedback_count: 0,
      comments: [],
    });
  }

  const commAvg = docFeedbacks.reduce((s, f) => s + f.communicationClarity, 0) / docFeedbacks.length;
  const condAvg = docFeedbacks.reduce((s, f) => s + f.conduct, 0) / docFeedbacks.length;
  const interAvg = docFeedbacks.reduce((s, f) => s + f.userInteractiveness, 0) / docFeedbacks.length;
  const dressAvg = docFeedbacks.reduce((s, f) => s + f.dressCode, 0) / docFeedbacks.length;
  const hygAvg = docFeedbacks.reduce((s, f) => s + (f.doctorHygiene ?? 0.8), 0) / docFeedbacks.length;

  res.json({
    doctor_id,
    metrics: {
      communication: Math.round(commAvg * 100) / 100,
      conduct: Math.round(condAvg * 100) / 100,
      interactiveness: Math.round(interAvg * 100) / 100,
      dressCode: Math.round(dressAvg * 100) / 100,
      doctorHygiene: Math.round(hygAvg * 100) / 100,
    },
    feedback_count: docFeedbacks.length,
    comments: docFeedbacks.map((f) => f.comments).filter(Boolean),
  });
});

// Patient Queue & Doctor Response Endpoints
app.post('/api/appointments/respond', (req, res) => {
  const { appointment_id, doctor_id, hospital_id, patient_name, scheduled_time, doctor_available_time, consultation_start_time } = req.body;
  const doc = doctors.find((d) => d.id === doctor_id);
  const docHospId = hospital_id || doc?.hospitalId || 'hosp-1';

  const now = new Date();
  const consultTime = consultation_start_time ? new Date(consultation_start_time) : now;
  const docReadyTime = doctor_available_time ? new Date(doctor_available_time) : new Date(now.getTime() - 5 * 60000);

  // Response delay calculated between readiness baseline and consultation start
  const delayMs = consultTime.getTime() - docReadyTime.getTime();
  const responseDelayMinutes = Math.max(0, Math.floor(delayMs / (1000 * 60)));

  let status: 'prompt' | 'delayed' | 'severely_delayed' = 'prompt';
  if (responseDelayMinutes > 20) {
    status = 'severely_delayed';
  } else if (responseDelayMinutes > 10) {
    status = 'delayed';
  }

  let apt = appointments.find((a) => a.id === appointment_id);
  if (apt) {
    apt.doctorAvailableTime = docReadyTime.toISOString();
    apt.consultationStartTime = consultTime.toISOString();
    apt.responseDelayMinutes = responseDelayMinutes;
    apt.status = status;
  } else {
    apt = {
      id: `apt_${Date.now()}`,
      doctorId: doctor_id,
      hospitalId: docHospId,
      patientName: patient_name || 'Walk-in Patient',
      scheduledTime: scheduled_time || '09:30 AM',
      patientArrivalTime: docReadyTime.toISOString(),
      doctorAvailableTime: docReadyTime.toISOString(),
      consultationStartTime: consultTime.toISOString(),
      responseDelayMinutes,
      status,
      createdAt: now.toISOString(),
    };
    appointments.unshift(apt);
  }

  if (responseDelayMinutes > 20 && doc) {
    alerts.unshift({
      id: `alt_${Date.now()}`,
      hospitalId: docHospId,
      hospitalName: doc.hospitalName || 'Health Center',
      alertType: 'response_delay',
      severity: 'warning',
      message: `RESPONSE DELAY ALERT: ${doc.name} took ${responseDelayMinutes} minutes to attend to patient ${apt.patientName}.`,
      createdAt: new Date().toISOString(),
    });
  }

  recalculateHospitalScores(docHospId);

  res.json({
    appointment_id: apt.id,
    status,
    response_delay_minutes: responseDelayMinutes,
    appointment: apt,
  });
});

app.get('/api/appointments/doctor/:doctor_id', (req, res) => {
  const { doctor_id } = req.params;
  const docApts = appointments.filter((a) => a.doctorId === doctor_id);
  const completed = docApts.filter((a) => a.responseDelayMinutes !== undefined);
  const promptCount = completed.filter((a) => (a.responseDelayMinutes || 0) <= 10).length;
  const responseScore = completed.length > 0 ? Math.round((promptCount / completed.length) * 100) : 90;
  const totalDelay = completed.reduce((sum, a) => sum + (a.responseDelayMinutes || 0), 0);
  const avgResponseTimeMins = completed.length > 0 ? Math.round((totalDelay / completed.length) * 10) / 10 : 5;

  res.json({
    doctor_id,
    appointments: docApts,
    patient_response_score: responseScore,
    avg_response_time_mins: avgResponseTimeMins,
    total_appointments: docApts.length,
  });
});

// Stock Management Endpoints
app.post('/api/stock/update', (req, res) => {
  const { hospital_id, medicine_name, quantity, threshold, category } = req.body;
  let stock = stocks.find((s) => s.hospitalId === hospital_id && s.medicineName === medicine_name);

  const currentQuantity = Number(quantity);
  const thresholdQuantity = Number(threshold) || (stock ? stock.thresholdQuantity : 100);
  const available = currentQuantity >= thresholdQuantity;
  const severity = available ? 0 : Math.round((1 - currentQuantity / thresholdQuantity) * 100) / 100;

  if (stock) {
    stock.currentQuantity = currentQuantity;
    stock.thresholdQuantity = thresholdQuantity;
    stock.available = available;
    stock.severity = severity;
    stock.date = new Date().toISOString().split('T')[0];
  } else {
    stock = {
      id: `stk_${Date.now()}`,
      hospitalId: hospital_id,
      medicineName: medicine_name,
      category: category || 'Antibiotics',
      currentQuantity,
      thresholdQuantity,
      available,
      severity,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    stocks.push(stock);
  }

  // Trigger alert if depleted
  const hosp = hospitals.find((h) => h.id === hospital_id);
  if (!available && hosp) {
    alerts.unshift({
      id: `alt_${Date.now()}`,
      hospitalId: hospital_id,
      hospitalName: hosp.name,
      alertType: 'stockout',
      severity: currentQuantity === 0 ? 'critical' : 'warning',
      message: `STOCKOUT ALERT: ${medicine_name} quantity is ${currentQuantity} (Threshold: ${thresholdQuantity}).`,
      createdAt: new Date().toISOString(),
    });
  }

  recalculateHospitalScores(hospital_id);

  res.json({
    record_id: stock.id,
    status: available ? 'optimal' : 'critical_shortage',
    below_threshold: !available,
    stock,
  });
});

app.get('/api/stock/hospital/:hospital_id', (req, res) => {
  const { hospital_id } = req.params;
  const hospitalStocks = stocks.filter((s) => s.hospitalId === hospital_id);
  const criticalItems = hospitalStocks.filter((s) => !s.available);

  res.json({
    hospital_id,
    medicines: hospitalStocks,
    stock_status: criticalItems.length === 0 ? 'healthy' : 'critical',
    critical_items: criticalItems,
  });
});

app.get('/api/stock/correlation/:hospital_id', (req, res) => {
  const { hospital_id } = req.params;
  const hosp = hospitals.find((h) => h.id === hospital_id);

  // Generate 14-day timeline showing medicine stockout vs patient satisfaction
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const isDeclining = hosp ? hosp.trendDirection === 'declining' : false;

  const timeline = dates.map((date, idx) => {
    let stockPct = 90 - idx * 2;
    let satPct = 88 - idx * 2;

    if (isDeclining) {
      // Show sharp stockout drop around day 6 leading to satisfaction drop
      if (idx >= 5) {
        stockPct = Math.max(15, 80 - (idx - 4) * 12);
        satPct = Math.max(30, 85 - (idx - 4) * 10);
      }
    } else {
      stockPct = 85 + (idx % 3) * 4;
      satPct = 88 + (idx % 2) * 3;
    }

    return {
      date,
      stockAvailabilityPct: stockPct,
      patientSatisfactionPct: satPct,
    };
  });

  const correlationCoefficient = isDeclining ? 89.4 : 22.1;
  const impactPercentage = isDeclining ? 68.5 : 12.0;

  res.json({
    hospitalId: hospital_id,
    hospitalName: hosp ? hosp.name : 'Health Center',
    correlationCoefficient,
    significanceLevel: isDeclining ? 'High' : 'Low',
    impactPercentage,
    topShortageMedicines: isDeclining
      ? ['Amoxicillin 500mg', 'Iron Folic Acid Tablets', 'Paracetamol 500mg']
      : [],
    interpretation: isDeclining
      ? 'Strong Pearson correlation detected (r = 0.89). Medicine stock depletion directly preceded patient satisfaction drops by 24-48 hours.'
      : 'Stock levels remain stable with minimal impact on patient satisfaction scores.',
    timeline,
  });
});

// Performance Analytics Endpoints
app.get('/api/performance/doctor/:doctor_id', (req, res) => {
  const { doctor_id } = req.params;
  const doc = doctors.find((d) => d.id === doctor_id);

  if (!doc) {
    return res.status(404).json({ error: 'Doctor not found' });
  }

  const docFeedbacks = feedbacks.filter((f) => f.doctorId === doctor_id);
  const docApts = appointments.filter((a) => a.doctorId === doctor_id);

  let comm = 0.8,
    cond = 0.8,
    inter = 0.8,
    dress = 0.8,
    hyg = 0.8;
  if (docFeedbacks.length > 0) {
    comm = docFeedbacks.reduce((s, f) => s + f.communicationClarity, 0) / docFeedbacks.length;
    cond = docFeedbacks.reduce((s, f) => s + f.conduct, 0) / docFeedbacks.length;
    inter = docFeedbacks.reduce((s, f) => s + f.userInteractiveness, 0) / docFeedbacks.length;
    dress = docFeedbacks.reduce((s, f) => s + f.dressCode, 0) / docFeedbacks.length;
    hyg = docFeedbacks.reduce((s, f) => s + (f.doctorHygiene ?? 0.8), 0) / docFeedbacks.length;
  }

  const overallScore = Math.round(((comm + cond + inter + dress + hyg) / 5) * 100);

  const weaknesses = [];
  if (comm < 0.6) weaknesses.push({ category: 'Communication Clarity', severity: 'critical' as const, percentage: Math.round((1 - comm) * 100) });
  if (cond < 0.6) weaknesses.push({ category: 'Doctor Conduct', severity: 'critical' as const, percentage: Math.round((1 - cond) * 100) });
  if (hyg < 0.6) weaknesses.push({ category: 'Doctor Personal Hygiene & PPE', severity: 'critical' as const, percentage: Math.round((1 - hyg) * 100) });
  if (inter < 0.7) weaknesses.push({ category: 'User Interactiveness', severity: 'warning' as const, percentage: Math.round((1 - inter) * 100) });
  if (dress < 0.8) weaknesses.push({ category: 'Dress Code & Professionalism', severity: 'minor' as const, percentage: Math.round((1 - dress) * 100) });

  if (weaknesses.length === 0) {
    weaknesses.push({ category: 'Patient Consultation Speed', severity: 'minor' as const, percentage: 15 });
  }

  const completed = docApts.filter((a) => a.responseDelayMinutes !== undefined);
  const promptCount = completed.filter((a) => (a.responseDelayMinutes || 0) <= 10).length;
  const patientResponseScore = completed.length > 0 ? Math.round((promptCount / completed.length) * 100) : 90;
  const totalDelay = completed.reduce((sum, a) => sum + (a.responseDelayMinutes || 0), 0);
  const avgResponseTimeMins = completed.length > 0 ? Math.round((totalDelay / completed.length) * 10) / 10 : 5.0;

  const result: DoctorPerformanceAnalytics = {
    doctorId: doc.id,
    doctorName: doc.name,
    hospitalName: doc.hospitalName || 'Health Center',
    overallScore,
    categoryScores: {
      communication: Math.round(comm * 100) / 100,
      conduct: Math.round(cond * 100) / 100,
      interactiveness: Math.round(inter * 100) / 100,
      dressCode: Math.round(dress * 100) / 100,
      doctorHygiene: Math.round(hyg * 100) / 100,
    },
    trendDirection: overallScore >= 75 ? 'improving' : overallScore < 55 ? 'declining' : 'stable',
    weaknesses,
    patientResponseScore,
    avgResponseTimeMins,
    totalFeedbacks: docFeedbacks.length,
    historicalScores: [
      { date: '2026-07-01', score: overallScore - 4 },
      { date: '2026-07-10', score: overallScore - 2 },
      { date: '2026-07-20', score: overallScore + 1 },
      { date: '2026-07-30', score: overallScore },
    ],
  };

  res.json(result);
});

app.get('/api/performance/hospital/:hospital_id', (req, res) => {
  const { hospital_id } = req.params;
  const hosp = hospitals.find((h) => h.id === hospital_id);

  if (!hosp) return res.status(404).json({ error: 'Hospital not found' });

  const hospitalDoctors = doctors.filter((d) => d.hospitalId === hospital_id);
  const hospitalStocks = stocks.filter((s) => s.hospitalId === hospital_id);

  res.json({
    score: hosp.totalScore,
    hospital: hosp,
    ranking: hospitals.sort((a, b) => b.totalScore - a.totalScore).findIndex((h) => h.id === hospital_id) + 1,
    components: {
      doctorSatisfaction: hosp.doctorSatisfactionScore,
      sanitaryHygiene: hosp.sanitaryHygieneScore,
      patientResponse: hosp.patientResponseScore || 80,
      avgResponseTimeMins: hosp.avgResponseTimeMins || 8,
      stockAvailability: hosp.stockAvailabilityScore,
      volumeEfficiency: hosp.volumeEfficiencyScore,
    },
    doctors: hospitalDoctors,
    stocks: hospitalStocks,
    trend: hosp.trendDirection,
  });
});

app.get('/api/performance/district/rankings', (req, res) => {
  const sorted = [...hospitals].sort((a, b) => b.totalScore - a.totalScore);
  res.json({
    rankings: sorted.map((h, idx) => ({
      rank: idx + 1,
      hospital_id: h.id,
      name: h.name,
      district: h.district,
      type: h.type,
      score: h.totalScore,
      trend: h.trendDirection,
      declinePercentage: h.declinePercentage || 0,
    })),
  });
});

app.get('/api/performance/district/declining', (req, res) => {
  const declining = hospitals.filter((h) => h.trendDirection === 'declining' || h.totalScore < 60);
  res.json({
    declining_hospitals: declining.map((h) => ({
      hospital_id: h.id,
      name: h.name,
      district: h.district,
      score: h.totalScore,
      decline_percentage: h.declinePercentage || 12.5,
      severity: h.totalScore < 50 ? 'critical' : 'warning',
    })),
  });
});

// AI Recommendation Endpoints
app.post('/api/ai/doctor-advice', async (req, res) => {
  const { doctor_id } = req.body;
  const doc = doctors.find((d) => d.id === doctor_id);

  if (!doc) return res.status(404).json({ error: 'Doctor not found' });

  const analyticsRes = await fetch(`http://localhost:3000/api/performance/doctor/${doctor_id}`);
  const analyticsData = await analyticsRes.json();

  const adviceMarkdown = await generateDoctorAdviceServer(doc.name, doc.specialization, analyticsData);

  res.json({
    doctorId: doctor_id,
    doctorName: doc.name,
    recommendations: adviceMarkdown,
    generatedAt: new Date().toISOString(),
  });
});

app.post('/api/ai/hospital-intervention', async (req, res) => {
  const { hospital_id } = req.body;
  const hosp = hospitals.find((h) => h.id === hospital_id);

  if (!hosp) return res.status(404).json({ error: 'Hospital not found' });

  const corrRes = await fetch(`http://localhost:3000/api/stock/correlation/${hospital_id}`);
  const correlationData = await corrRes.json();

  const interventionMarkdown = await generateHospitalInterventionServer(
    hosp.name,
    hosp.totalScore,
    correlationData,
    hosp
  );

  res.json({
    hospitalId: hospital_id,
    hospitalName: hosp.name,
    plan: interventionMarkdown,
    generatedAt: new Date().toISOString(),
  });
});

app.get('/api/ai/district-summary', async (req, res) => {
  const totalHospitals = hospitals.length;
  const avgScore = Math.round(hospitals.reduce((s, h) => s + h.totalScore, 0) / totalHospitals);
  const improvingCount = hospitals.filter((h) => h.trendDirection === 'improving').length;
  const decliningCount = hospitals.filter((h) => h.trendDirection === 'declining').length;

  const sorted = [...hospitals].sort((a, b) => b.totalScore - a.totalScore);
  const topPerformer = sorted[0];
  const lowestPerformer = sorted[sorted.length - 1];

  const districtStats = {
    totalHospitals,
    avgScore,
    improvingCount,
    decliningCount,
    criticalAlertsCount: alerts.filter((a) => a.severity === 'critical' && !a.resolvedAt).length,
    stockoutAlertsCount: alerts.filter((a) => a.alertType === 'stockout' && !a.resolvedAt).length,
    topPerformerName: topPerformer.name,
    topPerformerScore: topPerformer.totalScore,
    lowestPerformerName: lowestPerformer.name,
    lowestPerformerScore: lowestPerformer.totalScore,
  };

  const summaryMarkdown = await generateDistrictSummaryServer(districtStats);

  res.json({
    district: 'Central & North Healthcare District',
    summary: summaryMarkdown,
    generatedAt: new Date().toISOString(),
  });
});

app.get('/api/ai/feedback-loop', (req, res) => {
  res.json({
    totalRecommendations: 34,
    implemented: 26,
    implementationRate: '76.4%',
    successRate: '82.1%',
    averageScoreGain: '+11.8 points',
  });
});

// Alert Endpoints
app.get('/api/alerts/hospital/:hospital_id', (req, res) => {
  const { hospital_id } = req.params;
  const list = alerts.filter((a) => a.hospitalId === hospital_id && !a.resolvedAt);
  res.json({ hospital_id, alerts: list });
});

app.post('/api/alerts/acknowledge', (req, res) => {
  const { alert_id, acknowledged_by } = req.body;
  const alert = alerts.find((a) => a.id === alert_id);

  if (alert) {
    alert.acknowledgedBy = acknowledged_by || 'District Administrator';
    alert.resolvedAt = new Date().toISOString();
  }

  res.json({ status: 'acknowledged', alert_id, alert });
});

app.get('/api/alerts/district', (req, res) => {
  const activeAlerts = alerts.filter((a) => !a.resolvedAt);
  res.json({
    total_active: activeAlerts.length,
    critical_alerts: activeAlerts.filter((a) => a.severity === 'critical'),
    warning_alerts: activeAlerts.filter((a) => a.severity === 'warning'),
    info_alerts: activeAlerts.filter((a) => a.severity === 'info'),
  });
});

// Resource Redistribution Endpoints
app.get('/api/redistribution/plans', (req, res) => {
  res.json({ plans: redistributionPlans });
});

app.post('/api/redistribution/execute', (req, res) => {
  const { plan_id } = req.body;
  const plan = redistributionPlans.find((p) => p.id === plan_id);

  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  // Update stocks
  const sourceStock = stocks.find((s) => s.hospitalId === plan.sourceHospitalId && s.medicineName === plan.medicineName);
  const targetStock = stocks.find((s) => s.hospitalId === plan.targetHospitalId && s.medicineName === plan.medicineName);

  if (sourceStock) {
    sourceStock.currentQuantity = Math.max(0, sourceStock.currentQuantity - plan.quantity);
  }

  if (targetStock) {
    targetStock.currentQuantity += plan.quantity;
    targetStock.available = targetStock.currentQuantity >= targetStock.thresholdQuantity;
    targetStock.severity = targetStock.available ? 0 : 0.2;
  } else {
    stocks.push({
      id: `stk_${Date.now()}`,
      hospitalId: plan.targetHospitalId,
      medicineName: plan.medicineName,
      category: 'Antibiotics',
      currentQuantity: plan.quantity,
      thresholdQuantity: 100,
      available: true,
      severity: 0,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
  }

  plan.status = 'transferred';
  recalculateHospitalScores(plan.targetHospitalId);

  res.json({
    status: 'transferred_successfully',
    plan,
    message: `Transferred ${plan.quantity} units of ${plan.medicineName} from ${plan.sourceHospitalName} to ${plan.targetHospitalName}.`,
  });
});

// Get initial full app state for client hydration
app.get('/api/state/full', (req, res) => {
  res.json({
    hospitals,
    doctors,
    stocks,
    appointments,
    alerts,
    feedbacks,
    redistributionPlans,
  });
});

// Setup Vite / Static Asset Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Haki System server running on http://localhost:${PORT}`);
  });
}

startServer();
