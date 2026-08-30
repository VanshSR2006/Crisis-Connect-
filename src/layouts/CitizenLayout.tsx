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
    <div className="min-h-screen flex flex-col bg-[#fcf8fa] text-[#1b1b1d] font-sans">
      {/* Top Header — Stitch Design */}
      <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-[#1e293b] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#2563eb] rounded flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-sm tracking-tight text-white uppercase">
                CrisisConnect
              </span>
              <span className="text-[10px] font-semibold bg-[#1e3a8a]/70 text-blue-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {t('common.citizen')}
              </span>
            </div>
          </div>

          {/* Status + Language Toggle + Switch */}
          <div className="flex items-center gap-3">
            <LanguageToggle variant="light" />
            <div className="hidden sm:flex items-center gap-1.5">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full inline-block',
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
              <span className="text-[11px] font-medium text-slate-300">
                {isOnline ? t('common.systemOperational') : 'Offline Mode'}
              </span>
            </div>
            <button
              onClick={() => navigate('/login')}
              title={t('common.switchRole')}
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded transition-colors"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span className="hidden sm:inline">{t('common.switchRole')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Offline / Pending Queue Sync Banner */}
      {(!isOnline || pendingCount > 0) && (
        <div
          className={cn(
            'px-4 py-2 text-xs font-medium flex items-center justify-between shadow-inner transition-colors',
            !isOnline
              ? 'bg-amber-800 text-amber-100 border-b border-amber-900'
              : 'bg-blue-950 text-blue-100 border-b border-blue-900'
          )}
        >
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
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

      {/* Main Content */}
      <main
        className="flex-1 max-w-4xl w-full mx-auto px-4 py-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation — Stitch light style */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#c6c6cd] shadow-sm"
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
  );
};

export const CitizenLayout: React.FC = () => {
  return (
    <CitizenProvider>
      <CitizenLayoutContent />
    </CitizenProvider>
  );
};
