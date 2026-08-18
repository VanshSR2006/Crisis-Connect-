import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Radio,
  Activity,
  BarChart3,
  ShieldAlert,
  Menu,
  X,
  ArrowLeftRight,
  RadioTower,
  BellRing,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfficerProvider } from '@/lib/officerContext';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export const OfficerLayoutContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { to: '/officer/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/officer/live-map', label: t('nav.liveMap'), icon: Map },
    { to: '/officer/incidents', label: t('nav.incidents'), icon: AlertTriangle },
    { to: '/officer/dispatch', label: t('nav.dispatch'), icon: Radio },
    { to: '/officer/risk-heatmap', label: t('nav.riskHeatmap'), icon: Activity },
    { to: '/officer/statistics', label: t('nav.analytics'), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-[#fcf8fa] text-[#1b1b1d] font-sans">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity duration-300 animate-fadeIn"
          style={{ animationDuration: '200ms' }}
        />
      )}

      {/* ── Collapsible Sidebar ─────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#c6c6cd] transition-all duration-300',
          'md:static md:translate-x-0',
          sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:w-16'
        )}
      >
        {/* Sidebar Brand Header */}
        <div className={cn(
          'h-12 px-4 flex items-center border-b border-[#c6c6cd] shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 bg-[#0f172a] rounded flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-xs tracking-tight text-[#1b1b1d] uppercase whitespace-nowrap">
                  CrisisConnect
                </span>
                <span className="text-[10px] font-semibold text-[#76777d] uppercase tracking-wider">
                  {t('common.commandRoom')}
                </span>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-7 h-7 bg-[#0f172a] rounded flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-[#76777d] hover:text-[#1b1b1d] hover:bg-[#eae7e9] md:flex hidden transition-colors"
            title="Toggle Sidebar"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={!sidebarOpen ? item.label : undefined}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-[12px] font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-[#d5e3fc] text-[#57657a]'
                      : 'text-[#45464d] hover:bg-[#eae7e9] hover:text-[#1b1b1d]'
                  )
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-[#c6c6cd]">
            <div className="flex items-center gap-2 text-[11px] text-[#45464d] font-medium bg-[#f0edef] rounded px-2.5 py-2 border border-[#c6c6cd]">
              <RadioTower className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{t('common.sihActive')}</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Content Area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-12 bg-[#0f172a] border-b border-[#1e293b] px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded text-slate-300 hover:bg-slate-800 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Emergency Status Banner */}
            <div className="flex items-center gap-2 bg-red-950/70 border border-red-800/60 text-red-300 px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-wider">
              <BellRing className="h-3 w-3 text-red-400 animate-pulse" />
              <span>{t('common.criticalAlertActive')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle variant="light" />
            {/* Zone stream indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="font-medium">{t('common.zoneStream', { zone: 'Delhi NCR' })}</span>
            </div>
            {/* Switch role */}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded transition-colors"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span>{t('common.switchRole')}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 overflow-y-auto bg-[#f6f3f5]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const OfficerLayout: React.FC = () => {
  return (
    <OfficerProvider>
      <OfficerLayoutContent />
    </OfficerProvider>
  );
};

