import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Bot,
  User,
  Cpu,
  Activity,
  CheckCircle2,
  Lock,
  Zap,
  Sliders,
  Maximize2,
  Crosshair,
  PenTool,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Eye,
  Radio,
  Sparkles
} from 'lucide-react';
import { MeshGradientShader } from '../../components/shaders/MeshGradientShader';
import { NeuralPipelineVisualization } from '../../components/shaders/NeuralPipelineVisualization';

export const HomePage: React.FC = () => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(
      '<script src="https://cdn.botpulse.io/v1/botpulse.js" data-site-key="site_live_bp89f2a"></script>'
    );
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="w-full bg-[#080B09] text-[#F5F7F5] selection:bg-[#43D6A0]/20 selection:text-[#43D6A0] overflow-hidden">
      {/* =========================================================================
          1. HERO SECTION (WEBGPU SHADERS.COM MESH GRADIENT + RELEVANT CYBERSECURITY VISUALS)
         ========================================================================= */}
      <section className="relative pt-6 pb-20 lg:pt-14 lg:pb-32 overflow-hidden">
        {/* Shaders.com WebGPU / WebGL2 dark emerald mesh-gradient with cursor tracking */}
        <MeshGradientShader speed={0.5} interactive={true} intensity={1.1} showNoise={true} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: HERO CONTENT */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Small pill tag matching screenshot */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#121A16]/80 text-xs font-medium text-[#A3ADA6] mb-8 backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-pulse" />
                <span className="tracking-wide font-mono">AI TRAFFIC INTELLIGENCE</span>
              </div>

              {/* Headline with editorial italic serif accent */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold text-[#F5F7F5] tracking-tight leading-[1.08] mb-6">
                Manage your<br />
                traffic easily and<br />
                <span className="font-serif italic font-normal text-[#F5F7F5] tracking-normal">
                  with confidence
                </span>
              </h1>

              {/* Supporting description */}
              <p className="text-base sm:text-lg text-[#A3ADA6] max-w-xl leading-relaxed mb-8 font-normal">
                BotPulse empowers you to securely manage, smartly track, and effortlessly protect your web traffic with powerful, three-layer behavioral AI detection and prevention.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full transition-all duration-200 shadow-[0_0_25px_rgba(67,214,160,0.35)] hover:shadow-[0_0_35px_rgba(67,214,160,0.55)] group"
                >
                  <span>Get Started</span>
                  <span className="text-lg leading-none transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </Link>

                <Link
                  to="/platform"
                  className="inline-flex items-center justify-center gap-2 bg-[#18221D]/80 hover:bg-[#18221D] border border-white/10 text-[#F5F7F5] font-medium text-sm sm:text-base px-7 py-3.5 rounded-full transition-all duration-200 backdrop-blur-md hover:border-white/20"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: RELEVANT CYBERSECURITY TELEMETRY MOCKUPS */}
            <div className="lg:col-span-6 relative w-full pt-4 lg:pt-0">
              {/* Soft emerald backdrop aura */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#13A879]/20 via-[#063B2D]/15 to-transparent blur-3xl -z-10 rounded-full" />

              <div className="relative w-full max-w-[500px] mx-auto">
                
                {/* 1. TOP FLOATING CARD: Zero-Trust Security Console Preview */}
                <div className="relative lg:absolute lg:-top-10 lg:right-0 w-full sm:w-[320px] bg-[#121A16]/95 border border-white/10 rounded-[24px] p-5 shadow-2xl backdrop-blur-xl z-20 mb-6 lg:mb-0 transition-transform hover:-translate-y-1 duration-300">
                  {/* Status header */}
                  <div className="flex items-center justify-between text-xs text-[#A3ADA6] mb-3">
                    <span className="font-semibold text-[#F5F7F5] font-mono">9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3ADA6]" />
                      <span className="text-[10px] font-mono">5G</span>
                      <div className="w-4 h-2 border border-[#A3ADA6] rounded-sm p-[1px] flex items-center">
                        <div className="w-full h-full bg-[#43D6A0] rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-base font-bold text-[#F5F7F5] tracking-tight block">Security Console</span>
                      <span className="text-[10px] text-[#A3ADA6]">Zero-Trust Edge Gateway</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#43D6A0] bg-[#43D6A0]/10 border border-[#43D6A0]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-pulse" />
                      ACTIVE
                    </span>
                  </div>

                  {/* Two comparison metric boxes (Human vs Threats Blocked) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Verified Human Traffic */}
                    <div className="bg-[#18221D] p-3 rounded-xl border border-white/5">
                      <span className="block text-[10px] uppercase font-mono text-[#A3ADA6] mb-1">Human Traffic</span>
                      <span className="block text-base sm:text-lg font-bold text-[#F5F7F5] font-mono">142,890</span>
                      <span className="block text-[10px] text-[#43D6A0] mt-0.5 font-medium">+18.4% genuine</span>
                    </div>

                    {/* Filtered Bot Threats */}
                    <div className="bg-[#18221D] p-3 rounded-xl border border-white/5">
                      <span className="block text-[10px] uppercase font-mono text-[#A3ADA6] mb-1">Bots Blocked</span>
                      <span className="block text-base sm:text-lg font-bold text-[#F5F7F5] font-mono">38,410</span>
                      <span className="block text-[10px] text-[#A3ADA6] mt-0.5 font-medium">99.8% precision</span>
                    </div>
                  </div>
                </div>

                {/* 2. MAIN CENTERPIECE CARD: Real-Time Traffic Velocity & Anomaly Spline */}
                <div className="w-full sm:w-[410px] bg-[#121A16]/95 border border-white/10 rounded-[24px] p-6 shadow-2xl backdrop-blur-xl z-10 transition-transform hover:-translate-y-1 duration-300">
                  {/* Metric Top Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-[#F5F7F5] tracking-tight font-mono">
                        181,300 <span className="text-xs text-[#A3ADA6] font-normal font-sans">req/hr</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs text-[#43D6A0] font-semibold mt-1">
                        <span>↗ +2.76%</span>
                        <span className="text-[#A3ADA6] font-normal">detection accuracy</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#A3ADA6] bg-[#18221D] px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                      <span>ML LATENCY</span>
                      <span className="text-[#43D6A0]">1.8ms</span>
                    </div>
                  </div>

                  {/* Spline Chart SVG with Glowing Emerald Path */}
                  <div className="relative w-full h-36 my-2">
                    {/* Y-axis tick marks */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-[#737F77]">
                      <span>32k</span>
                      <span>31k</span>
                      <span>30k</span>
                      <span>29k</span>
                      <span>28k</span>
                      <span>27k</span>
                    </div>

                    {/* Chart Container */}
                    <div className="ml-7 h-full relative">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 320 120"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#43D6A0" stopOpacity="0.25" />
                            <stop offset="70%" stopColor="#13A879" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#080B09" stopOpacity="0.0" />
                          </linearGradient>

                          <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#43D6A0" floodOpacity="0.75" />
                          </filter>
                        </defs>

                        {/* Subtle Grid Lines */}
                        <line x1="0" y1="20" x2="320" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="50" x2="320" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                        {/* Area Fill Under Curve */}
                        <path
                          d="M 0,85 C 30,80 50,45 80,42 C 110,39 125,75 155,70 C 185,65 200,45 230,48 C 260,51 280,30 310,24 L 310,120 L 0,120 Z"
                          fill="url(#emeraldGradient)"
                        />

                        {/* Glowing Spline Stroke Curve */}
                        <path
                          d="M 0,85 C 30,80 50,45 80,42 C 110,39 125,75 155,70 C 185,65 200,45 230,48 C 260,51 280,30 310,24"
                          fill="none"
                          stroke="#43D6A0"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          filter="url(#emeraldGlow)"
                        />

                        {/* Prominent Glowing Indicator Dot at the Endpoint */}
                        <circle cx="310" cy="24" r="5" fill="#43D6A0" filter="url(#emeraldGlow)" />
                        <circle cx="310" cy="24" r="9" fill="none" stroke="#43D6A0" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
                      </svg>
                    </div>
                  </div>

                  {/* X-axis Timestamps */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#737F77] pl-7 mt-2 pt-2 border-t border-white/5">
                    <span>10:00</span>
                    <span>12:00</span>
                    <span>14:00</span>
                    <span>16:00</span>
                    <span>18:00</span>
                  </div>

                  {/* Bottom Toolbar Icons (XGBoost, LSTM, RAD-S1, Fullscreen) */}
                  <div className="flex items-center justify-between text-[#737F77] pt-4 mt-3 border-t border-white/5">
                    <button className="hover:text-[#43D6A0] transition-colors p-1 flex items-center gap-1 text-[11px]" title="Stage 1: XGBoost">
                      <Crosshair className="w-4 h-4 text-[#43D6A0]" />
                      <span className="hidden sm:inline font-mono">L1</span>
                    </button>
                    <button className="hover:text-[#43D6A0] transition-colors p-1 flex items-center gap-1 text-[11px]" title="Stage 2: LSTM Kinematics">
                      <PenTool className="w-4 h-4 text-[#43D6A0]" />
                      <span className="hidden sm:inline font-mono">L2</span>
                    </button>
                    <button className="hover:text-[#43D6A0] transition-colors p-1 flex items-center gap-1 text-[11px]" title="Stage 3: RAD-S1 Agent Fingerprinting">
                      <Sliders className="w-4 h-4 text-[#43D6A0]" />
                      <span className="hidden sm:inline font-mono">L3</span>
                    </button>
                    <button className="hover:text-[#43D6A0] transition-colors p-1" title="SOC Fullscreen">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3. BACKGROUND PEEKING CARD: AI Agent Attribution */}
                <div className="hidden sm:block absolute -right-6 top-32 w-52 bg-[#18221D]/95 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md -z-10 opacity-90">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-[#F5F7F5] font-mono">AI AGENT DETECTED</span>
                    <span className="text-[#43D6A0] text-[10px] font-mono">RAD-S1</span>
                  </div>
                  <div className="text-xs font-bold text-[#F5F7F5] truncate">Perplexity / Claude-3</div>
                  <div className="text-[10px] text-[#A3ADA6] mt-1 font-mono">Risk: 42% • VERIFY</div>
                </div>

                {/* 4. BACKGROUND PEEKING CARD: Kinematic Jitter Analysis */}
                <div className="hidden sm:block absolute right-8 -bottom-8 w-52 bg-[#18221D]/95 border border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-md -z-10 opacity-90">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A3ADA6] font-mono text-[11px]">Kinematic Jitter</span>
                    <span className="text-[#43D6A0] font-bold font-mono">0.88</span>
                  </div>
                  <span className="block text-[10px] text-[#737F77] mt-0.5">Biological micro-tremors</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          2. "TRUSTED BY THE LEADERS" LOGO STRIP (MATCHING SCREENSHOT 1 & 2)
         ========================================================================= */}
      <section className="py-12 border-y border-white/[0.06] bg-[#101512]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#A3ADA6] font-medium mb-8">
            Trusted by the leaders
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-[#A3ADA6]/70 text-lg md:text-xl font-semibold">
            {/* BeReal. */}
            <span className="hover:text-[#F5F7F5] transition-colors font-sans tracking-tight">BeReal.</span>
            <span className="hidden md:inline text-white/10">|</span>

            {/* SOUNDCLOUD */}
            <span className="hover:text-[#F5F7F5] transition-colors font-sans uppercase tracking-widest text-sm font-bold">
              SOUNDCLOUD
            </span>
            <span className="hidden md:inline text-white/10">|</span>

            {/* flickr */}
            <span className="hover:text-[#F5F7F5] transition-colors font-serif lowercase text-xl font-normal">
              flickr
            </span>
            <span className="hidden md:inline text-white/10">|</span>

            {/* Medium */}
            <span className="hover:text-[#F5F7F5] transition-colors font-serif font-bold tracking-tight">
              Medium
            </span>
            <span className="hidden md:inline text-white/10">|</span>

            {/* TAGGED */}
            <span className="hover:text-[#F5F7F5] transition-colors font-sans uppercase tracking-wider text-sm font-bold">
              TAGGED
            </span>
            <span className="hidden md:inline text-white/10">|</span>

            {/* Pinterest */}
            <span className="hover:text-[#F5F7F5] transition-colors font-serif italic font-normal text-xl">
              Pinterest
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. FEATURE CARDS GRID: "Streamline finances with smart features" 
             -> "Streamline security with smart features" (MATCHING SCREENSHOT 2)
         ========================================================================= */}
      <section className="py-24 bg-[#080B09] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F5F7F5] tracking-tight leading-tight">
              Streamline security with<br />
              <span className="font-serif italic font-normal text-[#F5F7F5]">smart features</span>
            </h2>
          </div>

          {/* 3-Column Asymmetric Cards Grid matching Screenshot 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* CARD 1: Real-Time Telemetry Ingestion */}
            <div className="bg-[#121A16] border border-white/10 rounded-[28px] p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group shadow-lg min-h-[380px]">
              <div>
                <h3 className="text-xl font-bold text-[#F5F7F5] mb-2 tracking-tight">
                  Real-Time Ingestion
                </h3>
                <p className="text-sm text-[#A3ADA6] leading-relaxed mb-8">
                  Stream pointer trajectories, scroll dynamics, and micro-tremors in sub-millisecond windows.
                </p>
              </div>

              {/* Visual widget: Real-Time Ingestion Rate + Glowing Emerald Equalizer */}
              <div className="bg-[#18221D] rounded-2xl p-5 border border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold font-mono text-[#F5F7F5]">4,850 req/s</span>
                  <span className="text-xs text-[#43D6A0] font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-pulse" />
                    LIVE BEACON
                  </span>
                </div>

                {/* Glowing vertical telemetry pill bars */}
                <div className="flex items-end justify-between h-24 px-2 gap-2">
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[45%]" />
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[75%] shadow-[0_0_10px_rgba(67,214,160,0.4)]" />
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[35%]" />
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[90%] shadow-[0_0_12px_rgba(67,214,160,0.5)]" />
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[60%]" />
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[100%] shadow-[0_0_15px_rgba(67,214,160,0.6)]" />
                  <div className="w-3 bg-gradient-to-t from-[#063B2D] to-[#43D6A0] rounded-full h-[50%]" />
                </div>
              </div>
            </div>

            {/* CARD 2: Automated Forensic Threat Reports */}
            <div className="bg-[#121A16] border border-white/10 rounded-[28px] p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group shadow-lg min-h-[380px]">
              {/* Visual widget at TOP */}
              <div className="bg-[#18221D] rounded-2xl p-6 border border-white/5 relative min-h-[170px] flex items-center justify-center overflow-hidden mb-6">
                {/* Back card */}
                <div className="absolute top-4 w-4/5 h-20 bg-[#121A16] border border-[#13A879]/30 rounded-xl transform -rotate-3 opacity-60" />
                
                {/* Front card */}
                <div className="relative w-full bg-[#101512] border border-[#43D6A0]/40 rounded-xl p-4 shadow-xl z-10">
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <span className="text-xs font-semibold text-[#F5F7F5] font-mono">Incident #84920</span>
                    <span className="text-[10px] text-[#43D6A0] font-mono bg-[#43D6A0]/10 px-1.5 py-0.5 rounded">AUTO-RESOLVED</span>
                  </div>
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between text-[#A3ADA6]">
                      <span>XGBoost Confidence:</span>
                      <span className="text-[#43D6A0]">99.2% Bot</span>
                    </div>
                    <div className="flex justify-between text-[#A3ADA6]">
                      <span>LSTM Kinematics:</span>
                      <span className="text-[#F5F7F5]">Linear Trajectory</span>
                    </div>
                    <div className="flex justify-between text-[#A3ADA6]">
                      <span>Signed Token Action:</span>
                      <span className="text-rose-400 font-bold">TERMINAL BLOCK</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text at BOTTOM */}
              <div>
                <h3 className="text-xl font-bold text-[#F5F7F5] mb-2 tracking-tight">
                  Automated Threat Reports
                </h3>
                <p className="text-sm text-[#A3ADA6] leading-relaxed">
                  Generate instant forensic summaries with full attribution for audit and compliance.
                </p>
              </div>
            </div>

            {/* CARD 3: Autonomous Threat Policy Engine */}
            <div className="bg-[#121A16] border border-white/10 rounded-[28px] p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group shadow-lg min-h-[380px]">
              <div>
                <h3 className="text-xl font-bold text-[#F5F7F5] mb-2 tracking-tight">
                  Autonomous Policies
                </h3>
                <p className="text-sm text-[#A3ADA6] leading-relaxed mb-8">
                  Dynamically challenge, rate-limit, or block based on continuous behavioral risk.
                </p>
              </div>

              {/* Visual widget: Traffic Classification Donut Chart */}
              <div className="bg-[#18221D] rounded-2xl p-6 border border-white/5 flex items-center justify-center relative">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" />
                    
                    {/* Ring segment 1 (35% mint - AI Agents) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#43D6A0"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="238.76"
                      strokeDashoffset="155"
                      strokeLinecap="round"
                    />

                    {/* Ring segment 2 (55% deep emerald - Human) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#13A879"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="238.76"
                      strokeDashoffset="107"
                      strokeLinecap="round"
                      opacity="0.9"
                    />

                    {/* Ring segment 3 (10% rose - Malicious Bots) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#EF4444"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="238.76"
                      strokeDashoffset="214"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </svg>

                  {/* Percentage tags */}
                  <span className="absolute top-1 left-2 text-[10px] font-mono text-rose-300 bg-[#121A16] px-1.5 py-0.5 rounded border border-rose-500/20" title="10% Bots Blocked">
                    10%
                  </span>
                  <span className="absolute top-10 right-0 text-[10px] font-mono text-[#43D6A0] bg-[#121A16] px-1.5 py-0.5 rounded border border-[#43D6A0]/20" title="35% AI Agents">
                    35%
                  </span>
                  <span className="absolute bottom-2 left-6 text-[10px] font-mono text-[#13A879] bg-[#121A16] px-1.5 py-0.5 rounded border border-[#13A879]/30" title="55% Verified Human">
                    55%
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          4. HOW BOTPULSE WORKS: INTERACTIVE DETECTION PIPELINE VISUALIZATION
         ========================================================================= */}
      <section className="py-24 border-t border-white/[0.06] bg-[#101512]/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Interactive Topology Component */}
          <NeuralPipelineVisualization />
        </div>
      </section>

      {/* =========================================================================
          5. INTEGRATION IN 60 SECONDS
         ========================================================================= */}
      <section className="py-20 bg-[#080B09]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#121A16] border border-white/10 rounded-[28px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#43D6A0]/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#43D6A0] block mb-2">
                  Zero-Friction Setup
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#F5F7F5] tracking-tight">
                  Integrate in one line of HTML
                </h3>
                <p className="text-sm text-[#A3ADA6] mt-2 max-w-lg">
                  Place our non-blocking JavaScript tracker right before the closing body tag. Compatible with React, Next.js, Shopify, WordPress, and custom stacks.
                </p>
              </div>

              <Link
                to="/docs"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#43D6A0] hover:underline whitespace-nowrap"
              >
                Read Integration Guide →
              </Link>
            </div>

            {/* Code Box */}
            <div className="bg-[#080B09] rounded-2xl border border-white/10 p-4 sm:p-5 font-mono text-xs sm:text-sm text-[#F5F7F5] flex items-center justify-between gap-4 overflow-x-auto shadow-inner">
              <span className="text-[#A3ADA6]">
                &lt;<span className="text-[#43D6A0]">script</span> <span className="text-[#F5F7F5]">src</span>=<span className="text-[#A3ADA6]">"https://cdn.botpulse.io/v1/botpulse.js"</span> <span className="text-[#F5F7F5]">data-site-key</span>=<span className="text-[#43D6A0]">"site_live_bp89f2a"</span>&gt;&lt;/<span className="text-[#43D6A0]">script</span>&gt;
              </span>

              <button
                onClick={copyCode}
                className="p-2 rounded-lg bg-[#18221D] hover:bg-[#1F2E27] border border-white/10 text-[#F5F7F5] transition-colors shrink-0 flex items-center gap-1.5"
                title="Copy snippet"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-4 h-4 text-[#43D6A0]" />
                    <span className="text-xs text-[#43D6A0]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FINAL CALL TO ACTION (CTA BANNER)
         ========================================================================= */}
      <section className="py-24 bg-gradient-to-b from-[#101512] to-[#080B09] border-t border-white/[0.06] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold text-[#F5F7F5] tracking-tight mb-6">
            Detect what isn't human.<br />
            <span className="font-serif italic font-normal text-[#43D6A0]">
              Protect your business today.
            </span>
          </h2>
          <p className="text-base text-[#A3ADA6] max-w-xl mx-auto mb-10 leading-relaxed">
            Join security engineers and forward-thinking platforms protecting user integrity against scraping, automated attacks, and autonomous AI-agents.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-semibold text-base px-8 py-4 rounded-full transition-all shadow-[0_0_25px_rgba(67,214,160,0.35)] hover:shadow-[0_0_35px_rgba(67,214,160,0.55)]"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/app/overview"
              className="inline-flex items-center gap-2 bg-[#18221D] hover:bg-[#1F2E27] border border-white/10 text-[#F5F7F5] font-medium text-base px-8 py-4 rounded-full transition-all"
            >
              Open Live Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
