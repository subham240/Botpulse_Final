import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Badge } from '../../components/shared/Badge';
import { Search, Filter, Eye, ShieldCheck, ShieldAlert, Cpu, ArrowUpDown } from 'lucide-react';
import { VisitorCategory, RiskLevel } from '../../types';

export const SessionExplorerPage: React.FC = () => {
  const { sessions, setSelectedSession } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VisitorCategory>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');

  const filteredSessions = sessions.filter((s) => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (riskFilter !== 'all' && s.riskLevel !== riskFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.ip.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.asn.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-1 border border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Session Forensics & Telemetry Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed session-level behavioral timelines, micro-movement trajectories, and classification audits.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-surface-2 px-3 py-1.5 rounded-lg border border-white/5">
          Click any session row to launch 2D Pointer Replay
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-surface-1 border border-white/5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Session ID, IP address, ASN..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 focus:border-pulse-cyan text-xs text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 text-slate-300 outline-none"
          >
            <option value="all">All Visitor Types</option>
            <option value="human">Human</option>
            <option value="ai_agent">AI Agent</option>
            <option value="traditional_bot">Traditional Bot</option>
            <option value="advanced_bot">Advanced Bot</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 text-slate-300 outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
        </div>

        <div className="text-slate-400 text-xs">
          Showing <strong>{filteredSessions.length}</strong> recorded sessions
        </div>
      </div>

      {/* Main Sessions Table */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-2 text-slate-400 border-b border-white/5">
              <tr>
                <th className="py-2.5 px-3">SESSION ID</th>
                <th className="py-2.5 px-3">VISITOR TYPE</th>
                <th className="py-2.5 px-3">IP & ASN</th>
                <th className="py-2.5 px-3">RISK SCORE</th>
                <th className="py-2.5 px-3">DURATION</th>
                <th className="py-2.5 px-3">PAGES / REQS</th>
                <th className="py-2.5 px-3">ENFORCEMENT</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSessions.map((sess) => (
                <tr
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 text-pulse-cyan font-bold">{sess.id}</td>
                  <td className="py-3 px-3">
                    <Badge value={sess.category} />
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-slate-200 font-semibold">{sess.ip}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{sess.asn}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold ${
                          sess.riskScore > 75
                            ? 'text-rose-400'
                            : sess.riskScore > 40
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {sess.riskScore}/100
                      </span>
                      <Badge value={sess.riskLevel} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">{sess.durationSeconds}s</td>
                  <td className="py-3 px-3 text-slate-400">
                    {sess.pageVisits} pages / {sess.totalRequests} reqs
                  </td>
                  <td className="py-3 px-3">
                    <Badge value={sess.enforcement} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(sess);
                      }}
                      className="px-2.5 py-1 rounded text-xs font-mono bg-surface-2 hover:bg-surface-3 text-pulse-cyan border border-white/10"
                    >
                      Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
