import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CinematicStartupIntroProps {
  onComplete: () => void;
  onRevealing: () => void;
}

export const CinematicStartupIntro: React.FC<CinematicStartupIntroProps> = ({
  onComplete,
  onRevealing,
}) => {
  // Phase state:
  // 'scene1' -> Awakening: Black screen, logo fades & scales in, glowing emerald core
  // 'scene2' -> Dynamic wheel: Clockwise spin, reverse to counter-clockwise, traverse across screen with trails
  // 'scene3' -> 3D Physical Screen Falling: Screen tilts back in 3D, plunges down and out of viewport
  // 'done'   -> Completed
  const [phase, setPhase] = useState<'scene1' | 'scene2' | 'scene3' | 'done'>('scene1');
  const [telemetryText, setTelemetryText] = useState('INITIALIZING ZERO-TRUST CORE');
  const [travelDistance, setTravelDistance] = useState(160);
  const hasRevealedRef = useRef(false);

  // Responsive travel distance
  useEffect(() => {
    const updateDistance = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 640) {
          setTravelDistance(Math.min(85, Math.floor(width * 0.22)));
        } else if (width < 1024) {
          setTravelDistance(130);
        } else {
          setTravelDistance(170);
        }
      }
    };
    updateDistance();
    window.addEventListener('resize', updateDistance);
    return () => window.removeEventListener('resize', updateDistance);
  }, []);

  const handleFinish = useCallback(() => {
    if (!hasRevealedRef.current) {
      hasRevealedRef.current = true;
      onRevealing();
    }
    setPhase('done');
    try {
      sessionStorage.setItem('botpulse_intro_seen', 'true');
    } catch {
      // Ignore sessionStorage exceptions
    }
    onComplete();
  }, [onComplete, onRevealing]);

  // Immediately mark session as seen upon starting intro
  useEffect(() => {
    try {
      sessionStorage.setItem('botpulse_intro_seen', 'true');
    } catch {}
  }, []);

  // Main choreography timeline
  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        handleFinish();
        return;
      }
    }

    // Scene 1 -> Scene 2: 850ms (Awakening & Glow Ignition complete, begin wheel dynamics)
    const t1 = setTimeout(() => {
      setPhase('scene2');
      setTelemetryText('CALIBRATING BEHAVIORAL KINEMATICS');
    }, 850);

    // Mid Scene 2: 1700ms (Reversing rotation & traversal across screen)
    const t2 = setTimeout(() => {
      setTelemetryText('ENGAGING RAD-S1 SENSOR ARRAY');
    }, 1700);

    // Scene 2 -> Scene 3: 2500ms (Wheel locks, Physical Screen Tilt & 3D Falling begins)
    const t3 = setTimeout(() => {
      setPhase('scene3');
      setTelemetryText('SECURITY ENVIRONMENT UNLOCKED');
      if (!hasRevealedRef.current) {
        hasRevealedRef.current = true;
        onRevealing();
      }
    }, 2500);

    // Scene 3 -> Completion: 3650ms (Screen has completely fallen out of viewport)
    const t4 = setTimeout(() => {
      handleFinish();
    }, 3650);

    // Fail-safe timeout (4.8s) so the homepage is NEVER blocked under any condition
    const fallbackTimeout = setTimeout(() => {
      handleFinish();
    }, 4800);

    // Keyboard ESC or Space listener to skip intro instantly
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(fallbackTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleFinish, onRevealing]);

  if (phase === 'done') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-transparent select-none pointer-events-auto"
      style={{
        perspective: '1300px',
        perspectiveOrigin: '50% 38%',
      }}
      aria-label="BotPulse Startup Intro Animation"
      role="dialog"
      aria-modal="true"
    >
      {/* Skip button for user accessibility - cleanly fades out when 3D screen drops */}
      <button
        onClick={handleFinish}
        className={`absolute top-5 right-5 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121A16]/90 hover:bg-[#18221D] border border-white/10 text-[11px] font-mono text-[#A3ADA6] hover:text-[#43D6A0] transition-all duration-300 backdrop-blur-md cursor-pointer shadow-lg ${
          phase === 'scene3' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Skip intro animation"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-pulse" />
        <span>SKIP [ESC]</span>
      </button>

      {/* =========================================================================
          THE PHYSICAL 3D SCREEN SLAB (SCENE 3)
          Behaves like an authentic physical digital monitor/panel:
          Tilts backward in 3D, rotates on X & Y axes, and plunges downward out of view,
          revealing the actual website directly behind it!
         ========================================================================= */}
      <motion.div
        className="relative w-full h-full flex flex-col items-center justify-center bg-[#080B09] overflow-hidden"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 85%',
        }}
        initial={{
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          y: '0vh',
          z: 0,
          filter: 'blur(0px) brightness(1)',
          boxShadow: '0 0 0 rgba(0,0,0,0)',
        }}
        animate={
          phase === 'scene3'
            ? {
                // Keyframe timeline for 3D Screen Falling:
                // Step 1 (0 to 0.22): Magnetic detach & tilt backward (rotateX -15deg, z -50px)
                // Step 2 (0.22 to 1.0): Physical gravitational plunge (y 130vh, rotateX -48deg, z -450px)
                rotateX: [0, -15, -48],
                rotateY: [0, 5, -8],
                rotateZ: [0, -2, 5],
                y: ['0vh', '0vh', '130vh'],
                z: [0, -50, -450],
                filter: [
                  'blur(0px) brightness(1)',
                  'blur(1px) brightness(0.96)',
                  'blur(10px) brightness(0.8)',
                ],
                boxShadow: [
                  '0 0 0 rgba(0,0,0,0)',
                  '0 20px 50px rgba(0,0,0,0.85), 0 -2px 25px rgba(67,214,160,0.3)',
                  '0 80px 160px rgba(0,0,0,1), 0 0 70px rgba(67,214,160,0.15)',
                ],
              }
            : {
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                y: '0vh',
                z: 0,
              }
        }
        transition={
          phase === 'scene3'
            ? {
                duration: 1.15,
                times: [0, 0.22, 1],
                ease: [0.55, 0.055, 0.675, 0.19], // Physical gravity acceleration curve
              }
            : { duration: 0.3 }
        }
      >
        {/* Physical screen bezel outline & cyber grid */}
        <div className="absolute inset-0 border border-[#43D6A0]/25 pointer-events-none" />

        {/* Diagonal specular glass reflection across the digital screen */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              'linear-gradient(125deg, transparent 20%, rgba(255, 255, 255, 0.03) 38%, rgba(67, 214, 160, 0.08) 48%, transparent 60%)',
          }}
        />

        {/* Subtle Cyber Grid Matrix Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(67, 214, 160, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(67, 214, 160, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* High-tech HUD Reticle Corner Brackets (Physical Screen Markers) */}
        <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-[#43D6A0]/50 pointer-events-none" />
        <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-[#43D6A0]/50 pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-[#43D6A0]/50 pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-[#43D6A0]/50 pointer-events-none" />

        {/* Top Screen Telemetry Status Bar */}
        <div className="absolute top-6 inset-x-14 flex items-center justify-between text-[10px] font-mono text-[#737F77] tracking-wider pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-pulse" />
            <span className="text-[#A3ADA6]">BOTPULSE ZERO-TRUST ARCHITECTURE</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span>CORE: ACTIVE</span>
            <span className="text-[#43D6A0]/80">LATENCY: 0.8ms</span>
          </div>
        </div>

        {/* Center Emerald Ambient Light Aura */}
        <div className="absolute w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-tr from-[#13A879]/25 via-[#43D6A0]/15 to-transparent blur-3xl pointer-events-none" />

        {/* =========================================================================
            CENTRAL ANIMATED BOTPULSE WHEEL LOGO (SCENE 1 & SCENE 2)
            Exact 8-spoke wheel asset with clockwise rotation, reverse rotation,
            and dynamic cross-screen traversal with green light trails!
           ========================================================================= */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Moving Wheel Container */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ scale: 0.65, opacity: 0, x: 0 }}
            animate={
              phase === 'scene1'
                ? {
                    scale: [0.65, 1.05, 1],
                    opacity: [0, 1, 1],
                    x: 0,
                  }
                : phase === 'scene2'
                ? {
                    // Dynamic wheel traversal:
                    // 1. Center -> Left (-travelDistance) while rotating clockwise
                    // 2. Decelerates and turns around
                    // 3. Rapid traversal to Right (+travelDistance) while rotating counter-clockwise
                    // 4. Settles back to Center (0px)
                    x: [0, -travelDistance, travelDistance, 0],
                    scale: [1, 1.08, 1.06, 1],
                    opacity: 1,
                  }
                : {
                    x: 0,
                    scale: 1,
                    opacity: 1,
                  }
            }
            transition={
              phase === 'scene1'
                ? {
                    duration: 0.85,
                    ease: [0.16, 1, 0.3, 1],
                  }
                : phase === 'scene2'
                ? {
                    duration: 1.6,
                    times: [0, 0.35, 0.75, 1],
                    ease: [0.45, 0.05, 0.25, 1],
                  }
                : {
                    duration: 0.3,
                  }
            }
          >
            {/* Trailing Green Light Trails & Motion Blur Echoes (Scene 2) */}
            {phase === 'scene2' && (
              <>
                {/* Trailing ghost echo 1 */}
                <motion.div
                  className="absolute pointer-events-none opacity-35 blur-[2px]"
                  animate={{
                    x: [0, travelDistance * 0.2, -travelDistance * 0.22, 0],
                    opacity: [0, 0.5, 0.45, 0],
                    scale: [0.95, 1, 0.98, 0.95],
                  }}
                  transition={{
                    duration: 1.6,
                    times: [0, 0.35, 0.75, 1],
                  }}
                >
                  <BotPulseWheelSvg size="w-24 h-24 sm:w-32 sm:h-32" />
                </motion.div>

                {/* Trailing ghost echo 2: wider emerald blur */}
                <motion.div
                  className="absolute pointer-events-none opacity-20 blur-[6px]"
                  animate={{
                    x: [0, travelDistance * 0.38, -travelDistance * 0.4, 0],
                    opacity: [0, 0.3, 0.25, 0],
                    scale: [0.9, 1.02, 0.95, 0.9],
                  }}
                  transition={{
                    duration: 1.6,
                    times: [0, 0.35, 0.75, 1],
                  }}
                >
                  <BotPulseWheelSvg size="w-24 h-24 sm:w-32 sm:h-32" />
                </motion.div>

                {/* Horizontal dynamic laser velocity trail */}
                <motion.div
                  className="absolute h-1.5 rounded-full pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, #43D6A0 0%, rgba(67, 214, 160, 0.4) 40%, transparent 80%)',
                    filter: 'drop-shadow(0 0 8px #43D6A0)',
                  }}
                  animate={{
                    width: [0, travelDistance * 1.2, travelDistance * 1.4, 0],
                    x: [0, travelDistance * 0.5, -travelDistance * 0.55, 0],
                    opacity: [0, 0.85, 0.75, 0],
                  }}
                  transition={{
                    duration: 1.6,
                    times: [0, 0.35, 0.75, 1],
                  }}
                />
              </>
            )}

            {/* ROTATING WHEEL SVG
                Rotates clockwise, then smoothly reverses to counter-clockwise!
            */}
            <motion.div
              className="relative z-10 flex items-center justify-center"
              animate={
                phase === 'scene1'
                  ? {
                      rotate: [0, 45],
                    }
                  : phase === 'scene2'
                  ? {
                      // Mechanical wheel rotation:
                      // 0deg -> 270deg (Clockwise rotation while moving left)
                      // Then reverses direction!
                      // 270deg -> -360deg -> -720deg (Counter-clockwise rotation while sweeping right & back)
                      rotate: [45, 315, -360, -720],
                    }
                  : {
                      rotate: -720,
                    }
              }
              transition={
                phase === 'scene1'
                  ? {
                      duration: 0.85,
                      ease: [0.16, 1, 0.3, 1],
                    }
                  : phase === 'scene2'
                  ? {
                      duration: 1.6,
                      times: [0, 0.35, 0.75, 1],
                      ease: [0.45, 0.05, 0.25, 1],
                    }
                  : {
                      duration: 0.3,
                    }
              }
            >
              <BotPulseWheelSvg size="w-24 h-24 sm:w-32 sm:h-32" />
            </motion.div>
          </motion.div>

          {/* BotPulse Brand Name & Telemetry readout */}
          <motion.div
            className="mt-8 flex flex-col items-center text-center z-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F7F5] font-sans">
                BotPulse
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#43D6A0]/10 border border-[#43D6A0]/30 text-[#43D6A0]">
                ZERO-TRUST
              </span>
            </div>

            {/* Dynamic Status / Telemetry Stream */}
            <div className="mt-2.5 flex items-center gap-2 text-xs font-mono text-[#A3ADA6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0] animate-ping" />
              <span className="text-[#43D6A0] font-medium">{telemetryText}</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom Screen Telemetry Info */}
        <div className="absolute bottom-6 inset-x-14 flex items-center justify-between text-[10px] font-mono text-[#737F77] tracking-wider pointer-events-none">
          <div className="flex items-center gap-2">
            <span>STATUS: ACTIVE</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="hidden sm:inline">BEHAVIORAL ENGINE READY</span>
          </div>
          <div className="font-mono text-[#A3ADA6]">
            PORT: 443 // TLS 1.3
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * EXACT BotPulse Wheel Logo Asset Component
 * Replicates the exact 8-spoke asterism wheel logo found throughout BotPulse (Navbar, Footer, Dashboard),
 * rendered at high-resolution vector scale with glowing emerald stroke and central core.
 */
interface BotPulseWheelSvgProps {
  size?: string;
}

const BotPulseWheelSvg: React.FC<BotPulseWheelSvgProps> = ({
  size = 'w-24 h-24 sm:w-32 sm:h-32',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#43D6A0"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={`${size} overflow-visible`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter:
          'drop-shadow(0 0 12px rgba(67, 214, 160, 0.9)) drop-shadow(0 0 28px rgba(19, 168, 121, 0.55))',
      }}
    >
      {/* Subtle outer tech ring reinforcing the mechanical wheel motion */}
      <circle
        cx="12"
        cy="12"
        r="10.8"
        stroke="#43D6A0"
        strokeWidth="0.75"
        strokeDasharray="2 3.5"
        opacity="0.35"
      />

      {/* =========================================================================
          THE 8 PRIMARY SPOKES - EXACT BOTPULSE LOGO GEOMETRY
         ========================================================================= */}
      {/* 1. Vertical Spoke */}
      <line x1="12" y1="2" x2="12" y2="22" stroke="#43D6A0" strokeWidth="2.2" strokeLinecap="round" />

      {/* 2. Horizontal Spoke */}
      <line x1="2" y1="12" x2="22" y2="12" stroke="#43D6A0" strokeWidth="2.2" strokeLinecap="round" />

      {/* 3. Diagonal 1 (Top-Left to Bottom-Right) */}
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#43D6A0" strokeWidth="2.2" strokeLinecap="round" />

      {/* 4. Diagonal 2 (Top-Right to Bottom-Left) */}
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" stroke="#43D6A0" strokeWidth="2.2" strokeLinecap="round" />

      {/* Subtle Inner Hub Ring */}
      <circle cx="12" cy="12" r="2.8" stroke="#43D6A0" strokeWidth="0.6" opacity="0.65" />

      {/* =========================================================================
          CENTRAL GLOWING CORE CIRCLE - EXACT BOTPULSE LOGO ASSET
         ========================================================================= */}
      <circle cx="12" cy="12" r="1.6" fill="#43D6A0" />
    </svg>
  );
};
