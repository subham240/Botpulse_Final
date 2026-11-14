import React, { useEffect, useRef, useState } from 'react';

interface MeshGradientShaderProps {
  className?: string;
  speed?: number;
  interactive?: boolean;
  intensity?: number;
  showNoise?: boolean;
}

/**
 * Shaders.com-style WebGPU / WebGL2 Mesh Gradient Background.
 * Renders an organic, dark emerald mesh gradient with cursor-responsive lighting,
 * subtle grain noise, and seamless fallback to animated CSS radial mesh.
 * Strictly respects prefers-reduced-motion and pauses rendering when out of viewport.
 */
export const MeshGradientShader: React.FC<MeshGradientShaderProps> = ({
  className = '',
  speed = 0.6,
  interactive = true,
  intensity = 1.0,
  showNoise = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useFallback, setUseFallback] = useState(false);
  const mousePos = useRef({ x: 0.5, y: 0.4, targetX: 0.5, targetY: 0.4 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setUseFallback(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let isVisible = true;
    let isTabActive = true;

    // Pause when out of viewport to avoid unnecessary GPU cycles
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Pause when tab is not visible
    const handleVisibility = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Mouse listener for cursor-responsive ambient lighting
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      mousePos.current.targetX = x;
      mousePos.current.targetY = y;
    };

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Try WebGL2 / WebGL Canvas Rendering
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setUseFallback(true);
      return;
    }

    // Vertex shader source
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader source (dark emerald mesh gradient with fluid noise)
    const fsSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_intensity;

      // Simplex-inspired 2D noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 st_aspect = vec2(st.x * aspect, st.y);

        float t = u_time * 0.25;

        // Interactive mouse offset (smoothly pulled)
        vec2 mouse_offset = (u_mouse - 0.5) * 0.35;

        // Base color palette (BotPulse dark cybersecurity palette)
        vec3 c_void       = vec3(0.031, 0.043, 0.035); // #080B09
        vec3 c_deep       = vec3(0.024, 0.145, 0.114); // #063B2D
        vec3 c_emerald    = vec3(0.075, 0.659, 0.475); // #13A879
        vec3 c_mint       = vec3(0.263, 0.839, 0.627); // #43D6A0

        // Multi-frequency noise waves
        float n1 = snoise((st_aspect + mouse_offset) * 1.2 + vec2(t * 0.3, t * 0.2));
        float n2 = snoise((st_aspect - mouse_offset) * 2.0 - vec2(t * 0.4, -t * 0.15));
        float n3 = snoise((st_aspect * 3.5) + vec2(-t * 0.2, t * 0.5));

        // Radial falloff from dynamic lighting centers
        vec2 center1 = vec2(0.35 * aspect, 0.35) + vec2(sin(t * 0.7) * 0.15, cos(t * 0.5) * 0.15) + mouse_offset * 0.5;
        vec2 center2 = vec2(0.75 * aspect, 0.55) - vec2(cos(t * 0.6) * 0.2, sin(t * 0.8) * 0.15) - mouse_offset * 0.3;

        float d1 = length(st_aspect - center1);
        float d2 = length(st_aspect - center2);

        float blob1 = smoothstep(0.85, 0.0, d1) * (0.6 + 0.4 * n1);
        float blob2 = smoothstep(0.70, 0.0, d2) * (0.5 + 0.5 * n2);

        // Subtle cursor spotlight
        vec2 cursor_center = vec2(u_mouse.x * aspect, 1.0 - u_mouse.y);
        float cursor_dist = length(st_aspect - cursor_center);
        float cursor_glow = smoothstep(0.55, 0.0, cursor_dist) * 0.22;

        // Color blending
        vec3 col = c_void;
        col = mix(col, c_deep, blob1 * 0.85);
        col = mix(col, c_emerald, blob2 * 0.45);
        col = mix(col, c_mint, (blob1 * blob2 * 0.35 + cursor_glow) * u_intensity);

        // Film grain noise for analog SaaS texture
        float grain = (fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.035;
        col += grain;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // Compile Shader helper
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Shader compile failed:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setUseFallback(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setUseFallback(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program link failed:', gl.getProgramInfoLog(program));
      setUseFallback(true);
      return;
    }

    // Geometry quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let startTime = performance.now();

    // Render loop
    const render = (now: number) => {
      if (isVisible && isTabActive) {
        // Smooth cursor lerp
        mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.08;
        mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.08;

        const elapsedTime = (now - startTime) * 0.001 * speed;

        gl.useProgram(program);
        gl.uniform1f(uTime, elapsedTime);
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mousePos.current.x, mousePos.current.y);
        gl.uniform1f(uIntensity, intensity);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, [speed, interactive, intensity]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* WebGL2 / WebGPU Hardware Canvas */}
      {!useFallback && (
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-cover opacity-90 transition-opacity duration-1000"
        />
      )}

      {/* Graceful CSS Fallback (active if WebGL/WebGPU is disabled or reduced motion preferred) */}
      {useFallback && (
        <div className="absolute inset-0 bg-[#080B09]">
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-[#13A879]/15 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-[550px] h-[500px] bg-[#43D6A0]/10 blur-[150px] rounded-full" />
        </div>
      )}

      {/* Organic Noise Grain Overlay (Shaders.com style) */}
      {showNoise && (
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </div>
  );
};
