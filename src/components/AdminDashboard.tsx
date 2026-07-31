import React, { useState } from 'react';
import { Building2, ShieldAlert, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, Search, CheckCircle2, RefreshCw, BarChart2, Package, Truck, Eye, Plus, X } from 'lucide-react';
import { Hospital, Doctor, StockRecord, AlertItem, ResourceRedistributionPlan, LanguageCode } from '../types';
import { TRANSLATIONS } from '../lib/i18n';
import { StockoutCorrelationView } from './StockoutCorrelationView';
import { ResourceRedistribution } from './ResourceRedistribution';
import { api } from '../services/api';
import { AIResponseCard } from './AIResponseCard';

interface AdminDashboardProps {
  hospitals: Hospital[];
  doctors: Doctor[];
  stocks: StockRecord[];
  alerts: AlertItem[];
  redistributionPlans: ResourceRedistributionPlan[];
  language: LanguageCode;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  hospitals,
  doctors,
  stocks,
  alerts,
  redistributionPlans,
  language,
  onRefreshData,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const [activeTab, setActiveTab] = useState<'rankings' | 'correlation' | 'redistribution' | 'executive_report' | 'alerts'>('rankings');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<Hospital | null>(null);
  const [aiInterventionPlan, setAiInterventionPlan] = useState<string>('');
  const [loadingAiPlan, setLoadingAiPlan] = useState<boolean>(false);

  // Executive AI Report State
  const [executiveReport, setExecutiveReport] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Stock update form inside modal
  const [updateMedName, setUpdateMedName] = useState<string>('Amoxicillin 500mg');
  const [updateQty, setUpdateQty] = useState<number>(150);
  const [updateThreshold, setUpdateThreshold] = useState<number>(100);
  const [updatingStock, setUpdatingStock] = useState<boolean>(false);
  const [stockMessage, setStockMessage] = useState<string>('');

  // District High Level Stats
  const totalFacilities = hospitals.length;
  const avgScore = Math.round(hospitals.reduce((s, h) => s + h.totalScore, 0) / (totalFacilities || 1));
  const improvingCount = hospitals.filter((h) => h.trendDirection === 'improving').length;
  const stableCount = hospitals.filter((h) => h.trendDirection === 'stable').length;
  const decliningCount = hospitals.filter((h) => h.trendDirection === 'declining').length;
  const activeAlerts = alerts.filter((a) => !a.resolvedAt);

  // Filtered & Sorted Rankings
  const filteredHospitals = hospitals
    .filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.district.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.totalScore - a.totalScore);

  // Acknowledge Alert Handler
  const handleAcknowledgeAlert = async (alertId: string) => {
    await api.acknowledgeAlert(alertId, 'District Officer');
    onRefreshData();
  };

  // Generate AI Intervention Plan for selected hospital
  const handleGenerateInterventionPlan = async (hospitalId: string) => {
    setLoadingAiPlan(true);
    setAiInterventionPlan('');
    try {
      const res = await api.getAIHospitalIntervention(hospitalId);
      setAiInterventionPlan(res.plan);
    } catch (err) {
      console.error('Error generating intervention plan:', err);
      setAiInterventionPlan('Failed to generate intervention plan.');
    } finally {
      setLoadingAiPlan(false);
    }
  };

  // Generate District Executive Report
  const handleGenerateExecutiveReport = async () => {
    setLoadingReport(true);
    try {
      const res = await api.getAIDistrictSummary();
      setExecutiveReport(res.summary);
    } catch (err) {
      console.error('Error generating executive report:', err);
      setExecutiveReport('Failed to load district summary report.');
    } finally {
      setLoadingReport(false);
    }
  };

  // Update Medicine Quantity Handler
  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalForModal) return;
    setUpdatingStock(true);
    setStockMessage('');
    try {
      await api.updateStock({
        hospital_id: selectedHospitalForModal.id,
        medicine_name: updateMedName,
        quantity: updateQty,
        threshold: updateThreshold,
      });
      setStockMessage(`Updated ${updateMedName} stock to ${updateQty} units!`);
      onRefreshData();
    } catch (err) {
      console.error('Error updating stock:', err);
      setStockMessage('Stock update failed.');
    } finally {
      setUpdatingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">District Facilities Average</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-3xl font-extrabold text-white">{avgScore}%</span>
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-500">{totalFacilities} PHC/CHC facilities tracked</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Facility Trends</span>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-bold text-emerald-400 flex items-center" title="Improving Facilities">
                <TrendingUp className="w-4 h-4 mr-1" />
                {improvingCount}
              </span>
              <span className="text-xl font-bold text-slate-300 flex items-center" title="Stable Facilities">
                <Minus className="w-4 h-4 mr-1" />
                {stableCount}
              </span>
              <span className="text-xl font-bold text-rose-400 flex items-center" title="Declining Facilities">
                <TrendingDown className="w-4 h-4 mr-1" />
                {decliningCount}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">30-day slope</span>
          </div>
          <p className="text-[11px] text-slate-500">
            <span className="text-emerald-400 font-semibold">{improvingCount} Improving</span> • <span className="text-slate-300 font-semibold">{stableCount} Stable</span> • <span className="text-rose-400 font-semibold">{decliningCount} Declining</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Active Critical Alerts</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-3xl font-extrabold text-rose-400">{activeAlerts.length}</span>
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500">Stockouts, hygiene & response delays</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-400">Surplus Transfer Plans</span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-3xl font-extrabold text-teal-400">{redistributionPlans.length}</span>
            <Truck className="w-6 h-6 text-teal-400" />
          </div>
          <p className="text-[11px] text-slate-500">Inter-facility supply balancing</p>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rankings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'rankings'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Rankings & Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('correlation')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'correlation'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Stockout Correlation Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('redistribution')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'redistribution'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Resource Redistribution</span>
        </button>

        <button
          onClick={() => setActiveTab('executive_report')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'executive_report'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI District Executive Report</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alerts Feed ({activeAlerts.length})</span>
        </button>
      </div>

      {/* TAB 1: Hospital Rankings & Table */}
      {activeTab === 'rankings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Facility Performance & Ranking Matrix</h3>
              <p className="text-xs text-slate-400">Calculates composite score based on satisfaction, sanitation, patient response speed, and medicine stock.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter hospital or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Facility Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">District</th>
                  <th className="p-3 text-center">Satisfaction</th>
                  <th className="p-3 text-center">Sanitation</th>
                  <th className="p-3 text-center">Stock Score</th>
                  <th className="p-3 text-center">Patient Response</th>
                  <th className="p-3 text-center">Total Score</th>
                  <th className="p-3 text-center">Trend</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHospitals.map((hosp, idx) => (
                  <tr key={hosp.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3 font-extrabold text-slate-300">#{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-1.5">
                        <p className="font-bold text-slate-100">{hosp.name}</p>
                        {hosp.sanitaryHygieneScore < 60 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded" title="Flagged for Poor Hygiene & Biohazard Waste">
                            ⚠️ Poor Hygiene
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">{hosp.contactInfo.address}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                        {hosp.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{hosp.district}</td>
                    <td className="p-3 text-center font-semibold text-cyan-400">{hosp.doctorSatisfactionScore}%</td>
                    <td className="p-3 text-center font-semibold">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        (hosp.sanitaryHygieneScore || 80) < 60
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-emerald-400'
                      }`}>
                        {hosp.sanitaryHygieneScore || 80}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold text-amber-400">{hosp.stockAvailabilityScore}%</td>
                    <td className="p-3 text-center font-semibold text-teal-400 font-mono">
                      {hosp.patientResponseScore ?? 80}% <span className="text-[10px] text-slate-400 font-sans">({hosp.avgResponseTimeMins ?? 8}m)</span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          hosp.totalScore >= 70
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : hosp.totalScore >= 50
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {hosp.totalScore}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center space-x-1 text-[11px] font-bold ${
                          hosp.trendDirection === 'improving' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {hosp.trendDirection === 'improving' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span className="capitalize">{hosp.trendDirection}</span>
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedHospitalForModal(hosp)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-semibold rounded-lg text-xs transition-all flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Correlation View */}
      {activeTab === 'correlation' && (
        <StockoutCorrelationView hospitals={hospitals} selectedHospitalId={hospitals[0]?.id} />
      )}

      {/* TAB 3: Resource Redistribution */}
      {activeTab === 'redistribution' && (
        <ResourceRedistribution plans={redistributionPlans} onTransferExecuted={onRefreshData} />
      )}

      {/* TAB 4: AI District Executive Report */}
      {activeTab === 'executive_report' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">District Health Executive Summary Generator</h3>
              </div>
              <p className="text-xs text-slate-400">Synthesizes district-wide stockout alerts, facility scores, and trend trajectories into an executive report.</p>
            </div>

            <button
              onClick={handleGenerateExecutiveReport}
              disabled={loadingReport}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
            >
              {loadingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Executive Report</span>
            </button>
          </div>

          {executiveReport ? (
            <div className="mt-4">
              <AIResponseCard
                content={executiveReport}
                variant="admin"
                title="District Health Service Executive Report"
                subtitle="Synthesized district-wide performance metrics, stock alerts & facility trends"
              />
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-75" />
              <p className="text-xs text-slate-400">Click the button above to query server-side Gemini API for a 1-minute executive summary.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Alerts Feed */}
      {activeTab === 'alerts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Real-time District Alert Feed</h3>
          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  alt.severity === 'critical'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{alt.hospitalName}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] uppercase font-mono bg-slate-900 text-slate-300">
                      {alt.alertType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{alt.message}</p>
                  <span className="text-[10px] text-slate-500">{new Date(alt.createdAt).toLocaleString()}</span>
                </div>

                <div>
                  {alt.resolvedAt ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">
                      Acknowledged by {alt.acknowledgedBy}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgeAlert(alt.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all"
                    >
                      Acknowledge Alert
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital Detail & Intervention Modal */}
      {selectedHospitalForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedHospitalForModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 rounded">
                  {selectedHospitalForModal.type}
                </span>
                <span className="text-xs text-slate-400">{selectedHospitalForModal.district}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{selectedHospitalForModal.name}</h2>
            </div>

            {/* Scores breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Score</span>
                <p className="text-xl font-bold text-white">{selectedHospitalForModal.totalScore}%</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Satisfaction</span>
                <p className="text-xl font-bold text-cyan-400">{selectedHospitalForModal.doctorSatisfactionScore}%</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Sanitation & Hygiene</span>
                <p className={`text-xl font-bold ${selectedHospitalForModal.sanitaryHygieneScore < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedHospitalForModal.sanitaryHygieneScore || 80}%
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Patient Response</span>
                <p className="text-xl font-bold text-teal-400">{selectedHospitalForModal.patientResponseScore ?? 80}% <span className="text-xs text-slate-400 font-normal">({selectedHospitalForModal.avgResponseTimeMins ?? 8}m)</span></p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Stock Score</span>
                <p className="text-xl font-bold text-amber-400">{selectedHospitalForModal.stockAvailabilityScore}%</p>
              </div>
            </div>

            {/* Quick Medicine Stock Management Form */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Update Facility Medicine Inventory</h4>
              <form onSubmit={handleUpdateStock} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Medicine Name</label>
                  <input
                    type="text"
                    value={updateMedName}
                    onChange={(e) => setUpdateMedName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs p-2 text-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Current Quantity</label>
                  <input
                    type="number"
                    value={updateQty}
                    onChange={(e) => setUpdateQty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 text-xs p-2 text-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={updatingStock}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-1"
                  >
                    {updatingStock ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Update Stock</span>
                  </button>
                </div>
              </form>
              {stockMessage && <p className="text-xs text-emerald-400 font-medium">{stockMessage}</p>}
            </div>

            {/* AI Hospital Intervention Plan Generator */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Hospital Intervention Action Plan</h4>
                </div>
                <button
                  onClick={() => handleGenerateInterventionPlan(selectedHospitalForModal.id)}
                  disabled={loadingAiPlan}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-lg transition-all"
                >
                  {loadingAiPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Synthesize Plan'}
                </button>
              </div>

              {aiInterventionPlan ? (
                <div className="mt-2">
                  <AIResponseCard
                    content={aiInterventionPlan}
                    variant="intervention"
                    title={`Facility Intervention Action Plan`}
                    subtitle={`72-hour and 30-day turnaround strategy for ${selectedHospitalForModal.name}`}
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Click Synthesize Plan to generate structured 72-hour and 30-day intervention strategy.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
