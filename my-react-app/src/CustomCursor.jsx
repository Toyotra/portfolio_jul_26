import { useState, useEffect, useRef } from 'react';
import './CustomCursor.css';

function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [hoverType, setHoverType] = useState('none');
  const [isClicking, setIsClicking] = useState(false);
  const cursorRef = useRef(null);
  const mousePosRef = useRef(mousePos);
  const rafRef = useRef(null);

  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const updateCursor = () => {
      if (cursorRef.current) {
        const pos = mousePosRef.current;
        cursorRef.current.style.left = `${pos.x}px`;
        cursorRef.current.style.top = `${pos.y}px`;
      }
      rafRef.current = requestAnimationFrame(updateCursor);
    };

    rafRef.current = requestAnimationFrame(updateCursor);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      const target = e.target;
      const interactiveEl = target.closest(
        'button, .sidebar-btn, input, textarea, [role="button"], .interactive'
      );
      const adRailEl = target.closest('.ad-rail__image');

      if (adRailEl) {
        setHoverType('ad-rail');
      } else if (interactiveEl) {
        setHoverType('interactive');
      } else {
        setHoverType('none');
      }
    };

    const handleCustomCursorMove = (e) => {
      setMousePos({ x: e.detail.x, y: e.detail.y });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => {
      setMousePos({ x: -100, y: -100 });
      setHoverType('none');
      setIsClicking(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('custom-cursor-move', handleCustomCursorMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('custom-cursor-move', handleCustomCursorMove);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${hoverType === 'interactive' ? 'hover-interactive' : ''} ${hoverType === 'ad-rail' ? 'hover-ad-rail' : ''} ${isClicking ? 'clicking' : ''}`}
      style={{
        left: mousePos.x,
        top: mousePos.y,
      }}
    >
      <svg className="cursor-icon icon-crosshair" viewBox="0 0 24 24" fill="none">
        <line
          x1="3"
          y1="12"
          x2="9"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="15"
          y1="12"
          x2="21"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="3"
          x2="12"
          y2="9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="15"
          x2="12"
          y2="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      </svg>

      <svg className="cursor-icon icon-diamond" viewBox="0 0 24 24" fill="none">
        <line x1="8" y1="4" x2="16" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="20" x2="16" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="8" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="8" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      </svg>

      <svg className="cursor-icon icon-rect" viewBox="0 0 24 24" fill="none">
        <line x1="8" y1="3" x2="16" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="7" x2="8" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="7" x2="16" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default CustomCursor;
