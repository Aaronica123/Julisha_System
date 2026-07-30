import React, { useState } from 'react';
import { ArrowRight, PackageCheck, Truck, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ResourceRedistributionPlan } from '../types';
import { api } from '../services/api';

interface ResourceRedistributionProps {
  plans: ResourceRedistributionPlan[];
  onTransferExecuted: () => void;
}

export const ResourceRedistribution: React.FC<ResourceRedistributionProps> = ({
  plans,
  onTransferExecuted,
}) => {
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleExecute = async (planId: string) => {
    setExecutingId(planId);
    setMessage('');
    try {
      const res = await api.executeRedistribution(planId);
      setMessage(res.message || 'Transfer executed successfully!');
      onTransferExecuted();
    } catch (err) {
      console.error('Error executing redistribution:', err);
      setMessage('Failed to execute transfer.');
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Inter-Facility Supply Optimizer</span>
            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/30">
              AI Automated Balancing
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Resource Redistribution & Surplus Transfer Planner</h3>
          <p className="text-xs text-slate-400">
            Transfers medicine inventory from high-surplus CHCs to depleted rural PHCs to prevent critical stockouts.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`p-5 rounded-2xl border transition-all space-y-3 ${
              plan.status === 'transferred'
                ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Transfer Direction Details */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Source */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-0.5 min-w-[180px]">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Source (Surplus)</span>
                  <p className="font-semibold text-slate-200">{plan.sourceHospitalName}</p>
                </div>

                <div className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </div>

                {/* Target */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-0.5 min-w-[180px]">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">Target (Deficit)</span>
                  <p className="font-semibold text-slate-200">{plan.targetHospitalName}</p>
                </div>
              </div>

              {/* Action Button & Status */}
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                    plan.urgency === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {plan.urgency.toUpperCase()} URGENCY
                </span>

                {plan.status === 'transferred' ? (
                  <span className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                    <PackageCheck className="w-4 h-4" />
                    <span>Transferred</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleExecute(plan.id)}
                    disabled={executingId === plan.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    {executingId === plan.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Truck className="w-3.5 h-3.5" />
                    )}
                    <span>Authorize Transfer ({plan.quantity} Units)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
              <span className="font-bold text-emerald-400">Transfer Payload:</span>
              <span>
                <strong>{plan.quantity} units</strong> of <strong>{plan.medicineName}</strong>. Reason: {plan.reason}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
