import React, { useState } from 'react';
import { MOCK_TEAM } from '../../data/mockData';
import { TeamMember, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Users, UserPlus, Shield, ShieldCheck, Mail, Trash2, CheckCircle2 } from 'lucide-react';

export const TeamManagementPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('security_analyst');

  const { user, setRole } = useAuth();
  const { showToast } = useApp();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      lastActive: 'Invitation Pending',
    };

    setTeam((prev) => [...prev, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
    showToast('Invitation Dispatched', `Invited ${inviteName} as [${inviteRole.toUpperCase()}]`, 'success');
  };

  const handleChangeRole = (memberId: string, role: UserRole) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m))
    );
    showToast('Role Updated', 'Team permissions updated.', 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-1 border border-white/5">
        <div>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            SOC Team Access & Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage authorized security engineers, analysts, and auditor workspace access.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-pulse-cyan to-pulse-blue text-void hover:opacity-95 shadow-md shadow-pulse-cyan/20 flex items-center gap-1.5 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Security Analyst</span>
        </button>
      </div>

      {/* RBAC Role Matrix Info Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { role: 'Owner', desc: 'Full administrative access, billing, and root policy ownership.' },
          { role: 'Administrator', desc: 'Can deploy edge prevention rules and modify domain settings.' },
          { role: 'Security Analyst', desc: 'Investigates incidents, inspects session replays, and tags threats.' },
          { role: 'Viewer / Auditor', desc: 'Read-only access for compliance, forensic reports, and analytics.' },
        ].map((r) => (
          <div key={r.role} className="p-4 rounded-xl bg-surface-1 border border-white/5">
            <span className="text-xs font-mono font-bold text-pulse-cyan uppercase block mb-1">
              {r.role}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Team Table */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-2 text-slate-400 border-b border-white/5">
              <tr>
                <th className="py-2.5 px-3">ANALYST</th>
                <th className="py-2.5 px-3">EMAIL</th>
                <th className="py-2.5 px-3">ASSIGNED ROLE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-white/5">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-200">{member.name}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{member.email}</td>
                  <td className="py-3 px-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 rounded bg-surface-0 border border-white/10 text-xs font-mono text-pulse-cyan outline-none"
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Administrator</option>
                      <option value="security_analyst">Security Analyst</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        member.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{member.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-1 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Invite Security Team Member</h3>
            <p className="text-xs text-slate-400">
              Dispatches an authorization invitation to join this BotPulse workspace.
            </p>

            <form onSubmit={handleInvite} className="space-y-3.5 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3 py-2 rounded-lg bg-surface-0 border border-white/10 text-white outline-none focus:border-pulse-cyan"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="m.vance@security.corp"
                  className="w-full px-3 py-2 rounded-lg bg-surface-0 border border-white/10 text-white outline-none focus:border-pulse-cyan"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Permission Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-0 border border-white/10 text-white outline-none"
                >
                  <option value="security_analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                  <option value="viewer">Viewer / Auditor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-pulse-cyan text-void font-bold hover:opacity-95"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
