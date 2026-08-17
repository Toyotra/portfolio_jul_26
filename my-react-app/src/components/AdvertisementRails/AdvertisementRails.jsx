import { useState, useEffect, useRef, useCallback } from 'react';
import AdvertisementRail from './AdvertisementRail';
import adsData from '../../data/advertisements.json';

const NORMAL_SPEED = 0.3;
const FAST_SPEED = 14;

function AdvertisementRails({ activeSide }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [leftImages, setLeftImages] = useState(() => adsData[activeSide]?.left || []);
  const [rightImages, setRightImages] = useState(() => adsData[activeSide]?.right || []);
  const prevSideRef = useRef(activeSide);
  const transitionIdRef = useRef(0);

  const handleSideChange = useCallback(
    (side) => {
      if (prevSideRef.current === side) return;

      const id = ++transitionIdRef.current;

      leftRef.current?.setSpeedTarget(FAST_SPEED);
      rightRef.current?.setSpeedTarget(FAST_SPEED);

      const switchTimer = setTimeout(() => {
        if (transitionIdRef.current !== id) return;
        setLeftImages(adsData[side]?.left || []);
        setRightImages(adsData[side]?.right || []);
      }, 150);

      const decelTimer = setTimeout(() => {
        if (transitionIdRef.current !== id) return;
        leftRef.current?.setSpeedTarget(NORMAL_SPEED);
        rightRef.current?.setSpeedTarget(NORMAL_SPEED);
      }, 220);

      prevSideRef.current = side;

      return () => {
        clearTimeout(switchTimer);
        clearTimeout(decelTimer);
      };
    },
    [activeSide]
  );

  useEffect(() => {
    handleSideChange(activeSide);
  }, [activeSide, handleSideChange]);

  return (
    <>
      <AdvertisementRail ref={leftRef} images={leftImages} side="left" seed={0} />
      <AdvertisementRail ref={rightRef} images={rightImages} side="right" seed={40} />
    </>
  );
}

export default AdvertisementRails;
