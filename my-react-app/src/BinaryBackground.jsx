import { useEffect, useRef } from "react";
import "./BinaryBackground.css";

const CONFIG = {
  speed: 0.5,
  fontSize: 10,
  chars: "01",
  hoverChars: "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789",
  regenerate: false,
  rows: null,
  cols: null,
  canvasBackgroundColor: "black",
  textColor: "#07ddec",
  textOpacity: 0.35,
  fadeOpacity: 0.02,
};

function hexToRgba(hex, opacity) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function BinaryBackground() {
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
    const hoverChars = CONFIG.hoverChars;

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
      ctx.fillStyle = hexToRgba(CONFIG.textColor, CONFIG.textOpacity);

      pattern.forEach((row, r) => {
        row.forEach((char, c) => {
          const baseX = c * fontSize;
          const y = r * fontSize + fontSize;
          ctx.fillText(char, baseX - scrollOffset, y);
          ctx.fillText(char, baseX - scrollOffset + patternWidth, y);
        });
      });

      scrollOffset += speed;
      if (scrollOffset >= patternWidth) {
        scrollOffset -= patternWidth;
      }

      animationId = requestAnimationFrame(draw);
    }

    const handleMouseEnter = () => {
      hoverRef.current = true;
      pattern = getPattern(hoverChars);
    };

    const handleMouseLeave = () => {
      hoverRef.current = false;
      pattern = getPattern(chars);
    };

    const handleResize = () => {
      resize();
      pattern = getPattern(hoverRef.current ? hoverChars : chars);
    };

    draw();
    window.addEventListener("resize", handleResize);
    window.addEventListener("mouseenter", handleMouseEnter, true);
    window.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mouseenter", handleMouseEnter, true);
      window.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="binary-background" />
  );
}

export default BinaryBackground;
