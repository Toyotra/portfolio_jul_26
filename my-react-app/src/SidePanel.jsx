import React from 'react';
import './SidePanel.css';

/* ─── Timing seeds ─────────────────────────────────────────
   Left  (L) and right (R) panels use completely independent
   timing seeds so nothing ever syncs between them.
   ────────────────────────────────────────────────────────── */
const L = {
  scanDur: '6.7s',  scanDelay: '0s',
  ringDur: '22s',   ringInnerDur: '15s',
  diamondDur: '30s',
  wireDur: '7.7s',
  ticksDur: '14s',
  waveDur: '9s',
  windowDur: '5.3s',
  cutoutDur: '4.2s',
  capDur: '4.1s',
  capDotDur: '2.8s',
  segDur: '3.0s',
};

const R = {
  scanDur: '7.3s',  scanDelay: '1.8s',
  ringDur: '19s',   ringInnerDur: '26s',
  diamondDur: '25s',
  wireDur: '6.3s',
  ticksDur: '11s',
  waveDur: '7.5s',
  windowDur: '4.7s',
  cutoutDur: '3.8s',
  capDur: '3.6s',
  capDotDur: '2.3s',
  segDur: '3.5s',
};

/* ─── Helpers ────────────────────────────────────────────── */
const segDelays = (base, count) =>
  Array.from({ length: count }, (_, i) => `${base + i * 0.55}s`);

const dotDelays = (base, count) =>
  Array.from({ length: count }, (_, i) => `${base + i * 0.35}s`);

const wireDelays = ['0s', '-3.2s', '-5.8s'];

const tickRows = [
  { pct: '5%',  cls: 'major' },
  { pct: '11%', cls: 'minor' },
  { pct: '17%', cls: 'major' },
  { pct: '23%', cls: 'minor' },
  { pct: '29%', cls: 'major' },
  { pct: '35%', cls: 'minor' },
  { pct: '41%', cls: 'major' },
  { pct: '47%', cls: 'minor' },
  { pct: '53%', cls: 'major' },
  { pct: '59%', cls: 'minor' },
  { pct: '65%', cls: 'major' },
  { pct: '71%', cls: 'minor' },
  { pct: '77%', cls: 'major' },
  { pct: '83%', cls: 'minor' },
  { pct: '89%', cls: 'major' },
  { pct: '95%', cls: 'minor' },
];

/* ─── Background grid SVG ────────────────────────────────── */
const GridSvg = () => (
  <svg className="sp-bg-svg" viewBox="0 0 88 100" preserveAspectRatio="none">
    <defs>
      <pattern id="grid" width="8.8" height="8.8" patternUnits="userSpaceOnUse">
        <path d="M 8.8 0 L 0 0 0 8.8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
      </pattern>
    </defs>
    <rect width="88" height="100" fill="url(#grid)" />
  </svg>
);

/* ─── Diamond ring SVG ───────────────────────────────────── */
const DiamondSvg = ({ seed, dur }) => {
  const cx = 44, cy = 50;
  const rx = 30, ry = 30;
  const pts = [0, 1, 2, 3].map(i => {
    const a = (Math.PI / 2) * i + seed;
    return `${cx + rx * Math.cos(a)},${cy + ry * Math.sin(a)}`;
  }).join(' ');

  return (
    <svg className="sp-diamond-svg" viewBox="0 0 88 100" preserveAspectRatio="xMidYMid meet" style={{ animationDuration: dur }}>
      <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.5" />
      <line x1={cx - rx} y1={cy} x2={cx + rx} y2={cy} stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
      <line x1={cx} y1={cy - ry} x2={cx} y2={cy} stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
    </svg>
  );
};

/* ─── Waveform strip ─────────────────────────────────────── */
const WaveSvg = () => {
  const pts1 = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 88;
    const y = 10 + Math.sin(i * 0.55) * 3.5 + Math.sin(i * 1.3) * 1.5;
    return `${x},${y}`;
  }).join(' ');

  const pts2 = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * 88;
    const y = 10 + Math.cos(i * 0.6 + 1) * 3 + Math.cos(i * 1.1) * 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 88 20" preserveAspectRatio="none">
      <polyline points={pts1} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
      <polyline points={pts2} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
    </svg>
  );
};

/* ─── Tick mark rows ─────────────────────────────────────── */
const TickZone = ({ ticks, dur, delay }) => (
  <div className="sp-tick-zone" style={{ animationDuration: dur, animationDelay: delay }}>
    {[...ticks, ...ticks].map((t, i) => (
      <div
        key={i}
        className={`sp-tick sp-tick--${t.cls}`}
        style={{ top: t.pct }}
      />
    ))}
  </div>
);

/* ─── Light bar segments ─────────────────────────────────── */
const SegBar = ({ dur: _dur, segDelays }) => (
  <div className="sp-bar-track">
    {segDelays.map((d, i) => (
      <div key={i} className="sp-bar-seg" style={{ '--seg-delay': d }} />
    ))}
  </div>
);

/* ─── Indicator dots ─────────────────────────────────────── */
const DotsColumn = ({ delays, mirrorClass }) => (
  <div className={`sp-dots ${mirrorClass}`}>
    {delays.map((d, i) => (
      <div key={i} className="sp-dot" style={{ '--dot-delay': d }} />
    ))}
  </div>
);

/* ─── Traveling wire group ───────────────────────────────── */
const Wires = ({ delays, dur }) => (
  <div className="sp-wires">
    {delays.map((d, i) => (
      <div key={i} className="sp-wire" style={{ top: `${28 + i * 22}%`, '--wire-delay': d, '--wire-dur': dur }} />
    ))}
  </div>
);

/* ─── Main panel ─────────────────────────────────────────── */
function SidePanel({ side }) {
  const isLeft = side === 'left';
  const T = isLeft ? L : R;
  const mirrorClass = isLeft ? '' : 'sp-dots--left';
  const tickSeed     = isLeft ? 0 : 0.5;

  const segDels  = segDelays(0.1, 14);
  const dotDels  = dotDelays(0.05, 14);
  const wireDels = wireDelays;

  return (
    <div className={`sp sp--${side}`}>
      {/* Outer shell */}
      <div className="sp-shell">
        {/* Corner brackets */}
        <div className="sp-corner sp-corner--tl" />
        <div className="sp-corner sp-corner--tr" />
        <div className="sp-corner sp-corner--bl" />
        <div className="sp-corner sp-corner--br" />

        {/* Edge accent */}
        <div className="sp-edge" />

        {/* Inner recessed panel */}
        <div className="sp-inner">

          {/* Background grid */}
          <GridSvg />

          {/* Diamond ring */}
          <DiamondSvg seed={tickSeed} dur={T.diamondDur} />

          {/* Scanning line + glow halo */}
          <div className="sp-scan"    style={{ '--scan-dur': T.scanDur, '--scan-delay': T.scanDelay }} />
          <div className="sp-scan-halo" style={{ '--scan-dur': T.scanDur, '--scan-delay': T.scanDelay }} />

          {/* Tick scrolling zone */}
          <TickZone ticks={tickRows} dur={T.ticksDur} delay={isLeft ? '0s' : '-5s'} />

          {/* Center structural seam */}
          <div className="sp-seam" />

          {/* Traveling wire segments */}
          <Wires delays={wireDels} dur={T.wireDur} />

          {/* Segmented light bar */}
          <SegBar dur={T.segDur} segDelays={segDels} />

          {/* Rotating rings */}
          <div className="sp-ring sp-ring--outer" style={{ '--ring-dur': T.ringDur }} />
          <div className="sp-ring sp-ring--inner" style={{ '--ring-dur-inner': T.ringInnerDur }} />

          {/* Blinking indicator dots */}
          <DotsColumn delays={dotDels} mirrorClass={mirrorClass} />

          {/* Top waveform strip */}
          <div className="sp-wave sp-wave--top">
            <WaveSvg />
          </div>

          {/* Bottom waveform strip */}
          <div className="sp-wave sp-wave--bottom">
            <WaveSvg />
          </div>

          {/* Top data window */}
          <div className="sp-window sp-window--top" style={{ '--window-dur': T.windowDur, '--window-delay': isLeft ? '0s' : '1.5s' }}>
            <span className="sp-window-label">SYS:ONLINE</span>
          </div>

          {/* Bottom data window */}
          <div className="sp-window sp-window--bottom" style={{ '--window-dur': T.windowDur, '--window-delay': isLeft ? '2s' : '0.5s' }}>
            <span className="sp-window-label">GRID:ACTIVE</span>
          </div>

          {/* Mechanical cutouts */}
          <div className="sp-cutout sp-cutout--top" style={{ '--cutout-dur': T.cutoutDur, '--cutout-delay': isLeft ? '0s' : '1s' }}>
            <div className="sp-cutout-pulse" style={{ '--pulse-delay': '0s' }} />
          </div>
          <div className="sp-cutout sp-cutout--bottom" style={{ '--cutout-dur': T.cutoutDur, '--cutout-delay': isLeft ? '1.5s' : '0s' }}>
            <div className="sp-cutout-pulse" style={{ '--pulse-delay': isLeft ? '1.5s' : '0s' }} />
          </div>
        </div>

        {/* Top cap */}
        <div className="sp-cap sp-cap--top">
          <div className="sp-cap-line" style={{ '--cap-dur': T.capDur, '--cap-delay': isLeft ? '0s' : '1s' }} />
          <div className="sp-cap-cap-dot" style={{ '--cap-dot-dur': T.capDotDur, '--cap-dot-delay': isLeft ? '0s' : '0.8s' }} />
        </div>

        {/* Bottom cap */}
        <div className="sp-cap sp-cap--bottom">
          <div className="sp-cap-line" style={{ '--cap-dur': T.capDur, '--cap-delay': isLeft ? '1.5s' : '0s' }} />
          <div className="sp-cap-cap-dot" style={{ '--cap-dot-dur': T.capDotDur, '--cap-dot-delay': isLeft ? '1s' : '0s' }} />
        </div>
      </div>
    </div>
  );
}

export default SidePanel;
