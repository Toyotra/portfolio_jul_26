import './BackgroundArchitecture.css';

const GRID_SIZE = 20;
const GRID_STROKE = '#e5e5e5';
const GRID_STROKE_WIDTH = 1;

export default function BackgroundArchitecture() {
  return (
    <div className="bg-arch">
      <svg className="bg-arch__svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <rect width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke={GRID_STROKE} strokeWidth={GRID_STROKE_WIDTH} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#fafafa" />
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
