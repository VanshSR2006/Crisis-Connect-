import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  AlertCircle,
  Home as ShelterIcon,
  Bell,
  User,
  ShieldAlert,
  ArrowLeftRight,
  WifiOff,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CitizenProvider } from '@/lib/citizenContext';
import { useOfflineSync } from '@/lib/useOfflineSync';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { FloatingAssistantRobot } from '@/components/assistant/FloatingAssistantRobot';

export const CitizenLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  const navItems = [
    { to: '/citizen/home', label: t('nav.home'), icon: Home },
    { to: '/citizen/sos-report', label: t('nav.sos'), icon: AlertCircle },
    { to: '/citizen/shelters', label: t('nav.shelters'), icon: ShelterIcon },
    { to: '/citizen/alerts', label: t('nav.alerts'), icon: Bell },
    { to: '/citizen/profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#e2e8f0] text-[#1b1b1d] font-sans">
      {/* ── Dark Navy 3D Left Sidebar ─────────────────────────── */}
      <aside className="hidden md:flex md:w-56 flex-col bg-gradient-to-b from-[#0f172a] via-[#0b1120] to-[#070a14] text-white border-r-2 border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto shadow-[10px_0_35px_rgba(0,0,0,0.35)] z-50">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center border-b border-slate-800 shrink-0 gap-2.5 bg-slate-950/40 shadow-xs">
          <img src="/logo.png" alt="CrisisConnect Logo" className="h-8 w-auto object-contain flex-shrink-0 drop-shadow-xs" />
          <div className="flex flex-col leading-tight">
            <span className="font-black text-xs tracking-tight text-white uppercase whitespace-nowrap drop-shadow-sm">
              CrisisConnect
            </span>
            <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest drop-shadow-xs">
              {t('common.citizen')} Portal
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ease-out',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white shadow-[0_6px_16px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border-t border-blue-400/40 border-b border-blue-800 -translate-y-0.5'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 border border-transparent'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={cn(
                      'p-1.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-white/20 shadow-inner'
                        : 'bg-slate-800/60 shadow-xs'
                    )}>
                      <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
                    </div>
                    <span className="truncate tracking-wide uppercase text-[11px] drop-shadow-xs">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer — Status Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-bold bg-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] rounded-xl px-3 py-2 border border-slate-800">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse shadow-md',
                isOnline ? 'bg-emerald-400 shadow-emerald-400/60' : 'bg-amber-400 shadow-amber-400/60'
              )}
            />
            <span className="truncate">
              {isOnline ? t('common.systemOperational') : 'Offline Mode'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace Area (Header + Main Content) ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#e2e8f0]">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#090d16] border-b-2 border-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <div className="w-full px-6 h-13 flex items-center justify-between">
            {/* Mobile Brand (Shown on small screens) */}
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md border border-blue-400/30">
                <ShieldAlert className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase">
                  CrisisConnect
                </span>
                <span className="text-[10px] font-semibold bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-500/30">
                  {t('common.citizen')}
                </span>
              </div>
            </div>

            {/* Desktop Section Title */}
            <div className="hidden md:flex items-center gap-2 text-slate-300 text-xs font-black uppercase tracking-wider drop-shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
              <span>{t('common.citizen')} Emergency Command Dashboard</span>
            </div>

            {/* Status + Language Toggle + Switch */}
            <div className="flex items-center gap-3.5 ml-auto">
              <LanguageToggle variant="light" />
              <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700/60 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full inline-block shadow-xs',
                    isOnline ? 'bg-emerald-400 shadow-emerald-400/60' : 'bg-amber-400 shadow-amber-400/60'
                  )}
                />
                <span className="text-[11px] font-extrabold text-slate-300">
                  {isOnline ? t('common.systemOperational') : 'Offline Mode'}
                </span>
              </div>
              <button
                onClick={() => navigate('/login')}
                title={t('common.switchRole')}
                className="flex items-center gap-1.5 text-[11px] font-black text-slate-200 hover:text-white bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:translate-y-0.5 motion-reduce:hover:transform-none"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('common.switchRole')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Offline / Pending Queue Sync Banner */}
        {(!isOnline || pendingCount > 0) && (
          <div
            className={cn(
              'px-6 py-2 text-xs font-medium flex items-center justify-between shadow-inner transition-colors',
              !isOnline
                ? 'bg-amber-800 text-amber-100 border-b border-amber-900'
                : 'bg-blue-950 text-blue-100 border-b border-blue-900'
            )}
          >
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!isOnline ? (
                  <WifiOff className="h-4 w-4 text-amber-300 animate-pulse flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-300 flex-shrink-0" />
                )}
                <span>
                  {!isOnline
                    ? `Offline Mode — ${pendingCount} SOS report${pendingCount === 1 ? '' : 's'} queued locally on device.`
                    : `${pendingCount} SOS report${pendingCount === 1 ? '' : 's'} pending transmission to backend.`}
                </span>
              </div>

              {isOnline && pendingCount > 0 && (
                <button
                  onClick={() => triggerSync()}
                  disabled={isSyncing}
                  className="bg-blue-800 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Page Content */}
        <main className="flex-1 w-full px-6 py-6 md:pb-8 pb-24">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Hidden on Desktop) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#c6c6cd] shadow-sm"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-around h-14 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-colors duration-150',
                      isActive
                        ? 'text-[#0f172a]'
                        : 'text-[#76777d] hover:text-[#1b1b1d]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={cn(
                          'p-1 rounded transition-colors',
                          isActive && 'bg-[#d5e3fc]'
                        )}
                      >
                        <Icon className={cn('h-5 w-5', isActive && 'text-[#0f172a]')} />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-semibold tracking-wide uppercase',
                          isActive ? 'text-[#0f172a]' : 'text-[#76777d]'
                        )}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Floating AI Voice Assistant */}
        <FloatingAssistantRobot />
      </div>
    </div>
  );
};

export const CitizenLayout: React.FC = () => {
  return (
    <CitizenProvider>
      <CitizenLayoutContent />
    </CitizenProvider>
  );
};
