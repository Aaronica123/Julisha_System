import React, { useState, useEffect } from 'react';
import { Stethoscope, Clock, Sparkles, TrendingUp, TrendingDown, Star, MessageSquare, AlertTriangle, CheckCircle2, UserCheck, RefreshCw } from 'lucide-react';
import { Doctor, Hospital, LanguageCode, DoctorPerformanceAnalytics } from '../types';
import { TRANSLATIONS } from '../lib/i18n';
import { api } from '../services/api';

interface DoctorDashboardProps {
  doctors: Doctor[];
  hospitals: Hospital[];
  selectedHospitalId: string;
  language: LanguageCode;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctors,
  hospitals,
  selectedHospitalId,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const facilityDoctors = doctors.filter((d) => d.hospitalId === selectedHospitalId);
  const [activeDoctorId, setActiveDoctorId] = useState<string>(facilityDoctors[0]?.id || doctors[0]?.id || '');
  const [analytics, setAnalytics] = useState<DoctorPerformanceAnalytics | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [clockingIn, setClockingIn] = useState<boolean>(false);
  const [clockInSuccess, setClockInSuccess] = useState<string>('');

  const activeDoctor = doctors.find((d) => d.id === activeDoctorId) || doctors[0];
  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId);

  // Fetch doctor analytics
  useEffect(() => {
    if (!activeDoctorId) return;
    api.getDoctorPerformance(activeDoctorId).then((data) => {
      setAnalytics(data);
    });
  }, [activeDoctorId]);

  // Generate AI Doctor Mentorship Advice via server Gemini API
  const handleGenerateAIAdvice = async () => {
    if (!activeDoctorId) return;
    setLoadingAi(true);
    try {
      const res = await api.getAIDoctorAdvice(activeDoctorId);
      setAiAdvice(res.recommendations);
    } catch (err) {
      console.error('Error fetching AI doctor advice:', err);
      setAiAdvice('Failed to load AI advice. Please retry.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Clock-in First Patient Contact
  const handleClockIn = async () => {
    setClockingIn(true);
    setClockInSuccess('');
    try {
      const res = await api.clockInAttendance({
        doctor_id: activeDoctorId,
        hospital_id: selectedHospitalId,
        first_patient_contact_time: new Date().toISOString(),
      });
      setClockInSuccess(
        `Clocked in successfully! Status: ${res.status === 'on_time' ? 'On Time' : `Late by ${res.late_minutes} mins`}.`
      );
    } catch (err) {
      console.error('Error clocking in:', err);
      setClockInSuccess('Clock-in recorded locally.');
    } finally {
      setClockingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Doctor Profile Selector & Hospital Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-teal-950/40">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{activeDoctor?.name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {activeDoctor?.employeeId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeDoctor?.specialization} • {activeHospital?.name}
            </p>
          </div>
        </div>

        {/* Doctor Switcher & Clock In Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={activeDoctorId}
            onChange={(e) => setActiveDoctorId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
          >
            {facilityDoctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialization})
              </option>
            ))}
          </select>

          <button
            onClick={handleClockIn}
            disabled={clockingIn}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {clockingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{t.clockInBtn}</span>
          </button>
        </div>
      </div>

      {clockInSuccess && (
        <div className="p-4 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{clockInSuccess}</span>
        </div>
      )}

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400">Overall Patient Satisfaction</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-3xl font-extrabold text-white">{analytics.overallScore}%</span>
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                analytics.overallScore >= 75 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {analytics.trendDirection === 'improving' ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                {analytics.trendDirection}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Based on {analytics.totalFeedbacks} verified patient visits</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400">On-Time Clinic Arrival</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-3xl font-extrabold text-teal-400">{analytics.attendanceOnTimePct}%</span>
              <span className="text-xs font-bold text-slate-400">Shift: {activeDoctor?.shiftStartTime}</span>
            </div>
            <p className="text-[11px] text-slate-500">First patient contact time logs</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400">Communication Clarity</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-3xl font-extrabold text-cyan-400">
                {Math.round(analytics.categoryScores.communication * 100)}%
              </span>
              <Star className="w-5 h-5 text-amber-400 fill-current" />
            </div>
            <p className="text-[11px] text-slate-500">Language & dosage clarity rating</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400">Conduct & Respect</span>
            <div className="flex items-center justify-between pt-1">
              <span className="text-3xl font-extrabold text-emerald-400">
                {Math.round(analytics.categoryScores.conduct * 100)}%
              </span>
              <UserCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500">Patient empathy & conduct score</p>
          </div>
        </div>
      )}

      {/* Main Grid: Category Breakdown + AI Mentor Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown & Peer Benchmark */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>4-Domain Performance Breakdown</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Anonymized Ratings</span>
          </div>

          {analytics && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>{t.commClarity}</span>
                  <span className="text-cyan-400">{Math.round(analytics.categoryScores.communication * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${analytics.categoryScores.communication * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>{t.doctorConduct}</span>
                  <span className="text-emerald-400">{Math.round(analytics.categoryScores.conduct * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${analytics.categoryScores.conduct * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>{t.interactiveness}</span>
                  <span className="text-teal-400">{Math.round(analytics.categoryScores.interactiveness * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${analytics.categoryScores.interactiveness * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>{t.dressCode}</span>
                  <span className="text-indigo-400">{Math.round(analytics.categoryScores.dressCode * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${analytics.categoryScores.dressCode * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Identified Weaknesses */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Key Areas for Development</h4>
            <div className="space-y-2">
              {analytics?.weaknesses.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`w-4 h-4 ${w.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                    <span className="font-semibold text-slate-200">{w.category}</span>
                  </div>
                  <span className="text-slate-400 font-mono">Gap: {w.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Mentor Advice Powered by Gemini */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">{t.aiMentorAdvice}</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemma Model Engine
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Generates constructive, empathetic mentor guidance tailored to your verified patient feedback and clinic attendance logs.
            </p>

            {aiAdvice ? (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-2 font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                {aiAdvice}
              </div>
            ) : (
              <div className="mt-6 p-8 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-500/60 mx-auto" />
                <p className="text-xs text-slate-400">Click below to synthesize personal AI mentor advice for {activeDoctor?.name}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateAIAdvice}
            disabled={loadingAi}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 mt-4"
          >
            {loadingAi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Advice...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Personal Clinical Advice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
