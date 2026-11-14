import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  Bot,
  User,
  Activity,
  ArrowRight,
  Eye,
  Sliders,
  BarChart3,
  Layers,
  Search,
  Lock,
} from 'lucide-react';

export const PlatformPage: React.FC = () => {
  const capabilities = [
    {
      title: 'Traffic Monitoring',
      desc: 'Sub-millisecond ingress monitoring across every HTTP request, web socket connection, and API payload with zero origin latency.',
      icon: Eye,
      color: 'text-pulse-cyan',
    },
    {
      title: 'Behavioural Analysis',
      desc: 'Evaluates micro-pointer entropy, acceleration curves, keystroke flight times, and scroll jitter to distinguish organic human actions from synthetic automation.',
      icon: Activity,
      color: 'text-emerald-400',
    },
    {
      title: 'Tri-Category Bot Classification',
      desc: 'Differentiates benign web crawlers (Google, Bing) from advanced headless browser scripts (Playwright, Puppeteer) and distributed botnets.',
      icon: Bot,
      color: 'text-rose-400',
    },
    {
      title: 'Autonomous AI-Agent Identification',
      desc: 'Identifies autonomous LLM browser agents (Claude Code, Perplexity, GPTBot, custom agent tool calls) using multi-factor prompt fingerprinting.',
      icon: Cpu,
      color: 'text-purple-400',
    },
    {
      title: 'Deep Session-Level Investigation',
      desc: 'Full 2D pointer telemetry replay, chronological event timelines, and multi-model probability scoring for security analysts.',
      icon: Search,
      color: 'text-amber-400',
    },
    {
      title: 'Multi-Modal Risk Evaluation',
      desc: 'Calculates continuous 0-100 risk indexes by fusing sequential LSTM tensors, XGBoost probabilities, and ASN threat intelligence.',
      icon: Sliders,
      color: 'text-blue-400',
    },
    {
      title: 'Autonomous Threat Prevention',
      desc: 'Dispatches instant edge mitigations: transparent allow, cryptographic proof-of-work challenge, adaptive rate limiting, or connection termination.',
      icon: Lock,
      color: 'text-rose-400',
    },
    {
      title: 'Granular Traffic Analytics',
      desc: 'Interactive multidimensional breakdowns by traffic origin, path vulnerability, autonomous agent family, and mitigation telemetry.',
      icon: BarChart3,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="w-full py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-pulse-cyan block mb-2">
            The BotPulse Platform
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Unified Behavioral Traffic Intelligence & AI-Agent Governance
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            BotPulse provides security engineering and fraud teams with real-time visibility, continuous risk scoring, and autonomous mitigation across all web traffic.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="p-6 rounded-2xl bg-surface-1 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-surface-2 border border-white/10 flex items-center justify-center ${cap.color} mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{cap.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA banner */}
        <div className="p-8 lg:p-12 rounded-2xl bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white">Explore the Live Security Operations Center</h3>
            <p className="text-xs text-slate-400 mt-1">
              Test real-time event feeds, pointer replays, and mitigation rules in the interactive demonstration console.
            </p>
          </div>
          <Link
            to="/app/overview"
            className="px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void shadow-lg shadow-pulse-cyan/20 hover:opacity-95 transition-all flex items-center gap-2 shrink-0"
          >
            Open Live Console
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
