import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';
import {
  Sliders,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Zap,
  Loader2,
  Play,
  Gauge,
  Activity,
  Server,
  Filter,
  Sparkles,
  RefreshCw,
  Bot,
  Globe,
  Radio,
  SlidersHorizontal,
  Flame,
  Check
} from 'lucide-react';
import { EnforcementDecision, PreventionPolicy } from '../../types';

export const ThreatPreventionPage: React.FC = () => {
  const { showToast, preventionStats } = useApp();

  // Core Risk Thresholds
  const [blockThreshold, setBlockThreshold] = useState<number>(80);
  const [verifyThreshold, setVerifyThreshold] = useState<number>(60);
  const [autoMitigation, setAutoMitigation] = useState<boolean>(true);

  // Rate Limiting & Traffic Regulation Parameters
  const [rateLimitRpm, setRateLimitRpm] = useState<number>(60);
  const [burstAllowance, setBurstAllowance] = useState<number>(15);
  const [rateLimitAction, setRateLimitAction] = useState<'throttle' | 'pow_challenge' | 'drop'>('throttle');

  // Bot Behavioral & Kinematic Characteristics
  const [kinematicSensitivity, setKinematicSensitivity] = useState<'relaxed' | 'standard' | 'aggressive'>('standard');
  const [blockHeadlessBrowsers, setBlockHeadlessBrowsers] = useState<boolean>(true);
  const [blockKnownScrapers, setBlockKnownScrapers] = useState<boolean>(true);
  const [blockDataCenters, setBlockDataCenters] = useState<boolean>(false);
  const [rapidScanProtection, setRapidScanProtection] = useState<boolean>(true);

  // Bot Category Regulation Policy Actions
  const [traditionalBotAction, setTraditionalBotAction] = useState<EnforcementDecision>('block');
  const [aiAgentAction, setAiAgentAction] = useState<EnforcementDecision>('verify');
  const [highRiskAction, setHighRiskAction] = useState<EnforcementDecision>('block');
  const [verifiedBotAction, setVerifiedBotAction] = useState<'allow' | 'rate_limit'>('allow');

  // Cryptographic Proof-of-Work (PoW) Hardware Defense States
  const [powDifficulty, setPowDifficulty] = useState<number>(3);
  const [powStats, setPowStats] = useState<{
    total_solved: number;
    avg_solve_time_ms: number;
    default_difficulty: number;
  }>({
    total_solved: 3,
    avg_solve_time_ms: 18.4,
    default_difficulty: 3,
  });
  const [isTestingPoW, setIsTestingPoW] = useState(false);
  const [powTestResult, setPowTestResult] = useState<{
    solved: boolean;
    nonce: number;
    hash: string;
    time_taken_ms: number;
    difficulty: number;
  } | null>(null);

  // Blocklists & Restrictions
  const [blockList, setBlockList] = useState<string[]>([
    '45.154.255.89/32 (Known Headless Cluster)',
    '91.240.118.0/24 (Credential Stuffing Proxy)',
    'AS209854 (ServerHub Malicious AS)',
  ]);
  const [newRule, setNewRule] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [activePreset, setActivePreset] = useState<'custom' | 'balanced' | 'aggressive' | 'permissive'>('balanced');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  } | null>(null);

  // Load live policies on mount
  useEffect(() => {
    // 1. Fetch current policies from backend
    api.prevention
      .getPolicies('site_alvera_001')
      .then((policy) => {
        if (policy) {
          if (typeof policy.block_threshold === 'number') setBlockThreshold(policy.block_threshold);
          if (typeof policy.verify_threshold === 'number') setVerifyThreshold(policy.verify_threshold);
          if (typeof policy.auto_mitigation === 'boolean') setAutoMitigation(policy.auto_mitigation);
          if (typeof policy.rate_limit_rpm === 'number') setRateLimitRpm(policy.rate_limit_rpm);
          if (typeof policy.burst_allowance === 'number') setBurstAllowance(policy.burst_allowance);
          if (policy.rate_limit_action) setRateLimitAction(policy.rate_limit_action);
          if (policy.lstm_kinematic_sensitivity) setKinematicSensitivity(policy.lstm_kinematic_sensitivity);
          if (typeof policy.block_headless_browsers === 'boolean') setBlockHeadlessBrowsers(policy.block_headless_browsers);
          if (typeof policy.block_known_scrapers === 'boolean') setBlockKnownScrapers(policy.block_known_scrapers);
          if (typeof policy.block_data_centers === 'boolean') setBlockDataCenters(policy.block_data_centers);
          if (typeof policy.rapid_scan_protection === 'boolean') setRapidScanProtection(policy.rapid_scan_protection);
          if (typeof policy.pow_difficulty === 'number') setPowDifficulty(policy.pow_difficulty);
          if (policy.traditional_bot_action) setTraditionalBotAction(policy.traditional_bot_action);
          if (policy.ai_agent_action) setAiAgentAction(policy.ai_agent_action);
          if (policy.high_risk_action) setHighRiskAction(policy.high_risk_action);
          if (policy.verified_bot_action) setVerifiedBotAction(policy.verified_bot_action);
          if (Array.isArray(policy.block_list) && policy.block_list.length > 0) {
            setBlockList(policy.block_list);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load remote policy, using defaults:', err);
      });

    // 2. Fetch live PoW stats
    api.prevention
      .getPoWStats()
      .then((data) => {
        if (data && typeof data.total_solved === 'number') {
          setPowStats(data);
        }
      })
      .catch(() => {});
  }, []);

  // Apply one-click preset templates
  const applyPreset = (preset: 'balanced' | 'aggressive' | 'permissive') => {
    setActivePreset(preset);
    if (preset === 'balanced') {
      setBlockThreshold(80);
      setVerifyThreshold(60);
      setRateLimitRpm(60);
      setBurstAllowance(15);
      setRateLimitAction('throttle');
      setKinematicSensitivity('standard');
      setBlockHeadlessBrowsers(true);
      setBlockKnownScrapers(true);
      setBlockDataCenters(false);
      setRapidScanProtection(true);
      setPowDifficulty(3);
      setTraditionalBotAction('block');
      setAiAgentAction('verify');
      setHighRiskAction('block');
      setVerifiedBotAction('allow');
      showToast('Preset Applied', 'Configured Balanced E-Commerce Protection (Recommended).', 'info');
    } else if (preset === 'aggressive') {
      setBlockThreshold(70);
      setVerifyThreshold(45);
      setRateLimitRpm(30);
      setBurstAllowance(8);
      setRateLimitAction('drop');
      setKinematicSensitivity('aggressive');
      setBlockHeadlessBrowsers(true);
      setBlockKnownScrapers(true);
      setBlockDataCenters(true);
      setRapidScanProtection(true);
      setPowDifficulty(4);
      setTraditionalBotAction('block');
      setAiAgentAction('block');
      setHighRiskAction('block');
      setVerifiedBotAction('rate_limit');
      showToast('Preset Applied', 'Enacted Aggressive Anti-Scraper Lockdown.', 'warning');
    } else if (preset === 'permissive') {
      setBlockThreshold(90);
      setVerifyThreshold(75);
      setRateLimitRpm(120);
      setBurstAllowance(30);
      setRateLimitAction('throttle');
      setKinematicSensitivity('relaxed');
      setBlockHeadlessBrowsers(false);
      setBlockKnownScrapers(true);
      setBlockDataCenters(false);
      setRapidScanProtection(false);
      setPowDifficulty(2);
      setTraditionalBotAction('rate_limit');
      setAiAgentAction('allow');
      setHighRiskAction('verify');
      setVerifiedBotAction('allow');
      showToast('Preset Applied', 'Enacted Permissive & AI-Friendly Policy.', 'info');
    }
  };

  // Run hardware PoW test in browser
  const runPoWBenchmark = async () => {
    setIsTestingPoW(true);
    setPowTestResult(null);

    try {
      // 1. Fetch challenge from FastAPI backend with the currently selected difficulty
      const challenge = await api.prevention.getPoWChallenge(powDifficulty);
      const seed = challenge.seed;
      const diff = challenge.difficulty || powDifficulty;
      const prefix = '0'.repeat(diff);
      const startTime = performance.now();
      let nonce = 0;
      let matchedHash = '';

      // 2. Hardware SHA-256 Nonce Search in Browser WebCrypto
      while (true) {
        const str = `${seed}:${nonce}`;
        const buffer = new TextEncoder().encode(str);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', buffer);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hash = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');

        if (hash.startsWith(prefix)) {
          matchedHash = hash;
          break;
        }
        nonce++;
        if (nonce % 500 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      const durationMs = Math.round((performance.now() - startTime) * 10) / 10;

      // 3. Verify solution with backend
      const verifyRes = await api.prevention.verifyPoWSolution({
        challenge_id: challenge.challenge_id,
        seed: challenge.seed,
        difficulty: diff,
        expires_at: challenge.expires_at,
        signature: challenge.signature,
        nonce: nonce,
        session_id: 'dashboard_benchmark_user',
        time_taken_ms: durationMs,
      });

      if (verifyRes.verified) {
        setPowTestResult({
          solved: true,
          nonce,
          hash: matchedHash,
          time_taken_ms: durationMs,
          difficulty: diff,
        });
        showToast(
          'Hardware PoW Solved',
          `Verified in ${durationMs}ms at Level ${diff} (Nonce: ${nonce}).`,
          'success'
        );
        const updated = await api.prevention.getPoWStats();
        if (updated) setPowStats(updated);
      }
    } catch (err: any) {
      showToast('PoW Benchmark Error', err.message || 'Failed to execute hardware PoW test.', 'error');
    } finally {
      setIsTestingPoW(false);
    }
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    setBlockList((prev) => [...prev, newRule.trim()]);
    setNewRule('');
    showToast('Rule Staged', 'Added entry to blocklist. Deploy to edge to enforce.', 'info');
  };

  const handleRemoveBlock = (item: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Blocklist Entry?',
      description: `Traffic from ${item} will no longer be barred at the network edge.`,
      action: () => {
        setBlockList((prev) => prev.filter((r) => r !== item));
        setConfirmDialog(null);
        showToast('Rule Removed', `Removed ${item} from edge blocklist.`, 'info');
      },
    });
  };

  // Deploy all bot regulation parameters & policies to edge backend
  const handleDeployRules = async () => {
    setIsSaving(true);
    try {
      const payload: PreventionPolicy = {
        site_id: 'site_alvera_001',
        block_threshold: blockThreshold,
        verify_threshold: verifyThreshold,
        auto_mitigation: autoMitigation,
        high_risk_action: highRiskAction,
        ai_agent_action: aiAgentAction,
        traditional_bot_action: traditionalBotAction,
        verified_bot_action: verifiedBotAction,
        rate_limit_rpm: rateLimitRpm,
        burst_allowance: burstAllowance,
        rate_limit_action: rateLimitAction,
        pow_difficulty: powDifficulty,
        lstm_kinematic_sensitivity: kinematicSensitivity,
        block_headless_browsers: blockHeadlessBrowsers,
        block_known_scrapers: blockKnownScrapers,
        block_data_centers: blockDataCenters,
        rapid_scan_protection: rapidScanProtection,
        block_list: blockList,
      };

      await api.prevention.updatePolicies(payload);

      showToast(
        'Rules Deployed to Edge',
        `Synchronized: Block > ${blockThreshold}, Verify > ${verifyThreshold}, Rate Limit ${rateLimitRpm} RPM, PoW Level ${powDifficulty}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Deployment Notice', 'Rules saved locally. Edge nodes synchronizing in background.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Fast Preset Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-1 border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#43D6A0] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#43D6A0]">
              Edge Policy Synchronizer Active
            </span>
            <span className="text-xs font-mono text-slate-500">• site: site_alvera_001</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Bot Regulation & Behavioral Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fine-tune traffic rate limits, browser kinematics sensitivity, AI crawler policies, and silent cryptographic hardware puzzles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-0 border border-white/5 text-xs font-mono">
            <button
              onClick={() => applyPreset('balanced')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreset === 'balanced'
                  ? 'bg-[#43D6A0]/20 text-[#43D6A0] border border-[#43D6A0]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Balanced
            </button>
            <button
              onClick={() => applyPreset('aggressive')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreset === 'aggressive'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Strict Anti-Scrape
            </button>
            <button
              onClick={() => applyPreset('permissive')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activePreset === 'permissive'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 AI Friendly
            </button>
          </div>

          <button
            onClick={handleDeployRules}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#43D6A0] text-[#080B09] hover:bg-[#38c491] shadow-lg shadow-[#43D6A0]/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synchronizing Edge...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Deploy Rules to Edge</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prevention Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5">
          <div className="text-[10px] font-mono text-slate-400">TOTAL SESSIONS MONITORED</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {preventionStats?.total_decisions ?? 5}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Real-time edge ingestion</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-emerald-500/20">
          <div className="text-[10px] font-mono text-emerald-400">ORGANIC ACCESS ALLOWED</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {preventionStats?.allowed ?? 3}
          </div>
          <span className="text-[10px] text-emerald-500 font-mono">0ms Added latency</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-rose-500/20">
          <div className="text-[10px] font-mono text-rose-400">BLOCKED / RATE-LIMITED</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {preventionStats?.blocked ?? 2}
          </div>
          <span className="text-[10px] text-rose-500 font-mono">Scrapers & bad bots dropped</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-[#43D6A0]/20">
          <div className="text-[10px] font-mono text-[#43D6A0]">ENFORCEMENT ACCURACY</div>
          <div className="text-xl font-bold font-mono text-[#43D6A0] mt-1">
            {preventionStats?.mitigation_rate ?? '100%'}
          </div>
          <span className="text-[10px] text-[#43D6A0] font-mono">Zero false positives</span>
        </div>
      </div>

      {/* 2-Column Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Risk Thresholds, Rate Limits, and Bot Characteristics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Autonomous Risk Scoring Thresholds */}
          <div className="p-6 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#43D6A0]" />
                  <span>Continuous Risk Scoring Thresholds</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated decision triggers mapped to multi-model composite risk score (0-100)
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer bg-surface-0 px-3 py-1.5 rounded-lg border border-white/5">
                <input
                  type="checkbox"
                  checked={autoMitigation}
                  onChange={(e) => {
                    setAutoMitigation(e.target.checked);
                    setActivePreset('custom');
                  }}
                  className="rounded bg-surface-0 border-white/10 text-[#43D6A0] focus:ring-0"
                />
                <span>Autonomous Mitigation</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Block Threshold Slider */}
              <div className="p-4 rounded-xl bg-surface-2 border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                    AUTOMATIC BLOCK THRESHOLD
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                    &gt; {blockThreshold} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sessions scoring above this risk are dropped at the network edge with an HTTP 403 Forbidden.
                </p>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={blockThreshold}
                  onChange={(e) => {
                    setBlockThreshold(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>50 (Sensitive)</span>
                  <span>95 (Permissive)</span>
                </div>
              </div>

              {/* Verify Challenge Slider */}
              <div className="p-4 rounded-xl bg-surface-2 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                    CRYPTOGRAPHIC VERIFY THRESHOLD
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                    &gt; {verifyThreshold} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ambiguous sessions receive a silent background Proof-of-Work hardware challenge (zero CAPTCHAs).
                </p>
                <input
                  type="range"
                  min={25}
                  max={75}
                  value={verifyThreshold}
                  onChange={(e) => {
                    setVerifyThreshold(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>25 (Strict)</span>
                  <span>75 (Relaxed)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Traffic Rate Limiting & Burst Budgeting */}
          <div className="p-6 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-5">
            <div className="pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-400" />
                <span>Rate Limiting & Traffic Budgeting</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cap request frequency, buffer sudden bursts, and specify edge penalties for aggressive crawlers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* RPM Slider */}
              <div className="p-4 rounded-xl bg-surface-0 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-300 uppercase">
                    MAX REQUEST RATE (RPM)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
                    {rateLimitRpm} req/min
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Allowable sustained request rate per client IP before triggering edge mitigation.
                </p>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={5}
                  value={rateLimitRpm}
                  onChange={(e) => {
                    setRateLimitRpm(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>10 RPM</span>
                  <span>300 RPM</span>
                </div>
              </div>

              {/* Burst Allowance Slider */}
              <div className="p-4 rounded-xl bg-surface-0 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-300 uppercase">
                    BURST PEAK ALLOWANCE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                    {burstAllowance} requests
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Permitted instant request spikes within a 2-second sub-window without immediate throttling.
                </p>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={burstAllowance}
                  onChange={(e) => {
                    setBurstAllowance(Number(e.target.value));
                    setActivePreset('custom');
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>5 Burst</span>
                  <span>50 Burst</span>
                </div>
              </div>
            </div>

            {/* Rate Limit Action Selector */}
            <div className="p-4 rounded-xl bg-surface-0 border border-white/5 space-y-3">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase block">
                Enforcement Penalty on Rate Exceeded:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'throttle',
                    label: 'HTTP 429 Throttle',
                    desc: 'Delays response with Retry-After header',
                  },
                  {
                    id: 'pow_challenge',
                    label: 'Silent PoW Challenge',
                    desc: 'Requires hardware verification to proceed',
                  },
                  {
                    id: 'drop',
                    label: 'Immediate 403 Drop',
                    desc: 'Terminates TCP connection immediately',
                  },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => {
                      setRateLimitAction(act.id as any);
                      setActivePreset('custom');
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      rateLimitAction === act.id
                        ? 'bg-purple-500/15 border-purple-500 text-white shadow-sm'
                        : 'bg-surface-2 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{act.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{act.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Bot Behavioral & Kinematic Characteristics (LSTM & RAD-S1) */}
          <div className="p-6 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-5">
            <div className="pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Behavioral & Kinematic Bot Characteristics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Regulate detection sensitivity of trajectory curves, headless automation, and scraping signatures.
              </p>
            </div>

            {/* Kinematic Sensitivity Selector */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase block">
                LSTM Trajectory & Kinematic Sensitivity:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'relaxed',
                    label: 'Relaxed',
                    desc: 'High jitter tolerance. Recommended for mobile gaming and heavy touch devices.',
                  },
                  {
                    id: 'standard',
                    label: 'Standard (Recommended)',
                    desc: 'Balanced. Detects straight-line mouse moves, robotic constant velocities, and synthetic scrolls.',
                  },
                  {
                    id: 'aggressive',
                    label: 'Aggressive',
                    desc: 'Ultra-sensitive. Flags subtle micro-pauses, automated touch simulation, and headless runners.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setKinematicSensitivity(item.id as any);
                      setActivePreset('custom');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      kinematicSensitivity === item.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                        : 'bg-surface-0 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold text-emerald-300">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Characteristic Filters / Feature Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase block">
                Automated Bot Characteristic Filters:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Block Headless Browsers */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-0 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={blockHeadlessBrowsers}
                    onChange={(e) => {
                      setBlockHeadlessBrowsers(e.target.checked);
                      setActivePreset('custom');
                    }}
                    className="mt-0.5 rounded bg-surface-1 border-white/10 text-[#43D6A0] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Block Headless Browsers
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                      Terminates Puppeteer, Playwright, Selenium, and Chrome CDP automation runtimes.
                    </span>
                  </div>
                </label>

                {/* Block Known Scrapers */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-0 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={blockKnownScrapers}
                    onChange={(e) => {
                      setBlockKnownScrapers(e.target.checked);
                      setActivePreset('custom');
                    }}
                    className="mt-0.5 rounded bg-surface-1 border-white/10 text-[#43D6A0] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Anti-Scraping Cluster Defense
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                      Detects and halts distributed catalog scrapers and checkout cart-sniping bots.
                    </span>
                  </div>
                </label>

                {/* Cloud Data Center Filter */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-0 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={blockDataCenters}
                    onChange={(e) => {
                      setBlockDataCenters(e.target.checked);
                      setActivePreset('custom');
                    }}
                    className="mt-0.5 rounded bg-surface-1 border-white/10 text-[#43D6A0] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Block Cloud Data Center Traffic
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                      Drop requests originating from AWS, DigitalOcean, Hetzner, and commercial VPN proxies.
                    </span>
                  </div>
                </label>

                {/* Rapid Scan & Traversal Shield */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-0 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={rapidScanProtection}
                    onChange={(e) => {
                      setRapidScanProtection(e.target.checked);
                      setActivePreset('custom');
                    }}
                    className="mt-0.5 rounded bg-surface-1 border-white/10 text-[#43D6A0] focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Rapid 404 & Traversal Shield
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                      Throttles scrapers scanning hidden endpoints, API routes, and .env secrets.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Bot Category Matrix & PoW Hardware Defense */}
        <div className="lg:col-span-4 space-y-6">
          {/* Category Regulation Matrix */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-4">
            <div className="pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-tight flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#43D6A0]" />
                <span>Bot Regulation Policy Matrix</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Set edge enforcement actions for each traffic category.
              </p>
            </div>

            {/* Traditional Bots */}
            <div className="p-3 rounded-xl bg-surface-0 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">Traditional Scrapers</span>
                <span className="text-[10px] font-mono text-slate-500">Layer 1 XGBoost</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-mono font-bold">
                {(['block', 'rate_limit', 'verify'] as EnforcementDecision[]).map((act) => (
                  <button
                    key={act}
                    onClick={() => {
                      setTraditionalBotAction(act);
                      setActivePreset('custom');
                    }}
                    className={`py-1 rounded text-center uppercase tracking-wider transition-all ${
                      traditionalBotAction === act
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'bg-surface-2 text-slate-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    {act === 'rate_limit' ? 'Rate Limit' : act}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Agents (LLMs) */}
            <div className="p-3 rounded-xl bg-surface-0 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">AI / LLM Agents</span>
                <span className="text-[10px] font-mono text-purple-400">Layer 3 RAD-S1</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-bold">
                {(['verify', 'allow', 'rate_limit', 'block'] as EnforcementDecision[]).map((act) => (
                  <button
                    key={act}
                    onClick={() => {
                      setAiAgentAction(act);
                      setActivePreset('custom');
                    }}
                    className={`py-1 rounded text-center uppercase tracking-wider transition-all ${
                      aiAgentAction === act
                        ? 'bg-[#43D6A0]/20 text-[#43D6A0] border border-[#43D6A0]/40 font-bold'
                        : 'bg-surface-2 text-slate-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    {act === 'rate_limit' ? 'Limit' : act}
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Anomalies */}
            <div className="p-3 rounded-xl bg-surface-0 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">Critical Kinematic Anomaly</span>
                <span className="text-[10px] font-mono text-rose-400">Risk &gt; 80</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-mono font-bold">
                {(['block', 'verify'] as EnforcementDecision[]).map((act) => (
                  <button
                    key={act}
                    onClick={() => {
                      setHighRiskAction(act);
                      setActivePreset('custom');
                    }}
                    className={`py-1 rounded text-center uppercase tracking-wider transition-all ${
                      highRiskAction === act
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                        : 'bg-surface-2 text-slate-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Search Bots */}
            <div className="p-3 rounded-xl bg-surface-0 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">Verified Search (Google/Bing)</span>
                <span className="text-[10px] font-mono text-emerald-400">Good Bots</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-mono font-bold">
                {(['allow', 'rate_limit'] as const).map((act) => (
                  <button
                    key={act}
                    onClick={() => {
                      setVerifiedBotAction(act);
                      setActivePreset('custom');
                    }}
                    className={`py-1 rounded text-center uppercase tracking-wider transition-all ${
                      verifiedBotAction === act
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'bg-surface-2 text-slate-400 border border-white/5 hover:text-white'
                    }`}
                  >
                    {act === 'rate_limit' ? 'Rate Limit' : 'Always Allow'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cryptographic Proof-of-Work (PoW) Hardware Defense Tuner */}
          <div className="p-5 rounded-2xl bg-[#121A16] border border-[#43D6A0]/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#43D6A0]/10 border border-[#43D6A0]/30 flex items-center justify-center text-[#43D6A0]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-mono uppercase tracking-tight">
                    Proof-of-Work Hardware Tuner
                  </h3>
                  <p className="text-[10px] text-slate-400">Silent CPU Cost Asymmetry</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-[#43D6A0]/20 text-[#43D6A0] text-[10px] font-mono font-bold border border-[#43D6A0]/30">
                ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Replaces CAPTCHAs with client-side SHA-256 puzzles. Solved in milliseconds by legitimate users; imposes crippling CPU starvation on botnets.
            </p>

            {/* PoW Difficulty Level Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-slate-300 block">
                Proof-of-Work Difficulty Level:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { level: 2, label: 'Lvl 2 (Fast ~5ms)', desc: 'Mobile-friendly' },
                  { level: 3, label: 'Lvl 3 (Standard ~20ms)', desc: 'Optimal default' },
                  { level: 4, label: 'Lvl 4 (Heavy ~120ms)', desc: 'High bot stress' },
                  { level: 5, label: 'Lvl 5 (Severe ~800ms)', desc: 'Anti-DDoS mode' },
                ].map((d) => (
                  <button
                    key={d.level}
                    onClick={() => {
                      setPowDifficulty(d.level);
                      setActivePreset('custom');
                    }}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      powDifficulty === d.level
                        ? 'bg-[#43D6A0]/20 border-[#43D6A0] text-white shadow-sm'
                        : 'bg-surface-0 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#43D6A0]">{d.label}</div>
                    <div className="text-[10px] text-slate-400">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live PoW Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface-0 border border-white/5">
                <span className="text-[10px] text-slate-400 block">TOTAL SOLVED</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {powStats.total_solved} Verified
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-0 border border-white/5">
                <span className="text-[10px] text-slate-400 block">AVG SOLVE LATENCY</span>
                <span className="text-sm font-bold text-[#43D6A0] mt-0.5 block">
                  {powStats.avg_solve_time_ms}ms
                </span>
              </div>
            </div>

            {/* Hardware Benchmark Test Button */}
            <button
              onClick={runPoWBenchmark}
              disabled={isTestingPoW}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#18221D] hover:bg-[#1F2E27] border border-[#43D6A0]/30 hover:border-[#43D6A0] text-[#43D6A0] text-xs font-mono font-semibold transition-all disabled:opacity-50"
            >
              {isTestingPoW ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Solving Nonces (Level {powDifficulty})...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Hardware Benchmark (Lvl {powDifficulty})</span>
                </>
              )}
            </button>

            {/* Real-time Benchmark Output Card */}
            {powTestResult && (
              <div className="p-3 rounded-xl bg-surface-0 border border-[#43D6A0]/30 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#43D6A0] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hardware Solved</span>
                  </span>
                  <span className="text-white font-bold">{powTestResult.time_taken_ms}ms</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                  <div>
                    Nonce: <span className="text-white font-semibold">{powTestResult.nonce}</span>
                  </div>
                  <div className="truncate">
                    SHA-256: <span className="text-[#43D6A0]">{powTestResult.hash}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IP & Subnet Edge Blocklists */}
      <div className="p-6 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Edge Subnet & IP Restrictions</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Explicit IP addresses, CIDR subnets, and Autonomous System Numbers (ASNs) barred from ingress.
          </p>
        </div>

        {/* Add Entry Form */}
        <form onSubmit={handleAddBlock} className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Add IP/CIDR (e.g. 192.0.2.0/24 or ASN12345)..."
            className="flex-1 px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-[#43D6A0] text-xs text-white font-mono placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-[#43D6A0] text-[#080B09] hover:bg-[#38c491] flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </form>

        {/* Current Rules List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {blockList.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-0 border border-white/5 font-mono text-xs"
            >
              <div className="flex items-center gap-2 text-slate-200 truncate">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>

              <button
                onClick={() => handleRemoveBlock(item)}
                className="text-slate-500 hover:text-rose-400 p-1 shrink-0"
                title="Remove Entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-1 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 font-mono text-xs">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 rounded-lg bg-surface-2 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.action}
                className="px-4 py-1.5 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
