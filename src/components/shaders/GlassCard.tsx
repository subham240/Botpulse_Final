import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'none' | 'subtle' | 'mint' | 'emerald';
  interactive?: boolean;
}

/**
 * Restrained dark glass card with subtle emerald edge lighting.
 * Designed to elevate dashboard metrics and feature panels while preserving
 * strict visual hierarchy and chart readability.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = 'subtle',
  interactive = false,
}) => {
  const glowStyles = {
    none: '',
    subtle: 'hover:border-white/20 hover:shadow-[0_0_25px_rgba(19,168,121,0.12)]',
    mint: 'border-[#43D6A0]/30 shadow-[0_0_30px_rgba(67,214,160,0.15)]',
    emerald: 'border-[#13A879]/30 shadow-[0_0_30px_rgba(19,168,121,0.20)]',
  };

  return (
    <div
      className={`
        bg-[#121A16]/90 
        backdrop-blur-md 
        border border-white/10 
        rounded-[24px] 
        transition-all duration-300 
        relative 
        overflow-hidden
        ${glowStyles[glow]}
        ${interactive ? 'hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
