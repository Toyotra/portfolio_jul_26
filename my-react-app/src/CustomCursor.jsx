import { useState, useEffect, useRef } from 'react';
import './CustomCursor.css';

function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [hoverType, setHoverType] = useState('none');
  const [isClicking, setIsClicking] = useState(false);
  const rafRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      const target = e.target;
      const textEl = target.closest(
        'p, span, h1, h2, h3, h4, h5, h6, li, td, th, label, strong, em, b, i, small, big, a, .text-content'
      );
      const interactiveEl = target.closest(
        'button, .sidebar-btn, input, textarea, [role="button"], .interactive'
      );

      if (interactiveEl) {
        setHoverType('interactive');
      } else if (textEl) {
        setHoverType('text');
      } else {
        setHoverType('none');
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => {
      setMousePos({ x: -100, y: -100 });
      setHoverType('none');
      setIsClicking(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const speed = 0.4;

    const animate = () => {
      setCursorPos((prev) => {
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          return mousePos;
        }
        return {
          x: prev.x + dx * speed,
          y: prev.y + dy * speed,
        };
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mousePos]);

  return (
    <div
      className={`custom-cursor ${hoverType === 'interactive' ? 'hover-interactive' : ''} ${hoverType === 'text' ? 'hover-text' : ''} ${isClicking ? 'clicking' : ''}`}
      style={{
        left: cursorPos.x,
        top: cursorPos.y,
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
        <line x1="6" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6" y1="19" x2="18" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5" y1="6" x2="5" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="19" y1="6" x2="19" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      </svg>
    </div>
  );
}

export default CustomCursor;
