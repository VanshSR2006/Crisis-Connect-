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
    <div className="bg-white border border-[#c6c6cd] rounded shadow-sm p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#f0edef] pb-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[#1b1b1d] flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#4f46e5]" />
          Command Actions
        </h3>
        {selectedEntityId && (
          <span className="text-[10px] font-mono text-[#76777d] bg-[#f6f3f5] px-2 py-0.5 rounded">
            Target: {selectedEntityId}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 text-[11px] font-bold uppercase tracking-wider h-9"
          disabled={!selectedEntityId || isExplaining}
          onClick={handleExplain}
        >
          <Brain className="h-3.5 w-3.5 mr-1.5 text-[#4f46e5]" />
          {isExplaining ? 'Analyzing...' : 'Explain Decision'}
        </Button>
        <Button
          variant="primary"
          className="flex-1 text-[11px] font-bold uppercase tracking-wider bg-[#ba1a1a] hover:bg-[#991b1b] text-white h-9"
          disabled={!selectedEntityId || entityType !== 'incident' || isAuthorizing}
          onClick={handleAuthorize}
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
          {isAuthorizing ? 'Authorizing...' : 'Authorize Response'}
        </Button>
      </div>

      {explanation && (
        <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded p-3 text-xs animate-fadeIn mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#0f172a]">AI Reasoning Breakdown</span>
            <span className="text-[9px] text-[#64748b] font-mono">{new Date(explanation.generated_at).toLocaleTimeString()}</span>
          </div>
          <p className="text-[#334155] mb-3 leading-relaxed">{explanation.summary}</p>
          <div className="space-y-1.5">
            {explanation.factors.map((f, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] bg-white border border-[#e2e8f0] p-1.5 rounded">
                <span className="text-[#475569]">{f.label}</span>
                <span className={`font-bold ${f.impact === 'negative' ? 'text-red-600' : f.impact === 'positive' ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-[#94a3b8] italic flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            Backend integration pending: Contract mode only.
          </div>
        </div>
      )}

      {authStatus && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-2 text-xs font-bold flex items-center gap-2 mt-2 animate-fadeIn">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          {authStatus}
        </div>
      )}
    </div>
  );
};
