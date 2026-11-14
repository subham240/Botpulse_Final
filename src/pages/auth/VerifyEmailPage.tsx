import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export const VerifyEmailPage: React.FC = () => {
  const [code, setCode] = useState(['4', '8', '2', '', '', '']);
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Email Verified', 'Organization security profile validated.', 'success');
    navigate('/app/overview');
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 cyber-grid relative overflow-hidden">
      <div className="w-full max-w-md bg-surface-1 border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-md text-center">
        <div className="w-12 h-12 rounded-xl bg-pulse-cyan/10 border border-pulse-cyan/30 flex items-center justify-center text-pulse-cyan mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">Verify Corporate Email</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono mb-6">
          Enter the 6-digit cryptographic security code
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                defaultValue={code[idx]}
                className="w-10 h-12 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-center text-base font-mono font-bold text-white outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void shadow-md shadow-pulse-cyan/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Verify & Enter SOC</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span>Didn't receive token?</span>
          <button
            type="button"
            onClick={() => showToast('Token Re-sent', 'Fresh verification code dispatched.', 'info')}
            className="text-pulse-cyan hover:underline font-mono"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 cyber-grid relative overflow-hidden text-center">
      <div className="w-full max-w-md bg-surface-1 border border-rose-500/30 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-4">
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">403 — Unauthorized RBAC Tier</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Your current user role does not possess permissions to enact prevention rules or modify organizational API credentials. Switch roles via the profile dropdown in the header to demonstrate.
        </p>
        <Link
          to="/app/overview"
          className="px-4 py-2 rounded-lg bg-surface-2 border border-white/10 hover:border-white/20 text-xs font-mono text-slate-200 inline-block"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
};

export const SessionExpiredPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 cyber-grid relative overflow-hidden text-center">
      <div className="w-full max-w-md bg-surface-1 border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <h2 className="text-xl font-bold text-white">Session Security Timeout</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          Your active SOC analyst token has expired in accordance with continuous zero-trust security policies. Please re-authenticate.
        </p>
        <Link
          to="/login"
          className="px-5 py-2.5 rounded-xl bg-pulse-cyan text-void font-bold text-xs inline-block"
        >
          Re-Authenticate Console
        </Link>
      </div>
    </div>
  );
};
