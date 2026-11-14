import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from './Badge';
import { X, Play, Pause, ShieldCheck, ShieldAlert, Cpu, MousePointer, Activity, Clock, Globe, ArrowRight } from 'lucide-react';
import { EnforcementDecision } from '../../types';

export const SessionDetailModal: React.FC = () => {
  const { selectedSession, setSelectedSession, takeEnforcementAction } = useApp();
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);
  const [replayProgress, setReplayProgress] = useState(65);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSession(null);
    };
    if (selectedSession) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSession, setSelectedSession]);

  if (!selectedSession) return null;

  const isBot = selectedSession.category === 'traditional_bot' || selectedSession.category === 'advanced_bot';
  const isAI = selectedSession.category === 'ai_agent';

  // Synthetic mouse path for bots (straight line) vs organic Bezier for humans
  const mousePoints = isBot
    ? 'M 40 40 L 180 40 L 320 160 L 320 220'
    : 'M 40 180 Q 120 40, 200 120 T 360 80';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setSelectedSession(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[#121A16] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#121A16]/95 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-pulse-cyan" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  {selectedSession.id}
                </h3>
                <Badge value={selectedSession.category} />
                <Badge value={selectedSession.riskLevel} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Domain: {selectedSession.domain} • Origin: {selectedSession.ip} ({selectedSession.country})
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedSession(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Metric Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-1 border border-white/5">
              <span className="text-[11px] font-mono text-slate-400">TRUST SCORE</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {selectedSession.riskScore}/100
              </div>
              <span className="text-[10px] text-slate-400">Multi-Model Weighted</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-1 border border-white/5">
              <span className="text-[11px] font-mono text-slate-400">DURATION</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {selectedSession.durationSeconds}s
              </div>
              <span className="text-[10px] text-slate-400">{selectedSession.pageVisits} Page Views</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-1 border border-white/5">
              <span className="text-[11px] font-mono text-slate-400">TOTAL REQUESTS</span>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {selectedSession.totalRequests}
              </div>
              <span className="text-[10px] text-slate-400">API + DOM Payloads</span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-1 border border-white/5">
              <span className="text-[11px] font-mono text-slate-400">ENFORCEMENT</span>
              <div className="mt-1">
                <Badge value={selectedSession.enforcement} />
              </div>
              <span className="text-[10px] text-slate-400">Autonomous Edge Policy</span>
            </div>
          </div>

          {/* Behavioral Canvas & Mouse Replay */}
          <div className="p-4 rounded-xl bg-surface-1 border border-white/5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-pulse-cyan" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  BEHAVIOURAL POINTER & TELEMETRY REPLAY
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                  className="px-2.5 py-1 rounded text-xs font-mono bg-white/5 hover:bg-white/10 text-slate-200 flex items-center gap-1.5 border border-white/10"
                >
                  {isPlayingReplay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlayingReplay ? 'Pause' : 'Replay Movement'}
                </button>
              </div>
            </div>

            {/* Simulated 2D Replay Viewport */}
            <div className="relative h-56 bg-surface-0 rounded-lg border border-white/5 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 cyber-grid opacity-30" />

              <svg className="w-full h-full">
                <path
                  d={mousePoints}
                  fill="none"
                  stroke={isBot ? '#EF4444' : isAI ? '#00F2FE' : '#10B981'}
                  strokeWidth="2.5"
                  strokeDasharray={isBot ? '6 4' : undefined}
                />
                <circle cx={isBot ? 320 : 360} cy={isBot ? 220 : 80} r="6" fill="#00F2FE" />
              </svg>

              <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-surface-2/90 px-3 py-1.5 rounded border border-white/10">
                <span>Entropy: <strong className="text-slate-200">{selectedSession.telemetryMetrics.mouseMovementEntropy}</strong></span>
                <span>Straight-line ratio: <strong className="text-slate-200">{selectedSession.telemetryMetrics.straightLineMovesRatio}</strong></span>
                <span>Scroll jitter: <strong className="text-slate-200">{selectedSession.telemetryMetrics.scrollJitter}</strong></span>
              </div>
            </div>
          </div>

          {/* Classification Breakdown & Reasoning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-1 border border-white/5">
              <h5 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Classification Rationales
              </h5>
              <ul className="space-y-2">
                {selectedSession.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-pulse-cyan mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-surface-1 border border-white/5">
              <h5 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Manual Policy Override
              </h5>
              <p className="text-xs text-slate-400 mb-4">
                Enact immediate session control rule across edge reverse proxies and WAF gateways:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['allow', 'verify', 'rate_limit', 'block'] as EnforcementDecision[]).map((action) => (
                  <button
                    key={action}
                    onClick={() => takeEnforcementAction(selectedSession.id, action)}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border transition-all ${
                      selectedSession.enforcement === action
                        ? 'bg-pulse-cyan/20 text-pulse-cyan border-pulse-cyan'
                        : 'bg-surface-2 text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    {action.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chronological Event Log */}
          <div className="p-4 rounded-xl bg-surface-1 border border-white/5">
            <h5 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Session Event Timeline
            </h5>
            <div className="space-y-2 font-mono text-xs">
              {selectedSession.eventLog.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-white/5 text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{ev.time}</span>
                    <span className="font-semibold text-slate-200">{ev.action}</span>
                    <span className="text-slate-400 text-[11px]">{ev.path}</span>
                  </div>
                  <span className="text-[11px] text-pulse-cyan">{ev.verdict}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
