import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import projectsData from '../../data/projects.json';

const NORMAL_SPEED = 0.3;

const projectAdImages = projectsData.map((project) => project['ad-image']).filter(Boolean);

function BackgroundAds({ activeSide }) {
  const streamRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(() => new Set());
  const offsetRef = useRef(0);
  const speedRef = useRef(NORMAL_SPEED);
  const targetSpeedRef = useRef(NORMAL_SPEED);
  const rafRef = useRef(null);
  const oneSetHeightRef = useRef(0);

  const [imagesList, setImagesList] = useState(() => [...projectAdImages]);

  useEffect(() => {
    setImagesList([...projectAdImages]);
  }, [activeSide]);

  useLayoutEffect(() => {
    if (!streamRef.current) return;
    const total = streamRef.current.scrollHeight;
    if (total > 0) {
      oneSetHeightRef.current = total / 3;
      offsetRef.current = ((offsetRef.current % oneSetHeightRef.current) + oneSetHeightRef.current) % oneSetHeightRef.current;
    }
  }, [imagesList]);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      const factor = 1 - Math.pow(1 - 0.18, delta / 16.67);
      speedRef.current += (targetSpeedRef.current - speedRef.current) * factor;
      if (Math.abs(speedRef.current - targetSpeedRef.current) < 0.01) {
        speedRef.current = targetSpeedRef.current;
      }

      if (!hovered) {
        offsetRef.current += speedRef.current * (delta / 16.67);
        if (oneSetHeightRef.current > 0) {
          offsetRef.current = ((offsetRef.current % oneSetHeightRef.current) + oneSetHeightRef.current) % oneSetHeightRef.current;
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

  const handleImageLoad = (src) => {
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  };

  const tripledImages = [...imagesList, ...imagesList, ...imagesList];

  if (imagesList.length === 0) return null;

  return (
    <div
      className="bg-ads"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div ref={streamRef} className="bg-ads__stream">
        {tripledImages.map((src, i) => {
          const isLoaded = loaded.has(src);
          return (
            <div
              key={`bg-${i}`}
              className="bg-ads__image"
            >
              <img
                src={src}
                alt=""
                loading="eager"
                className={isLoaded ? 'bg-ads__image--loaded' : ''}
                onLoad={() => handleImageLoad(src)}
              />
            </div>
          );
        })}
      </div>
      <div className="bg-ads__vignette" />
    </div>
  );
}

export default BackgroundAds;
