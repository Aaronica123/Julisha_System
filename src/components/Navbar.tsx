import React from 'react';
import { Activity, ShieldAlert, User, Stethoscope, Building2, Globe, Moon, Sun } from 'lucide-react';
import { LanguageCode, Hospital } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../lib/i18n';

interface NavbarProps {
  currentRole: 'admin' | 'doctor' | 'patient';
  onRoleChange: (role: 'admin' | 'doctor' | 'patient') => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  hospitals: Hospital[];
  selectedHospitalId: string;
  onSelectHospital: (id: string) => void;
  activeAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  activeAlertCount,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between min-h-[64px] sm:min-h-[72px] py-2 gap-2 sm:gap-3 lg:gap-4">
          {/* Brand & Logo + Language Category under Julisha System */}
          <div className="flex items-center space-x-3 shrink-0 py-0.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col justify-center space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">{t.systemTitle}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs shrink-0">
                  AI v2.5
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-slate-400 font-medium hidden xl:block truncate max-w-[200px]">{t.systemSubtitle}</p>
                {/* Compact Language Selector under Julisha System */}
                <div className="inline-flex items-center space-x-1.5 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/80 text-[11px] shadow-xs hover:border-slate-600 transition-all shrink-0">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <select
                    id="language-selector"
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                    className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                        {lang.flag} {lang.nativeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="flex items-center bg-slate-800/90 p-1 gap-1 rounded-xl border border-slate-700/70 shadow-inner my-0.5 shrink-0">
            <button
              id="role-btn-admin"
              onClick={() => onRoleChange('admin')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                currentRole === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">{t.roleAdmin}</span>
              <span className="xl:hidden">Admin</span>
              {activeAlertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white font-extrabold rounded-full animate-pulse shadow-sm">
                  {activeAlertCount}
                </span>
              )}
            </button>

            <button
              id="role-btn-doctor"
              onClick={() => onRoleChange('doctor')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                currentRole === 'doctor'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">{t.roleDoctor}</span>
              <span className="xl:hidden">Doctor</span>
            </button>

            <button
              id="role-btn-patient"
              onClick={() => onRoleChange('patient')}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                currentRole === 'patient'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">{t.rolePatient}</span>
              <span className="xl:hidden">Patient</span>
            </button>
          </nav>

          {/* Right Utilities: Facility Context Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Facility Context Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-xs shadow-xs hover:border-slate-600 transition-all max-w-[160px] sm:max-w-[200px] lg:max-w-[240px]">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                id="facility-selector"
                value={selectedHospitalId}
                onChange={(e) => onSelectHospital(e.target.value)}
                className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer truncate w-full"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-slate-200">
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
