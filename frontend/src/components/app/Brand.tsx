/* Brand artwork drawn in SVG: steering wheel (app icon / logo "O"), the RajWorthman truck, and the highway scene. */
import type { ReactNode } from 'react';
import logoHorizontal from '../../assets/brand/logo-horizontal.png';
import { cn } from '../../lib/utils';

/* Steering wheel matching the "O" in the RajWorthman wordmark */
export const SteeringWheel = ({ className, rim = 'url(#rw-rim)', spoke = '#0A1A33' }: { className?: string; rim?: string; spoke?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <defs>
      <linearGradient id="rw-rim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF8A2B" />
        <stop offset="1" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="40" fill="none" stroke={rim} strokeWidth="12" />
    <path d="M14 46 Q50 34 86 46 L86 54 Q66 50 58 58 L56 88 L44 88 L42 58 Q34 50 14 54 Z" fill={spoke} />
    <circle cx="50" cy="54" r="11" fill="#0A1A33" stroke={spoke === '#0A1A33' ? '#F3F5F9' : spoke} strokeWidth="2.5" />
    <circle cx="50" cy="54" r="4" fill="#E8650A" />
  </svg>
);

/* Side view of a RajWorthman truck (faces right). Wheels spin when `spinning` is set. */
export const Truck = ({ className, spinning = false }: { className?: string; spinning?: boolean }) => (
  <svg viewBox="0 0 380 160" className={className} aria-hidden>
    <defs>
      <linearGradient id="rw-cab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1B3766" />
        <stop offset="1" stopColor="#0A1A33" />
      </linearGradient>
      <linearGradient id="rw-box" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E9EDF3" />
      </linearGradient>
      <linearGradient id="rw-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#CFE6FF" />
        <stop offset="1" stopColor="#7FB2E5" />
      </linearGradient>
    </defs>
    {/* shadow */}
    <ellipse cx="190" cy="146" rx="175" ry="7" fill="#000" opacity=".35" />
    {/* container */}
    <rect x="8" y="14" width="232" height="100" rx="8" fill="url(#rw-box)" stroke="#C9D2DE" strokeWidth="2" />
    <rect x="8" y="98" width="232" height="16" fill="#E8650A" />
    <rect x="8" y="98" width="232" height="5" fill="#C2410C" />
    <image href={logoHorizontal} x="22" y="30" width="204" height="58" preserveAspectRatio="xMidYMid meet" />
    {/* chassis */}
    <rect x="6" y="114" width="340" height="10" rx="3" fill="#1F2937" />
    {/* cab */}
    <path d="M248 114 V42 Q248 30 260 30 H306 Q318 30 325 40 L352 80 Q358 88 358 98 V114 Z" fill="url(#rw-cab)" />
    <path d="M300 40 H305 Q312 40 316 46 L336 76 H300 Z" fill="url(#rw-glass)" />
    <path d="M300 40 V76" stroke="#0A1A33" strokeWidth="3" />
    <rect x="258" y="44" width="34" height="32" rx="4" fill="url(#rw-glass)" opacity=".9" />
    <rect x="256" y="86" width="36" height="4" rx="2" fill="#E8650A" />
    <rect x="344" y="92" width="14" height="14" rx="3" fill="#E8650A" />
    <rect x="350" y="84" width="8" height="8" rx="2" fill="#FFE7A3" />
    <rect x="242" y="20" width="6" height="40" rx="2" fill="#9CA3AF" />
    {/* wheels */}
    {[56, 104, 200, 312].map((cx) => (
      <g key={cx} transform={`translate(${cx} 126)`}>
        <circle r="19" fill="#0B0F17" />
        <g className={cn(spinning && 'rw-wheel')}>
          <circle r="9" fill="#9CA3AF" />
          <path d="M0 -9 V9 M-9 0 H9" stroke="#4B5563" strokeWidth="3" />
          <circle r="3" fill="#E5E7EB" />
        </g>
      </g>
    ))}
  </svg>
);

/* Night highway with a perspective road; `children` sits on top (logo, titles). */
export const HighwayHero = ({ children, className, animated = true }: { children?: ReactNode; className?: string; animated?: boolean }) => (
  <div className={cn('relative overflow-hidden bg-highway text-white', className)}>
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="rw-sun" cx="50%" cy="100%" r="60%">
          <stop offset="0" stopColor="#FF8A2B" stopOpacity=".95" />
          <stop offset=".45" stopColor="#E8650A" stopOpacity=".35" />
          <stop offset="1" stopColor="#E8650A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rw-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A3446" />
          <stop offset="1" stopColor="#121826" />
        </linearGradient>
      </defs>
      {/* stars */}
      {[[40, 30], [90, 60], [150, 22], [230, 40], [300, 18], [350, 70], [70, 110], [330, 120], [200, 80], [120, 95]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} fill="#fff" opacity={0.35 + (i % 4) * 0.12} />
      ))}
      {/* horizon glow */}
      <ellipse cx="200" cy="168" rx="230" ry="80" fill="url(#rw-sun)" />
      <circle cx="200" cy="168" r="30" fill="#FF9A3C" opacity=".85" />
      {/* hills */}
      <path d="M0 170 L50 140 L95 160 L150 128 L205 165 L260 132 L320 158 L360 138 L400 160 V300 H0 Z" fill="#0B1A35" />
      <path d="M0 182 L60 160 L120 178 L180 156 L240 180 L300 160 L360 178 L400 166 V300 H0 Z" fill="#081429" />
      {/* road */}
      <path d="M188 168 L212 168 L400 300 L0 300 Z" fill="url(#rw-road)" />
      <path d="M188 168 L0 300" stroke="#E8650A" strokeWidth="3" opacity=".9" />
      <path d="M212 168 L400 300" stroke="#E8650A" strokeWidth="3" opacity=".9" />
      <line x1="200" y1="170" x2="200" y2="300" stroke="#F8D9B8" strokeWidth="5" strokeDasharray="12 14" className={cn(animated && 'rw-road-dash')} />
      {/* road-side poles */}
      {[[150, 196, 0.5], [110, 222, 0.75], [60, 256, 1]].map(([x, y, s], i) => (
        <g key={i}>
          <rect x={x} y={y - 30 * s} width={3 * s} height={30 * s} fill="#1C2A45" />
          <rect x={400 - x - 3 * s} y={y - 30 * s} width={3 * s} height={30 * s} fill="#1C2A45" />
          <circle cx={x + 1.5 * s} cy={y - 30 * s} r={2.5 * s} fill="#FFC27A" />
          <circle cx={400 - x - 1.5 * s} cy={y - 30 * s} r={2.5 * s} fill="#FFC27A" />
        </g>
      ))}
    </svg>
    <div className="relative">{children}</div>
  </div>
);

/* Global keyframes used by the art above (kept here so the components are self-contained) */
export const BrandStyles = () => (
  <style>{`
    @keyframes rw-spin { to { transform: rotate(360deg); } }
    .rw-wheel { animation: rw-spin .45s linear infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes rw-dash { to { stroke-dashoffset: -26; } }
    .rw-road-dash { animation: rw-dash .6s linear infinite; }
    @media (prefers-reduced-motion: reduce) { .rw-wheel, .rw-road-dash { animation: none; } }
  `}</style>
);
