import React, { useState } from 'react';
import { BookOpen, Code, Terminal, Shield, Zap, Settings, HelpCircle, ChevronRight, Copy, Check } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeDocSection, setActiveDocSection] = useState('getting-started');
  const [copied, setCopied] = useState(false);

  const docSections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'website-integration', title: 'Website Integration' },
    { id: 'sdk-setup', title: 'SDK Setup' },
    { id: 'api-overview', title: 'API Overview' },
    { id: 'behavioural-events', title: 'Behavioural Events' },
    { id: 'detection-architecture', title: 'Detection Architecture' },
    { id: 'threat-prevention', title: 'Threat Prevention' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
  ];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleSnippet = `<script
  src="https://cdn.botpulse.io/v1/sensor.js"
  data-site-id="bp_live_89fe4a1"
  data-domain="yourdomain.com"
  async
></script>`;

  return (
    <div className="w-full py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Docs Sidebar Nav */}
          <div className="md:col-span-3 sticky top-24 bg-surface-1 border border-white/5 rounded-2xl p-4 space-y-1 text-xs font-mono">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider px-3 py-2 font-bold">
              Documentation Nav
            </div>
            {docSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveDocSection(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  activeDocSection === sec.id
                    ? 'bg-surface-2 text-pulse-cyan font-bold border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{sec.title}</span>
                {activeDocSection === sec.id && <ChevronRight className="w-3.5 h-3.5 text-pulse-cyan" />}
              </button>
            ))}
          </div>

          {/* Docs Main Content Panel */}
          <div className="md:col-span-9 bg-surface-1 border border-white/5 rounded-2xl p-6 lg:p-10 text-slate-300">
            {activeDocSection === 'getting-started' && (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase text-pulse-cyan font-semibold block mb-1">
                    Introduction
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Getting Started with BotPulse
                  </h1>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    BotPulse is designed to integrate seamlessly without disrupting your existing technology stack. You can deploy it via client-side script beacon, edge reverse proxy worker (Cloudflare Workers, Fastly Compute), or server middleware.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-2 border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-2">3-Minute Quick Start</h3>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
                    <li>Register your website domain in the <a href="/app/integrations" className="text-pulse-cyan underline">Integrations Console</a>.</li>
                    <li>Copy your unique <code className="text-pulse-cyan font-mono">data-site-id</code> beacon token.</li>
                    <li>Add the asynchronous snippet to your root layout or HTML template.</li>
                    <li>Observe real-time telemetry streaming into the <a href="/app/live" className="text-pulse-cyan underline">Live Monitoring Dashboard</a>.</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-3">Client-Side Sensor Script</h3>
                  <div className="relative p-4 rounded-xl bg-surface-0 border border-white/5 font-mono text-xs text-slate-200">
                    <button
                      onClick={() => copyCode(sampleSnippet)}
                      className="absolute top-3 right-3 p-1.5 rounded bg-surface-2 hover:bg-surface-3 text-slate-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="overflow-x-auto">{sampleSnippet}</pre>
                  </div>
                </div>
              </div>
            )}

            {activeDocSection === 'website-integration' && (
              <div className="space-y-6">
                <span className="text-xs font-mono uppercase text-pulse-cyan font-semibold block mb-1">
                  Integration Guide
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Website Integration
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Learn how BotPulse interacts with web applications, e-commerce stores, and single-page applications (React, Next.js, Vue).
                </p>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 leading-relaxed">
                  <strong>Example Reference Integration:</strong> See our integration with <strong>Elvara</strong> (domain: <code className="font-mono">elvara.store</code>), showcasing high-volume e-commerce catalog protection and cart-sniping mitigation in the live console.
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <h4 className="text-sm font-bold text-white">Supported Deployment Modes:</h4>
                  <p>1. <strong>Asynchronous Client Beacon:</strong> Recommended for modern SPAs and static storefronts. Zero impact on Core Web Vitals and TTFB.</p>
                  <p>2. <strong>Cloudflare Worker / Edge Proxy:</strong> Inspects requests at the network edge before hitting origin servers, enabling instant block or cryptographic verify responses.</p>
                  <p>3. <strong>FastAPI / Node.js Middleware:</strong> Verifies session tokens on sensitive API routes such as <code className="font-mono text-pulse-cyan">/api/v1/auth</code> and <code className="font-mono text-pulse-cyan">/api/cart/checkout</code>.</p>
                </div>
              </div>
            )}

            {activeDocSection !== 'getting-started' && activeDocSection !== 'website-integration' && (
              <div className="space-y-6">
                <span className="text-xs font-mono uppercase text-pulse-cyan font-semibold block mb-1">
                  Developer Reference
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight capitalize">
                  {activeDocSection.replace('-', ' ')}
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Technical specifications, payload schema definitions, and implementation guides for the {activeDocSection.replace('-', ' ')} module.
                </p>

                <div className="p-4 rounded-xl bg-surface-2 border border-white/5 space-y-3 text-xs font-mono">
                  <div className="text-slate-400">SCHEMA: telemetry.event.v1</div>
                  <pre className="text-pulse-cyan overflow-x-auto">
{`{
  "event_id": "evt_908f2a11",
  "session_id": "sess_8b4c0e22",
  "domain": "elvara.store",
  "telemetry": {
    "pointer_entropy": 0.04,
    "scroll_acceleration": 0.01,
    "cartesian_linearity": 0.98,
    "keystroke_flight_variance": 0.02
  },
  "verdict": {
    "risk_score": 92,
    "classification": "advanced_bot",
    "enforcement": "block"
  }
}`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-2 text-xs text-slate-400">
                  Detailed SDK API reference documents are updated alongside each client library release.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
