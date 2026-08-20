import { useState, useEffect, useRef } from 'react';
import './LoadingScreen.css';

const CUBE_EDGES = [
  { x1: 140, y1: 140, x2: 260, y2: 140, delay: '0.00s' },
  { x1: 260, y1: 140, x2: 260, y2: 260, delay: '0.08s' },
  { x1: 260, y1: 260, x2: 140, y2: 260, delay: '0.16s' },
  { x1: 140, y1: 260, x2: 140, y2: 140, delay: '0.24s' },
  { x1: 170, y1: 170, x2: 290, y2: 170, delay: '0.38s' },
  { x1: 290, y1: 170, x2: 290, y2: 290, delay: '0.46s' },
  { x1: 290, y1: 290, x2: 170, y2: 290, delay: '0.54s' },
  { x1: 170, y1: 290, x2: 170, y2: 170, delay: '0.62s' },
  { x1: 140, y1: 140, x2: 170, y2: 170, delay: '0.74s' },
  { x1: 260, y1: 140, x2: 290, y2: 170, delay: '0.82s' },
  { x1: 260, y1: 260, x2: 290, y2: 290, delay: '0.90s' },
  { x1: 140, y1: 260, x2: 170, y2: 290, delay: '0.98s' },
];

const ARCH_LINES = [
  { x1: 140, y1: 140, x2: 100, y2: 100, delay: '0.70s' },
  { x1: 260, y1: 140, x2: 300, y2: 100, delay: '0.75s' },
  { x1: 260, y1: 260, x2: 300, y2: 300, delay: '0.80s' },
  { x1: 140, y1: 260, x2: 100, y2: 300, delay: '0.85s' },
  { x1: 170, y1: 170, x2: 130, y2: 130, delay: '0.90s' },
  { x1: 290, y1: 170, x2: 330, y2: 130, delay: '0.95s' },
  { x1: 290, y1: 290, x2: 330, y2: 330, delay: '1.00s' },
  { x1: 170, y1: 290, x2: 130, y2: 330, delay: '1.05s' },
];

const VERTEX_BRACKETS = [
  { x: 140, y: 140, delay: '1.10s' },
  { x: 260, y: 140, delay: '1.15s' },
  { x: 260, y: 260, delay: '1.20s' },
  { x: 140, y: 260, delay: '1.25s' },
  { x: 170, y: 170, delay: '1.30s' },
  { x: 290, y: 170, delay: '1.35s' },
  { x: 290, y: 290, delay: '1.40s' },
  { x: 170, y: 290, delay: '1.45s' },
];

const CROSS_LINES = [
  { x1: 90, y1: 200, x2: 330, y2: 200, delay: '0.55s' },
  { x1: 200, y1: 90, x2: 200, y2: 330, delay: '0.60s' },
];

const PROGRESS_SEGMENTS = 28;
const ANIMATION_DURATION = 2200;

function StartupLoader({ onComplete, loadedCount, totalItems }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const hasCompleted = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const done = loadedCount >= totalItems && totalItems > 0;
    if (!done) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, ANIMATION_DURATION - elapsed);

    const exitTimer = setTimeout(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        setIsExiting(true);
        setTimeout(() => {
          onCompleteRef.current();
        }, 500);
      }
    }, remaining);

    return () => clearTimeout(exitTimer);
  }, [loadedCount, totalItems]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const raw = Math.min(elapsed / ANIMATION_DURATION, 1);
      const eased = raw < 0.65
        ? raw * 1.35
        : 0.8775 + (raw - 0.65) * 0.35;
      setProgress(Math.min(eased, 1));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const activeSegments = Math.floor(progress * PROGRESS_SEGMENTS);

  return (
    <div className={`startup-loader ${isExiting ? 'startup-exit' : ''}`}>
      <div className="startup-bg-grid" />

      <div className="startup-corner startup-corner--tl" />
      <div className="startup-corner startup-corner--tr" />
      <div className="startup-corner startup-corner--bl" />
      <div className="startup-corner startup-corner--br" />

      <div className="startup-content">
        <div className="startup-text-top">INITIALIZING</div>

        <div className="startup-center">
          <svg
            className="startup-cube-svg"
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="crispEdges"
          >
            <defs>
              <filter id="cube-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="startup-cross-lines">
              {CROSS_LINES.map((line, i) => (
                <line
                  key={`cross-${i}`}
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  className="startup-arch-line startup-arch-line--thin"
                  style={{ animationDelay: line.delay }}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>

            <g className="startup-ext-lines">
              {ARCH_LINES.map((line, i) => (
                <line
                  key={`ext-${i}`}
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  className="startup-arch-line"
                  style={{ animationDelay: line.delay }}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>

            <g className="startup-cube-edges" filter="url(#cube-glow)">
              {CUBE_EDGES.map((edge, i) => (
                <line
                  key={`edge-${i}`}
                  x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                  className="startup-cube-edge"
                  style={{ animationDelay: edge.delay }}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>

            <g className="startup-vertex-marks">
              {VERTEX_BRACKETS.map((b, i) => (
                <g key={`bracket-${i}`} className="startup-vertex-group" style={{ animationDelay: b.delay }}>
                  <rect
                    x={b.x - 5} y={b.y - 5}
                    width="10" height="10"
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={b.x} cy={b.y} r="1.2" className="startup-vertex-dot" />
                </g>
              ))}
            </g>
          </svg>

          <div className="startup-scan-line" />
        </div>

        <div className="startup-progress">
          <div className="startup-progress-track">
            {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
              <div
                key={i}
                className={`startup-progress-seg ${i < activeSegments ? 'startup-progress-seg--active' : ''}`}
              />
            ))}
          </div>
          <div className="startup-progress-pct">
            {totalItems > 0 ? `${Math.floor((loadedCount / totalItems) * 100)}%` : '...'}
          </div>
        </div>
      </div>

      <div className="startup-micro startup-micro--tl">
        <span>SYS.BOOT</span>
        <span className="startup-micro-sep">|</span>
        <span>0.0.1</span>
      </div>
      <div className="startup-micro startup-micro--tr">
        <span>X:0.00</span>
        <span className="startup-micro-sep">|</span>
        <span>Y:0.00</span>
      </div>
      <div className="startup-micro startup-micro--bl">
        <span>Z:0.00</span>
        <span className="startup-micro-sep">|</span>
        <span>0.0.1</span>
      </div>
      <div className="startup-micro startup-micro--br">
        <span>0.0.1</span>
        <span className="startup-micro-sep">|</span>
        <span>RST:OK</span>
      </div>

      <div className="startup-rule startup-rule--top" />
      <div className="startup-rule startup-rule--bottom" />

      <div className="startup-exe-line">
        <span className="startup-exe-prefix">&gt;</span>
        <span className="startup-exe-text">loading jadmenkara.exe</span>
        <span className="startup-exe-cursor" />
      </div>
    </div>
  );
}

export default StartupLoader;
