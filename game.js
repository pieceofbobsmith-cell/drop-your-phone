import * as THREE from './three.module.min.js';

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════
const PLAYER_SPEED        = 0.13;
const SPRINT_SPEED        = 0.25;
const CROUCH_SPEED        = 0.065;
const PLAYER_HEIGHT       = 1.72;
const CROUCH_HEIGHT       = 1.05;
const PLAYER_RADIUS       = 0.42;
const ICE_SPEED           = 0.040;
const ICE_CHASE_SPEED     = 0.068;
const ICE_DETECT_RANGE    = 20;
const ICE_DETECT_CROUCH   = 10;
const ICE_CATCH_RANGE     = 1.3;
const SIGNAL_MAX          = 100;
const SIGNAL_FILL_BASE    = 0.022;
const SIGNAL_SPRINT_MULT  = 1.6;
const SIGNAL_CROUCH_MULT  = 0.35;
const ICE_SPAWN_THRESHOLD = 42;
const DEST_RANGE          = 3.5;
const CITY_SIZE           = 180;
const BLOCK_SIZE          = 20;
const ROAD_WIDTH          = 8;
const BH_MIN              = 8;
const BH_MAX              = 44;

// ═══════════════════════════════════════════════════════
// Destinations & narrative
// ═══════════════════════════════════════════════════════
const DESTINATIONS = [
  {
    id: 'work', label: 'Work', x: 30, z: 30,
    desc: 'Clock in. The rent is due.',
    requiresPhone: true,
    interiorTitle: 'WORKPLACE',
    interiorTask: 'Clock in for your shift.',
    interiorFact: 'In 2021, ICE spent $22.1 million on data broker contracts — including employee records sold by LexisNexis Risk Solutions without worker consent.',
  },
  {
    id: 'school', label: 'School', x: -40, z: 20,
    desc: 'Pick up your sister.',
    requiresPhone: false,
    interiorTitle: 'PUBLIC SCHOOL',
    interiorTask: 'Sign your sister out at the front office.',
    interiorFact: 'At least 13 school districts have sold student data to third parties. Under the "third-party doctrine," data shared with any company loses Fourth Amendment protection.',
  },
  {
    id: 'lawyer', label: 'Immigration Attorney', x: -35, z: -40,
    desc: 'Sign the DACA renewal papers.',
    requiresPhone: false,
    interiorTitle: 'IMMIGRATION LAW OFFICE',
    interiorTask: 'Sign your DACA renewal application.',
    interiorFact: 'Fog Data Science sold geofence data to ICE covering mosques, immigration courts, and legal aid offices — without warrants — for as little as $7,000/year.',
  },
  {
    id: 'home', label: 'Home', x: 35, z: -35,
    desc: 'Get home.',
    requiresPhone: false,
    interiorTitle: 'HOME',
    interiorTask: '',
    interiorFact: '',
  },
];

const BURNER_SPAWNS = [
  { x: -15, z: 10 }, { x: 22, z: -18 }, { x: -8, z: -30 },
];

const ENDINGS = {
  caught: [
    { text: 'They had your signal the whole time.', delay: 500 },
    { text: 'Venntel — a data broker — sold your location to ICE.', delay: 2000 },
    { text: 'They paid $23 for the coordinate that ended your day.', delay: 3800 },
    { text: 'No warrant. No judge. No notice.', delay: 5500 },
    { text: 'This is legal in all 50 states.', delay: 7200 },
  ],
  home_phone: [
    { text: 'You made it home.', delay: 500 },
    { text: 'But your phone never stopped transmitting.', delay: 2000 },
    { text: 'Your morning commute. Your sister\'s school. Your lawyer\'s address.', delay: 3800 },
    { text: 'All of it — sold to a government database tonight.', delay: 5700 },
    { text: 'ICE now has a map of everyone you love.', delay: 7500 },
    { text: 'Tomorrow, they\'ll use it.', delay: 9000 },
  ],
  home_no_phone: [
    { text: 'You made it home.', delay: 500 },
    { text: 'No phone. No signal. No data trail.', delay: 2000 },
    { text: 'Tonight, you are invisible.', delay: 3200 },
    { text: '', delay: 4500 },
    { text: '107 data broker companies are still selling your neighbors.', delay: 5000 },
    { text: 'Babel Street. Venntel. LexisNexis. Acxiom.', delay: 6800 },
    { text: 'Opt out. Help others opt out.', delay: 8300 },
    { text: 'Invisibility should not require sacrifice.', delay: 9800 },
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
  let oscLow, oscMid, gainLow, gainMid, masterGain, noiseGain, noiseSource;

  function start() {
    if (started) return;
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain(); masterGain.gain.value = 0.18; masterGain.connect(ctx.destination);
    gainLow = ctx.createGain(); gainLow.gain.value = 0.5;
    gainMid = ctx.createGain(); gainMid.gain.value = 0;
    noiseGain = ctx.createGain(); noiseGain.gain.value = 0;
    oscLow = ctx.createOscillator(); oscLow.type = 'sine'; oscLow.frequency.value = 55;
    oscMid = ctx.createOscillator(); oscMid.type = 'triangle'; oscMid.frequency.value = 82.4;
    oscLow.connect(gainLow); gainLow.connect(masterGain);
    oscMid.connect(gainMid); gainMid.connect(masterGain);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseSource = ctx.createBufferSource(); noiseSource.buffer = buf; noiseSource.loop = true;
    noiseSource.connect(noiseGain); noiseGain.connect(masterGain);
    oscLow.start(); oscMid.start(); noiseSource.start();
  }

  function setTension(t) {
    if (!ctx) return;
    const now = ctx.currentTime;
    gainLow.gain.linearRampToValueAtTime(0.3 + t * 0.7, now + 0.3);
    gainMid.gain.linearRampToValueAtTime(t * 0.4, now + 0.3);
    noiseGain.gain.linearRampToValueAtTime(t * 0.08, now + 0.3);
    oscMid.frequency.linearRampToValueAtTime(82.4 + t * 40, now + 0.3);
  }

  return { start, setTension };
})();

// ═══════════════════════════════════════════════════════
// Building materials (canvas-textured, shared)
// ═══════════════════════════════════════════════════════
const BMAT_SIDES = [];
const BMAT_ROOFS = [];

function initBuildingMaterials() {
  const palettes = [
    { wall: [13,20,32], win: [42,70,108] },
    { wall: [10,14,10], win: [22,52,32]  },
    { wall: [18,14,10], win: [56,40,18]  },
    { wall: [12,10,20], win: [38,26,72]  },
    { wall: [16,16,22], win: [44,44,70]  },
    { wall: [22,20,14], win: [60,52,24]  },
  ];

  palettes.forEach(({ wall: w, win: wn }) => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = `rgb(${w[0]},${w[1]},${w[2]})`;
    ctx.fillRect(0, 0, 128, 512);

    // Horizontal floor lines
    ctx.strokeStyle = `rgba(0,0,0,0.5)`;
    ctx.lineWidth = 1;
    for (let y = 0; y < 512; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(128,y); ctx.stroke(); }

    // Windows (3 cols × 12 rows)
    const cols = 3, colW = 128 / cols, rowH = 40;
    for (let col = 0; col < cols; col++) {
      for (let row = 1; row < 12; row++) {
        const lit = Math.random() > 0.32;
        const warm = lit && Math.random() > 0.55;
        ctx.globalAlpha = lit ? 0.9 : 0.7;
        ctx.fillStyle = lit
          ? (warm ? `rgb(${wn[0]+18},${Math.min(255,wn[1]+8)},${Math.max(0,wn[2]-18)})` : `rgb(${wn[0]},${wn[1]},${wn[2]})`)
          : `rgb(6,9,14)`;
        ctx.fillRect(col * colW + 5, row * rowH + 5, colW - 10, rowH - 8);
      }
    }
    ctx.globalAlpha = 1;

    // Ground floor dark + door
    ctx.fillStyle = `rgba(0,0,0,0.55)`;
    ctx.fillRect(0, 512 - 44, 128, 44);
    ctx.fillStyle = `rgba(${wn[0]},${wn[1]},${wn[2]},0.35)`;
    ctx.fillRect(44, 512 - 40, 40, 40);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    BMAT_SIDES.push(new THREE.MeshLambertMaterial({ map: tex }));
    BMAT_ROOFS.push(new THREE.MeshLambertMaterial({ color: new THREE.Color(w[0]/255, w[1]/255, w[2]/255).multiplyScalar(1.3) }));
  });
}

// ═══════════════════════════════════════════════════════
// City builder — performance-first (InstancedMesh for windows)
// ═══════════════════════════════════════════════════════
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const MAX_WIN = 8000;
const winGeoLit  = new THREE.PlaneGeometry(0.55, 0.75);
const winGeoOff  = new THREE.PlaneGeometry(0.55, 0.75);
let winInstLit, winInstOff, winLitCount = 0, winOffCount = 0;
const _dummy = new THREE.Object3D();

function buildCity(scene) {
  const rand = seededRand(42);
  const buildings = [];
  const stride = BLOCK_SIZE + ROAD_WIDTH;

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY_SIZE * 2.2, CITY_SIZE * 2.2),
    new THREE.MeshLambertMaterial({ color: 0x0b0f14 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Road surface (merged into 2 large planes)
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x0e131a });
  for (let bx = -5; bx <= 5; bx++) {
    const vr = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, CITY_SIZE * 2), roadMat);
    vr.rotation.x = -Math.PI / 2; vr.position.set(bx * stride, 0.01, 0); scene.add(vr);
    const hr = new THREE.Mesh(new THREE.PlaneGeometry(CITY_SIZE * 2, ROAD_WIDTH), roadMat);
    hr.rotation.x = -Math.PI / 2; hr.position.set(0, 0.01, bx * stride); scene.add(hr);
  }

  // Road dashes (single InstancedMesh)
  const dashGeo = new THREE.PlaneGeometry(0.18, 2.2);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0x1e2e3e });
  const dashCount = 5 * 20;
  const dashInst = new THREE.InstancedMesh(dashGeo, dashMat, dashCount * 2);
  dashInst.rotation.x = -Math.PI / 2;
  let di = 0;
  for (let bx = -4; bx <= 4; bx++) {
    for (let seg = -10; seg <= 10; seg += 2) {
      _dummy.position.set(bx * stride, 0.025, seg * 2.6);
      _dummy.rotation.set(-Math.PI / 2, 0, 0); _dummy.updateMatrix();
      if (di < dashCount * 2) dashInst.setMatrixAt(di++, _dummy.matrix);
      _dummy.position.set(seg * 2.6, 0.025, bx * stride);
      _dummy.rotation.set(-Math.PI / 2, 0, Math.PI / 2); _dummy.updateMatrix();
      if (di < dashCount * 2) dashInst.setMatrixAt(di++, _dummy.matrix);
    }
  }
  dashInst.instanceMatrix.needsUpdate = true;
  scene.add(dashInst);

  // Window instances (one draw call each for lit/off windows)
  winInstLit = new THREE.InstancedMesh(winGeoLit, new THREE.MeshBasicMaterial({ color: 0x3a5a82 }), MAX_WIN);
  winInstOff = new THREE.InstancedMesh(winGeoOff, new THREE.MeshBasicMaterial({ color: 0x080d14 }), MAX_WIN);
  winInstLit.count = 0; winInstOff.count = 0;
  winLitCount = 0; winOffCount = 0;
  scene.add(winInstLit); scene.add(winInstOff);

  // Buildings
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
          const bWidth  = bwCell * (0.55 + rand() * 0.38);
          const bDepth  = bdCell * (0.55 + rand() * 0.38);
          const bHeight = BH_MIN + rand() * (BH_MAX - BH_MIN);

          const px = cx - BLOCK_SIZE / 2 + 1 + wi * bwCell + bwCell / 2;
          const pz = cz - BLOCK_SIZE / 2 + 1 + di * bdCell + bdCell / 2;

          const matIdx = Math.floor(rand() * BMAT_SIDES.length);
          const sideMat = BMAT_SIDES[matIdx];
          const roofMat = BMAT_ROOFS[matIdx];

          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(bWidth, bHeight, bDepth),
            [sideMat, sideMat, roofMat, sideMat, sideMat, sideMat]
          );
          mesh.position.set(px, bHeight / 2, pz);
          scene.add(mesh);
          const bEntry = { x: px, z: pz, halfW: bWidth / 2, halfD: bDepth / 2, h: bHeight };
          buildings.push(bEntry);
          addToGrid(bEntry);

          addWindowInstances(px, bHeight, pz, bWidth, bDepth, rand);
          if (rand() > 0.55) addRooftopDetail(scene, px, bHeight, pz, bWidth, bDepth, rand);
        }
      }
    }
  }

  winInstLit.count = winLitCount; winInstLit.instanceMatrix.needsUpdate = true;
  winInstOff.count = winOffCount; winInstOff.instanceMatrix.needsUpdate = true;

  // Destination marker buildings (taller, colored roof accent)
  addDestinationMarkers(scene, buildings);

  addStreetLights(scene, stride);
  return buildings;
}

function addWindowInstances(bx, bh, bz, bw, bd, rand) {
  const colsX = Math.max(1, Math.floor(bw / 1.5));
  const rowsY = Math.floor(bh / 2.2);

  // Front and back faces
  for (const fz of [bz - bd / 2 - 0.06, bz + bd / 2 + 0.06]) {
    const rotY = fz < bz ? Math.PI : 0;
    for (let c = 0; c < colsX; c++) {
      for (let r = 1; r < rowsY; r++) {
        if (winLitCount + winOffCount >= MAX_WIN - 10) return;
        const wx = bx - bw / 2 + (c + 0.5) * (bw / colsX);
        const wy = r * 2.2 + 1;
        const lit = rand() > 0.3;
        _dummy.position.set(wx, wy, fz);
        _dummy.rotation.set(0, rotY, 0); _dummy.updateMatrix();
        if (lit) { winInstLit.setMatrixAt(winLitCount++, _dummy.matrix); }
        else     { winInstOff.setMatrixAt(winOffCount++, _dummy.matrix); }
      }
    }
  }

  // Side faces
  const colsZ = Math.max(1, Math.floor(bd / 1.5));
  for (const fx of [bx - bw / 2 - 0.06, bx + bw / 2 + 0.06]) {
    const rotY = fx < bx ? -Math.PI / 2 : Math.PI / 2;
    for (let c = 0; c < colsZ; c++) {
      for (let r = 1; r < rowsY; r++) {
        if (winLitCount + winOffCount >= MAX_WIN - 10) return;
        const wz = bz - bd / 2 + (c + 0.5) * (bd / colsZ);
        const wy = r * 2.2 + 1;
        const lit = rand() > 0.3;
        _dummy.position.set(fx, wy, wz);
        _dummy.rotation.set(0, rotY, 0); _dummy.updateMatrix();
        if (lit) { winInstLit.setMatrixAt(winLitCount++, _dummy.matrix); }
        else     { winInstOff.setMatrixAt(winOffCount++, _dummy.matrix); }
      }
    }
  }
}

const ROOFTOP_MAT = new THREE.MeshLambertMaterial({ color: 0x141e2a });
const ROOFTOP_BLINK_MAT = new THREE.MeshBasicMaterial({ color: 0xcc2200 });

function addRooftopDetail(scene, bx, bh, bz, bw, bd, rand) {
  const tMat = ROOFTOP_MAT;
  if (rand() > 0.5) {
    const tH = 2 + rand() * 3;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, tH, 7), tMat);
    tower.position.set(bx + (rand() - 0.5) * bw * 0.4, bh + tH / 2, bz + (rand() - 0.5) * bd * 0.4);
    scene.add(tower);
    // Red blinking light on tower
    const lt = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), ROOFTOP_BLINK_MAT);
    lt.position.set(tower.position.x, bh + tH + 0.15, tower.position.z);
    blinkMeshes.push(lt);
    scene.add(lt);
  }
  const bxH = 0.6 + rand() * 1;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.9 + rand() * 1.2, bxH, 0.7 + rand() * 0.8),
    tMat
  );
  box.position.set(bx + (rand() - 0.5) * bw * 0.5, bh + bxH / 2, bz + (rand() - 0.5) * bd * 0.5);
  scene.add(box);

  // AC unit
  if (rand() > 0.6) {
    const acBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), tMat);
    acBox.position.set(bx + (rand() - 0.5) * bw * 0.5, bh + 0.35, bz + (rand() - 0.5) * bd * 0.5);
    scene.add(acBox);
  }
}

function addDestinationMarkers(scene, buildings) {
  // Place a distinctive building at each destination location
  DESTINATIONS.forEach(d => {
    const accentColors = { work: 0x1a3a5a, school: 0x1a3a1a, lawyer: 0x2a1a3a, home: 0x3a2a1a };
    const color = accentColors[d.id] || 0x1a2a3a;
    // Accent stripe on front face of a tall building near the destination
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 6, 0.12),
      new THREE.MeshBasicMaterial({ color })
    );
    stripe.position.set(d.x, 4, d.z - 5.5);
    scene.add(stripe);
  });
}

function addStreetLights(scene, stride) {
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x1a2233 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xb0882a });
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.07, 6, 5);
  const headGeo = new THREE.BoxGeometry(0.45, 0.14, 0.28);

  // Collect all positions first
  const positions = [];
  for (let bx = -4; bx <= 4; bx++) {
    for (let seg = -8; seg <= 8; seg++) {
      positions.push(
        { x: bx * stride - ROAD_WIDTH / 2 - 0.8, z: seg * stride * 0.4 },
        { x: bx * stride + ROAD_WIDTH / 2 + 0.8, z: seg * stride * 0.4 },
        { x: seg * stride * 0.4, z: bx * stride - ROAD_WIDTH / 2 - 0.8 },
        { x: seg * stride * 0.4, z: bx * stride + ROAD_WIDTH / 2 + 0.8 },
      );
    }
  }

  // 2 draw calls total instead of 1224 individual meshes
  const poleInst = new THREE.InstancedMesh(poleGeo, poleMat, positions.length);
  const headInst = new THREE.InstancedMesh(headGeo, headMat, positions.length);
  const dm = new THREE.Object3D();
  positions.forEach((p, i) => {
    dm.position.set(p.x, 3,   p.z); dm.updateMatrix(); poleInst.setMatrixAt(i, dm.matrix);
    dm.position.set(p.x, 6.1, p.z); dm.updateMatrix(); headInst.setMatrixAt(i, dm.matrix);
  });
  poleInst.instanceMatrix.needsUpdate = true;
  headInst.instanceMatrix.needsUpdate = true;
  scene.add(poleInst); scene.add(headInst);

  // Only 2 PointLights at the very center intersection instead of 36
  const lt1 = new THREE.PointLight(0xb08830, 1.8, 24);
  lt1.position.set(-ROAD_WIDTH / 2 - 0.8, 5.8, -ROAD_WIDTH / 2 - 0.8);
  scene.add(lt1);
  const lt2 = new THREE.PointLight(0xb08830, 1.8, 24);
  lt2.position.set(ROAD_WIDTH / 2 + 0.8, 5.8, ROAD_WIDTH / 2 + 0.8);
  scene.add(lt2);
}

// ═══════════════════════════════════════════════════════
// Three.js setup — NO shadow maps (main perf fix)
// ═══════════════════════════════════════════════════════
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.65;
document.getElementById('renderer-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050a12);
scene.fog = new THREE.FogExp2(0x050a12, 0.028);

// Lighting (no shadow-casting lights)
scene.add(new THREE.AmbientLight(0x1a2535, 1.2));
const dirLight = new THREE.DirectionalLight(0x2a3a55, 0.8);
dirLight.position.set(40, 80, 30);
scene.add(dirLight);
// Subtle blue-green city glow from below
const cityGlow = new THREE.HemisphereLight(0x050a12, 0x0d1a0d, 0.5);
scene.add(cityGlow);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 220);
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
let blinkMeshes = [];
let spawnCooldown = 0;
let rafId = null;
let gameState = null;
const player = { x: 0, z: 0, yaw: 0, pitch: 0 };
const keys = {};
const mouse = { lastX: null, lastY: null, locked: false };

// ═══════════════════════════════════════════════════════
// Collision
// ═══════════════════════════════════════════════════════
function dist2D(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2); }
function dist2DSq(a, b) { return (a.x - b.x) ** 2 + (a.z - b.z) ** 2; }

// Spatial grid for O(1) building collision instead of O(n)
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

function collidesWithBuildings(nx, nz) {
  const cx = Math.floor(nx / GRID_CELL);
  const cz = Math.floor(nz / GRID_CELL);
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

function tryMove(nx, nz) {
  const fX = !collidesWithBuildings(nx, player.z);
  const fZ = !collidesWithBuildings(player.x, nz);
  if (fX && fZ && !collidesWithBuildings(nx, nz)) {
    player.x = Math.max(-92, Math.min(92, nx));
    player.z = Math.max(-92, Math.min(92, nz));
  } else if (fX) {
    player.x = Math.max(-92, Math.min(92, nx));
  } else if (fZ) {
    player.z = Math.max(-92, Math.min(92, nz));
  }
}

// ═══════════════════════════════════════════════════════
// ICE agent — humanoid box figure
// ═══════════════════════════════════════════════════════
// Shared materials across all agents (created once, reused)
const ICE_BODY_MAT  = new THREE.MeshLambertMaterial({ color: 0x0a1428 });
const ICE_VEST_MAT  = new THREE.MeshLambertMaterial({ color: 0x0e1f3a });
const ICE_SKIN_MAT  = new THREE.MeshLambertMaterial({ color: 0xc8a070 });
const ICE_BADGE_MAT = new THREE.MeshBasicMaterial({ color: 0xd4a830 });
const ICE_EYE_MAT   = new THREE.MeshBasicMaterial({ color: 0xff2200 });

function spawnIce() {
  const group = new THREE.Group();

  const bodyMat  = ICE_BODY_MAT;
  const vestMat  = ICE_VEST_MAT;
  const skinMat  = ICE_SKIN_MAT;
  const badgeMat = ICE_BADGE_MAT;

  // Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.72, 0.22);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-0.14, 0.36, 0); group.add(legL);
  const legR = new THREE.Mesh(legGeo, bodyMat);
  legR.position.set(0.14, 0.36, 0); group.add(legR);

  // Torso / vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 0.28), vestMat);
  torso.position.set(0, 1.14, 0); group.add(torso);

  // Badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.04), badgeMat);
  badge.position.set(0.12, 1.22, 0.15); group.add(badge);

  // Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.64, 0.18);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  armL.position.set(-0.37, 1.1, 0); group.add(armL);
  const armR = new THREE.Mesh(armGeo, bodyMat);
  armR.position.set(0.37, 1.1, 0); group.add(armR);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), skinMat);
  head.position.set(0, 1.68, 0); group.add(head);

  // Helmet/cap
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), bodyMat);
  cap.position.set(0, 1.9, 0); group.add(cap);

  // Red eyes — BasicMaterial so they glow without adding a PointLight
  const eyeGeo = new THREE.SphereGeometry(0.04, 4, 4);
  const eyeL = new THREE.Mesh(eyeGeo, ICE_EYE_MAT);
  eyeL.position.set(-0.08, 1.65, 0.19); group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, ICE_EYE_MAT);
  eyeR.position.set(0.08, 1.65, 0.19); group.add(eyeR);

  const a = Math.random() * Math.PI * 2;
  const d = 35 + Math.random() * 22;
  group.position.set(player.x + Math.cos(a) * d, 0, player.z + Math.sin(a) * d);
  scene.add(group);

  iceAgents.push({
    group, legL, legR, armL, armR,
    speed: ICE_SPEED + Math.random() * 0.015,
    fleeing: false, fleeTimer: 0,
    walkPhase: Math.random() * Math.PI * 2,
  });
}

// ═══════════════════════════════════════════════════════
// Dropped phone visual
// ═══════════════════════════════════════════════════════
function dropPhoneVisual(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.48, 0.07),
    new THREE.MeshLambertMaterial({ color: 0x1a2a1a })
  );
  mesh.position.set(x, 0.25, z);
  mesh.rotation.y = Math.random() * Math.PI;
  mesh.rotation.x = 0.1;
  scene.add(mesh);
  // Small green glow from dropped phone
  const gl = new THREE.PointLight(0x22aa22, 0.8, 4);
  gl.position.set(x, 0.3, z);
  scene.add(gl);
}

// ═══════════════════════════════════════════════════════
// Game actions
// ═══════════════════════════════════════════════════════
function dropPhone() {
  if (!gameState || !gameState.hasPhone) return;
  dropPhoneVisual(player.x, player.z);
  gameState.hasPhone = false;
  gameState.signal = 0;
  iceAgents.forEach(a => { a.fleeing = true; a.fleeTimer = 12; });
  flashMsg('Phone dropped. ICE lost your signal.', 4);
  updatePhoneStatus();
}

function flashMsg(text, dur) {
  if (!gameState) return;
  gameState.lastMsg = text;
  gameState.lastMsgTimer = dur;
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
  if (e.code === 'KeyE'  && STATE === 'PLAYING') { tryEnterBuilding(); return; }
  if (e.code === 'KeyE'  && STATE === 'INTERIOR') { exitInterior(); return; }
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
  ['title-screen','intro-screen','interior-screen','end-screen'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
  document.getElementById('hud').classList.toggle('hidden', id !== null);
}

function fadeOut(cb) {
  const el = document.getElementById('fade');
  el.style.transition = 'opacity 0.45s';
  el.style.opacity = '1';
  setTimeout(cb, 470);
}

function fadeIn() {
  const el = document.getElementById('fade');
  el.style.transition = 'opacity 0.5s';
  el.style.opacity = '0';
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
  setTimeout(() => { document.getElementById('intro-line2').style.opacity = '1'; }, 1600);
  setTimeout(() => { document.getElementById('intro-line3').style.opacity = '1'; }, 3200);
  setTimeout(() => { document.getElementById('intro-prompt').style.opacity = '1'; }, 4800);
}

// ═══════════════════════════════════════════════════════
// Interior system
// ═══════════════════════════════════════════════════════
let pendingInteriorDest = null;

function tryEnterBuilding() {
  if (!gameState || gameState.gameOver) return;
  const cd = gameState.destStates[gameState.currentDestIndex];
  if (!cd || cd.visited) return;
  if (dist2DSq(player, { x: cd.x, z: cd.z }) > DEST_RANGE * DEST_RANGE) return;

  if (cd.requiresPhone && !gameState.hasPhone) {
    flashMsg(`${cd.label}: you need your phone for this`, 4);
    return;
  }

  pendingInteriorDest = cd;
  fadeOut(() => {
    STATE = 'INTERIOR';
    showScreen('interior-screen');

    const el = id => document.getElementById(id);
    el('interior-location').textContent = cd.label.toUpperCase();
    el('interior-title').textContent = cd.interiorTitle || cd.label.toUpperCase();
    el('interior-task').textContent = cd.interiorTask || '';
    el('interior-fact').textContent = cd.interiorFact || '';
    el('interior-prompt').textContent = cd.id === 'home' ? 'YOU MADE IT.' : 'PRESS E TO LEAVE';

    setTimeout(() => { el('interior-title').style.opacity = '1'; }, 100);
    setTimeout(() => { el('interior-task').style.opacity = '1'; }, 700);
    setTimeout(() => { el('interior-fact').style.opacity = '1'; }, 1600);
    setTimeout(() => { el('interior-prompt').style.opacity = '1'; }, 2800);

    fadeIn();

    if (cd.id === 'home') {
      // Auto-trigger ending after a moment
      setTimeout(() => {
        exitInterior();
        setTimeout(() => {
          gameState.gameOver = true;
          enterEnding(gameState.hasPhone ? 'home_phone' : 'home_no_phone');
        }, 600);
      }, 4000);
    }
  });
}

function exitInterior() {
  if (STATE !== 'INTERIOR') return;
  const cd = pendingInteriorDest;
  fadeOut(() => {
    STATE = 'PLAYING';
    showScreen(null);

    if (cd) {
      cd.visited = true;
      flashMsg(`${cd.label}: done`, 3);
      if (cd.id !== 'home') {
        gameState.currentDestIndex++;
        // Show a gameplay fact
        const fact = GAMEPLAY_FACTS[Math.floor(Math.random() * GAMEPLAY_FACTS.length)];
        setTimeout(() => flashMsg(fact, 6), 3500);
      }
    }
    pendingInteriorDest = null;

    // Reset interior text opacity for next use
    ['interior-title','interior-task','interior-fact','interior-prompt'].forEach(id => {
      document.getElementById(id).style.opacity = '0';
    });

    fadeIn();
  });
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

  // Destination beams
  destMeshes = DESTINATIONS.map(d => {
    const group = new THREE.Group();
    const beamColor = d.requiresPhone ? 0x3a7aaa : 0x4aaa5a;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.28, 14, 7),
      new THREE.MeshBasicMaterial({ color: beamColor, transparent: true, opacity: 0.35 })
    );
    beam.position.y = 7; group.add(beam);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.0, 32),
      new THREE.MeshBasicMaterial({ color: beamColor, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; group.add(ring);
    // Vertical label sprite (canvas)
    group.position.set(d.x, 0, d.z);
    scene.add(group);
    return group;
  });

  // Burner phones
  burnerObjs = BURNER_SPAWNS.map((bp, i) => {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.55, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x3a6a2a })
    ));
    const glow = new THREE.PointLight(0x4aaa3a, 1.8, 5);
    glow.position.y = 0.4; group.add(glow);
    group.position.set(bp.x, 0.8, bp.z);
    scene.add(group);
    return { group, collected: false, id: i, x: bp.x, z: bp.z };
  });

  player.x = 0; player.z = 0; player.yaw = 0; player.pitch = 0;

  gameState = {
    hasPhone: true, signal: 0,
    destStates: DESTINATIONS.map(d => ({ ...d, visited: false, failed: false })),
    currentDestIndex: 0, gameOver: false, frame: 0,
    lastMsg: 'Walk to the glowing markers. E = enter building. SPACE = drop phone.',
    lastMsgTimer: 6,
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

// Cached DOM refs — populated once at load, never call getElementById in hot path
const HUD = {};
function cacheHUD() {
  [
    'signal-fill','signal-value','ice-warning','ice-border','status-mode',
    'interact-prompt','interact-text','objective','obj-label','obj-desc',
    'obj-need-phone','msg-flash','msg-text','vignette',
    'phone-dot','phone-label','phone-hint','minimap-canvas',
  ].forEach(id => { HUD[id] = document.getElementById(id); });
}

const destDots = [];
const destLabels = [];

function buildDestList() {
  const wrap = document.getElementById('dest-wrap');
  wrap.innerHTML = '';
  destDots.length = 0; destLabels.length = 0;
  DESTINATIONS.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'dest-item';
    const dot = document.createElement('div');
    dot.className = 'dest-dot'; dot.id = `dd${i}`;
    const lbl = document.createElement('span');
    lbl.className = 'dest-lbl'; lbl.id = `dl${i}`; lbl.textContent = d.label;
    item.appendChild(dot); item.appendChild(lbl);
    wrap.appendChild(item);
    destDots.push(dot); destLabels.push(lbl);
  });
}

function updatePhoneStatus() {
  const s = gameState; if (!s) return;
  HUD['phone-dot'].style.background = s.hasPhone ? '#22aa22' : 'rgba(255,255,255,0.1)';
  HUD['phone-label'].textContent    = s.hasPhone ? 'PHONE ON' : 'NO PHONE';
  HUD['phone-hint'].textContent     = s.hasPhone ? 'SPACE = drop phone' : '';
}

function updateHUD(isSprinting, isCrouching) {
  const s = gameState; if (!s) return;
  const pct = s.signal / SIGNAL_MAX * 100;

  HUD['signal-fill'].style.width = pct + '%';
  HUD['signal-fill'].style.background = pct > 78 ? 'linear-gradient(90deg,#7a1008,#cc3322)'
    : pct > 50 ? 'linear-gradient(90deg,#4a1808,#7a2810)'
    : 'linear-gradient(90deg,#2a1808,#3a2010)';
  HUD['signal-value'].textContent = s.hasPhone ? Math.round(pct) + '%' : 'NO PHONE';

  const iceNear = iceAgents.some(a => !a.fleeing && dist2DSq({ x: a.group.position.x, z: a.group.position.z }, player) < 121);
  HUD['ice-warning'].textContent = iceNear ? '⚠ ICE NEARBY' : (pct > 78 ? 'LOCATION BROADCAST ACTIVE' : '');
  HUD['ice-warning'].style.color = iceNear ? 'rgba(200,50,50,0.9)' : 'rgba(200,120,50,0.7)';
  HUD['ice-border'].style.borderColor = iceNear ? 'rgba(180,0,0,0.5)' : 'rgba(180,0,0,0)';

  HUD['status-mode'].textContent = isSprinting ? 'SPRINTING' : isCrouching ? 'CROUCHING' : '';
  HUD['status-mode'].style.color = isSprinting ? 'rgba(200,160,50,0.8)' : 'rgba(80,180,120,0.8)';

  const cd = s.destStates[s.currentDestIndex];
  if (cd && !cd.visited && dist2DSq(player, { x: cd.x, z: cd.z }) < DEST_RANGE * DEST_RANGE) {
    HUD['interact-text'].textContent =
      (cd.requiresPhone && !s.hasPhone) ? `${cd.label}: NEED PHONE` : `PRESS E TO ENTER ${cd.label.toUpperCase()}`;
    HUD['interact-prompt'].style.opacity = '1';
  } else {
    HUD['interact-prompt'].style.opacity = '0';
  }

  s.destStates.forEach((d, i) => {
    const dot = destDots[i];
    const lbl = destLabels[i];
    if (!dot) return;
    if (d.visited) {
      dot.style.background = '#226622';
      lbl.style.color = 'rgba(50,160,50,0.5)';
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

  if (cd && !cd.visited) {
    HUD['objective'].style.display = 'block';
    HUD['obj-label'].textContent = cd.label;
    HUD['obj-desc'].textContent  = cd.desc;
    HUD['obj-need-phone'].textContent = (cd.requiresPhone && !s.hasPhone) ? '⚠ Needs phone' : '';
  } else {
    HUD['objective'].style.display = 'none';
  }

  if (s.lastMsgTimer > 0) {
    HUD['msg-text'].textContent = s.lastMsg;
    HUD['msg-flash'].style.opacity = '1';
  } else {
    HUD['msg-flash'].style.opacity = '0';
  }

  HUD['vignette'].style.background =
    `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${(0.3 + pct / 200).toFixed(2)}) 100%)`;

  updateMinimap();
}

function updateMinimap() {
  const mc = HUD['minimap-canvas'];
  const ctx = mc.getContext('2d');
  const sz = 120, sc = sz / 200, cx = sz / 2, cy = sz / 2;
  ctx.clearRect(0, 0, sz, sz);
  const s = gameState; if (!s) return;

  s.destStates.forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(cx + d.x * sc, cy + d.z * sc, 4, 0, Math.PI * 2);
    ctx.fillStyle = d.visited
      ? 'rgba(50,130,50,0.5)'
      : (i === s.currentDestIndex ? 'rgba(90,154,204,0.9)' : 'rgba(50,60,70,0.5)');
    ctx.fill();
  });

  iceAgents.forEach(a => {
    if (a.fleeing) return;
    ctx.beginPath();
    ctx.arc(cx + a.group.position.x * sc, cy + a.group.position.z * sc, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,34,0,0.9)';
    ctx.fill();
  });

  const ppx = cx + player.x * sc, ppy = cy + player.z * sc;
  ctx.beginPath(); ctx.arc(ppx, ppy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(ppx, ppy);
  ctx.lineTo(ppx + Math.sin(-player.yaw) * 9, ppy + Math.cos(-player.yaw) * 9);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
}

// ═══════════════════════════════════════════════════════
// Game loop
// ═══════════════════════════════════════════════════════
function loop() {
  rafId = requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05);
  const s = gameState;

  if (!s || s.gameOver || STATE !== 'PLAYING') {
    renderer.render(scene, camera);
    return;
  }
  s.frame++;

  // Sprint / Crouch
  const isSprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && !keys['ControlLeft'] && !keys['ControlRight'];
  const isCrouching = keys['ControlLeft'] || keys['ControlRight'] || keys['KeyC'];
  const speed = isSprinting ? SPRINT_SPEED : isCrouching ? CROUCH_SPEED : PLAYER_SPEED;

  // Movement
  let mx = 0, mz = 0;
  if (keys['KeyW'] || keys['ArrowUp'])    { mx -= Math.sin(player.yaw); mz -= Math.cos(player.yaw); }
  if (keys['KeyS'] || keys['ArrowDown'])  { mx += Math.sin(player.yaw); mz += Math.cos(player.yaw); }
  if (keys['KeyA'] || keys['ArrowLeft'])  { mx -= Math.cos(player.yaw); mz += Math.sin(player.yaw); }
  if (keys['KeyD'] || keys['ArrowRight']) { mx += Math.cos(player.yaw); mz -= Math.sin(player.yaw); }
  if (mx !== 0 || mz !== 0) {
    const len = Math.sqrt(mx * mx + mz * mz);
    const step = speed * 60 * delta;
    tryMove(player.x + (mx / len) * step, player.z + (mz / len) * step);
  }

  // Camera height (smooth crouch)
  const targetH = isCrouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
  camera.position.set(player.x, camera.position.y + (targetH - camera.position.y) * 0.15, player.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  // Signal
  if (s.hasPhone) {
    const signalRate = SIGNAL_FILL_BASE * (isSprinting ? SIGNAL_SPRINT_MULT : isCrouching ? SIGNAL_CROUCH_MULT : 1.0);
    s.signal = Math.min(SIGNAL_MAX, s.signal + signalRate * 60 * delta);
  }
  audio.setTension(s.signal / SIGNAL_MAX);

  // ICE spawn (avoid filter().length array allocation every frame)
  spawnCooldown -= delta;
  if (s.hasPhone && s.signal >= ICE_SPAWN_THRESHOLD && spawnCooldown <= 0) {
    let activeIce = 0;
    for (const a of iceAgents) if (!a.fleeing) activeIce++;
    if (activeIce < 5) { spawnIce(); spawnCooldown = 5; }
  }

  // Blink rooftop lights (~1 Hz)
  if (blinkMeshes.length) {
    const blinkOn = Math.floor(s.frame / 32) % 2 === 0;
    for (const m of blinkMeshes) m.visible = blinkOn;
  }

  // ICE movement + walking animation
  const toRemove = [];
  iceAgents.forEach(agent => {
    const pos = agent.group.position;
    const d = dist2D({ x: pos.x, z: pos.z }, player);

    if (agent.fleeing) {
      agent.fleeTimer -= delta;
      if (d > 0.1) {
        pos.x += ((pos.x - player.x) / d) * ICE_SPEED * 60 * delta;
        pos.z += ((pos.z - player.z) / d) * ICE_SPEED * 60 * delta;
      }
      if (agent.fleeTimer <= 0) { scene.remove(agent.group); toRemove.push(agent); }
      return;
    }

    if (d < 0.01) return;
    const detectRange = isCrouching ? ICE_DETECT_CROUCH : ICE_DETECT_RANGE;
    const chasing = d < detectRange || s.signal > 88;
    const spd = (chasing ? ICE_CHASE_SPEED : agent.speed) * 60 * delta;
    agent.group.rotation.y = Math.atan2(player.x - pos.x, player.z - pos.z);
    pos.x += (player.x - pos.x) / d * spd;
    pos.z += (player.z - pos.z) / d * spd;

    // Walking animation
    agent.walkPhase += delta * (chasing ? 8 : 4);
    const swing = Math.sin(agent.walkPhase) * 0.35;
    agent.legL.rotation.x = swing;
    agent.legR.rotation.x = -swing;
    agent.armL.rotation.x = -swing * 0.6;
    agent.armR.rotation.x = swing * 0.6;

    if (!s.gameOver && d < ICE_CATCH_RANGE) {
      s.gameOver = true;
      enterEnding('caught');
    }
  });
  toRemove.forEach(a => iceAgents.splice(iceAgents.indexOf(a), 1));

  // Destination beams pulse
  destMeshes.forEach((dm, i) => {
    dm.rotation.y += delta * 0.55;
    dm.visible = !s.destStates[i].visited;
    dm.scale.setScalar(1 + Math.sin(s.frame * 0.07) * 0.04);
  });

  // Burner phones
  burnerObjs.forEach(bp => {
    if (bp.collected) return;
    bp.group.position.y = 0.8 + Math.sin(s.frame * 0.04 + bp.id) * 0.14;
    bp.group.rotation.y += delta * 1.2;
    if (!s.hasPhone && dist2D({ x: bp.group.position.x, z: bp.group.position.z }, player) < 2) {
      bp.collected = true; bp.group.visible = false;
      s.hasPhone = true; s.signal = 8;
      flashMsg('Burner phone picked up. Signal restarting.', 3);
      updatePhoneStatus();
    }
  });

  // Atmosphere shift with signal
  const sr = s.signal / SIGNAL_MAX;
  scene.fog.color.setRGB(0.02 + sr * 0.07, 0.04 + sr * 0.01, 0.07 - sr * 0.03);
  scene.background.setRGB((0.02 + sr * 0.07) * 0.38, (0.04 + sr * 0.01) * 0.38, (0.07 - sr * 0.03) * 0.38);

  if (s.lastMsgTimer > 0) s.lastMsgTimer -= delta;

  renderer.render(scene, camera);
  if (s.frame % 5 === 0) updateHUD(isSprinting, isCrouching);
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
  setTimeout(() => { footer.style.opacity = '1'; }, lastDelay + 2200);
  setTimeout(() => { restartEnabled = true; restart.style.opacity = '1'; }, lastDelay + 3800);

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
  gameState = null; restartEnabled = false; pendingInteriorDest = null;

  ['title-text','title-subtitle','title-line','title-prompt'].forEach(id => {
    const el = document.getElementById(id);
    el.style.opacity = '0';
    if (id === 'title-line') el.style.transform = 'scaleX(0)';
  });
  ['intro-line1','intro-line2','intro-line3','intro-prompt'].forEach(id => {
    document.getElementById(id).style.opacity = '0';
  });

  STATE = 'TITLE';
  showScreen('title-screen');
  setTimeout(animateTitle, 100);
}

// ═══════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════
window.addEventListener('load', () => {
  cacheHUD();
  initBuildingMaterials();
  showScreen('title-screen');
  animateTitle();

  (function idleLoop() {
    requestAnimationFrame(idleLoop);
    if (STATE !== 'PLAYING') renderer.render(scene, camera);
  })();
});
