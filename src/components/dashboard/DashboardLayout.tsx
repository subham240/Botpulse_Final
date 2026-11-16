import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  LayoutDashboard,
  Radio,
  LineChart,
  ShieldAlert,
  Bot,
  Globe,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Calendar,
  LogOut,
  Bell,
  Play
} from 'lucide-react';

interface PrimaryNavItem {
  label: string;
  path: string;
  icon: any;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  const { user, logout } = useAuth();
  const {
    selectedDomain,
    setSelectedDomain,
    dateRange,
    setDateRange,
    demoMode,
    setDemoMode,
    sites,
    sendTestEvent
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  // Primary 6 Navigation Items (Requested in Section 5)
  const primaryNavItems: PrimaryNavItem[] = [
    { label: 'Overview', path: '/app/overview', icon: LayoutDashboard },
    { label: 'Live Traffic', path: '/app/live', icon: Radio },
    { label: 'Threats', path: '/app/threats', icon: ShieldAlert },
    { label: 'AI Agents', path: '/app/agents', icon: Bot },
    { label: 'Websites', path: '/app/integrations', icon: Globe },
    { label: 'Analytics', path: '/app/analytics', icon: LineChart },
  ];

  // Secondary Configuration Items
  const secondaryNavItems: PrimaryNavItem[] = [
    { label: 'Team', path: '/app/team', icon: UserCheck },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080B09] text-[#F5F7F5] flex flex-col font-sans">
      {/* Clean, Minimalist Header Bar */}
      <header className="h-14 border-b border-white/[0.08] bg-[#101512] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Brand + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-1.5 text-[#A3ADA6] hover:text-[#F5F7F5]"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 mr-4 group">
            <div className="w-6 h-6 flex items-center justify-center text-[#43D6A0]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="w-5 h-5"
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                <circle cx="12" cy="12" r="1.5" fill="#43D6A0" />
              </svg>
            </div>
            <span className="font-bold text-sm text-[#F5F7F5] tracking-tight">BotPulse</span>
          </Link>

          {/* Website Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDomainDropdown(!showDomainDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121A16] border border-white/[0.08] hover:border-white/20 text-xs font-mono text-[#F5F7F5] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#43D6A0]" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                {selectedDomain === 'all'
                  ? 'All Websites'
                  : sites.find((s) => s.domain === selectedDomain)?.name || selectedDomain}
              </span>
              <ChevronDown className="w-3 h-3 text-[#A3ADA6]" />
            </button>

            {showDomainDropdown && (
              <div className="absolute left-0 mt-1 w-64 bg-[#121A16] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 text-xs font-mono animate-in fade-in">
                <button
                  onClick={() => {
                    setSelectedDomain('all');
                    setShowDomainDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between ${
                    selectedDomain === 'all' ? 'text-[#43D6A0] font-bold bg-white/5' : 'text-[#A3ADA6]'
                  }`}
                >
                  <span>All Websites</span>
                  <span className="text-[10px] text-[#737F77]">Aggregated</span>
                </button>
                <div className="h-px bg-white/5 my-1" />
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      setSelectedDomain(site.domain);
                      setShowDomainDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between ${
                      selectedDomain === site.domain ? 'text-[#43D6A0] font-bold bg-white/5' : 'text-[#F5F7F5]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{site.domain}</div>
                      <div className="text-[10px] text-[#A3ADA6]">{site.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121A16] border border-white/[0.08] hover:border-white/20 text-xs font-mono text-[#A3ADA6] transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#A3ADA6]" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3 h-3 text-[#A3ADA6]" />
            </button>

            {showDateDropdown && (
              <div className="absolute left-0 mt-1 w-44 bg-[#121A16] border border-white/10 rounded-xl shadow-2xl py-1 z-50 text-xs font-mono animate-in fade-in">
                {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[#A3ADA6] hover:text-[#F5F7F5] hover:bg-white/5"
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Test Beacon, Profile & Logout */}
        <div className="flex items-center gap-3">
          {/* Real-time Telemetry Simulator Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowTestDropdown(!showTestDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18221D] hover:bg-[#1F2E27] border border-white/[0.08] text-[11px] font-mono text-[#43D6A0] transition-colors"
              title="Inject test telemetry beacon"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Simulate Traffic</span>
              <ChevronDown className="w-3 h-3 text-[#A3ADA6]" />
            </button>

            {showTestDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-[#121A16] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 text-xs font-mono animate-in fade-in">
                <button
                  onClick={() => {
                    sendTestEvent('human');
                    setShowTestDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between text-[#43D6A0]"
                >
                  <span className="font-semibold">Human Visitor</span>
                  <span className="text-[10px] text-[#A3ADA6]">Natural</span>
                </button>
                <button
                  onClick={() => {
                    sendTestEvent('bot');
                    setShowTestDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between text-[#F59E0B]"
                >
                  <span className="font-semibold">Scraper Bot</span>
                  <span className="text-[10px] text-[#A3ADA6]">Puppeteer</span>
                </button>
                <button
                  onClick={() => {
                    sendTestEvent('agent');
                    setShowTestDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between text-[#38BDF8]"
                >
                  <span className="font-semibold">AI Agent (RAD-S1)</span>
                  <span className="text-[10px] text-[#A3ADA6]">Perplexity</span>
                </button>
                <button
                  onClick={() => {
                    sendTestEvent('gemini');
                    setShowTestDropdown(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-white/5 flex items-center justify-between text-purple-400"
                >
                  <span className="font-semibold">Gemini Agent (API Key)</span>
                  <span className="text-[10px] text-[#A3ADA6]">Google AI</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-[#121A16] border border-white/[0.08] hover:border-white/20 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-[#18221D] border border-[#43D6A0]/40 flex items-center justify-center text-[#43D6A0] font-bold text-xs">
                {user?.name ? user.name[0].toUpperCase() : 'B'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-[#F5F7F5]">
                {user?.name || 'Alexander Wright'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#A3ADA6]" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#121A16] border border-white/10 rounded-xl shadow-2xl p-3 z-50 text-xs animate-in fade-in">
                <div className="pb-2 border-b border-white/5 mb-2">
                  <div className="font-semibold text-[#F5F7F5]">{user?.name || 'Alexander Wright'}</div>
                  <div className="text-[#A3ADA6] font-mono text-[11px] truncate">{user?.email || 'analyst@botpulse.io'}</div>
                  <div className="text-[10px] text-[#43D6A0] font-mono uppercase mt-0.5">{user?.role || 'Owner'}</div>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setDemoMode(!demoMode);
                      setShowProfileDropdown(false);
                    }}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 text-[#A3ADA6] text-left font-mono text-[11px]"
                  >
                    <span>Toggle Demo Data</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${demoMode ? 'bg-[#43D6A0]/20 text-[#43D6A0]' : 'bg-white/10 text-[#737F77]'}`}>
                      {demoMode ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <Link
                    to="/app/settings"
                    onClick={() => setShowProfileDropdown(false)}
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 text-[#A3ADA6] hover:text-[#F5F7F5]"
                  >
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-rose-500/10 text-rose-400 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Body: Simplified Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Simplified Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-white/[0.08] bg-[#101512] transition-all duration-300 z-20 justify-between ${
            collapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Primary Nav List */}
          <div className="p-3 space-y-1">
            {primaryNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-[#18221D] text-[#43D6A0] font-semibold border border-[#43D6A0]/20 shadow-sm'
                      : 'text-[#A3ADA6] hover:text-[#F5F7F5] hover:bg-[#121A16]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#43D6A0]' : 'text-[#A3ADA6]'}`} />
                  {!collapsed && <span className="tracking-tight">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Secondary / Settings Nav Section at Bottom */}
          <div className="p-3 border-t border-white/[0.08] space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-[#18221D] text-[#43D6A0] font-semibold border border-[#43D6A0]/20'
                      : 'text-[#A3ADA6] hover:text-[#F5F7F5] hover:bg-[#121A16]'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

            {/* Collapse / Expand Toggle Button */}
            <div className="pt-2 flex items-center justify-between text-xs text-[#737F77]">
              {!collapsed && (
                <span className="text-[10px] font-mono uppercase tracking-wider pl-2">
                  Engine v2.1
                </span>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-1.5 rounded-lg text-[#A3ADA6] hover:text-[#F5F7F5] hover:bg-white/5 transition-colors ml-auto"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Flyout Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/80 flex">
            <div className="w-64 bg-[#101512] h-full p-4 border-r border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <span className="font-bold text-sm text-[#F5F7F5]">BotPulse Navigation</span>
                  <button onClick={() => setMobileSidebarOpen(false)} className="text-[#A3ADA6]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {primaryNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                          isActive
                            ? 'bg-[#18221D] text-[#43D6A0] font-bold border border-[#43D6A0]/20'
                            : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-1">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#A3ADA6] hover:text-[#F5F7F5]"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Main Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#080B09]">
          {children}
        </main>
      </div>
    </div>
  );
};
