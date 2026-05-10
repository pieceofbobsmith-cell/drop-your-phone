import * as THREE from './three.module.min.js';

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════
const PLAYER_SPEED        = 0.15;
const PLAYER_HEIGHT       = 1.7;
const SIGNAL_FILL_RATE    = 0.025;
const SIGNAL_MAX          = 100;
const ICE_SPAWN_THRESHOLD = 80;
const ICE_SPEED           = 0.045;
const ICE_CHASE_SPEED     = 0.07;
const ICE_DETECT_RANGE    = 18;
const ICE_CATCH_RANGE     = 1.5;
const CITY_SIZE           = 200;
const BLOCK_SIZE          = 20;
const ROAD_WIDTH          = 8;
const BUILDING_HEIGHT_MIN = 8;
const BUILDING_HEIGHT_MAX = 40;
const DEST_RANGE          = 4;
const PLAYER_RADIUS       = 0.5;

const DESTINATIONS = [
  { id: 'work',   label: 'WORK',   requiresPhone: true,  desc: 'Clock in via app',  x:  30, z:  30 },
  { id: 'school', label: 'SCHOOL', requiresPhone: true,  desc: 'Text from school',  x: -40, z:  20 },
  { id: 'lawyer', label: 'LAWYER', requiresPhone: true,  desc: 'Video call access', x: -35, z: -40 },
  { id: 'home',   label: 'HOME',   requiresPhone: false, desc: 'Get home safe',     x:  35, z: -35 },
];

const BURNER_SPAWNS = [
  { x:  10, z:  10 },
  { x: -15, z:  30 },
  { x:  25, z: -20 },
  { x: -25, z: -10 },
  { x:   0, z: -30 },
];

const ENDINGS = {
  caught: [
    { text: 'In fiscal year 2025, ICE deported 319,980 people.', delay: 1500 },
    { text: 'More than one in three had no criminal record.', delay: 3500 },
  ],
  home_phone: [
    { text: 'You made it home safely.', delay: 1500 },
    { text: 'While you walked, your location data was sold to a data broker for less than a penny.', delay: 3000 },
    { text: 'ICE bought it for $0.0003.', delay: 5500 },
  ],
  home_no_phone: [
    { text: "You're safe.", delay: 1500 },
    { text: "You missed your daughter's school pickup.", delay: 3000 },
    { text: 'Your boss called twice.', delay: 4500 },
    { text: 'Your lawyer is waiting.', delay: 5800 },
    { text: 'This is the cost of privacy when you cannot afford it.', delay: 7500 },
  ],
};

// ═══════════════════════════════════════════════════════
// Audio
// ═══════════════════════════════════════════════════════
const audio = (() => {
  let ctx = null, nodes = [], started = false;

  function start() {
    if (started) return;
    started = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 55;
      const g1 = ctx.createGain(); g1.gain.value = 0.06;
      osc1.connect(g1).connect(ctx.destination); osc1.start();
      const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 82.4;
      const g2 = ctx.createGain(); g2.gain.value = 0.03;
      osc2.connect(g2).connect(ctx.destination); osc2.start();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const ng = ctx.createGain(); ng.gain.value = 0.015;
      const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 400;
      noise.connect(nf).connect(ng).connect(ctx.destination); noise.start();
      nodes = [osc1, osc2, noise, g1, g2, ng, nf];
    } catch (e) {}
  }

  function setTension(level) {
    if (!ctx || nodes.length < 6) return;
    const [,,, g1, g2, ng] = nodes;
    const t = ctx.currentTime;
    g1.gain.linearRampToValueAtTime(0.06 + level * 0.08, t + 0.1);
    g2.gain.linearRampToValueAtTime(0.03 + level * 0.06, t + 0.1);
    ng.gain.linearRampToValueAtTime(0.015 + level * 0.04, t + 0.1);
  }

  function stop() {
    if (ctx) { ctx.close(); ctx = null; started = false; nodes = []; }
  }

  return { start, setTension, stop };
})();

// ═══════════════════════════════════════════════════════
// City builder
// ═══════════════════════════════════════════════════════
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function buildCity(scene) {
  const rand = seededRand(42);
  const buildings = [];
  const stride = BLOCK_SIZE + ROAD_WIDTH;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SIZE * 2, CITY_SIZE * 2),
    new THREE.MeshLambertMaterial({ color: 0x0d1117 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMat = new THREE.MeshLambertMaterial({ color: 0x111820 });
  for (let bx = -4; bx <= 4; bx++) {
    const vr = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, CITY_SIZE * 2), roadMat);
    vr.rotation.x = -Math.PI / 2; vr.position.set(bx * stride, 0.01, 0); scene.add(vr);
    const hr = new THREE.Mesh(new THREE.PlaneGeometry(CITY_SIZE * 2, ROAD_WIDTH), roadMat);
    hr.rotation.x = -Math.PI / 2; hr.position.set(0, 0.01, bx * stride); scene.add(hr);
  }

  const dashMat = new THREE.MeshLambertMaterial({ color: 0x2a3a4a });
  for (let bx = -4; bx <= 4; bx++) {
    for (let seg = -10; seg <= 10; seg++) {
      if (seg % 2 === 0) continue;
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 2), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(bx * stride, 0.02, seg * 2.5); scene.add(d);
      const dh = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.15), dashMat);
      dh.rotation.x = -Math.PI / 2; dh.position.set(seg * 2.5, 0.02, bx * stride); scene.add(dh);
    }
  }

  for (let bx = -4; bx <= 3; bx++) {
    for (let bz = -4; bz <= 3; bz++) {
      const cx = bx * stride + stride / 2;
      const cz = bz * stride + stride / 2;
      const numW = 1 + Math.floor(rand() * 2);
      const numD = 1 + Math.floor(rand() * 2);
      const bwCell = (BLOCK_SIZE - 2) / numW;
      const bdCell = (BLOCK_SIZE - 2) / numD;

      for (let wi = 0; wi < numW; wi++) {
        for (let di = 0; di < numD; di++) {
          const bWidth  = bwCell * (0.6 + rand() * 0.35);
          const bDepth  = bdCell * (0.6 + rand() * 0.35);
          const bHeight = BUILDING_HEIGHT_MIN + rand() * (BUILDING_HEIGHT_MAX - BUILDING_HEIGHT_MIN);
          const px = cx - BLOCK_SIZE / 2 + 1 + wi * bwCell + bwCell / 2 - (bwCell - bWidth) / 2;
          const pz = cz - BLOCK_SIZE / 2 + 1 + di * bdCell + bdCell / 2 - (bdCell - bDepth) / 2;

          const sh = 0.08 + rand() * 0.06;
          const bc = (Math.floor(sh * 0.6 * 255) << 16) | (Math.floor(sh * 0.75 * 255) << 8) | Math.floor(sh * 255);
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(bWidth, bHeight, bDepth),
            new THREE.MeshLambertMaterial({ color: bc })
          );
          mesh.position.set(px, bHeight / 2, pz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          scene.add(mesh);
          buildings.push({ x: px, z: pz, halfW: bWidth / 2, halfD: bDepth / 2 });

          addWindows(scene, px, bHeight, pz, bWidth, bDepth, rand);
          if (rand() > 0.5) addRooftopDetail(scene, px, bHeight, pz, bWidth, bDepth, rand);
        }
      }
    }
  }

  addStreetLights(scene, stride);
  return buildings;
}

function addWindows(scene, bx, bh, bz, bw, bd, rand) {
  const winDark = new THREE.MeshBasicMaterial({ color: 0x1a2a3a });
  const winLit  = new THREE.MeshBasicMaterial({ color: 0x3a5570 });
  const colsX = Math.floor(bw / 1.4);
  const rowsY = Math.floor(bh / 2);
  for (const fz of [bz - bd / 2 - 0.05, bz + bd / 2 + 0.05]) {
    for (let c = 0; c < colsX; c++) {
      for (let r = 1; r < rowsY; r++) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), rand() > 0.4 ? winLit : winDark);
        w.position.set(bx - bw / 2 + (c + 0.5) * (bw / colsX) + 0.1, r * 2 + 0.5, fz);
        if (fz < bz) w.rotation.y = Math.PI;
        scene.add(w);
      }
    }
  }
  const colsZ = Math.floor(bd / 1.4);
  for (const fx of [bx - bw / 2 - 0.05, bx + bw / 2 + 0.05]) {
    for (let c = 0; c < colsZ; c++) {
      for (let r = 1; r < rowsY; r++) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), rand() > 0.4 ? winLit : winDark);
        w.position.set(fx, r * 2 + 0.5, bz - bd / 2 + (c + 0.5) * (bd / colsZ) + 0.1);
        w.rotation.y = fx < bx ? -Math.PI / 2 : Math.PI / 2;
        scene.add(w);
      }
    }
  }
}

function addRooftopDetail(scene, bx, bh, bz, bw, bd, rand) {
  if (rand() > 0.6) {
    const tH = 1.5 + rand() * 2;
    const tMat = new THREE.MeshLambertMaterial({ color: 0x1a2030 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, tH, 8), tMat);
    tower.position.set(bx + (rand() - 0.5) * bw * 0.5, bh + tH / 2, bz + (rand() - 0.5) * bd * 0.5);
    scene.add(tower);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 4), tMat);
      leg.position.set(tower.position.x + Math.cos(a) * 0.3, bh + 0.6, tower.position.z + Math.sin(a) * 0.3);
      scene.add(leg);
    }
  }
  const bxW = 0.8 + rand() * 1.2, bxH = 0.5 + rand() * 0.8;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(bxW, bxH, bxW * 0.7),
    new THREE.MeshLambertMaterial({ color: 0x141e28 })
  );
  box.position.set(bx + (rand() - 0.5) * bw * 0.6, bh + bxH / 2, bz + (rand() - 0.5) * bd * 0.6);
  scene.add(box);
}

function addStreetLights(scene, stride) {
  const poleMat  = new THREE.MeshLambertMaterial({ color: 0x1a2233 });
  const headMat  = new THREE.MeshBasicMaterial({ color: 0xc8a870 });
  for (let bx = -4; bx <= 4; bx++) {
    for (let seg = -8; seg <= 8; seg++) {
      const pts = [
        { x: bx * stride - ROAD_WIDTH / 2 - 0.5, z: seg * stride * 0.4 },
        { x: bx * stride + ROAD_WIDTH / 2 + 0.5, z: seg * stride * 0.4 },
        { x: seg * stride * 0.4, z: bx * stride - ROAD_WIDTH / 2 - 0.5 },
        { x: seg * stride * 0.4, z: bx * stride + ROAD_WIDTH / 2 + 0.5 },
      ];
      pts.forEach(p => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), poleMat);
        pole.position.set(p.x, 3, p.z); scene.add(pole);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.3), headMat);
        head.position.set(p.x, 6.1, p.z); scene.add(head);
        if (Math.abs(bx) < 2 && Math.abs(seg) < 2) {
          const lt = new THREE.PointLight(0xc8a870, 0.8, 14);
          lt.position.set(p.x, 6, p.z); scene.add(lt);
        }
      });
    }
  }
}

// ═══════════════════════════════════════════════════════
// Three.js setup
// ═══════════════════════════════════════════════════════
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
document.getElementById('renderer-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050a12);
scene.fog = new THREE.FogExp2(0x050a12, 0.022);
scene.add(new THREE.AmbientLight(0x1a2535, 0.8));
const dirLight = new THREE.DirectionalLight(0x2a3a55, 0.4);
dirLight.position.set(50, 80, 30); dirLight.castShadow = true; scene.add(dirLight);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
const clock = new THREE.Clock();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════════════════
// Game state
// ═══════════════════════════════════════════════════════
let STATE = 'TITLE';
let restartEnabled = false;
let buildings = [];
let destMeshes = [];
let burnerObjs = [];
let iceAgents = [];
let spawnCooldown = 0;
let rafId = null;
let gameState = null;
const player = { x: 0, z: 0, yaw: 0, pitch: 0 };
const keys = {};
const mouse = { lastX: null, lastY: null, locked: false };

function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2); }

function collidesWithBuildings(nx, nz) {
  for (const b of buildings) {
    if (Math.abs(nx - b.x) < b.halfW + PLAYER_RADIUS &&
        Math.abs(nz - b.z) < b.halfD + PLAYER_RADIUS) return true;
  }
  return false;
}

function tryMove(nx, nz) {
  const fX = !collidesWithBuildings(nx, player.z);
  const fZ = !collidesWithBuildings(player.x, nz);
  if (fX && fZ && !collidesWithBuildings(nx, nz)) {
    player.x = Math.max(-95, Math.min(95, nx));
    player.z = Math.max(-95, Math.min(95, nz));
  } else if (fX) {
    player.x = Math.max(-95, Math.min(95, nx));
  } else if (fZ) {
    player.z = Math.max(-95, Math.min(95, nz));
  }
}

// ═══════════════════════════════════════════════════════
// Input
// ═══════════════════════════════════════════════════════
const canvas = renderer.domElement;
canvas.style.cursor = 'crosshair';

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  audio.start();
  if (e.code === 'Space' || e.code === 'Enter') {
    if (STATE === 'TITLE')  { showIntro(); return; }
    if (STATE === 'INTRO')  { startGame(); return; }
    if (STATE === 'ENDED' && restartEnabled) { resetGame(); return; }
  }
  if (e.code === 'Space' && STATE === 'PLAYING') dropPhone();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('click', () => {
  audio.start();
  if (STATE === 'TITLE')  { showIntro(); return; }
  if (STATE === 'INTRO')  { startGame(); return; }
  if (STATE === 'ENDED' && restartEnabled) { resetGame(); return; }
  if (STATE === 'PLAYING') { try { canvas.requestPointerLock(); } catch (_) {} }
});

document.addEventListener('pointerlockchange', () => {
  mouse.locked = document.pointerLockElement === canvas;
});
document.addEventListener('mousemove', e => {
  if (!mouse.locked) return;
  player.yaw   -= e.movementX * 0.002;
  player.pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.pitch - e.movementY * 0.002));
});
canvas.addEventListener('mousemove', e => {
  if (mouse.locked) return;
  if (mouse.lastX !== null) {
    player.yaw  -= (e.clientX - mouse.lastX) * 0.003;
    player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.pitch - (e.clientY - mouse.lastY) * 0.003));
  }
  mouse.lastX = e.clientX; mouse.lastY = e.clientY;
});
canvas.addEventListener('mouseleave', () => { mouse.lastX = null; mouse.lastY = null; });

// ═══════════════════════════════════════════════════════
// Screen helpers
// ═══════════════════════════════════════════════════════
function showScreen(id) {
  ['title-screen', 'intro-screen', 'end-screen'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  document.getElementById('hud').classList.toggle('hidden', id !== null);
}

// ═══════════════════════════════════════════════════════
// Title / intro
// ═══════════════════════════════════════════════════════
function animateTitle() {
  setTimeout(() => { document.getElementById('title-text').style.opacity = '1'; }, 300);
  setTimeout(() => {
    const l = document.getElementById('title-line');
    l.style.opacity = '1'; l.style.transform = 'scaleX(1)';
  }, 800);
  setTimeout(() => { document.getElementById('title-subtitle').style.opacity = '1'; }, 1200);
  setTimeout(() => { document.getElementById('title-prompt').style.opacity = '1'; }, 2500);
}

function showIntro() {
  if (STATE !== 'TITLE') return;
  STATE = 'INTRO';
  showScreen('intro-screen');
  setTimeout(() => { document.getElementById('intro-line1').style.opacity = '1'; }, 300);
  setTimeout(() => { document.getElementById('intro-line2').style.opacity = '1'; }, 1500);
  setTimeout(() => { document.getElementById('intro-line3').style.opacity = '1'; }, 3000);
  setTimeout(() => { document.getElementById('intro-prompt').style.opacity = '1'; }, 4500);
}

// ═══════════════════════════════════════════════════════
// Spawn helpers
// ═══════════════════════════════════════════════════════
function spawnIce() {
  const group = new THREE.Group();
  // Body: use cylinder + sphere to fake capsule (works in all Three.js versions)
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.3, 8);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x080808 }));
  body.position.y = 1.0; group.add(body);
  const headGeo = new THREE.SphereGeometry(0.35, 8, 6);
  const head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0x080808 }));
  head.position.y = 1.65; group.add(head);
  const redLight = new THREE.PointLight(0xcc2200, 2, 7);
  redLight.position.y = 1.5; group.add(redLight);
  const a = Math.random() * Math.PI * 2;
  const d = 35 + Math.random() * 20;
  group.position.set(player.x + Math.cos(a) * d, 0, player.z + Math.sin(a) * d);
  scene.add(group);
  iceAgents.push({ group, speed: ICE_SPEED + Math.random() * 0.02, fleeing: false, fleeTimer: 0 });
}

function dropPhoneVisual(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.55, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x2a3a2a })
  );
  mesh.position.set(x, 0.3, z);
  mesh.rotation.y = Math.random() * Math.PI;
  scene.add(mesh);
}

// ═══════════════════════════════════════════════════════
// Game actions
// ═══════════════════════════════════════════════════════
function dropPhone() {
  if (!gameState || !gameState.hasPhone) return;
  dropPhoneVisual(player.x, player.z);
  gameState.hasPhone = false;
  gameState.signal = 0;
  iceAgents.forEach(a => { a.fleeing = true; a.fleeTimer = 10; });
  flashMsg('Phone dropped. ICE lost your signal.', 4);
  updatePhoneStatus();
}

function flashMsg(text, dur) {
  if (!gameState) return;
  gameState.lastMsg = text;
  gameState.lastMsgTimer = dur;
}

// ═══════════════════════════════════════════════════════
// Start game
// ═══════════════════════════════════════════════════════
function startGame() {
  if (STATE !== 'INTRO') return;

  // Clear previous objects
  destMeshes.forEach(m => scene.remove(m)); destMeshes = [];
  iceAgents.forEach(a => scene.remove(a.group)); iceAgents = [];
  burnerObjs.forEach(b => scene.remove(b.group)); burnerObjs = [];

  if (!buildings.length) buildings = buildCity(scene);

  // Destination beams
  destMeshes = DESTINATIONS.map(d => {
    const group = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.3, 12, 8),
      new THREE.MeshBasicMaterial({ color: d.requiresPhone ? 0x3a7aaa : 0x7aaa3a, transparent: true, opacity: 0.4 })
    );
    beam.position.y = 6; group.add(beam);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 2.2, 32),
      new THREE.MeshBasicMaterial({ color: d.requiresPhone ? 0x5a9acc : 0x5acc7a, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; group.add(ring);
    group.position.set(d.x, 0, d.z);
    scene.add(group);
    return group;
  });

  // Burner phones
  burnerObjs = BURNER_SPAWNS.map((bp, i) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.6, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x4a7a3a })
    ));
    const glow = new THREE.PointLight(0x5aaa4a, 1.5, 5);
    glow.position.y = 0.5; group.add(glow);
    group.position.set(bp.x, 0.8, bp.z);
    scene.add(group);
    return { group, collected: false, id: i, x: bp.x, z: bp.z };
  });

  player.x = 0; player.z = 0; player.yaw = 0; player.pitch = 0;

  gameState = {
    hasPhone: true, signal: 0,
    destStates: DESTINATIONS.map(d => ({ ...d, visited: false, failed: false })),
    currentDestIndex: 0, gameOver: false, frame: 0,
    lastMsg: 'Walk to the glowing markers. SPACE to drop your phone.',
    lastMsgTimer: 5,
  };

  spawnCooldown = 0;
  buildDestList();
  updatePhoneStatus();

  STATE = 'PLAYING';
  showScreen(null);
  clock.start();
  if (rafId) cancelAnimationFrame(rafId);
  loop();
}

// ═══════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════
function buildDestList() {
  const wrap = document.getElementById('dest-wrap');
  wrap.innerHTML = '';
  DESTINATIONS.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'dest-item';
    const dot = document.createElement('div');
    dot.className = 'dest-dot'; dot.id = `dd${i}`; dot.style.background = 'rgba(255,255,255,0.1)';
    const lbl = document.createElement('span');
    lbl.className = 'dest-lbl'; lbl.id = `dl${i}`; lbl.style.color = 'rgba(255,255,255,0.15)';
    lbl.textContent = d.label;
    item.appendChild(dot); item.appendChild(lbl);
    wrap.appendChild(item);
  });
}

function updatePhoneStatus() {
  const s = gameState;
  if (!s) return;
  document.getElementById('phone-dot').style.background   = s.hasPhone ? '#22aa22' : 'rgba(255,255,255,0.1)';
  document.getElementById('phone-label').textContent      = s.hasPhone ? 'PHONE ON' : 'NO PHONE';
  document.getElementById('phone-hint').textContent       = s.hasPhone ? 'SPACE = drop phone' : '';
}

function updateHUD() {
  const s = gameState; if (!s) return;
  const pct = s.signal / SIGNAL_MAX * 100;

  // Signal bar
  const fill = document.getElementById('signal-fill');
  fill.style.width = pct + '%';
  fill.style.background = pct > 80 ? 'linear-gradient(90deg,#7a1008,#cc3322)'
    : pct > 50 ? 'linear-gradient(90deg,#4a1808,#7a2810)'
    : 'linear-gradient(90deg,#2a1808,#3a2010)';
  document.getElementById('signal-value').textContent = s.hasPhone ? Math.round(pct) + '%' : 'NO PHONE';

  // ICE proximity
  const iceNear = iceAgents.some(a => !a.fleeing && dist2D({ x: a.group.position.x, z: a.group.position.z }, player) < 10);
  const warn = document.getElementById('ice-warning');
  warn.textContent = iceNear ? 'ICE NEARBY' : (pct > 80 ? 'LOCATION BROADCAST ACTIVE' : '');
  warn.style.color  = iceNear ? 'rgba(200,50,50,0.9)' : 'rgba(200,120,50,0.7)';
  document.getElementById('ice-border').style.borderColor = iceNear ? 'rgba(180,0,0,0.5)' : 'rgba(180,0,0,0)';

  // Destinations
  s.destStates.forEach((d, i) => {
    const dot = document.getElementById(`dd${i}`);
    const lbl = document.getElementById(`dl${i}`);
    if (!dot) return;
    if (d.visited) {
      dot.style.background = d.failed ? '#cc3322' : '#226622';
      lbl.style.color = d.failed ? 'rgba(200,50,50,0.4)' : 'rgba(255,255,255,0.2)';
      lbl.style.textDecoration = 'line-through';
    } else if (i === s.currentDestIndex) {
      dot.style.background = '#5a9acc';
      lbl.style.color = 'rgba(255,255,255,0.9)';
      lbl.style.textDecoration = 'none';
    } else {
      dot.style.background = 'rgba(255,255,255,0.1)';
      lbl.style.color = 'rgba(255,255,255,0.15)';
      lbl.style.textDecoration = 'none';
    }
  });

  // Objective
  const cd = s.destStates[s.currentDestIndex];
  const objEl = document.getElementById('objective');
  if (cd && !cd.visited) {
    objEl.style.display = 'block';
    document.getElementById('obj-label').textContent = cd.label;
    document.getElementById('obj-desc').textContent  = cd.desc;
    document.getElementById('obj-need-phone').textContent = (cd.requiresPhone && !s.hasPhone) ? 'Needs phone' : '';
  } else {
    objEl.style.display = 'none';
  }

  // Message
  const msgEl = document.getElementById('msg-flash');
  if (s.lastMsgTimer > 0) {
    document.getElementById('msg-text').textContent = s.lastMsg;
    msgEl.style.opacity = '1';
  } else {
    msgEl.style.opacity = '0';
  }

  // Vignette
  document.getElementById('vignette').style.background =
    `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${(0.35 + pct / 180).toFixed(2)}) 100%)`;

  updateMinimap();
}

function updateMinimap() {
  const mc = document.getElementById('minimap-canvas');
  const ctx = mc.getContext('2d');
  const sz = 120, sc = sz / 200, cx = sz / 2, cy = sz / 2;
  ctx.clearRect(0, 0, sz, sz);

  const s = gameState; if (!s) return;

  s.destStates.forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(cx + d.x * sc, cy + d.z * sc, 4, 0, Math.PI * 2);
    ctx.fillStyle = d.visited
      ? (d.failed ? 'rgba(200,50,50,0.4)' : 'rgba(50,100,50,0.4)')
      : (i === s.currentDestIndex ? 'rgba(90,154,204,0.9)' : 'rgba(50,60,70,0.5)');
    ctx.fill();
  });

  iceAgents.forEach(a => {
    if (a.fleeing) return;
    ctx.beginPath();
    ctx.arc(cx + a.group.position.x * sc, cy + a.group.position.z * sc, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,34,0,0.8)';
    ctx.fill();
  });

  const ppx = cx + player.x * sc, ppy = cy + player.z * sc;
  ctx.beginPath(); ctx.arc(ppx, ppy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(ppx, ppy);
  ctx.lineTo(ppx + Math.sin(-player.yaw) * 8, ppy + Math.cos(-player.yaw) * 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
}

// ═══════════════════════════════════════════════════════
// Game loop
// ═══════════════════════════════════════════════════════
function loop() {
  rafId = requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05);
  const s = gameState;
  if (!s || s.gameOver || STATE !== 'PLAYING') { renderer.render(scene, camera); return; }
  s.frame++;

  // Movement
  let mx = 0, mz = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    { mx -= Math.sin(player.yaw); mz -= Math.cos(player.yaw); }
  if (keys['KeyS'] || keys['ArrowDown'])  { mx += Math.sin(player.yaw); mz += Math.cos(player.yaw); }
  if (keys['KeyA'] || keys['ArrowLeft'])  { mx -= Math.cos(player.yaw); mz += Math.sin(player.yaw); }
  if (keys['KeyD'] || keys['ArrowRight']) { mx += Math.cos(player.yaw); mz -= Math.sin(player.yaw); }
  if (mx !== 0 || mz !== 0) {
    const len = Math.sqrt(mx * mx + mz * mz);
    const step = PLAYER_SPEED * 60 * delta;
    tryMove(player.x + (mx / len) * step, player.z + (mz / len) * step);
  }

  // Camera
  camera.position.set(player.x, PLAYER_HEIGHT, player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  // Signal
  if (s.hasPhone) s.signal = Math.min(SIGNAL_MAX, s.signal + SIGNAL_FILL_RATE * 60 * delta);
  audio.setTension(s.signal / SIGNAL_MAX);

  // ICE spawn
  spawnCooldown -= delta;
  if (s.hasPhone && s.signal >= ICE_SPAWN_THRESHOLD && spawnCooldown <= 0 &&
      iceAgents.filter(a => !a.fleeing).length < 4) {
    spawnIce(); spawnCooldown = 5;
  }

  // ICE movement
  const toRemove = [];
  iceAgents.forEach(agent => {
    const pos = agent.group.position;
    const d = dist2D({ x: pos.x, z: pos.z }, player);
    if (agent.fleeing) {
      agent.fleeTimer -= delta;
      if (d > 0.1) { pos.x += ((pos.x - player.x) / d) * ICE_SPEED * 60 * delta; pos.z += ((pos.z - player.z) / d) * ICE_SPEED * 60 * delta; }
      if (agent.fleeTimer <= 0) { scene.remove(agent.group); toRemove.push(agent); }
      return;
    }
    if (d < 0.01) return;
    const chase = d < ICE_DETECT_RANGE || s.signal > 90;
    const spd = (chase ? ICE_CHASE_SPEED : agent.speed) * 60 * delta;
    pos.x += (player.x - pos.x) / d * spd;
    pos.z += (player.z - pos.z) / d * spd;
    agent.group.rotation.y = Math.atan2(player.x - pos.x, player.z - pos.z);
    if (d < ICE_CATCH_RANGE) { s.gameOver = true; enterEnding('caught'); }
  });
  toRemove.forEach(a => iceAgents.splice(iceAgents.indexOf(a), 1));

  // Destination beams
  destMeshes.forEach((dm, i) => {
    dm.rotation.y += delta * 0.6;
    dm.visible = !s.destStates[i].visited;
    dm.scale.setScalar(1 + Math.sin(s.frame * 0.08) * 0.05);
  });

  // Burner phones
  burnerObjs.forEach(bp => {
    if (bp.collected) return;
    bp.group.position.y = 0.8 + Math.sin(s.frame * 0.04 + bp.id) * 0.15;
    bp.group.rotation.y += delta * 1.5;
    if (!s.hasPhone && dist2D({ x: bp.group.position.x, z: bp.group.position.z }, player) < 2) {
      bp.collected = true; bp.group.visible = false;
      s.hasPhone = true; s.signal = 5;
      flashMsg('Burner phone picked up. Signal restarting.', 3);
      updatePhoneStatus();
    }
  });

  // Destination check
  const cd = s.destStates[s.currentDestIndex];
  if (cd && !cd.visited && dist2D(player, { x: cd.x, z: cd.z }) < DEST_RANGE) {
    if (cd.requiresPhone && !s.hasPhone) {
      cd.failed = true; cd.visited = true;
      flashMsg(`${cd.label}: access denied — no phone`, 4);
    } else {
      cd.visited = true;
      flashMsg(`${cd.label}: ✓`, 3);
    }
    if (cd.id === 'home') {
      s.gameOver = true;
      setTimeout(() => enterEnding(s.hasPhone ? 'home_phone' : 'home_no_phone'), 1500);
    } else {
      s.currentDestIndex++;
    }
  }

  if (s.lastMsgTimer > 0) s.lastMsgTimer -= delta;

  // Atmosphere shift
  const sr = s.signal / SIGNAL_MAX;
  scene.fog.color.setRGB(0.02 + sr * 0.06, 0.04 + sr * 0.01, 0.07 - sr * 0.04);
  scene.background.setRGB((0.02 + sr * 0.06) * 0.4, (0.04 + sr * 0.01) * 0.4, (0.07 - sr * 0.04) * 0.4);

  renderer.render(scene, camera);
  if (s.frame % 6 === 0) updateHUD();
}

// ═══════════════════════════════════════════════════════
// Endings
// ═══════════════════════════════════════════════════════
function enterEnding(type) {
  STATE = 'ENDED';
  restartEnabled = false;
  audio.setTension(0);

  const lines = ENDINGS[type];
  const linesDiv = document.getElementById('end-lines');
  linesDiv.innerHTML = '';
  const footer = document.getElementById('end-footer');
  const restart = document.getElementById('end-restart');
  footer.style.opacity = '0';
  restart.style.opacity = '0';

  lines.forEach(line => {
    const p = document.createElement('p');
    p.className = 'end-line';
    p.textContent = line.text;
    linesDiv.appendChild(p);
    setTimeout(() => { p.style.opacity = '1'; }, line.delay);
  });

  const lastDelay = lines[lines.length - 1].delay;
  setTimeout(() => { footer.style.opacity = '1'; }, lastDelay + 2000);
  setTimeout(() => {
    restartEnabled = true;
    restart.style.opacity = '1';
  }, lastDelay + 3500);

  showScreen('end-screen');
  document.getElementById('end-restart-btn').onclick = () => { if (restartEnabled) resetGame(); };
}

// ═══════════════════════════════════════════════════════
// Reset
// ═══════════════════════════════════════════════════════
function resetGame() {
  iceAgents.forEach(a => scene.remove(a.group)); iceAgents = [];
  destMeshes.forEach(m => scene.remove(m)); destMeshes = [];
  burnerObjs.forEach(b => scene.remove(b.group)); burnerObjs = [];
  gameState = null; restartEnabled = false;

  // Reset title screen opacities for re-animation
  ['title-text','title-subtitle','title-line','title-prompt'].forEach(id => {
    const el = document.getElementById(id);
    el.style.opacity = '0';
    if (id === 'title-line') el.style.transform = 'scaleX(0)';
  });

  STATE = 'TITLE';
  showScreen('title-screen');
  setTimeout(animateTitle, 100);
}

// ═══════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════
window.addEventListener('load', () => {
  showScreen('title-screen');
  animateTitle();

  // Idle render loop (keeps scene alive before game starts / during screens)
  (function idleLoop() {
    requestAnimationFrame(idleLoop);
    if (STATE !== 'PLAYING') renderer.render(scene, camera);
  })();
});
