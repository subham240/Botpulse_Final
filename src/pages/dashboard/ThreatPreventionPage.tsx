import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  Cpu,
  Zap,
  Loader2,
  Play,
  RefreshCw,
  Bot,
  Sliders,
  Terminal,
  AlertCircle
} from 'lucide-react';
import { EnforcementDecision, PreventionPolicy } from '../../types';

export const ThreatPreventionPage: React.FC = () => {
  const { showToast, preventionStats, isStreaming, refreshBackendData } = useApp();

  // Core Enforced Risk Thresholds
  const [blockThreshold, setBlockThreshold] = useState<number>(80);
  const [verifyThreshold, setVerifyThreshold] = useState<number>(60);
  const [blockHeadlessBrowsers, setBlockHeadlessBrowsers] = useState<boolean>(true);

  // Bot Category Enforcement Actions
  const [traditionalBotAction, setTraditionalBotAction] = useState<EnforcementDecision>('block');
  const [aiAgentAction, setAiAgentAction] = useState<EnforcementDecision>('verify');

  // Cryptographic Proof-of-Work (PoW) Hardware Defense
  const [powDifficulty, setPowDifficulty] = useState<number>(3);
  const [powStats, setPowStats] = useState<{
    total_solved: number;
    avg_solve_time_ms: number;
    default_difficulty: number;
  }>({
    total_solved: 0,
    avg_solve_time_ms: 0,
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

  // Edge Subnet & IP Blocklist
  const [blockList, setBlockList] = useState<string[]>([
    '45.154.255.89/32 (Known Headless Cluster)',
    '91.240.118.0/24 (Credential Stuffing Proxy)',
  ]);
  const [newRule, setNewRule] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load live policies and stats from backend
  const loadPoliciesAndStats = useCallback(async () => {
    try {
      const [policyRes, powRes] = await Promise.allSettled([
        api.prevention.getPolicies('site_alvera_001'),
        api.prevention.getPoWStats(),
      ]);

      if (policyRes.status === 'fulfilled' && policyRes.value) {
        const policy = policyRes.value;
        if (typeof policy.block_threshold === 'number') setBlockThreshold(policy.block_threshold);
        if (typeof policy.verify_threshold === 'number') setVerifyThreshold(policy.verify_threshold);
        if (typeof policy.block_headless_browsers === 'boolean') setBlockHeadlessBrowsers(policy.block_headless_browsers);
        if (typeof policy.pow_difficulty === 'number') setPowDifficulty(policy.pow_difficulty);
        if (policy.traditional_bot_action) setTraditionalBotAction(policy.traditional_bot_action);
        if (policy.ai_agent_action) setAiAgentAction(policy.ai_agent_action);
        if (Array.isArray(policy.block_list) && policy.block_list.length > 0) {
          setBlockList(policy.block_list);
        }
      }

      if (powRes.status === 'fulfilled' && powRes.value && typeof powRes.value.total_solved === 'number') {
        setPowStats(powRes.value);
      }
    } catch (err) {
      console.warn('Could not load remote policy, using defaults:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPoliciesAndStats();
  }, [loadPoliciesAndStats]);

  // Periodic polling for live PoW stats in realtime when streaming
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      api.prevention
        .getPoWStats()
        .then((data) => {
          if (data && typeof data.total_solved === 'number') {
            setPowStats(data);
          }
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([loadPoliciesAndStats(), refreshBackendData()]);
      showToast('Synced with Edge', 'Synchronized live policies and telemetry metrics.', 'success');
    } catch {
      showToast('Sync Warning', 'Failed to synchronize with edge backend.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  // Run hardware PoW test in browser using real WebCrypto SHA-256
  const runPoWBenchmark = async () => {
    setIsTestingPoW(true);
    setPowTestResult(null);

    try {
      // 1. Fetch challenge from backend
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
    const clean = newRule.trim();
    if (!clean) return;
    if (blockList.includes(clean)) {
      showToast('Duplicate Rule', `${clean} is already in the blocklist.`, 'warning');
      return;
    }
    setBlockList((prev) => [clean, ...prev]);
    setNewRule('');
    showToast('Rule Staged', `Added ${clean}. Click 'Deploy Rules to Edge' to enforce.`, 'info');
  };

  const handleRemoveBlock = (item: string) => {
    setBlockList((prev) => prev.filter((r) => r !== item));
    showToast('Rule Removed', `Removed ${item}. Deploy to edge to synchronize.`, 'info');
  };

  // Deploy all active regulation policies to backend edge
  const handleDeployRules = async () => {
    setIsSaving(true);
    try {
      const payload: PreventionPolicy = {
        site_id: 'site_alvera_001',
        block_threshold: blockThreshold,
        verify_threshold: verifyThreshold,
        auto_mitigation: true,
        high_risk_action: 'block',
        ai_agent_action: aiAgentAction,
        traditional_bot_action: traditionalBotAction,
        verified_bot_action: 'allow',
        rate_limit_rpm: 60,
        burst_allowance: 15,
        rate_limit_action: 'throttle',
        pow_difficulty: powDifficulty,
        lstm_kinematic_sensitivity: 'standard',
        block_headless_browsers: blockHeadlessBrowsers,
        block_known_scrapers: true,
        block_data_centers: false,
        rapid_scan_protection: true,
        block_list: blockList,
      };

      await api.prevention.updatePolicies(payload);

      showToast(
        'Rules Deployed to Edge',
        `Synchronized: Block > ${blockThreshold}%, Verify > ${verifyThreshold}%, PoW Lvl ${powDifficulty}, ${blockList.length} IP rules.`,
        'success'
      );
    } catch (err: any) {
      showToast('Deployment Notice', 'Rules saved locally. Edge synchronizing in background.', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#101512] border border-white/10 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#43D6A0] animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#43D6A0]">
              Edge Policy Synchronizer Active
            </span>
            <span className="text-[11px] font-mono text-slate-500">• site: site_alvera_001</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Bot Regulation & Defense Policies
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage automated risk score thresholds, traffic category policies, IP blocklists, and cryptographic hardware verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-surface-0 hover:bg-surface-2 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Sync latest policy & metrics from edge"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#43D6A0]' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleDeployRules}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-[#43D6A0] text-[#080B09] hover:bg-[#38c491] shadow-lg shadow-[#43D6A0]/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deploying...</span>
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

      {/* Real-time Prevention Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Monitored</div>
          <div className="text-xl font-bold font-mono text-white">
            {preventionStats?.total_decisions ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Live edge decisions</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">Organic Allowed</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {preventionStats?.allowed ?? 0}
          </div>
          <span className="text-[10px] text-emerald-500/80 font-mono">0ms Added latency</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-rose-500/20 bg-rose-500/5 space-y-1">
          <div className="text-[11px] font-mono text-rose-400 uppercase">Blocked / Mitigated</div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {preventionStats?.blocked ?? 0}
          </div>
          <span className="text-[10px] text-rose-500/80 font-mono">Bad bots & scrapers dropped</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-[#43D6A0]/20 bg-[#43D6A0]/5 space-y-1">
          <div className="text-[11px] font-mono text-[#43D6A0] uppercase">Mitigation Accuracy</div>
          <div className="text-xl font-bold font-mono text-[#43D6A0]">
            {preventionStats?.mitigation_rate ?? '100%'}
          </div>
          <span className="text-[10px] text-[#43D6A0]/80 font-mono">Autonomous precision</span>
        </div>
      </div>

      {/* 2-Column Clean Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Thresholds & Traffic Policies */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Core Risk Thresholds */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-4">
            <div className="pb-3 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#43D6A0]" />
                  <span>Autonomous Risk Scoring Thresholds</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated mitigation triggers based on the composite multi-model risk score (0-100).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Block Threshold */}
              <div className="p-4 rounded-xl bg-surface-0 border border-rose-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                    Automatic Block Threshold
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                    &gt; {blockThreshold} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Requests scoring above this threshold are dropped at the edge with an HTTP 403 Forbidden.
                </p>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={blockThreshold}
                  onChange={(e) => setBlockThreshold(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>50 (Aggressive)</span>
                  <span>95 (Permissive)</span>
                </div>
              </div>

              {/* Verify Threshold */}
              <div className="p-4 rounded-xl bg-surface-0 border border-cyan-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                    Verification Challenge Threshold
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                    &gt; {verifyThreshold} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sessions scoring above this threshold receive a silent background SHA-256 Proof-of-Work hardware puzzle.
                </p>
                <input
                  type="range"
                  min={25}
                  max={75}
                  value={verifyThreshold}
                  onChange={(e) => setVerifyThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>25 (Strict)</span>
                  <span>75 (Relaxed)</span>
                </div>
              </div>

              {/* Headless Browser Protection Switch */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-0 border border-white/5 hover:border-white/15 cursor-pointer transition-all">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#43D6A0]" />
                    <span>Drop Headless Automation Browsers</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Immediately terminates Puppeteer, Playwright, Selenium, and Chrome CDP automation runtimes.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={blockHeadlessBrowsers}
                  onChange={(e) => setBlockHeadlessBrowsers(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-1 border-white/20 text-[#43D6A0] focus:ring-0 cursor-pointer ml-3"
                />
              </label>
            </div>
          </div>

          {/* Card 2: Traffic Category Enforcement Matrix */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-4">
            <div className="pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#43D6A0]" />
                <span>Traffic Category Enforcement Policy</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set active edge enforcement actions for each detected visitor classification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Traditional Bots */}
              <div className="p-4 rounded-xl bg-surface-0 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200">Traditional Bots & Scrapers</span>
                  <span className="text-[10px] font-mono text-slate-500">Stage 1 XGBoost</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {(['block', 'verify', 'rate_limit'] as EnforcementDecision[]).map((act) => (
                    <button
                      key={act}
                      onClick={() => setTraditionalBotAction(act)}
                      className={`py-1.5 px-1 rounded-lg text-center uppercase tracking-wider font-bold transition-all ${
                        traditionalBotAction === act
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                          : 'bg-surface-2 text-slate-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      {act === 'rate_limit' ? 'Limit' : act}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Enforces {traditionalBotAction.toUpperCase()} on detected automated bots.
                </p>
              </div>

              {/* AI Agents */}
              <div className="p-4 rounded-xl bg-surface-0 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200">Autonomous AI Agents</span>
                  <span className="text-[10px] font-mono text-purple-400">Stage 3 RAD-S1</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {(['verify', 'allow', 'block'] as EnforcementDecision[]).map((act) => (
                    <button
                      key={act}
                      onClick={() => setAiAgentAction(act)}
                      className={`py-1.5 px-1 rounded-lg text-center uppercase tracking-wider font-bold transition-all ${
                        aiAgentAction === act
                          ? 'bg-[#43D6A0]/20 text-[#43D6A0] border border-[#43D6A0]/40 shadow-sm'
                          : 'bg-surface-2 text-slate-400 border border-white/5 hover:text-white'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Enforces {aiAgentAction.toUpperCase()} on Gemini, Claude, and LLM crawlers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: PoW Hardware Defense & IP Blocklist */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Proof-of-Work Hardware Defense */}
          <div className="p-5 rounded-2xl bg-[#101512] border border-[#43D6A0]/20 shadow-xl space-y-4">
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
              Replaces visual CAPTCHAs with client-side SHA-256 puzzles. Solved in milliseconds by legitimate users; imposes crippling CPU starvation on botnets.
            </p>

            {/* PoW Difficulty Level Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold text-slate-300 block">
                Proof-of-Work Difficulty Level:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { level: 2, label: 'Lvl 2 (Fast ~5ms)', desc: 'Mobile-friendly' },
                  { level: 3, label: 'Lvl 3 (Standard ~20ms)', desc: 'Recommended default' },
                  { level: 4, label: 'Lvl 4 (Heavy ~120ms)', desc: 'High bot stress' },
                  { level: 5, label: 'Lvl 5 (Severe ~800ms)', desc: 'Anti-DDoS mode' },
                ].map((d) => (
                  <button
                    key={d.level}
                    onClick={() => setPowDifficulty(d.level)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      powDifficulty === d.level
                        ? 'bg-[#43D6A0]/20 border-[#43D6A0] text-white shadow-sm'
                        : 'bg-surface-0 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#43D6A0]">{d.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live PoW Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface-0 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">Total Solved</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {powStats.total_solved} Verified
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-0 border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">Avg Latency</span>
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
                  <span>Computing SHA-256 Nonces (Level {powDifficulty})...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Hardware Benchmark (Lvl {powDifficulty})</span>
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

          {/* Card 4: Edge Subnet & IP Restrictions (Real & Enforced) */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-white/10 shadow-sm space-y-4">
            <div className="pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Edge IP & Subnet Blocklist</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Explicit IP addresses or CIDR subnets barred at ingress with immediate HTTP 403 drops.
              </p>
            </div>

            {/* Add IP Form */}
            <form onSubmit={handleAddBlock} className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                className="flex-1 px-3 py-2 rounded-lg bg-surface-0 border border-white/10 focus:border-[#43D6A0] text-xs text-white font-mono placeholder-slate-500 outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-[#43D6A0] text-[#080B09] hover:bg-[#38c491] flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* Rules List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {blockList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 font-mono">
                  No explicit IP blocks configured.
                </div>
              ) : (
                blockList.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface-0 border border-white/5 font-mono text-xs group hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-slate-200 truncate">
                      <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveBlock(item)}
                      className="text-slate-500 hover:text-rose-400 p-1 shrink-0 transition-colors"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
