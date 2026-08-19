import './BackgroundArchitecture.css';

export default function BackgroundArchitecture() {
  return (
    <div className="bg-arch">
      <svg
        className="bg-arch__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="bgVignette" cx="50%" cy="50%" r="70%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#0d0d0d" />
            <stop offset="60%" stopColor="#080808" />
            <stop offset="100%" stopColor="#030303" />
          </radialGradient>

          <radialGradient id="centerGlow" cx="50%" cy="50%" r="45%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="rgba(255,255,255,0.025)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <radialGradient id="lightSweep" cx="0%" cy="50%" r="60%" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.015)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="archBlur">
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
        </defs>

        <rect width="100" height="100" fill="url(#bgVignette)" />

        <rect width="100" height="100" fill="url(#centerGlow)" />

        <g className="bg-arch__structural">
          <g className="bg-arch__frame-set-1">
            <rect x="-12" y="-8" width="124" height="116" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.04" />
            <rect x="-6" y="-4" width="112" height="108" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.03" />
          </g>

          <g className="bg-arch__frame-set-2">
            <rect x="-8" y="32" width="116" height="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.035" />
            <line x1="50" y1="-8" x2="50" y2="28" stroke="rgba(255,255,255,0.04)" strokeWidth="0.025" />
            <line x1="50" y1="92" x2="50" y2="130" stroke="rgba(255,255,255,0.04)" strokeWidth="0.025" />
          </g>

          <g className="bg-arch__frame-set-3">
            <rect x="18" y="-14" width="68" height="80" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.03" />
            <line x1="32" y1="-14" x2="32" y2="66" stroke="rgba(255,255,255,0.025)" strokeWidth="0.02" />
            <line x1="72" y1="-14" x2="72" y2="66" stroke="rgba(255,255,255,0.025)" strokeWidth="0.02" />
            <line x1="18" y1="10" x2="86" y2="10" stroke="rgba(255,255,255,0.025)" strokeWidth="0.02" />
          </g>
        </g>

        <g className="bg-arch__geometric">
          <circle cx="-15" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.025" />
          <circle cx="115" cy="-20" r="28" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="0.025" />
          <circle cx="115" cy="120" r="22" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.02" />
          <rect x="110" y="22" width="22" height="56" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.03" />
          <rect x="-18" y="72" width="18" height="44" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="0.03" />
          <line x1="-8" y1="72" x2="-8" y2="116" stroke="rgba(255,255,255,0.03)" strokeWidth="0.02" />
        </g>

        <g className="bg-arch__perspective" stroke="rgba(255,255,255,0.025)" strokeWidth="0.02" fill="none">
          <line x1="50" y1="50" x2="0" y2="0" />
          <line x1="50" y1="50" x2="100" y2="0" />
          <line x1="50" y1="50" x2="0" y2="100" />
          <line x1="50" y1="50" x2="100" y2="100" />
          <line x1="50" y1="50" x2="50" y2="-5" />
          <line x1="50" y1="50" x2="50" y2="105" />
          <line x1="50" y1="50" x2="-5" y2="50" />
          <line x1="50" y1="50" x2="105" y2="50" />
          <line x1="50" y1="50" x2="25" y2="20" />
          <line x1="50" y1="50" x2="75" y2="20" />
          <line x1="50" y1="50" x2="25" y2="80" />
          <line x1="50" y1="50" x2="75" y2="80" />
        </g>

        <g className="bg-arch__columns" stroke="rgba(255,255,255,0.04)" strokeWidth="0.03" fill="none">
          <line x1="0" y1="0" x2="0" y2="100" />
          <line x1="100" y1="0" x2="100" y2="100" />
          <line x1="16" y1="0" x2="16" y2="100" stroke="rgba(255,255,255,0.02)" strokeWidth="0.02" />
          <line x1="84" y1="0" x2="84" y2="100" stroke="rgba(255,255,255,0.02)" strokeWidth="0.02" />
          <line x1="6" y1="0" x2="6" y2="100" stroke="rgba(255,255,255,0.015)" strokeWidth="0.015" />
          <line x1="94" y1="0" x2="94" y2="100" stroke="rgba(255,255,255,0.015)" strokeWidth="0.015" />
          <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.02)" strokeWidth="0.015" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.02)" strokeWidth="0.015" />
        </g>

        <g className="bg-arch__seams" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.025">
          <line x1="0" y1="0" x2="100" y2="0" />
          <line x1="0" y1="100" x2="100" y2="100" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.045)" strokeWidth="0.03" />
          <line x1="0" y1="0" x2="0" y2="100" />
          <line x1="100" y1="0" x2="100" y2="100" />
        </g>

        <g className="bg-arch__arcs" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.03">
          <path d="M -10 55 A 60 60 0 0 1 110 55" />
          <path d="M -10 45 A 60 60 0 0 0 110 45" />
        </g>

        <line x1="-10" y1="50" x2="110" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.02" />

        <g className="bg-arch__accent-lines" fill="none" filter="url(#softGlow)">
          <line x1="32" y1="-4" x2="32" y2="112" stroke="rgba(255,255,255,0.05)" strokeWidth="0.03" className="bg-arch__line-travel" />
          <line x1="68" y1="-4" x2="68" y2="112" stroke="rgba(255,255,255,0.035)" strokeWidth="0.025" className="bg-arch__line-pulse" />
        </g>

        <rect width="100" height="100" fill="url(#lightSweep)" className="bg-arch__sweep" />

        <rect width="100" height="100" fill="rgba(255,255,255,0.008)" className="bg-arch__haze" />

        <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="0.03" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.03" />
      </svg>
    </div>
  );
}
