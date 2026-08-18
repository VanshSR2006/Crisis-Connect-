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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CitizenProvider } from '@/lib/citizenContext';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export const CitizenLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[11px] font-medium text-slate-300">{t('common.systemOperational')}</span>
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
