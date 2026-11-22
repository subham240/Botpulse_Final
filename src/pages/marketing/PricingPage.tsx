import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield, HelpCircle } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Developer Sandbox',
      price: '$0',
      period: '/ illustrative tier',
      desc: 'Ideal for local development, academic projects, and pre-production staging testing.',
      features: [
        'Up to 100,000 monthly telemetry events',
        'Single website integration (e.g. Elvara demo)',
        'XGBoost + standard behavioural scoring',
        '24-hour log retention',
        'Community Discord & Github support',
      ],
      cta: 'Start with Sandbox',
      popular: false,
    },
    {
      name: 'Growth Security',
      price: '$180',
      period: '/ illustrative example',
      desc: 'Engineered for scaling commercial platforms and fast-growing e-commerce storefronts.',
      features: [
        'Up to 2,500,000 monthly telemetry events',
        'Up to 5 production domains',
        'Full LSTM sequential neural analysis',
        'RAD-S1 AI-agent identification',
        'Automated edge rate limiting & challenge rules',
        '30-day session replay retention',
        'Email & Slack alerts integration',
      ],
      cta: 'Explore Growth Plan',
      popular: true,
    },
    {
      name: 'Enterprise SOC',
      price: 'Custom',
      period: '/ illustrative quote',
      desc: 'Tailored for high-traffic financial services, high-velocity retail, and enterprise security operations.',
      features: [
        'Unlimited monthly telemetry volume',
        'Unlimited web domains & reverse proxy workers',
        'Custom fine-tuned LSTM model weights',
        'Dedicated SOC analyst onboarding',
        'Role-based access control (RBAC)',
        'Custom automated threat prevention webhooks',
        '1-year immutable audit log retention',
      ],
      cta: 'Request Enterprise Briefing',
      popular: false,
    },
  ];

  return (
    <div className="w-full py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Transparent, Predictable Protection
          </h1>
          <p className="text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            All tiers include frictionless behavioural telemetry, zero intrusive CAPTCHAs, and real-time dashboard analytics.
          </p>

          <div className="mt-4 p-3 rounded-lg bg-surface-1/80 border border-white/10 text-xs font-mono text-slate-400 max-w-xl mx-auto">
            Note: Figures and plan names displayed below are strictly illustrative examples for the BotPulse technical demonstration.
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl flex flex-col justify-between border transition-all ${
                plan.popular
                  ? 'bg-surface-1 border-pulse-cyan/50 shadow-2xl shadow-pulse-cyan/10 relative'
                  : 'bg-surface-1 border-white/5'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-pulse-cyan text-void shadow-md">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white font-mono">{plan.price}</span>
                  <span className="text-xs font-mono text-slate-400">{plan.period}</span>
                </div>

                <div className="space-y-3 pt-6 border-t border-white/5 mb-8">
                  <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider block mb-2">
                    Included Capabilities:
                  </span>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/register"
                className={`w-full py-2.5 rounded-xl font-bold text-xs text-center transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void hover:opacity-95 shadow-md shadow-pulse-cyan/20'
                    : 'bg-surface-2 text-slate-200 border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
