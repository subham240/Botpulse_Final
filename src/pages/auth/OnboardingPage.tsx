import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  Activity,
  CheckCircle2,
  Building,
  Globe,
  Code2,
  Terminal,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [orgName, setOrgName] = useState('Cyber Vanguard Corp');
  const [industry, setIndustry] = useState('E-Commerce & Retail');
  const [domainName, setDomainName] = useState('mystore.dev');
  const [environment, setEnvironment] = useState('Production');
  const [copied, setCopied] = useState(false);

  const { addSite } = useApp();
  const navigate = useNavigate();

  const handleFinish = () => {
    addSite(orgName, domainName);
    navigate('/app/overview');
  };

  const steps = [
    { num: 1, title: 'Welcome' },
    { num: 2, title: 'Organization' },
    { num: 3, title: 'Domain Registration' },
    { num: 4, title: 'Integration SDK' },
    { num: 5, title: 'SOC Ready' },
  ];

  return (
    <div className="min-h-screen bg-void flex flex-col justify-between p-6 cyber-grid relative overflow-hidden">
      <div className="radial-glow-cyan absolute inset-0 pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pulse-cyan to-pulse-blue flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-void stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm text-white">BotPulse Onboarding</span>
        </div>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
          {steps.map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === st.num
                    ? 'bg-pulse-cyan text-void'
                    : currentStep > st.num
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-surface-2 text-slate-500 border border-white/5'
                }`}
              >
                {currentStep > st.num ? '✓' : st.num}
              </span>
              <span className={currentStep === st.num ? 'text-white' : 'text-slate-500'}>
                {st.title}
              </span>
              {st.num < 5 && <span className="text-slate-700">―</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8 relative z-10">
        <div className="bg-surface-1 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pulse-cyan/20 to-pulse-blue/20 border border-pulse-cyan/30 flex items-center justify-center mx-auto text-pulse-cyan">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome to BotPulse SOC
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                You are about to establish continuous behavioral traffic intelligence across your web infrastructure. Let's configure your security perimeter in 3 quick steps.
              </p>
              <div className="p-4 rounded-xl bg-surface-2 border border-white/5 text-xs text-slate-400 text-left max-w-md mx-auto space-y-2">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sub-millisecond machine learning edge inference</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Nuanced autonomous AI-agent governance</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Demonstration telemetry ready for testing</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void shadow-md shadow-pulse-cyan/20 hover:opacity-95 transition-all inline-flex items-center gap-2"
              >
                <span>Begin Setup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* STEP 2: ORG SETUP */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-mono uppercase text-pulse-cyan font-semibold block mb-1">
                  Step 02 / 05
                </span>
                <h3 className="text-xl font-bold text-white">Organization Profile</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Specify your primary workspace and operational threat model.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">Industry Vertical</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white outline-none"
                  >
                    <option value="E-Commerce & Retail">E-Commerce & Retail (Cart Sniping Defense)</option>
                    <option value="SaaS & Cloud Platforms">SaaS & Cloud Platforms (Credential Stuffing)</option>
                    <option value="Financial Technology">Financial Technology (Transaction Fraud)</option>
                    <option value="Media & Publishing">Media & Publishing (Scraping Defense)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-pulse-cyan text-void hover:opacity-95 flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DOMAIN REGISTRATION */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-mono uppercase text-pulse-cyan font-semibold block mb-1">
                  Step 03 / 05
                </span>
                <h3 className="text-xl font-bold text-white">Register Monitored Domain</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the primary web domain you wish to inspect and protect.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">Domain URL</label>
                  <input
                    type="text"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    placeholder="e.g. mystore.com or app.platform.io"
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1.5">Environment</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Production', 'Staging / QA'].map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setEnvironment(env)}
                        className={`p-3 rounded-lg text-xs font-mono border text-left ${
                          environment === env
                            ? 'bg-pulse-cyan/15 border-pulse-cyan text-pulse-cyan font-bold'
                            : 'bg-surface-0 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface-2 border border-white/5 text-xs text-slate-400">
                  💡 Note: You can explore the pre-connected <strong>Elvara E-Commerce Demonstration</strong> (<code className="font-mono text-slate-200">elvara.store</code>) immediately after setup.
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-pulse-cyan text-void hover:opacity-95 flex items-center gap-1.5"
                >
                  <span>Generate Sensor Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: INTEGRATION INTRODUCTION */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-xs font-mono uppercase text-pulse-cyan font-semibold block mb-1">
                  Step 04 / 05
                </span>
                <h3 className="text-xl font-bold text-white">Embed Behavioural Beacon</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Embed this script before the closing <code className="font-mono text-slate-300">&lt;/head&gt;</code> tag of {domainName}.
                </p>
              </div>

              <div className="relative p-4 rounded-xl bg-surface-0 border border-white/10 font-mono text-xs text-slate-200">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src="https://cdn.botpulse.io/v1/sensor.js" data-site-id="bp_live_89fe4a1" async></script>`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded bg-surface-2 hover:bg-surface-3 text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="text-slate-300 overflow-x-auto leading-relaxed">
{`<script
  src="https://cdn.botpulse.io/v1/sensor.js"
  data-site-id="bp_live_89fe4a1"
  data-domain="${domainName}"
  async
></script>`}
                </pre>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Sensor validation channel listening on edge worker nodes.</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-pulse-cyan text-void hover:opacity-95 flex items-center gap-1.5"
                >
                  <span>Verify Connection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: READY */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                SOC Workspace Ready
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Domain <strong>{domainName}</strong> and your demonstration telemetry stream have been provisioned. You now have full access to live monitoring, threat intelligence, and AI-agent tracking.
              </p>

              <button
                onClick={handleFinish}
                className="px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void shadow-xl shadow-pulse-cyan/20 hover:opacity-95 transition-all inline-flex items-center gap-2"
              >
                <span>Launch BotPulse Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Notice */}
      <div className="max-w-4xl mx-auto w-full text-center text-[11px] font-mono text-slate-600 relative z-10">
        BotPulse Cybersecurity Architecture • Frontend Demonstrator Mode Active
      </div>
    </div>
  );
};
