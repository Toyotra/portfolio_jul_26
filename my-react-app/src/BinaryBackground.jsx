import { useEffect, useRef } from "react";
import "./BinaryBackground.css";

const CONFIG = {
  speed: 0.5,
  fontSize: 12,
  chars: "01",
  hoverChars: "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789",
  rows: null,
  cols: null,
  canvasBackgroundColor: "#020508",
  textColor: "#00D4FF",
  textOpacity: 0.06,
  fadeOpacity: 0.04,
  hoverRadiusCells: 9,
  stretchFactor: 0.002,
};

function hexToRgba(hex, opacity) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function BinaryBackground({ hoverKey = null }) {
  const canvasRef = useRef(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationId;
    let scrollOffset = 0;

    const fontSize = CONFIG.fontSize;
    const speed = CONFIG.speed;
    const chars = CONFIG.chars;
    const hoverMap = {
      home: { hoverChars: "01", textColor: "#00D4FF" },
      about: { hoverChars: "ABOUTabout", textColor: "#00D4FF" },
      experiences: { hoverChars: "EXP!@", textColor: "#00D4FF" },
      projects: { hoverChars: "<>/{}[]()", textColor: "#00D4FF" },
      contact: { hoverChars: "@._-+0123", textColor: "#00D4FF" },
    };
    const hoverRadius = CONFIG.hoverRadiusCells;
    const stretchFactor = CONFIG.stretchFactor;

    const mousePos = { x: null, y: null };
    const lastMouse = { x: null, y: null, t: performance.now() };
    let overlayActive = false;
      const hoverKeyRef = { current: null };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function getPattern(charSet) {
      const rows = CONFIG.rows || Math.ceil(canvas.height / fontSize);
      const cols = CONFIG.cols || Math.ceil(canvas.width / fontSize) + 2;
      const pattern = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(charSet[Math.floor(Math.random() * charSet.length)]);
        }
        pattern.push(row);
      }
      return pattern;
    }

    resize();
    let pattern = getPattern(chars);
    const patternWidth = (CONFIG.cols || Math.ceil(canvas.width / fontSize) + 2) * fontSize;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      const currentHoverKey = hoverKeyRef.current || hoverKey;
      const hoverCharsLocal = (currentHoverKey && hoverMap[currentHoverKey]?.hoverChars) || CONFIG.hoverChars;
      const overrideTextColorLocal = (currentHoverKey && hoverMap[currentHoverKey]?.textColor) || CONFIG.textColor;
      const overlayForce = !!currentHoverKey;
      const activeOverlay = overlayActive || overlayForce;

      pattern.forEach((row, r) => {
        row.forEach((char, c) => {
          const baseX = c * fontSize;
          const y = r * fontSize + fontSize;

          const centerX1 = baseX - scrollOffset + fontSize / 2;
          const centerY = y - fontSize / 2;
          let usedChar = char;
          let usedStyle = hexToRgba(CONFIG.textColor, CONFIG.textOpacity);

          if (activeOverlay && mousePos.x != null) {
            const dx = centerX1 - mousePos.x;
            const dy = centerY - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= hoverRadius * fontSize) {
              const set = hoverCharsLocal;
              usedChar = set[Math.abs((r + c) % set.length)];
              const alpha = 1 - dist / (hoverRadius * fontSize);
              usedStyle = hexToRgba(overrideTextColorLocal, Math.min(1, CONFIG.textOpacity + 0.3 * alpha));
            }
          }

          ctx.fillStyle = usedStyle;
          ctx.fillText(usedChar, baseX - scrollOffset, y);

          const centerX2 = baseX - scrollOffset + patternWidth + fontSize / 2;
          usedChar = char;
          usedStyle = hexToRgba(CONFIG.textColor, CONFIG.textOpacity);
          if (activeOverlay && mousePos.x != null) {
            const dx2 = centerX2 - mousePos.x;
            const dy2 = centerY - mousePos.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist2 <= hoverRadius * fontSize) {
              const set = hoverCharsLocal;
              usedChar = set[Math.abs((r + c) % set.length)];
              const alpha2 = 1 - dist2 / (hoverRadius * fontSize);
              usedStyle = hexToRgba(overrideTextColorLocal, Math.min(1, CONFIG.textOpacity + 0.3 * alpha2));
            }
          }
          ctx.fillStyle = usedStyle;
          ctx.fillText(usedChar, baseX - scrollOffset + patternWidth, y);
        });
      });

      scrollOffset += speed;
      if (scrollOffset >= patternWidth) {
        scrollOffset -= patternWidth;
      }
    }

    function drawWithOverlay() {
      draw();
      const now = performance.now();
      lastMouse.x = mousePos.x;
      lastMouse.y = mousePos.y;
      lastMouse.t = now;
    }


    const handleMouseEnter = () => {
      hoverRef.current = true;
    };

    const handleMouseLeave = () => {
      hoverRef.current = false;
    };

    const handleResize = () => {
      resize();
      pattern = getPattern(chars);
    };

    function loop() {
      drawWithOverlay();
      animationId = requestAnimationFrame(loop);
    }
    loop();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mouseenter", handleMouseEnter, true);
    window.addEventListener("mouseleave", handleMouseLeave, true);

    const handleMouseMove = (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      const el = document.elementFromPoint(mousePos.x, mousePos.y);
      const semanticTags = ['SECTION','ARTICLE','HEADER','NAV','FOOTER','MAIN','ASIDE','DIV'];
      const closest = el && el.closest ? el.closest('.ascii-hover') : null;
      const isTarget = !!closest;
      const tagMatch = el && semanticTags.includes(el.tagName);
      overlayActive = !!(isTarget || tagMatch);
      if (closest && closest.dataset) {
        hoverKeyRef.current = closest.dataset.hover || closest.dataset.hoverKey || null;
      } else {
        hoverKeyRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseenter", handleMouseEnter, true);
      window.removeEventListener("mouseleave", handleMouseLeave, true);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoverKey]);

  return (
    <canvas ref={canvasRef} className="binary-background" />
  );
}

export default BinaryBackground;
