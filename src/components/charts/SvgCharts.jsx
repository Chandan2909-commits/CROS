import React from 'react';

/**
 * Pure Vector SVG Charts engineered from master_design.md
 */

// 1. Dual Cubic Bézier Trend Chart
export function DualBezierSalesChart({ data, width = 600, height = 220 }) {
  const points = data || [
    { label: '09:00', sales: 1200, upi: 800 },
    { label: '11:00', sales: 3400, upi: 2100 },
    { label: '13:00', sales: 6800, upi: 4500 },
    { label: '15:00', sales: 5200, upi: 3100 },
    { label: '17:00', sales: 9400, upi: 6200 },
    { label: '19:00', sales: 14200, upi: 8900 },
    { label: '21:00', sales: 8600, upi: 5400 }
  ];

  const padding = { top: 20, right: 30, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...points.map(p => Math.max(p.sales, p.upi))) * 1.15 || 15000;

  const getX = (index) => padding.left + (index / (points.length - 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - (val / maxVal) * chartHeight;

  // Generate smooth cubic bezier SVG path
  const generatePath = (key) => {
    return points.reduce((path, p, i, arr) => {
      const x = getX(i);
      const y = getY(p[key]);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1][key]);
      const cp1x = prevX + (x - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) / 2;
      const cp2y = y;
      return `${path} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }, '');
  };

  const salesPath = generatePath('sales');
  const upiPath = generatePath('upi');

  // Closed area paths for gradient fill
  const salesArea = `${salesPath} L ${getX(points.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;
  const upiArea = `${upiPath} L ${getX(points.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e1e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1e1e1e" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="upiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = padding.top + chartHeight * pct;
          const val = Math.round(maxVal * (1 - pct));
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                ₹{(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* Area Fills */}
        <path d={salesArea} fill="url(#salesGrad)" />
        <path d={upiArea} fill="url(#upiGrad)" />

        {/* Bézier Curves */}
        <path d={salesPath} fill="none" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" />
        <path d={upiPath} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(p.sales)} r="3.5" fill="#ffffff" stroke="#1e1e1e" strokeWidth="2" />
            <circle cx={getX(i)} cy={getY(p.upi)} r="3" fill="#ffffff" stroke="#1d4ed8" strokeWidth="2" />
            <text
              x={getX(i)}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#1e1e1e]"></span>
          Total Revenue (All Modes)
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#1d4ed8]"></span>
          Instant UPI Flow
        </span>
      </div>
    </div>
  );
}

// 2. 180° Speedometer Target Gauge
export function SpeedometerGauge({ value = 74, target = 100, label = "Daily Sales Target" }) {
  const percentage = Math.min(100, Math.max(0, (value / target) * 100));
  const radius = 70;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 90;

  // Arc math for 180 degrees
  const angle = (percentage / 100) * 180;
  const angleRad = (angle * Math.PI) / 180;

  // Needle tip coordinates
  const needleLength = 55;
  const needleAngle = Math.PI - angleRad;
  const nx = cx + needleLength * Math.cos(needleAngle);
  const ny = cy - needleLength * Math.sin(needleAngle);

  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-48 select-none">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="70%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e1e1e" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <path
          d="M 30 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Active Progress Arc */}
        <path
          d="M 30 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="220"
          strokeDashoffset={220 - (220 * percentage) / 100}
          className="transition-all duration-700 ease-out"
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        {/* Hub */}
        <circle cx={cx} cy={cy} r="7" fill="#0f172a" />
        <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
      </svg>
      <div className="text-center -mt-3">
        <div className="text-2xl font-extrabold text-[#111827] font-mono tracking-tight">
          {percentage.toFixed(0)}%
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label} (₹{value}k / ₹{target}k)
        </div>
      </div>
    </div>
  );
}

// 3. Payment Distribution Donut Ring
export function PaymentDonutRing({ cashAmount = 18450, upiAmount = 24320 }) {
  const total = cashAmount + upiAmount || 1;
  const cashPct = (cashAmount / total) * 100;
  const upiPct = (upiAmount / total) * 100;

  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74

  const cashOffset = 0;
  const cashLength = (cashPct / 100) * circumference;

  const upiOffset = -cashLength;
  const upiLength = (upiPct / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {/* Cash Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="16"
            strokeDasharray={`${cashLength} ${circumference}`}
            strokeDashoffset={cashOffset}
            className="transition-all duration-500"
          />
          {/* UPI Arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="16"
            strokeDasharray={`${upiLength} ${circumference}`}
            strokeDashoffset={upiOffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Ratio</span>
          <span className="text-base font-extrabold text-slate-900 font-mono">
            {cashPct.toFixed(0)}/{upiPct.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-[#10b981]"></span>
          <div>
            <div className="font-semibold text-slate-800">Cash Sales: {cashPct.toFixed(1)}%</div>
            <div className="font-mono text-slate-500 text-[11px]">₹{cashAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-[#1d4ed8]"></span>
          <div>
            <div className="font-semibold text-slate-800">UPI Instant: {upiPct.toFixed(1)}%</div>
            <div className="font-mono text-slate-500 text-[11px]">₹{upiAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
