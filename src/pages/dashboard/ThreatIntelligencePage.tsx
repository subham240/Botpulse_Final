import React, { useState } from 'react';
import { MOCK_THREATS } from '../../data/mockData';
import { ThreatRecord, ThreatStatus } from '../../types';
import { Badge } from '../../components/shared/Badge';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../services/api';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Filter, ShieldCheck, Activity } from 'lucide-react';

export const ThreatIntelligencePage: React.FC = () => {
  const { showToast, backendThreats, demoMode } = useApp();
  const activeThreats = demoMode ? MOCK_THREATS : (backendThreats.length > 0 ? backendThreats : MOCK_THREATS);
  const [threats, setThreats] = useState<ThreatRecord[]>(activeThreats);
  const [selectedThreat, setSelectedThreat] = useState<ThreatRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ThreatStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    setThreats(activeThreats);
  }, [activeThreats]);

  const handleUpdateStatus = async (threatId: string, newStatus: ThreatStatus) => {
    setThreats((prev) =>
      prev.map((t) => (t.id === threatId ? { ...t, status: newStatus } : t))
    );
    if (selectedThreat && selectedThreat.id === threatId) {
      setSelectedThreat({ ...selectedThreat, status: newStatus });
    }

    try {
      await api.dashboard.updateThreatStatus(threatId, newStatus);
    } catch {
      // offline fallback
    }

    showToast('Threat Updated', `Incident ${threatId} moved to [${newStatus.toUpperCase()}]`, 'info');
  };

  const filteredThreats = threats.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const idMatch = t.id?.toLowerCase().includes(q);
      const titleMatch = t.title?.toLowerCase().includes(q);
      const actorMatch = t.threatActor?.toLowerCase().includes(q);
      const domainMatch = t.affectedDomain?.toLowerCase().includes(q);
      if (!idMatch && !titleMatch && !actorMatch && !domainMatch) return false;
    }
    return true;
  });

  const totalIncidents = threats.length;
  const criticalCount = threats.filter((t) => t.severity === 'critical').length;
  const newCount = threats.filter((t) => t.status === 'new').length;
  const resolvedCount = threats.filter((t) => t.status === 'resolved' || t.status === 'confirmed').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F7F5] tracking-tight">Threat Intelligence</h1>
          <p className="text-xs text-[#A3ADA6] mt-0.5">
            Security incidents, automated scrapers, and credential stuffing vectors.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#A3ADA6]">
          <span className="w-2 h-2 rounded-full bg-[#43D6A0] animate-pulse" />
          <span>Status: <strong className="text-[#43D6A0]">Active Edge Shield</strong></span>
        </div>
      </div>

      {/* Threat Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-1 border border-white/5 space-y-1">
          <div className="text-[11px] font-mono text-[#A3ADA6] uppercase">Total Incidents</div>
          <div className="text-xl font-bold text-white font-mono">{totalIncidents}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-rose-500/20 bg-rose-500/5 space-y-1">
          <div className="text-[11px] font-mono text-rose-300 uppercase">Critical Severity</div>
          <div className="text-xl font-bold text-rose-400 font-mono">{criticalCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-amber-500/20 bg-amber-500/5 space-y-1">
          <div className="text-[11px] font-mono text-amber-300 uppercase">New Triage</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{newCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-[#43D6A0]/20 bg-[#43D6A0]/5 space-y-1">
          <div className="text-[11px] font-mono text-[#43D6A0] uppercase">Mitigated / Closed</div>
          <div className="text-xl font-bold text-[#43D6A0] font-mono">{resolvedCount}</div>
        </div>
      </div>

      {/* Threat Status Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-surface-1 border border-white/5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 mr-1 text-[11px]">Filter:</span>
          {(['all', 'new', 'investigating', 'confirmed', 'resolved', 'false_positive'] as ('all' | ThreatStatus)[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg border uppercase text-[10px] transition-colors ${
                statusFilter === st
                  ? 'bg-pulse-cyan/20 text-pulse-cyan border-pulse-cyan font-bold'
                  : 'bg-surface-0 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, actor, domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-8 pr-3 py-1.5 rounded-lg bg-surface-0 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-pulse-cyan"
          />
        </div>
      </div>

      {/* Threats Table / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-3">
          {filteredThreats.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-1 border border-white/5 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-[#43D6A0] mx-auto opacity-80" />
              <h3 className="text-sm font-bold text-white">No Threats Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No security incidents matching current filter. Perimeter and automated behavioral shields are operational.
              </p>
            </div>
          ) : (
            filteredThreats.map((threat) => (
              <div
                key={threat.id}
                onClick={() => setSelectedThreat(threat)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedThreat?.id === threat.id
                    ? 'bg-surface-2 border-pulse-cyan shadow-xl shadow-pulse-cyan/5'
                    : 'bg-surface-1 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 font-bold">{threat.id}</span>
                    <Badge variant="risk" value={threat.severity || 'high'} />
                    <Badge variant="threat" value={threat.status || 'new'} />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    First detected: {threat.firstDetected || 'Recently'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5">{threat.title || 'Automated Threat Incident'}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{threat.details || 'Anomalous telemetry pattern identified by ML engine.'}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-white/5">
                  <div>Domain: <strong className="text-pulse-cyan">{threat.affectedDomain || 'elvara-fashion.vercel.app'}</strong></div>
                  <div>Incident count: <strong className="text-white">{(threat.incidentCount ?? 1).toLocaleString()}</strong></div>
                  <div>Enacted: <Badge value={threat.mitigationEnacted || 'block'} /></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Incident Deep Investigation Drawer */}
        <div className="lg:col-span-4 sticky top-24">
          {selectedThreat ? (
            <div className="p-6 rounded-2xl bg-surface-1 border border-white/10 shadow-2xl space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-xs font-mono font-bold text-pulse-cyan uppercase">
                  INVESTIGATION: {selectedThreat.id}
                </span>
                <Badge variant="threat" value={selectedThreat.status || 'new'} />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">{selectedThreat.title}</h4>
                <div className="text-xs font-mono text-slate-400">
                  Actor: <span className="text-slate-200">{selectedThreat.threatActor || 'Automated Bot Cluster'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-0 border border-white/5 text-xs text-slate-300 leading-relaxed">
                {selectedThreat.details}
              </div>

              {/* Status transition buttons */}
              <div>
                <span className="text-xs font-mono uppercase text-slate-400 block mb-2">
                  Update Threat Incident State:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {(['new', 'investigating', 'confirmed', 'resolved', 'false_positive'] as ThreatStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedThreat.id, st)}
                      className={`py-1.5 px-2.5 rounded border uppercase text-[10px] font-bold ${
                        selectedThreat.status === st
                          ? 'bg-pulse-cyan/20 text-pulse-cyan border-pulse-cyan'
                          : 'bg-surface-2 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-surface-1 border border-white/5 text-center text-xs text-slate-400">
              Select an incident from the threat stream to launch the forensic investigation console.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
