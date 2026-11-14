import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/platform' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080B09]/80 backdrop-blur-lg border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {/* Asterisk / Sparkle Icon matching reference */}
          <div className="w-7 h-7 flex items-center justify-center text-[#43D6A0] group-hover:rotate-45 transition-transform duration-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="w-6 h-6"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
              <circle cx="12" cy="12" r="1.5" fill="#43D6A0" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F5F7F5] font-sans">
            BotPulse
          </span>
        </Link>

        {/* Center: Desktop Pill-Shaped Navigation Bar matching screenshot */}
        <nav className="hidden md:inline-flex items-center p-1 rounded-full border border-white/10 bg-[#101512]/90 backdrop-blur-md shadow-lg shadow-black/40">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#43D6A0] text-[#080B09] font-semibold px-4 py-1.5 rounded-full shadow-sm'
                    : 'text-[#A3ADA6] hover:text-[#F5F7F5] px-4 py-1.5 rounded-full font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth Buttons matching screenshot */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            to="/login"
            className="text-sm font-medium text-[#F5F7F5] hover:text-[#43D6A0] transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-semibold text-sm px-5 py-2 rounded-full transition-all shadow-[0_0_20px_rgba(67,214,160,0.3)] hover:shadow-[0_0_28px_rgba(67,214,160,0.5)]"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#A3ADA6] hover:text-[#F5F7F5] rounded-lg focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer matching responsive screenshot */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#101512]/95 backdrop-blur-xl px-5 py-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#43D6A0] text-[#080B09] font-semibold'
                      : 'text-[#A3ADA6] hover:text-[#F5F7F5] hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-medium text-[#F5F7F5] border border-white/10 rounded-full hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold bg-[#43D6A0] text-[#080B09] rounded-full shadow-[0_0_20px_rgba(67,214,160,0.3)]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
