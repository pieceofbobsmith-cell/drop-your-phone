import * as THREE from './three.module.min.js';

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════
const PLAYER_SPEED         = 0.13;
const PLAYER_SPRINT_MULT   = 2.0;
const PLAYER_CROUCH_MULT   = 0.45;
const PLAYER_HEIGHT        = 1.7;
const PLAYER_CROUCH_HEIGHT = 0.95;
const PLAYER_RADIUS        = 0.5;
const ICE_SPEED            = 0.040;
const ICE_CHASE_SPEED      = 0.065;
const ICE_DETECT_RANGE     = 22;
const ICE_CATCH_RANGE      = 1.4;
const SIGNAL_MAX           = 100;
const SIGNAL_FILL_BASE     = 0.022;
const ICE_SPAWN_THRESHOLD  = 75;
const CITY_SIZE            = 200;
const BLOCK_SIZE           = 22;
const ROAD_WIDTH           = 9;
const STRIDE               = BLOCK_SIZE + ROAD_WIDTH;
const BH_MIN               = 6;
const BH_MAX               = 38;

// ═══════════════════════════════════════════════════════
// Landmarks (walkable buildings — player walks through door)
// ═══════════════════════════════════════════════════════
const LANDMARKS = [
  {
    id: 'work', label: 'WORK', sublabel: 'Castillo Cleaning Services',
    requiresPhone: true, desc: 'Clock in via the scheduling app',
    bx: 1, bz: 1, color: 0x1a2a3a, accentColor: 0x2a4a7a,
    width: 14, depth: 14, height: 18, doorFace: 'south',
    fact: 'In 2021, ICE spent $22.1M on data broker contracts — including employee records sold by LexisNexis without worker consent.',
  },
  {
    id: 'school', label: 'SCHOOL', sublabel: 'Lincoln Elementary',
    requiresPhone: true, desc: 'Text from the school office',
    bx: -2, bz: 1, color: 0x1a2e1a, accentColor: 0x2a5a2a,
    width: 18, depth: 12, height: 10, doorFace: 'south',
    fact: 'At least 13 school districts have sold student data to third parties. Under the "third-party doctrine," data shared with any company loses 4th Amendment protection.',
  },
  {
    id: 'lawyer', label: 'LAWYER', sublabel: 'Reyes & Associates',
    requiresPhone: true, desc: 'Video call with your attorney',
    bx: -2, bz: -2, color: 0x2a1a1a, accentColor: 0x5a2a1a,
    width: 12, depth: 12, height: 22, doorFace: 'north',
    fact: 'Fog Data Science sold geofence data to ICE covering mosques, immigration courts, and legal aid offices — without warrants — for $7,000/year.',
  },
  {
    id: 'home', label: 'HOME', sublabel: 'Your Apartment',
    requiresPhone: false, desc: 'Get inside safely',
    bx: 1, bz: -2, color: 0x1e1a10, accentColor: 0x4a3a18,
    width: 10, depth: 10, height: 12, doorFace: 'north',
    fact: '',
  },
];

function landmarkWorldPos(lm) {
  return { x: lm.bx * STRIDE + STRIDE / 2, z: lm.bz * STRIDE + STRIDE / 2 };
}

const DESTINATIONS = LANDMARKS.map(lm => {
  const pos = landmarkWorldPos(lm);
  return { id: lm.id, label: lm.label, sublabel: lm.sublabel, requiresPhone: lm.requiresPhone, desc: lm.desc, x: pos.x, z: pos.z };
});

const landmarkBlocks = new Set(LANDMARKS.map(lm => `${lm.bx},${lm.bz}`));

const BURNER_SPAWNS = [
  { x: 14, z: 0 }, { x: -14, z: 14 }, { x: 25, z: -14 }, { x: -25, z: 0 }, { x: 0, z: -25 },
];

// ═══════════════════════════════════════════════════════
// Endings (updated from base44 with real 2025 statistics)
// ═══════════════════════════════════════════════════════
const ENDINGS = {
  caught: [
    { text: 'In fiscal year 2025, ICE deported 319,980 people.', delay: 1500 },
    { text: 'More than one in three had no criminal record.', delay: 3500 },
    { text: 'The average detention costs taxpayers $150 per person per day.', delay: 5500 },
    { text: 'Over 5 million U.S. citizen children have at least one undocumented parent.', delay: 7500 },
  ],
  home_phone: [
    { text: 'You made it home safely.', delay: 1500 },
    { text: 'While you walked, your location data was sold to a data broker for less than a penny.', delay: 3000 },
    { text: 'ICE purchased it commercially — no warrant required.', delay: 5500 },
    { text: 'At least 20 data brokers sell location data to federal agencies.', delay: 7500 },
    { text: 'Your phone logged 3,847 location pings today.', delay: 9500 },
  ],
  home_no_phone: [
    { text: "You're safe.", delay: 1500 },
    { text: "You missed your daughter's school pickup.", delay: 3000 },
    { text: 'Your boss marked you absent.', delay: 4500 },
    { text: 'Your lawyer had to cancel — no way to reach you.', delay: 5800 },
    { text: 'Dropping your phone costs your livelihood. Keeping it costs your freedom.', delay: 7500 },
    { text: 'This is the cost of privacy when you cannot afford it.', delay: 9500 },
  ],
};

const GAMEPLAY_FACTS = [
  'ICE purchased 336 billion location records in 2020 through a single broker.',
  'The average American generates 1,500 location pings per day from apps.',
  'Babel Street tracked protestors using geofencing at demonstration sites.',
  'Your phone\'s advertising ID is sold to data brokers every time an app opens.',
  'Venntel can reconstruct your daily routine from 90 days of location data.',
  'Thomson Reuters CLEAR gives ICE access to 400 million personal records.',
  'DHS spent $876M on commercial data purchases in fiscal year 2022.',
  'Location data brokers sell coordinates accurate to within 8 feet.',
];

// ═══════════════════════════════════════════════════════
// Audio
// ═══════════════════════════════════════════════════════
const audio = (() => {
  let ctx = null, started = false;
  let gainLow, gainMid, noiseGain, oscMid;

  function start() {
    if (started) return;
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = 0.18; master.connect(ctx.destination);
    gainLow = ctx.createGain(); gainLow.gain.value = 0.06;
    gainMid = ctx.createGain(); gainMid.gain.value = 0;
    noiseGain = ctx.createGain(); noiseGain.gain.value = 0;
    const oscLow = ctx.createOscillator(); oscLow.type = 'sine'; oscLow.frequency.value = 55;
    oscMid = ctx.createOscillator(); oscMid.type = 'triangle'; oscMid.frequency.value = 82.4;
    oscLow.connect(gainLow).connect(master);
    oscMid.connect(gainMid).connect(master);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource(); ns.buffer = buf; ns.loop = true;
    ns.connect(noiseGain).connect(master); ns.start();
    oscLow.start(); oscMid.start();
  }

  function setTension(t) {
    if (!ctx) return;
    const now = ctx.currentTime;
    gainLow.gain.linearRampToValueAtTime(0.06 + t * 0.1, now + 0.1);
    gainMid.gain.linearRampToValueAtTime(t * 0.06, now + 0.1);
    noiseGain.gain.linearRampToValueAtTime(t * 0.04, now + 0.1);
    oscMid.frequency.linearRampToValueAtTime(82.4 + t * 40, now + 0.1);
  }

  return { start, setTension };
})();

// ═══════════════════════════════════════════════════════
// Interior floor textures
// ═══════════════════════════════════════════════════════
function makeFloorTex(type) {
  const cvs = document.createElement('canvas'); cvs.width = 256; cvs.height = 256;
  const ctx = cvs.getContext('2d');
  if (type === 'tile') {
    ctx.fillStyle = '#c8c8c0'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#9a9a90'; ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
  } else if (type === 'wood') {
    ctx.fillStyle = '#5a3a18'; ctx.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 256; row += 18) {
      ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, row); ctx.lineTo(256, row); ctx.stroke();
    }
  } else if (type === 'marble') {
    ctx.fillStyle = '#d8d0c8'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(100,95,90,0.3)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#404840'; ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

// ═══════════════════════════════════════════════════════
// Interior furniture helpers
// ═══════════════════════════════════════════════════════
function addDesk(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  const dm = new THREE.MeshLambertMaterial({ color: 0x5a3c1c });
  const mm = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.9), dm); top.position.set(0, 0.76, 0); g.add(top);
  [[-0.95,-0.35],[-0.95,0.35],[0.95,-0.35],[0.95,0.35]].forEach(([lx,lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), mm); leg.position.set(lx, 0.375, lz); g.add(leg);
  });
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), mm); mon.position.set(0, 1.12, -0.28); g.add(mon);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.43), new THREE.MeshBasicMaterial({ color: 0x1a3a5a }));
  scr.position.set(0, 1.12, -0.255); g.add(scr);
  g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
}

function addChair(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.55), m); seat.position.set(0, 0.48, 0); g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), m); back.position.set(0, 0.78, -0.25); g.add(back);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 6), m); ped.position.set(0, 0.23, 0); g.add(ped);
  g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
}

function addSofa(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0x4a3828 });
  const cush = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.22, 0.75), m); cush.position.set(0, 0.33, 0); g.add(cush);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.18), m); bk.position.set(0, 0.64, -0.27); g.add(bk);
  g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
}

function addBed(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  const fm = new THREE.MeshLambertMaterial({ color: 0x2a1808 });
  const sm = new THREE.MeshLambertMaterial({ color: 0x6070a0 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 2.2), fm); frame.position.set(0, 0.11, 0); g.add(frame);
  const mat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 2.0), sm); mat.position.set(0, 0.32, 0); g.add(mat);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.1), fm); hb.position.set(0, 0.57, -1.0); g.add(hb);
  g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
}

function addBookshelf(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  const w = new THREE.MeshLambertMaterial({ color: 0x3a2810 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.32), w); frame.position.set(0, 1.1, 0); g.add(frame);
  const bColors = [0x8b1a1a, 0x1a4a8b, 0x1a7a2a, 0x7a6a1a, 0x5a1a7a];
  for (let shelf = 0; shelf < 4; shelf++) {
    let bx = -0.55;
    while (bx < 0.55) {
      const bw = 0.04 + Math.random() * 0.08;
      const bh = 0.25 + Math.random() * 0.1;
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.22),
        new THREE.MeshLambertMaterial({ color: bColors[Math.floor(Math.random() * bColors.length)] }));
      book.position.set(bx + bw/2, 0.4 + shelf * 0.45 + bh/2, 0.04); g.add(book);
      bx += bw + 0.004;
    }
  }
  g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
}

// ═══════════════════════════════════════════════════════
// Build interiors for each landmark
// ═══════════════════════════════════════════════════════
function buildInteriors(scene) {
  LANDMARKS.forEach(lm => {
    const { x, z } = landmarkWorldPos(lm);
    const H = lm.height, W = lm.width - 0.8, D = lm.depth - 0.8;

    const floorTypes = { work: 'concrete', school: 'tile', lawyer: 'marble', home: 'wood' };
    const floorGeo = new THREE.PlaneGeometry(W, D);
    const floor = new THREE.Mesh(floorGeo, new THREE.MeshLambertMaterial({ map: makeFloorTex(floorTypes[lm.id] || 'concrete') }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(x, 0.22, z); scene.add(floor);

    const wallColors = { work: 0x444848, school: 0xb0b8a8, lawyer: 0x3a2810, home: 0xd4c8a8 };
    const wallBox = new THREE.Mesh(new THREE.BoxGeometry(W, H, D),
      new THREE.MeshLambertMaterial({ color: wallColors[lm.id] || 0x444848, side: THREE.BackSide }));
    wallBox.position.set(x, H / 2, z); scene.add(wallBox);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D),
      new THREE.MeshLambertMaterial({ color: lm.id === 'home' ? 0xe8e4d8 : 0xc8c8c0 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(x, H - 0.05, z); scene.add(ceil);

    const lc = lm.id === 'home' ? 0xffe8b0 : 0xf0f4ff;
    const pl = new THREE.PointLight(lc, 2.0, Math.max(W, D) * 1.2);
    pl.position.set(x, H - 0.5, z); scene.add(pl);
    const fix = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), new THREE.MeshBasicMaterial({ color: lc }));
    fix.position.set(x, H - 0.1, z); scene.add(fix);

    if (lm.id === 'work') {
      addDesk(scene, x - 2, z + 1, 0); addChair(scene, x - 2, z + 2.2, Math.PI);
      addDesk(scene, x + 2, z + 1, 0); addChair(scene, x + 2, z + 2.2, Math.PI);
      const lkMat = new THREE.MeshLambertMaterial({ color: 0x3a5060 });
      for (let i = 0; i < 4; i++) {
        const lk = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.45), lkMat);
        lk.position.set(x + 4 + i * 0.5, 0.9, z - 4.5); scene.add(lk);
      }
    }
    if (lm.id === 'school') {
      for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
        addDesk(scene, x - 3 + col * 2.4, z - 2.5 + row * 2.8, 0);
        addChair(scene, x - 3 + col * 2.4, z - 2.5 + row * 2.8 + 1.1, Math.PI);
      }
      addDesk(scene, x, z - 4, Math.PI);
      addBookshelf(scene, x + 6, z, Math.PI / 2);
    }
    if (lm.id === 'lawyer') {
      addBookshelf(scene, x - 3.5, z - 3.5, 0); addBookshelf(scene, x - 1.5, z - 3.5, 0);
      addDesk(scene, x, z - 1.5, Math.PI);
      addChair(scene, x, z - 0.2, 0); addChair(scene, x - 0.8, z + 1.5, Math.PI); addChair(scene, x + 0.8, z + 1.5, Math.PI);
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshLambertMaterial({ color: 0x6a1a1a }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(x, 0.23, z); scene.add(rug);
    }
    if (lm.id === 'home') {
      addSofa(scene, x - 1.5, z + 2, Math.PI);
      addBed(scene, x + 2, z - 0.5, Math.PI / 2);
      const tv = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.05), new THREE.MeshLambertMaterial({ color: 0x0a0a0a }));
      tv.position.set(x - 1.5, 1.0, z - 3.5); scene.add(tv);
      const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.62), new THREE.MeshBasicMaterial({ color: 0x050a10 }));
      tvScr.position.set(x - 1.5, 1.0, z - 3.47); scene.add(tvScr);
      const lampLight = new THREE.PointLight(0xffd060, 1.0, 5);
      lampLight.position.set(x + 2, 1.1, z + 1.3); scene.add(lampLight);
    }
  });
}

// ═══════════════════════════════════════════════════════
// Landmark builder (hollow walkable buildings)
// ═══════════════════════════════════════════════════════
const WALL_THICK = 0.4;
const DOOR_W = 2.8;
const DOOR_H = 3.2;

function buildLandmark(scene, lm, buildings) {
  const { x, z } = landmarkWorldPos(lm);
  const { width: W, depth: D, height: H, color, accentColor, doorFace } = lm;
  const hw = W / 2, hd = D / 2;
  const wm = new THREE.MeshLambertMaterial({ color });
  const am = new THREE.MeshLambertMaterial({ color: accentColor });

  function addWall(wx, wy, wz, wW, wH, wD) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(wW, wH, wD), wm);
    m.position.set(wx, wy, wz); scene.add(m);
  }

  // Roof
  scene.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), am), { position: new THREE.Vector3(x, H, z) }));

  // South wall
  if (doorFace === 'south') {
    const sw = (W - DOOR_W) / 2;
    addWall(x - hw + sw / 2, H / 2, z + hd, sw, H, WALL_THICK);
    addWall(x + hw - sw / 2, H / 2, z + hd, sw, H, WALL_THICK);
    addWall(x, H - (H - DOOR_H) / 2, z + hd, DOOR_W, H - DOOR_H, WALL_THICK);
  } else {
    addWall(x, H / 2, z + hd, W, H, WALL_THICK);
  }
  // North wall
  if (doorFace === 'north') {
    const sw = (W - DOOR_W) / 2;
    addWall(x - hw + sw / 2, H / 2, z - hd, sw, H, WALL_THICK);
    addWall(x + hw - sw / 2, H / 2, z - hd, sw, H, WALL_THICK);
    addWall(x, H - (H - DOOR_H) / 2, z - hd, DOOR_W, H - DOOR_H, WALL_THICK);
  } else {
    addWall(x, H / 2, z - hd, W, H, WALL_THICK);
  }
  addWall(x + hw, H / 2, z, WALL_THICK, H, D);
  addWall(x - hw, H / 2, z, WALL_THICK, H, D);

  // Sign above door
  const signMat = new THREE.MeshBasicMaterial({ color: accentColor });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W + 2, 1.0), signMat);
  const signZ = doorFace === 'south' ? z + hd + 0.05 : z - hd - 0.05;
  sign.position.set(x, DOOR_H + 0.7, signZ);
  if (doorFace === 'north') sign.rotation.y = Math.PI;
  scene.add(sign);

  // Accent stripe
  scene.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, D), am), { position: new THREE.Vector3(x, H + 0.6, z) }));

  // Destination ring inside building
  const ringMat = new THREE.MeshBasicMaterial({ color: lm.requiresPhone ? 0x2a5a9a : 0x2a6a2a, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.6, 24), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.25, z); scene.add(ring);

  // Collision AABBs (split around door)
  const doorOffset = doorFace === 'south' ? hd : -hd;
  const sideW = (W - DOOR_W) / 2;
  if (doorFace === 'south' || doorFace === 'north') {
    buildings.push({ x: x - hw + sideW / 2, z: z + doorOffset, halfW: sideW / 2, halfD: 0.5 });
    buildings.push({ x: x + hw - sideW / 2, z: z + doorOffset, halfW: sideW / 2, halfD: 0.5 });
    buildings.push({ x, z: doorFace === 'south' ? z - hd : z + hd, halfW: hw, halfD: 0.5 });
    buildings.push({ x: x + hw, z, halfW: 0.5, halfD: hd });
    buildings.push({ x: x - hw, z, halfW: 0.5, halfD: hd });
  }
}

// ═══════════════════════════════════════════════════════
// Seeded random
// ═══════════════════════════════════════════════════════
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ═══════════════════════════════════════════════════════
// Window canvas texture
// ═══════════════════════════════════════════════════════
function makeWinTex(cols, rows, rand) {
  const cw = cols * 10, ch = rows * 10;
  const cvs = document.createElement('canvas'); cvs.width = cw; cvs.height = ch;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#080f18'; ctx.fillRect(0, 0, cw, ch);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const lit = rand() > 0.42;
      ctx.fillStyle = lit ? '#2a4a70' : '#0b1520';
      ctx.fillRect(c * 10 + 1, r * 10 + 1, 8, 8);
    }
  }
  const tex = new THREE.CanvasTexture(cvs); tex.needsUpdate = true; return tex;
}

// ═══════════════════════════════════════════════════════
// City builder
// ═══════════════════════════════════════════════════════
const buildingGrid = new Map();
const GRID_CELL = 24;
function addToGrid(b) {
  const x0 = Math.floor((b.x - b.halfW - PLAYER_RADIUS) / GRID_CELL);
  const x1 = Math.floor((b.x + b.halfW + PLAYER_RADIUS) / GRID_CELL);
  const z0 = Math.floor((b.z - b.halfD - PLAYER_RADIUS) / GRID_CELL);
  const z1 = Math.floor((b.z + b.halfD + PLAYER_RADIUS) / GRID_CELL);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cz = z0; cz <= z1; cz++) {
      const k = cx * 1000 + cz;
      if (!buildingGrid.has(k)) buildingGrid.set(k, []);
      buildingGrid.get(k).push(b);
    }
  }
}

const _dummy = new THREE.Object3D();
let blinkMeshes = [];

function buildCity(scene) {
  const rand = seededRand(42);
  const buildings = [];

  // Ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(CITY_SIZE * 2, CITY_SIZE * 2),
    new THREE.MeshLambertMaterial({ color: 0x090d14 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // Sidewalks
  const swMat = new THREE.MeshLambertMaterial({ color: 0x111823 });
  for (let bx = -4; bx <= 3; bx++) {
    for (let bz = -4; bz <= 3; bz++) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK_SIZE + 1.5, BLOCK_SIZE + 1.5), swMat);
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(bx * STRIDE + STRIDE / 2, 0.005, bz * STRIDE + STRIDE / 2);
      scene.add(sw);
    }
  }

  // Roads
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x080c12 });
  for (let bx = -4; bx <= 4; bx++) {
    const vr = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, CITY_SIZE * 2), roadMat);
    vr.rotation.x = -Math.PI / 2; vr.position.set(bx * STRIDE, 0.01, 0); scene.add(vr);
    const hr = new THREE.Mesh(new THREE.PlaneGeometry(CITY_SIZE * 2, ROAD_WIDTH), roadMat);
    hr.rotation.x = -Math.PI / 2; hr.position.set(0, 0.01, bx * STRIDE); scene.add(hr);
  }

  // Road dashes (InstancedMesh)
  const dashMat = new THREE.MeshBasicMaterial({ color: 0x2a3a50 });
  const dashCount = 2 * 9 * 17;
  const dashInstV = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.18, 2.2), dashMat, dashCount);
  const dashInstH = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.2, 0.18), dashMat, dashCount);
  dashInstV.rotation.x = dashInstH.rotation.x = -Math.PI / 2;
  let di = 0;
  for (let bx = -4; bx <= 4; bx++) {
    for (let seg = -8; seg <= 8; seg += 2) {
      _dummy.position.set(bx * STRIDE, 0.02, seg * 3); _dummy.updateMatrix();
      dashInstV.setMatrixAt(di, _dummy.matrix);
      dashInstH.setMatrixAt(di, _dummy.matrix);
      di++;
    }
  }
  dashInstV.instanceMatrix.needsUpdate = true; dashInstH.instanceMatrix.needsUpdate = true;
  scene.add(dashInstV); scene.add(dashInstH);

  // Generic buildings
  for (let bx = -4; bx <= 3; bx++) {
    for (let bz = -4; bz <= 3; bz++) {
      if (landmarkBlocks.has(`${bx},${bz}`)) continue;
      const cx = bx * STRIDE + STRIDE / 2;
      const cz = bz * STRIDE + STRIDE / 2;
      const numW = 1 + Math.floor(rand() * 2);
      const numD = 1 + Math.floor(rand() * 2);
      const bwCell = (BLOCK_SIZE - 2) / numW;
      const bdCell = (BLOCK_SIZE - 2) / numD;
      for (let wi = 0; wi < numW; wi++) {
        for (let di2 = 0; di2 < numD; di2++) {
          const bWidth  = bwCell * (0.55 + rand() * 0.38);
          const bDepth  = bdCell * (0.55 + rand() * 0.38);
          const bHeight = BH_MIN + rand() * (BH_MAX - BH_MIN);
          const px = cx - BLOCK_SIZE / 2 + 1 + wi * bwCell + bwCell / 2;
          const pz = cz - BLOCK_SIZE / 2 + 1 + di2 * bdCell + bdCell / 2;
          const shade = 0.06 + rand() * 0.08;
          const bodyColor = Math.floor(shade * 0.5 * 255) << 16 | Math.floor(shade * 0.65 * 255) << 8 | Math.floor(shade * 255);
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth),
            new THREE.MeshLambertMaterial({ color: bodyColor }));
          mesh.position.set(px, bHeight / 2, pz); scene.add(mesh);

          // Window faces
          ['south','north','east','west'].forEach(face => {
            const isZ = face === 'south' || face === 'north';
            const facePos = face === 'south' ? pz + bDepth/2 + 0.01
              : face === 'north' ? pz - bDepth/2 - 0.01
              : face === 'east' ? px + bWidth/2 + 0.01
              : px - bWidth/2 - 0.01;
            const faceW = isZ ? bWidth : bDepth;
            const cols = Math.max(1, Math.floor(faceW / 2.2));
            const rows = Math.max(1, Math.floor(bHeight / 3));
            const tex = makeWinTex(cols, rows, rand);
            const wm = new THREE.Mesh(new THREE.PlaneGeometry(faceW, bHeight),
              new THREE.MeshBasicMaterial({ map: tex }));
            if (isZ) {
              wm.position.set(px, bHeight / 2, facePos);
              wm.rotation.y = face === 'south' ? Math.PI : 0;
            } else {
              wm.position.set(facePos, bHeight / 2, pz);
              wm.rotation.y = face === 'east' ? Math.PI / 2 : -Math.PI / 2;
            }
            scene.add(wm);
          });

          if (rand() > 0.45) {
            const tMat = new THREE.MeshLambertMaterial({ color: 0x141e2e });
            if (rand() > 0.55) {
              const tH = 1.2 + rand() * 2.2;
              const twr = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, tH, 7), tMat);
              twr.position.set(px + (rand() - 0.5) * bWidth * 0.5, bHeight + tH / 2, pz + (rand() - 0.5) * bDepth * 0.5);
              scene.add(twr);
              const lt = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), new THREE.MeshBasicMaterial({ color: 0xcc2200 }));
              lt.position.set(twr.position.x, bHeight + tH + 0.15, twr.position.z);
              blinkMeshes.push(lt); scene.add(lt);
            }
            const bxH = 0.4 + rand() * 0.9;
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.7 + rand() * 1.4, bxH, 0.5 + rand() * 0.8), tMat);
            box.position.set(px + (rand() - 0.5) * bWidth * 0.5, bHeight + bxH / 2, pz + (rand() - 0.5) * bDepth * 0.5);
            scene.add(box);
          }

          const bEntry = { x: px, z: pz, halfW: bWidth / 2, halfD: bDepth / 2 };
          buildings.push(bEntry); addToGrid(bEntry);
        }
      }
    }
  }

  // Landmark buildings
  LANDMARKS.forEach(lm => buildLandmark(scene, lm, buildings));
  buildings.forEach(b => { if (!buildingGrid.has(Math.floor(b.x / GRID_CELL) * 1000 + Math.floor(b.z / GRID_CELL))) addToGrid(b); });

  // Street lights (InstancedMesh — 2 draw calls instead of 1000+)
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x1a2233 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xb0882a });
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 7, 5);
  const headGeo = new THREE.BoxGeometry(0.6, 0.18, 0.35);
  const lightPositions = [];
  for (let bx = -3; bx <= 3; bx++) {
    for (let bz = -3; bz <= 3; bz++) {
      lightPositions.push(
        { x: bx * STRIDE - ROAD_WIDTH / 2 - 0.6, z: bz * STRIDE - ROAD_WIDTH / 2 - 0.6 },
        { x: bx * STRIDE + ROAD_WIDTH / 2 + 0.6, z: bz * STRIDE + ROAD_WIDTH / 2 + 0.6 },
      );
    }
  }
  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, lightPositions.length);
  const headInst = new THREE.InstancedMesh(headGeo, headMat, lightPositions.length);
  const dm2 = new THREE.Object3D();
  lightPositions.forEach((p, i) => {
    dm2.position.set(p.x, 3.5, p.z); dm2.updateMatrix(); poleInst.setMatrixAt(i, dm2.matrix);
    dm2.position.set(p.x + 1.1, 7.0, p.z); dm2.updateMatrix(); headInst.setMatrixAt(i, dm2.matrix);
  });
  poleInst.instanceMatrix.needsUpdate = true; headInst.instanceMatrix.needsUpdate = true;
  scene.add(poleInst); scene.add(headInst);
  // Just 2 point lights at center
  const lt1 = new THREE.PointLight(0xd4aa44, 1.6, 24); lt1.position.set(-ROAD_WIDTH / 2 - 0.6, 6.8, -ROAD_WIDTH / 2 - 0.6); scene.add(lt1);
  const lt2 = new THREE.PointLight(0xd4aa44, 1.6, 24); lt2.position.set(ROAD_WIDTH / 2 + 0.6, 6.8, ROAD_WIDTH / 2 + 0.6); scene.add(lt2);

  // Interiors
  buildInteriors(scene);

  return buildings;
}

// ═══════════════════════════════════════════════════════
// Three.js setup
// ═══════════════════════════════════════════════════════
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.75;
document.getElementById('renderer-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02060f);
scene.fog = new THREE.FogExp2(0x02060f, 0.016);

scene.add(new THREE.AmbientLight(0x0a1525, 2.5));
const moonLight = new THREE.DirectionalLight(0x4466aa, 0.7);
moonLight.position.set(80, 120, 60); scene.add(moonLight);
const hemiLight = new THREE.HemisphereLight(0x0a1a35, 0x050810, 0.8); scene.add(hemiLight);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════════════════
// ICE agent (improved model from base44)
// ═══════════════════════════════════════════════════════
const ICE_DARK    = new THREE.MeshLambertMaterial({ color: 0x111418 });
const ICE_BLACK   = new THREE.MeshLambertMaterial({ color: 0x07090c });
const ICE_SKIN    = new THREE.MeshLambertMaterial({ color: 0xb08060 });
const ICE_VEST    = new THREE.MeshLambertMaterial({ color: 0x1a2a1a });
const ICE_HELMET  = new THREE.MeshLambertMaterial({ color: 0x0c1010 });
const ICE_BADGE   = new THREE.MeshBasicMaterial({ color: 0xaaccff });
const ICE_EYE     = new THREE.MeshBasicMaterial({ color: 0xff2200 });
const LEG_GEO     = new THREE.BoxGeometry(0.22, 0.75, 0.22);
const BOOT_GEO    = new THREE.BoxGeometry(0.24, 0.18, 0.28);
const TORSO_GEO   = new THREE.BoxGeometry(0.48, 0.65, 0.28);
const VEST_GEO    = new THREE.BoxGeometry(0.50, 0.50, 0.14);
const BELT_GEO    = new THREE.BoxGeometry(0.50, 0.1, 0.30);
const ARM_GEO     = new THREE.BoxGeometry(0.18, 0.60, 0.18);
const HEAD_GEO    = new THREE.BoxGeometry(0.32, 0.32, 0.30);
const HELM_GEO    = new THREE.BoxGeometry(0.36, 0.22, 0.34);
const EYE_GEO     = new THREE.SphereGeometry(0.04, 4, 4);

function spawnIce(scene, player, icePool) {
  const g = new THREE.Group();
  const lLeg = new THREE.Mesh(LEG_GEO, ICE_DARK); lLeg.position.set(-0.13, 0.375, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(LEG_GEO, ICE_DARK); rLeg.position.set(0.13, 0.375, 0); g.add(rLeg);
  const lBoot = new THREE.Mesh(BOOT_GEO, ICE_BLACK); lBoot.position.set(-0.13, 0.09, 0.03); g.add(lBoot);
  const rBoot = new THREE.Mesh(BOOT_GEO, ICE_BLACK); rBoot.position.set(0.13, 0.09, 0.03); g.add(rBoot);
  const torso = new THREE.Mesh(TORSO_GEO, ICE_DARK); torso.position.set(0, 1.12, 0); g.add(torso);
  const vest = new THREE.Mesh(VEST_GEO, ICE_VEST); vest.position.set(0, 1.18, 0.12); g.add(vest);
  const belt = new THREE.Mesh(BELT_GEO, ICE_BLACK); belt.position.set(0, 0.78, 0); g.add(belt);
  const lArm = new THREE.Mesh(ARM_GEO, ICE_DARK); lArm.position.set(-0.36, 1.08, 0); g.add(lArm);
  const rArm = new THREE.Mesh(ARM_GEO, ICE_DARK); rArm.position.set(0.36, 1.08, 0); g.add(rArm);
  const head = new THREE.Mesh(HEAD_GEO, ICE_SKIN); head.position.set(0, 1.76, 0); g.add(head);
  const helm = new THREE.Mesh(HELM_GEO, ICE_HELMET); helm.position.set(0, 1.90, 0); g.add(helm);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.06, 0.02), ICE_BADGE); badge.position.set(-0.12, 1.28, 0.20); g.add(badge);
  const eyeL = new THREE.Mesh(EYE_GEO, ICE_EYE); eyeL.position.set(-0.07, 1.72, 0.16); g.add(eyeL);
  const eyeR = new THREE.Mesh(EYE_GEO, ICE_EYE); eyeR.position.set(0.07, 1.72, 0.16); g.add(eyeR);

  const angle = Math.random() * Math.PI * 2;
  const d = 30 + Math.random() * 25;
  g.position.set(player.x + Math.cos(angle) * d, 0, player.z + Math.sin(angle) * d);
  scene.add(g);

  icePool.push({
    group: g, lLeg, rLeg, lArm, rArm,
    speed: ICE_SPEED + Math.random() * 0.015,
    fleeing: false, fleeTimer: 0, chasing: false, legPhase: Math.random() * Math.PI * 2,
    patrolTarget: { x: (Math.floor(Math.random() * 9) - 4) * STRIDE, z: (Math.floor(Math.random() * 9) - 4) * STRIDE },
    patrolTimer: 4 + Math.random() * 6,
  });
}

// ═══════════════════════════════════════════════════════
// Collision
// ═══════════════════════════════════════════════════════
function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2); }
function dist2DSq(a, b) { return (a.x - b.x) ** 2 + (a.z - b.z) ** 2; }

function collidesWithBuildings(nx, nz) {
  const cx = Math.floor(nx / GRID_CELL), cz = Math.floor(nz / GRID_CELL);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const cell = buildingGrid.get((cx + dx) * 1000 + (cz + dz));
      if (!cell) continue;
      for (const b of cell) {
        if (Math.abs(nx - b.x) < b.halfW + PLAYER_RADIUS &&
            Math.abs(nz - b.z) < b.halfD + PLAYER_RADIUS) return true;
      }
    }
  }
  return false;
}

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
const player = { x: 0, z: 4, yaw: 0, pitch: 0, camHeight: PLAYER_HEIGHT };
const keys = {};
const mouse = { lastX: null, lastY: null, locked: false };

// Inside landmark detection
function getLandmarkInside(px, pz) {
  for (const lm of LANDMARKS) {
    const pos = landmarkWorldPos(lm);
    if (Math.abs(px - pos.x) < lm.width / 2 - 0.4 &&
        Math.abs(pz - pos.z) < lm.depth / 2 - 0.4) return lm;
  }
  return null;
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

function flashMsg(text, dur) {
  if (!gameState) return;
  gameState.lastMsg = text; gameState.lastMsgTimer = dur;
}

function dropPhone() {
  if (!gameState || !gameState.hasPhone) return;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x1a2a1a }));
  mesh.position.set(player.x, 0.25, player.z);
  mesh.rotation.y = Math.random() * Math.PI; scene.add(mesh);
  gameState.hasPhone = false; gameState.signal = 0;
  iceAgents.forEach(a => { a.fleeing = true; a.fleeTimer = 12; a.chasing = false; });
  flashMsg('Phone dropped. ICE lost your signal.', 4);
  updatePhoneStatus();
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
  if (e.code === 'Space' && STATE === 'PLAYING') { dropPhone(); return; }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('click', () => {
  audio.start();
  if (STATE === 'TITLE')  { showIntro(); return; }
  if (STATE === 'INTRO')  { startGame(); return; }
  if (STATE === 'ENDED' && restartEnabled) { resetGame(); return; }
  if (STATE === 'PLAYING') { try { canvas.requestPointerLock(); } catch (_) {} }
});
document.addEventListener('pointerlockchange', () => { mouse.locked = document.pointerLockElement === canvas; });
document.addEventListener('mousemove', e => {
  if (!mouse.locked) return;
  player.yaw   -= e.movementX * 0.006;
  player.pitch  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.pitch - e.movementY * 0.006));
});
canvas.addEventListener('mousemove', e => {
  if (mouse.locked) return;
  if (mouse.lastX !== null) {
    player.yaw  -= (e.clientX - mouse.lastX) * 0.006;
    player.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, player.pitch - (e.clientY - mouse.lastY) * 0.006));
  }
  mouse.lastX = e.clientX; mouse.lastY = e.clientY;
});
canvas.addEventListener('mouseleave', () => { mouse.lastX = null; mouse.lastY = null; });

// Touch controls
let lastTouchX = null;
canvas.addEventListener('touchstart', e => { lastTouchX = e.touches[0].clientX; audio.start(); });
canvas.addEventListener('touchmove', e => {
  if (lastTouchX !== null) { player.yaw -= (e.touches[0].clientX - lastTouchX) * 0.004; lastTouchX = e.touches[0].clientX; }
});

// ═══════════════════════════════════════════════════════
// Screen helpers
// ═══════════════════════════════════════════════════════
function showScreen(id) {
  ['title-screen','intro-screen','end-screen'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  document.getElementById('hud').classList.toggle('hidden', id !== null);
}

function fadeOut(cb) {
  const el = document.getElementById('fade');
  el.style.transition = 'opacity 0.45s'; el.style.opacity = '1';
  setTimeout(cb, 470);
}
function fadeIn() {
  const el = document.getElementById('fade');
  el.style.transition = 'opacity 0.5s'; el.style.opacity = '0';
}

// ═══════════════════════════════════════════════════════
// Title / Intro
// ═══════════════════════════════════════════════════════
function animateTitle() {
  setTimeout(() => { document.getElementById('title-text').style.opacity = '1'; }, 300);
  setTimeout(() => { const l = document.getElementById('title-line'); l.style.opacity = '1'; l.style.transform = 'scaleX(1)'; }, 800);
  setTimeout(() => { document.getElementById('title-subtitle').style.opacity = '1'; }, 1200);
  setTimeout(() => { document.getElementById('title-prompt').style.opacity = '1'; }, 2500);
}

function showIntro() {
  if (STATE !== 'TITLE') return;
  STATE = 'INTRO'; showScreen('intro-screen');
  setTimeout(() => { document.getElementById('intro-line1').style.opacity = '1'; }, 300);
  setTimeout(() => { document.getElementById('intro-line2').style.opacity = '1'; }, 1600);
  setTimeout(() => { document.getElementById('intro-line3').style.opacity = '1'; }, 3200);
  setTimeout(() => { document.getElementById('intro-prompt').style.opacity = '1'; }, 4800);
}

// ═══════════════════════════════════════════════════════
// HUD — cached DOM elements
// ═══════════════════════════════════════════════════════
const HUD = {};
function cacheHUD() {
  ['signal-fill','signal-value','ice-warning','ice-border','status-mode',
   'interact-prompt','interact-text','objective','obj-label','obj-sublabel','obj-desc',
   'obj-need-phone','msg-flash','msg-text','vignette','chromatic-border',
   'phone-dot','phone-label','phone-hint','minimap-canvas','inside-indicator','inside-label',
  ].forEach(id => { HUD[id] = document.getElementById(id); });
}

const destDots = [], destLabels = [];
function buildDestList() {
  const wrap = document.getElementById('dest-wrap');
  wrap.innerHTML = ''; destDots.length = 0; destLabels.length = 0;
  DESTINATIONS.forEach((d, i) => {
    const item = document.createElement('div'); item.className = 'dest-item';
    const dot = document.createElement('div'); dot.className = 'dest-dot'; dot.id = `dd${i}`;
    const lbl = document.createElement('span'); lbl.className = 'dest-lbl'; lbl.id = `dl${i}`; lbl.textContent = d.sublabel;
    item.appendChild(dot); item.appendChild(lbl); wrap.appendChild(item);
    destDots.push(dot); destLabels.push(lbl);
  });
}

function updatePhoneStatus() {
  if (!HUD['phone-dot']) return;
  HUD['phone-dot'].style.background = gameState?.hasPhone ? '#22aa22' : 'rgba(255,255,255,0.1)';
  HUD['phone-label'].textContent    = gameState?.hasPhone ? 'PHONE ACTIVE' : 'NO PHONE';
  HUD['phone-hint'].textContent     = gameState?.hasPhone ? 'SPACE = discard phone' : '';
}

function updateHUD(isSprinting, isCrouching, insideLm) {
  const s = gameState; if (!s) return;
  const pct = s.signal / SIGNAL_MAX * 100;

  HUD['signal-fill'].style.width = pct + '%';
  HUD['signal-fill'].style.background = pct > 80 ? 'linear-gradient(90deg,#880a04,#dd2211)'
    : pct > 50 ? 'linear-gradient(90deg,#551508,#882010)'
    : 'linear-gradient(90deg,#2a1808,#441c0c)';
  HUD['signal-value'].textContent = s.hasPhone ? Math.round(pct) + '%' : 'NO DEVICE';

  const iceNear = iceAgents.some(a => !a.fleeing && dist2DSq({ x: a.group.position.x, z: a.group.position.z }, player) < 144);
  HUD['ice-warning'].textContent = iceNear ? '⚠ ICE AGENT NEARBY' : (pct > 80 ? 'LOCATION ACTIVELY BROADCAST' : '');
  HUD['ice-warning'].style.color = iceNear ? 'rgba(200,50,50,0.9)' : 'rgba(200,120,50,0.7)';
  HUD['ice-border'].style.borderColor = iceNear ? 'rgba(180,20,10,0.35)' : 'rgba(180,0,0,0)';

  // Chromatic aberration at high signal
  if (HUD['chromatic-border']) {
    HUD['chromatic-border'].style.boxShadow = pct > 60
      ? `inset 0 0 ${40 + pct}px rgba(180,0,0,${((pct - 60) / 350).toFixed(3)})`
      : 'none';
  }

  HUD['status-mode'].textContent = isSprinting ? '▶▶ SPRINT' : isCrouching ? '▼ CROUCH' : '';
  HUD['status-mode'].style.color = isSprinting ? 'rgba(200,160,50,0.8)' : 'rgba(80,180,120,0.8)';

  // Inside indicator
  if (HUD['inside-indicator'] && HUD['inside-label']) {
    if (insideLm) {
      HUD['inside-indicator'].style.opacity = '1';
      HUD['inside-label'].textContent = insideLm.sublabel;
    } else {
      HUD['inside-indicator'].style.opacity = '0';
    }
  }

  const cd = s.destStates[s.currentDestIndex];
  if (cd && !cd.visited && !insideLm) {
    HUD['objective'].style.display = 'block';
    HUD['obj-label'].textContent    = cd.label;
    HUD['obj-sublabel'].textContent = cd.sublabel;
    HUD['obj-desc'].textContent     = cd.desc;
    HUD['obj-need-phone'].textContent = (cd.requiresPhone && !s.hasPhone) ? '⚠ Requires phone' : '';
  } else {
    HUD['objective'].style.display = 'none';
  }

  s.destStates.forEach((d, i) => {
    const dot = destDots[i], lbl = destLabels[i]; if (!dot) return;
    if (d.visited) {
      dot.style.background = d.failed ? '#bb2211' : '#226622';
      lbl.style.color = d.failed ? 'rgba(180,40,40,0.5)' : 'rgba(50,160,50,0.5)';
      lbl.style.textDecoration = 'line-through';
    } else if (i === s.currentDestIndex) {
      dot.style.background = '#5599ff'; lbl.style.color = 'rgba(255,255,255,0.9)'; lbl.style.textDecoration = 'none';
    } else {
      dot.style.background = 'rgba(255,255,255,0.1)'; lbl.style.color = 'rgba(255,255,255,0.15)'; lbl.style.textDecoration = 'none';
    }
  });

  if (s.lastMsgTimer > 0) {
    HUD['msg-text'].textContent = s.lastMsg; HUD['msg-flash'].style.opacity = '1';
  } else {
    HUD['msg-flash'].style.opacity = '0';
  }

  const vigAlpha = (0.3 + pct / 180).toFixed(2);
  HUD['vignette'].style.background =
    `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${vigAlpha}) 100%)`;

  updateMinimap(s, insideLm);
}

function updateMinimap(s, insideLm) {
  const mc = HUD['minimap-canvas']; if (!mc) return;
  const ctx = mc.getContext('2d');
  const sz = 130, sc = sz / 190, cx = sz / 2, cy = sz / 2;
  ctx.clearRect(0, 0, sz, sz);

  // Landmark outlines
  LANDMARKS.forEach(lm => {
    const pos = landmarkWorldPos(lm);
    const mw = (lm.width / 190) * sz, md = (lm.depth / 190) * sz;
    const mx = cx + pos.x * sc, mz = cy + pos.z * sc;
    ctx.strokeStyle = lm.id === 'home' ? '#aa7700' : lm.id === 'school' ? '#227722' : lm.id === 'work' ? '#224488' : '#662211';
    ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    ctx.strokeRect(mx - mw / 2, mz - md / 2, mw, md);
    ctx.globalAlpha = 1;
  });

  s.destStates.forEach((d, i) => {
    const p = { x: cx + d.x * sc, y: cy + d.z * sc };
    const isActive = i === s.currentDestIndex && !d.visited;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = d.visited ? (d.failed ? '#bb2211' : '#226622') : (isActive ? '#55aaff' : '#223355');
    ctx.fill();
  });

  iceAgents.forEach(a => {
    if (a.fleeing) return;
    const p = { x: cx + a.group.position.x * sc, y: cy + a.group.position.z * sc };
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = a.chasing ? '#ff2200' : '#aa1100'; ctx.fill();
  });

  const ppx = cx + player.x * sc, ppy = cy + player.z * sc;
  ctx.beginPath(); ctx.arc(ppx, ppy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(ppx, ppy);
  ctx.lineTo(ppx + Math.sin(-player.yaw) * 11, ppy + Math.cos(-player.yaw) * 11);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
}

// ═══════════════════════════════════════════════════════
// Start game
// ═══════════════════════════════════════════════════════
function startGame() {
  if (STATE !== 'INTRO') return;
  destMeshes.forEach(m => scene.remove(m)); destMeshes = [];
  iceAgents.forEach(a => scene.remove(a.group)); iceAgents = [];
  burnerObjs.forEach(b => scene.remove(b.group)); burnerObjs = [];

  if (!buildings.length) buildings = buildCity(scene);

  // Burner phones
  burnerObjs = BURNER_SPAWNS.map((bp, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.08), new THREE.MeshLambertMaterial({ color: 0x334433 })));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.38), new THREE.MeshBasicMaterial({ color: 0x223322 }));
    scr.position.z = 0.04; g.add(scr);
    const glow = new THREE.PointLight(0x44bb44, 1.2, 4.5); glow.position.y = 0.4; g.add(glow);
    g.position.set(bp.x, 0.85, bp.z); scene.add(g);
    return { group: g, collected: false, id: i, x: bp.x, z: bp.z };
  });

  player.x = 0; player.z = 4; player.yaw = 0; player.pitch = 0; player.camHeight = PLAYER_HEIGHT;
  gameState = {
    hasPhone: true, signal: 0,
    destStates: DESTINATIONS.map(d => ({ ...d, visited: false, failed: false })),
    currentDestIndex: 0, gameOver: false, frame: 0,
    lastMsg: 'Walk into the glowing buildings. SPACE = drop phone.',
    lastMsgTimer: 6,
  };

  spawnCooldown = 0;
  buildDestList(); updatePhoneStatus();
  STATE = 'PLAYING'; showScreen(null);
  const clock = new THREE.Clock(); clock.start();
  if (rafId) cancelAnimationFrame(rafId);

  let headBobPhase = 0;

  function loop() {
    rafId = requestAnimationFrame(loop);
    const delta = Math.min(clock.getDelta(), 0.05);
    const s = gameState;
    if (!s || s.gameOver || STATE !== 'PLAYING') { renderer.render(scene, camera); return; }
    s.frame++;

    const isSprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && !keys['ControlLeft'] && !keys['ControlRight'] && !keys['KeyC'];
    const isCrouching = keys['ControlLeft'] || keys['ControlRight'] || keys['KeyC'];
    let mx = 0, mz = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    { mx -= Math.sin(player.yaw); mz -= Math.cos(player.yaw); }
    if (keys['KeyS'] || keys['ArrowDown'])  { mx += Math.sin(player.yaw); mz += Math.cos(player.yaw); }
    if (keys['KeyA'] || keys['ArrowLeft'])  { mx -= Math.cos(player.yaw); mz += Math.sin(player.yaw); }
    if (keys['KeyD'] || keys['ArrowRight']) { mx += Math.cos(player.yaw); mz -= Math.sin(player.yaw); }

    const isMoving = mx !== 0 || mz !== 0;
    if (isMoving) {
      const len = Math.sqrt(mx * mx + mz * mz);
      const mult = isSprinting ? PLAYER_SPRINT_MULT : isCrouching ? PLAYER_CROUCH_MULT : 1.0;
      const step = PLAYER_SPEED * mult * 60 * delta;
      tryMove(player.x + (mx / len) * step, player.z + (mz / len) * step);
    }

    // Head bob + camera
    const targetH = isCrouching ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
    player.camHeight += (targetH - player.camHeight) * Math.min(1, delta * 12);
    const bobSpeed = isSprinting ? 11 : isCrouching ? 4 : 7;
    const bobAmp   = isSprinting ? 0.08 : isCrouching ? 0.02 : 0.045;
    if (isMoving) headBobPhase += delta * bobSpeed;
    const bobY = isMoving ? Math.sin(headBobPhase) * bobAmp : 0;
    const bobX = isMoving ? Math.sin(headBobPhase * 0.5) * 0.018 : 0;
    camera.position.set(player.x, player.camHeight + bobY, player.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw + bobX;
    camera.rotation.x = player.pitch;

    // Signal
    if (s.hasPhone) {
      const sr = SIGNAL_FILL_BASE * (isSprinting ? 1.6 : isCrouching ? 0.35 : 1.0);
      s.signal = Math.min(SIGNAL_MAX, s.signal + sr * 60 * delta);
    }
    audio.setTension(s.signal / SIGNAL_MAX);

    // ICE spawn
    spawnCooldown -= delta;
    if (s.hasPhone && s.signal >= ICE_SPAWN_THRESHOLD && spawnCooldown <= 0) {
      let active = 0; for (const a of iceAgents) if (!a.fleeing) active++;
      if (active < 5) { spawnIce(scene, player, iceAgents); spawnCooldown = 4.5; }
    }

    // Blink rooftop lights
    if (blinkMeshes.length) {
      const on = Math.floor(s.frame / 32) % 2 === 0;
      for (const m of blinkMeshes) m.visible = on;
    }

    // Inside landmark detection
    const insideLm = getLandmarkInside(player.x, player.z);

    // ICE agents — patrol + chase AI
    const toRemove = [];
    iceAgents.forEach(agent => {
      const ag = agent.group.position;
      const d = dist2D({ x: ag.x, z: ag.z }, player);
      agent.legPhase += delta * 4;
      agent.group.position.y = Math.abs(Math.sin(agent.legPhase)) * 0.05;

      if (agent.fleeing) {
        agent.fleeTimer -= delta;
        if (d > 0.1) { ag.x += ((ag.x - player.x) / d) * ICE_CHASE_SPEED * 60 * delta; ag.z += ((ag.z - player.z) / d) * ICE_CHASE_SPEED * 60 * delta; }
        agent.group.rotation.y = Math.atan2(ag.x - player.x, ag.z - player.z);
        if (agent.fleeTimer <= 0) { scene.remove(agent.group); toRemove.push(agent); }
        return;
      }

      const canSee = d < ICE_DETECT_RANGE || s.signal > 88;
      agent.chasing = canSee;

      if (canSee) {
        if (d > 0.01) {
          const spd = ICE_CHASE_SPEED * 60 * delta;
          ag.x += (player.x - ag.x) / d * spd; ag.z += (player.z - ag.z) / d * spd;
          agent.group.rotation.y = Math.atan2(player.x - ag.x, player.z - ag.z);
        }
      } else {
        // Patrol
        agent.patrolTimer -= delta;
        const pd = dist2D({ x: ag.x, z: ag.z }, agent.patrolTarget);
        if (pd < 2 || agent.patrolTimer <= 0) {
          agent.patrolTarget = { x: (Math.floor(Math.random() * 9) - 4) * STRIDE, z: (Math.floor(Math.random() * 9) - 4) * STRIDE };
          agent.patrolTimer = 5 + Math.random() * 8;
        }
        if (pd > 0.5) {
          const spd = agent.speed * 60 * delta;
          ag.x += (agent.patrolTarget.x - ag.x) / pd * spd; ag.z += (agent.patrolTarget.z - ag.z) / pd * spd;
          agent.group.rotation.y = Math.atan2(agent.patrolTarget.x - ag.x, agent.patrolTarget.z - ag.z);
        }
      }

      // Walking animation
      const swing = Math.sin(agent.legPhase * 2) * 0.35;
      agent.lLeg.rotation.x = swing; agent.rLeg.rotation.x = -swing;
      agent.lArm.rotation.x = -swing * 0.6; agent.rArm.rotation.x = swing * 0.6;

      if (!s.gameOver && d < ICE_CATCH_RANGE && !insideLm) {
        s.gameOver = true; enterEnding('caught');
      }
    });
    toRemove.forEach(a => iceAgents.splice(iceAgents.indexOf(a), 1));

    // Burner phones
    burnerObjs.forEach(bp => {
      if (bp.collected) return;
      bp.group.position.y = 0.85 + Math.sin(s.frame * 0.04 + bp.id) * 0.12;
      bp.group.rotation.y += delta * 1.8;
      if (!s.hasPhone && dist2DSq({ x: bp.group.position.x, z: bp.group.position.z }, player) < 4) {
        bp.collected = true; bp.group.visible = false;
        s.hasPhone = true; s.signal = 5;
        flashMsg('Burner phone picked up. Signal restarting.', 3);
        updatePhoneStatus();
      }
    });

    // Destination check — walk into building
    const cd = s.destStates[s.currentDestIndex];
    if (cd && !cd.visited && insideLm && insideLm.id === cd.id) {
      if (cd.requiresPhone && !s.hasPhone) {
        cd.failed = true; cd.visited = true;
        flashMsg(`${insideLm.sublabel}: access denied — no phone`, 4);
      } else {
        cd.visited = true;
        flashMsg(`${insideLm.sublabel} ✓`, 3);
        if (insideLm.fact) setTimeout(() => flashMsg(insideLm.fact, 7), 3500);
      }
      if (cd.id === 'home') {
        s.gameOver = true;
        setTimeout(() => enterEnding(s.hasPhone ? 'home_phone' : 'home_no_phone'), 1500);
      } else {
        s.currentDestIndex++;
        const fact = GAMEPLAY_FACTS[Math.floor(Math.random() * GAMEPLAY_FACTS.length)];
        setTimeout(() => flashMsg(fact, 6), 4000);
      }
    }

    // Atmosphere
    const sr = s.signal / SIGNAL_MAX;
    scene.fog.color.setRGB(0.008 + sr * 0.06, 0.024 + sr * 0.006, 0.06 - sr * 0.03);
    scene.background.setRGB((0.008 + sr * 0.06) * 0.3, (0.024 + sr * 0.006) * 0.3, (0.06 - sr * 0.03) * 0.3);
    hemiLight.color.setRGB(0.04 + sr * 0.08, 0.10 + sr * 0.02, 0.21 - sr * 0.06);
    moonLight.intensity = 0.7 - sr * 0.3;

    if (s.lastMsgTimer > 0) s.lastMsgTimer -= delta;

    renderer.render(scene, camera);
    if (s.frame % 10 === 0) updateHUD(isSprinting, isCrouching, insideLm);
  }

  loop();
}

// ═══════════════════════════════════════════════════════
// Endings
// ═══════════════════════════════════════════════════════
function enterEnding(type) {
  STATE = 'ENDED'; restartEnabled = false;
  audio.setTension(0);
  const lines = ENDINGS[type];
  const linesDiv = document.getElementById('end-lines');
  linesDiv.innerHTML = '';
  const footer = document.getElementById('end-footer');
  const restart = document.getElementById('end-restart');
  footer.style.opacity = '0'; restart.style.opacity = '0';
  lines.forEach(line => {
    const p = document.createElement('p'); p.className = 'end-line'; p.textContent = line.text;
    linesDiv.appendChild(p);
    setTimeout(() => { p.style.opacity = '1'; }, line.delay);
  });
  const lastDelay = lines[lines.length - 1].delay;
  setTimeout(() => { footer.style.opacity = '1'; }, lastDelay + 2000);
  setTimeout(() => { restartEnabled = true; restart.style.opacity = '1'; }, lastDelay + 3500);
  showScreen('end-screen');
  document.getElementById('end-restart-btn').onclick = () => { if (restartEnabled) resetGame(); };
}

// ═══════════════════════════════════════════════════════
// Reset
// ═══════════════════════════════════════════════════════
function resetGame() {
  iceAgents.forEach(a => scene.remove(a.group)); iceAgents = [];
  burnerObjs.forEach(b => scene.remove(b.group)); burnerObjs = [];
  gameState = null; restartEnabled = false;
  ['title-text','title-subtitle','title-line','title-prompt'].forEach(id => {
    const el = document.getElementById(id); el.style.opacity = '0';
    if (id === 'title-line') el.style.transform = 'scaleX(0)';
  });
  ['intro-line1','intro-line2','intro-line3','intro-prompt'].forEach(id => {
    document.getElementById(id).style.opacity = '0';
  });
  STATE = 'TITLE'; showScreen('title-screen');
  setTimeout(animateTitle, 100);
}

// ═══════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════
window.addEventListener('load', () => {
  cacheHUD();
  showScreen('title-screen');
  animateTitle();
  (function idleLoop() {
    requestAnimationFrame(idleLoop);
    if (STATE !== 'PLAYING') renderer.render(scene, camera);
  })();
});
