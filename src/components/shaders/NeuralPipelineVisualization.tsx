import React, { useState } from 'react';
import { Cpu, ShieldCheck, Activity, Bot, Zap, ArrowRight, CheckCircle2, Lock, Eye, Layers } from 'lucide-react';

interface StageNode {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  status: 'active' | 'screening' | 'ready';
  latency: string;
  badge: string;
  description: string;
  metrics: { label: string; value: string }[];
}

const PIPELINE_STAGES: StageNode[] = [
  {
    id: 'ingress',
    number: '01',
    title: 'Telemetry Ingress',
    subtitle: 'Non-invasive biometric collection',
    status: 'active',
    latency: '< 1.2ms',
    badge: 'Beacon Ingestion',
    description: 'Captures mouse cursor acceleration, angular curvature, micro-tremors, and DOM interaction cadences directly in the browser.',
    metrics: [
      { label: 'Feature Dimensions', value: '27 Common' },
      { label: 'Sampling Jitter', value: '45ms throttled' },
      { label: 'Client Overhead', value: '< 12 KB async' }
    ]
  },
  {
    id: 'xgboost',
    number: '02',
    title: 'Layer 1: XGBoost',
    subtitle: 'Tabular feature screening',
    status: 'screening',
    latency: '1.8ms',
    badge: 'Base Classifier',
    description: 'Preprocessed through StandardScaler and evaluated across gradient-boosted decision trees. Isolates obvious automation and headless scripts.',
    metrics: [
      { label: 'Model Artifact', value: 'xgboost.joblib' },
      { label: 'Inference Type', value: 'Tabular Binary' },
      { label: 'Threshold Gate', value: 'Prob > 0.75' }
    ]
  },
  {
    id: 'lstm',
    number: '03',
    title: 'Layer 2: LSTM Sequencer',
    subtitle: 'Sequential trajectory analysis',
    status: 'screening',
    latency: '4.5ms',
    badge: 'Deep Kinematics',
    description: 'Enforces sliding-window evaluation over temporal interactions. Analyzes velocity entropy, angular variance, and synthetic straight-line motion.',
    metrics: [
      { label: 'Min Sequence', value: '8 events' },
      { label: 'Max Window', value: '60 events' },
      { label: 'Analysis Mode', value: 'Kinematic Physics' }
    ]
  },
  {
    id: 'rad_s1',
    number: '04',
    title: 'Layer 3: RAD-S1',
    subtitle: 'AI-agent attribution engine',
    status: 'ready',
    latency: '3.2ms',
    badge: 'Agent Fingerprinting',
    description: 'Identifies autonomous web agents (Claude, Perplexity, GPTBot) via goal-directed direct traversals, zero reading dwell, and signature validation.',
    metrics: [
      { label: 'Detection Logic', value: 'Multi-factor' },
      { label: 'Attribution', value: 'Declared & Heuristic' },
      { label: 'Token Protocol', value: 'Resemble AI' }
    ]
  },
  {
    id: 'risk_engine',
    number: '05',
    title: 'Risk Engine & Token',
    subtitle: 'Cryptographic policy enforcement',
    status: 'ready',
    latency: '< 0.8ms',
    badge: 'Decision Token',
    description: 'Synthesizes all layer probabilities into a unified 0–100 risk score and issues signed HMAC-SHA256 decision tokens (ALLOW, VERIFY, BLOCK).',
    metrics: [
      { label: 'Token Sig', value: 'HMAC-SHA256' },
      { label: 'Action Tiers', value: 'ALLOW/VERIFY/BLOCK' },
      { label: 'Client Overhead', value: 'Zero latency' }
    ]
  }
];

export const NeuralPipelineVisualization: React.FC = () => {
  const [activeStage, setActiveStage] = useState<string>('xgboost');

  const selected = PIPELINE_STAGES.find((s) => s.id === activeStage) || PIPELINE_STAGES[1];

  return (
    <div className="w-full bg-[#121A16]/90 border border-white/10 rounded-[28px] p-6 lg:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Soft emerald radial aura behind pipeline */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#13A879]/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/[0.08] relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#43D6A0]/10 border border-[#43D6A0]/20 text-[11px] font-mono text-[#43D6A0] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-pulse" />
            <span>Interactive Architecture Topology</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F7F5] tracking-tight">
            Three-Layer AI Detection Pipeline
          </h3>
          <p className="text-xs sm:text-sm text-[#A3ADA6] mt-1">
            Explore how biometrics pass through XGBoost, sequential kinematics, and RAD-S1 AI-agent attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-[#18221D] px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-mono text-[#A3ADA6]">
          <span className="text-[#43D6A0]">●</span>
          <span>Cumulative Latency: &lt; 10ms</span>
        </div>
      </div>

      {/* Animated Pipeline Nodes Row */}
      <div className="relative mb-12">
        {/* Animated Connecting SVG Wire with Light Pulses */}
        <div className="hidden lg:block absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 z-0 pointer-events-none">
          <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#43D6A0" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#13A879" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#43D6A0" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Background line */}
            <line x1="0" y1="6" x2="100%" y2="6" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />
            {/* Glowing active animated line */}
            <line
              x1="0"
              y1="6"
              x2="100%"
              y2="6"
              stroke="url(#wireGradient)"
              strokeWidth="2.5"
              className="opacity-70"
            />
          </svg>
        </div>

        {/* 5 Pipeline Stage Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
          {PIPELINE_STAGES.map((stage) => {
            const isSelected = stage.id === activeStage;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`p-4 rounded-2xl text-left transition-all duration-300 relative border ${
                  isSelected
                    ? 'bg-[#18221D] border-[#43D6A0] shadow-[0_0_25px_rgba(67,214,160,0.25)] scale-[1.02]'
                    : 'bg-[#101512]/80 border-white/10 hover:border-white/20 hover:bg-[#141C18]'
                }`}
              >
                {/* Active marker dot */}
                {isSelected && (
                  <span className="absolute -top-1.5 right-4 w-3 h-3 bg-[#43D6A0] rounded-full shadow-[0_0_8px_#43D6A0] animate-ping" />
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-[#43D6A0]">
                    {stage.number}
                  </span>
                  <span className="text-[10px] font-mono text-[#A3ADA6] bg-[#080B09] px-2 py-0.5 rounded-full border border-white/5">
                    {stage.latency}
                  </span>
                </div>

                <div className="text-sm font-bold text-[#F5F7F5] truncate mb-0.5">
                  {stage.title}
                </div>
                <div className="text-[11px] text-[#A3ADA6] truncate">
                  {stage.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="bg-[#101512] border border-white/10 rounded-2xl p-6 sm:p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Stage Overview */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#43D6A0] bg-[#43D6A0]/10 border border-[#43D6A0]/20 px-2.5 py-0.5 rounded-md">
                {selected.badge}
              </span>
              <span className="text-xs font-mono text-[#737F77]">
                Latency Budget: <strong className="text-[#F5F7F5]">{selected.latency}</strong>
              </span>
            </div>

            <h4 className="text-xl sm:text-2xl font-bold text-[#F5F7F5] tracking-tight mb-3">
              {selected.title} — {selected.subtitle}
            </h4>

            <p className="text-sm text-[#A3ADA6] leading-relaxed mb-6 font-normal">
              {selected.description}
            </p>

            {/* Metric pill tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {selected.metrics.map((m) => (
                <div key={m.label} className="bg-[#18221D] p-3 rounded-xl border border-white/5">
                  <span className="block text-[10px] uppercase font-mono text-[#737F77] mb-1">
                    {m.label}
                  </span>
                  <span className="block text-xs sm:text-sm font-semibold font-mono text-[#43D6A0]">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stage Execution Diagram Card */}
          <div className="lg:col-span-5 bg-[#080B09] border border-white/10 rounded-xl p-5 font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[#737F77] text-[11px]">
              <span>STAGE TELEMETRY INSPECTOR</span>
              <span className="text-[#43D6A0]">● SYNCHRONIZED</span>
            </div>

            <div className="space-y-2 text-[#A3ADA6]">
              <div className="flex justify-between">
                <span>Execution State:</span>
                <span className="text-[#F5F7F5] font-semibold">STAGE_ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>Feature Schema:</span>
                <span className="text-[#F5F7F5]">27-dim StandardScaler</span>
              </div>
              <div className="flex justify-between">
                <span>Verification Scope:</span>
                <span className="text-[#43D6A0]">['checkout', 'cart', 'auth']</span>
              </div>
              <div className="flex justify-between">
                <span>Cryptographic Digest:</span>
                <span className="text-[#737F77] truncate max-w-[140px]">sha256:7c4f19e...</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#737F77]">
              <span>Fail-Safe Policy:</span>
              <span className="text-[#43D6A0]">Fail-Open with Auditing</span>
            </div>
          </div>

        </div>
      </div>

      {/* Visual Disclaimer */}
      <div className="mt-4 text-center text-[11px] text-[#737F77] font-mono">
        Topology representation reflects multi-layer architectural routing. Actual execution timing depends on client connection latency.
      </div>
    </div>
  );
};
