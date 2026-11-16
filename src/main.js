import './style.css';
import './bg.js';
import './cursor.js';
import face from './data/face.json';
import projects from './data/projects.json';
import experiences from './data/experiences.json';
import awards from './data/awards.json';
import cats from './data/cats.json';
import music from './data/music.json';

import home from './data/home.json';
import sections from './data/sections.json';
import CONTACT from './data/contact.json';
import SKILLS from './data/skills.json';
import STATS from './data/stats.json';

// [label, href, display text] for every filled-in contact field
const url = (v) => (/^(https?:|mailto:|\/)/.test(v) ? v : 'https://' + v);
const CONTACT_LINKS = [
  CONTACT.email && ['email', 'mailto:' + CONTACT.email, CONTACT.email],
  ...['linkedin', 'github', 'devpost'].filter((k) => CONTACT[k]).map((k) => [k, url(CONTACT[k]), CONTACT[k].replace(/^https?:\/\/(www\.)?/, '')]),
].filter(Boolean);

// Cube faces. `rx`/`ry` is the cube rotation that brings the face to the front.
// Labels/titles come from src/data/sections.json.
const FACES = [
  { id: 'home',    rx: 0,   ry: 0 },
  { id: 'work',    rx: 0,   ry: -90 },
  { id: 'builds',  rx: 0,   ry: -180 },
  { id: 'honors',  rx: 0,   ry: 90 },
  { id: 'stack',   rx: -90, ry: 0 },
  { id: 'contact', rx: 90,  ry: 0 },
].map((f) => ({ ...f, label: sections[f.id]?.nav || f.id }));
const narrow = () => innerWidth < 900;
const baseTilt = () => (narrow() ? { x: -4, y: 5 } : { x: -8, y: 11 }); // resting tilt so you can see it's a cube

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// JSON text formatting: *word* = accent highlight, _word_ = grey. Everything else is escaped.
const fmt = (str, accentTag = 'span class="acc"') => {
  const close = accentTag.split(' ')[0];
  return esc(str ?? '')
    .replace(/\*(.+?)\*/g, `<${accentTag}>$1</${close}>`)
    .replace(/(^|[\s(])_(.+?)_(?=[\s).,!?]|$)/g, '$1<span class="muted">$2</span>');
};

const work = experiences.work;
const volunteer = experiences.volunteer;
const fellowships = experiences.fellowships || [];

/* -------------------------------------------------------------------- cube */
const CUBE = (() => {
  const stage = $('#stage');
  const tilt = $('#tilt');
  const spin = $('#spin');
  const cube = $('#cube');
  const panels = [...cube.querySelectorAll('.panel')];
  const nav = $('#facenav');
  let cur = 0;
  let ry = 0, rx = 0;            // accumulated rotation (so spins take the short way round)

  nav.innerHTML = FACES.map((f, i) => `<button data-face="${f.id}"><i>${String(i + 1).padStart(2, '0')}</i>${f.label}</button>`).join('');

  function size() {
    const r = stage.getBoundingClientRect();
    const s = Math.floor(Math.max(240, narrow()
      ? Math.min(r.width * 0.9, r.height * 0.84)
      : Math.min(r.width * 0.86, r.height * 0.84, 900) * 0.92));
    setTilt();
    document.documentElement.style.setProperty('--s', s + 'px');
  }

  // The rotation is applied per panel (via --rot), not on .cube itself: a
  // .cube rotated a quarter turn is edge-on to the viewer, and Chrome then
  // can't hit-test anything inside it (top/bottom faces became unclickable
  // whenever the mouse parallax tilted the view past that edge).
  function apply() {
    cube.style.setProperty('--rot', `rotateX(${rx}deg) rotateY(${ry}deg)`);
  }

  function to(id, { instant = false } = {}) {
    const i = FACES.findIndex((f) => f.id === id);
    if (i < 0) return;
    const f = FACES[i];
    if (i === cur && !instant) return;
    // shortest path: pick the equivalent target angle nearest the current one
    const near = (target, from, period) => target + Math.round((from - target) / period) * period;
    if (f.rx === 0) { rx = near(0, rx, 360); ry = near(f.ry, ry, 360); }
    else { rx = near(f.rx, rx, 360); ry = near(0, ry, 360); }
    cur = i;
    if (instant || reduceMotion) {
      cube.classList.add('no-anim'); apply(); void cube.offsetWidth; cube.classList.remove('no-anim');
    } else {
      apply();
      spin.classList.remove('go'); void spin.offsetWidth; spin.classList.add('go');
    }
    panels.forEach((p) => {
      const on = p.dataset.face === id;
      p.classList.toggle('active', on);
      p.inert = !on;
    });
    nav.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.face === id));
    if (location.hash.slice(1) !== id) window.history.replaceState(null, '', '#' + id);
    if (id === 'home' && matchMedia('(pointer: fine)').matches) setTimeout(() => $('#cmd').focus({ preventScroll: true }), instant ? 0 : 700);
  }
  const step = (d) => to(FACES[(cur + d + FACES.length) % FACES.length].id);

  // mouse parallax on top of the resting tilt
  let mx = 0, my = 0;
  const setTilt = () => { const b = baseTilt(); tilt.style.transform = `rotateX(${b.x - my * 5}deg) rotateY(${b.y + mx * 7}deg)`; };
  if (!reduceMotion) {
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; setTilt();
    });
  }
  setTilt();

  // navigation inputs
  nav.addEventListener('click', (e) => { const b = e.target.closest('[data-face]'); if (b) to(b.dataset.face); });
  document.querySelectorAll('a[data-face]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); to(a.dataset.face); }));
  addEventListener('keydown', (e) => {
    if (!$('#dossier').hidden || e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (/^[1-6]$/.test(e.key)) to(FACES[+e.key - 1].id);
  });
  addEventListener('hashchange', () => to(location.hash.slice(1)));
  let tx = 0, ty = 0;
  stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  size();
  new ResizeObserver(size).observe(stage);
  return { to, step, get current() { return FACES[cur].id; } };
})();

/* ---------------------------------------------------------------- ASCII face */
const FACE = (() => {
  const el = $('#face');
  const rows = face.rows;
  const H = rows.length;
  const W = Math.max(...rows.map((r) => r.length));
  const RAMP = ".`':;-~=+*xoX#%&@";
  const tier = (ch) => { const i = RAMP.indexOf(ch); return i < 0 ? 0 : i < 6 ? 1 : i < 12 ? 2 : 3; };
  let rowEls = [];
  let nextGlitch = performance.now() + 2500;

  function render(charAt = (x, y) => rows[y][x] || ' ') {
    let html = '';
    for (let y = 0; y < H; y++) {
      html += '<span class="r">';
      let run = '', runT = -1;
      const flush = () => { if (run) html += runT > 0 ? `<span class="t${runT}">${run}</span>` : run; run = ''; };
      for (let x = 0; x < W; x++) {
        const ch = charAt(x, y);
        const t = ch === ' ' ? runT : tier(ch);
        if (t !== runT) { flush(); runT = t; }
        run += ch === ' ' ? ' ' : esc(ch);
      }
      flush();
      html += '</span>\n';
    }
    el.innerHTML = html;
    rowEls = [...el.querySelectorAll('.r')];
  }

  async function decode() {
    if (reduceMotion) { render(); return; }
    const seed = rows.map((r) => [...r].map(() => Math.random()));
    const t0 = performance.now(), dur = 1100;
    await new Promise((done) => {
      const frame = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        render((x, y) => {
          const ch = rows[y][x] || ' ';
          if (ch === ' ') return ' ';
          return seed[y][x] * 0.7 + (y / H) * 0.3 < t ? ch : RAMP[(Math.random() * RAMP.length) | 0];
        });
        t < 1 ? requestAnimationFrame(frame) : done();
      };
      requestAnimationFrame(frame);
    });
  }

  // row-tear glitch every few seconds (face + name)
  function glitchLoop() {
    const now = performance.now();
    if (!reduceMotion && rowEls.length && now > nextGlitch) {
      nextGlitch = now + 1800 + Math.random() * 3200;
      const start = (Math.random() * (rowEls.length - 6)) | 0;
      const torn = rowEls.slice(start, start + 2 + ((Math.random() * 5) | 0));
      torn.forEach((r) => { r.style.transform = `translateX(${(Math.random() * 6 - 3).toFixed(1)}ch)`; r.classList.add('gl'); });
      setTimeout(() => {
        torn.forEach((r) => { r.style.transform = ''; r.classList.remove('gl'); });
      }, 90 + Math.random() * 110);
    }
    setTimeout(glitchLoop, 100);
  }

  function fit() {
    const body = $('#console-body');
    const avail = body.clientWidth - 30;
    const target = avail > 560 ? avail * 0.44 : avail < 420 ? avail * 0.55 : avail * 0.8;
    const fs = Math.max(3, Math.min(10, target / (W * 0.6)));
    el.style.setProperty('--face-fs', fs.toFixed(2) + 'px');
  }

  return { decode, render, glitchLoop, fit };
})();

/* -------------------------------------------------------------------- bio */
// Hero text + bio beside the portrait — all from src/data/home.json.
$('.name').setAttribute('aria-label', (home.name || []).join(' '));
$('.name').innerHTML = (home.name || []).map((n, i) => `<span class="name-line" data-text="${esc(n)}">${esc(n)}</span>`).join('');
$('.lede').innerHTML = fmt(home.tagline, 'b');
const BIO = (home.bio?.paragraphs || []).map((p) => fmt(p));
$('#sysinfo').innerHTML = `
  <div class="bio-head"><span class="who">${esc(home.bio?.title || '')}</span><span class="muted">${esc(home.bio?.subtitle || '')}</span></div>
  ${BIO.map((p) => `<p>${p}</p>`).join('')}`;

// Face headings from src/data/sections.json
for (const f of FACES) {
  const sec = sections[f.id] || {};
  const panel = $(`.panel[data-face="${f.id}"]`);
  if (sec.title && $('h2', panel)) $('h2', panel).textContent = sec.title;
  if ($('.kicker', panel)) $('.kicker', panel).innerHTML = fmt(sec.kicker);
}
$('.big-line').innerHTML = fmt(sections.contact?.bigLine, 'em');
$('.foot').textContent = sections.contact?.footer || '';

/* ----------------------------------------------------------------- console */
const out = $('#out');
const body = $('#console-body');
const input = $('#cmd');
const ghost = $('#ghost');
const cmdHistory = [];
let hIdx = 0;
let follow = false; // only auto-scroll the console once the visitor starts typing

function print(html, cls = '') {
  const div = document.createElement('div');
  div.className = 'line ' + cls;
  div.innerHTML = html;
  out.appendChild(div);
  if (follow) body.scrollTop = body.scrollHeight;
  return div;
}
async function typeOut(lines, delay = 22) {
  for (const l of lines) { print(l); if (!reduceMotion) await sleep(delay); }
}
const go = (id) => CUBE.to(id);
const findProject = (arg) => {
  if (!arg) return null;
  const n = parseInt(arg, 10);
  if (!Number.isNaN(n)) return projects[n - 1] || null;
  const a = arg.toLowerCase();
  return projects.find((p) => p.slug === a || p.short.toLowerCase().includes(a)) || null;
};
const faceLink = (id, text) => `<button class="link" data-go="${id}">${text}</button>`;

const COMMANDS = {
  help: {
    desc: 'list commands',
    run: () => typeOut([
      '<span class="acc">available commands</span>',
      ...Object.entries(COMMANDS).filter(([, c]) => c.desc).map(([k, c]) => `  ${k.padEnd(12)}<span class="dim">${c.desc}</span>`),
      '<span class="dim">tab to autocomplete · ↑↓ history · ←→ outside the prompt rotates the cube</span>',
    ], 12),
  },
  whoami: {
    desc: 'the short version',
    run: () => typeOut([`<span class="acc">${esc(home.bio?.title || '')}</span>`, ...BIO]),
  },
  ls: {
    desc: 'list directory',
    run: () => print(['work/', 'builds/', 'honors/', 'toolchain/', 'contact/'].map((d) => `<span class="acc">${d}</span>`).join('  ') + '  resume.pdf  cat.jpg'),
  },
  cd: {
    desc: 'rotate the cube: cd builds',
    run: (a) => {
      const map = { work: 'work', builds: 'builds', honors: 'honors', toolchain: 'stack', stack: 'stack', contact: 'contact', '~': 'home', '..': 'home', home: 'home' };
      const k = (a || '').replace(/\/$/, '');
      if (!k) return print('<span class="dim">cd where? try</span> cd builds');
      if (!map[k]) return print(`<span class="err">cd: no such directory: ${esc(a)}</span>`);
      print(`<span class="dim">rotating → ${map[k]}</span>`);
      go(map[k]);
    },
  },
  work: {
    desc: 'industry + research log',
    run: () => typeOut([
      '<span class="acc">// field log</span>',
      ...work.map((w) => `  <span class="dim">${esc(w.date.padEnd(20))}</span>${esc(w.name)} <span class="dim">@ ${esc(w.company)}</span>`),
      faceLink('work', '→ rotate to full log'),
    ]),
  },
  community: {
    desc: 'non-profits, hackathons, teaching',
    run: () => typeOut([
      '<span class="acc">// community</span>',
      ...volunteer.map((w) => `  <span class="dim">${esc(w.date.padEnd(20))}</span>${esc(w.name)} <span class="dim">@ ${esc(w.company)}</span>`),
    ]),
  },
  fellowships: {
    desc: 'fellowships + cohorts',
    run: () => typeOut([
      '<span class="acc">// fellowships</span>',
      ...fellowships.map((w) => `  <span class="dim">${esc(w.date.padEnd(20))}</span>${esc(w.name)} <span class="dim">@ ${esc(w.company)}</span>`),
    ]),
  },
  builds: {
    desc: 'list projects',
    run: () => typeOut([
      '<span class="acc">// builds</span> <span class="dim">— open &lt;n&gt; for the dossier</span>',
      ...projects.map((p, i) => `  <button class="link" data-open="${i}">[${i + 1}]</button> ${esc(p.short.padEnd(20))}<span class="dim">${esc(p.tag)}</span>`),
      faceLink('builds', '→ rotate to builds'),
    ]),
  },
  open: {
    desc: 'open a build: open 1 · open gripper',
    run: (a) => {
      const p = findProject(a);
      if (!p) return print(`<span class="err">open: no build "${esc(a || '')}". try</span> builds`);
      print(`<span class="dim">opening dossier → ${esc(p.short)}</span>`);
      openDossier(projects.indexOf(p));
    },
  },
  honors: {
    desc: 'awards + scholarships',
    run: () => typeOut([
      '<span class="acc">// honors</span>',
      ...awards.map((a) => `  <span class="dim">${esc(a.date.padEnd(11))}</span>${esc(a.title)}`),
    ], 14),
  },
  stack: {
    desc: 'tools + languages',
    run: () => typeOut(Object.entries(SKILLS).map(([k, v]) => `  <span class="acc">${k.padEnd(16)}</span>${v.map(esc).join(' · ')}`)),
  },
  contact: {
    desc: 'reach me',
    run: () => typeOut([
      ...CONTACT_LINKS.map(([label, href, text]) => `  ${label.padEnd(10)}<a href="${esc(href)}" ${href.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener"'}>${esc(text)}</a>`),
      ...(CONTACT.resume ? [`  resume    <a href="#resume" data-resume>resume.pdf</a>`] : []),
    ]),
  },
  resume: {
    desc: 'get my resume',
    run: () => { print(`<span class="dim">resume available on request —</span> email <a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a>`); openResume(); },
  },
  spin: {
    desc: 'spin the cube',
    run: async () => {
      print('<span class="acc">wheeee</span>');
      for (let i = 0; i < FACES.length; i++) { CUBE.step(1); await sleep(reduceMotion ? 0 : 650); }
    },
  },
  cat: {
    desc: 'cat cat.jpg',
    run: (a) => {
      if (a && !/cat/.test(a)) {
        if (a === 'resume.pdf') return print('<span class="dim">%PDF-1.7 ������ (binary — try</span> resume<span class="dim">)</span>');
        return print(`<span class="err">cat: ${esc(a)}: No such file</span>`);
      }
      const src = cats[(Math.random() * cats.length) | 0];
      const div = print(`<img class="catpic" src="${src}" alt="a cat" />`);
      div.querySelector('img').addEventListener('load', () => { body.scrollTop = body.scrollHeight; });
    },
  },
  sudo: {
    run: (a) => (a && /hire/.test(a))
      ? COMMANDS.hire.run()
      : print('<span class="dim">[sudo] password for guest: ******** — </span>nice try. jad is already root.'),
  },
  music: {
    desc: 'favorite albums + the music vault',
    run: () => {
      typeOut([
        '<span class="acc">// favorite albums</span>',
        ...ALBUMS.map((a) => `  ${esc(a.title.padEnd(32))}<span class="dim">${esc(a.artist)}</span>`),
        '<button class="link" data-vault>→ open the music vault</button>',
      ]);
    },
  },
  hire: {
    desc: 'the correct command',
    run: () => typeOut([
      '<span class="acc">[ok]</span> verifying candidate…',
      '<span class="acc">[ok]</span> surgical robotics · rocket avionics · bionic limbs',
      '<span class="acc">[ok]</span> overclocked',
      `→ ${faceLink('contact', 'initiate contact')}`,
    ], 220),
  },
  date: { run: () => print(new Date().toString()) },
  echo: { run: (a) => print(esc(a || '')) },
  history: { run: () => print(cmdHistory.map((h, i) => `  ${String(i + 1).padStart(3)}  ${esc(h)}`).join('\n') || '<span class="dim">empty</span>') },
  clear: { desc: 'clear output', run: () => { out.innerHTML = ''; } },
  exit: { run: () => print('<span class="dim">there is no exit. only more builds.</span>') },
  rm: { run: () => print('<span class="err">rm: refusing to delete a portfolio this clean</span>') },
  vim: { run: () => print('<span class="dim">you are now trapped in vim. (just kidding.)</span>') },
};
COMMANDS.projects = { run: COMMANDS.builds.run };
COMMANDS.awards = { run: COMMANDS.honors.run };
COMMANDS.skills = { run: COMMANDS.stack.run };
COMMANDS.experience = { run: COMMANDS.work.run };
COMMANDS.about = { run: COMMANDS.whoami.run };

async function exec(raw) {
  follow = true;
  const line = raw.trim();
  print(`<span class="acc">jad@menkara</span>:~$ <b>${esc(line)}</b>`, 'echo');
  if (!line) return;
  cmdHistory.push(line); hIdx = cmdHistory.length;
  const [name, ...rest] = line.split(/\s+/);
  const cmd = COMMANDS[name.toLowerCase()];
  if (!cmd) return print(`<span class="err">zsh: command not found: ${esc(name)}</span> <span class="dim">— try</span> help`);
  await cmd.run(rest.join(' '));
}

const names = Object.keys(COMMANDS);
function suggest(v) {
  if (/^open \S*$/.test(v)) {
    const part = v.slice(5);
    const p = projects.find((x) => x.slug.startsWith(part));
    return p && part ? 'open ' + p.slug : '';
  }
  if (/^cd \S*$/.test(v)) {
    const part = v.slice(3);
    const d = ['work', 'builds', 'honors', 'toolchain', 'contact'].find((x) => x.startsWith(part));
    return d && part ? 'cd ' + d : '';
  }
  if (!v || v.includes(' ')) return '';
  return names.find((n) => n.startsWith(v) && n !== v) || '';
}
input.addEventListener('input', () => { ghost.textContent = suggest(input.value); });
input.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const v = input.value; input.value = ''; ghost.textContent = '';
    await exec(v);
  } else if (e.key === 'Tab') {
    const s = suggest(input.value);
    if (s) { e.preventDefault(); input.value = s; ghost.textContent = ''; }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.value = cmdHistory[hIdx] || ''; ghost.textContent = '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault(); hIdx = Math.min(cmdHistory.length, hIdx + 1); input.value = cmdHistory[hIdx] || ''; ghost.textContent = '';
  } else if (e.key === 'l' && e.ctrlKey) {
    e.preventDefault(); out.innerHTML = '';
  }
});
body.addEventListener('click', (e) => {
  const t = e.target.closest('[data-open],[data-go]');
  if (t?.dataset.open) return openDossier(+t.dataset.open);
  if (t?.dataset.go) return go(t.dataset.go);
  if (!getSelection().toString()) input.focus({ preventScroll: true });
});

const CHIPS = (home.quickCommands || []).filter((c) => COMMANDS[c.split(' ')[0]]);
$('#chips').innerHTML = CHIPS.map((c) => `<button data-cmd="${esc(c)}">${esc(c)}</button>`).join('');
$('#chips').addEventListener('click', async (e) => {
  const c = e.target.closest('[data-cmd]')?.dataset.cmd;
  if (!c) return;
  if (!reduceMotion) { for (const ch of c) { input.value += ch; await sleep(28); } }
  input.value = ''; ghost.textContent = '';
  exec(c);
});

/* ------------------------------------------------------------------ faces */

function renderLog(list) {
  $('#log').innerHTML = list.map((w) => `
    <li>
      <button class="log-row" aria-expanded="false">
        <img class="log-logo" src="${w.thumbnail}" alt="" loading="lazy" />
        <span class="log-role">${esc(w.name)}<span class="log-co">${esc(w.company)}</span></span>
        <span class="log-date">${esc(w.date)}<span class="plus">+</span></span>
      </button>
      <div class="log-body"><div><ul>${w.bulletPoints.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div></div>
    </li>`).join('');
}
$('#log').addEventListener('click', (e) => {
  const row = e.target.closest('.log-row');
  if (!row) return;
  const li = row.parentElement;
  li.classList.toggle('open');
  row.setAttribute('aria-expanded', li.classList.contains('open'));
});
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  renderLog({ work, volunteer, fellowships }[t.dataset.tab] || work);
}));

const WIDE = new Set([0, 3, 6]);  // 2-col grid: wide, pair, wide, pair, wide
$('#grid').innerHTML = projects.map((p, i) => `
  <button class="card ${WIDE.has(i) ? 'wide' : ''}" data-open="${i}" aria-label="Open ${esc(p.short)}">
    <img src="${p.thumbnail}" alt="" loading="lazy" />
    <span class="card-n">${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}</span>
    <span class="card-tag">${esc(p.tag)}</span>
    <span class="card-meta"><h3>${esc(p.short)}</h3><p>${esc(p.sub)}</p></span>
  </button>`).join('');
$('#grid').addEventListener('click', (e) => {
  const c = e.target.closest('[data-open]');
  if (c) openDossier(+c.dataset.open);
});

$('#stats').innerHTML = STATS.map((st) => `<div class="stat"><b>${esc(st.value)}</b><span>${esc(st.label)}</span></div>`).join('');
$('#honor-list').innerHTML = awards.map((a) => {
  const t = esc(a.title).replace(/^(\([^)]*\$[^)]*\))/, '<span class="money">$1</span>');
  return `<li><span class="h-title">${t}</span><span class="h-date">${esc(a.date)}</span></li>`;
}).join('');

$('#stack-list').innerHTML = Object.entries(SKILLS).map(([k, v]) =>
  `<div class="stack-col"><h4>${k}</h4><ul>${v.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`).join('');

const LINKS = [
  ...CONTACT_LINKS.map(([label, href, text]) => [href, label, label === 'email' ? text : '↗']),
  CONTACT.resume && ['#resume', 'resume.pdf', '↗'],
].filter(Boolean);
$('#links').innerHTML = LINKS.map(([href, label, hint]) =>
  `<a href="${esc(href)}" ${href === '#resume' ? 'data-resume' : href.startsWith('mailto') ? '' : 'target="_blank" rel="noopener"'}>${esc(label)} <span>${esc(hint)}</span></a>`).join('');

/* ------------------------------------------------------- top-right links */
$('#corner').innerHTML = [
  ...CONTACT_LINKS.filter(([label]) => label !== 'email').map(([label, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} <span>↗</span></a>`),
  CONTACT.email && `<a href="mailto:${esc(CONTACT.email)}">email</a>`,
  CONTACT.resume && '<a href="#resume" data-resume class="primary">résumé</a>',
].filter(Boolean).join('');

/* ------------------------------------------------------------ resume popup */
const resumeEl = $('#resume-modal');
let resumeFocus = null;
$('#r-email').href = 'mailto:' + CONTACT.email;
$('#r-email').textContent = CONTACT.email;
function openResume() {
  resumeFocus = document.activeElement;
  resumeEl.hidden = false;
  $('#r-close').focus();
}
function closeResume() {
  resumeEl.hidden = true;
  resumeFocus?.focus?.({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-resume]')) { e.preventDefault(); openResume(); }
});
$('#r-close').addEventListener('click', closeResume);
resumeEl.addEventListener('click', (e) => { if (e.target === resumeEl) closeResume(); });
addEventListener('keydown', (e) => { if (!resumeEl.hidden && e.key === 'Escape') closeResume(); });

/* ------------------------------------------------------------- music vault */
const ALBUMS = music.albums || [];
$('#albums').innerHTML = ALBUMS.map((a, i) => `
  <li><button data-vault="${i}" title="${esc(a.title)} — ${esc(a.artist)}">
    <img src="${esc(a.cover)}" alt="" loading="lazy" />
    <span><span class="t">${esc(a.title)}</span><span class="a">${esc(a.artist)}</span></span>
  </button></li>`).join('');
$('#vault-grid').innerHTML = ALBUMS.map((a, i) => `
  <figure class="album" data-i="${i}" style="--r:${((i * 37) % 5 - 2) * 0.6}deg">
    <img src="${esc(a.cover)}" alt="${esc(a.title)} by ${esc(a.artist)} — album cover" loading="lazy" />
    <figcaption><b>${esc(a.title)}</b><span>${esc(a.artist)} · ${esc(a.year)}</span></figcaption>
  </figure>`).join('');
$('#v-covers-title').textContent = music.guitarCovers?.title || 'Guitar Covers';
$('#v-covers-status').textContent = music.guitarCovers?.status || 'Coming soon';
$('#v-yt').href = music.youtube?.url || '#';
$('#v-yt-handle').textContent = music.youtube?.handle || 'YouTube';
$('#v-yt-note').textContent = music.youtube?.note || '';

const vault = $('#vault');
let vaultFocus = null;
function openVault(i = null) {
  vaultFocus = document.activeElement;
  vault.hidden = false;
  $('#v-close').focus();
  vault.querySelectorAll('.album.flash').forEach((el) => el.classList.remove('flash'));
  if (i != null && !Number.isNaN(i)) {
    const el = vault.querySelector(`.album[data-i="${i}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      void el.offsetWidth; el.classList.add('flash');
    }
  }
}
function closeVault() {
  vault.hidden = true;
  vaultFocus?.focus?.({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-vault]');
  if (!b) return;
  e.preventDefault();
  openVault(b.dataset.vault === '' ? null : parseInt(b.dataset.vault, 10));
});
$('#v-close').addEventListener('click', closeVault);
vault.addEventListener('click', (e) => { if (e.target === vault) closeVault(); });
addEventListener('keydown', (e) => { if (!vault.hidden && e.key === 'Escape') closeVault(); });

/* ----------------------------------------------------------------- dossier */
const dossier = $('#dossier');
let dProj = null, dImg = 0, lastFocus = null;
function showImg(i) {
  const imgs = dProj.images.length ? dProj.images : [dProj.thumbnail];
  dImg = (i + imgs.length) % imgs.length;
  $('#d-img').src = imgs[dImg];
  $('#d-img').alt = `${dProj.short} — image ${dImg + 1} of ${imgs.length}`;
  $('#d-thumbs').querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === dImg));
}
function openDossier(i) {
  dProj = projects[i];
  if (!dProj) return;
  lastFocus = document.activeElement;
  $('#d-tag').textContent = dProj.tag;
  $('#d-title').textContent = dProj.short;
  $('#d-date').textContent = `${dProj.date} — ${dProj.name}`;
  $('#d-desc').textContent = dProj.description;
  $('#d-bullets').innerHTML = dProj.bulletPoints.map((b) => `<li>${esc(b)}</li>`).join('');
  const link = $('#d-link');
  link.hidden = !dProj.link || dProj.link === '#';
  link.href = dProj.link || '#';
  const imgs = dProj.images.length ? dProj.images : [dProj.thumbnail];
  $('#d-thumbs').innerHTML = imgs.length > 1
    ? imgs.map((s, j) => `<button data-i="${j}" aria-label="Image ${j + 1}"><img src="${s}" alt="" loading="lazy" /></button>`).join('')
    : '';
  showImg(0);
  dossier.hidden = false;
  $('#d-close').focus();
}
function closeDossier() {
  dossier.hidden = true;
  lastFocus?.focus?.({ preventScroll: true });
}
$('#d-thumbs').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) showImg(+b.dataset.i); });
$('#d-img').addEventListener('click', () => showImg(dImg + 1));
$('#d-close').addEventListener('click', closeDossier);
dossier.addEventListener('click', (e) => { if (e.target === dossier) closeDossier(); });
addEventListener('keydown', (e) => {
  if (dossier.hidden) return;
  if (e.key === 'Escape') closeDossier();
  if (e.key === 'ArrowRight') showImg(dImg + 1);
  if (e.key === 'ArrowLeft') showImg(dImg - 1);
});

/* -------------------------------------------------------------------- boot */
async function boot() {
  const bootEl = $('#boot');
  const log = $('#boot-log');
  let seen = false;
  try { seen = sessionStorage.getItem('booted') === '1'; sessionStorage.setItem('booted', '1'); } catch { /* storage blocked */ }
  if (!seen && !reduceMotion) {
    let skip = false;
    const skipper = () => { skip = true; };
    addEventListener('keydown', skipper, { once: true });
    bootEl.addEventListener('click', skipper, { once: true });
    const lines = (home.bootLines || []).map((l) => fmt(l));
    for (const l of lines) { if (skip) break; log.innerHTML += l + '\n'; await sleep(l ? 120 : 200); }
    if (!skip) await sleep(250);
  }
  bootEl.classList.add('done');
}

/* -------------------------------------------------------------------- init */
renderLog(work);
const startFace = FACES.some((f) => f.id === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
CUBE.to(startFace, { instant: true });
FACE.fit();
new ResizeObserver(() => FACE.fit()).observe(body);
FACE.render((x, y) => (face.rows[y][x] && face.rows[y][x] !== ' ' ? '.' : ' '));

(async () => {
  await boot();
  await FACE.decode();
  FACE.glitchLoop();
  await typeOut([
    '<span class="dim">last login: ' + new Date().toDateString() + ' on ttys001</span>',
    ...(home.consoleGreeting || []).map((l) => fmt(l)),
  ], 80);
})();
