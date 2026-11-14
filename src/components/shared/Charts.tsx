import React, { useState } from 'react';

export interface TrafficDataPoint {
  timestamp?: number;
  time: string;
  human: number;
  bot?: number;
  bots?: number;
  aiAgent?: number;
  agents?: number;
  total?: number;
  requests?: number;
  human_requests?: number;
  bot_requests?: number;
  agent_requests?: number;
}

// Bounded monotonic cubic spline that never dips below the baseline
function createSmoothPath(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier conversion (tension 1/6)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // Strictly clamp control points so curves never dip below baseline baseY
    cp1y = Math.min(baseY, Math.max(10, cp1y));
    cp2y = Math.min(baseY, Math.max(10, cp2y));

    // If both points are flat at baseline, keep straight horizontal line
    if (Math.abs(p1.y - baseY) < 0.1 && Math.abs(p2.y - baseY) < 0.1) {
      cp1y = baseY;
      cp2y = baseY;
    }

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export const AreaTrendChart: React.FC<{
  data?: TrafficDataPoint[];
  height?: number;
}> = ({ data = [], height = 240 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [metricMode, setMetricMode] = useState<'sessions' | 'requests'>('sessions');

  const getBot = (d: TrafficDataPoint) => d.bot ?? d.bots ?? 0;
  const getAgent = (d: TrafficDataPoint) => d.aiAgent ?? d.agents ?? 0;

  // Format timestamp into user's local timezone
  const formatTimeLabel = (d: TrafficDataPoint): string => {
    if (d.timestamp && d.timestamp > 0) {
      try {
        const dt = new Date(d.timestamp);
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {
        return d.time;
      }
    }
    return d.time;
  };

  const formatTooltipTime = (d: TrafficDataPoint): string => {
    if (d.timestamp && d.timestamp > 0) {
      try {
        const dt = new Date(d.timestamp);
        const timeStr = dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${dateStr}, ${timeStr}`;
      } catch {
        return d.time;
      }
    }
    return d.time;
  };

  // Check if data has any activity
  const totalVolume = data.reduce((sum, d) => sum + d.human + getBot(d) + getAgent(d) + (d.requests || 0), 0);
  if (!data || data.length === 0 || totalVolume === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center rounded-xl bg-[#0B0F0D]/60 border border-white/5 text-center px-4"
        style={{ height }}
      >
        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[#A3ADA6] mb-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <p className="text-xs font-mono text-[#F5F7F5] font-medium">No Traffic Recorded Yet</p>
        <p className="text-[11px] text-[#A3ADA6] max-w-xs mt-1">
          Visitor activity will be plotted here in real time as requests are analyzed.
        </p>
      </div>
    );
  }

  // Ensure at least 2 points for smooth spline calculation
  const plotData = (data.length === 1
    ? [
        { ...data[0], time: 'Start', human: 0, bot: 0, aiAgent: 0, requests: 0 },
        data[0],
      ]
    : data).map((d) => {
      const hSess = d.human;
      const bSess = getBot(d);
      const aSess = getAgent(d);
      const hReq = d.human_requests != null ? d.human_requests : d.human;
      const bReq = d.bot_requests != null ? d.bot_requests : getBot(d);
      const aReq = d.agent_requests != null ? d.agent_requests : getAgent(d);

      return {
        raw: d,
        displayTime: formatTimeLabel(d),
        tooltipTime: formatTooltipTime(d),
        // Active metric plotted based on mode
        humanVal: metricMode === 'sessions' ? hSess : hReq,
        botVal: metricMode === 'sessions' ? bSess : bReq,
        agentVal: metricMode === 'sessions' ? aSess : aReq,
        // Exact numbers for tooltip display
        humanSessions: hSess,
        botSessions: bSess,
        agentSessions: aSess,
        totalSessions: (d.total != null) ? d.total : (hSess + bSess + aSess),
        humanRequests: hReq,
        botRequests: bReq,
        agentRequests: aReq,
        totalRequests: (d.requests != null) ? d.requests : (hReq + bReq + aReq),
      };
    });

  const maxVal = Math.max(
    ...plotData.map((d) => Math.max(d.humanVal, d.botVal, d.agentVal, 2)),
    3
  ) * 1.25;

  const width = 800;
  const paddingTop = 24;
  const paddingBottom = 34;
  const paddingLeft = 40;
  const paddingRight = 24;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const baseY = paddingTop + chartHeight;

  const pointsHuman = plotData.map((d, i) => {
    const x = paddingLeft + (i / (plotData.length - 1)) * chartWidth;
    const y = baseY - (d.humanVal / maxVal) * chartHeight;
    return { x, y, val: d.humanVal };
  });

  const pointsBot = plotData.map((d, i) => {
    const x = paddingLeft + (i / (plotData.length - 1)) * chartWidth;
    const y = baseY - (d.botVal / maxVal) * chartHeight;
    return { x, y, val: d.botVal };
  });

  const pointsAgent = plotData.map((d, i) => {
    const x = paddingLeft + (i / (plotData.length - 1)) * chartWidth;
    const y = baseY - (d.agentVal / maxVal) * chartHeight;
    return { x, y, val: d.agentVal };
  });

  const pathHuman = createSmoothPath(pointsHuman, baseY);
  const pathBot = createSmoothPath(pointsBot, baseY);
  const pathAgent = createSmoothPath(pointsAgent, baseY);

  const areaHuman = `${pathHuman} L ${pointsHuman[pointsHuman.length - 1].x.toFixed(1)} ${baseY} L ${pointsHuman[0].x.toFixed(1)} ${baseY} Z`;

  // Accurate mouse move handler snapping to closest point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    if (!svgRect.width) return;
    const mouseX = ((e.clientX - svgRect.left) / svgRect.width) * width;
    const clampedX = Math.max(paddingLeft, Math.min(paddingLeft + chartWidth, mouseX));
    const step = chartWidth / (plotData.length - 1);
    const closestIdx = Math.max(0, Math.min(plotData.length - 1, Math.round((clampedX - paddingLeft) / step)));
    setHoveredIndex(closestIdx);
  };

  // Smart tooltip positioning clamped inside container
  const tooltipLeftPct = hoveredIndex !== null
    ? Math.max(12, Math.min(88, (pointsHuman[hoveredIndex].x / width) * 100))
    : 50;

  return (
    <div className="w-full relative select-none">
      {/* Metric Mode Toggle (Sessions vs Requests) */}
      <div className="flex items-center justify-end mb-2 gap-1 text-[11px] font-mono">
        <span className="text-[#737F77] mr-1.5">Plot Metric:</span>
        <button
          onClick={() => setMetricMode('sessions')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            metricMode === 'sessions'
              ? 'bg-[#18221D] text-[#43D6A0] font-bold border border-[#43D6A0]/30 shadow-sm'
              : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
          }`}
        >
          Visitor Sessions
        </button>
        <button
          onClick={() => setMetricMode('requests')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            metricMode === 'requests'
              ? 'bg-[#18221D] text-[#38BDF8] font-bold border border-[#38BDF8]/30 shadow-sm'
              : 'text-[#A3ADA6] hover:text-[#F5F7F5]'
          }`}
        >
          HTTP Requests
        </button>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="humanAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#43D6A0" stopOpacity="0.28" />
            <stop offset="85%" stopColor="#43D6A0" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#43D6A0" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid guide lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          return (
            <g key={ratio}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                fill="#737F77"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                {Math.round(maxVal * ratio)}
              </text>
            </g>
          );
        })}

        {/* Area fill for Human traffic */}
        <path d={areaHuman} fill="url(#humanAreaGrad)" />

        {/* Spline lines with smooth bounded Catmull-Rom math */}
        <path d={pathHuman} fill="none" stroke="#43D6A0" strokeWidth="2.4" strokeLinecap="round" />
        <path d={pathBot} fill="none" stroke="#F59E0B" strokeWidth="2.0" strokeDasharray="4 4" strokeLinecap="round" />
        <path d={pathAgent} fill="none" stroke="#38BDF8" strokeWidth="2.0" strokeLinecap="round" />

        {/* Permanent Subtle Data Points on Lines */}
        {plotData.map((d, i) => (
          <g key={i}>
            {d.humanVal > 0 && (
              <circle cx={pointsHuman[i].x} cy={pointsHuman[i].y} r="2.5" fill="#43D6A0" />
            )}
            {d.botVal > 0 && (
              <circle cx={pointsBot[i].x} cy={pointsBot[i].y} r="2.5" fill="#F59E0B" />
            )}
            {d.agentVal > 0 && (
              <circle cx={pointsAgent[i].x} cy={pointsAgent[i].y} r="2.5" fill="#38BDF8" />
            )}
          </g>
        ))}

        {/* X Axis Local Time Labels */}
        {plotData.map((d, i) => {
          // Prevent label crowding: show every 2nd label if more than 8 points
          if (plotData.length > 8 && i % 2 !== 0 && i !== plotData.length - 1) return null;
          const x = paddingLeft + (i / (plotData.length - 1)) * chartWidth;
          return (
            <text
              key={i}
              x={x}
              y={height - 10}
              fill="#A3ADA6"
              fontSize="10"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
            >
              {d.displayTime}
            </text>
          );
        })}

        {/* Interactive Hover Crosshair & Highlights */}
        {hoveredIndex !== null && (
          <g className="pointer-events-none">
            <line
              x1={pointsHuman[hoveredIndex].x}
              y1={paddingTop}
              x2={pointsHuman[hoveredIndex].x}
              y2={baseY}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
            {/* Highlighted circles for each line */}
            <circle
              cx={pointsHuman[hoveredIndex].x}
              cy={pointsHuman[hoveredIndex].y}
              r="5"
              fill="#43D6A0"
              stroke="#080B09"
              strokeWidth="2.5"
            />
            <circle
              cx={pointsBot[hoveredIndex].x}
              cy={pointsBot[hoveredIndex].y}
              r="5"
              fill="#F59E0B"
              stroke="#080B09"
              strokeWidth="2.5"
            />
            <circle
              cx={pointsAgent[hoveredIndex].x}
              cy={pointsAgent[hoveredIndex].y}
              r="5"
              fill="#38BDF8"
              stroke="#080B09"
              strokeWidth="2.5"
            />
          </g>
        )}
      </svg>

      {/* Clean Floating Tooltip with Exact Figures */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-20 px-3.5 py-2.5 rounded-lg bg-[#121A16] border border-white/15 shadow-2xl pointer-events-none text-xs font-mono backdrop-blur-md"
          style={{
            left: `${tooltipLeftPct}%`,
            top: '32px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-[#F5F7F5] border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between gap-4">
            <span className="text-[#43D6A0] font-bold">{plotData[hoveredIndex].tooltipTime}</span>
            <span className="text-[10px] text-[#A3ADA6]">
              {plotData[hoveredIndex].totalSessions} sessions ({plotData[hoveredIndex].totalRequests} reqs)
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-4 text-[#43D6A0]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#43D6A0]" />
                <span>Human Visitors:</span>
              </span>
              <span className="font-bold">
                {plotData[hoveredIndex].humanSessions} {plotData[hoveredIndex].humanSessions === 1 ? 'session' : 'sessions'}
                <span className="text-[10px] font-normal text-[#737F77] ml-1">
                  ({plotData[hoveredIndex].humanRequests} reqs)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Automated Bots:</span>
              </span>
              <span className="font-bold">
                {plotData[hoveredIndex].botSessions} {plotData[hoveredIndex].botSessions === 1 ? 'session' : 'sessions'}
                <span className="text-[10px] font-normal text-[#737F77] ml-1">
                  ({plotData[hoveredIndex].botRequests} reqs)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-[#38BDF8]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                <span>AI Agents:</span>
              </span>
              <span className="font-bold">
                {plotData[hoveredIndex].agentSessions} {plotData[hoveredIndex].agentSessions === 1 ? 'session' : 'sessions'}
                <span className="text-[10px] font-normal text-[#737F77] ml-1">
                  ({plotData[hoveredIndex].agentRequests} reqs)
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TrafficDonutChart: React.FC<{
  humanCount?: number;
  botCount?: number;
  aiAgentCount?: number;
}> = ({ humanCount = 0, botCount = 0, aiAgentCount = 0 }) => {
  const total = humanCount + botCount + aiAgentCount;

  const humanPct = total > 0 ? Math.round((humanCount / total) * 100) : 0;
  const botPct = total > 0 ? Math.round((botCount / total) * 100) : 0;
  const aiAgentPct = total > 0 ? Math.max(0, 100 - humanPct - botPct) : 0;

  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const humanDash = (humanPct / 100) * circumference;
  const botDash = (botPct / 100) * circumference;
  const aiDash = (aiAgentPct / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-[160px] h-[160px] shrink-0">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Base Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />

          {total > 0 && (
            <>
              {/* Human Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#43D6A0"
                strokeWidth={strokeWidth}
                strokeDasharray={`${humanDash} ${circumference}`}
                strokeDashoffset={0}
                strokeLinecap="round"
              />
              {/* Bot Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeDasharray={`${botDash} ${circumference}`}
                strokeDashoffset={-humanDash}
                strokeLinecap="round"
              />
              {/* AI Agent Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#38BDF8"
                strokeWidth={strokeWidth}
                strokeDasharray={`${aiDash} ${circumference}`}
                strokeDashoffset={-(humanDash + botDash)}
                strokeLinecap="round"
              />
            </>
          )}
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-[#F5F7F5]">
            {total > 0 ? `${humanPct}%` : '0%'}
          </span>
          <span className="text-[10px] font-mono uppercase text-[#A3ADA6]">
            {total > 0 ? 'Verified Human' : 'No Visitors'}
          </span>
        </div>
      </div>

      {/* Minimal Legend */}
      <div className="space-y-2 w-full text-xs font-mono">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#18221D] border border-white/5">
          <div className="flex items-center gap-2 text-[#F5F7F5]">
            <span className="w-2 h-2 rounded-full bg-[#43D6A0]" />
            <span>Human Visitors</span>
          </div>
          <span className="font-bold text-[#43D6A0]">{humanPct}%</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#18221D] border border-white/5">
          <div className="flex items-center gap-2 text-[#F5F7F5]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Automated Bots</span>
          </div>
          <span className="font-bold text-amber-400">{botPct}%</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#18221D] border border-white/5">
          <div className="flex items-center gap-2 text-[#F5F7F5]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span>AI Agents</span>
          </div>
          <span className="font-bold text-[#38BDF8]">{aiAgentPct}%</span>
        </div>
      </div>
    </div>
  );
};
