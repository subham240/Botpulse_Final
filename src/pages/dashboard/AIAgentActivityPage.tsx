import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_AI_AGENTS } from '../../data/mockData';
import { AIAgentRecord, EnforcementDecision } from '../../types';
import { Badge } from '../../components/shared/Badge';
import { useApp } from '../../contexts/AppContext';
import { Cpu, Bot, ShieldCheck, ShieldAlert, Sliders, CheckCircle2, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export const AIAgentActivityPage: React.FC = () => {
  const { showToast, backendAgents, demoMode } = useApp();
  const activeList = demoMode ? MOCK_AI_AGENTS : (backendAgents.length > 0 ? backendAgents : MOCK_AI_AGENTS);
  const [agents, setAgents] = useState<AIAgentRecord[]>(activeList);
  const [selectedAgent, setSelectedAgent] = useState<AIAgentRecord | null>(activeList[0] || null);

  React.useEffect(() => {
    setAgents(activeList);
    if (activeList.length > 0 && !selectedAgent) {
      setSelectedAgent(activeList[0]);
    }
  }, [activeList]);

  const handleUpdatePolicy = (agentId: string, policy: EnforcementDecision) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, enforcementPolicy: policy } : a))
    );
    if (selectedAgent && selectedAgent.id === agentId) {
      setSelectedAgent({ ...selectedAgent, enforcementPolicy: policy });
    }
    showToast('Agent Policy Updated', `Enforced [${policy.toUpperCase()}] for ${selectedAgent?.name}`, 'warning');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F7F5] tracking-tight">AI Agents</h1>
          <p className="text-xs text-[#A3ADA6] mt-0.5">
            Identify, govern, and manage autonomous LLM crawlers and web search agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/prevention"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-1 hover:bg-surface-2 border border-[#43D6A0]/30 hover:border-[#43D6A0] text-xs font-mono font-semibold text-[#43D6A0] hover:text-white transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manage Bot Limits & Policies</span>
          </Link>
          <div className="text-xs font-mono text-[#A3ADA6] hidden sm:block">
            RAD-S1 Engine: <span className="text-[#43D6A0] font-semibold">Active Attribution</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Agent Directory + Deep Inspection & Policy Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Agent Directory Cards */}
        <div className="lg:col-span-7 space-y-3">
          {agents.map((agent) => {
            const isLegit = agent.intent === 'Legitimate';
            const isMalicious = agent.intent === 'Malicious';
            const isSelected = selectedAgent?.id === agent.id;

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-surface-2 border-pulse-cyan shadow-xl shadow-pulse-cyan/5'
                    : 'bg-surface-1 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-white font-mono">{agent.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                        isLegit
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isMalicious
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {agent.intent} Intent
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Publisher: {agent.publisher}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">{agent.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-3 border-t border-white/5">
                  <div>Model: <strong className="text-purple-400">{agent.detectionModel}</strong></div>
                  <div>Confidence: <strong className="text-white">{agent.confidence}%</strong></div>
                  <div>Policy: <Badge value={agent.enforcementPolicy} /></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Agent Forensic & Policy Panel */}
        <div className="lg:col-span-5 sticky top-24">
          {selectedAgent && (
            <div className="p-6 rounded-2xl bg-surface-1 border border-white/10 shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-mono font-bold text-pulse-cyan uppercase">
                  AI-AGENT FINGERPRINT: {selectedAgent.id}
                </span>
                <Badge value={selectedAgent.enforcementPolicy} />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{selectedAgent.name}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Family: {selectedAgent.family} • {selectedAgent.declaredCategory}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-surface-0 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">ACTIVE SESSIONS</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    {selectedAgent.activeSessions}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface-0 border border-white/5">
                  <span className="text-slate-400 text-[10px] block">24H VOLUME</span>
                  <span className="text-base font-bold text-white mt-1 block">
                    {selectedAgent.requestsLast24h.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-0 border border-white/5 space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  RAD-S1 Signature Telemetry
                </span>
                <div className="flex items-center justify-between font-mono text-slate-300">
                  <span>Attribution Model:</span>
                  <span className="text-purple-400">{selectedAgent.detectionModel}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-slate-300">
                  <span>Fingerprint Match:</span>
                  <span className="text-emerald-400">{selectedAgent.confidence}% Accuracy</span>
                </div>
                <div className="flex items-center justify-between font-mono text-slate-300">
                  <span>Last Seen Activity:</span>
                  <span className="text-slate-200">{selectedAgent.lastActive}</span>
                </div>
              </div>

              {/* Policy Enactor */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-xs font-mono uppercase text-slate-300 font-semibold block mb-2">
                  Autonomous Edge Policy:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {(['allow', 'verify', 'rate_limit', 'block'] as EnforcementDecision[]).map((pol) => (
                    <button
                      key={pol}
                      onClick={() => handleUpdatePolicy(selectedAgent.id, pol)}
                      className={`py-2 px-3 rounded-lg border font-bold uppercase tracking-wider text-[11px] transition-all ${
                        selectedAgent.enforcementPolicy === pol
                          ? 'bg-pulse-cyan/20 text-pulse-cyan border-pulse-cyan shadow-sm'
                          : 'bg-surface-2 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {pol.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
