import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Shield, Radio } from 'lucide-react';
import { MeshGradientShader } from '../../components/shaders/MeshGradientShader';
import { getApiBaseUrl } from '../../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('analyst@botpulse.io');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your work email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Authenticated', 'Welcome back to the BotPulse SOC console.', 'success');
      navigate('/app/overview');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('fetch') || msg.includes('NetworkError') || err.status === 530) {
        localStorage.removeItem('bp_api_url');
        setError('Tunnel endpoint reset to active proxy. Please click Sign In again.');
      } else {
        setError(msg || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B09] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Restrained WebGPU mesh gradient background */}
      <MeshGradientShader speed={0.25} intensity={0.5} interactive={false} showNoise={true} />

      <div className="w-full max-w-md bg-[#121A16]/95 border border-white/10 rounded-[28px] p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-7 h-7 flex items-center justify-center text-[#43D6A0] group-hover:rotate-45 transition-transform duration-300">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="w-6 h-6"
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
          <h2 className="text-2xl font-bold text-[#F5F7F5] tracking-tight">Sign In to SOC Console</h2>
          <p className="text-xs text-[#A3ADA6] mt-1 font-mono">
            Zero-Trust Behavioral Access
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#A3ADA6] block mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@domain.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] placeholder-[#737F77] outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-[#A3ADA6]">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-[#43D6A0] hover:underline font-mono">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#737F77] hover:text-[#F5F7F5]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-bold text-sm transition-all shadow-[0_0_20px_rgba(67,214,160,0.3)] hover:shadow-[0_0_30px_rgba(67,214,160,0.5)] mt-2"
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#A3ADA6]">
          Need access for your security team?{' '}
          <Link to="/register" className="text-[#43D6A0] font-semibold hover:underline">
            Register Workspace
          </Link>
        </div>

        {/* Live Zero-Trust Backend Tunnel Indicator */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#737F77] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#43D6A0] animate-pulse"></span>
            <span>Live Engine</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const url = prompt(
                'Enter Backend API Endpoint (or leave blank to use active Cloudflare Tunnel):',
                getApiBaseUrl()
              );
              if (url !== null) {
                const target = url.trim() || getApiBaseUrl();
                localStorage.setItem('bp_api_url', target);
                window.location.reload();
              }
            }}
            className="text-[#43D6A0] hover:underline"
          >
            Configure Engine
          </button>
        </div>
      </div>
    </div>
  );
};
