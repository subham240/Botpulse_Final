import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#080B09] text-[#A3ADA6] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-5 flex items-center justify-center text-[#43D6A0]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="w-4 h-4"
                >
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                  <circle cx="12" cy="12" r="1.5" fill="#43D6A0" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#F5F7F5] tracking-tight">BotPulse</span>
            </Link>
            <p className="text-xs text-[#A3ADA6] max-w-sm leading-relaxed mb-4">
              Behavioral bot detection and real-time automated threat defense for web applications and APIs.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#737F77]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0]" />
              Behavioral analysis engine active
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h5 className="font-medium text-[#F5F7F5] text-xs mb-3">
              Platform
            </h5>
            <ul className="space-y-2">
              <li><Link to="/platform" className="hover:text-[#F5F7F5] transition-colors">Traffic intelligence</Link></li>
              <li><Link to="/technology" className="hover:text-[#F5F7F5] transition-colors">Detection architecture</Link></li>
              <li><Link to="/app/live" className="hover:text-[#F5F7F5] transition-colors">Live monitoring</Link></li>
              <li><Link to="/app/agents" className="hover:text-[#F5F7F5] transition-colors">AI-agent identification</Link></li>
              <li><Link to="/app/prevention" className="hover:text-[#F5F7F5] transition-colors">Threat prevention</Link></li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div>
            <h5 className="font-medium text-[#F5F7F5] text-xs mb-3">
              Solutions
            </h5>
            <ul className="space-y-2">
              <li><Link to="/solutions" className="hover:text-[#F5F7F5] transition-colors">E-commerce protection</Link></li>
              <li><Link to="/solutions" className="hover:text-[#F5F7F5] transition-colors">Scraping prevention</Link></li>
              <li><Link to="/solutions" className="hover:text-[#F5F7F5] transition-colors">AI scraper filtering</Link></li>
              <li><Link to="/solutions" className="hover:text-[#F5F7F5] transition-colors">Credential stuffing</Link></li>
              <li><Link to="/app/integrations" className="hover:text-[#F5F7F5] transition-colors">Integrations</Link></li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div>
            <h5 className="font-medium text-[#F5F7F5] text-xs mb-3">
              Company
            </h5>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="hover:text-[#F5F7F5] transition-colors">Pricing</Link></li>
              <li><Link to="/docs" className="hover:text-[#F5F7F5] transition-colors">Documentation</Link></li>
              <li><Link to="/about" className="hover:text-[#F5F7F5] transition-colors">About us</Link></li>
              <li><Link to="/contact" className="hover:text-[#F5F7F5] transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-[#F5F7F5] transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737F77]">
          <div>
            © 2026 BotPulse. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Privacy policy</span>
            <span>Security disclosures</span>
            <span>SOC 2 Type II</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
