// Background: a procedurally generated, auto-routed PCB you can poke at.
//
//  1. Parts are placed at random: QFP MCUs, a BGA, SOICs, SOT-23s, passives, LEDs,
//     crystals, headers, electrolytics, test points, fiducials, mounting holes.
//  2. Every pad is routed with A* on a grid (45° corners, no sharp turns). If a pad
//     can't find a partner it escapes to a via and gets routed on the bottom layer.
//  3. Leftover space gets a ground pour with stitching vias.
//  The board routes itself over the first few seconds after load.
//
//  Alive: LEDs blink, buses fire, chips flash when signals land, vias twinkle,
//  an inspection beam sweeps the board, and copper near the cursor lights up.
//
//  Hover a trace / pad / part / pour to light it up and read its net.
//  Click to send a signal down that net — it hops through parts to other nets.

const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

const COL = {
  cu: 'rgba(200, 158, 88, .07)',      // top copper
  bot: 'rgba(140, 175, 240, .055)',     // bottom copper (seen through the board)
  pad: 'rgba(222, 184, 112, .12)',
  pour: 'rgba(70, 120, 220, .02)',    // copper under blue mask shows as lighter blue
  pourHi: 'rgba(120, 170, 255, .22)',
  silk: 'rgba(232, 236, 245, .09)',  // white silkscreen
  hole: '#06080e',
  hi: 'rgba(255, 220, 150, .95)',
  hiBot: 'rgba(170, 200, 255, .95)',
  hiPad: 'rgb(255, 234, 186)',
  lit: 'rgba(255, 220, 150, .4)',
  pulse: '255, 244, 214',
};

const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];
const E = 0, S = 2, W = 4, N = 6;

const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

const PARTS = {
  qfp: ['STM32F405 · LQFP-64', 'ATmega2560 · TQFP-100', 'RP2040 · QFN-56', 'ESP32-S3 · QFN-56', 'TMC5160 · QFN-36', 'DRV8353 · VQFN-40', 'STM32H743 · LQFP-144'],
  bga: ['i.MX RT1062 · BGA-196', 'iCE40 FPGA · BGA-121'],
  soic: ['MCP2551 · SOIC-8 CAN', 'INA219 · SOIC-8', '74HC595 · SOIC-16', 'LM358 · SOIC-8', 'MAX485 · SOIC-8', 'ADS1115 · MSOP-10', 'W25Q128 · SOIC-8 flash', 'ULN2003 · SOIC-16', 'DRV8833 · HTSSOP-16', 'BNO085 · IMU'],
  sot: ['AO3400 · SOT-23 MOSFET', 'MMBT3904 · SOT-23 NPN', 'AP2112 · SOT-23 LDO', 'BAT54 · SOT-23 schottky', 'SI2302 · SOT-23 MOSFET'],
  R: ['10k', '4.7k', '220R', '1k', '100k', '0R', '22R', '2.2k'],
  C: ['100n', '10u', '1u', '22p', '4.7u', '10n'],
  L: ['4.7µH', '10µH', 'ferrite 600R'],
};
const SIG = ['SDA', 'SCL', 'MOSI', 'MISO', 'SCK', 'CS', 'UART_TX', 'UART_RX', 'PWM', 'ADC', 'ENC_A', 'ENC_B', 'STEP', 'DIR', 'EN',
  'CAN_H', 'CAN_L', 'USB_D+', 'USB_D-', 'nRST', 'BOOT0', 'EMG', 'IRQ', 'GPIO', 'SERVO', 'LIMIT', 'IMU_INT', 'I2S_BCLK', 'SWDIO', 'SWCLK', 'LED', 'HALL'];
const PWR = ['3V3', '5V', 'VBUS', 'VMOT', '12V', 'VBAT'];

/* ------------------------------------------------------------------ state */
let VW, VH, dpr, G, cols, rows, ox, oy;
let occ, occB, padAt, compAt, pourMask;   // per-cell grids
let gS, stamp, closed, par, stampN = 0;   // A* scratch
let comps, pins, nets, alias, bItems, gnd, refCount, sigCount;
let L, pourHi, builder, built;
let hovered = null, pulses = [], pings = [];
// animation state
let buses = [], vias = [], twinkles = [], leds = [], chipGlow = new Map(), pourRipples = [];
let scanX = -1, scanT = 3, busT = 2, lampA = 0;
const ptr = { x: 0, y: 0, on: false };

const X = (cx) => ox + cx * G + G / 2;
const Y = (cy) => oy + cy * G + G / 2;
const resolve = (id) => { while (alias[id]) id = alias[id]; return id; };

function mkLayer() {
  const c = document.createElement('canvas');
  c.width = Math.round(VW * dpr); c.height = Math.round(VH * dpr);
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.lineCap = x.lineJoin = 'round';
  return { c, x };
}

function setup() {
  VW = innerWidth; VH = innerHeight;
  dpr = Math.min(devicePixelRatio || 1, 2);
  if (VW * VH * dpr * dpr > 7e6) dpr = Math.max(1, Math.sqrt(7e6 / (VW * VH)));
  canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = ctx.lineJoin = 'round';

  G = VW < 700 ? 9 : 10;
  cols = Math.floor(VW / G); rows = Math.floor(VH / G);
  ox = Math.round((VW - cols * G) / 2); oy = Math.round((VH - rows * G) / 2);
  const n = cols * rows;
  occ = new Int32Array(n); occB = new Int32Array(n); padAt = new Int32Array(n); compAt = new Int32Array(n); pourMask = new Uint8Array(n);
  gS = new Float32Array(n * 8); stamp = new Int32Array(n * 8); closed = new Int32Array(n * 8); par = new Int32Array(n * 8); stampN = 0;

  comps = []; pins = []; nets = [null]; alias = []; bItems = []; refCount = {}; sigCount = {};
  L = { bot: mkLayer(), pour: mkLayer(), top: mkLayer(), over: mkLayer() };
  pourHi = null; hovered = null; pulses = []; pings = []; built = false;
  buses = []; vias = []; twinkles = []; leds = []; chipGlow = new Map(); pourRipples = []; scanX = -1; scanT = 3; busT = 2;
  gnd = newNet('GND', true);
  builder = build();
}

function newNet(name, power = false) {
  const net = { id: nets.length, name, power, segs: [], poly: [], ends: [null, null], pins: [] };
  nets.push(net);
  return net;
}
function sigName() {
  if (Math.random() < 0.08) return pick(PWR);
  const b = pick(SIG);
  sigCount[b] = (sigCount[b] || 0) + 1;
  return b + sigCount[b];
}
const nextRef = (p) => p + (refCount[p] = (refCount[p] || 0) + 1);

/* -------------------------------------------------------------- placement */
function fits(x0, y0, w, h, m) {
  if (x0 - m < 1 || y0 - m < 1 || x0 + w + m > cols - 1 || y0 + h + m > rows - 1) return false;
  for (let y = y0 - m; y < y0 + h + m; y++) for (let x = x0 - m; x < x0 + w + m; x++) if (compAt[y * cols + x]) return false;
  return true;
}
// Areas covered by the hero text and the cube (in cells). Big chips stay out of them
// so they're actually visible; small parts can go anywhere.
let keepouts = [];
function computeKeepouts() {
  keepouts = [];
  const toCells = (r) => [Math.floor((r.left - ox) / G), Math.floor((r.top - oy) / G), Math.ceil((r.right - ox) / G), Math.ceil((r.bottom - oy) / G)];
  const side = document.querySelector('.side');
  if (side) {
    const els = [...side.querySelectorAll('.name, .lede, .facenav')].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
    if (els.length) keepouts.push(toCells({ left: Math.min(...els.map((r) => r.left)) - 20, top: Math.min(...els.map((r) => r.top)) - 20, right: Math.max(...els.map((r) => r.right)) + 20, bottom: Math.max(...els.map((r) => r.bottom)) + 20 }));
  }
  const c = cubeRect();
  if (c.r > c.l) keepouts.push(toCells({ left: c.l, top: c.t, right: c.r, bottom: c.b }));
}
const hitsKeepout = (x0, y0, w, h) => keepouts.some(([l, t, r, b]) => x0 < r && x0 + w > l && y0 < b && y0 + h > t);

function place(w, h, m, avoid = false) {
  for (let t = 0; t < (avoid ? 400 : 80); t++) {
    const x0 = ri(1 + m, cols - w - m - 1), y0 = ri(1 + m, rows - h - m - 1);
    if (avoid && hitsKeepout(x0, y0, w, h)) continue;
    if (fits(x0, y0, w, h, m)) return [x0, y0];
  }
  return avoid ? place(w, h, m, false) : null;
}
function mk(type, prefix, part, x0, y0, w, h, prio, extra = {}) {
  const c = { type, ref: prefix ? nextRef(prefix) : '', part, x0, y0, w, h, prio, pins: [], i: comps.length, body: [x0, y0, w, h], ...extra };
  comps.push(c);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const k = y * cols + x;
    compAt[k] = c.i + 1;
    if (!extra.open) occ[k] = -1;
    if (extra.blockB) occB[k] = -1;
  }
  return c;
}
function addPin(c, x, y, dir, shape, o = {}) {
  const cell = y * cols + x;
  const horiz = dir === E || dir === W;
  const p = {
    i: pins.length, c, x, y, cell, dir, shape, no: c.pins.length + 1, net: 0,
    th: !!o.th, dogbone: o.dogbone ?? null,
    pw: o.pw ?? (dir == null ? G * 0.75 : horiz ? G * 0.9 : G * 0.42),
    ph: o.ph ?? (dir == null ? G * 0.75 : horiz ? G * 0.42 : G * 0.9),
  };
  pins.push(p); c.pins.push(p);
  padAt[cell] = p.i + 1; occ[cell] = -2;
  if (p.th) occB[cell] = -2;
  return p;
}

function placeAll() {
  const A = cols * rows;
  computeKeepouts();
  // mounting holes in the corners
  for (const [x0, y0] of [[1, 1], [cols - 8, 1], [1, rows - 8], [cols - 8, rows - 8]]) {
    if (fits(x0, y0, 7, 7, 0)) mk('hole', 'H', 'M3 mounting hole', x0, y0, 7, 7, 0, { blockB: true });
  }
  const times = (n, fn) => { for (let i = 0; i < n; i++) fn(); };

  if (A > 9000) times(A > 30000 ? 2 : 1, () => { // BGA
    const k = ri(7, 9), fp = 2 * k + 1, at = place(fp, fp, 3, true); if (!at) return;
    const [x0, y0] = at, c = mk('bga', 'U', pick(PARTS.bga), x0, y0, fp, fp, 5, { open: true });
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const bx = x0 + 1 + 2 * i, by = y0 + 1 + 2 * j;
      const outer = i === 0 || j === 0 || i === k - 1 || j === k - 1;
      if (outer) addPin(c, bx, by, i === 0 ? W : i === k - 1 ? E : j === 0 ? N : S, 'ball');
      else addPin(c, bx, by, null, 'ball', { dogbone: (by + 1) * cols + bx + 1 });
    }
  });
  times(Math.max(1, Math.round(A / 4200)), () => { // QFP
    const n = ri(8, 13), fp = n + 4, at = place(fp, fp, 3, true); if (!at) return;
    const [x0, y0] = at, c = mk('qfp', 'U', pick(PARTS.qfp), x0, y0, fp, fp, 5, { body: [x0 + 1, y0 + 1, n + 2, n + 2] });
    for (let i = 0; i < n; i++) addPin(c, x0, y0 + 2 + i, W, 'rect');
    for (let i = 0; i < n; i++) addPin(c, x0 + 2 + i, y0 + n + 3, S, 'rect');
    for (let i = 0; i < n; i++) addPin(c, x0 + n + 3, y0 + n + 1 - i, E, 'rect');
    for (let i = 0; i < n; i++) addPin(c, x0 + n + 1 - i, y0, N, 'rect');
  });
  times(Math.max(1, Math.round(A / 1300)), () => { // SOIC
    const n = ri(4, 8), vert = Math.random() < 0.5;
    const w = vert ? 5 : n, h = vert ? n : 5, at = place(w, h, 2, Math.random() < 0.7); if (!at) return;
    const [x0, y0] = at;
    const c = mk('soic', 'U', pick(PARTS.soic), x0, y0, w, h, 4, { body: vert ? [x0 + 1, y0, 3, n] : [x0, y0 + 1, n, 3], vert });
    if (vert) {
      for (let i = 0; i < n; i++) addPin(c, x0, y0 + i, W, 'rect');
      for (let i = 0; i < n; i++) addPin(c, x0 + 4, y0 + n - 1 - i, E, 'rect');
    } else {
      for (let i = 0; i < n; i++) addPin(c, x0 + i, y0 + 4, S, 'rect');
      for (let i = 0; i < n; i++) addPin(c, x0 + n - 1 - i, y0, N, 'rect');
    }
  });
  times(Math.round(A / 1100), () => { // SOT-23
    const at = place(3, 3, 1); if (!at) return;
    const [x0, y0] = at, c = mk('sot', 'Q', pick(PARTS.sot), x0, y0, 3, 3, 3, { body: [x0, y0 + 1, 3, 1] });
    addPin(c, x0, y0 + 2, S, 'rect'); addPin(c, x0 + 2, y0 + 2, S, 'rect'); addPin(c, x0 + 1, y0, N, 'rect');
  });
  times(ri(1, 2), () => { // crystal
    const at = place(5, 1, 1); if (!at) return;
    const [x0, y0] = at, c = mk('xtal', 'Y', pick(['16 MHz crystal', '25 MHz crystal', '32.768 kHz crystal']), x0, y0, 5, 1, 3);
    addPin(c, x0, y0, null, 'rect', { pw: G * 0.8, ph: G * 1.1 }); addPin(c, x0 + 4, y0, null, 'rect', { pw: G * 0.8, ph: G * 1.1 });
  });
  times(Math.round(A / 7000) + 1, () => { // pin header
    const n = ri(4, 10), two = Math.random() < 0.5, vert = Math.random() < 0.4;
    const len = 2 * n - 1, wid = two ? 3 : 1, w = vert ? wid : len, h = vert ? len : wid;
    const at = place(w, h, 2); if (!at) return;
    const [x0, y0] = at, c = mk('hdr', 'J', `${two ? 2 : 1}×${n} pin header · 2.54mm`, x0, y0, w, h, 2);
    for (let i = 0; i < n; i++) for (let r = 0; r < (two ? 2 : 1); r++) {
      const x = vert ? x0 + 2 * r : x0 + 2 * i, y = vert ? y0 + 2 * i : y0 + 2 * r;
      addPin(c, x, y, null, i === 0 && r === 0 ? 'square' : 'round', { th: true });
    }
  });
  times(Math.round(A / 9000) + 1, () => { // electrolytic
    const at = place(6, 5, 1); if (!at) return;
    const [x0, y0] = at, c = mk('cap', 'C', pick(['100µF 25V electrolytic', '470µF 16V electrolytic', '220µF 35V electrolytic']), x0, y0, 6, 5, 2);
    addPin(c, x0 + 1, y0 + 2, null, 'square', { th: true }); addPin(c, x0 + 4, y0 + 2, null, 'round', { th: true });
  });
  const passive = (type, prefix, part) => {
    const vert = Math.random() < 0.45, w = vert ? 1 : 3, h = vert ? 3 : 1, at = place(w, h, 1); if (!at) return;
    const [x0, y0] = at, c = mk(type, prefix, part, x0, y0, w, h, 1, { vert });
    const dims = vert ? { pw: G * 0.95, ph: G * 0.7 } : { pw: G * 0.7, ph: G * 0.95 };
    addPin(c, x0, y0, null, 'rect', dims);
    addPin(c, vert ? x0 : x0 + 2, vert ? y0 + 2 : y0, null, 'rect', dims);
  };
  times(Math.round(A / 95), () => {
    const r = Math.random();
    if (r < 0.45) passive('pas', 'R', `${pick(PARTS.R)} resistor · 0603`);
    else if (r < 0.88) passive('pas', 'C', `${pick(PARTS.C)} capacitor · 0603`);
    else passive('pas', 'L', `${pick(PARTS.L)} inductor · 0805`);
  });
  times(Math.round(A / 1800), () => passive('led', 'D', pick(['red LED · 0603', 'green LED · 0603', 'amber LED · 0603'])));
  times(Math.round(A / 2500), () => { // test points
    const at = place(1, 1, 1); if (!at) return;
    const c = mk('tp', 'TP', 'test point', at[0], at[1], 1, 1, 0);
    addPin(c, at[0], at[1], null, 'round', { th: true });
  });
  times(3, () => { const at = place(3, 3, 1); if (at) mk('fid', '', 'fiducial', at[0], at[1], 3, 3, 0); });

  for (const c of comps) drawComp(c);
  for (const p of pins) drawPad(L.over.x, p, COL.pad);

  // board markings
  const s = L.over.x;
  s.fillStyle = COL.silk;
  s.font = `600 ${Math.round(G * 0.9)}px "JetBrains Mono", monospace`;
  s.textAlign = 'right'; s.textBaseline = 'bottom';
  s.fillText('JM-ROBOTICS · MAIN CTRL · REV B · 2026', VW - G * 9, VH - G * 1.2);
}

/* ---------------------------------------------------------------- drawing */
function drawPad(x, p, color) {
  const cx = X(p.x), cy = Y(p.y);
  x.fillStyle = color;
  if (p.shape === 'rect') x.fillRect(cx - p.pw / 2, cy - p.ph / 2, p.pw, p.ph);
  else if (p.shape === 'square') x.fillRect(cx - G * 0.42, cy - G * 0.42, G * 0.84, G * 0.84);
  else { x.beginPath(); x.arc(cx, cy, p.shape === 'ball' ? G * 0.34 : G * 0.42, 0, Math.PI * 2); x.fill(); }
  if (p.th) { x.fillStyle = COL.hole; x.beginPath(); x.arc(cx, cy, G * 0.17, 0, Math.PI * 2); x.fill(); }
}
function drawVia(x, cell, color = COL.pad) {
  const cx = X(cell % cols), cy = Y((cell / cols) | 0);
  x.fillStyle = color; x.beginPath(); x.arc(cx, cy, G * 0.34, 0, Math.PI * 2); x.fill();
  x.fillStyle = COL.hole; x.beginPath(); x.arc(cx, cy, G * 0.14, 0, Math.PI * 2); x.fill();
}
function strokePts(x, pts, color, width) {
  x.strokeStyle = color; x.lineWidth = width;
  x.beginPath();
  pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.stroke();
}
const traceW = (net, layer) => (layer ? G * 0.2 : net.power ? G * 0.45 : G * 0.24);

function drawComp(c) {
  const s = L.over.x;
  s.strokeStyle = COL.silk; s.fillStyle = COL.silk; s.lineWidth = 1;
  const [bx0, by0, bw0, bh0] = c.body;
  const bx = ox + bx0 * G, by = oy + by0 * G, bw = bw0 * G, bh = bh0 * G;
  const label = (txt, size) => {
    s.font = `600 ${size}px "JetBrains Mono", monospace`;
    s.textAlign = 'center'; s.textBaseline = 'middle';
    s.fillText(txt, bx + bw / 2, by + bh / 2);
  };
  switch (c.type) {
    case 'qfp':
      s.strokeRect(bx + 2.5, by + 2.5, bw - 5, bh - 5);
      s.beginPath(); s.moveTo(bx + 2.5, by + G * 1.2); s.lineTo(bx + G * 1.2, by + 2.5); s.stroke();
      s.beginPath(); s.arc(bx + G * 1.4, by + G * 1.4, 2, 0, Math.PI * 2); s.fill();
      label(c.part.split(' · ')[0], Math.max(7, Math.min(11, bw / 9)));
      break;
    case 'bga':
      s.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      s.beginPath(); s.moveTo(bx - 4, by - 4); s.lineTo(bx + G, by - 4); s.lineTo(bx - 4, by + G); s.closePath(); s.fill();
      break;
    case 'soic':
      s.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
      s.beginPath();
      if (c.vert) s.arc(bx + bw / 2, by + 1.5, G * 0.4, 0, Math.PI);
      else s.arc(bx + 1.5, by + bh / 2, G * 0.4, -Math.PI / 2, Math.PI / 2);
      s.stroke();
      break;
    case 'sot':
      s.strokeRect(bx + 1, by - 2, bw - 2, bh + 4);
      break;
    case 'pas': case 'led': {
      if (c.vert) {
        s.beginPath(); s.moveTo(X(c.x0) - G * 0.6, Y(c.y0 + 1) - G * 0.3); s.lineTo(X(c.x0) - G * 0.6, Y(c.y0 + 1) + G * 0.3);
        s.moveTo(X(c.x0) + G * 0.6, Y(c.y0 + 1) - G * 0.3); s.lineTo(X(c.x0) + G * 0.6, Y(c.y0 + 1) + G * 0.3); s.stroke();
      } else {
        s.beginPath(); s.moveTo(X(c.x0 + 1) - G * 0.3, Y(c.y0) - G * 0.6); s.lineTo(X(c.x0 + 1) + G * 0.3, Y(c.y0) - G * 0.6);
        s.moveTo(X(c.x0 + 1) - G * 0.3, Y(c.y0) + G * 0.6); s.lineTo(X(c.x0 + 1) + G * 0.3, Y(c.y0) + G * 0.6); s.stroke();
      }
      if (c.type === 'led') {
        const cx = X(c.vert ? c.x0 : c.x0 + 1), cy = Y(c.vert ? c.y0 + 1 : c.y0), r = G * 0.28;
        s.beginPath(); s.moveTo(cx - r, cy - r); s.lineTo(cx + r, cy); s.lineTo(cx - r, cy + r); s.closePath(); s.fill();
      }
      break;
    }
    case 'xtal': {
      const x1 = X(c.x0) - G * 0.7, x2 = X(c.x0 + 4) + G * 0.7, y = Y(c.y0);
      s.beginPath(); s.roundRect(x1, y - G * 0.8, x2 - x1, G * 1.6, G * 0.8); s.stroke();
      break;
    }
    case 'hdr':
      s.strokeRect(ox + c.x0 * G - 1.5, oy + c.y0 * G - 1.5, c.w * G + 3, c.h * G + 3);
      break;
    case 'cap': {
      const cx = (X(c.x0 + 1) + X(c.x0 + 4)) / 2, cy = Y(c.y0 + 2);
      s.beginPath(); s.arc(cx, cy, G * 2.4, 0, Math.PI * 2); s.stroke();
      s.font = `700 ${G}px "JetBrains Mono", monospace`; s.textAlign = 'center'; s.textBaseline = 'middle';
      s.fillText('+', X(c.x0 + 1), cy - G * 1.2);
      break;
    }
    case 'hole': {
      const cx = X(c.x0 + 3), cy = Y(c.y0 + 3), x = L.over.x;
      x.fillStyle = 'rgba(222, 184, 112, .07)'; x.beginPath(); x.arc(cx, cy, G * 2.5, 0, Math.PI * 2); x.fill();
      x.fillStyle = COL.hole; x.beginPath(); x.arc(cx, cy, G * 1.6, 0, Math.PI * 2); x.fill();
      s.beginPath(); s.arc(cx, cy, G * 3.2, 0, Math.PI * 2); s.stroke();
      break;
    }
    case 'fid': {
      const cx = X(c.x0 + 1), cy = Y(c.y0 + 1), x = L.over.x;
      x.fillStyle = COL.pad; x.beginPath(); x.arc(cx, cy, G * 0.5, 0, Math.PI * 2); x.fill();
      s.globalAlpha = 0.5; s.beginPath(); s.arc(cx, cy, G * 1.3, 0, Math.PI * 2); s.stroke(); s.globalAlpha = 1;
      break;
    }
    case 'tp':
      s.beginPath(); s.arc(X(c.x0), Y(c.y0), G * 0.8, 0, Math.PI * 2); s.stroke();
      break;
  }
  if (c.ref) {
    s.fillStyle = COL.silk;
    s.font = `600 ${Math.round(G * 0.8)}px "JetBrains Mono", monospace`;
    s.textAlign = 'left'; s.textBaseline = 'bottom';
    s.fillText(c.ref, ox + c.x0 * G, oy + c.y0 * G - 2);
  }
}

/* ---------------------------------------------------------------- routing */
const hF = [], hS = [];
function hPush(f, s) {
  let i = hF.length; hF.push(f); hS.push(s);
  while (i > 0) { const p = (i - 1) >> 1; if (hF[p] <= f) break; hF[i] = hF[p]; hS[i] = hS[p]; i = p; }
  hF[i] = f; hS[i] = s;
}
function hPop() {
  const top = hS[0], lf = hF.pop(), ls = hS.pop(), n = hF.length;
  if (n) {
    let i = 0;
    for (;;) {
      let l = 2 * i + 1; if (l >= n) break;
      if (l + 1 < n && hF[l + 1] < hF[l]) l++;
      if (hF[l] >= lf) break;
      hF[i] = hF[l]; hS[i] = hS[l]; i = l;
    }
    hF[i] = lf; hS[i] = ls;
  }
  return top;
}

// A* over (cell, heading). 45° turns are cheap, 90° turns cost more, sharper turns are banned.
// SMD pads must leave straight out for two cells and be entered straight on.
function astar(layer, start, goal, net, sDir, gIn, maxExp = 3500) {
  const O = layer ? occB : occ;
  const st = ++stampN;
  hF.length = 0; hS.length = 0;
  const gx = goal % cols, gy = (goal / cols) | 0;
  const H = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return dx > dy ? dx + 0.414 * dy : dy + 0.414 * dx; };
  const sx = start % cols, sy = (start / cols) | 0;
  for (let d = 0; d < 8; d++) {
    if (sDir != null && d !== sDir) continue;
    const s = start * 8 + d; stamp[s] = st; gS[s] = 0; par[s] = -1; hPush(H(sx, sy), s);
  }
  let exp = 0;
  while (hS.length) {
    const s = hPop();
    if (closed[s] === st) continue;
    closed[s] = st;
    const c = s >> 3, d = s & 7;
    if (c === goal) {
      const out = [];
      for (let k = s; k !== -1; k = par[k]) { const cc = k >> 3; if (out[out.length - 1] !== cc) out.push(cc); }
      return out.reverse();
    }
    if (++exp > maxExp) return null;
    const cx = c % cols, cy = (c / cols) | 0, g = gS[s];
    for (let t = -2; t <= 2; t++) {
      const nd = (d + t) & 7;
      if (sDir != null && g < 1.5 && nd !== d) continue;
      const dx = DX[nd], dy = DY[nd], nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const n = ny * cols + nx;
      if (n === goal) { if (gIn != null && nd !== gIn) continue; }
      else { if (n === start) continue; const o = O[n]; if (o !== 0 && o !== net) continue; }
      if (dx && dy) {
        const a = O[cy * cols + nx], b = O[ny * cols + cx];
        if ((a !== 0 && a !== net) || (b !== 0 && b !== net)) continue;
      }
      const at = t < 0 ? -t : t;
      const ng = g + (nd & 1 ? 1.414 : 1) + (at === 1 ? 0.3 : at === 2 ? 2.2 : 0);
      const ns = n * 8 + nd;
      if (stamp[ns] === st && ng >= gS[ns]) continue;
      stamp[ns] = st; gS[ns] = ng; par[ns] = s;
      hPush(ng + H(nx, ny) * 1.1, ns);
    }
  }
  return null;
}

function toPts(cells) {
  const pts = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i], x = c % cols, y = (c / cols) | 0;
    if (i > 0 && i < cells.length - 1) {
      const p = cells[i - 1], q = cells[i + 1];
      if (c - p === q - c) continue; // straight through, drop it
    }
    pts.push([X(x), Y(y)]);
  }
  return pts;
}
function commit(net, layer, cells) {
  const O = layer ? occB : occ;
  for (const c of cells) if (O[c] === 0 || O[c] === -2) O[c] = net.id;
  const pts = toPts(cells);
  net.segs.push({ layer, pts });
  net.poly = net.poly.length ? net.poly.concat(pts.slice(1)) : pts;
  strokePts(layer ? L.bot.x : L.top.x, pts, layer ? COL.bot : COL.cu, traceW(net, layer));
}
function addVia(cell, id) {
  vias.push(cell);
  occ[cell] = id; occB[cell] = id;
  drawVia(L.over.x, cell);
}

// Buses: pair up a side of one IC with a facing side of another and route pin-to-pin
// in order, which gives the wide parallel bundles real boards have.
function* routeBuses() {
  const sides = [];
  for (const c of comps) {
    if (c.prio < 4) continue;
    for (const d of [E, S, W, N]) {
      const ps = c.pins.filter((p) => p.dir === d && p.dogbone == null);
      if (ps.length >= 3) sides.push({ c, d, ps });
    }
  }
  shuffle(sides);
  const usedSide = new Set();
  for (const A of sides) {
    if (usedSide.has(A) || Math.random() < 0.25) continue;
    const ax = A.ps.reduce((s, p) => s + p.x, 0) / A.ps.length, ay = A.ps.reduce((s, p) => s + p.y, 0) / A.ps.length;
    let best = null, bestD = 1e9;
    for (const B of sides) {
      if (B === A || B.c === A.c || usedSide.has(B)) continue;
      const bx = B.ps.reduce((s, p) => s + p.x, 0) / B.ps.length, by = B.ps.reduce((s, p) => s + p.y, 0) / B.ps.length;
      // B should sit roughly in the direction A's pins point, and point back-ish
      const vx = bx - ax, vy = by - ay, dist = Math.hypot(vx, vy);
      if (dist > 80 || dist < 6) continue;
      const facing = (vx * DX[A.d] + vy * DY[A.d]) / dist;
      const back = -(DX[B.d] * vx + DY[B.d] * vy) / dist;
      if (facing < 0.2 || back < -0.2) continue;
      const score = dist * (2 - facing - back * 0.5);
      if (score < bestD) { bestD = score; best = B; }
    }
    if (!best) continue;
    usedSide.add(A); usedSide.add(best);
    const key = (p) => p.x * 0.7 + p.y;
    const a = A.ps.filter((p) => !p.net).sort((p, q) => key(p) - key(q));
    let b = best.ps.filter((p) => !p.net).sort((p, q) => key(p) - key(q));
    const n = Math.min(a.length, b.length, ri(3, 8));
    const off = ri(0, Math.max(0, a.length - n));
    const aa = a.slice(off, off + n);
    // pick the pairing order with shorter total wire (fewer crossings)
    const cost = (bb) => aa.reduce((s, p, i) => s + Math.hypot(p.x - bb[i].x, p.y - bb[i].y), 0);
    const fwd = b.slice(0, n), rev = b.slice(-n).reverse();
    b = cost(fwd) <= cost(rev) ? fwd : rev;
    const group = [];
    for (let i = 0; i < n; i++) {
      const p = aa[i], q = b[i];
      if (p.net || q.net) continue;
      const net = newNet(sigName());
      const path = astar(0, p.cell, q.cell, net.id, p.dir, (q.dir + 4) & 7, 9000);
      if (path) { commit(net, 0, path); p.net = q.net = net.id; net.pins.push(p, q); net.ends = [p, q]; group.push(net.id); }
      yield;
    }
    if (group.length >= 2) buses.push(group);
  }
}

function routePin(p) {
  const net = newNet(sigName());
  const cands = [];
  for (const q of pins) {
    if (q.net || q.c === p.c || q.dogbone != null) continue;
    const d = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y));
    if (d < 2 || d > (p.c.prio >= 4 ? 42 : 24)) continue;
    // ICs prefer talking to other ICs / passives over another pin of a passive next door
    cands.push([d + rand(0, 8) - (q.c.prio >= 3 ? 6 : 0), q]);
  }
  cands.sort((a, b) => a[0] - b[0]);
  for (let k = 0; k < Math.min(2, cands.length); k++) {
    const q = cands[k][1];
    const path = astar(0, p.cell, q.cell, net.id, p.dir, q.dir == null ? null : (q.dir + 4) & 7, p.c.prio >= 4 ? 6000 : 3000);
    if (path) {
      commit(net, 0, path);
      p.net = q.net = net.id; net.pins.push(p, q); net.ends = [p, q];
      return;
    }
  }
  stub(p, net);
}

// no partner: run a short trace out and drop a via to the bottom layer
function stub(p, net) {
  const dirs = p.dir != null ? [p.dir] : shuffle([0, 2, 4, 6, 1, 3, 5, 7]);
  for (const d of dirs) {
    const len = ri(2, 5), cells = [p.cell];
    let x = p.x, y = p.y, ok = true;
    for (let s = 0; s < len; s++) {
      const px = x, py = y;
      x += DX[d]; y += DY[d];
      if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) { ok = false; break; }
      const c = y * cols + x;
      if (occ[c] !== 0 || occB[c] !== 0 || (compAt[c] && compAt[c] !== p.c.i + 1)) { ok = false; break; }
      if (DX[d] && DY[d] && (occ[py * cols + x] !== 0 || occ[y * cols + px] !== 0)) { ok = false; break; }
      cells.push(c);
    }
    if (!ok) continue;
    commit(net, 0, cells);
    p.net = net.id; net.pins.push(p); net.ends = [p, null];
    const v = cells[cells.length - 1];
    addVia(v, net.id);
    bItems.push({ cell: v, net: net.id });
    return;
  }
  p.net = -1;
}

function pairBottom(b) {
  b.used = true;
  const bx = b.cell % cols, by = (b.cell / cols) | 0;
  const cands = [];
  for (const o of bItems) {
    if (o.used) continue;
    const d = Math.max(Math.abs(o.cell % cols - bx), Math.abs(((o.cell / cols) | 0) - by));
    if (d < 4 || d > 45) continue;
    cands.push([d + rand(0, 5), o]);
  }
  cands.sort((a, c) => a[0] - c[0]);
  for (let k = 0; k < Math.min(2, cands.length); k++) {
    const o = cands[k][1];
    const A = nets[resolve(b.net)];
    const path = astar(1, b.cell, o.cell, A.id, null, null, 4000);
    if (!path) continue;
    const B = nets[resolve(o.net)];
    commit(A, 1, path);
    A.poly = A.poly.concat(B.poly.slice().reverse().slice(1));
    A.segs.push(...B.segs);
    A.ends = [A.ends[0], B.ends[0]];
    for (const p of B.pins) { p.net = A.id; A.pins.push(p); }
    alias[B.id] = A.id;
    o.used = true;
    return;
  }
}

// Copper pour the way CAD tools do it: flood the board, then cut a clearance
// around every top-layer trace, pad, via and part.
function paintPour(x, color) {
  const clr = G * 0.42;
  x.save();
  x.fillStyle = color;
  x.fillRect(ox + G * 0.5, oy + G * 0.5, cols * G - G, rows * G - G);
  x.globalCompositeOperation = 'destination-out';
  x.strokeStyle = x.fillStyle = '#000';
  x.lineCap = x.lineJoin = 'round';
  for (let i = 1; i < nets.length; i++) {
    const n = nets[i];
    for (const sg of n.segs) if (!sg.layer) strokePts(x, sg.pts, '#000', traceW(n, 0) + clr * 2);
  }
  for (const p of pins) {
    const cx = X(p.x), cy = Y(p.y);
    x.beginPath(); x.arc(cx, cy, G * 0.5 + clr, 0, Math.PI * 2); x.fill();
  }
  for (let c = 0; c < occ.length; c++) {
    if (occ[c] > 0 && occB[c] === occ[c]) { // vias
      x.beginPath(); x.arc(X(c % cols), Y((c / cols) | 0), G * 0.34 + clr, 0, Math.PI * 2); x.fill();
    }
  }
  for (const c of comps) {
    if (c.type === 'hole') { x.beginPath(); x.arc(X(c.x0 + 3), Y(c.y0 + 3), G * 2.5 + clr, 0, Math.PI * 2); x.fill(); continue; }
    if (c.type === 'bga' || c.type === 'qfp' || c.type === 'soic' || c.type === 'sot') {
      const [bx, by, bw, bh] = c.body;
      x.fillRect(ox + bx * G - clr / 2, oy + by * G - clr / 2, bw * G + clr, bh * G + clr);
    }
  }
  x.restore();
}

function* pour() {
  // cell mask (for hover / clicks) of where the pour ends up
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const c = y * cols + x;
      if (occ[c] || compAt[c]) continue;
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (occ[c + dy * cols + dx] !== 0) { ok = false; break; }
      if (ok) pourMask[c] = 1;
    }
  }
  yield;
  const P = L.pour.x;
  paintPour(P, COL.pour);
  yield;
  // stitching vias tie the pour to the ground plane
  for (let y = 2; y < rows - 2; y += 5) for (let x = 2 + (Math.floor(y / 5) % 2) * 2; x < cols - 2; x += 5) {
    const c = y * cols + x;
    let ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!pourMask[c + dy * cols + dx]) { ok = false; break; }
    if (!ok) continue;
    occ[c] = gnd.id;
    drawVia(P, c, 'rgba(200, 158, 88, .06)');
  }
}

function* build() {
  placeAll();
  leds = comps.filter((c) => c.type === 'led').map((c) => ({
    c,
    x: X(c.vert ? c.x0 : c.x0 + 1), y: Y(c.vert ? c.y0 + 1 : c.y0),
    rgb: c.part.startsWith('red') ? '255, 92, 80' : c.part.startsWith('green') ? '90, 255, 150' : '255, 190, 70',
    mode: pick(['breathe', 'blink', 'heartbeat', 'blink']),
    phase: rand(0, 6), period: rand(1.2, 3.2), on: Math.random() < 0.5, next: rand(0.1, 1.5), flash: 0,
  }));
  yield;
  for (const p of pins) {
    if (p.dogbone == null) continue;
    const net = newNet(sigName());
    commit(net, 0, [p.cell, p.dogbone]);
    p.net = net.id; net.pins.push(p); net.ends = [p, null];
    addVia(p.dogbone, net.id);
    bItems.push({ cell: p.dogbone, net: net.id });
  }
  yield;
  yield* routeBuses();
  const order = shuffle(pins.filter((p) => p.dogbone == null)).sort((a, b) => b.c.prio - a.c.prio);
  for (const p of order) {
    if (p.net) continue;
    routePin(p);
    yield;
  }
  shuffle(bItems);
  for (const b of bItems) {
    if (b.used) continue;
    pairBottom(b);
    yield;
  }
  yield* pour();
  built = true;
}

/* ------------------------------------------------------------ interaction */
function hitAt(px, py) {
  const cx = Math.floor((px - ox) / G), cy = Math.floor((py - oy) / G);
  if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return null;
  const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const cellsNear = near.map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows).map(([x, y]) => y * cols + x);
  for (const c of cellsNear) if (padAt[c]) {
    const p = pins[padAt[c] - 1];
    return p.net > 0 ? { type: 'net', id: resolve(p.net), pin: p } : { type: 'comp', comp: p.c, pin: p };
  }
  for (const c of cellsNear) {
    const t = occ[c];
    if (t > 0) return t === gnd.id ? { type: 'gnd' } : { type: 'net', id: resolve(t) };
    const b = occB[c];
    if (b > 0) return { type: 'net', id: resolve(b) };
  }
  const c0 = cy * cols + cx;
  if (compAt[c0]) return { type: 'comp', comp: comps[compAt[c0] - 1] };
  if (pourMask[c0]) return { type: 'gnd' };
  return null;
}

const pinName = (p) => `${p.c.ref}.${p.no}`;
function describe(h) {
  if (h.type === 'net') {
    const n = nets[h.id], [a, b] = n.ends;
    let d = a && b ? `${pinName(a)} → ${pinName(b)}` : a ? `${pinName(a)} → via` : '';
    if (n.segs.some((s) => s.layer)) d += '  · top + bottom';
    return [n.name, d];
  }
  if (h.type === 'comp') return [h.comp.ref || 'FID', h.comp.part + (h.pin ? `  · pin ${h.pin.no} NC` : '')];
  return ['GND', 'copper pour · stitched to plane'];
}

function drawNet(net, colorTop, colorBot, extra = 1) {
  for (const s of net.segs) strokePts(ctx, s.pts, s.layer ? colorBot : colorTop, traceW(net, s.layer) + extra);
}
function drawHover(h) {
  if (h.type === 'net') {
    const n = nets[h.id];
    drawNet(n, COL.hi, COL.hiBot);
    for (const p of n.pins) drawPad(ctx, p, COL.hiPad);
  } else if (h.type === 'comp') {
    const c = h.comp;
    for (const p of c.pins) if (p.net > 0) drawNet(nets[resolve(p.net)], COL.lit, COL.lit, 0.5);
    for (const p of c.pins) drawPad(ctx, p, COL.hiPad);
    ctx.strokeStyle = COL.hi; ctx.lineWidth = 1.5;
    ctx.strokeRect(ox + c.x0 * G - 3, oy + c.y0 * G - 3, c.w * G + 6, c.h * G + 6);
  } else if (h.type === 'gnd') {
    if (!pourHi) { pourHi = mkLayer(); paintPour(pourHi.x, COL.pourHi); }
    ctx.drawImage(pourHi.c, 0, 0, VW, VH);
  }
}

function pulse(net, forward, gen = 0, ambient = false, bus = false) {
  if (!net || net.poly.length < 2) return;
  const pts = forward ? net.poly : net.poly.slice().reverse();
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  pulses.push({ net, pts, cum, total: cum[cum.length - 1], d: 0, speed: ambient ? 150 : bus ? 360 : 280, gen, forward, ambient, bus, arrived: false });
}
function pointAt(p, d) {
  d = Math.max(0, Math.min(p.total, d));
  let i = 1;
  while (i < p.cum.length - 1 && p.cum[i] < d) i++;
  const seg = p.cum[i] - p.cum[i - 1] || 1, t = (d - p.cum[i - 1]) / seg;
  const a = p.pts[i - 1], b = p.pts[i];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function arrive(p) {
  const end = p.forward ? p.net.ends[1] : p.net.ends[0];
  const [x, y] = p.pts[p.pts.length - 1];
  if (end) {
    // the part it lands on lights up for a moment
    const c = end.c;
    if (c.prio >= 3) chipGlow.set(c, Math.max(chipGlow.get(c) || 0, p.ambient ? 0.45 : 1));
    if (c.type === 'led') { const l = leds.find((q) => q.c === c); if (l) l.flash = 1; }
  }
  if (!p.ambient) pings.push({ x, y, t: 0, small: true });
  if (p.ambient || p.gen >= 3 || !end) return;
  // signal hops through the part it reached and fans out to its other nets
  const comp = end.c;
  const others = shuffle([...new Set(comp.pins.filter((q) => q.net > 0).map((q) => resolve(q.net)))].filter((id) => id !== p.net.id));
  for (const id of others.slice(0, p.gen === 0 ? 3 : 2)) {
    const n2 = nets[id];
    pulse(n2, !!(n2.ends[0] && n2.ends[0].c === comp), p.gen + 1);
  }
}

function burst(h, x, y) {
  pings.push({ x, y, t: 0 });
  if (h?.type === 'gnd') pourRipples.push({ x, y, t: 0 });
  if (h?.type === 'net') {
    const n = nets[h.id];
    pulse(n, true); pulse(n, false);
  } else if (h?.type === 'comp') {
    const c = h.comp;
    for (const id of new Set(c.pins.filter((p) => p.net > 0).map((p) => resolve(p.net)))) {
      const n = nets[id];
      pulse(n, !!(n.ends[0] && n.ends[0].c === c), 1);
    }
  } else {
    // empty board / pour: wake up the nearest few nets
    const cx = Math.floor((x - ox) / G), cy = Math.floor((y - oy) / G), found = new Set();
    for (let r = 1; r <= 8 && found.size < 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const t = occ[ny * cols + nx];
      if (t > 0 && t !== gnd.id) found.add(resolve(t));
    }
    for (const id of found) pulse(nets[id], Math.random() < 0.5, 1);
  }
}

// keep the board quiet under the cube, the hero text and anything clickable
function cubeRect() {
  let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
  for (const p of document.querySelectorAll('.panel')) {
    const q = p.getBoundingClientRect();
    l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
  }
  return { l, t, r, b };
}
function blocked(e) {
  if (e.target?.closest?.('.panel, .name, .lede, .facenav, .corner, button, a, input, .dossier, #boot')) return true;
  const c = cubeRect();
  return e.clientX >= c.l && e.clientX <= c.r && e.clientY >= c.t && e.clientY <= c.b;
}

const tip = document.createElement('div');
tip.className = 'pcb-tip';
tip.setAttribute('aria-hidden', 'true');
const tipName = document.createElement('b'), tipInfo = document.createElement('span');
tip.append(tipName, tipInfo);
document.body.append(tip);
let tipTimer = 0;

function setHover(h, x, y) {
  hovered = h;
  root.classList.toggle('pcb-hot', !!h);
  if (!h) { tip.classList.remove('on'); return; }
  const [a, b] = describe(h);
  tipName.textContent = a; tipInfo.textContent = b;
  const w = tip.offsetWidth, hgt = tip.offsetHeight;
  const tx = x + 18 + w > VW - 8 ? x - w - 14 : x + 18;
  const ty = y + 20 + hgt > VH - 8 ? y - hgt - 12 : y + 20;
  tip.style.transform = `translate(${tx}px, ${ty}px)`;
  tip.classList.add('on');
}

addEventListener('pointermove', (e) => {
  if (!comps) return;
  const b = blocked(e);
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = !b && e.pointerType === 'mouse';
  if (b) return setHover(null);
  const h = hitAt(e.clientX, e.clientY);
  setHover(h?.type === 'gnd' ? null : h, e.clientX, e.clientY); // empty pour stays quiet on hover
}, { passive: true });
document.addEventListener('pointerleave', () => { ptr.on = false; });

/* -------------------------------------------------------------- effects */
// re-draw the copper inside a rect, masked by `shade`, and add it on top → that area glows
const fx = document.createElement('canvas'), fxx = fx.getContext('2d');
function reveal(x, y, w, h, shade, layers = [L.bot, L.top, L.over]) {
  if (x < 0) { w += x; x = 0; }
  if (y < 0) { h += y; y = 0; }
  w = Math.min(w, VW - x); h = Math.min(h, VH - y);
  if (w <= 1 || h <= 1) return;
  const W2 = Math.ceil(w * dpr), H2 = Math.ceil(h * dpr);
  if (fx.width < W2 || fx.height < H2) { fx.width = Math.max(fx.width, W2); fx.height = Math.max(fx.height, H2); }
  fxx.globalCompositeOperation = 'source-over';
  fxx.clearRect(0, 0, W2, H2);
  for (const l of layers) fxx.drawImage(l.c, x * dpr, y * dpr, W2, H2, 0, 0, W2, H2);
  fxx.globalCompositeOperation = 'destination-in';
  shade(fxx, W2, H2, x * dpr, y * dpr);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(fx, 0, 0, W2, H2, x, y, w, h);
  ctx.restore();
}

function drawEffects(dt, now) {
  const t = now / 1000;

  // inspection scan: a beam sweeps across the board every few seconds
  if (!reduceMotion) {
    if (scanX < 0) { scanT -= dt; if (scanT <= 0) scanX = 0.0001; }
    if (scanX > 0) {
      scanX += 700 * dt;
      const x = scanX - 160, bw = 140;
      reveal(x - bw, 0, bw * 2, VH, (g, w, h, gx) => {
        const cx = x * dpr - gx;
        const gr = g.createLinearGradient(cx - bw * dpr, 0, cx + bw * dpr, 0);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      });
      ctx.strokeStyle = 'rgba(140, 180, 255, .1)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, VH); ctx.stroke();
      if (x > VW + bw) { scanX = -1; scanT = rand(6, 11); }
    }
  }

  // cursor lamp: copper near the mouse lights up
  lampA += ((ptr.on ? 1 : 0) - lampA) * Math.min(1, dt * 8);
  if (lampA > 0.02) {
    const R = 150;
    reveal(ptr.x - R, ptr.y - R, R * 2, R * 2, (g, w, h, gx, gy) => {
      const cx = ptr.x * dpr - gx, cy = ptr.y * dpr - gy;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * dpr);
      gr.addColorStop(0, `rgba(0,0,0,${0.55 * lampA})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }

  // clicking the ground pour: a small soft ripple of pour lights up around the click
  if (pourRipples.length && !pourHi) { pourHi = mkLayer(); paintPour(pourHi.x, COL.pourHi); }
  for (const r of pourRipples) {
    r.t += dt;
    const k = Math.min(1, r.t / 0.7), R = 30 + k * 110, a = 0.6 * (1 - k);
    reveal(r.x - R, r.y - R, R * 2, R * 2, (g, w, h, gx, gy) => {
      const cx = r.x * dpr - gx, cy = r.y * dpr - gy;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * dpr);
      gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, [pourHi]);
  }
  pourRipples = pourRipples.filter((r) => r.t < 0.7);

  // chips light up when a signal lands on them
  for (const [c, v] of chipGlow) {
    const [bx, by, bw, bh] = c.body;
    ctx.fillStyle = `rgba(255, 220, 150, ${v * 0.04})`;
    ctx.fillRect(ox + bx * G, oy + by * G, bw * G, bh * G);
    ctx.strokeStyle = `rgba(255, 220, 150, ${v * 0.4})`; ctx.lineWidth = 1.5;
    ctx.strokeRect(ox + bx * G + 1.5, oy + by * G + 1.5, bw * G - 3, bh * G - 3);
    const nv = v - dt * 1.6;
    if (nv <= 0) chipGlow.delete(c); else chipGlow.set(c, nv);
  }

  // status LEDs
  for (const l of leds) {
    let b;
    if (reduceMotion) b = 0.7;
    else if (l.mode === 'breathe') b = 0.5 + 0.5 * Math.sin(l.phase + t * (Math.PI * 2) / l.period);
    else if (l.mode === 'heartbeat') { const k = (t + l.phase) % 1.4; b = k < 0.08 || (k > 0.2 && k < 0.28) ? 1 : 0.08; }
    else { l.next -= dt; if (l.next <= 0) { l.on = !l.on; l.next = l.on ? rand(0.05, 0.4) : rand(0.1, 1.6); } b = l.on ? 1 : 0.08; }
    l.flash = Math.max(0, l.flash - dt * 2);
    b = Math.min(1, b + l.flash);
    const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, G * 2.8);
    gr.addColorStop(0, `rgba(${l.rgb}, ${0.28 * b})`); gr.addColorStop(1, `rgba(${l.rgb}, 0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(l.x, l.y, G * 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(${l.rgb}, ${0.15 + 0.45 * b})`;
    ctx.beginPath(); ctx.arc(l.x, l.y, G * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * b})`;
    ctx.beginPath(); ctx.arc(l.x, l.y, G * 0.14, 0, Math.PI * 2); ctx.fill();
  }

  // vias twinkle now and then
  if (!reduceMotion && vias.length && Math.random() < dt * 7) twinkles.push({ cell: pick(vias), t: 0 });
  for (const w of twinkles) {
    w.t += dt;
    const k = w.t / 0.8, a = Math.sin(Math.PI * Math.min(1, k));
    const x = X(w.cell % cols), y = Y((w.cell / cols) | 0);
    const gr = ctx.createRadialGradient(x, y, 0, x, y, G * 1.4);
    gr.addColorStop(0, `rgba(255, 236, 190, ${0.35 * a})`); gr.addColorStop(1, 'rgba(255, 236, 190, 0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, G * 1.4, 0, Math.PI * 2); ctx.fill();
  }
  twinkles = twinkles.filter((w) => w.t < 0.8);

  // bus bursts: a whole bundle fires at once
  if (!reduceMotion && buses.length) {
    busT -= dt;
    if (busT <= 0) {
      busT = rand(1.6, 3.4);
      const g = pick(buses), fwd = Math.random() < 0.5;
      g.forEach((id, i) => setTimeout(() => pulse(nets[resolve(id)], fwd, 3, false, true), i * 40));
    }
  }
}
addEventListener('pointerdown', (e) => {
  if (!comps || e.button > 0 || blocked(e)) return;
  const h = hitAt(e.clientX, e.clientY);
  burst(h, e.clientX, e.clientY);
  if (e.pointerType === 'touch') {
    setHover(h?.type === 'gnd' ? null : h, e.clientX, e.clientY);
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => setHover(null), 1600);
  }
});
document.addEventListener('pointerleave', () => setHover(null));

/* ------------------------------------------------------------------ frame */
let last = performance.now(), ambientT = 1;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!built) {
    const t0 = performance.now();
    while (performance.now() - t0 < 8) if (builder.next().done) { built = true; break; }
  }

  ctx.clearRect(0, 0, VW, VH);
  ctx.drawImage(L.bot.c, 0, 0, VW, VH);
  ctx.drawImage(L.pour.c, 0, 0, VW, VH);
  ctx.drawImage(L.top.c, 0, 0, VW, VH);
  ctx.drawImage(L.over.c, 0, 0, VW, VH);

  drawEffects(dt, now);
  if (hovered) drawHover(hovered);

  // signals
  for (const p of pulses) {
    p.d += p.speed * dt;
    if (!p.ambient && !p.bus) drawNet(p.net, COL.lit, 'rgba(170, 200, 255, .35)', 0.5);
    for (let k = 0; k < 14; k++) {
      const dd = p.d - k * 4;
      if (dd < 0 || dd > p.total) continue;
      const [x, y] = pointAt(p, dd);
      ctx.fillStyle = `rgba(${COL.pulse}, ${(1 - k / 14) * (p.ambient ? 0.25 : p.bus ? 0.5 : 1)})`;
      ctx.beginPath(); ctx.arc(x, y, k === 0 ? 2.8 : 2.1, 0, Math.PI * 2); ctx.fill();
    }
    if (!p.arrived && p.d >= p.total) { p.arrived = true; arrive(p); }
  }
  pulses = pulses.filter((p) => p.d - 60 < p.total);

  for (const g of pings) {
    g.t += dt;
    const life = g.small ? 0.35 : 0.6, k = g.t / life;
    ctx.strokeStyle = `rgba(255, 220, 150, ${Math.max(0, 1 - k) * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(g.x, g.y, (g.small ? 4 : 6) + k * (g.small ? 12 : 46), 0, Math.PI * 2); ctx.stroke();
  }
  pings = pings.filter((g) => g.t < (g.small ? 0.35 : 0.6));

  // background chatter: random signals wandering the board
  if (!reduceMotion) {
    ambientT -= dt;
    if (ambientT <= 0) {
      ambientT = rand(0.18, 0.5);
      for (let t = 0; t < 10; t++) {
        const n = nets[ri(1, nets.length - 1)];
        if (n && !alias[n.id] && n.poly.length > 1) { pulse(n, Math.random() < 0.5, 3, true); break; }
      }
    }
  }

  requestAnimationFrame(frame);
}

let rT = 0;
addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => {
    // ignore small height changes (mobile address bar)
    if (innerWidth !== VW || Math.abs(innerHeight - VH) > 140) setup();
  }, 250);
});

setup();
requestAnimationFrame(frame);
