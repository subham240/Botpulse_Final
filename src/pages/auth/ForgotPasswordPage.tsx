import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#080B09] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#13A879]/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md bg-[#121A16] border border-white/10 rounded-[28px] p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-7 h-7 flex items-center justify-center text-[#43D6A0] group-hover:rotate-45 transition-transform duration-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="w-5 h-5"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                <circle cx="12" cy="12" r="1.5" fill="#43D6A0" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#F5F7F5] tracking-tight">BotPulse</span>
          </Link>
          <h2 className="text-2xl font-bold text-[#F5F7F5] tracking-tight">Password Recovery</h2>
          <p className="text-xs text-[#A3ADA6] mt-1 font-mono">
            Receive cryptographic reset instructions
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-[#43D6A0]/10 border border-[#43D6A0]/30 text-[#43D6A0] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F5F7F5]">Recovery Token Dispatched</h3>
            <p className="text-xs text-[#A3ADA6]">
              If an account exists for <strong className="text-[#F5F7F5]">{email}</strong>, you will receive a secure recovery token within 2 minutes.
            </p>
            <Link
              to="/reset-password"
              className="inline-block px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-[#43D6A0] text-[#080B09] shadow-[0_0_15px_rgba(67,214,160,0.3)]"
            >
              Simulate Resetting Password →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-[#A3ADA6] block mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-bold text-sm transition-all shadow-[0_0_20px_rgba(67,214,160,0.3)] mt-2"
            >
              Send Recovery Link
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-[#A3ADA6]">
          Remember password?{' '}
          <Link to="/login" className="text-[#43D6A0] font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
