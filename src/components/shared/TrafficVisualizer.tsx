import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Bot, User, AlertOctagon, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

interface TrafficPacket {
  id: number;
  category: 'human' | 'ai_agent' | 'bot';
  ip: string;
  source: string;
  behaviorScore: number;
  decision: 'ALLOW' | 'VERIFY' | 'RATE LIMIT' | 'BLOCK';
  stage: number; // 0 to 4
}

export const TrafficVisualizer: React.FC = () => {
  const [packets, setPackets] = useState<TrafficPacket[]>([
    { id: 1, category: 'human', ip: '198.51.100.22', source: 'Chrome / macOS', behaviorScore: 94, decision: 'ALLOW', stage: 4 },
    { id: 2, category: 'ai_agent', ip: '185.220.101.5', source: 'Claude-Web Crawler', behaviorScore: 68, decision: 'ALLOW', stage: 3 },
    { id: 3, category: 'bot', ip: '45.154.255.89', source: 'Headless Chrome / Linux', behaviorScore: 12, decision: 'BLOCK', stage: 2 },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'human' | 'ai_agent' | 'bot'>('all');

  const injectPacket = (type: 'human' | 'ai_agent' | 'bot') => {
    const id = Date.now();
    const newPacket: TrafficPacket = {
      id,
      category: type,
      ip: type === 'human' ? '172.56.42.110' : type === 'ai_agent' ? '35.192.14.88' : '91.240.118.12',
      source: type === 'human' ? 'Safari / iOS' : type === 'ai_agent' ? 'Perplexity Bot' : 'Scrapy Stealth v2',
      behaviorScore: type === 'human' ? Math.floor(Math.random() * 15) + 85 : type === 'ai_agent' ? Math.floor(Math.random() * 20) + 60 : Math.floor(Math.random() * 25) + 5,
      decision: type === 'human' ? 'ALLOW' : type === 'ai_agent' ? 'ALLOW' : Math.random() > 0.5 ? 'BLOCK' : 'RATE LIMIT',
      stage: 0,
    };

    setPackets((prev) => [newPacket, ...prev.slice(0, 4)]);
  };

  // Progress packet stages
  useEffect(() => {
    const timer = setInterval(() => {
      setPackets((prev) =>
        prev.map((p) => (p.stage < 4 ? { ...p, stage: p.stage + 1 } : p))
      );
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-surface-0 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-pulse-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pulse-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-beacon" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Live Behavioral Pipeline
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mt-1">
            Real-Time Decision Engine Simulation
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Inject Traffic:</span>
          <button
            onClick={() => injectPacket('human')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" /> +Human
          </button>
          <button
            onClick={() => injectPacket('ai_agent')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" /> +AI Agent
          </button>
          <button
            onClick={() => injectPacket('bot')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" /> +Bot Attack
          </button>
        </div>
      </div>

      {/* 5-Stage Visual Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative mb-6">
        {/* Stage 1: Ingest */}
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider">STAGE 01</span>
            <h5 className="text-xs font-semibold text-slate-200 mt-1">Incoming Traffic</h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Multi-protocol HTTP/TLS ingest capturing raw client headers & session identifiers.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1 text-[11px] font-mono text-pulse-cyan">
            <Zap className="w-3.5 h-3.5" /> 1,480 req/s
          </div>
        </div>

        {/* Stage 2: Behavioral Tracker */}
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold text-pulse-cyan tracking-wider">STAGE 02</span>
            <h5 className="text-xs font-semibold text-slate-200 mt-1">Behavioral Analysis</h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Micro-motion entropy, scroll acceleration, click curvature, and typing flight metrics.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-300">
            LSTM Sequence Model
          </div>
        </div>

        {/* Stage 3: Classification */}
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold text-indigo-400 tracking-wider">STAGE 03</span>
            <h5 className="text-xs font-semibold text-slate-200 mt-1">Classification</h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Tri-category division: Human vs Traditional Automation vs Autonomous AI Agents.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
        </div>

        {/* Stage 4: Risk Evaluation */}
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold text-amber-400 tracking-wider">STAGE 04</span>
            <h5 className="text-xs font-semibold text-slate-200 mt-1">Risk Evaluation</h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Continuous trust score (0-100) weighing threat intent, ASN reputation & endpoint sensitivity.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-amber-400">
            RAD-S1 Verification
          </div>
        </div>

        {/* Stage 5: Enforcement */}
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-semibold text-emerald-400 tracking-wider">STAGE 05</span>
            <h5 className="text-xs font-semibold text-slate-200 mt-1">Protection Decision</h5>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Autonomous execution: Allow trusted, challenge ambiguous, or terminate malicious requests.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-semibold">ALLOW</span>
            <span className="text-rose-400 font-semibold">BLOCK</span>
          </div>
        </div>
      </div>

      {/* Animated Active Streams Table */}
      <div className="bg-surface-1/70 border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-white/5 mb-3">
          <span>ACTIVE PACKET TELEMETRY</span>
          <span>PIPELINE PROGRESSION</span>
        </div>

        <div className="space-y-2.5">
          {packets.map((pkt) => {
            const isHuman = pkt.category === 'human';
            const isAI = pkt.category === 'ai_agent';
            const colorClass = isHuman ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : isAI ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' : 'text-rose-400 border-rose-500/20 bg-rose-500/5';
            const badgeLabel = isHuman ? 'HUMAN' : isAI ? 'AI AGENT' : 'AUTOMATED BOT';

            return (
              <div
                key={pkt.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface-2 border border-white/5 hover:border-white/10 transition-all text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
                    {badgeLabel}
                  </span>
                  <span className="text-slate-200 font-semibold">{pkt.ip}</span>
                  <span className="text-slate-400 text-[11px] hidden md:inline">({pkt.source})</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Trust Score:</span>
                    <span className={`font-bold ${pkt.behaviorScore > 70 ? 'text-emerald-400' : pkt.behaviorScore > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {pkt.behaviorScore}/100
                    </span>
                  </div>

                  {/* Stage Progress Pills */}
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                          step <= pkt.stage
                            ? isHuman
                              ? 'bg-emerald-400'
                              : isAI
                              ? 'bg-cyan-400'
                              : 'bg-rose-400'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      pkt.decision === 'ALLOW'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : pkt.decision === 'VERIFY'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : pkt.decision === 'RATE LIMIT'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {pkt.decision}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
