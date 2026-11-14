import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  User,
  Building,
  Shield,
  Bell,
  Key,
  Database,
  FileText,
  Copy,
  Check,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security' | 'api-keys' | 'retention' | 'audit'>('profile');

  const [name, setName] = useState(user?.name || 'Alexander Wright');
  const [org, setOrg] = useState(user?.organization || 'BotPulse Cyber Labs');
  const [apiKey, setApiKey] = useState('bp_live_89fe4a1_2026_prod_secret');
  const [copied, setCopied] = useState(false);
  const [retentionDays, setRetentionDays] = useState('90');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Settings Saved', 'Workspace configuration updated successfully.', 'success');
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied', 'API secret copied to clipboard.', 'info');
  };

  const tabs = [
    { id: 'profile', label: 'Personal Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'api-keys', label: 'API Keys & Secrets', icon: Key },
    { id: 'retention', label: 'Data Retention', icon: Database },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-1 border border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Workspace Configuration & System Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your credentials, SIEM integration webhooks, and compliance telemetry policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Settings Navigation */}
        <div className="md:col-span-3 bg-surface-1 border border-white/5 rounded-2xl p-3 space-y-1 text-xs font-mono">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
                  activeTab === t.id
                    ? 'bg-surface-2 text-pulse-cyan font-bold border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content Panel */}
        <div className="md:col-span-9 bg-surface-1 border border-white/5 rounded-2xl p-6 lg:p-8">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4 max-w-lg">
              <h3 className="text-sm font-bold text-white font-mono uppercase mb-4">Personal Profile</h3>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 text-xs text-white outline-none focus:border-pulse-cyan"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || 'alex.wright@botpulse.io'}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-2 border border-white/5 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Assigned RBAC Role</label>
                <input
                  type="text"
                  disabled
                  value={user?.role?.toUpperCase() || 'OWNER'}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-2 border border-white/5 text-xs text-pulse-cyan font-mono cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-pulse-cyan text-void hover:opacity-95 flex items-center gap-1.5 mt-2"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </form>
          )}

          {activeTab === 'organization' && (
            <form onSubmit={handleSave} className="space-y-4 max-w-lg">
              <h3 className="text-sm font-bold text-white font-mono uppercase mb-4">Organization Profile</h3>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Organization Name</label>
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 text-xs text-white outline-none focus:border-pulse-cyan"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Primary Region</label>
                <select className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 text-xs text-white outline-none">
                  <option>US-East (Virginia Edge Cluster)</option>
                  <option>EU-Central (Frankfurt Edge Cluster)</option>
                  <option>AP-Southeast (Singapore Edge Cluster)</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-pulse-cyan text-void hover:opacity-95"
              >
                Update Workspace
              </button>
            </form>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">API Keys & Ingestion Secrets</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Use this token to authorize reverse proxy workers and server-side verification middleware.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-0 border border-white/10 flex items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Live Edge Secret Key</div>
                  <div className="text-pulse-cyan font-bold mt-0.5">{apiKey}</div>
                </div>
                <button
                  onClick={copyKey}
                  className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-200 border border-white/10 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <form onSubmit={handleSave} className="space-y-4 max-w-lg">
              <h3 className="text-sm font-bold text-white font-mono uppercase mb-4">Data Retention & Compliance</h3>
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Raw Session Telemetry Retention</label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-surface-0 border border-white/10 text-xs text-white outline-none"
                >
                  <option value="30">30 Days (Standard Tier)</option>
                  <option value="90">90 Days (Enterprise SOC Recommended)</option>
                  <option value="365">365 Days (Full Compliance Archive)</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-pulse-cyan text-void hover:opacity-95"
              >
                Apply Retention Rule
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase mb-2">Security Enforcement</h3>
              <div className="p-4 rounded-xl bg-surface-0 border border-white/5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Mandatory Multi-Factor Authentication (MFA)</span>
                  <span className="text-emerald-400 font-mono">ENFORCED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Session Inactivity Timeout</span>
                  <span className="text-slate-400 font-mono">15 Minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">IP Whitelist for Console Administration</span>
                  <span className="text-pulse-cyan font-mono">Configured (3 Subnets)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase mb-2">Immutable Workspace Audit Trail</h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  { time: '17:35:10', actor: 'alex.wright@botpulse.io', action: 'Modified edge block threshold to 80' },
                  { time: '16:42:00', actor: 'elena.r@botpulse.io', action: 'Added IP 45.154.255.89 to edge blocklist' },
                  { time: '14:20:15', actor: 'system-sentinel', action: 'Rotated edge verification cryptographic key' },
                ].map((aud, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-0 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 mr-2">{aud.time}</span>
                      <strong className="text-slate-200">{aud.actor}</strong>
                      <span className="text-slate-400 ml-2">― {aud.action}</span>
                    </div>
                    <span className="text-emerald-400 text-[10px]">VERIFIED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
