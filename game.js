'use strict';

// ═══════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════
const PLAYER_HEIGHT   = 1.65;
const PLAYER_RADIUS   = 0.3;
const CELL_SIZE       = 2;
const WALL_HEIGHT     = 3.2;
const MOVE_SPEED      = 5.0;
const SPRINT_MULT     = 2.0;
const TURN_SPEED      = 0.002;
const STAMINA_DRAIN   = 0.4;
const STAMINA_REGEN   = 0.25;
const TRACKING_BASE   = 0.012;
const TRACKING_LOS    = 0.045;
const TRACKING_BURNER = 0.006;
const TRACKING_DRAIN  = 0.008;
const AGENT_PATROL_SPEED = 2.0;
const AGENT_CHASE_SPEED  = 4.5;
const AGENT_ALERT_SPEED  = 3.0;
const AGENT_CONTACT_DIST = 1.2;
const AGENT_SIGHT_RANGE  = 14;
const AGENT_FOV          = Math.PI / 2;

// ═══════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════
let STATE = 'TITLE';

// ═══════════════════════════════════════════════════════
// Three.js core
// ═══════════════════════════════════════════════════════
const scene    = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled  = true;
renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.getElementById('renderer-container').appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 80);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera pivot
const cameraPivot = new THREE.Group();
scene.add(cameraPivot);
cameraPivot.add(camera);

// Flashlight
const flashlight = new THREE.SpotLight(0xffffff, 3.5, 18, 0.38, 0.35, 1.2);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(1024, 1024);
flashlight.shadow.camera.near = 0.1;
flashlight.shadow.camera.far  = 18;
const flashTarget = new THREE.Object3D();
camera.add(flashlight);
camera.add(flashTarget);
flashTarget.position.set(0, 0, -1);
flashlight.target = flashTarget;

// ═══════════════════════════════════════════════════════
// Player
// ═══════════════════════════════════════════════════════
const player = {
  x: CELL_SIZE * 1.5, z: CELL_SIZE * 1.5,
  angleY: 0, angleX: 0,
  health: 3, maxHealth: 3,
  stamina: 1.0,
  invincible: 0,
  hasPhone: true,
  phoneDropped: false,
  phoneIsBurner: false,
  tracking: 0,
};

// ═══════════════════════════════════════════════════════
// Input
// ═══════════════════════════════════════════════════════
const keys = {};
let pointerLocked = false;
let mouseDX = 0, mouseDY = 0;

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && STATE === 'PLAYING') handlePhoneDrop();
  if (e.code === 'Digit1' && STATE === 'PLAYING') useItem(0);
  if (e.code === 'Digit2' && STATE === 'PLAYING') useItem(1);
  if (e.code === 'Digit3' && STATE === 'PLAYING') useItem(2);
  if (e.code === 'Digit4' && STATE === 'PLAYING') useItem(3);
  if ((e.code === 'Space' || e.code === 'Enter') && STATE === 'LOSS_SCREEN') resumeFromLoss();
  if ((e.code === 'Space' || e.code === 'Enter') && STATE === 'ENDING' && endingReturnEnabled) resetGame();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
document.addEventListener('mousemove', e => {
  if (!pointerLocked) return;
  mouseDX += e.movementX;
  mouseDY += e.movementY;
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});
renderer.domElement.addEventListener('click', () => {
  if (STATE === 'TITLE') { startGame(); return; }
  if (STATE === 'LOSS_SCREEN') { resumeFromLoss(); return; }
  if (STATE === 'ENDING' && endingReturnEnabled) { resetGame(); return; }
  if (STATE === 'PLAYING' || STATE === 'DROP_MOMENT') {
    renderer.domElement.requestPointerLock();
  }
});

// ═══════════════════════════════════════════════════════
// Map helpers
// ═══════════════════════════════════════════════════════
let MAP = [], MAP_W = 0, MAP_H = 0;

function mapAt(gx, gz) {
  const ix = Math.floor(gx), iz = Math.floor(gz);
  if (ix < 0 || ix >= MAP_W || iz < 0 || iz >= MAP_H) return 1;
  return MAP[iz * MAP_W + ix];
}
function worldToGrid(wx, wz) {
  return { gx: wx / CELL_SIZE, gz: wz / CELL_SIZE };
}
function canMove(wx, wz) {
  const r = PLAYER_RADIUS / CELL_SIZE;
  const { gx, gz } = worldToGrid(wx, wz);
  return mapAt(gx - r, gz - r) === 0 && mapAt(gx + r, gz - r) === 0 &&
         mapAt(gx - r, gz + r) === 0 && mapAt(gx + r, gz + r) === 0;
}

// ═══════════════════════════════════════════════════════
// Textures
// ═══════════════════════════════════════════════════════
const textures = {};

function makeCanvasTex(size, drawFn, rx, ry) {
  const oc = document.createElement('canvas');
  oc.width = size; oc.height = size;
  drawFn(oc.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(oc);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx || 4, ry || 4);
  return tex;
}

function buildTextures() {
  textures.brick = makeCanvasTex(256, (c, S) => {
    c.fillStyle = '#1a0a00'; c.fillRect(0, 0, S, S);
    const bH = 32, bW = 64;
    for (let row = 0; row < S / bH; row++) {
      const off = (row % 2) * (bW / 2);
      for (let col = -1; col < S / bW + 1; col++) {
        const x = col * bW + off, y = row * bH;
        const sh = 70 + Math.floor(Math.random() * 40);
        c.fillStyle = `rgb(${sh},${Math.floor(sh*.42)},${Math.floor(sh*.22)})`;
        c.fillRect(x+2, y+2, bW-4, bH-4);
        c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x+2, y+2, bW-4, 5);
      }
    }
  }, 3, 4);

  textures.concrete = makeCanvasTex(256, (c, S) => {
    c.fillStyle = '#222'; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 1200; i++) {
      const sh = 28 + Math.floor(Math.random() * 28);
      c.fillStyle = `rgb(${sh},${sh},${sh+2})`;
      c.fillRect(Math.random()*S, Math.random()*S, 2, 2);
    }
    c.strokeStyle = '#111'; c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.moveTo(Math.random()*S, Math.random()*S);
      for (let s = 0; s < 5; s++) c.lineTo(Math.random()*S, Math.random()*S);
      c.stroke();
    }
  }, 2, 3);

  textures.tile = makeCanvasTex(256, (c, S) => {
    c.fillStyle = '#d4d4dc'; c.fillRect(0, 0, S, S);
    const ts = 64;
    c.strokeStyle = '#b0b0b8'; c.lineWidth = 2;
    for (let i = 0; i <= S; i += ts) {
      c.beginPath(); c.moveTo(i,0); c.lineTo(i,S); c.stroke();
      c.beginPath(); c.moveTo(0,i); c.lineTo(S,i); c.stroke();
    }
    for (let i = 0; i < 10; i++) {
      c.fillStyle = 'rgba(140,140,155,0.2)';
      c.fillRect(Math.random()*S, Math.random()*S, 6+Math.random()*16, 4+Math.random()*12);
    }
  }, 3, 3);

  textures.asphalt = makeCanvasTex(256, (c, S) => {
    c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, S, S);
    for (let i = 0; i < 2000; i++) {
      const sh = 18 + Math.floor(Math.random() * 22);
      c.fillStyle = `rgb(${sh},${sh},${sh})`;
      c.fillRect(Math.random()*S, Math.random()*S, 1, 1);
    }
    c.strokeStyle = '#0f0f0f'; c.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(Math.random()*S, Math.random()*S);
      for (let s = 0; s < 6; s++) c.lineTo(Math.random()*S, Math.random()*S);
      c.stroke();
    }
  }, 4, 4);

  textures.darkFloor = makeCanvasTex(256, (c, S) => {
    c.fillStyle = '#0d0d10'; c.fillRect(0, 0, S, S);
    const ts = 48;
    c.strokeStyle = '#1a1a20'; c.lineWidth = 1;
    for (let i = 0; i <= S; i += ts) {
      c.beginPath(); c.moveTo(i,0); c.lineTo(i,S); c.stroke();
      c.beginPath(); c.moveTo(0,i); c.lineTo(S,i); c.stroke();
    }
  }, 3, 3);

  textures.whiteFloor = makeCanvasTex(256, (c, S) => {
    c.fillStyle = '#ccccd8'; c.fillRect(0, 0, S, S);
    const ts = 64;
    c.strokeStyle = '#aaaabc'; c.lineWidth = 2;
    for (let i = 0; i <= S; i += ts) {
      c.beginPath(); c.moveTo(i,0); c.lineTo(i,S); c.stroke();
      c.beginPath(); c.moveTo(0,i); c.lineTo(S,i); c.stroke();
    }
  }, 3, 3);
}

// ═══════════════════════════════════════════════════════
// Agent materials & models
// ═══════════════════════════════════════════════════════
const agentMats = {};

function buildAgentMaterials() {
  agentMats.vest   = new THREE.MeshStandardMaterial({ color: 0x1c2340, roughness: 0.8, metalness: 0.1 });
  agentMats.helmet = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.7, metalness: 0.15 });
  agentMats.visor  = new THREE.MeshStandardMaterial({ color: 0x050a14, roughness: 0.05, metalness: 0.95 });
  agentMats.skin   = new THREE.MeshStandardMaterial({ color: 0xc49060, roughness: 0.8, metalness: 0.0 });
  agentMats.pants  = new THREE.MeshStandardMaterial({ color: 0x141a28, roughness: 0.85, metalness: 0.0 });
  agentMats.boots  = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9, metalness: 0.05 });
  agentMats.badge  = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8, emissive: 0xffd700, emissiveIntensity: 0.25 });
}

function makeAgentMesh() {
  const root = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.32), agentMats.vest);
  body.position.set(0, 1.25, 0); body.castShadow = true; root.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.36), agentMats.helmet);
  head.position.set(0, 1.82, 0); head.castShadow = true; root.add(head);

  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.42), agentMats.helmet);
  brim.position.set(0, 1.63, 0); root.add(brim);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.05), agentMats.visor);
  visor.position.set(0, 1.76, 0.19); root.add(visor);

  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.04), agentMats.badge);
  badge.position.set(-0.15, 1.35, 0.19); root.add(badge);

  const leftArm = new THREE.Group(); leftArm.position.set(-0.38, 1.55, 0);
  const rightArm = new THREE.Group(); rightArm.position.set(0.38, 1.55, 0);
  const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.22);
  const lAM = new THREE.Mesh(armGeo, agentMats.vest); lAM.position.set(0,-0.27,0); lAM.castShadow = true;
  const rAM = new THREE.Mesh(armGeo, agentMats.vest); rAM.position.set(0,-0.27,0); rAM.castShadow = true;
  leftArm.add(lAM); rightArm.add(rAM);
  root.add(leftArm); root.add(rightArm);

  const leftLeg = new THREE.Group(); leftLeg.position.set(-0.15, 0.88, 0);
  const rightLeg = new THREE.Group(); rightLeg.position.set(0.15, 0.88, 0);
  const legGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
  const lLM = new THREE.Mesh(legGeo, agentMats.pants); lLM.position.set(0,-0.36,0); lLM.castShadow = true;
  const rLM = new THREE.Mesh(legGeo, agentMats.pants); rLM.position.set(0,-0.36,0); rLM.castShadow = true;
  leftLeg.add(lLM); rightLeg.add(rLM);
  const bootGeo = new THREE.BoxGeometry(0.26, 0.22, 0.30);
  const lBoot = new THREE.Mesh(bootGeo, agentMats.boots); lBoot.position.set(0,-0.8,0.04);
  const rBoot = new THREE.Mesh(bootGeo, agentMats.boots); rBoot.position.set(0,-0.8,0.04);
  leftLeg.add(lBoot); rightLeg.add(rBoot);
  root.add(leftLeg); root.add(rightLeg);

  const glow = new THREE.PointLight(0xff1111, 0.5, 3.5);
  glow.position.set(0, 1.4, 0);
  root.add(glow);

  root.userData = { leftArm, rightArm, leftLeg, rightLeg, walkPhase: Math.random() * Math.PI * 2 };
  return root;
}

function animateAgentMesh(agentObj, speed, dt) {
  const ud = agentObj.mesh.userData;
  if (!ud) return;
  const moving = speed > 0.1;
  if (moving) ud.walkPhase += speed * 2.5 * dt;
  else ud.walkPhase *= 0.9;
  const amp = moving ? 0.45 : 0;
  const s = Math.sin(ud.walkPhase) * amp;
  ud.leftLeg.rotation.x  =  s;
  ud.rightLeg.rotation.x = -s;
  ud.leftArm.rotation.x  = -s * 0.6;
  ud.rightArm.rotation.x =  s * 0.6;
}

// ═══════════════════════════════════════════════════════
// Level geometry
// ═══════════════════════════════════════════════════════
let levelGroup = null;
let levelAmbient = null;
let levelFillLights = [];
let levelFlickerLight = null;
let flickerTimer = 0, flickerOn = true;
let currentTrackingMultiplier = 1.0;

function clearLevelGeometry() {
  if (levelGroup) {
    scene.remove(levelGroup);
    levelGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    levelGroup = null;
  }
}

function buildLevelGeometry(lvl) {
  clearLevelGeometry();
  levelGroup = new THREE.Group();
  scene.add(levelGroup);

  scene.fog = new THREE.FogExp2(lvl.fogColor, lvl.fogDensity);
  scene.background = new THREE.Color(lvl.fogColor);

  const wallMat = new THREE.MeshStandardMaterial({
    map: textures[lvl.wallTexKey],
    roughness: lvl.wallRoughness,
    metalness: lvl.wallMetalness,
  });
  for (let z = 0; z < lvl.mapH; z++) {
    for (let x = 0; x < lvl.mapW; x++) {
      if (lvl.map[z * lvl.mapW + x] === 0) continue;
      const geo  = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x * CELL_SIZE + CELL_SIZE/2, WALL_HEIGHT/2, z * CELL_SIZE + CELL_SIZE/2);
      mesh.castShadow = true; mesh.receiveShadow = true;
      levelGroup.add(mesh);
    }
  }
  const floorGeo = new THREE.PlaneGeometry(lvl.mapW * CELL_SIZE, lvl.mapH * CELL_SIZE);
  const floorMat = new THREE.MeshStandardMaterial({ map: textures[lvl.floorTexKey], roughness: 0.95, metalness: 0.0 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.position.set(lvl.mapW*CELL_SIZE/2, 0, lvl.mapH*CELL_SIZE/2);
  floor.receiveShadow = true; levelGroup.add(floor);

  const ceilGeo = new THREE.PlaneGeometry(lvl.mapW * CELL_SIZE, lvl.mapH * CELL_SIZE);
  const ceilMat = new THREE.MeshStandardMaterial({ color: lvl.ceilColor, roughness: 0.9, metalness: 0.0 });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.rotation.x = Math.PI/2;
  ceil.position.set(lvl.mapW*CELL_SIZE/2, WALL_HEIGHT, lvl.mapH*CELL_SIZE/2);
  ceil.receiveShadow = true; levelGroup.add(ceil);
}

// ═══════════════════════════════════════════════════════
// Level definitions
// ═══════════════════════════════════════════════════════
let currentLevelIndex = 0;
let nextLevelIndex = 0;
let levelTransitionTimer = 0;
const LEVEL_TRANSITION_DURATION = 5.5;

const LEVELS = [
  {
    mapW: 16, mapH: 10,
    map: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,
      1,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,
      1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],
    wallTexKey: 'brick', floorTexKey: 'asphalt', ceilColor: 0x04040e,
    wallRoughness: 0.9, wallMetalness: 0.0,
    fogColor: 0x04040e, fogDensity: 0.04,
    ambientColor: 0x06060f, ambientIntensity: 0.3,
    playerStart: { x: 1.5, z: 1.5, angle: 0 },
    agents: [
      { x: 6.5, z: 5.0, angle: 0, route: [{x:6.5,z:5},{x:6.5,z:2},{x:10.5,z:2},{x:10.5,z:5}] },
      { x: 12.5, z: 7.0, angle: Math.PI, route: [{x:12.5,z:7},{x:12.5,z:3},{x:8.5,z:3},{x:8.5,z:7}] },
    ],
    items: [
      { x: 3.5, z: 7.5, key: 'jammer' },
      { x: 8.5, z: 8.5, key: 'distraction' },
      { x: 11.5, z: 8.5, key: 'distraction' },
    ],
    checkpoints: [{ gx: 9, gz: 5, requiresFakeId: true, passed: false }],
    exitTrigger: { x: 14.5 * CELL_SIZE, z: 1.5 * CELL_SIZE, radius: 1.8 },
    trackingMultiplier: 1.0,
    transitionLines: null,
    fillLights: [
      { x: 4,  z: 4,  color: 0xff6a1a, intensity: 0.6, distance: 8 },
      { x: 12, z: 6,  color: 0xff6a1a, intensity: 0.5, distance: 7 },
    ],
    flickerLight: null,
  },
  {
    mapW: 14, mapH: 12,
    map: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,1,0,0,0,0,0,0,0,1,0,0,1,
      1,0,1,0,0,1,0,0,0,0,1,0,0,1,
      1,0,0,0,0,1,0,0,0,0,0,0,0,1,
      1,0,0,1,0,0,0,1,0,0,0,0,0,1,
      1,0,0,1,0,0,0,1,0,0,1,0,0,1,
      1,0,0,0,0,0,0,0,0,0,1,0,0,1,
      1,0,1,0,0,0,0,0,0,0,0,0,0,1,
      1,0,1,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],
    wallTexKey: 'concrete', floorTexKey: 'darkFloor', ceilColor: 0x050505,
    wallRoughness: 0.88, wallMetalness: 0.02,
    fogColor: 0x050505, fogDensity: 0.07,
    ambientColor: 0x04040a, ambientIntensity: 0.2,
    playerStart: { x: 1.5, z: 1.5, angle: 0 },
    agents: [
      { x: 5.0, z: 3.0, angle: 0, route: [{x:5,z:3},{x:5,z:8},{x:9,z:8},{x:9,z:3}] },
      { x: 8.0, z: 5.0, angle: Math.PI, route: [], soundAlert: true },
      { x: 10.0, z: 9.0, angle: 0, route: [], soundAlert: true },
    ],
    items: [
      { x: 3.5, z: 9.5, key: 'burner' },
      { x: 7.5, z: 2.5, key: 'fakeId' },
      { x: 11.5, z: 5.5, key: 'jammer' },
    ],
    checkpoints: [],
    exitTrigger: { x: 12.5 * CELL_SIZE, z: 10.5 * CELL_SIZE, radius: 1.8 },
    trackingMultiplier: 1.0,
    transitionLines: ["You made it underground.", "But ICE bought your subway tap data from a data broker."],
    fillLights: [
      { x: 4,  z: 6,  color: 0x1a1aff, intensity: 0.4, distance: 6 },
      { x: 10, z: 5,  color: 0x1a1aff, intensity: 0.35, distance: 5 },
    ],
    flickerLight: { x: 7, z: 5, color: 0xffffaa, intensity: 1.2, distance: 7 },
  },
  {
    mapW: 16, mapH: 14,
    map: [
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,1,1,0,0,0,0,0,0,1,1,0,0,0,1,
      1,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,
      1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,1,0,0,0,0,1,1,0,0,0,1,0,0,1,
      1,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,
      1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,
      1,0,1,1,0,0,0,0,0,0,1,0,0,0,0,1,
      1,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],
    wallTexKey: 'tile', floorTexKey: 'whiteFloor', ceilColor: 0xd8d8e4,
    wallRoughness: 0.4, wallMetalness: 0.05,
    fogColor: 0xc0c0d0, fogDensity: 0.015,
    ambientColor: 0x9090a8, ambientIntensity: 0.8,
    playerStart: { x: 1.5, z: 1.5, angle: 0 },
    agents: [
      { x: 5.0, z: 4.0, angle: 0, route: [{x:5,z:4},{x:5,z:10},{x:12,z:10},{x:12,z:4}] },
      { x: 12.0, z: 7.0, angle: Math.PI, route: [{x:12,z:7},{x:8,z:7},{x:8,z:11},{x:12,z:11}] },
      { x: 8.0, z: 5.0, angle: 0, route: [], chaseOnSight: true },
      { x: 13.5, z: 12.5, angle: Math.PI, route: [] },
    ],
    items: [
      { x: 3.5, z: 11.5, key: 'jammer' },
      { x: 9.5, z: 3.5, key: 'distraction' },
    ],
    checkpoints: [],
    exitTrigger: { x: 14.5 * CELL_SIZE, z: 12.5 * CELL_SIZE, radius: 1.8 },
    trackingMultiplier: 3.0,
    transitionLines: ["You reached the building.", "ICE has a $1 billion Palantir contract to find you."],
    fillLights: [
      { x: 5,  z: 5,  color: 0xffffff, intensity: 0.7, distance: 10 },
      { x: 12, z: 5,  color: 0xffffff, intensity: 0.7, distance: 10 },
      { x: 7,  z: 11, color: 0xffffff, intensity: 0.6, distance: 9  },
    ],
    flickerLight: null,
  },
];

// ═══════════════════════════════════════════════════════
// Agents
// ═══════════════════════════════════════════════════════
const agents = [];

function clearAgents() {
  for (const a of agents) { scene.remove(a.mesh); }
  agents.length = 0;
}

function spawnAgent(wx, wz, facingAngle, patrolRoute, opts) {
  const mesh = makeAgentMesh();
  mesh.position.set(wx, 0, wz);
  mesh.rotation.y = facingAngle;
  scene.add(mesh);
  const agent = {
    x: wx, z: wz,
    facing: facingAngle,
    mesh,
    aiState: 'PATROL',
    patrolRoute: (patrolRoute || []).map(p => ({ x: p.x * CELL_SIZE, z: p.z * CELL_SIZE })),
    patrolIndex: 0,
    alertTimer: 0,
    lastKnownX: wx, lastKnownZ: wz,
    hasLOS: false,
    frozen: false,
    soundAlert: !!(opts && opts.soundAlert),
    chaseOnSight: !!(opts && opts.chaseOnSight),
    moveSpeed: 0,
  };
  agents.push(agent);
  return agent;
}

// ═══════════════════════════════════════════════════════
// Ground items
// ═══════════════════════════════════════════════════════
const groundItems = [];
const ITEM_COLORS = { burner: 0x4fc3f7, jammer: 0x00ff44, fakeId: 0xffd700, distraction: 0xff8800 };

function spawnGroundItem(wx, wz, key) {
  const geo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  const mat = new THREE.MeshStandardMaterial({
    color: ITEM_COLORS[key] || 0xffffff,
    emissive: ITEM_COLORS[key] || 0xffffff,
    emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(wx, 0.5, wz);
  mesh.castShadow = true;
  scene.add(mesh);
  const light = new THREE.PointLight(ITEM_COLORS[key] || 0xffffff, 0.8, 2.5);
  light.position.set(wx, 0.7, wz);
  scene.add(light);
  const item = { wx, wz, key, mesh, light, picked: false, phase: Math.random() * Math.PI * 2 };
  groundItems.push(item);
  return item;
}

function clearGroundItems() {
  for (const gi of groundItems) {
    scene.remove(gi.mesh); scene.remove(gi.light);
    gi.mesh.geometry.dispose(); gi.mesh.material.dispose();
  }
  groundItems.length = 0;
}

// ═══════════════════════════════════════════════════════
// Inventory
// ═══════════════════════════════════════════════════════
const inventory = { burner: 1, jammer: 0, fakeId: 0, distraction: 0 };
const INVENTORY_KEYS = ['burner', 'jammer', 'fakeId', 'distraction'];
let activeSlot = 0;
let jammerActive = 0;
let fakeIdReady = false;
let dropMomentTimer = 0;
let burnerMesh = null;

// ═══════════════════════════════════════════════════════
// Load level
// ═══════════════════════════════════════════════════════
function loadLevel(index) {
  currentLevelIndex = index;
  const lvl = LEVELS[index];

  for (const cp of (lvl.checkpoints || [])) cp.passed = false;

  buildLevelGeometry(lvl);
  MAP = lvl.map; MAP_W = lvl.mapW; MAP_H = lvl.mapH;

  player.x = lvl.playerStart.x * CELL_SIZE;
  player.z = lvl.playerStart.z * CELL_SIZE;
  player.angleY = lvl.playerStart.angle;
  player.angleX = 0;
  player.phoneIsBurner = false;
  currentTrackingMultiplier = lvl.trackingMultiplier;
  flickerOn = true; flickerTimer = 0;

  if (levelAmbient) { scene.remove(levelAmbient); levelAmbient = null; }
  for (const l of levelFillLights) scene.remove(l);
  levelFillLights = [];
  if (levelFlickerLight) { scene.remove(levelFlickerLight); levelFlickerLight = null; }

  levelAmbient = new THREE.AmbientLight(lvl.ambientColor, lvl.ambientIntensity);
  scene.add(levelAmbient);

  for (const lDef of (lvl.fillLights || [])) {
    const light = new THREE.PointLight(lDef.color, lDef.intensity, lDef.distance);
    light.position.set(lDef.x * CELL_SIZE, WALL_HEIGHT * 0.7, lDef.z * CELL_SIZE);
    scene.add(light);
    levelFillLights.push(light);
  }

  if (lvl.flickerLight) {
    const fl = lvl.flickerLight;
    levelFlickerLight = new THREE.PointLight(fl.color, fl.intensity, fl.distance);
    levelFlickerLight.position.set(fl.x * CELL_SIZE, WALL_HEIGHT - 0.2, fl.z * CELL_SIZE);
    scene.add(levelFlickerLight);
  }

  clearAgents();
  for (const a of lvl.agents) {
    spawnAgent(a.x * CELL_SIZE, a.z * CELL_SIZE, a.angle, a.route, a);
  }
  clearGroundItems();
  for (const item of lvl.items) {
    spawnGroundItem(item.x * CELL_SIZE, item.z * CELL_SIZE, item.key);
  }

  if (burnerMesh) { scene.remove(burnerMesh); burnerMesh = null; }
  jammerActive = 0; fakeIdReady = false;
}

// ═══════════════════════════════════════════════════════
// Update & Render
// ═══════════════════════════════════════════════════════
let lastTime = 0;
function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  renderer.render(scene, camera);
  updateMinimap();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Mouse look
  player.angleY -= mouseDX * TURN_SPEED;
  player.angleX  = Math.max(-Math.PI/3, Math.min(Math.PI/3, player.angleX - mouseDY * TURN_SPEED));
  mouseDX = 0; mouseDY = 0;

  // Sync camera
  cameraPivot.position.set(player.x, PLAYER_HEIGHT, player.z);
  cameraPivot.rotation.y = player.angleY;
  camera.rotation.x = player.angleX;

  // Subway flicker
  if (currentLevelIndex === 1 && levelFlickerLight) {
    flickerTimer += dt;
    const dur = flickerOn ? 2.5 + Math.random() * 4 : 0.06 + Math.random() * 0.12;
    if (flickerTimer > dur) { flickerOn = !flickerOn; flickerTimer = 0; }
    levelFlickerLight.intensity = flickerOn ? LEVELS[1].flickerLight.intensity : 0;
  }

  if (STATE === 'PLAYING') updatePlaying(dt);
  else if (STATE === 'DROP_MOMENT') { dropMomentTimer += dt; }
  else if (STATE === 'LEVEL_TRANSITION') updateLevelTransition(dt);
  else if (STATE === 'ENDING') updateEnding(dt);
}

function updatePlaying(dt) {
  if (player.invincible > 0) player.invincible -= dt;

  const sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && player.stamina > 0;
  const speed = MOVE_SPEED * (sprinting ? SPRINT_MULT : 1.0);
  if (sprinting) player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN * dt);
  else           player.stamina = Math.min(1, player.stamina + STAMINA_REGEN * dt);

  const fwdX = -Math.sin(player.angleY), fwdZ = -Math.cos(player.angleY);
  const rgtX = -Math.sin(player.angleY - Math.PI/2), rgtZ = -Math.cos(player.angleY - Math.PI/2);

  let dx = 0, dz = 0;
  if (keys['KeyW'] || keys['ArrowUp'])   { dx += fwdX; dz += fwdZ; }
  if (keys['KeyS'] || keys['ArrowDown']) { dx -= fwdX; dz -= fwdZ; }
  if (keys['KeyA'])                      { dx -= rgtX; dz -= rgtZ; }
  if (keys['KeyD'])                      { dx += rgtX; dz += rgtZ; }

  const len = Math.sqrt(dx*dx + dz*dz);
  if (len > 0) { dx /= len; dz /= len; }

  const nx = player.x + dx * speed * dt;
  const nz = player.z + dz * speed * dt;
  if (canMove(nx, player.z)) player.x = nx;
  if (canMove(player.x, nz)) player.z = nz;

  // Sound alerts
  if (sprinting) {
    for (const a of agents) {
      if (a.soundAlert && a.aiState === 'PATROL') {
        const ddx = a.x - player.x, ddz = a.z - player.z;
        if (Math.sqrt(ddx*ddx+ddz*ddz) < CELL_SIZE * 3) {
          a.aiState = 'ALERT'; a.alertTimer = 6.0;
          a.lastKnownX = player.x; a.lastKnownZ = player.z;
        }
      }
    }
  }

  // Tracking
  const agentHasLOS = agents.some(a => a.hasLOS && !a.frozen);
  if (player.hasPhone && !player.phoneDropped) {
    const rate = (player.phoneIsBurner ? TRACKING_BURNER : TRACKING_BASE)
               * currentTrackingMultiplier
               + (agentHasLOS ? TRACKING_LOS : 0);
    player.tracking = Math.min(1, player.tracking + rate * dt);
    if (player.tracking >= 1) { enterEnding('caught'); return; }
  } else if (player.phoneDropped) {
    player.tracking = Math.max(0, player.tracking - TRACKING_DRAIN * dt);
  }

  if (jammerActive > 0) jammerActive = Math.max(0, jammerActive - dt);

  // Item bob
  const t = Date.now() * 0.003;
  for (const gi of groundItems) {
    if (!gi.picked && gi.mesh) {
      gi.mesh.position.y = 0.5 + Math.sin(t + gi.phase) * 0.1;
      gi.mesh.rotation.y += dt * 0.8;
    }
  }
  if (burnerMesh) {
    burnerMesh.position.y = 0.5 + Math.sin(t) * 0.1;
    burnerMesh.rotation.y += dt;
  }

  updateAgents(dt);
  checkPickups();
  checkLevelExit();
  updateHUD();
}

// ═══════════════════════════════════════════════════════
// Agent AI
// ═══════════════════════════════════════════════════════
function computeAgentLOS(agent) {
  const dx = player.x - agent.x, dz = player.z - agent.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  if (dist > AGENT_SIGHT_RANGE) return false;

  // Angle check — agent faces +Z when rotation.y = 0 (Three.js convention)
  // agent.facing is stored as the rotation.y angle
  // Direction agent is looking: (-sin(facing), -cos(facing)) in XZ
  const agentDirX = -Math.sin(agent.facing);
  const agentDirZ = -Math.cos(agent.facing);
  const toDirX = dx / dist, toDirZ = dz / dist;
  const dot = agentDirX * toDirX + agentDirZ * toDirZ;
  if (dot < Math.cos(AGENT_FOV / 2)) return false;

  // Wall check
  const steps = Math.ceil(dist / CELL_SIZE * 5);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const { gx, gz } = worldToGrid(agent.x + dx*t, agent.z + dz*t);
    if (mapAt(gx, gz) > 0) return false;
  }
  return true;
}

function updateAgents(dt) {
  const jFrozen = jammerActive > 0;
  for (const a of agents) {
    if (jFrozen && (a.aiState === 'ALERT' || a.aiState === 'CHASE')) {
      a.frozen = true; a.hasLOS = false; a.moveSpeed = 0;
      animateAgentMesh(a, 0, dt); continue;
    }
    a.frozen = false;
    a.hasLOS = computeAgentLOS(a);

    let targetX = a.x, targetZ = a.z, moveSpd = 0;

    if (a.aiState === 'PATROL') {
      if (a.hasLOS) {
        a.aiState = 'CHASE';
        a.lastKnownX = player.x; a.lastKnownZ = player.z;
      } else if (a.patrolRoute.length > 0) {
        const tgt = a.patrolRoute[a.patrolIndex];
        const ddx = tgt.x - a.x, ddz = tgt.z - a.z;
        if (Math.sqrt(ddx*ddx+ddz*ddz) < 0.3) {
          a.patrolIndex = (a.patrolIndex + 1) % a.patrolRoute.length;
        } else { targetX = tgt.x; targetZ = tgt.z; moveSpd = AGENT_PATROL_SPEED; }
      }
    } else if (a.aiState === 'ALERT') {
      if (a.hasLOS) {
        a.aiState = 'CHASE';
        a.lastKnownX = player.x; a.lastKnownZ = player.z;
      } else {
        a.alertTimer -= dt;
        if (a.alertTimer <= 0) a.aiState = 'PATROL';
        targetX = a.lastKnownX; targetZ = a.lastKnownZ; moveSpd = AGENT_ALERT_SPEED;
        const ddx2 = a.lastKnownX - a.x, ddz2 = a.lastKnownZ - a.z;
        if (Math.sqrt(ddx2*ddx2+ddz2*ddz2) < 0.5) moveSpd = 0;
      }
    } else if (a.aiState === 'CHASE') {
      if (a.hasLOS) { a.lastKnownX = player.x; a.lastKnownZ = player.z; }
      targetX = a.lastKnownX; targetZ = a.lastKnownZ; moveSpd = AGENT_CHASE_SPEED;
      const ddx3 = a.lastKnownX - a.x, ddz3 = a.lastKnownZ - a.z;
      if (!a.hasLOS && Math.sqrt(ddx3*ddx3+ddz3*ddz3) < 0.5) {
        a.aiState = 'ALERT'; a.alertTimer = 5.0; moveSpd = 0;
      }
      const cdx = player.x - a.x, cdz = player.z - a.z;
      if (Math.sqrt(cdx*cdx+cdz*cdz) < AGENT_CONTACT_DIST) playerTakeDamage();
    }

    if (moveSpd > 0) {
      const ddx = targetX - a.x, ddz = targetZ - a.z;
      const dist = Math.sqrt(ddx*ddx+ddz*ddz);
      if (dist > 0.05) {
        const nx2 = ddx/dist, nz2 = ddz/dist;
        a.facing = Math.atan2(-nx2, -nz2); // Three.js Y rotation to face direction
        const newX = a.x + nx2 * moveSpd * dt;
        const newZ = a.z + nz2 * moveSpd * dt;
        if (mapAt(worldToGrid(newX, a.z).gx, worldToGrid(newX, a.z).gz) === 0) a.x = newX;
        if (mapAt(worldToGrid(a.x, newZ).gx, worldToGrid(a.x, newZ).gz) === 0) a.z = newZ;
      }
    }

    a.moveSpeed = moveSpd;
    a.mesh.position.set(a.x, 0, a.z);
    a.mesh.rotation.y = a.facing;
    animateAgentMesh(a, moveSpd, dt);

    const glowLight = a.mesh.children.find(c => c.isPointLight);
    if (glowLight) {
      glowLight.color.setHex(a.aiState === 'CHASE' ? 0xff0000 : a.aiState === 'ALERT' ? 0xff6600 : 0x880000);
      glowLight.intensity = a.aiState === 'CHASE' ? 1.2 : a.aiState === 'ALERT' ? 0.8 : 0.4;
    }
  }
}

function playerTakeDamage() {
  if (player.invincible > 0) return;
  player.health -= 1;
  player.invincible = 2.0;
  const flash = document.getElementById('damage-flash');
  flash.style.background = 'rgba(200,0,0,0.45)';
  setTimeout(() => { flash.style.background = 'rgba(200,0,0,0)'; }, 120);
  if (player.health <= 0) enterEnding('caught');
}

// ═══════════════════════════════════════════════════════
// Pickups & inventory
// ═══════════════════════════════════════════════════════
function checkPickups() {
  for (const gi of groundItems) {
    if (gi.picked) continue;
    const dx = gi.wx - player.x, dz = gi.wz - player.z;
    if (Math.sqrt(dx*dx+dz*dz) < 1.1) {
      gi.picked = true;
      scene.remove(gi.mesh); scene.remove(gi.light);
      const maxes = { burner: 1, jammer: 3, fakeId: 2, distraction: 5 };
      inventory[gi.key] = Math.min((inventory[gi.key] || 0) + 1, maxes[gi.key] || 5);
    }
  }
  if (burnerMesh) {
    const dx = burnerMesh.position.x - player.x, dz = burnerMesh.position.z - player.z;
    if (Math.sqrt(dx*dx+dz*dz) < 1.1) {
      scene.remove(burnerMesh); burnerMesh = null;
      player.hasPhone = true; player.phoneDropped = false;
      player.phoneIsBurner = true; player.tracking = 0.5;
    }
  }
}

function useItem(slotIndex) {
  const key = INVENTORY_KEYS[slotIndex];
  if ((inventory[key] || 0) <= 0) return;
  activeSlot = slotIndex;

  if (key === 'burner') {
    if (player.hasPhone) return;
    player.hasPhone = true; player.phoneDropped = false;
    player.phoneIsBurner = true; player.tracking = 0.5;
    inventory.burner = 0;
  } else if (key === 'jammer') {
    jammerActive = 8.0;
    for (const a of agents) {
      if (a.aiState === 'ALERT' || a.aiState === 'CHASE') a.frozen = true;
    }
    inventory.jammer -= 1;
  } else if (key === 'fakeId') {
    fakeIdReady = true; inventory.fakeId -= 1;
  } else if (key === 'distraction') {
    const throwX = player.x - Math.sin(player.angleY) * CELL_SIZE * 4;
    const throwZ = player.z - Math.cos(player.angleY) * CELL_SIZE * 4;
    let nearest = null, nearestD = Infinity;
    for (const a of agents) {
      if (a.aiState === 'PATROL') {
        const dx = a.x - player.x, dz = a.z - player.z;
        const d = dx*dx + dz*dz;
        if (d < nearestD) { nearestD = d; nearest = a; }
      }
    }
    if (nearest) {
      nearest.aiState = 'ALERT'; nearest.alertTimer = 6.0;
      nearest.lastKnownX = throwX; nearest.lastKnownZ = throwZ;
    }
    inventory.distraction -= 1;
  }
}

function handlePhoneDrop() {
  if (!player.hasPhone || player.phoneDropped) return;
  player.hasPhone = false; player.phoneDropped = true;
  STATE = 'DROP_MOMENT'; dropMomentTimer = 0;

  const bx = player.x - Math.sin(player.angleY) * CELL_SIZE * 1.2;
  const bz = player.z - Math.cos(player.angleY) * CELL_SIZE * 1.2;
  const geo = new THREE.BoxGeometry(0.18, 0.32, 0.06);
  const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.3,
    emissive: 0x4fc3f7, emissiveIntensity: 0.4 });
  burnerMesh = new THREE.Mesh(geo, mat);
  burnerMesh.position.set(bx, 0.5, bz);
  burnerMesh.castShadow = true;
  scene.add(burnerMesh);

  showScreen('loss-screen');
  showHUD(false);
  const items = document.querySelectorAll('#loss-items li');
  items.forEach((li, i) => {
    li.style.opacity = '0';
    setTimeout(() => { li.style.opacity = '1'; }, 300 + i * 400);
  });
  setTimeout(() => { document.getElementById('loss-continue').style.opacity = '1'; }, 3500);
}

function resumeFromLoss() {
  STATE = 'PLAYING';
  showScreen(null);
  showHUD(true);
  renderer.domElement.requestPointerLock();
}

// ═══════════════════════════════════════════════════════
// Level exit
// ═══════════════════════════════════════════════════════
function checkLevelExit() {
  const lvl = LEVELS[currentLevelIndex];
  for (const cp of (lvl.checkpoints || [])) {
    if (cp.passed) continue;
    const cpWx = cp.gx * CELL_SIZE, cpWz = cp.gz * CELL_SIZE;
    const dx = player.x - cpWx, dz = player.z - cpWz;
    if (Math.abs(dx) < CELL_SIZE * 0.9 && Math.abs(dz) < CELL_SIZE * 0.9) {
      if (cp.requiresFakeId && !fakeIdReady) {
        player.x -= dx * 0.15; player.z -= dz * 0.15; return;
      }
      cp.passed = true; if (fakeIdReady) fakeIdReady = false;
    }
  }
  const ex = lvl.exitTrigger;
  const dx = player.x - ex.x, dz = player.z - ex.z;
  if (Math.sqrt(dx*dx+dz*dz) < ex.radius) advanceLevel();
}

function advanceLevel() {
  const nextIdx = currentLevelIndex + 1;
  if (nextIdx >= LEVELS.length) {
    enterEnding(player.hasPhone ? 'escaped_with_phone' : 'escaped_no_phone');
    return;
  }
  const lines = LEVELS[nextIdx].transitionLines;
  document.getElementById('transition-text1').textContent = lines ? lines[0] : '';
  document.getElementById('transition-text2').textContent = lines ? lines[1] : '';
  levelTransitionTimer = 0;
  nextLevelIndex = nextIdx;
  STATE = 'LEVEL_TRANSITION';
  showScreen('transition-screen');
  showHUD(false);
}

function updateLevelTransition(dt) {
  levelTransitionTimer += dt;
  if (levelTransitionTimer >= LEVEL_TRANSITION_DURATION) {
    loadLevel(nextLevelIndex);
    STATE = 'PLAYING';
    showScreen(null);
    showHUD(true);
    renderer.domElement.requestPointerLock();
  }
}

// ═══════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════
function updateHUD() {
  const pct = Math.floor(player.tracking * 100);
  const r = Math.floor(player.tracking * 255);
  const b = Math.floor((1 - player.tracking) * 200);
  const fill = document.getElementById('signal-fill');
  fill.style.width = pct + '%';
  fill.style.background = `rgb(${r},50,${b})`;

  document.getElementById('phone-status').textContent =
    player.hasPhone ? (player.phoneIsBurner ? 'BURNER ACTIVE' : 'PHONE ACTIVE') : '';

  for (let i = 0; i < player.maxHealth; i++) {
    document.getElementById(`hp${i}`).className = 'health-pip' + (i < player.health ? '' : ' empty');
  }

  const sf = document.getElementById('stamina-fill');
  sf.style.width = Math.floor(player.stamina * 100) + '%';
  sf.style.background = player.stamina > 0.2 ? '#546e7a' : '#e57373';

  const counts = [inventory.burner, inventory.jammer, inventory.fakeId, inventory.distraction];
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`slot${i}`);
    slot.querySelector('.item-count').textContent = counts[i];
    slot.className = 'inv-slot' + (i === activeSlot ? ' active' : '') + (counts[i] === 0 ? ' empty' : '');
  }

  const jamInd = document.getElementById('jammer-indicator');
  if (jammerActive > 0) {
    jamInd.style.display = 'block';
    jamInd.textContent = `JAMMER: ${jammerActive.toFixed(1)}s`;
  } else {
    jamInd.style.display = 'none';
  }
}

function updateMinimap() {
  if (!MAP.length) return;
  const canvas = document.getElementById('minimap-canvas');
  const c = canvas.getContext('2d');
  const cW = canvas.width, cH = canvas.height;
  const cellPx = Math.min(cW / MAP_W, cH / MAP_H);
  c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillRect(0, 0, cW, cH);
  for (let z = 0; z < MAP_H; z++) {
    for (let x = 0; x < MAP_W; x++) {
      c.fillStyle = MAP[z * MAP_W + x] > 0 ? '#334' : '#1a1a28';
      c.fillRect(x * cellPx, z * cellPx, cellPx, cellPx);
    }
  }
  const px = (player.x / CELL_SIZE) * cellPx;
  const pz = (player.z / CELL_SIZE) * cellPx;
  c.fillStyle = '#4fc3f7';
  c.beginPath(); c.arc(px, pz, 2.5, 0, Math.PI * 2); c.fill();
  for (const a of agents) {
    c.fillStyle = a.aiState === 'CHASE' ? '#f44' : a.aiState === 'ALERT' ? '#fa0' : '#844';
    const ax = (a.x / CELL_SIZE) * cellPx, az = (a.z / CELL_SIZE) * cellPx;
    c.beginPath(); c.arc(ax, az, 2, 0, Math.PI * 2); c.fill();
  }
}

// ═══════════════════════════════════════════════════════
// Endings
// ═══════════════════════════════════════════════════════
let endingType = '';
let endingTimer = 0;
let endingReturnEnabled = false;

function enterEnding(type) {
  endingType = type; endingTimer = 0; endingReturnEnabled = false;
  STATE = 'ENDING';
  showHUD(false);

  const titleEl = document.getElementById('ending-title');
  const bodyEl  = document.getElementById('ending-body');
  const retEl   = document.getElementById('ending-return');
  retEl.style.opacity = '0';
  bodyEl.innerHTML = '';

  if (type === 'caught') {
    titleEl.style.color = '#e53935';
    titleEl.textContent = 'CAUGHT';
    bodyEl.innerHTML = `<p>In 2025, ICE deported 319,980 people.</p><p>Most had no criminal record.</p>`;
  } else if (type === 'escaped_with_phone') {
    titleEl.style.color = '#4fc3f7';
    titleEl.textContent = 'You made it home.';
    bodyEl.innerHTML = `<p>ICE purchased your location data for $0.0003.</p><p>They know where you are. They always did.</p>`;
  } else if (type === 'escaped_no_phone') {
    titleEl.style.color = '#81c784';
    titleEl.textContent = 'You made it.';
    const losses = [
      'Without your calls.',
      'Without your transit pass.',
      'Without your apps, your records, your digital life.',
      'You are safe. But the cost was everything else.',
      '',
      '"Privacy shouldn\'t cost this much."',
    ];
    bodyEl.innerHTML = losses.map((l, i) =>
      `<p style="opacity:0;transition:opacity 0.5s;transition-delay:${0.8 + i * 0.6}s;${l.startsWith('"') ? 'color:#4fc3f7;font-weight:bold' : ''}">${l || '&nbsp;'}</p>`
    ).join('');
    requestAnimationFrame(() => {
      bodyEl.querySelectorAll('p').forEach(p => { p.style.opacity = '1'; });
    });
  }

  showScreen('ending-screen');
}

function updateEnding(dt) {
  endingTimer += dt;
  if (endingTimer > 5.0 && !endingReturnEnabled) {
    endingReturnEnabled = true;
    document.getElementById('ending-return').style.opacity = '1';
  }
}

function resetGame() {
  player.health = player.maxHealth;
  player.stamina = 1.0;
  player.tracking = 0;
  player.hasPhone = true;
  player.phoneDropped = false;
  player.phoneIsBurner = false;
  player.invincible = 0;
  inventory.burner = 1; inventory.jammer = 0;
  inventory.fakeId = 0; inventory.distraction = 0;
  activeSlot = 0; fakeIdReady = false; jammerActive = 0;
  endingTimer = 0; endingReturnEnabled = false;
  loadLevel(0);
  STATE = 'TITLE';
  showScreen('title-screen');
  showHUD(false);
  if (document.pointerLockElement) document.exitPointerLock();
}

// ═══════════════════════════════════════════════════════
// Screen helpers
// ═══════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
  if (id) document.getElementById(id).classList.remove('hidden');
}
function showHUD(visible) {
  document.getElementById('hud').classList.toggle('hidden', !visible);
}

function startGame() {
  loadLevel(0);
  STATE = 'PLAYING';
  showScreen(null);
  showHUD(true);
  renderer.domElement.requestPointerLock();
}

// ═══════════════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════════════
function initGame() {
  buildTextures();
  buildAgentMaterials();
  loadLevel(0);
  STATE = 'TITLE';
  showScreen('title-screen');
  showHUD(false);
  requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); });
}

window.addEventListener('load', initGame);
