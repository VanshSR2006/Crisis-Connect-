import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';
import { ShieldAlert, User, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [email, setEmail] = useState<string>('citizen@disasterplatform.gov.in');
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'citizen') setEmail('citizen@disasterplatform.gov.in');
    if (role === 'officer') setEmail('command.officer@ndrf.gov.in');
    if (role === 'volunteer') setEmail('volunteer.lead@relief.org');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === 'citizen') navigate('/citizen/home');
    if (selectedRole === 'officer') navigate('/officer/dashboard');
    if (selectedRole === 'volunteer') navigate('/volunteer/tasks');
  };

  return (
    <div className="min-h-screen bg-[#fcf8fa] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-[#0f172a] rounded-lg mx-auto flex items-center justify-center shadow-sm">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1b1b1d] uppercase mt-3" style={{ letterSpacing: '-0.02em' }}>
            CrisisConnect
          </h1>
          <p className="text-[13px] text-[#45464d]">
            National Emergency Management & Response Portal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#c6c6cd] rounded p-5 space-y-4 shadow-sm">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.05em] text-[#1b1b1d]">
              Select Portal Role
            </h2>
            <p className="text-[11px] text-[#76777d] mt-0.5">
              Choose your authorized access level to enter the platform.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role selector cards */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('citizen')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'citizen'
                    ? 'bg-[#d5e3fc] border-[#2563eb] text-[#0f172a]'
                    : 'bg-white border-[#c6c6cd] text-[#45464d] hover:bg-[#f6f3f5]'
                }`}
              >
                <User className={`h-4 w-4 mb-2 ${selectedRole === 'citizen' ? 'text-[#2563eb]' : 'text-[#76777d]'}`} />
                <div>
                  <div className="font-bold text-[12px]">Citizen</div>
                  <div className="text-[10px] text-[#76777d]">Public</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('officer')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'officer'
                    ? 'bg-[#d5e3fc] border-[#2563eb] text-[#0f172a]'
                    : 'bg-white border-[#c6c6cd] text-[#45464d] hover:bg-[#f6f3f5]'
                }`}
              >
                <ShieldAlert className={`h-4 w-4 mb-2 ${selectedRole === 'officer' ? 'text-[#ba1a1a]' : 'text-[#76777d]'}`} />
                <div>
                  <div className="font-bold text-[12px]">Officer</div>
                  <div className="text-[10px] text-[#76777d]">Command</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('volunteer')}
                className={`p-2.5 rounded border text-left flex flex-col justify-between transition-all ${
                  selectedRole === 'volunteer'
                    ? 'bg-[#d5e3fc] border-[#2563eb] text-[#0f172a]'
                    : 'bg-white border-[#c6c6cd] text-[#45464d] hover:bg-[#f6f3f5]'
                }`}
              >
                <Radio className={`h-4 w-4 mb-2 ${selectedRole === 'volunteer' ? 'text-emerald-600' : 'text-[#76777d]'}`} />
                <div>
                  <div className="font-bold text-[12px]">Volunteer</div>
                  <div className="text-[10px] text-[#76777d]">Field</div>
                </div>
              </button>
            </div>

            <Input
              label="Verified Identity Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Select
              label="Assigned Disaster Zone"
              value="zone-north-01"
              onChange={() => {}}
              options={[
                { label: 'North Riverine Flood Basin (NRFB-01)', value: 'zone-north-01' },
                { label: 'East Urban Drainage Corridor (EUDC-02)', value: 'zone-east-02' },
                { label: 'South Coastal Lowlands (SCL-03)', value: 'zone-south-03' },
              ]}
            />

            <button
              type="submit"
              className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs uppercase tracking-widest py-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <span>Enter {selectedRole.toUpperCase()} Portal</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#76777d] px-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> System Operational
          </span>
          <span>SIH 2026 Emergency System</span>
        </div>
      </div>
    </div>
  );
};
