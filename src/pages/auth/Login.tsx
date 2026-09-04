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
  Zap,
  Newspaper,
  Calendar,
  MapPin
} from 'lucide-react';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { EmergencySOSButton } from '@/components/shared/EmergencySOSButton';
import { FloatingAssistantRobot } from '@/components/assistant/FloatingAssistantRobot';
import { ActiveDisasterZonesMapSection } from '@/components/shared/ActiveDisasterZonesMapSection';
import { useAuth } from '@/lib/authContext';

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined) ??
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://crisis-connect-api-dev.onrender.com');

type AuthMode = 'login' | 'signup';

interface NewsItem {
  id: string;
  category: string;
  badge: string;
  badgeColor: string;
  headline: string;
  summary: string;
  date: string;
  link: string;
  image: string;
  imageAlt: string;
}

const RECENT_DISASTER_NEWS: NewsItem[] = [
  {
    id: 'assam-floods',
    category: 'ASSAM',
    badge: 'FLOOD ALERT',
    badgeColor: 'bg-red-500 text-white border-red-400',
    headline: 'Flood Crisis Continues in Assam',
    summary: 'Severe monsoon flooding continues to affect communities across Assam.',
    date: 'Aug 22, 2026',
    link: 'https://www.aljazeera.com/news/2026/8/22/it-was-a-tsunami-floods-leave-death-trail-in-indias-assam',
    image: '/news/assam_floods.jpg',
    imageAlt: 'SDRF Assam Rescue Boat in Flooded Village'
  },
  {
    id: 'chitrakoot-mp',
    category: 'MADHYA PRADESH',
    badge: 'RIVER WARNING',
    badgeColor: 'bg-amber-500 text-white border-amber-400',
    headline: 'Fresh Flood Alert as Mandakini River Rises',
    summary: 'Rising Mandakini River levels have triggered renewed flood warnings in Chitrakoot.',
    date: 'Aug 2026',
    link: 'https://www.ndtv.com/india-news/after-record-floods-fresh-alert-in-madhya-pradesh-town-as-river-rises-again-11981171',
    image: '/news/chitrakoot_mandakini.jpg',
    imageAlt: 'Swollen Mandakini River near Ghats in Chitrakoot'
  },
  {
    id: 'varanasi-up',
    category: 'UTTAR PRADESH',
    badge: 'MONSOON UPDATE',
    badgeColor: 'bg-blue-600 text-white border-blue-400',
    headline: 'Ganga Nears Warning Level in Varanasi',
    summary: 'Rising Ganga water levels have increased flood concerns across low-lying areas.',
    date: 'Aug 2026',
    link: 'https://timesofindia.indiatimes.com/city/varanasi/ganga-nears-warning-mark-flood-threat-looms-over-varuna-belt-in-varanasi/articleshow/133660622.cms',
    image: '/news/varanasi_ganga.jpg',
    imageAlt: 'NDRF Warning Sign at Varanasi Ganga Ghats'
  },
  {
    id: 'northeast-india',
    category: 'NORTHEAST INDIA',
    badge: 'LANDSLIDE WATCH',
    badgeColor: 'bg-purple-600 text-white border-purple-400',
    headline: 'Flood & Landslide Monitoring Across Northeast India',
    summary: 'Flooding and landslide risks continue across several northeastern regions.',
    date: 'Aug 2026',
    link: 'https://reliefweb.int/disaster/ff-2026-000139-ind',
    image: '/news/northeast_landslide.jpg',
    imageAlt: 'Mountain Landslide Clearing in Northeast India'
  },
  {
    id: 'nepal-rescue',
    category: 'REGIONAL EMERGENCY',
    badge: 'RESCUE UPDATE',
    badgeColor: 'bg-emerald-600 text-white border-emerald-400',
    headline: 'Rescue Operations Intensify After Devastating Floods',
    summary: 'Rescue teams continue operations following devastating Himalayan floods.',
    date: 'Aug 31, 2026',
    link: 'https://www.reuters.com/world/asia-pacific/nepal-hydropower-sites-centre-flood-rescue-efforts-2026-08-31/',
    image: '/news/nepal_rescue.jpg',
    imageAlt: 'Himalayan Flood Helicopter Rescue in Nepal'
  }
];

export const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');

  // Input fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [languagePref, setLanguagePref] = useState<string>('en');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { t } = useTranslation();

  const handleRoleSelect = (role: UserRole) => {
    if (mode === 'signup' && role === 'officer') return;
    setSelectedRole(role);
    setErrorMsg(null);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
    if (newMode === 'signup' && selectedRole === 'officer') {
      setSelectedRole('citizen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (mode === 'signup' && selectedRole === 'officer') {
      setErrorMsg('Officer registration is disabled. Officers must log in using existing credentials.');
      setIsLoading(false);
      return;
    }

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
        // Signup (Citizen or Volunteer only)
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
            role: 'volunteer',
            language_pref: languagePref
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
        setSession({ token: data.access_token, user: data.user });

        // Navigate strictly based on backend-verified role
        const authenticatedRole: UserRole = data.user.role;
        if (authenticatedRole === 'citizen') {
          try {
            sessionStorage.setItem('should_announce_alert', 'true');
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
          } catch (e) {
            console.warn('Speech synthesis on login error:', e);
          }
          navigate('/citizen/home');
        }
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

  const scrollToLogin = () => {
    const el = document.getElementById('login-hero');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* ── SECTION 1 — LOGIN / HERO SECTION ─────────────────────────────── */}
      <section id="login-hero" className="login-hero relative w-full bg-slate-950 px-4 pt-3 pb-10 sm:px-8 sm:pt-4 sm:pb-14 lg:px-10 lg:pt-5 lg:pb-16 overflow-hidden">
        {/* ── Full-Bleed Rescue Background (CLIPPED STRICTLY TO SECTION 1) ─── */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/disaster_rescue_bg.jpg"
            alt="Disaster Rescue Operations"
            className="w-full h-full object-cover object-[center_30%] filter brightness-[0.92] contrast-[1.05] scale-[1.01]"
          />
          {/* Balanced Soft Gradient Overlay so Rescue Team Remains Unobscured */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/70" />
        </div>

        {/* Top Desktop Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-20 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img
              src="/logo.png"
              alt="CrisisConnect Logo"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white uppercase font-sans drop-shadow-md">
                  CRISISCONNECT
                </h1>
              </div>
              <p className="text-[11px] text-slate-200 font-medium hidden sm:block drop-shadow-xs">
                Integrated Emergency Operations & Rapid Disaster Response System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <LanguageToggle variant="light" />

            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-md border border-slate-700/70 text-slate-200 font-medium shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold">{t('auth.activeDisasterZones')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200 font-mono text-[11px] bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-md">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>{t('auth.encryptedChannel')}</span>
            </div>
          </div>
        </header>

        {/* Main Desktop 2-Column Content Layout */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start my-2 lg:my-4 py-1 relative z-20">

          {/* Left Column: Clean Telemetry & Info Overlay (7 Columns) */}
          <div className="lg:col-span-7 space-y-5 pt-2 lg:pt-3 pr-0 lg:pr-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 backdrop-blur-md border border-blue-400/40 text-blue-200 text-xs font-bold tracking-wide shadow-md">
                <Globe className="h-3.5 w-3.5 text-blue-400" />
                <span>{t('auth.tagline')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {t('auth.headline')}
              </h2>
              <p className="text-slate-100 text-sm sm:text-base leading-relaxed max-w-xl font-semibold drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {t('auth.subheadline')}
              </p>
            </div>
          </div>

          {/* Right Column: Clean White Authentication Command Card (5 Columns) */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] relative">

              {/* Header with Login / Signup Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
                    {mode === 'login' ? 'Authentication Command' : 'Create System Account'}
                  </h2>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                    Secure Access
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${mode === 'signup'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    SIGNUP
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${mode === 'login'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    LOGIN
                  </button>
                </div>
              </div>

              {/* Form Input Fields & Role Selection */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    Select Role
                  </label>
                  <div className={`grid ${mode === 'signup' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                    {/* Citizen */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('citizen')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${selectedRole === 'citizen'
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

                    {/* Officer (Login Mode Only) */}
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => handleRoleSelect('officer')}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${selectedRole === 'officer'
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
                    )}

                    {/* Volunteer */}
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('volunteer')}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${selectedRole === 'volunteer'
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

                {/* Language Preference (Signup Mode) */}
                {mode === 'signup' && (
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
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${selectedRole === 'officer'
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
        </div>
      </section>

      {/* ── TELEMETRY NODES SECTION — 3 CIRCULAR CARDS CONNECTED BY SPACED WHITE DOTS ─────── */}
      <section className="w-full bg-slate-200/90 border-y border-slate-300 py-8 px-4 relative z-20 overflow-hidden shadow-inner">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-4 relative z-10">

          {/* Node 1: Active Sectors */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-2 border-blue-500 shadow-xl flex flex-col items-center justify-center p-3 text-center group-hover:scale-110 group-hover:border-blue-400 transition-all duration-300 relative">
              <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mb-0.5 group-hover:rotate-45 transition-transform duration-500" />
              <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">04</p>
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-blue-300 tracking-wider">Active Sectors</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-700 font-bold mt-2 font-mono">UK, AS, OD, KL</p>
          </div>

          {/* Spaced-Out White Circular Dots Connector 1 with Continuous Wave Animation */}
          <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-3">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse [animation-delay:200ms]" />
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white border-2 border-blue-400 shadow-sm shrink-0 animate-pulse [animation-delay:400ms]" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse [animation-delay:600ms]" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse [animation-delay:800ms]" />
          </div>

          {/* Node 2: Dispatch Target */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-2 border-amber-500 shadow-xl flex flex-col items-center justify-center p-3 text-center group-hover:scale-110 group-hover:border-amber-400 transition-all duration-300 relative">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 mb-0.5 group-hover:scale-125 transition-transform duration-300" />
              <p className="text-base sm:text-xl font-black text-white font-mono tracking-tight">&lt; 5 min</p>
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider">Dispatch Target</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-700 font-bold mt-2 font-mono">SOS to Dispatch</p>
          </div>

          {/* Spaced-Out White Circular Dots Connector 2 with Continuous Wave Animation */}
          <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-3">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse [animation-delay:200ms]" />
            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white border-2 border-amber-400 shadow-sm shrink-0 animate-pulse [animation-delay:400ms]" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse [animation-delay:600ms]" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white border border-slate-300 shadow-xs shrink-0 animate-pulse [animation-delay:800ms]" />
          </div>

          {/* Node 3: Field Response */}
          <div className="flex flex-col items-center text-center group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-900 border-2 border-red-500 shadow-xl flex flex-col items-center justify-center p-3 text-center group-hover:scale-110 group-hover:border-red-400 transition-all duration-300 relative">
              <RadioTower className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mb-0.5 group-hover:animate-pulse" />
              <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">24 / 7</p>
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-red-300 tracking-wider">Field Response</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-700 font-bold mt-2 font-mono">Command Active</p>
          </div>

        </div>
      </section>

      {/* ── SECTION 2 — ACTIVE DISASTER ZONES SECTION (LIGHT AMBIENT RADAR BACKGROUND) ─── */}
      <section className="active-disaster-zones relative w-full bg-gradient-to-b from-amber-50/50 via-amber-50/20 to-slate-50/50 text-slate-900 px-4 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24 z-20 overflow-hidden border-t border-slate-200/80">
        {/* Subtle Geospatial Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-100/40 blur-3xl pointer-events-none rounded-full" />
        <ActiveDisasterZonesMapSection />
      </section>

      {/* ── SECTION 3 — RECENT FLOOD & DISASTER NEWS SECTION (PICTURE MARQUEE FORMAT) ─── */}
      <section className="recent-disaster-news relative w-full bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-slate-100/80 border-t border-slate-200/80 text-slate-900 py-12 sm:py-16 lg:py-20 z-20 overflow-hidden">
        {/* Subtle Ambient Radial Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" />
        {/* Inline CSS style for continuous rightward marquee & hover/touch pause */}
        <style>{`
          @keyframes marqueeRight {
            0% {
              transform: translateX(-33.333333%);
            }
            100% {
              transform: translateX(0%);
            }
          }
          .animate-marquee-track {
            display: flex;
            width: max-content;
            animation: marqueeRight 35s linear infinite;
          }
          .animate-marquee-track:hover,
          .animate-marquee-track:active,
          .animate-marquee-track:focus-within {
            animation-play-state: paused !important;
          }
        `}</style>

        <div className="w-full space-y-8">

          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Newspaper className="h-3.5 w-3.5" />
              <span>Verified Disaster Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Recent Flood &amp; Disaster News
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium">
              Latest emergency and flood updates from India and nearby regions. (Touch or hover card to pause)
            </p>
          </div>

          {/* Marquee Track Container with subtle fade edges */}
          <div className="relative w-full overflow-hidden py-4">
            {/* Left & Right gradient edge fades */}
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Continuous Marquee Track */}
            <div className="animate-marquee-track flex gap-6 px-4">
              {[...RECENT_DISASTER_NEWS, ...RECENT_DISASTER_NEWS, ...RECENT_DISASTER_NEWS].map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1.5"
                >
                  {/* Top Picture / Image Banner Header */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.9] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/30" />

                    {/* Location Badge Top Left */}
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md border border-white/20 flex items-center gap-1 uppercase tracking-wider font-mono">
                      <MapPin className="h-3 w-3 text-blue-400" />
                      <span>{item.category}</span>
                    </div>

                    {/* Alert Badge Top Right */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shadow-xs ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    {/* Headline Overlaid on Image Bottom */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-sm group-hover:text-blue-200 transition-colors">
                        {item.headline}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                      {item.summary}
                    </p>

                    {/* Card Footer: Date & Link */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{item.date}</span>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group/link"
                      >
                        <span>Read Full News &rarr;</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prominent Centered GET STARTED Button above footer */}
          <div className="pt-4 pb-2 flex justify-center items-center">
            <button
              type="button"
              onClick={scrollToLogin}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/35 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-blue-400/40 group"
            >
              <span>GET STARTED</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* Desktop Footer */}
      <footer className="w-full bg-slate-950 text-slate-300 px-4 py-6 sm:px-8 lg:px-10 border-t border-slate-800 relative z-20">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-2 sm:gap-0 font-semibold drop-shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{t('auth.systemsOperational')}</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span>SIH 2026 DISASTER PLATFORM</span>
            <span>•</span>
            <span>RAPID RESPONSE PROTOCOL V1.0</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Assistant Robot */}
      <FloatingAssistantRobot />
    </div>
  );
};
