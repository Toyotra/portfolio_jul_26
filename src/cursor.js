// Custom cursor, mechanical: a crosshair that sits exactly on the pointer, and
// a fine toothed ring that trails it on a stiff, damped follow (no wobble).
// Over anything clickable the ring eases an eighth of a turn and four corner
// brackets lock on. Mouse/trackpad only — touch keeps the normal behaviour.

const fine = matchMedia('(pointer: fine)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEETH = 12;
const R = 14;                       // gear radius in the 40×40 viewBox
const C = 2 * Math.PI * R;

const SVG = `
<svg class="cur-gear" viewBox="0 0 40 40" width="40" height="40">
  <circle cx="20" cy="20" r="${R}" fill="none" stroke="currentColor" stroke-width="2"
    stroke-dasharray="${(C / TEETH) * 0.35} ${(C / TEETH) * 0.65}" />
</svg>
<svg class="cur-brk" viewBox="0 0 40 40" width="40" height="40">
  <path d="M3 10V3h7 M30 3h7v7 M37 30v7h-7 M10 37H3v-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
</svg>`;

if (fine) {
  document.documentElement.classList.add('custom-cursor');
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cur-dot';
  ring.className = 'cur-ring';
  ring.innerHTML = SVG;
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring, dot);
  const gear = ring.querySelector('.cur-gear');

  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { ...target };
  const vel = { x: 0, y: 0 };
  const STIFF = 0.32;   // pull toward the pointer
  const DAMP = 0.52;    // heavy damping → settles without overshoot
  let hover = 1, hoverTarget = 1, press = 1, visible = false;
  let angle = 0;        // ring angle, eases to 45° while hot

  const CLICKABLE = 'a, button, [role="tab"], .card, .log-row, .chips button, label, input, .d-thumbs button';

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    target.x = e.clientX; target.y = e.clientY;
    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
    if (!visible) { visible = true; document.documentElement.classList.add('cur-on'); Object.assign(pos, target); }
    hoverTarget = e.target.closest?.(CLICKABLE) || document.documentElement.classList.contains('pcb-hot') ? 1.2 : 1;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { visible = false; document.documentElement.classList.remove('cur-on'); });
  addEventListener('blur', () => { visible = false; document.documentElement.classList.remove('cur-on'); });
  addEventListener('pointerdown', () => { press = 0.88; });
  addEventListener('pointerup', () => { press = 1; });

  function tick() {
    if (reduceMotion) {
      Object.assign(pos, target);
    } else {
      vel.x = (vel.x + (target.x - pos.x) * STIFF) * DAMP;
      vel.y = (vel.y + (target.y - pos.y) * STIFF) * DAMP;
      pos.x += vel.x; pos.y += vel.y;
    }
    hover += (hoverTarget - hover) * 0.15;
    const hot = hoverTarget > 1;
    angle += ((hot ? 45 : 0) - angle) * (reduceMotion ? 1 : 0.15);
    const s = hover * press;
    ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${s})`;
    gear.style.transform = `rotate(${angle}deg)`;
    ring.classList.toggle('hot', hot);
    dot.classList.toggle('hot', hot);
    requestAnimationFrame(tick);
  }
  tick();
}
