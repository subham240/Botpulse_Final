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
    <header className="sticky top-0 z-50 w-full bg-[#080B09]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
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
          <span className="text-base font-semibold tracking-tight text-[#F5F7F5]">
            BotPulse
          </span>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm px-3.5 py-1.5 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'text-[#F5F7F5] bg-white/[0.06] font-medium'
                    : 'text-[#A3ADA6] hover:text-[#F5F7F5] hover:bg-white/[0.03]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-[#A3ADA6] hover:text-[#F5F7F5] transition-colors duration-150 px-2 py-1.5"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="h-9 px-4 rounded-lg bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-medium text-sm inline-flex items-center justify-center transition-colors duration-150"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#A3ADA6] hover:text-[#F5F7F5] rounded-lg focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#101512] px-5 py-6 space-y-4">
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
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#F5F7F5] bg-white/[0.06] font-medium'
                      : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm text-[#A3ADA6] hover:text-[#F5F7F5]"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-10 rounded-lg bg-[#43D6A0] hover:bg-[#38c491] text-[#080B09] font-medium text-sm flex items-center justify-center transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
