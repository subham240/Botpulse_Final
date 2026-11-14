import React, { useState } from 'react';
import { ArrowDown, Cpu, Activity, ShieldAlert, Code2, Server, Database, GitBranch, Layers, CheckCircle } from 'lucide-react';

interface StageDetail {
  id: string;
  name: string;
  category: 'Ingress' | 'Processing' | 'ML Engine' | 'Decision';
  latency: string;
  conditional: boolean;
  description: string;
  inputs: string[];
  outputs: string[];
}

const STAGES: StageDetail[] = [
  {
    id: 'activity',
    name: 'Website Activity',
    category: 'Ingress',
    latency: '0ms',
    conditional: false,
    description: 'DOM interactions, network calls, and page lifecycle events triggered by real users, crawlers, or automation scripts.',
    inputs: ['Browser Session', 'HTTP Requests', 'Window Events'],
    outputs: ['Raw DOM events', 'Pointer telemetry', 'Request metadata'],
  },
  {
    id: 'tracker',
    name: 'JavaScript Behavioural Tracker (SDK)',
    category: 'Ingress',
    latency: '< 1.2ms (client-side)',
    conditional: false,
    description: 'Lightweight asynchronous beacon script (<12KB) capturing micro-movement coordinates, scroll acceleration, click jitter, and flight times.',
    inputs: ['PointerEvent', 'TouchEvent', 'ScrollEvent', 'Hardware Concurrency'],
    outputs: ['Encrypted telemetry payloads', 'Time-series vectors', 'Fingerprint hashes'],
  },
  {
    id: 'backend',
    name: 'FastAPI High-Throughput Ingestion Gateway',
    category: 'Processing',
    latency: '2.4ms',
    conditional: false,
    description: 'Async ASGI ingestion layer handling millions of telemetry pings per minute with zero impact on customer web delivery.',
    inputs: ['SDK Telemetry Packets', 'TLS Handshake fingerprint', 'Client IP & ASN'],
    outputs: ['Validated session state', 'De-duplicated time-series buffers'],
  },
  {
    id: 'features',
    name: 'Real-Time Feature Extraction Engine',
    category: 'Processing',
    latency: '3.1ms',
    conditional: false,
    description: 'Transforms raw cursor coordinates and timing deltas into structured mathematical features: Shannon entropy, polynomial curvature, and variance.',
    inputs: ['Time-series coordinates', 'Keystroke interval deltas', 'DOM navigation paths'],
    outputs: ['142-dimensional feature tensor', 'Trajectory curvature vector'],
  },
  {
    id: 'xgboost',
    name: 'Stage 1 — XGBoost Gradient Boosted Classifier',
    category: 'ML Engine',
    latency: '1.8ms',
    conditional: false,
    description: 'Fast tabular classification isolating blatant traditional automation (curl, phantomjs, headless scripts, out-of-order headers) with minimal computational footprint.',
    inputs: ['142-dimensional tabular feature vector', 'Header consistency flags'],
    outputs: ['Traditional bot probability', 'Anomaly confidence threshold'],
  },
  {
    id: 'lstm',
    name: 'Stage 2 — Bidirectional LSTM Behavioural Sequencer',
    category: 'ML Engine',
    latency: '6.5ms',
    conditional: true,
    description: 'Triggered when traffic bypasses initial tabular checks. Analyzes long-range temporal dependencies in cursor trajectories and hesitation curves.',
    inputs: ['Temporal sequence matrix (60 time steps)', 'Mouse trajectory tensors'],
    outputs: ['Synthetic motion likelihood', 'Cognitive dwell distribution'],
  },
  {
    id: 'rads1',
    name: 'Stage 3 — Resemble AI RAD-S1 AI-Agent Identifier',
    category: 'ML Engine',
    latency: '8.2ms',
    conditional: true,
    description: 'Conditional identification of autonomous AI agents (Claude, GPTBot, Perplexity, custom LLM tool wrappers). Inspects prompt injection fingerprints & autonomous browser traversal signatures.',
    inputs: ['Autonomous action sequences', 'AI crawler token profiles', 'Agent signature DB'],
    outputs: ['AI-Agent Family', 'Publisher Identity', 'Autonomous Intent (Good vs Rogue)'],
  },
  {
    id: 'risk',
    name: 'Multi-Modal Risk Evaluation Matrix',
    category: 'Decision',
    latency: '1.4ms',
    conditional: false,
    description: 'Synthesizes model probabilities, endpoint sensitivity (e.g., /checkout vs /blog), and historical ASN threat records into an unified 0-100 risk index.',
    inputs: ['XGBoost score', 'LSTM sequence anomaly', 'RAD-S1 agent metadata', 'Endpoint policy'],
    outputs: ['Unified Trust Score (0-100)', 'Risk Tier (Low/Moderate/High/Critical)'],
  },
  {
    id: 'decision',
    name: 'Autonomous Protection Decision & Enforcement',
    category: 'Decision',
    latency: '0.8ms',
    conditional: false,
    description: 'Dispatches targeted action back to Edge CDN or origin reverse proxy: transparent pass-through, silent proof-of-work challenge, rate limiting, or connection drop.',
    inputs: ['Unified Trust Score', 'Tenant Prevention Policy'],
    outputs: ['ALLOW', 'VERIFY (Cryptographic Challenge)', 'RATE LIMIT', 'BLOCK (WAF Rule)'],
  },
];

export const ArchitectureDiagram: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<StageDetail>(STAGES[4]); // default XGBoost

  return (
    <div className="w-full bg-surface-0 border border-white/10 rounded-2xl p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 mb-8">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-pulse-cyan">
            Layered & Conditional Pipeline
          </span>
          <h3 className="text-xl font-bold text-slate-100 mt-1">
            BotPulse Multi-Stage Detection Architecture
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-surface-1 px-3 py-1.5 rounded-lg border border-white/5">
          Conditional Execution: Only ambiguous sessions invoke deep neural & RAD-S1 layers
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Diagram Flow */}
        <div className="lg:col-span-7 space-y-3">
          {STAGES.map((stage, idx) => {
            const isSelected = selectedStage.id === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <div
                  onClick={() => setSelectedStage(stage)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-surface-2 border-pulse-cyan shadow-lg shadow-pulse-cyan/10'
                      : 'bg-surface-1 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                        isSelected ? 'bg-pulse-cyan text-void' : 'bg-surface-3 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-100">{stage.name}</span>
                        {stage.conditional && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Conditional
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {stage.category} • Inference: {stage.latency}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {isSelected ? 'Viewing' : 'Inspect'} →
                  </span>
                </div>

                {idx < STAGES.length - 1 && (
                  <div className="flex justify-center -my-1">
                    <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Column: Stage Deep Dive Panel */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="p-6 rounded-xl bg-surface-1 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-pulse-cyan/10 text-pulse-cyan border border-pulse-cyan/20 uppercase tracking-wider">
                {selectedStage.category}
              </span>
              <span className="text-xs font-mono text-slate-400">Latency: {selectedStage.latency}</span>
            </div>

            <h4 className="text-lg font-bold text-slate-100 mt-4">{selectedStage.name}</h4>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedStage.description}</p>

            {selectedStage.conditional && (
              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                <span className="font-semibold block mb-0.5">Conditional Trigger Condition:</span>
                Invoked only when earlier stages record anomalous variance or when suspicious automation signatures warrant deep sequential analysis.
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Input Telemetry Signals:
                </span>
                <ul className="space-y-1.5">
                  {selectedStage.inputs.map((inp, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-pulse-cyan" />
                      {inp}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Output Classifications / Artifacts:
                </span>
                <ul className="space-y-1.5">
                  {selectedStage.outputs.map((out, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      {out}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
