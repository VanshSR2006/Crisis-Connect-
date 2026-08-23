import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@/types';
import { 
  ShieldAlert, 
  User, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  Phone,
  Lock,
  KeyRound,
  ShieldCheck, 
  Activity,
  RadioTower,
  Globe,
  Compass,
  Zap
} from 'lucide-react';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { EmergencySOSButton } from '@/components/shared/EmergencySOSButton';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined) ??
  'https://crisis-connect-api-dev.onrender.com';

type AuthMode = 'login' | 'signup';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('officer');
  
  // Input fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [languagePref, setLanguagePref] = useState<string>('en');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const url = `${BASE_URL}${endpoint}`;

      let bodyPayload: Record<string, any> = {};

      if (mode === 'login') {
        if (selectedRole === 'citizen') {
          bodyPayload = { phone, password, role: 'citizen' };
        } else {
          bodyPayload = { email, password, role: selectedRole };
        }
      } else {
        // Signup
        if (selectedRole === 'citizen') {
          bodyPayload = {
            name,
            phone,
            password,
            role: 'citizen',
            language_pref: languagePref
          };
        } else {
          bodyPayload = {
            name,
            email,
            password,
            role: selectedRole
          };
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetail = data?.detail || 'Authentication failed. Please check your credentials.';
        setErrorMsg(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
        return;
      }

      if (data && data.access_token && data.user) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Navigate strictly based on backend-verified role
        const authenticatedRole: UserRole = data.user.role;
        if (authenticatedRole === 'citizen') navigate('/citizen/home');
        else if (authenticatedRole === 'officer') navigate('/officer/dashboard');
        else if (authenticatedRole === 'volunteer') navigate('/volunteer/tasks');
        else navigate('/citizen/home');
      } else {
        setErrorMsg('Invalid response from server.');
      }
    } catch (err) {
      console.warn('[Auth] Error during submit:', err);
      setErrorMsg('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const zoneOptions = [
    { label: 'Uttarakhand Himalayan Sector (UK-01)', value: 'zone-north-01', risk: 'Critical', color: 'text-red-700 bg-red-50 border-red-200' },
    { label: 'Assam Brahmaputra Flood Basin (AS-02)', value: 'zone-east-02', risk: 'High', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: 'Odisha & Bengal Coastal Belt (OD-03)', value: 'zone-south-03', risk: 'Medium', color: 'text-yellow-800 bg-yellow-50 border-yellow-200' },
    { label: 'Kerala & Konkan Coastal Zone (KL-04)', value: 'zone-central-04', risk: 'Low', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-4 pt-3 pb-6 sm:px-8 sm:pt-4 sm:pb-8 lg:px-10 lg:pt-5 lg:pb-8 relative overflow-hidden text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Light Theme Ambient Soft Glow */}
      <div className="absolute -top-40 -left-40 w-[650px] h-[650px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] bg-red-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Desktop Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-20 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="p-2.5 bg-slate-900 rounded-xl shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase font-sans">
                CRISISCONNECT
              </h1>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-200 uppercase font-bold shadow-xs">
                SIH 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Integrated Emergency Operations & Rapid Disaster Response System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <LanguageToggle variant="dark" />

          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t('auth.activeDisasterZones')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
            <Lock className="h-3.5 w-3.5 text-blue-600" />
            <span>{t('auth.encryptedChannel')}</span>
          </div>
        </div>
      </header>

      {/* Main Desktop 2-Column Content Layout */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center my-4 lg:my-6 py-2 relative z-20">
        
        {/* Left Column: Telemetry & Info (7 Columns) */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide cursor-default">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              <span>{t('auth.tagline')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {t('auth.headline')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              {t('auth.subheadline')}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('auth.activeSectors')}</span>
                <Compass className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">04</p>
              <p className="text-[11px] text-slate-500 font-medium">UK, AS, OD, KL</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('auth.dispatchTarget')}</span>
                <Zap className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">&lt; 5 min</p>
              <p className="text-[11px] text-amber-700 font-medium">{t('auth.sosToDispatch')}</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl space-y-1.5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">{t('auth.fieldResponse')}</span>
                <RadioTower className="h-4.5 w-4.5 text-red-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">24 / 7</p>
              <p className="text-[11px] text-red-700 font-medium">{t('auth.commandActive')}</p>
            </div>
          </div>

          {/* Real-time Zone Overview List */}
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                {t('auth.liveZoneStatus')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">{t('auth.realTimeMonitoring')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {zoneOptions.map((zone) => (
                <div key={zone.value} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-default">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">{zone.label}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Sector ID: {zone.value}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border font-mono uppercase shadow-xs ${zone.color}`}>
                    {zone.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Unified Auth Command Card (5 Columns) */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-200/60 relative">
            
            {/* Header with Login / Signup Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
                  {mode === 'login' ? 'Authentication Command' : 'Create System Account'}
                </h2>
                <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {t('auth.secureAccess')}
                </span>
              </div>

              {/* Signup / Login Segmented Control */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className={`py-2 rounded-lg transition-all text-center ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  SIGNUP
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className={`py-2 rounded-lg transition-all text-center ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  LOGIN
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Select Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Citizen */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('citizen')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                      selectedRole === 'citizen'
                        ? 'bg-blue-50/90 border-blue-600 text-slate-900 shadow-sm ring-1 ring-blue-600/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${selectedRole === 'citizen' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                        <User className="h-3.5 w-3.5" />
                      </div>
                      {selectedRole === 'citizen' && <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{t('auth.citizenRole')}</div>
                    </div>
                  </button>

                  {/* Officer */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('officer')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                      selectedRole === 'officer'
                        ? 'bg-red-50/90 border-red-600 text-slate-900 shadow-sm ring-1 ring-red-600/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${selectedRole === 'officer' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </div>
                      {selectedRole === 'officer' && <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{t('auth.officerRole')}</div>
                    </div>
                  </button>

                  {/* Volunteer */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('volunteer')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                      selectedRole === 'volunteer'
                        ? 'bg-emerald-50/90 border-emerald-600 text-slate-900 shadow-sm ring-1 ring-emerald-600/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${selectedRole === 'volunteer' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                        <Radio className="h-3.5 w-3.5" />
                      </div>
                      {selectedRole === 'volunteer' && <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{t('auth.volunteerRole')}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name Input (Signup Mode Only) */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-sans shadow-xs"
                      placeholder="e.g. Ramesh Kumar"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Identifier Field: Phone Number for Citizen, Email for Officer/Volunteer */}
              {selectedRole === 'citizen' ? (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono shadow-xs"
                      placeholder="e.g. 9876543212"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono shadow-xs"
                      placeholder="name@crisisconnect.org"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Language Preference (Citizen Signup Only) */}
              {mode === 'signup' && selectedRole === 'citizen' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Language Preference
                  </label>
                  <select
                    value={languagePref}
                    onChange={(e) => setLanguagePref(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-xs cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="as">Assamese (অসমীয়া)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                    <option value="ka">Kannada (ಕನ್ನಡ)</option>
                  </select>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 font-mono shadow-xs"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Error message display */}
              {errorMsg && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                  selectedRole === 'officer'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-200/80'
                    : selectedRole === 'volunteer'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-200/80'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-200/80'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>{mode === 'login' ? 'Authenticating…' : 'Creating Account…'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? `LOG IN AS ${selectedRole.toUpperCase()}` : `REGISTER AS ${selectedRole.toUpperCase()}`}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="mt-4">
            <EmergencySOSButton />
          </div>
        </div>

      </main>

      {/* Desktop Footer */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-200 relative z-20 gap-2 sm:gap-0">
        <div className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{t('auth.systemsOperational')}</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>SIH 2026 DISASTER PLATFORM</span>
          <span>•</span>
          <span>RAPID RESPONSE PROTOCOL V1.0</span>
        </div>
      </footer>
    </div>
  );
};
