import React, { useState, useEffect } from 'react';
import { TrendingDown, AlertCircle, ArrowRight, ShieldAlert, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { Hospital, StockoutCorrelation } from '../types';
import { api } from '../services/api';

interface StockoutCorrelationViewProps {
  hospitals: Hospital[];
  selectedHospitalId: string;
}

export const StockoutCorrelationView: React.FC<StockoutCorrelationViewProps> = ({
  hospitals,
  selectedHospitalId,
}) => {
  const [activeHospitalId, setActiveHospitalId] = useState<string>(selectedHospitalId || hospitals[0]?.id || 'hosp-2');
  const [correlationData, setCorrelationData] = useState<StockoutCorrelation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.getStockoutCorrelation(activeHospitalId).then((data) => {
      setCorrelationData(data);
      setLoading(false);
    });
  }, [activeHospitalId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Model 2 Engine</span>
            <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold rounded-full border border-amber-500/30">
              Pearson Pearson-r r = {correlationData ? (correlationData.correlationCoefficient / 100).toFixed(2) : '0.89'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Stockout vs Patient Satisfaction Correlation Engine</h3>
          <p className="text-xs text-slate-400">
            Correlates medicine supply depletion with drops in patient satisfaction to determine root cause.
          </p>
        </div>

        <select
          value={activeHospitalId}
          onChange={(e) => setActiveHospitalId(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none"
        >
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.trendDirection.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Computing time-series alignment & Granger causality...</p>
        </div>
      ) : correlationData ? (
        <div className="space-y-6">
          {/* Statistical Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Correlation Coefficient (r)</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-extrabold text-amber-400">{correlationData.correlationCoefficient}%</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {correlationData.significanceLevel} Significance
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Strong time-lagged causality</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Attributable Satisfaction Drop</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-extrabold text-rose-400">{correlationData.impactPercentage}%</span>
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-[11px] text-slate-500">Directly caused by medicine stockouts</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400">Critical Shortage Items</span>
              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {correlationData.topShortageMedicines.length > 0
                    ? correlationData.topShortageMedicines.join(', ')
                    : 'No critical stockouts'}
                </p>
              </div>
              <p className="text-[11px] text-slate-500">Primary antibiotics & supplements</p>
            </div>
          </div>

          {/* Graphical Timeline Representation */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>14-Day Timeline Comparison</span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Stock Availability %</span>
                </span>
                <span className="flex items-center space-x-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  <span>Patient Satisfaction %</span>
                </span>
              </div>
            </div>

            {/* Custom Bar Timeline */}
            <div className="grid grid-cols-14 gap-1 sm:gap-2 pt-4 items-end h-40 border-b border-slate-800 pb-2">
              {correlationData.timeline.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center justify-end h-full space-y-1 group relative">
                  {/* Hover tooltip */}
                  <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-800 text-[10px] text-slate-200 p-2 rounded shadow-lg whitespace-nowrap z-20 border border-slate-700">
                    <p className="font-bold">{item.date}</p>
                    <p className="text-amber-300">Stock: {item.stockAvailabilityPct}%</p>
                    <p className="text-cyan-300">Satisfaction: {item.patientSatisfactionPct}%</p>
                  </div>

                  <div className="w-full flex space-x-0.5 items-end justify-center h-full">
                    <div
                      className="w-1.5 sm:w-2 bg-amber-400 rounded-t transition-all"
                      style={{ height: `${item.stockAvailabilityPct}%` }}
                    />
                    <div
                      className="w-1.5 sm:w-2 bg-cyan-400 rounded-t transition-all"
                      style={{ height: `${item.patientSatisfactionPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono truncate">{item.date.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Interpretation Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-300">Engine Root Cause Diagnosis:</span>
              <p className="mt-1 text-slate-300">{correlationData.interpretation}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
