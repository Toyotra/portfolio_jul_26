import { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import './AdvertisementRails.css';

const NORMAL_SPEED = 0.3;
const FAST_SPEED = 14;
const LERP_FACTOR = 0.18;

const AdvertisementRail = forwardRef(({ images, side, seed }, ref) => {
  const streamRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredImageIdx, setHoveredImageIdx] = useState(null);
  const childHoverCountRef = useRef(0);
  const offsetRef = useRef(seed);
  const speedRef = useRef(NORMAL_SPEED);
  const targetSpeedRef = useRef(NORMAL_SPEED);
  const rafRef = useRef(null);
  const oneSetHeightRef = useRef(0);

  useImperativeHandle(ref, () => ({
    setSpeedTarget: (s) => {
      targetSpeedRef.current = s;
    },
  }));

  useEffect(() => {
    if (!streamRef.current) return;
    const total = streamRef.current.scrollHeight;
    oneSetHeightRef.current = total / 2;
  }, [images]);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      const factor = 1 - Math.pow(1 - LERP_FACTOR, delta / 16.67);
      speedRef.current += (targetSpeedRef.current - speedRef.current) * factor;
      if (Math.abs(speedRef.current - targetSpeedRef.current) < 0.01) {
        speedRef.current = targetSpeedRef.current;
      }

      if (!hovered) {
        offsetRef.current += speedRef.current * (delta / 16.67);
        if (oneSetHeightRef.current > 0) {
          offsetRef.current %= oneSetHeightRef.current;
        }
      }

      if (streamRef.current) {
        streamRef.current.style.transform = `translateY(${-offsetRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hovered]);

  const doubledImages = useMemo(() => (images.length > 0 ? [...images, ...images] : []), [images]);

  return (
    <div
      className={`ad-rail ad-rail--${side}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        if (childHoverCountRef.current === 0) {
          setHovered(false);
          setHoveredImageIdx(null);
        }
      }}
    >
      <div className="ad-rail__frame">
        <div className="ad-rail__corner ad-rail__corner--tl" />
        <div className="ad-rail__corner ad-rail__corner--tr" />
        <div className="ad-rail__corner ad-rail__corner--bl" />
        <div className="ad-rail__corner ad-rail__corner--br" />

        <div className="ad-rail__viewport">
          <div ref={streamRef} className="ad-rail__stream">
            {doubledImages.map((src, i) => {
              const originalIdx = i % images.length;
              const isDim = hoveredImageIdx !== null && originalIdx !== hoveredImageIdx;
              const isActive = hoveredImageIdx !== null && originalIdx === hoveredImageIdx;
              return (
                <div
                  key={`${side}-${i}`}
                  className={[
                    'ad-rail__image',
                    isActive ? 'ad-rail__image--active' : '',
                    isDim ? 'ad-rail__image--dim' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={(e) => {
                    childHoverCountRef.current += 1;
                    setHoveredImageIdx(originalIdx);
                  }}
                  onMouseLeave={(e) => {
                    childHoverCountRef.current = Math.max(0, childHoverCountRef.current - 1);
                    setHoveredImageIdx(null);
                    if (childHoverCountRef.current === 0) {
                      setHovered(false);
                    }
                  }}
                >
                  <img src={src} alt="" loading="lazy" />
                </div>
              );
            })}
          </div>

          <div className="ad-rail__scanlines" />
          <div className="ad-rail__vignette" />
        </div>

        <div className="ad-rail__edge" />
      </div>
    </div>
  );
});

AdvertisementRail.displayName = 'AdvertisementRail';

export default AdvertisementRail;
