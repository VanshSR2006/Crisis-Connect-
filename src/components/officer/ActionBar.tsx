import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Brain, ShieldAlert, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
import { explainDecision, authorizeDispatch, ExplainDecisionResponse, ExplainDecisionRequest } from '@/lib/api/decisions';

interface ActionBarProps {
  selectedEntityId: string | null;
  entityType: 'incident' | 'site' | 'dispatch';
  onNavigateToDispatch?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ selectedEntityId, entityType, onNavigateToDispatch }) => {
  const { t } = useTranslation();
  
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<ExplainDecisionResponse | null>(null);
  
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  const handleExplain = async () => {
    if (!selectedEntityId) return;
    setIsExplaining(true);
    try {
      const result = await explainDecision({ entity_id: selectedEntityId, entity_type: entityType });
      setExplanation(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAuthorize = async () => {
    if (!selectedEntityId || entityType !== 'incident') return;
    setIsAuthorizing(true);
    setAuthStatus(null);
    try {
      const res = await authorizeDispatch({
        incident_id: selectedEntityId,
        assigned_user_id: 'pending',
        notes: 'Emergency Override Authorization'
      });
      setAuthStatus(res.message);
    } catch (e) {
      setAuthStatus('Authorization failed. Backend contract missing.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="bg-white border-t-2 border-t-white border-b-2 border-b-slate-300 border-x border-slate-200/90 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-blue-600" />
          Command Actions
        </h3>
        {selectedEntityId && (
          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
            Target: {selectedEntityId}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 text-[11px] font-black uppercase tracking-wider h-10 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800"
          disabled={!selectedEntityId || isExplaining}
          onClick={handleExplain}
        >
          <Brain className="h-4 w-4 mr-1.5 text-blue-600" />
          {isExplaining ? 'Analyzing...' : 'Explain Decision'}
        </Button>
        <Button
          variant="primary"
          className="flex-1 text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-10 rounded-xl shadow-xs border border-red-400/30"
          disabled={!selectedEntityId || entityType !== 'incident' || isAuthorizing}
          onClick={handleAuthorize}
        >
          <ShieldAlert className="h-4 w-4 mr-1.5" />
          {isAuthorizing ? 'Authorizing...' : 'Authorize Response'}
        </Button>
      </div>

      {explanation && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs animate-fadeIn mt-1 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-slate-900 uppercase">AI Reasoning Breakdown</span>
            <span className="text-[10px] text-slate-500 font-mono">{new Date(explanation.generated_at).toLocaleTimeString()}</span>
          </div>
          <p className="text-slate-700 mb-3 font-semibold leading-relaxed">{explanation.summary}</p>
          <div className="space-y-1.5">
            {explanation.factors.map((f, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-white border border-slate-200 p-2 rounded-lg font-bold">
                <span className="text-slate-700">{f.label}</span>
                <span className={`font-black font-mono ${f.impact === 'negative' ? 'text-red-600' : f.impact === 'positive' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {authStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-black text-emerald-900 flex items-center gap-2 shadow-xs">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{authStatus}</span>
        </div>
      )}
    </div>
  );
};
