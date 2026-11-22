import React, { useState } from 'react';

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
    title: 'Telemetry ingress',
    subtitle: 'Client event collection',
    status: 'active',
    latency: '< 1.2 ms',
    badge: 'Beacon ingestion',
    description: 'Collects cursor acceleration, angular curvature, micro-tremors, and DOM interaction timings asynchronously from the client.',
    metrics: [
      { label: 'Feature dimensions', value: '27 kinematic metrics' },
      { label: 'Sampling throttle', value: '45 ms interval' },
      { label: 'Client script size', value: '9.4 KB gzipped' }
    ]
  },
  {
    id: 'xgboost',
    number: '02',
    title: 'Layer 1: XGBoost',
    subtitle: 'Tabular feature screening',
    status: 'screening',
    latency: '1.8 ms',
    badge: 'Base classifier',
    description: 'Preprocessed through StandardScaler and evaluated across gradient-boosted trees. Identifies automated scripts and headless browsers in sub-2ms.',
    metrics: [
      { label: 'Model format', value: 'xgboost.joblib' },
      { label: 'Inference model', value: 'Binary tabular' },
      { label: 'Decision threshold', value: 'P(bot) > 0.75' }
    ]
  },
  {
    id: 'lstm',
    number: '03',
    title: 'Layer 2: Bi-LSTM',
    subtitle: 'Sequential trajectory analysis',
    status: 'screening',
    latency: '4.5 ms',
    badge: 'Deep kinematics',
    description: 'Evaluates interaction sequences over a sliding window. Detects synthetic linear paths, robotic pauses, and missing physiological hesitation.',
    metrics: [
      { label: 'Sequence length', value: '8–60 events' },
      { label: 'Window size', value: '1.5 s interaction' },
      { label: 'Evaluation', value: 'Kinematic entropy' }
    ]
  },
  {
    id: 'rad_s1',
    number: '04',
    title: 'Layer 3: RAD-S1',
    subtitle: 'Agent attribution engine',
    status: 'ready',
    latency: '3.2 ms',
    badge: 'Agent fingerprinting',
    description: 'Identifies autonomous web agents (Claude, Perplexity, GPTBot) by analyzing goal-directed navigation trees and TLS client hello fingerprints.',
    metrics: [
      { label: 'Detection logic', value: 'Multi-factor TLS & DOM' },
      { label: 'Attribution', value: 'Known crawler index' },
      { label: 'Header verification', value: 'FCrDNS + ASN check' }
    ]
  },
  {
    id: 'risk_engine',
    number: '05',
    title: 'Risk engine',
    subtitle: 'Cryptographic decision token',
    status: 'ready',
    latency: '< 0.8 ms',
    badge: 'Policy enforcement',
    description: 'Combines layer probabilities into a 0–100 risk score and issues a signed HMAC-SHA256 verdict token (allow, challenge, block).',
    metrics: [
      { label: 'Token format', value: 'HMAC-SHA256' },
      { label: 'Action tiers', value: 'Allow / Challenge / Drop' },
      { label: 'Edge overhead', value: '< 1 ms' }
    ]
  }
];

export const NeuralPipelineVisualization: React.FC = () => {
  const [activeStage, setActiveStage] = useState<string>('xgboost');

  const selected = PIPELINE_STAGES.find((s) => s.id === activeStage) || PIPELINE_STAGES[1];

  return (
    <div className="w-full bg-[#101512] border border-white/[0.08] rounded-2xl p-6 lg:p-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
        <div>
          <h3 className="text-xl sm:text-2xl font-normal text-[#F5F7F5] tracking-tight">
            Three-layer detection architecture
          </h3>
          <p className="text-sm text-[#A3ADA6] mt-1 font-normal">
            How biometrics pass through XGBoost tabular screening, sequential kinematics, and agent attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-[#141C18] px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-mono text-[#A3ADA6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0]" />
          <span>Cumulative latency: &lt; 10 ms</span>
        </div>
      </div>

      {/* Pipeline Nodes Row */}
      <div className="relative mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PIPELINE_STAGES.map((stage) => {
            const isSelected = stage.id === activeStage;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`p-3.5 rounded-xl text-left transition-colors duration-150 border ${
                  isSelected
                    ? 'bg-[#18221D] border-white/20 text-[#F5F7F5]'
                    : 'bg-[#141C18]/60 border-white/[0.06] text-[#A3ADA6] hover:bg-[#18221D]/60 hover:text-[#F5F7F5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-[#43D6A0]">
                    {stage.number}
                  </span>
                  <span className="text-[11px] font-mono text-[#737F77]">
                    {stage.latency}
                  </span>
                </div>

                <div className="text-sm font-medium text-[#F5F7F5] truncate mb-0.5">
                  {stage.title}
                </div>
                <div className="text-xs text-[#737F77] truncate">
                  {stage.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Panel */}
      <div className="bg-[#141C18] border border-white/[0.08] rounded-xl p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Stage Overview */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-[#43D6A0] bg-[#43D6A0]/10 border border-[#43D6A0]/20 px-2 py-0.5 rounded-md">
                {selected.badge}
              </span>
              <span className="text-xs font-mono text-[#737F77]">
                Latency: <span className="text-[#F5F7F5]">{selected.latency}</span>
              </span>
            </div>

            <h4 className="text-lg font-medium text-[#F5F7F5] tracking-tight mb-2">
              {selected.title} — {selected.subtitle}
            </h4>

            <p className="text-sm text-[#A3ADA6] leading-relaxed mb-6 font-normal">
              {selected.description}
            </p>

            {/* Metric tags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {selected.metrics.map((m) => (
                <div key={m.label} className="bg-[#18221D] p-3 rounded-lg border border-white/[0.06]">
                  <span className="block text-[11px] font-mono text-[#737F77] mb-1">
                    {m.label}
                  </span>
                  <span className="block text-xs font-medium font-mono text-[#F5F7F5]">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stage Execution Inspector */}
          <div className="lg:col-span-5 bg-[#080B09] border border-white/[0.08] rounded-lg p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] text-[#737F77] text-xs">
              <span>Stage telemetry</span>
              <span className="text-[#43D6A0] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0]" />
                Synchronized
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#A3ADA6]">
              <div className="flex justify-between">
                <span>Execution state:</span>
                <span className="text-[#F5F7F5]">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Feature vector:</span>
                <span className="text-[#F5F7F5]">27 dimensions</span>
              </div>
              <div className="flex justify-between">
                <span>Verification scope:</span>
                <span className="text-[#43D6A0]">['/checkout', '/login']</span>
              </div>
              <div className="flex justify-between">
                <span>Cryptographic digest:</span>
                <span className="text-[#737F77] truncate max-w-[140px]">sha256:7c4f19e...</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#737F77]">
              <span>Fail-safe policy:</span>
              <span className="text-[#F5F7F5]">Fail-open with telemetry logging</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
