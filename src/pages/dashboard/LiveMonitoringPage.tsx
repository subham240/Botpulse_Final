import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/shared/Badge';
import {
  Radio,
  Play,
  Pause,
  Search,
  Filter,
  RefreshCw,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { VisitorCategory, EnforcementDecision } from '../../types';

export const LiveMonitoringPage: React.FC = () => {
  const {
    liveEvents,
    isStreaming,
    setIsStreaming,
    setSelectedSession,
    sessions,
    refreshBackendData,
    isLoadingBackend,
    sendTestEvent
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VisitorCategory>('all');
  const [enforcementFilter, setEnforcementFilter] = useState<'all' | EnforcementDecision>('all');

  const filteredEvents = liveEvents.filter((ev) => {
    if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
    if (enforcementFilter !== 'all' && ev.enforcement !== enforcementFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (ev.ip || '').toLowerCase().includes(q) ||
        (ev.sessionId || '').toLowerCase().includes(q) ||
        (ev.path || '').toLowerCase().includes(q) ||
        (ev.domain || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F7F5] tracking-tight">Live Traffic</h1>
          <p className="text-xs text-[#A3ADA6] mt-0.5">
            Real-time activity stream and visitor verification across your pages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshBackendData()}
            disabled={isLoadingBackend}
            className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#A3ADA6] hover:text-[#F5F7F5] bg-surface-1 border border-white/10 hover:border-white/20 flex items-center gap-1.5 transition-all"
            title="Force refresh live telemetry feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackend ? 'animate-spin text-[#43D6A0]' : ''}`} />
            <span>{isLoadingBackend ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
              isStreaming
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                : 'bg-[#43D6A0]/10 text-[#43D6A0] border-[#43D6A0]/20 hover:bg-[#43D6A0]/20'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-surface-1 border border-white/5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by IP, Session, or Path..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 text-slate-300 outline-none"
          >
            <option value="all">All Traffic Categories</option>
            <option value="human">Human Visitors</option>
            <option value="ai_agent">AI Agents</option>
            <option value="traditional_bot">Traditional Bots</option>
            <option value="advanced_bot">Advanced Bots</option>
          </select>

          {/* Enforcement Filter */}
          <select
            value={enforcementFilter}
            onChange={(e) => setEnforcementFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 text-slate-300 outline-none"
          >
            <option value="all">All Enforcement Actions</option>
            <option value="allow">ALLOW</option>
            <option value="verify">VERIFY</option>
            <option value="rate_limit">RATE LIMIT</option>
            <option value="block">BLOCK</option>
          </select>
        </div>

        <div className="text-slate-400 text-xs">
          Showing <strong>{filteredEvents.length}</strong> real-time event packets
        </div>
      </div>

      {/* Real-Time Events Feed Table */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-2 text-slate-400 border-b border-white/5">
              <tr>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">SESSION ID</th>
                <th className="py-2.5 px-3">CATEGORY</th>
                <th className="py-2.5 px-3">IP & DOMAIN</th>
                <th className="py-2.5 px-3">REQUEST PATH</th>
                <th className="py-2.5 px-3">STAGE / ANOMALY</th>
                <th className="py-2.5 px-3">RISK</th>
                <th className="py-2.5 px-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => {
                      const match = sessions.find((s) => s.id === ev.sessionId) || sessions[0];
                      setSelectedSession(match);
                    }}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 text-slate-400">{ev.timestamp}</td>
                    <td className="py-3 px-3 text-pulse-cyan font-bold">{ev.sessionId}</td>
                    <td className="py-3 px-3">
                      <Badge value={ev.category} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-semibold">{ev.ip}</div>
                      <div className="text-[10px] text-slate-500">{ev.domain}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-slate-400 mr-1.5">
                        {ev.method}
                      </span>
                      {ev.path}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-300 font-semibold text-[11px]">{ev.stageTriggered}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{ev.behaviourAnomaly}</div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge value={ev.riskLevel} />
                    </td>
                    <td className="py-3 px-3">
                      <Badge value={ev.enforcement} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#43D6A0]">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        {searchTerm || categoryFilter !== 'all' || enforcementFilter !== 'all'
                          ? 'No telemetry packets match your filter criteria'
                          : 'Awaiting incoming telemetry beacons from connected stores'}
                      </div>
                      <p className="text-xs text-slate-400 max-w-md">
                        {searchTerm || categoryFilter !== 'all' || enforcementFilter !== 'all'
                          ? 'Try resetting the filters or clearing the search box to view full traffic.'
                          : 'Visit the Élvara storefront or click below to simulate real-time visitor traffic.'}
                      </p>
                      <button
                        onClick={() => sendTestEvent('human')}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#43D6A0]/10 hover:bg-[#43D6A0]/20 border border-[#43D6A0]/30 text-xs font-mono text-[#43D6A0] transition-colors"
                      >
                        + Simulate Live Human Visitor
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
