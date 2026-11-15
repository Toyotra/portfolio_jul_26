// Background: twinkling stars, drifting outlined shapes, the odd shooting star,
// mouse parallax, and a confetti burst when you click empty space.

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORS = ['#3d8bff', '#7ab8ff', '#40e6ff', '#ff3347', '#ff7a85'];
const KINDS = ['circle', 'tri', 'square', 'plus', 'squiggle', 'ring'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

let W = 0, H = 0, dpr = 1;
let stars = [], shapes = [], bits = [], shooters = [];
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

function makeShape(y = rand(0, H)) {
  return {
    kind: pick(KINDS), color: pick(COLORS),
    x: rand(0, W), y, z: rand(0.3, 1),          // z = depth: size, speed, parallax
    size: rand(10, 26), rot: rand(0, Math.PI * 2),
    vr: rand(-0.006, 0.006), vy: rand(-0.12, -0.32), wob: rand(0, Math.PI * 2),
  };
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const area = (W * H) / 1e6;
  stars = Array.from({ length: Math.round(140 * area) + 40 }, () => ({
    x: rand(0, W), y: rand(0, H), r: rand(0.4, 1.5), z: rand(0.2, 1), ph: rand(0, Math.PI * 2), sp: rand(0.01, 0.04),
  }));
  shapes = Array.from({ length: Math.round(18 * area) + 10 }, () => makeShape());
}

function drawShape(s, x, y, size, rot, alpha) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = ctx.fillStyle = s.color;
  ctx.lineWidth = 1.6; ctx.lineCap = ctx.lineJoin = 'round';
  ctx.shadowColor = s.color; ctx.shadowBlur = 10;
  const h = size / 2;
  ctx.beginPath();
  switch (s.kind) {
    case 'circle': ctx.arc(0, 0, h, 0, Math.PI * 2); break;
    case 'ring': ctx.arc(0, 0, h, 0, Math.PI * 2); ctx.moveTo(h * 0.45, 0); ctx.arc(0, 0, h * 0.45, 0, Math.PI * 2); break;
    case 'square': ctx.rect(-h, -h, size, size); break;
    case 'tri': ctx.moveTo(0, -h); ctx.lineTo(h * 0.87, h * 0.5); ctx.lineTo(-h * 0.87, h * 0.5); ctx.closePath(); break;
    case 'plus': ctx.moveTo(-h, 0); ctx.lineTo(h, 0); ctx.moveTo(0, -h); ctx.lineTo(0, h); break;
    case 'squiggle':
      ctx.moveTo(-h, 0);
      for (let i = 1; i <= 4; i++) ctx.quadraticCurveTo(-h + (i - 0.5) * (size / 4), i % 2 ? -h * 0.6 : h * 0.6, -h + i * (size / 4), 0);
      break;
  }
  s.fill ? ctx.fill() : ctx.stroke();
  ctx.restore();
}

let t = 0;
function frame() {
  t++;
  ctx.clearRect(0, 0, W, H);
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  // stars
  for (const s of stars) {
    const tw = 0.45 + 0.55 * Math.sin(s.ph + t * s.sp);
    ctx.globalAlpha = tw * (0.35 + s.z * 0.6);
    ctx.fillStyle = '#cfe2ff';
    ctx.beginPath();
    ctx.arc(s.x - mouse.x * s.z * 12, s.y - mouse.y * s.z * 12, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // floating shapes
  for (const s of shapes) {
    if (!reduceMotion) {
      s.y += s.vy * (0.5 + s.z);
      s.rot += s.vr;
      s.wob += 0.01;
    }
    if (s.y < -40) Object.assign(s, makeShape(H + 40));
    const x = s.x + Math.sin(s.wob) * 14 - mouse.x * s.z * 30;
    const y = s.y - mouse.y * s.z * 30;
    drawShape(s, x, y, s.size * (0.5 + s.z * 0.6), s.rot, 0.08 + s.z * 0.2);
  }

  // shooting stars
  if (!reduceMotion && Math.random() < 0.004) {
    shooters.push({ x: rand(W * 0.2, W), y: rand(-20, H * 0.4), vx: rand(-9, -6), vy: rand(3, 5), life: 1 });
  }
  shooters = shooters.filter((m) => m.life > 0);
  for (const m of shooters) {
    m.x += m.vx; m.y += m.vy; m.life -= 0.02;
    const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
    g.addColorStop(0, `rgba(220,235,255,${m.life})`);
    g.addColorStop(1, 'rgba(61,139,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10); ctx.stroke();
  }

  // click confetti
  bits = bits.filter((b) => b.life > 0);
  for (const b of bits) {
    b.x += b.vx; b.y += b.vy; b.vy += 0.12; b.vx *= 0.985; b.rot += b.vr; b.life -= 0.012;
    drawShape(b, b.x, b.y, b.size, b.rot, Math.max(0, b.life));
  }

  if (!reduceMotion) requestAnimationFrame(frame);
}

addEventListener('resize', resize);
addEventListener('pointermove', (e) => {
  mouse.tx = e.clientX / W - 0.5;
  mouse.ty = e.clientY / H - 0.5;
});
// click on empty background (not the cube, nav, links, etc.) → burst of shapes
addEventListener('pointerdown', (e) => {
  if (reduceMotion || e.target.closest('.panel, button, a, input, .dossier, .side, .topbar')) return;
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2), v = rand(2, 7);
    bits.push({
      kind: pick(KINDS), color: pick(COLORS), fill: Math.random() < 0.4,
      x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
      size: rand(6, 14), rot: rand(0, 6), vr: rand(-0.2, 0.2), life: 1,
    });
  }
});

resize();
frame();
