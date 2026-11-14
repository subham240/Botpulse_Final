import React from 'react';
import { ArchitectureDiagram } from '../../components/shared/ArchitectureDiagram';
import { Cpu, ShieldCheck, Activity, GitBranch, Layers, Zap, Terminal } from 'lucide-react';

export const TechnologyPage: React.FC = () => {
  return (
    <div className="w-full py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-pulse-cyan block mb-2">
            Technical Architecture
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Sub-Millisecond Behavioural AI Pipeline
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            BotPulse replaces brittle static heuristics with a conditional, multi-tiered machine learning architecture. Fast tabular models filter high-volume attacks, while sequential deep learning models and RAD-S1 agent fingerprinters unpack sophisticated synthetic interactions.
          </p>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="mb-20">
          <ArchitectureDiagram />
        </div>

        {/* Deep Dive Engineering Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-surface-1 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Micro-Pointer Entropy</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Human hand tremor creates natural polynomial curvature and continuous velocity deltas. In contrast, synthetic automation scripts (even those with Bezier smoothing) leave distinctive mathematical regularity in coordinate spacing.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-surface-2 p-3 rounded-lg border border-white/5">
              Features: Curvature variance, acceleration jitter, click flight time delta.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-1 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Bidirectional LSTM Sequencer</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Sequential neural networks examine temporal sliding windows of session events. When an advanced bot executes a checkout flow in under 200ms per screen, the sequence model detects the unnatural cognitive transition immediately.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-surface-2 p-3 rounded-lg border border-white/5">
              Features: 60-step temporal tensor, dwell time distribution, DOM traversal sequence.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-1 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">RAD-S1 AI-Agent Attribution</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Conditional inspection isolates autonomous LLM browsers and AI research agents. BotPulse classifies whether an agent is an authorized research crawler (e.g. Claude, Perplexity) or a rogue competitor parser.
            </p>
            <div className="text-[11px] font-mono text-slate-400 bg-surface-2 p-3 rounded-lg border border-white/5">
              Features: Autonomous token profiling, header correlation, prompt injection fingerprints.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
