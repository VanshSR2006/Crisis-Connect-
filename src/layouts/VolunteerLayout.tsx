import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, PackageCheck, ShieldAlert, ArrowLeftRight, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const VolunteerLayout: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { to: '/volunteer/tasks', label: 'Field Tasks', icon: ClipboardList },
    { to: '/volunteer/resources', label: 'Resource Stock', icon: PackageCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf8fa] text-[#1b1b1d] font-sans">
      {/* Top Header — Stitch Navy */}
      <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-[#1e293b] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-sm tracking-tight text-white uppercase">
                CrisisConnect
              </span>
              <span className="text-[10px] font-semibold bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Volunteer Field
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Field Radio Active
            </div>
            <button
              onClick={() => navigate('/login')}
              title="Switch Platform Role"
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded transition-colors"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span className="hidden sm:inline">Switch Role</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main 
        className="flex-1 max-w-4xl w-full mx-auto px-4 py-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
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
