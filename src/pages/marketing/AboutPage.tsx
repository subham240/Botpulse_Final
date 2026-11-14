import React from 'react';
import { Shield, Target, Award, Users, Terminal, CheckCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-pulse-cyan block mb-2">
            About BotPulse
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Engineered for the Era of Autonomous Web Traffic
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            BotPulse was created to solve a fundamental shift in internet architecture: the rise of autonomous AI web agents, stealth automation frameworks, and distributed residential proxy networks that have rendered traditional security defenses obsolete.
          </p>
        </div>

        {/* Mission & Philosophy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="p-8 rounded-2xl bg-surface-1 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-pulse-cyan/10 border border-pulse-cyan/20 flex items-center justify-center text-pulse-cyan mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Frictionless by Design</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We believe genuine users should never solve an image puzzle or click crosswalks to access content. Security must be continuous, passive, and mathematically rigorous.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-1 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">AI-Agent Nuance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Not all automated traffic is malicious. Autonomous search and research agents are critical to modern discovery. BotPulse provides nuanced governance rather than blunt blocking.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-surface-1 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Explainable Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No black boxes. Every classification comes with actionable rationale, entropy scores, and chronological replay telemetry for security analysts.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="p-8 lg:p-12 rounded-2xl bg-surface-1 border border-white/10 max-w-4xl">
          <h2 className="text-xl font-bold text-white mb-4">Technical Commitments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-pulse-cyan shrink-0 mt-0.5" />
              <span><strong>Privacy First:</strong> No personal identifiable information (PII) is captured in client telemetry beacons.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-pulse-cyan shrink-0 mt-0.5" />
              <span><strong>Sub-Millisecond Edge Overhead:</strong> Edge workers execute in &lt; 2ms without degrading TTFB.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-pulse-cyan shrink-0 mt-0.5" />
              <span><strong>Transparent Standards:</strong> Clear differentiation between bots, human users, and verified autonomous agents.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-pulse-cyan shrink-0 mt-0.5" />
              <span><strong>Open Architecture:</strong> Extensible webhook and SIEM streaming interfaces for enterprise SOC teams.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
