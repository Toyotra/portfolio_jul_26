// Custom cursor: an ink dot that sits exactly on the pointer, and a ring that
// chases it on a spring (so it overshoots and settles) and stretches along its
// velocity. Grows over anything clickable. Mouse/trackpad only — touch keeps
// the normal behaviour.

const fine = matchMedia('(pointer: fine)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (fine) {
  document.documentElement.classList.add('custom-cursor');
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cur-dot';
  ring.className = 'cur-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);

  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { ...target };
  const vel = { x: 0, y: 0 };
  const STIFF = 0.14;   // pull toward the pointer
  const DAMP = 0.74;    // < 1 keeps some momentum → overshoot
  let hover = 1, hoverTarget = 1, press = 1, visible = false;

  const CLICKABLE = 'a, button, [role="tab"], .card, .log-row, .chips button, label, input, .d-thumbs button';

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    target.x = e.clientX; target.y = e.clientY;
    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
    if (!visible) { visible = true; document.documentElement.classList.add('cur-on'); Object.assign(pos, target); }
    hoverTarget = e.target.closest?.(CLICKABLE) || document.documentElement.classList.contains('pcb-hot') ? 1.9 : 1;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { visible = false; document.documentElement.classList.remove('cur-on'); });
  addEventListener('blur', () => { visible = false; document.documentElement.classList.remove('cur-on'); });
  addEventListener('pointerdown', () => { press = 0.7; });
  addEventListener('pointerup', () => { press = 1; });

  function tick() {
    if (reduceMotion) {
      Object.assign(pos, target);
    } else {
      vel.x = (vel.x + (target.x - pos.x) * STIFF) * DAMP;
      vel.y = (vel.y + (target.y - pos.y) * STIFF) * DAMP;
      pos.x += vel.x; pos.y += vel.y;
    }
    hover += (hoverTarget - hover) * 0.18;
    const speed = Math.min(Math.hypot(vel.x, vel.y), 40);
    const stretch = 1 + speed / 60;
    const angle = Math.atan2(vel.y, vel.x);
    const s = hover * press;
    ring.style.transform =
      `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${angle}rad) scale(${stretch * s}, ${s / stretch})`;
    ring.classList.toggle('hot', hoverTarget > 1);
    requestAnimationFrame(tick);
  }
  tick();
}
