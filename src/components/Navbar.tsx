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
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">{t.systemTitle}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t.systemSubtitle}</p>
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="role-btn-admin"
              onClick={() => onRoleChange('admin')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">{t.roleAdmin}</span>
              <span className="md:hidden">Admin</span>
              {activeAlertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-500 text-white font-bold rounded-full animate-pulse">
                  {activeAlertCount}
                </span>
              )}
            </button>

            <button
              id="role-btn-doctor"
              onClick={() => onRoleChange('doctor')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'doctor'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden md:inline">{t.roleDoctor}</span>
              <span className="md:hidden">Doctor</span>
            </button>

            <button
              id="role-btn-patient"
              onClick={() => onRoleChange('patient')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentRole === 'patient'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">{t.rolePatient}</span>
              <span className="md:hidden">Patient</span>
            </button>
          </nav>

          {/* Right Utilities: Facility Context Selector & Language Selector */}
          <div className="flex items-center space-x-3">
            {/* Facility Context Selector */}
            <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <select
                id="facility-selector"
                value={selectedHospitalId}
                onChange={(e) => onSelectHospital(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-slate-200">
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <select
                id="language-selector"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
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
    </header>
  );
};
