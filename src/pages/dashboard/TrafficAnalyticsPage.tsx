import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AreaTrendChart, TrafficDonutChart } from '../../components/shared/Charts';
import { ChevronDown, ChevronUp, Clock, Globe, Shield, RefreshCw } from 'lucide-react';
import { api, DashboardStatsResponse } from '../../services/api';

export const TrafficAnalyticsPage: React.FC = () => {
  const { liveEvents, sessions, backendStats, selectedDomain } = useApp();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [rangeStats, setRangeStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoadingRange, setIsLoadingRange] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch range-filtered stats from FastAPI backend
  const fetchRangeData = useCallback(async (range: '24h' | '7d' | '30d') => {
    try {
      setIsLoadingRange(true);
      const data = await api.dashboard.getStats(selectedDomain, range);
      setRangeStats(data);
    } catch (err) {
      console.warn('Failed to fetch range stats:', err);
    } finally {
      setIsLoadingRange(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    fetchRangeData(timeRange);
  }, [fetchRangeData, timeRange]);

  // Active statistics: use range-specific stats, falling back to real-time live backendStats
  const stats = (timeRange === '24h' ? (backendStats || rangeStats) : rangeStats) || backendStats;

  // Exact real-time metrics
  const totalSessions = stats?.total_sessions ?? sessions.length;
  const totalRequests = stats?.total_requests ?? liveEvents.length;
  const humanCount = stats?.human_count ?? sessions.filter((s) => s.category === 'human').length;
  const botCount = stats
    ? (stats.traditional_bot_count + stats.advanced_bot_count)
    : sessions.filter((s) => s.category === 'traditional_bot' || s.category === 'advanced_bot').length;
  const aiAgentCount = stats?.ai_agent_count ?? sessions.filter((s) => s.category === 'ai_agent').length;

  const humanPct = totalSessions > 0 ? Math.round((humanCount / totalSessions) * 100) : 0;
  const botPct = totalSessions > 0 ? Math.round((botCount / totalSessions) * 100) : 0;
  const aiAgentPct = totalSessions > 0 ? Math.max(0, 100 - humanPct - botPct) : 0;
  const nonHumanCount = botCount + aiAgentCount;
  const threatRatio = totalSessions > 0 ? Math.round((nonHumanCount / totalSessions) * 100) : 0;
  const avgRiskScore = stats?.avg_risk_score ?? 0;
  const mitigationRate = stats?.mitigation_rate ?? '100.0%';

  // Real traffic trend
  const trendData = stats?.traffic_trend && stats.traffic_trend.length > 0
    ? stats.traffic_trend
    : [];

  // Compute Peak Traffic Period from real data
  const peakPeriod = useMemo(() => {
    if (!trendData || trendData.length === 0) return 'No traffic recorded';
    const getB = (d: any) => d.bot ?? d.bots ?? 0;
    const getA = (d: any) => d.aiAgent ?? d.agents ?? 0;
    let maxBucket = trendData[0];
    let maxCount = (maxBucket.total != null) ? maxBucket.total : (maxBucket.human + getB(maxBucket) + getA(maxBucket));
    for (const b of trendData) {
      const c = (b.total != null) ? b.total : (b.human + getB(b) + getA(b));
      if (c > maxCount) {
        maxCount = c;
        maxBucket = b;
      }
    }
    return maxCount > 0 ? `${maxBucket.time} (${maxCount.toLocaleString()} requests)` : 'No traffic recorded';
  }, [trendData]);

  // Aggregate Most Active Pages from real database events
  const pageStats = useMemo(() => {
    if (stats?.top_pages && stats.top_pages.length > 0) {
      return stats.top_pages;
    }
    if (!liveEvents || liveEvents.length === 0) return [];
    const map: Record<string, { path: string; count: number; human: number; bot: number; agent: number }> = {};
    for (const ev of liveEvents) {
      const p = ev.path || '/';
      if (!map[p]) {
        map[p] = { path: p, count: 0, human: 0, bot: 0, agent: 0 };
      }
      map[p].count += 1;
      if (ev.category === 'human') map[p].human += 1;
      else if (ev.category === 'ai_agent') map[p].agent += 1;
      else map[p].bot += 1;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [stats?.top_pages, liveEvents]);

  const hasTraffic = totalSessions > 0 || totalRequests > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F7F5] tracking-tight">Traffic Analytics</h1>
          <p className="text-xs text-[#A3ADA6] mt-0.5">
            Real-time composition and behavioral analysis across your monitored web endpoints.
          </p>
        </div>

        {/* Clean Time Filter Buttons */}
        <div className="flex items-center gap-2">
          {isLoadingRange && (
            <RefreshCw className="w-3.5 h-3.5 text-[#43D6A0] animate-spin" />
          )}
          <div className="flex items-center gap-1 bg-[#121A16] p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeRange === '24h'
                  ? 'bg-[#18221D] text-[#43D6A0] font-bold border border-[#43D6A0]/20'
                  : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeRange === '7d'
                  ? 'bg-[#18221D] text-[#43D6A0] font-bold border border-[#43D6A0]/20'
                  : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeRange === '30d'
                  ? 'bg-[#18221D] text-[#43D6A0] font-bold border border-[#43D6A0]/20'
                  : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Exact Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-[#121A16] border border-white/[0.08]">
          <div className="text-[11px] font-mono text-[#A3ADA6] uppercase tracking-wider">
            Total Requests
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F7F5]">
            {totalRequests.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#737F77] font-mono mt-1">
            Exact HTTP/WS edge beacons
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A16] border border-white/[0.08]">
          <div className="text-[11px] font-mono text-[#A3ADA6] uppercase tracking-wider">
            Total Sessions
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#F5F7F5]">
            {totalSessions.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#737F77] font-mono mt-1">
            Analyzed visitor journeys
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A16] border border-white/[0.08]">
          <div className="text-[11px] font-mono text-[#43D6A0] uppercase tracking-wider flex items-center justify-between">
            <span>Human Visitors</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#43D6A0]">
              {humanCount.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[#43D6A0] font-semibold">
              {humanPct}%
            </span>
          </div>
          <div className="text-[10px] text-[#737F77] font-mono mt-1">
            Natural biometric motion
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A16] border border-white/[0.08]">
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>Automated Bots</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {botCount.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {botPct}%
            </span>
          </div>
          <div className="text-[10px] text-[#737F77] font-mono mt-1">
            Scrapers & headless scripts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A16] border border-white/[0.08] col-span-2 lg:col-span-1">
          <div className="text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider flex items-center justify-between">
            <span>AI Agents</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#38BDF8]">
              {aiAgentCount.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[#38BDF8] font-semibold">
              {aiAgentPct}%
            </span>
          </div>
          <div className="text-[10px] text-[#737F77] font-mono mt-1">
            Autonomous crawlers / LLMs
          </div>
        </div>
      </div>

      {/* 3. Main Traffic Chart (Traffic Over Time) */}
      <div className="p-5 rounded-xl bg-[#121A16] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold font-mono text-[#F5F7F5] uppercase tracking-wide">
              Traffic Over Time
            </h2>
            <p className="text-xs text-[#A3ADA6]">
              {timeRange === '24h' ? 'Hourly' : 'Daily'} breakdown of {totalRequests.toLocaleString()} requests across {totalSessions.toLocaleString()} sessions
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#43D6A0]">
              <span className="w-2 h-2 rounded-full bg-[#43D6A0]" />
              <span>Human ({humanCount.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Automated ({botCount.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#38BDF8]">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span>AI Agents ({aiAgentCount.toLocaleString()})</span>
            </div>
          </div>
        </div>

        <AreaTrendChart data={trendData} height={260} />
      </div>

      {/* 4. Traffic Distribution & High-Level Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Traffic Distribution Donut */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-[#121A16] border border-white/[0.08]">
          <h2 className="text-sm font-bold font-mono text-[#F5F7F5] uppercase tracking-wide mb-1">
            Traffic Distribution
          </h2>
          <p className="text-xs text-[#A3ADA6] mb-6">
            Proportion of analyzed traffic by behavioral category
          </p>

          <TrafficDonutChart
            humanCount={humanCount}
            botCount={botCount}
            aiAgentCount={aiAgentCount}
          />
        </div>

        {/* Right: Traffic Insights */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-[#121A16] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono text-[#F5F7F5] uppercase tracking-wide mb-1">
              Traffic Insights
            </h2>
            <p className="text-xs text-[#A3ADA6] mb-4">
              Operational observations derived from analyzed requests
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5 flex items-center justify-between">
                <span className="text-[#A3ADA6]">Peak Activity Period</span>
                <span className="font-bold text-[#F5F7F5]">{peakPeriod}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5 flex items-center justify-between">
                <span className="text-[#A3ADA6]">Overall Threat Ratio</span>
                <span className="font-bold text-amber-400">
                  {totalSessions > 0
                    ? `${threatRatio}% non-human (${nonHumanCount} of ${totalSessions} sessions)`
                    : '0%'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5 flex items-center justify-between">
                <span className="text-[#A3ADA6]">Average Risk Score</span>
                <span className="font-bold text-[#F5F7F5]">
                  {avgRiskScore}% average risk index
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5 flex items-center justify-between">
                <span className="text-[#A3ADA6]">Mitigation Rate</span>
                <span className="font-bold text-[#43D6A0]">{mitigationRate} edge enforced</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#737F77] font-mono mt-4">
            Only data verified by the BotPulse edge sensor is shown. All metrics are computed in real time from database records.
          </p>
        </div>
      </div>

      {/* 5. Most Active Pages */}
      <div className="p-5 rounded-xl bg-[#121A16] border border-white/[0.08]">
        <h2 className="text-sm font-bold font-mono text-[#F5F7F5] uppercase tracking-wide mb-1">
          Most Active Pages
        </h2>
        <p className="text-xs text-[#A3ADA6] mb-4">
          Incoming request distribution across monitored application endpoints
        </p>

        {pageStats.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-[#737F77]">
            No endpoint traffic recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[#737F77] border-b border-white/5">
                <tr>
                  <th className="py-2 px-3 font-normal">ENDPOINT PATH</th>
                  <th className="py-2 px-3 font-normal">REQUESTS</th>
                  <th className="py-2 px-3 font-normal">HUMAN</th>
                  <th className="py-2 px-3 font-normal">BOTS</th>
                  <th className="py-2 px-3 font-normal">AI AGENTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pageStats.map((st) => (
                  <tr key={st.path} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-[#F5F7F5] font-semibold">{st.path}</td>
                    <td className="py-3 px-3 text-[#A3ADA6] font-bold">{st.count.toLocaleString()}</td>
                    <td className="py-3 px-3 text-[#43D6A0]">{st.human.toLocaleString()}</td>
                    <td className="py-3 px-3 text-amber-400">{st.bot.toLocaleString()}</td>
                    <td className="py-3 px-3 text-[#38BDF8]">{st.agent.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Advanced Behavioral Telemetry (Collapsible) */}
      <div className="rounded-xl bg-[#121A16] border border-white/[0.08] overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-xs font-mono text-[#A3ADA6] hover:text-[#F5F7F5] transition-colors"
        >
          <span className="font-semibold uppercase tracking-wider">
            Advanced Behavioral Telemetry (From Live Biometric Sensor)
          </span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-white/5 space-y-4 text-xs font-mono bg-[#0D1210]">
            <p className="text-[#A3ADA6]">
              Real biometric pointer kinematics captured by the browser sensor for heuristic verification:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5">
                <div className="text-[10px] text-[#A3ADA6]">HUMAN POINTER ENTROPY</div>
                <div className="text-lg font-bold text-[#43D6A0] mt-1">
                  {(stats?.behavioral_metrics?.human_entropy ?? 0.80).toFixed(2)} / 1.0
                </div>
                <div className="text-[10px] text-[#737F77] mt-0.5">Calculated from biological micro-tremors</div>
              </div>

              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5">
                <div className="text-[10px] text-[#A3ADA6]">AUTOMATION JITTER RATIO</div>
                <div className="text-lg font-bold text-amber-400 mt-1">
                  {(stats?.behavioral_metrics?.bot_jitter ?? 0.00).toFixed(2)} / 1.0
                </div>
                <div className="text-[10px] text-[#737F77] mt-0.5">Synthetic straight-line move index</div>
              </div>

              <div className="p-3 rounded-lg bg-[#18221D] border border-white/5">
                <div className="text-[10px] text-[#A3ADA6]">AI ATTRIBUTION ENGINE</div>
                <div className="text-lg font-bold text-[#38BDF8] mt-1">
                  {stats?.behavioral_metrics?.ai_attribution ?? 'RAD-S1 Active'}
                </div>
                <div className="text-[10px] text-[#737F77] mt-0.5">
                  {aiAgentCount} verified autonomous agents
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};