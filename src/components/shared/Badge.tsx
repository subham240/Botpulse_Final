import React from 'react';
import { VisitorCategory, RiskLevel, EnforcementDecision, ThreatStatus } from '../../types';

interface BadgeProps {
  variant?: 'category' | 'risk' | 'decision' | 'threat' | 'custom';
  value: VisitorCategory | RiskLevel | EnforcementDecision | ThreatStatus | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'custom', value, className = '' }) => {
  let style = 'bg-surface-2 text-slate-300 border-white/10';
  let label = String(value);

  if (variant === 'category' || value === 'human' || value === 'traditional_bot' || value === 'advanced_bot' || value === 'ai_agent') {
    switch (value) {
      case 'human':
        style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        label = 'Human Visitor';
        break;
      case 'ai_agent':
        style = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        label = 'AI Agent';
        break;
      case 'traditional_bot':
        style = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        label = 'Traditional Bot';
        break;
      case 'advanced_bot':
        style = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        label = 'Advanced Bot';
        break;
    }
  } else if (variant === 'risk' || value === 'low' || value === 'moderate' || value === 'high' || value === 'critical') {
    switch (value) {
      case 'low':
        style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        label = 'Low Risk';
        break;
      case 'moderate':
        style = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        label = 'Moderate';
        break;
      case 'high':
        style = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        label = 'High Risk';
        break;
      case 'critical':
        style = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        label = 'Critical Risk';
        break;
    }
  } else if (variant === 'decision' || value === 'allow' || value === 'verify' || value === 'rate_limit' || value === 'block') {
    switch (value) {
      case 'allow':
        style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        label = 'ALLOW';
        break;
      case 'verify':
        style = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
        label = 'VERIFY';
        break;
      case 'rate_limit':
        style = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        label = 'RATE LIMIT';
        break;
      case 'block':
        style = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        label = 'BLOCK';
        break;
    }
  } else if (variant === 'threat') {
    switch (value) {
      case 'new':
        style = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        label = 'New Alert';
        break;
      case 'investigating':
        style = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        label = 'Investigating';
        break;
      case 'confirmed':
        style = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        label = 'Confirmed Threat';
        break;
      case 'resolved':
        style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        label = 'Resolved';
        break;
      case 'false_positive':
        style = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        label = 'False Positive';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border tracking-wide uppercase ${style} ${className}`}
    >
      {label}
    </span>
  );
};
