import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Cpu, Database, Eye, Lock, ArrowRight, Check } from 'lucide-react';

export const SolutionsPage: React.FC = () => {
  const solutions = [
    {
      title: 'E-Commerce Protection & Inventory Defense',
      tag: 'E-COMMERCE',
      badge: 'Elvara Demo Case',
      icon: ShoppingBag,
      desc: 'Prevent automated cart sniping, rapid checkout scripts, and distributed inventory hoarding campaigns that deplete high-demand stock before genuine shoppers can purchase.',
      points: [
        'Blocks rapid programmatic add-to-cart bursts (< 150ms)',
        'Defends flash sales and limited releases without damaging checkout conversion',
        'Validates organic human hesitation curves during card and address entry',
        'Demonstrated in live e-commerce telemetry via the Elvara demo store integration',
      ],
      linkText: 'Inspect Elvara Demo Integration',
      linkPath: '/app/integrations',
    },
    {
      title: 'Advanced & Stealth Bot Detection',
      tag: 'AUTOMATION DEFENSE',
      icon: ShieldCheck,
      desc: 'Defeat headless browsers, stealth Playwright frameworks, and residential proxy rotators that evade traditional IP reputation blacklists and simple user-agent checks.',
      points: [
        'Pointer entropy analysis detects linear Cartesian mouse movements',
        'Catches spoofed canvas, audio, and WebGL device fingerprints',
        'Mitigates credential stuffing attacks against authentication endpoints',
        'Zero intrusive puzzles — seamless transparent challenge protocols',
      ],
      linkText: 'View Threat Intelligence SOC',
      linkPath: '/app/threats',
    },
    {
      title: 'Autonomous AI-Agent Monitoring & Governance',
      tag: 'AI GOVERNANCE',
      icon: Cpu,
      desc: 'Gain granular visibility into autonomous LLM agents crawling or executing natural language commands across your web interfaces.',
      points: [
        'Identifies major agent families (Claude, Perplexity, OpenAI, custom LLM toolkits)',
        'Differentiates respectful search indexing from aggressive content exfiltration',
        'Enforces granular rate-limiting and AI agent terms of service',
        'Conditional RAD-S1 signature detection model keeps operational latency minimal',
      ],
      linkText: 'View AI Agent Console',
      linkPath: '/app/agents',
    },
    {
      title: 'Web Scraping & Data Exfiltration Defense',
      tag: 'DATA PROTECTION',
      icon: Database,
      desc: 'Safeguard proprietary product catalogs, pricing databases, research publications, and user profiles from automated content harvesters.',
      points: [
        'Thwarts competitor price monitoring and catalog mirroring scripts',
        'Detects distributed pagination traversals across thousands of residential IPs',
        'Dynamic honeytoken detection isolates automated API scrapers immediately',
        'Reduces server infrastructure bandwidth and database load spikes',
      ],
      linkText: 'Explore Prevention Policies',
      linkPath: '/app/prevention',
    },
    {
      title: 'Automated Traffic Intelligence',
      tag: 'SECURITY OPS',
      icon: Eye,
      desc: 'Provide your security operations center with clear telemetry: understand exactly who is hitting your edge and what their intentions are.',
      points: [
        'Real-time streaming event inspection with sub-millisecond precision',
        'Actionable risk scoring (0-100) per session and per autonomous actor',
        'Exportable compliance audit trails and security analytics reports',
        'Unified dashboard multi-tenancy across all customer web domains',
      ],
      linkText: 'Open Live Traffic Monitor',
      linkPath: '/app/live',
    },
    {
      title: 'Website Security & Reverse Proxy Integration',
      tag: 'INFRASTRUCTURE',
      icon: Lock,
      desc: 'Deploy BotPulse as an edge reverse proxy worker (Cloudflare, AWS CloudFront, Fastly) or an asynchronous JavaScript sensor in minutes.',
      points: [
        'Plug-and-play JavaScript SDK loads asynchronously (<12KB footprint)',
        'Sub-millisecond verification API for backend REST and GraphQL endpoints',
        'Compatible with Next.js, React, Node.js, Python FastAPI, and static HTML',
        'Configurable risk threshold dials per route sensitivity',
      ],
      linkText: 'View Developer SDK Docs',
      linkPath: '/docs',
    },
  ];

  return (
    <div className="w-full py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-pulse-cyan block mb-2">
            Targeted Solutions
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Specialized Defense for Modern Digital Platforms
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            From protecting high-velocity e-commerce storefronts like Elvara to governing autonomous AI agents across SaaS applications, BotPulse delivers purpose-built behavioural security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((sol) => {
            const Icon = sol.icon;
            return (
              <div
                key={sol.title}
                className="p-6 rounded-2xl bg-surface-1 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono uppercase text-pulse-cyan tracking-wider font-semibold">
                      {sol.tag}
                    </span>
                    {sol.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {sol.badge}
                      </span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-surface-2 border border-white/10 flex items-center justify-center text-pulse-cyan mb-4">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{sol.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">{sol.desc}</p>

                  <div className="space-y-2 mb-6">
                    {sol.points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Link
                    to={sol.linkPath}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-pulse-cyan hover:underline"
                  >
                    {sol.linkText} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
