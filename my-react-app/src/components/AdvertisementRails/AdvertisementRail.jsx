import { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import './AdvertisementRails.css';

const NORMAL_SPEED = 0.3;
const FAST_SPEED = 14;
const LERP_FACTOR = 0.18;

const toLowRes = (src) => {
  try {
    const url = new URL(src);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    if (/^\d+$/.test(last) && /^\d+$/.test(secondLast)) {
      parts[parts.length - 2] = '40';
      parts[parts.length - 1] = '23';
      url.pathname = '/' + parts.join('/');
      return url.toString();
    }
  } catch {
    // noop
  }
  return src;
};

const AdvertisementRail = forwardRef(({ images, side, seed, direction = 1 }, ref) => {
  const streamRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredImageIdx, setHoveredImageIdx] = useState(null);
  const [loaded, setLoaded] = useState(() => new Set());
  const offsetRef = useRef(seed);
  const speedRef = useRef(NORMAL_SPEED);
  const targetSpeedRef = useRef(NORMAL_SPEED);
  const rafRef = useRef(null);
  const oneSetHeightRef = useRef(0);
  const prevImagesRef = useRef(null);
  const directionRef = useRef(direction);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useImperativeHandle(ref, () => ({
    setSpeedTarget: (s) => {
      targetSpeedRef.current = s;
    },
  }));

  useLayoutEffect(() => {
    if (!streamRef.current) return;
    const total = streamRef.current.scrollHeight;
    if (total > 0) {
      oneSetHeightRef.current = total / 2;
      if (prevImagesRef.current !== null) {
        offsetRef.current = offsetRef.current % oneSetHeightRef.current;
      }
    }
  }, [images]);

  useEffect(() => {
    if (prevImagesRef.current !== images) {
      prevImagesRef.current = images;
      offsetRef.current = 0;
      oneSetHeightRef.current = 0;
    }
    if (oneSetHeightRef.current > 0) {
      offsetRef.current = ((offsetRef.current % oneSetHeightRef.current) + oneSetHeightRef.current) % oneSetHeightRef.current;
    }
  });

  useEffect(() => {
    if (oneSetHeightRef.current === 0 && streamRef.current) {
      const total = streamRef.current.scrollHeight;
      if (total > 0) {
        oneSetHeightRef.current = total / 2;
      }
    }
  });

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
        offsetRef.current += speedRef.current * (delta / 16.67) * directionRef.current;
        if (oneSetHeightRef.current > 0) {
          offsetRef.current = ((offsetRef.current % oneSetHeightRef.current) + oneSetHeightRef.current) % oneSetHeightRef.current;
        }
      }

      if (streamRef.current) {
        streamRef.current.style.transform = `translateY(${-offsetRef.current}px)`;
        if (speedRef.current > 200) {
          streamRef.current.classList.add('ad-rail__stream--spinning', 'ad-rail__stream--extreme');
          streamRef.current.classList.remove('ad-rail__stream--fast');
        } else if (speedRef.current > 20) {
          streamRef.current.classList.add('ad-rail__stream--spinning', 'ad-rail__stream--fast');
          streamRef.current.classList.remove('ad-rail__stream--extreme');
        } else {
          streamRef.current.classList.remove('ad-rail__stream--spinning', 'ad-rail__stream--fast', 'ad-rail__stream--extreme');
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hovered]);

  const tripledImages = useMemo(() => (images.length > 0 ? [...images, ...images, ...images] : []), [images]);

  const handleImageLoad = (src) => {
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  };

  return (
    <div
      className={`ad-rail ad-rail--${side}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setHoveredImageIdx(null);
      }}
    >
      <div className="ad-rail__frame">
        {/* Mounting brackets */}
        <div className="ad-rail__mount ad-rail__mount--top" />
        <div className="ad-rail__mount ad-rail__mount--bottom" />

        {/* Outer structural corners */}
        <div className="ad-rail__corner ad-rail__corner--tl" />
        <div className="ad-rail__corner ad-rail__corner--tr" />
        <div className="ad-rail__corner ad-rail__corner--bl" />
        <div className="ad-rail__corner ad-rail__corner--br" />

        {/* Inner housing corners */}
        <div className="ad-rail__corner ad-rail__corner--hl" />
        <div className="ad-rail__corner ad-rail__corner--hr" />
        <div className="ad-rail__corner ad-rail__corner--hbl" />
        <div className="ad-rail__corner ad-rail__corner--hbr" />

        {/* Corner glows */}
        <div className="ad-rail__corner-glow ad-rail__corner-glow--tl" />
        <div className="ad-rail__corner-glow ad-rail__corner-glow--tr" />
        <div className="ad-rail__corner-glow ad-rail__corner-glow--bl" />
        <div className="ad-rail__corner-glow ad-rail__corner-glow--br" />

        {/* Recessed viewport (screen cavity) */}
        <div className="ad-rail__viewport">
          <div ref={streamRef} className="ad-rail__stream">
            {tripledImages.map((src, i) => {
              const isActive = hoveredImageIdx === i;
              const isDim = hoveredImageIdx !== null && !isActive;
              const isLoaded = loaded.has(src);
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
                  onMouseEnter={() => setHoveredImageIdx(i)}
                  onMouseLeave={() => setHoveredImageIdx(null)}
                >
                  <div className="ad-rail__image-corner ad-rail__image-corner--tl" />
                  <div className="ad-rail__image-corner ad-rail__image-corner--tr" />
                  <div className="ad-rail__image-corner ad-rail__image-corner--bl" />
                  <div className="ad-rail__image-corner ad-rail__image-corner--br" />
                  <img
                    src={toLowRes(src)}
                    alt=""
                    loading="eager"
                    className={['ad-rail__image--placeholder', isLoaded ? 'ad-rail__image--loaded' : '']
                      .filter(Boolean)
                      .join(' ')}
                  />
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className={isLoaded ? 'ad-rail__image--loaded' : ''}
                    onLoad={() => handleImageLoad(src)}
                  />
                </div>
              );
            })}
          </div>

          <div className="ad-rail__scanlines" />
          <div className="ad-rail__vignette" />
        </div>

        {/* Technical overlay */}
        <div className="ad-rail__technical">
          <div className="ad-rail__tech-hline" style={{top: '25%'}} />
          <div className="ad-rail__tech-hline" style={{top: '75%'}} />
          <div className="ad-rail__tech-vline" style={{left: '12%'}} />
          <div className="ad-rail__tech-vline" style={{right: '12%'}} />
        </div>

        {/* Wireframe overlay */}
        <div className="ad-rail__wireframe">
          <div className="ad-rail__wireframe-row" style={{top: '50%'}} />
          <div className="ad-rail__wireframe-col ad-rail__wireframe-col--left" />
          <div className="ad-rail__wireframe-col ad-rail__wireframe-col--right" />
        </div>

        {/* Status indicator */}
        <div className="ad-rail__status">
          <div className="ad-rail__status-dot" />
        </div>

        {/* Edge ticks */}
        <div className="ad-rail__edge-ticks" />

        {/* Edge accent */}
        <div className="ad-rail__edge" />
      </div>
    </div>
  );
});

AdvertisementRail.displayName = 'AdvertisementRail';

export default AdvertisementRail;
