import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Developer Sandbox',
      price: '$0',
      period: '/ month',
      desc: 'For local development, integration testing, and staging environments.',
      features: [
        'Up to 100,000 monthly telemetry events',
        'Single website integration',
        'XGBoost tabular feature screening',
        '24-hour log retention',
        'Community and issue support',
      ],
      cta: 'Start with sandbox',
      popular: false,
    },
    {
      name: 'Growth Security',
      price: '$180',
      period: '/ month',
      desc: 'For production platforms and fast-growing e-commerce storefronts.',
      features: [
        'Up to 2,500,000 monthly telemetry events',
        'Up to 5 production domains',
        'Bi-LSTM sequential trajectory analysis',
        'RAD-S1 agent identification',
        'Automated edge rate limiting rules',
        '30-day session replay retention',
        'Email and Slack alerts',
      ],
      cta: 'Get started with Growth',
      popular: true,
    },
    {
      name: 'Enterprise SOC',
      price: 'Custom',
      period: '',
      desc: 'For high-traffic platforms, retail, and security operations centers.',
      features: [
        'Unlimited monthly telemetry volume',
        'Unlimited web domains and edge proxy workers',
        'Custom fine-tuned Bi-LSTM model weights',
        'Dedicated SOC analyst onboarding',
        'Role-based access control (RBAC)',
        'Custom automated threat prevention webhooks',
        '1-year immutable audit log retention',
      ],
      cta: 'Contact enterprise team',
      popular: false,
    },
  ];

  return (
    <div className="w-full py-16 lg:py-24 bg-[#080B09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left-aligned clean heading */}
        <div className="max-w-2xl mb-16 text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-[#F5F7F5] tracking-tight mb-4">
            Predictable, transparent protection
          </h1>
          <p className="text-base text-[#A3ADA6] leading-relaxed font-normal">
            Every tier includes behavioral telemetry evaluation, zero intrusive CAPTCHAs, and real-time dashboard analytics.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16 text-left">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`p-6 sm:p-8 rounded-2xl flex flex-col justify-between border ${
                plan.popular
                  ? 'bg-[#101512] border-white/20'
                  : 'bg-[#101512] border-white/[0.08]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-[#F5F7F5]">{plan.name}</h3>
                  {plan.popular && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-[#43D6A0] bg-[#43D6A0]/10 border border-[#43D6A0]/20">
                      Recommended
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#A3ADA6] mb-6 leading-relaxed font-normal">{plan.desc}</p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl sm:text-4xl font-normal text-[#F5F7F5] font-mono">{plan.price}</span>
                  {plan.period && (
                    <span className="text-xs font-mono text-[#737F77]">{plan.period}</span>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-white/[0.08] mb-8">
                  <div className="text-[11px] font-mono text-[#737F77] mb-2">
                    Capabilities included:
                  </div>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[#A3ADA6]">
                      <Check className="w-3.5 h-3.5 text-[#43D6A0] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                to="/register"
                className={`w-full h-11 rounded-lg font-medium text-xs sm:text-sm inline-flex items-center justify-center transition-colors duration-150 ${
                  plan.popular
                    ? 'bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09]'
                    : 'bg-[#141C18] text-[#F5F7F5] hover:bg-[#18221D] border border-white/[0.08]'
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
