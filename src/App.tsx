import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PatientApp } from './components/PatientApp';
import {
  Hospital,
  Doctor,
  StockRecord,
  AttendanceRecord,
  AlertItem,
  PatientFeedback,
  ResourceRedistributionPlan,
  LanguageCode,
} from './types';
import { api } from './services/api';
import { INITIAL_HOSPITALS, INITIAL_DOCTORS, INITIAL_STOCKS, INITIAL_ATTENDANCE, INITIAL_ALERTS, INITIAL_FEEDBACKS, INITIAL_REDISTRIBUTION_PLANS } from './mockData';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'admin' | 'doctor' | 'patient'>('admin');
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Server state loaded via API
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [stocks, setStocks] = useState<StockRecord[]>(INITIAL_STOCKS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [feedbacks, setFeedbacks] = useState<PatientFeedback[]>(INITIAL_FEEDBACKS);
  const [redistributionPlans, setRedistributionPlans] = useState<ResourceRedistributionPlan[]>(INITIAL_REDISTRIBUTION_PLANS);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-1');

  // Fetch state on mount & state change
  const refreshData = async () => {
    try {
      const state = await api.getFullState();
      if (state.hospitals) setHospitals(state.hospitals);
      if (state.doctors) setDoctors(state.doctors);
      if (state.stocks) setStocks(state.stocks);
      if (state.attendanceRecords) setAttendanceRecords(state.attendanceRecords);
      if (state.alerts) setAlerts(state.alerts);
      if (state.feedbacks) setFeedbacks(state.feedbacks);
      if (state.redistributionPlans) setRedistributionPlans(state.redistributionPlans);
    } catch (err) {
      console.warn('Backend API endpoint offline or initializing. Using hydrated state.');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activeAlertCount = alerts.filter((a) => !a.resolvedAt).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-16">
      {/* Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        language={language}
        onLanguageChange={setLanguage}
        hospitals={hospitals}
        selectedHospitalId={selectedHospitalId}
        onSelectHospital={setSelectedHospitalId}
        activeAlertCount={activeAlertCount}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentRole === 'admin' && (
          <AdminDashboard
            hospitals={hospitals}
            doctors={doctors}
            stocks={stocks}
            alerts={alerts}
            redistributionPlans={redistributionPlans}
            language={language}
            onRefreshData={refreshData}
          />
        )}

        {currentRole === 'doctor' && (
          <DoctorDashboard
            doctors={doctors}
            hospitals={hospitals}
            selectedHospitalId={selectedHospitalId}
            language={language}
          />
        )}

        {currentRole === 'patient' && (
          <PatientApp
            doctors={doctors}
            hospitals={hospitals}
            selectedHospitalId={selectedHospitalId}
            language={language}
            onFeedbackSubmitted={refreshData}
          />
        )}
      </main>
    </div>
  );
}
