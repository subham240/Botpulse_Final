import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { getApiBaseUrl, getTelemetryIngestUrl } from '../../services/api';
import { Plug, Globe, Plus, CheckCircle2, Copy, Check, Terminal, ExternalLink, Activity, ShieldCheck, Sparkles } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const { sites, addSite, showToast } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteDomain, setSiteDomain] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName || !siteDomain) return;
    addSite(siteName, siteDomain);
    setShowAddModal(false);
    setSiteName('');
    setSiteDomain('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied', 'Integration token copied to clipboard.', 'info');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-xl font-bold text-[#F5F7F5] tracking-tight">Websites</h1>
          <p className="text-xs text-[#A3ADA6] mt-0.5">
            Manage your connected domains, tracking snippets, and edge sensors.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#43D6A0] text-[#080B09] hover:bg-[#38c491] shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Website</span>
        </button>
      </div>

      {/* Special Showcase Card for Elvara Integration */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-1 via-purple-950/20 to-surface-1 border border-purple-500/30 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                FEATURED DEMONSTRATION STORE
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-beacon" />
                Live Sensor Active
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <span>ÉLVARA Luxury Storefront</span>
              <a
                href={`https://elvara-fashion.vercel.app/?bp_api=${encodeURIComponent(getTelemetryIngestUrl())}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                <span>Launch Store & Stream Live</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ÉLVARA is an independent contemporary fashion storefront protected by BotPulse. BotPulse's behavioural tracking SDK operates asynchronously on ÉLVARA, transmitting mouse trajectories, scroll kinematics, and device telemetry to stop scraping, inventory hoarding, and automated bots in real time.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2">
              <div>SDK: <strong className="text-white">botpulse-js v1.4.2</strong></div>
              <div>Connected Endpoint: <strong className="text-emerald-400">{getTelemetryIngestUrl()}</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-0/80 border border-white/10 font-mono text-xs text-slate-300 shrink-0 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase">Active Telemetry Integration:</div>
            <code className="text-pulse-cyan text-[11px] block bg-black/40 p-2 rounded border border-white/5">
              &lt;script src="{getTelemetryIngestUrl().replace(/\/api\/v1\/?$/, '')}/botpulse.js"&gt;&lt;/script&gt;
            </code>
            <a
              href={`https://elvara-fashion.vercel.app/?bp_api=${encodeURIComponent(getTelemetryIngestUrl())}`}
              target="_blank"
              rel="noreferrer"
              className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Storefront (Live Tracking)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Connected Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div
            key={site.id}
            className="p-6 rounded-2xl bg-surface-1 border border-white/5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-mono font-bold text-slate-400">{site.sdkVersion}</span>
                <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {site.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-pulse-cyan" />
                <h4 className="text-sm font-bold text-white font-mono">{site.domain}</h4>
              </div>
              <p className="text-xs text-slate-400">{site.name}</p>

              <div className="mt-4 space-y-2 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">24h Requests:</span>
                  <span>{site.requests24h.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Threats Blocked:</span>
                  <span className="text-purple-400 font-bold">{site.threatsBlocked24h.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Health:</span>
                  <span className="text-emerald-400">{site.health}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-500">{site.apiKeyPreview}</span>
              <button
                onClick={() => copyToClipboard(site.apiKeyPreview, site.id)}
                className="px-2.5 py-1 rounded text-xs font-mono bg-surface-2 hover:bg-surface-3 text-slate-300 flex items-center gap-1 border border-white/5"
              >
                {copiedKey === site.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Key</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Website Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-1 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Register Website for Protection</h3>
            <p className="text-xs text-slate-400">
              Generate an asynchronous telemetry sensor token for your web domain.
            </p>

            <form onSubmit={handleCreateSite} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Production Storefront"
                  className="w-full px-3 py-2 rounded-lg bg-surface-0 border border-white/10 text-xs text-white outline-none focus:border-pulse-cyan"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Domain Name</label>
                <input
                  type="text"
                  required
                  value={siteDomain}
                  onChange={(e) => setSiteDomain(e.target.value)}
                  placeholder="e.g. shop.example.com"
                  className="w-full px-3 py-2 rounded-lg bg-surface-0 border border-white/10 text-xs text-white font-mono outline-none focus:border-pulse-cyan"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-pulse-cyan text-void font-bold hover:opacity-95"
                >
                  Create Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
