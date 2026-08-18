import { useEffect, useRef, useCallback } from 'react';
import AdvertisementRail from './AdvertisementRail';
import projectsData from '../../data/projects.json';

const NORMAL_SPEED = 0.3;
const FAST_SPEED = 900;

const projectAds = projectsData.map((project) => ({
  src: project['ad-image'],
  project,
})).filter((item) => item.src);

function AdvertisementRails({ activeSide, onProjectSelect }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftImages = projectAds.map((item) => item.src);
  const rightImages = projectAds.map((item) => item.src);
  const prevSideRef = useRef(activeSide);
  const transitionIdRef = useRef(0);

  useEffect(() => {
    projectAds.forEach((item) => {
      const img = new Image();
      img.src = item.src;
    });
  }, []);

  const handleSideChange = useCallback(
    (side) => {
      if (prevSideRef.current === side) return;

      const id = ++transitionIdRef.current;

      leftRef.current?.setSpeedTarget(FAST_SPEED);
      rightRef.current?.setSpeedTarget(FAST_SPEED);

      const switchTimer = setTimeout(() => {
        if (transitionIdRef.current !== id) return;
      }, 80);

      const decelTimer = setTimeout(() => {
        if (transitionIdRef.current !== id) return;
        leftRef.current?.setSpeedTarget(NORMAL_SPEED);
        rightRef.current?.setSpeedTarget(NORMAL_SPEED);
      }, 300);

      prevSideRef.current = side;

      return () => {
        clearTimeout(switchTimer);
        clearTimeout(decelTimer);
      };
    },
    []
  );

  useEffect(() => {
    handleSideChange(activeSide);
  }, [activeSide, handleSideChange]);

  return (
    <>
      <AdvertisementRail
        ref={leftRef}
        images={leftImages}
        side="left"
        seed={0}
        direction={1}
        adProjects={projectAds}
        onProjectSelect={onProjectSelect}
      />
      <AdvertisementRail
        ref={rightRef}
        images={rightImages}
        side="right"
        seed={800}
        direction={-1}
        adProjects={projectAds}
        onProjectSelect={onProjectSelect}
      />
    </>
  );
}

export default AdvertisementRails;
