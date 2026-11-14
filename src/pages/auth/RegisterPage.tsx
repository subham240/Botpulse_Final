import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Building, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { MeshGradientShader } from '../../components/shaders/MeshGradientShader';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !workEmail || !organization || !password) {
      setError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setError('Please review and accept the Terms of Service.');
      return;
    }

    setIsLoading(true);
    try {
      await register(fullName, workEmail, organization, password);
      showToast('Workspace Created', `Welcome to BotPulse, ${fullName}.`, 'success');
      navigate('/app/overview');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the provided information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B09] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Restrained WebGPU mesh gradient background */}
      <MeshGradientShader speed={0.25} intensity={0.5} interactive={false} showNoise={true} />

      <div className="w-full max-w-lg bg-[#121A16]/95 border border-white/10 rounded-[28px] p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
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
          <h2 className="text-2xl font-bold text-[#F5F7F5] tracking-tight">Create Security Workspace</h2>
          <p className="text-xs text-[#A3ADA6] mt-1 font-mono">
            Get started with real-time behavioral traffic protection
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-mono text-[#A3ADA6] block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Chen"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-[#A3ADA6] block mb-1">Company / Team</label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Security"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-[#A3ADA6] block mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
              <input
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="sarah@acme.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-mono text-[#A3ADA6] block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-[#A3ADA6] block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737F77] absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080B09] border border-white/10 focus:border-[#43D6A0] text-xs text-[#F5F7F5] outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-[#080B09] text-[#43D6A0] focus:ring-0"
            />
            <label htmlFor="terms" className="text-[11px] text-[#A3ADA6]">
              I agree to the <span className="text-[#F5F7F5] underline">Terms of Service</span> and <span className="text-[#F5F7F5] underline">Privacy Policy</span>.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-full bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-bold text-sm transition-all shadow-[0_0_20px_rgba(67,214,160,0.3)] hover:shadow-[0_0_30px_rgba(67,214,160,0.5)] mt-3"
          >
            {isLoading ? 'Creating Workspace...' : 'Create Account ↗'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-[#A3ADA6]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#43D6A0] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
