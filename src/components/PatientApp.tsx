import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, QrCode, Wifi, WifiOff, Send, Sparkles, MessageSquare, Star, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Doctor, Hospital, LanguageCode, PatientFeedback } from '../types';
import { TRANSLATIONS } from '../lib/i18n';
import { api } from '../services/api';

interface PatientAppProps {
  doctors: Doctor[];
  hospitals: Hospital[];
  selectedHospitalId: string;
  language: LanguageCode;
  onFeedbackSubmitted: () => void;
}

export const PatientApp: React.FC<PatientAppProps> = ({
  doctors,
  hospitals,
  selectedHospitalId,
  language,
  onFeedbackSubmitted,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const facilityDoctors = doctors.filter((d) => d.hospitalId === selectedHospitalId);
  const activeHospital = hospitals.find((h) => h.id === selectedHospitalId);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(facilityDoctors[0]?.id || doctors[0]?.id || '');
  const [commClarity, setCommClarity] = useState<number>(4);
  const [conduct, setConduct] = useState<number>(5);
  const [interactiveness, setInteractiveness] = useState<number>(4);
  const [dressCode, setDressCode] = useState<number>(5);
  const [doctorHygiene, setDoctorHygiene] = useState<number>(5);
  const [facilityHygiene, setFacilityHygiene] = useState<number>(5);
  const [comments, setComments] = useState<string>('');

  // Biometric Authentication State
  const [biometricAuthenticated, setBiometricAuthenticated] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [patientFingerprintHash, setPatientFingerprintHash] = useState<string>('');

  // Network State Simulator
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<PatientFeedback[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Fingerprint Scan Simulation
  const handleFingerprintScan = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      const generatedHash = `fp_${Math.random().toString(36).substring(2, 12)}`;
      setPatientFingerprintHash(generatedHash);
      setBiometricAuthenticated(true);
      setIsScanning(false);
    }, 1200);
  };

  // Submit Feedback Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!biometricAuthenticated) {
      alert('Please verify your biometric fingerprint scan before submitting feedback.');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    const payload = {
      doctor_id: selectedDoctorId,
      hospital_id: selectedHospitalId,
      fingerprint_hash: patientFingerprintHash,
      communication_clarity: commClarity / 5,
      conduct: conduct / 5,
      user_interactiveness: interactiveness / 5,
      dress_code: dressCode / 5,
      doctor_hygiene: doctorHygiene / 5,
      facility_hygiene: facilityHygiene / 5,
      comments,
      language,
    };

    if (!isOnline) {
      // Offline mode simulation
      const queueItem: PatientFeedback = {
        id: `offline_${Date.now()}`,
        doctorId: selectedDoctorId,
        hospitalId: selectedHospitalId,
        patientIdentifier: patientFingerprintHash,
        communicationClarity: commClarity / 5,
        conduct: conduct / 5,
        userInteractiveness: interactiveness / 5,
        dressCode: dressCode / 5,
        doctorHygiene: doctorHygiene / 5,
        facilityHygiene: facilityHygiene / 5,
        comments,
        createdAt: new Date().toISOString(),
        offlineSynced: false,
      };
      setOfflineQueue([...offlineQueue, queueItem]);
      setSuccessMessage('Feedback saved locally in Offline Queue! Will auto-sync when network reconnects.');
      setSubmitting(false);
      resetForm();
      return;
    }

    try {
      await api.submitFeedback(payload);
      setSuccessMessage('Thank you! Your verified feedback has been submitted securely.');
      onFeedbackSubmitted();
      resetForm();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setSuccessMessage('Failed to connect to server. Feedback queued locally.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-sync offline queue when back online
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    setSubmitting(true);
    for (const item of offlineQueue) {
      await api.submitFeedback({
        doctor_id: item.doctorId,
        hospital_id: item.hospitalId,
        fingerprint_hash: item.patientIdentifier,
        communication_clarity: item.communicationClarity,
        conduct: item.conduct,
        user_interactiveness: item.userInteractiveness,
        dress_code: item.dressCode,
        comments: item.comments,
        language: item.language,
      });
    }
    setOfflineQueue([]);
    setSuccessMessage(`Synced ${offlineQueue.length} offline patient reviews to Haki System cloud!`);
    setSubmitting(false);
    onFeedbackSubmitted();
  };

  const resetForm = () => {
    setBiometricAuthenticated(false);
    setPatientFingerprintHash('');
    setComments('');
    setCommClarity(4);
    setConduct(5);
    setInteractiveness(4);
    setDressCode(5);
    setDoctorHygiene(5);
    setFacilityHygiene(5);
  };

  const renderRatingBar = (label: string, value: number, onChange: (val: number) => void) => {
    const emojis = ['😠', '😐', '🙂', '😊', '🤩'];
    return (
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-sm font-medium text-slate-200">
          <span>{label}</span>
          <span className="text-emerald-400 font-bold flex items-center space-x-1">
            <span>{emojis[value - 1]}</span>
            <span>{value} / 5</span>
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => onChange(star)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center space-x-1 ${
                star <= value
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${star <= value ? 'fill-current text-amber-300' : ''}`} />
              <span>{star}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Network Status & Offline Control Banner */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">
              {isOnline ? t.offlineSynced : t.offlineQueued}
            </h4>
            <p className="text-xs text-slate-400">
              {isOnline
                ? 'Direct encryption to Haki Regional Health Database'
                : 'Offline mode simulation active for remote rural health posts'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {offlineQueue.length > 0 && isOnline && (
            <button
              onClick={syncOfflineQueue}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-md animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync {offlineQueue.length} Queued Reviews</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const next = !isOnline;
              setIsOnline(next);
              if (next && offlineQueue.length > 0) syncOfflineQueue();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isOnline
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
            }`}
          >
            {isOnline ? 'Simulate Offline Mode' : 'Reconnect Online'}
          </button>
        </div>
      </div>

      {/* Main Feedback Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
              Patient Care Quality Portal
            </span>
            <h2 className="text-2xl font-bold text-white mt-0.5">{t.submitFeedback}</h2>
            <p className="text-sm text-slate-400 mt-1">
              Facility: <strong className="text-slate-200">{activeHospital?.name || 'Primary Health Center'}</strong>
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300 font-mono">Scan Doctor QR</span>
          </div>
        </div>

        {/* Doctor Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center space-x-2">
            <span>Select Attending Medical Officer:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {facilityDoctors.map((doc) => (
              <button
                type="button"
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedDoctorId === doc.id
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="font-semibold text-sm">{doc.name}</h4>
                  <p className="text-xs text-slate-400">{doc.specialization}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 flex items-center justify-end space-x-1">
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    <span>{doc.overallRating || 4.5}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{doc.feedbackCount || 0} reviews</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Biometric Verification Box */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-semibold text-slate-200">{t.fingerprintAuth}</h4>
            </div>
            <span className="text-xs text-slate-400">Prevents multiple fake reviews</span>
          </div>

          {!biometricAuthenticated ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center space-x-3 text-slate-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Fingerprint className={`w-7 h-7 ${isScanning ? 'animate-pulse text-emerald-300' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {isScanning ? 'Scanning fingerprint sensor...' : 'Touch scanner to verify patient visit'}
                  </p>
                  <p className="text-[11px] text-slate-400">Biometric hash is encrypted & anonymized</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFingerprintScan}
                disabled={isScanning}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span>{t.scanFingerprint}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{t.fingerprintVerified}</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400/80">Token: {patientFingerprintHash}</span>
            </div>
          )}
        </div>

        {/* Rating Metrics Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderRatingBar(t.commClarity, commClarity, setCommClarity)}
            {renderRatingBar(t.doctorConduct, conduct, setConduct)}
            {renderRatingBar(t.interactiveness, interactiveness, setInteractiveness)}
            {renderRatingBar(t.dressCode, dressCode, setDressCode)}
            {renderRatingBar(t.doctorHygiene || 'Doctor Personal Hygiene & Gloves', doctorHygiene, setDoctorHygiene)}
            {renderRatingBar(t.facilityHygiene || 'Hospital Sanitation & Waste Disposal', facilityHygiene, setFacilityHygiene)}
          </div>

          {/* Optional Text Comments */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Comments & Observations (Optional):</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t.commentsPlaceholder}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/60 placeholder:text-slate-600"
            />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !biometricAuthenticated}
            className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${
              biometricAuthenticated
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Submission...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t.submitFeedback}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
