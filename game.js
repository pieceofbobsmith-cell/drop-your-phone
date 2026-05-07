// Drop Your Phone — FPS Edition
// ============================================================
// Constants
// ============================================================
const CANVAS_W = 800, CANVAS_H = 400;
const HALF_H = CANVAS_H / 2;
const FOV = Math.PI / 3;
const NUM_RAYS = CANVAS_W;
const HALF_FOV = FOV / 2;
const RAY_STEP = FOV / NUM_RAYS;
const MAX_DEPTH = 16;
const CELL_SIZE = 1;

// ============================================================
// Game state
// ============================================================
let STATE = 'TITLE';

// ============================================================
// Canvas setup
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// ============================================================
// Input
// ============================================================
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && STATE === 'PLAYING') handleSpacebar();
  if ((e.code === 'Space' || e.code === 'Enter') && (STATE === 'ENDING' || STATE === 'DEAD') && endingTimer > 5.0) resetGame();
  if ((e.code === 'Space' || e.code === 'Enter') && STATE === 'TITLE') { loadLevel(0); STATE = 'PLAYING'; }
  if (e.code === 'Digit1' && STATE === 'PLAYING') useItem(0);
  if (e.code === 'Digit2' && STATE === 'PLAYING') useItem(1);
  if (e.code === 'Digit3' && STATE === 'PLAYING') useItem(2);
  if (e.code === 'Digit4' && STATE === 'PLAYING') useItem(3);
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ============================================================
// Timing
// ============================================================
let lastTime = 0;
function gameLoop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (STATE === 'PLAYING') updatePlaying(dt);
  else if (STATE === 'DROP_MOMENT') updateDropMoment(dt);
  else if (STATE === 'LOSS_SCREEN') updateLossScreen(dt);
  else if (STATE === 'LEVEL_TRANSITION') updateLevelTransition(dt);
  else if (STATE === 'DEAD') updateDead(dt);
  else if (STATE === 'TITLE') { /* input handled in keydown */ }
  else if (STATE === 'ENDING') endingTimer += dt;
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  if (STATE === 'PLAYING') {
    castRays();
    drawSprites();
    drawHUD();
    if (player.invincible > 0 && Math.floor(player.invincible * 6) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,100,100,0.25)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  } else if (STATE === 'DROP_MOMENT') {
    castRays();
    drawSprites();
    drawHUD();
    ctx.fillStyle = 'rgba(0,0,50,0.4)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  } else if (STATE === 'LOSS_SCREEN') {
    renderLossScreen();
  } else if (STATE === 'LEVEL_TRANSITION') {
    renderLevelTransition();
  } else if (STATE === 'TITLE') {
    renderTitle();
  } else if (STATE === 'ENDING') {
    renderEnding();
  } else if (STATE === 'DEAD') {
    renderDead();
  }
}

// ============================================================
// Player
// ============================================================
const player = {
  x: 2.5, y: 2.5,
  angle: 0,
  health: 3,
  maxHealth: 3,
  stamina: 1.0,
  invincible: 0,
  hasPhone: true,
  phoneDropped: false,
  phoneIsBurner: false,
  tracking: 0,
};

// ============================================================
// Map helpers
// ============================================================
let MAP = [];
let MAP_W = 0, MAP_H = 0;

function mapAt(x, y) {
  const gx = Math.floor(x), gy = Math.floor(y);
  if (gx < 0 || gx >= MAP_W || gy < 0 || gy >= MAP_H) return 1;
  return MAP[gy * MAP_W + gx];
}

// ============================================================
// Textures
// ============================================================
const TEX_SIZE = 64;
const textures = {};

function buildTextures() {
  function makeTexture(drawFn) {
    const oc = document.createElement('canvas');
    oc.width = TEX_SIZE; oc.height = TEX_SIZE;
    drawFn(oc.getContext('2d'));
    return oc;
  }

  textures.brick = makeTexture(c => {
    c.fillStyle = '#1a0a00';
    c.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    const bH = 8, bW = 16;
    for (let row = 0; row < TEX_SIZE / bH; row++) {
      const offset = (row % 2) * (bW / 2);
      for (let col = -1; col < TEX_SIZE / bW + 1; col++) {
        const x = col * bW + offset, y = row * bH;
        const sh = 70 + Math.floor(Math.random() * 40);
        c.fillStyle = `rgb(${sh},${Math.floor(sh*0.4)},${Math.floor(sh*0.2)})`;
        c.fillRect(x + 1, y + 1, bW - 2, bH - 2);
      }
    }
  });

  textures.concrete = makeTexture(c => {
    c.fillStyle = '#2a2a2a';
    c.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    for (let i = 0; i < 300; i++) {
      const sh = 30 + Math.floor(Math.random() * 30);
      c.fillStyle = `rgb(${sh},${sh},${sh})`;
      c.fillRect(Math.random() * TEX_SIZE, Math.random() * TEX_SIZE, 2, 2);
    }
    c.strokeStyle = '#111'; c.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(Math.random() * TEX_SIZE, Math.random() * TEX_SIZE);
      for (let s = 0; s < 4; s++) c.lineTo(Math.random() * TEX_SIZE, Math.random() * TEX_SIZE);
      c.stroke();
    }
  });

  textures.tile = makeTexture(c => {
    c.fillStyle = '#d8d8e0';
    c.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    const ts = 16;
    c.strokeStyle = '#b0b0b8'; c.lineWidth = 1;
    for (let i = 0; i <= TEX_SIZE; i += ts) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, TEX_SIZE); c.stroke();
      c.beginPath(); c.moveTo(0, i); c.lineTo(TEX_SIZE, i); c.stroke();
    }
    for (let i = 0; i < 6; i++) {
      c.fillStyle = 'rgba(140,140,160,0.25)';
      c.fillRect(Math.random() * TEX_SIZE, Math.random() * TEX_SIZE, 4 + Math.random() * 10, 3 + Math.random() * 8);
    }
  });
}

// ============================================================
// Raycasting
// ============================================================
const zBuffer = new Float32Array(800);
let currentWallTex = null;
let currentCeilColor = '#1a1a2e';
let currentFloorColor = '#111118';
let currentTrackingMultiplier = 1.0;
let flickerTimer = 0;
let flickerOn = true;

function castRays() {
  const startAngle = player.angle - HALF_FOV;
  for (let col = 0; col < NUM_RAYS; col++) {
    const rayAngle = startAngle + col * RAY_STEP;
    const cosA = Math.cos(rayAngle);
    const sinA = Math.sin(rayAngle);

    let mapX = Math.floor(player.x);
    let mapY = Math.floor(player.y);

    const deltaDistX = Math.abs(1 / (cosA || 1e-10));
    const deltaDistY = Math.abs(1 / (sinA || 1e-10));

    let stepX, stepY, sideDistX, sideDistY;
    if (cosA < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
    else           { stepX =  1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
    if (sinA < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
    else           { stepY =  1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

    let hit = false, side = 0;
    for (let i = 0; i < MAX_DEPTH * 10 && !hit; i++) {
      if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
      else                        { sideDistY += deltaDistY; mapY += stepY; side = 1; }
      if (mapAt(mapX, mapY) > 0) hit = true;
    }

    let depth = side === 0
      ? (mapX - player.x + (1 - stepX) / 2) / cosA
      : (mapY - player.y + (1 - stepY) / 2) / sinA;
    depth = Math.abs(depth);
    zBuffer[col] = depth;

    const wallH = Math.min(CANVAS_H, Math.floor(CANVAS_H / (depth || 0.001)));
    const wallTop = Math.floor(HALF_H - wallH / 2);

    // Ceiling
    const ceilShade = (currentLevelIndex === 1 && !flickerOn) ? '#040404' : currentCeilColor;
    ctx.fillStyle = ceilShade;
    ctx.fillRect(col, 0, 1, wallTop);

    // Wall
    if (currentWallTex) {
      let wallX;
      if (side === 0) wallX = player.y + depth * sinA;
      else            wallX = player.x + depth * cosA;
      wallX -= Math.floor(wallX);
      const tx = Math.min(Math.floor(wallX * TEX_SIZE), TEX_SIZE - 1);
      const sideDim = side === 1 ? 0.7 : 1.0;
      drawTexturedStrip(currentWallTex, tx, wallH, wallTop, col, depth * sideDim);
    } else {
      const brightness = Math.max(0, 1 - depth / MAX_DEPTH);
      const shade = side === 1 ? brightness * 0.6 : brightness;
      const r = Math.floor(shade * 160);
      ctx.fillStyle = `rgb(${r},${r},${Math.floor(shade * 180)})`;
      ctx.fillRect(col, wallTop, 1, wallH);
    }

    // Floor
    ctx.fillStyle = currentFloorColor;
    ctx.fillRect(col, wallTop + wallH, 1, CANVAS_H - wallTop - wallH);
  }
}

function drawTexturedStrip(tex, tx, wallH, wallTop, col, depth) {
  const brightness = Math.max(0.15, 1 - depth / MAX_DEPTH);
  const srcData = tex.getContext('2d').getImageData(tx, 0, 1, TEX_SIZE).data;
  const imgData = ctx.createImageData(1, wallH);
  for (let y = 0; y < wallH; y++) {
    const ty = Math.floor((y / wallH) * TEX_SIZE);
    const s = ty * 4, d = y * 4;
    imgData.data[d]   = Math.min(255, srcData[s]   * brightness);
    imgData.data[d+1] = Math.min(255, srcData[s+1] * brightness);
    imgData.data[d+2] = Math.min(255, srcData[s+2] * brightness);
    imgData.data[d+3] = 255;
  }
  ctx.putImageData(imgData, col, wallTop);
}

// ============================================================
// Sprites
// ============================================================
const sprites = [];

function drawSprites() {
  const sorted = sprites
    .filter(s => !s.picked)
    .map(s => ({ ...s, dist: (s.x - player.x) ** 2 + (s.y - player.y) ** 2 }))
    .sort((a, b) => b.dist - a.dist);

  for (const sp of sorted) {
    const dx = sp.x - player.x;
    const dy = sp.y - player.y;

    const camDirX = Math.cos(player.angle);
    const camDirY = Math.sin(player.angle);
    const camPlaneX = Math.sin(player.angle);
    const camPlaneY = -Math.cos(player.angle);

    const invDet = 1.0 / (camPlaneX * camDirY - camDirX * camPlaneY);
    const transformX = invDet * (camDirY * dx - camDirX * dy);
    const transformY = invDet * (-camPlaneY * dx + camPlaneX * dy);

    if (transformY <= 0.1) continue;

    const activeCanvas = (sp.type === 'agent')
      ? agentSprites[getAgentSpriteIndex(sp.x, sp.y, sp.facing || 0)]
      : sp.canvas;
    if (!activeCanvas) continue;

    const screenX = Math.floor((CANVAS_W / 2) * (1 + transformX / transformY));
    const spriteH = Math.abs(Math.floor(CANVAS_H / transformY));
    const spriteW = Math.floor(spriteH * activeCanvas.width / activeCanvas.height);

    const drawStartX = Math.max(0, Math.floor(screenX - spriteW / 2));
    const drawEndX   = Math.min(CANVAS_W - 1, Math.floor(screenX + spriteW / 2));
    const drawStartY = Math.max(0, Math.floor(HALF_H - spriteH / 2));
    const drawEndY   = Math.min(CANVAS_H - 1, Math.floor(HALF_H + spriteH / 2));

    for (let col = drawStartX; col <= drawEndX; col++) {
      if (transformY >= zBuffer[col]) continue;
      const texX = Math.floor((col - (screenX - spriteW / 2)) / spriteW * activeCanvas.width);
      ctx.drawImage(activeCanvas, texX, 0, 1, activeCanvas.height, col, drawStartY, 1, drawEndY - drawStartY);
    }
  }
}

// ============================================================
// ICE Agent Sprites — 8 pre-rendered angles
// ============================================================
const AGENT_SPRITE_SIZE = 128;
const agentSprites = [];

function buildAgentSprites() {
  for (let i = 0; i < 8; i++) {
    const oc = document.createElement('canvas');
    oc.width = AGENT_SPRITE_SIZE;
    oc.height = AGENT_SPRITE_SIZE;
    drawAgentAngle(oc.getContext('2d'), i);
    agentSprites.push(oc);
  }
}

function drawAgentAngle(c, idx) {
  const S = AGENT_SPRITE_SIZE;
  c.clearRect(0, 0, S, S);
  const cx = S / 2;
  const gY = S - 4;

  const isFront = idx === 0 || idx === 1 || idx === 7;
  const isSide  = idx === 2 || idx === 6;
  const isBack  = idx >= 3 && idx <= 5;

  // Legs
  c.fillStyle = '#1a1a2e';
  if (isSide) {
    c.fillRect(cx - 10, gY - 44, 12, 22);
    c.fillRect(cx - 6,  gY - 22, 12, 22);
  } else {
    c.fillRect(cx - 14, gY - 44, 11, 44);
    c.fillRect(cx + 3,  gY - 44, 11, 44);
  }

  // Boots
  c.fillStyle = '#0a0a0a';
  if (isSide) { c.fillRect(cx - 14, gY - 8, 22, 8); }
  else { c.fillRect(cx - 16, gY - 8, 13, 8); c.fillRect(cx + 3, gY - 8, 13, 8); }

  // Torso/vest
  const tW = isSide ? 20 : 34;
  c.fillStyle = '#1c2340';
  c.fillRect(cx - tW / 2, gY - 82, tW, 40);
  // Vest details
  if (!isBack) {
    c.fillStyle = '#2a3456';
    c.fillRect(cx - tW/2, gY - 82, 6, 40);
    c.fillRect(cx - 7, gY - 74, 14, 12);
  }

  // Badge
  if (!isBack) {
    c.fillStyle = '#c8a000';
    c.fillRect(cx - 18, gY - 80, 11, 8);
    c.fillStyle = '#ffd700';
    c.fillRect(cx - 17, gY - 79, 9, 6);
    c.fillStyle = '#000';
    c.font = 'bold 4px monospace';
    c.fillText('ICE', cx - 16, gY - 74);
  }

  // Arms
  c.fillStyle = '#1a1a2e';
  if (isFront) {
    c.fillRect(cx - 26, gY - 80, 12, 32);
    c.fillRect(cx + 14, gY - 80, 12, 32);
  } else if (isSide) {
    c.fillRect(cx - 22, gY - 78, 9, 28);
    c.fillRect(cx + 8,  gY - 72, 9, 20);
  } else {
    c.fillRect(cx - 26, gY - 80, 12, 32);
    c.fillRect(cx + 14, gY - 80, 12, 32);
  }

  // Neck
  c.fillStyle = '#c4956a';
  c.fillRect(cx - 6, gY - 92, 12, 12);

  // Helmet shell
  c.fillStyle = '#1c2340';
  c.beginPath();
  c.ellipse(cx, gY - 102, 18, 15, 0, Math.PI, 0);
  c.fill();
  c.fillRect(cx - 18, gY - 104, 36, 14);

  // Visor
  c.fillStyle = '#080e1c';
  c.fillRect(cx - 15, gY - 100, 30, 12);
  c.fillStyle = 'rgba(80,130,255,0.35)';
  c.fillRect(cx - 13, gY - 99, 26, 4);

  // Helmet straps
  c.fillStyle = '#111';
  c.fillRect(cx - 17, gY - 94, 4, 7);
  c.fillRect(cx + 13, gY - 94, 4, 7);

  // Helmet label
  if (isFront) {
    c.fillStyle = '#4fc3f7';
    c.font = 'bold 7px monospace';
    c.fillText('ICE', cx - 10, gY - 107);
  }

  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.beginPath();
  c.ellipse(cx, gY, 18, 5, 0, 0, Math.PI * 2);
  c.fill();
}

function getAgentSpriteIndex(agentX, agentY, agentAngle) {
  const dx = player.x - agentX;
  const dy = player.y - agentY;
  const angleToPlayer = Math.atan2(dy, dx);
  let diff = angleToPlayer - agentAngle;
  while (diff < 0) diff += Math.PI * 2;
  while (diff >= Math.PI * 2) diff -= Math.PI * 2;
  return Math.floor((diff + Math.PI / 8) / (Math.PI / 4)) % 8;
}

// ============================================================
// Item Icons
// ============================================================
const itemIcons = {};

function buildItemIcons() {
  function icon(fn) {
    const oc = document.createElement('canvas'); oc.width = 32; oc.height = 32;
    fn(oc.getContext('2d')); return oc;
  }
  itemIcons.burner = icon(c => {
    c.fillStyle = '#333'; c.fillRect(8, 4, 16, 24);
    c.fillStyle = '#4fc3f7'; c.fillRect(10, 7, 12, 14);
    c.fillStyle = '#666'; c.fillRect(13, 24, 6, 2);
  });
  itemIcons.jammer = icon(c => {
    c.fillStyle = '#555'; c.fillRect(6, 12, 20, 14);
    c.fillStyle = '#888'; c.fillRect(10, 6, 3, 8); c.fillRect(19, 4, 3, 10);
    c.fillStyle = '#f44'; c.fillRect(14, 15, 4, 4);
  });
  itemIcons.fakeId = icon(c => {
    c.fillStyle = '#e8d5a3'; c.fillRect(4, 8, 24, 16);
    c.fillStyle = '#555'; c.fillRect(6, 11, 8, 8);
    c.fillStyle = '#888'; c.fillRect(17, 13, 9, 2); c.fillRect(17, 17, 6, 2);
  });
  itemIcons.distraction = icon(c => {
    c.fillStyle = '#888'; c.beginPath(); c.arc(16, 16, 10, 0, Math.PI*2); c.fill();
    c.fillStyle = '#aaa'; c.beginPath(); c.arc(13, 12, 4, 0, Math.PI*2); c.fill();
    c.fillStyle = '#555'; c.fillRect(14, 4, 4, 4);
  });
}

// ============================================================
// Inventory
// ============================================================
const inventory = { burner: 1, jammer: 0, fakeId: 0, distraction: 0 };
const INVENTORY_KEYS = ['burner', 'jammer', 'fakeId', 'distraction'];
let activeSlot = 0;
let jammerActive = 0;

// ============================================================
// HUD
// ============================================================
function drawHUD() {
  // Signal meter
  const mW = 200, mH = 16, mX = 10, mY = 10;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(mX - 2, mY - 2, mW + 4, mH + 4);
  const t = player.tracking;
  ctx.fillStyle = `rgb(${Math.floor(t*255)},50,${Math.floor((1-t)*200)})`;
  ctx.fillRect(mX, mY, Math.floor(mW * t), mH);
  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.fillText('SIGNAL', mX, mY + mH + 12);
  if (player.hasPhone && !player.phoneDropped) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(player.phoneIsBurner ? 'BURNER ACTIVE' : 'PHONE ACTIVE', mX + 70, mY + mH + 12);
  }

  // Health
  for (let i = 0; i < player.maxHealth; i++) {
    ctx.fillStyle = i < player.health ? '#e53935' : '#2a1010';
    ctx.fillRect(CANVAS_W - 90 + i * 28, 10, 22, 22);
    if (i < player.health) {
      ctx.fillStyle = '#ffaaaa';
      ctx.fillRect(CANVAS_W - 90 + i * 28 + 9, 13, 4, 16);
      ctx.fillRect(CANVAS_W - 90 + i * 28 + 5, 17, 12, 4);
    }
  }

  // Stamina bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(CANVAS_W - 92, 36, 86, 8);
  ctx.fillStyle = player.stamina > 0.2 ? '#78909c' : '#e57373';
  ctx.fillRect(CANVAS_W - 92, 36, Math.floor(86 * player.stamina), 8);

  // Inventory slots
  const slotSz = 44;
  for (let i = 0; i < 4; i++) {
    const sx = 10 + i * (slotSz + 6), sy = CANVAS_H - slotSz - 10;
    const key = INVENTORY_KEYS[i];
    ctx.fillStyle = i === activeSlot ? 'rgba(79,195,247,0.25)' : 'rgba(0,0,0,0.7)';
    ctx.fillRect(sx, sy, slotSz, slotSz);
    ctx.strokeStyle = i === activeSlot ? '#4fc3f7' : '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, slotSz, slotSz);
    const ic = [itemIcons.burner, itemIcons.jammer, itemIcons.fakeId, itemIcons.distraction][i];
    if (ic) {
      ctx.globalAlpha = inventory[key] > 0 ? 1.0 : 0.25;
      ctx.drawImage(ic, sx + 6, sy + 6, 32, 32);
      ctx.globalAlpha = 1.0;
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
    ctx.fillText(inventory[key], sx + slotSz - 12, sy + slotSz - 4);
    ctx.fillStyle = '#666'; ctx.font = '9px monospace';
    ctx.fillText((i+1).toString(), sx + 3, sy + 12);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '9px monospace';
  ctx.fillText('WASD:move  ←→:turn  SHIFT:sprint  SPACE:drop phone  1-4:items', CANVAS_W/2 - 195, CANVAS_H - 8);

  // Minimap
  drawMinimap();

  // Jammer overlay
  if (jammerActive > 0) {
    ctx.fillStyle = 'rgba(0,255,0,0.07)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`JAMMER: ${jammerActive.toFixed(1)}s`, 10, CANVAS_H - 60);
  }
}

function drawMinimap() {
  if (!MAP.length) return;
  const mmX = CANVAS_W - 105, mmY = 50, cellPx = 4;
  const mmW = MAP_W * cellPx, mmH = MAP_H * cellPx;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      ctx.fillStyle = MAP[y * MAP_W + x] > 0 ? '#445' : '#1a1a28';
      ctx.fillRect(mmX + x * cellPx, mmY + y * cellPx, cellPx, cellPx);
    }
  }
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(mmX + Math.floor(player.x * cellPx) - 1, mmY + Math.floor(player.y * cellPx) - 1, 3, 3);
  for (const sp of sprites) {
    if (sp.type !== 'agent' || sp.picked) continue;
    ctx.fillStyle = sp.aiState === 'CHASE' ? '#f44' : sp.aiState === 'ALERT' ? '#fa0' : '#f88';
    ctx.fillRect(mmX + Math.floor(sp.x * cellPx) - 1, mmY + Math.floor(sp.y * cellPx) - 1, 3, 3);
  }
}

// ============================================================
// Player movement constants
// ============================================================
const MOVE_SPEED    = 3.0;
const SPRINT_MULT   = 2.0;
const TURN_SPEED    = 2.2;
const STAMINA_DRAIN = 0.4;
const STAMINA_REGEN = 0.25;
const TRACKING_FILL_BASE   = 0.012;
const TRACKING_FILL_LOS    = 0.045;
const TRACKING_FILL_BURNER = 0.006;
const TRACKING_DRAIN       = 0.008;

function updatePlaying(dt) {
  if (player.invincible > 0) player.invincible -= dt;

  const sprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && player.stamina > 0;
  const speed = MOVE_SPEED * (sprinting ? SPRINT_MULT : 1.0);

  if (sprinting) player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN * dt);
  else           player.stamina = Math.min(1, player.stamina + STAMINA_REGEN * dt);

  if (keys['ArrowLeft']  || keys['KeyA']) player.angle -= TURN_SPEED * dt;
  if (keys['ArrowRight'] || keys['KeyD']) player.angle += TURN_SPEED * dt;

  const mvX = Math.cos(player.angle) * speed * dt;
  const mvY = Math.sin(player.angle) * speed * dt;
  if (keys['KeyW'] || keys['ArrowUp']) {
    if (mapAt(player.x + mvX, player.y) === 0) player.x += mvX;
    if (mapAt(player.x, player.y + mvY) === 0) player.y += mvY;
  }
  if (keys['KeyS'] || keys['ArrowDown']) {
    if (mapAt(player.x - mvX, player.y) === 0) player.x -= mvX;
    if (mapAt(player.x, player.y - mvY) === 0) player.y -= mvY;
  }
  const stX = Math.cos(player.angle + Math.PI/2) * speed * dt;
  const stY = Math.sin(player.angle + Math.PI/2) * speed * dt;
  if (keys['KeyQ']) {
    if (mapAt(player.x - stX, player.y) === 0) player.x -= stX;
    if (mapAt(player.x, player.y - stY) === 0) player.y -= stY;
  }
  if (keys['KeyE']) {
    if (mapAt(player.x + stX, player.y) === 0) player.x += stX;
    if (mapAt(player.x, player.y + stY) === 0) player.y += stY;
  }

  // Tracking meter
  const agentHasLOS = agents.some(a => a.hasLOS && !a.frozen);
  if (player.hasPhone && !player.phoneDropped) {
    const fillRate = (player.phoneIsBurner ? TRACKING_FILL_BURNER : TRACKING_FILL_BASE)
                   * currentTrackingMultiplier
                   + (agentHasLOS ? TRACKING_FILL_LOS : 0);
    player.tracking = Math.min(1, player.tracking + fillRate * dt);
    if (player.tracking >= 1) { enterEnding('caught'); return; }
  } else if (player.phoneDropped) {
    player.tracking = Math.max(0, player.tracking - TRACKING_DRAIN * dt);
  }

  // Sound alerts from sprinting
  if (sprinting) {
    for (const agent of agents) {
      if (agent.soundAlert && agent.aiState === 'PATROL') {
        const dx = agent.x - player.x, dy = agent.y - player.y;
        if (Math.sqrt(dx*dx+dy*dy) < 3.0) {
          agent.aiState = 'ALERT';
          agent.alertTimer = 6.0;
          agent.lastKnownX = player.x;
          agent.lastKnownY = player.y;
        }
      }
    }
  }

  // Jammer timer
  if (jammerActive > 0) jammerActive = Math.max(0, jammerActive - dt);

  // Subway flicker
  if (currentLevelIndex === 1) {
    flickerTimer += dt;
    const flickerDur = flickerOn ? 3.0 + Math.random() * 4 : 0.08 + Math.random() * 0.15;
    if (flickerTimer > flickerDur) { flickerOn = !flickerOn; flickerTimer = 0; }
  }

  updateAgents(dt);
  checkPickups();
  checkLevelExit();
}

// Phone drop
let dropMomentTimer = 0;
let lossScreenTimer = 0;
let burnerOnGround = null;

function handleSpacebar() {
  if (!player.hasPhone || player.phoneDropped) return;
  player.phoneDropped = true;
  player.hasPhone = false;
  STATE = 'DROP_MOMENT';
  dropMomentTimer = 0;
  burnerOnGround = {
    x: player.x + Math.cos(player.angle) * 1.2,
    y: player.y + Math.sin(player.angle) * 1.2,
    canvas: itemIcons.burner,
    type: 'item',
    itemKey: 'burner_on_ground',
  };
  sprites.push(burnerOnGround);
}

function updateDropMoment(dt) {
  dropMomentTimer += dt;
  const slowDt = dt * 0.15;
  if (keys['ArrowLeft']  || keys['KeyA']) player.angle -= TURN_SPEED * slowDt;
  if (keys['ArrowRight'] || keys['KeyD']) player.angle += TURN_SPEED * slowDt;
  const mvX = Math.cos(player.angle) * MOVE_SPEED * slowDt;
  const mvY = Math.sin(player.angle) * MOVE_SPEED * slowDt;
  if (keys['KeyW'] || keys['ArrowUp']) {
    if (mapAt(player.x + mvX, player.y) === 0) player.x += mvX;
    if (mapAt(player.x, player.y + mvY) === 0) player.y += mvY;
  }
  if (dropMomentTimer >= 2.5) { STATE = 'LOSS_SCREEN'; lossScreenTimer = 0; }
}

function updateLossScreen(dt) {
  lossScreenTimer += dt;
  if (lossScreenTimer > 4.0 && (keys['Space'] || keys['Enter'] || lossScreenTimer > 9.0)) {
    STATE = 'PLAYING';
  }
}

function playerTakeDamage() {
  if (player.invincible > 0) return;
  player.health -= 1;
  player.invincible = 2.0;
  if (player.health <= 0) enterDead();
}

// ============================================================
// Agent AI
// ============================================================
const agents = [];
const AGENT_PATROL_SPEED = 1.2;
const AGENT_CHASE_SPEED  = 2.5;
const AGENT_ALERT_SPEED  = 1.8;
const AGENT_CONTACT_DIST = 0.65;
const AGENT_FOV          = Math.PI / 2;
const AGENT_SIGHT_RANGE  = 6;

function makeAgent(x, y, facingAngle, patrolRoute, opts) {
  const agent = {
    x, y, facing: facingAngle,
    type: 'agent',
    aiState: 'PATROL',
    patrolRoute: patrolRoute || [],
    patrolIndex: 0,
    alertTimer: 0,
    lastKnownX: x, lastKnownY: y,
    hasLOS: false,
    frozen: false,
    soundAlert: opts && opts.soundAlert,
    chaseOnSight: opts && opts.chaseOnSight,
  };
  sprites.push(agent);
  agents.push(agent);
  return agent;
}

function agentHasLOS(agent) {
  const dx = player.x - agent.x, dy = player.y - agent.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > AGENT_SIGHT_RANGE) return false;
  const atp = Math.atan2(dy, dx);
  let diff = atp - agent.facing;
  while (diff < -Math.PI) diff += Math.PI*2;
  while (diff >  Math.PI) diff -= Math.PI*2;
  if (Math.abs(diff) > AGENT_FOV/2) return false;
  const steps = Math.ceil(dist * 6);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (mapAt(agent.x + dx*t, agent.y + dy*t) > 0) return false;
  }
  return true;
}

function updateAgents(dt) {
  const jFrozen = jammerActive > 0;
  for (const agent of agents) {
    if (jFrozen && (agent.aiState === 'ALERT' || agent.aiState === 'CHASE')) {
      agent.frozen = true; agent.hasLOS = false; continue;
    }
    agent.frozen = false;
    agent.hasLOS = agentHasLOS(agent);

    if (agent.aiState === 'PATROL') {
      if (agent.hasLOS) {
        agent.aiState = agent.chaseOnSight ? 'CHASE' : 'CHASE';
        agent.lastKnownX = player.x; agent.lastKnownY = player.y;
      } else {
        patrolMove(agent, dt);
      }
    } else if (agent.aiState === 'ALERT') {
      if (agent.hasLOS) {
        agent.aiState = 'CHASE';
        agent.lastKnownX = player.x; agent.lastKnownY = player.y;
      } else {
        agent.alertTimer -= dt;
        if (agent.alertTimer <= 0) agent.aiState = 'PATROL';
        moveToward(agent, agent.lastKnownX, agent.lastKnownY, AGENT_ALERT_SPEED, dt);
      }
    } else if (agent.aiState === 'CHASE') {
      if (agent.hasLOS) {
        agent.lastKnownX = player.x; agent.lastKnownY = player.y;
      }
      const dx = agent.lastKnownX - agent.x, dy = agent.lastKnownY - agent.y;
      if (!agent.hasLOS && Math.sqrt(dx*dx+dy*dy) < 0.3) {
        agent.aiState = 'ALERT'; agent.alertTimer = 5.0;
      } else {
        moveToward(agent, agent.lastKnownX, agent.lastKnownY, AGENT_CHASE_SPEED, dt);
      }
      const cdx = player.x - agent.x, cdy = player.y - agent.y;
      if (Math.sqrt(cdx*cdx+cdy*cdy) < AGENT_CONTACT_DIST) playerTakeDamage();
    }
  }
}

function patrolMove(agent, dt) {
  if (!agent.patrolRoute || agent.patrolRoute.length === 0) return;
  const tgt = agent.patrolRoute[agent.patrolIndex];
  const dx = tgt.x - agent.x, dy = tgt.y - agent.y;
  const dist = Math.sqrt(dx*dx+dy*dy);
  if (dist < 0.2) { agent.patrolIndex = (agent.patrolIndex+1) % agent.patrolRoute.length; return; }
  const nx = dx/dist, ny = dy/dist;
  agent.facing = Math.atan2(ny, nx);
  const nx2 = agent.x + nx*AGENT_PATROL_SPEED*dt;
  const ny2 = agent.y + ny*AGENT_PATROL_SPEED*dt;
  if (mapAt(nx2, agent.y) === 0) agent.x = nx2;
  if (mapAt(agent.x, ny2) === 0) agent.y = ny2;
}

function moveToward(agent, tx, ty, speed, dt) {
  const dx = tx - agent.x, dy = ty - agent.y;
  const dist = Math.sqrt(dx*dx+dy*dy);
  if (dist < 0.05) return;
  const nx = dx/dist, ny = dy/dist;
  agent.facing = Math.atan2(ny, nx);
  const nx2 = agent.x + nx*speed*dt;
  const ny2 = agent.y + ny*speed*dt;
  if (mapAt(nx2, agent.y) === 0) agent.x = nx2;
  if (mapAt(agent.x, ny2) === 0) agent.y = ny2;
}

// ============================================================
// Ground items / pickups
// ============================================================
const groundItems = [];
let fakeIdReady = false;

function spawnItem(x, y, itemKey) {
  const iconMap = { burner: itemIcons.burner, jammer: itemIcons.jammer, fakeId: itemIcons.fakeId, distraction: itemIcons.distraction };
  const item = { x, y, canvas: iconMap[itemKey], type: 'item', itemKey, picked: false };
  groundItems.push(item);
  sprites.push(item);
  return item;
}

function checkPickups() {
  for (const item of groundItems) {
    if (item.picked) continue;
    const dx = item.x - player.x, dy = item.y - player.y;
    if (Math.sqrt(dx*dx+dy*dy) < 0.65) {
      item.picked = true;
      const idx = sprites.indexOf(item);
      if (idx !== -1) sprites.splice(idx, 1);
      if (item.itemKey === 'burner_on_ground') {
        player.hasPhone = true;
        player.phoneDropped = false;
        player.phoneIsBurner = true;
        player.tracking = Math.min(player.tracking, 0.5);
        burnerOnGround = null;
      } else {
        const maxes = { burner: 1, jammer: 3, fakeId: 2, distraction: 5 };
        inventory[item.itemKey] = Math.min((inventory[item.itemKey] || 0) + 1, maxes[item.itemKey] || 5);
      }
    }
  }
}

function useItem(slotIndex) {
  const key = INVENTORY_KEYS[slotIndex];
  if (inventory[key] <= 0) return;
  activeSlot = slotIndex;

  if (key === 'burner') {
    if (player.hasPhone) return;
    player.hasPhone = true;
    player.phoneDropped = false;
    player.phoneIsBurner = true;
    player.tracking = Math.min(player.tracking, 0.5);
    inventory.burner = 0;
  } else if (key === 'jammer') {
    jammerActive = 8.0;
    for (const agent of agents) {
      if (agent.aiState === 'ALERT' || agent.aiState === 'CHASE') agent.frozen = true;
    }
    inventory.jammer -= 1;
  } else if (key === 'fakeId') {
    fakeIdReady = true;
    inventory.fakeId -= 1;
  } else if (key === 'distraction') {
    throwDistraction();
    inventory.distraction -= 1;
  }
}

function throwDistraction() {
  const throwX = player.x + Math.cos(player.angle) * 4;
  const throwY = player.y + Math.sin(player.angle) * 4;
  let nearest = null, nearestDist = Infinity;
  for (const agent of agents) {
    if (agent.aiState === 'PATROL') {
      const dx = agent.x - player.x, dy = agent.y - player.y;
      const d = dx*dx + dy*dy;
      if (d < nearestDist) { nearestDist = d; nearest = agent; }
    }
  }
  if (nearest) {
    nearest.aiState = 'ALERT';
    nearest.alertTimer = 6.0;
    nearest.lastKnownX = throwX;
    nearest.lastKnownY = throwY;
  }
}

// ============================================================
// Level definitions
// ============================================================
let currentLevelIndex = 0;
let levelTransitionText = '';
let levelTransitionTimer = 0;
let nextLevelIndex = 0;
const LEVEL_TRANSITION_DURATION = 5.0;

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
    wallTex: 'brick',
    ceilColor: '#0a0a14',
    floorColor: '#111118',
    playerStart: { x: 1.5, y: 1.5, angle: 0 },
    agents: [
      { x: 6.0, y: 5.0, angle: 0, route: [{x:6,y:5},{x:6,y:2},{x:10,y:2},{x:10,y:5}] },
      { x: 12.0, y: 7.0, angle: Math.PI, route: [{x:12,y:7},{x:12,y:3},{x:8,y:3},{x:8,y:7}] },
    ],
    items: [
      { x: 3.5, y: 7.5, key: 'jammer' },
      { x: 8.5, y: 8.5, key: 'distraction' },
      { x: 11.5, y: 8.5, key: 'distraction' },
    ],
    checkpoints: [{ x: 9, y: 5, requiresFakeId: true, requiresPhone: true, passed: false }],
    exitTrigger: { x: 14.5, y: 1.5, radius: 0.9 },
    trackingMultiplier: 1.0,
    transitionText: null,
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
    wallTex: 'concrete',
    ceilColor: '#080808',
    floorColor: '#0d0d10',
    playerStart: { x: 1.5, y: 1.5, angle: 0 },
    agents: [
      { x: 5.0, y: 3.0, angle: 0, route: [{x:5,y:3},{x:5,y:8},{x:9,y:8},{x:9,y:3}] },
      { x: 8.0, y: 5.0, angle: Math.PI, route: [], opts: { soundAlert: true } },
      { x: 10.0, y: 9.0, angle: 0, route: [], opts: { soundAlert: true } },
    ],
    items: [
      { x: 3.5, y: 9.5, key: 'burner' },
      { x: 7.5, y: 2.5, key: 'fakeId' },
      { x: 11.5, y: 5.5, key: 'jammer' },
    ],
    checkpoints: [],
    exitTrigger: { x: 12.5, y: 10.5, radius: 0.9 },
    trackingMultiplier: 1.0,
    transitionText: "You made it underground.\nBut ICE bought your subway tap data from a data broker.",
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
    wallTex: 'tile',
    ceilColor: '#dcdce8',
    floorColor: '#ccccd8',
    playerStart: { x: 1.5, y: 1.5, angle: 0 },
    agents: [
      { x: 5.0, y: 4.0, angle: 0, route: [{x:5,y:4},{x:5,y:10},{x:12,y:10},{x:12,y:4}] },
      { x: 12.0, y: 7.0, angle: Math.PI, route: [{x:12,y:7},{x:8,y:7},{x:8,y:11},{x:12,y:11}] },
      { x: 8.0, y: 5.0, angle: 0, route: [], opts: { chaseOnSight: true } },
      { x: 14.5, y: 12.5, angle: Math.PI, route: [] },
    ],
    items: [
      { x: 3.5, y: 11.5, key: 'jammer' },
      { x: 9.5, y: 3.5, key: 'distraction' },
    ],
    checkpoints: [],
    exitTrigger: { x: 14.5, y: 12.5, radius: 0.9 },
    trackingMultiplier: 3.0,
    transitionText: "You reached the building.\nICE has a $1 billion Palantir contract to find you.",
  },
];

function loadLevel(index) {
  currentLevelIndex = index;
  const lvl = LEVELS[index];

  agents.length = 0;
  groundItems.length = 0;
  sprites.length = 0;

  MAP = lvl.map;
  MAP_W = lvl.mapW;
  MAP_H = lvl.mapH;

  currentWallTex = textures[lvl.wallTex];
  currentCeilColor = lvl.ceilColor;
  currentFloorColor = lvl.floorColor;

  player.x = lvl.playerStart.x;
  player.y = lvl.playerStart.y;
  player.angle = lvl.playerStart.angle;
  player.phoneIsBurner = false;
  currentTrackingMultiplier = lvl.trackingMultiplier;
  flickerOn = true; flickerTimer = 0;

  for (const a of lvl.agents) {
    makeAgent(a.x, a.y, a.angle, a.route, a.opts);
  }
  for (const item of lvl.items) {
    spawnItem(item.x, item.y, item.key);
  }

  burnerOnGround = null;
  jammerActive = 0;
  fakeIdReady = false;

  // Reset checkpoint passed flags
  for (const cp of (lvl.checkpoints || [])) cp.passed = false;
}

function checkLevelExit() {
  const lvl = LEVELS[currentLevelIndex];

  for (const cp of (lvl.checkpoints || [])) {
    if (cp.passed) continue;
    const dx = player.x - cp.x, dy = player.y - cp.y;
    if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) {
      if (cp.requiresFakeId && !fakeIdReady) {
        // Push player back
        if (dx > 0) player.x = cp.x + 0.85;
        else player.x = cp.x - 0.85;
        return;
      }
      cp.passed = true;
      if (fakeIdReady) fakeIdReady = false;
    }
  }

  const ex = lvl.exitTrigger;
  const dx = player.x - ex.x, dy = player.y - ex.y;
  if (Math.sqrt(dx*dx+dy*dy) < ex.radius) {
    advanceLevel();
  }
}

function advanceLevel() {
  const nextIdx = currentLevelIndex + 1;
  if (nextIdx >= LEVELS.length) {
    enterEnding(player.hasPhone ? 'escaped_with_phone' : 'escaped_no_phone');
    return;
  }
  levelTransitionText = LEVELS[nextIdx].transitionText || '';
  levelTransitionTimer = 0;
  nextLevelIndex = nextIdx;
  STATE = 'LEVEL_TRANSITION';
}

function updateLevelTransition(dt) {
  levelTransitionTimer += dt;
  if (levelTransitionTimer >= LEVEL_TRANSITION_DURATION) {
    loadLevel(nextLevelIndex);
    STATE = 'PLAYING';
  }
}

function renderLevelTransition() {
  const alpha = Math.min(1, levelTransitionTimer / 0.8);
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  const lines = levelTransitionText.split('\n');
  lines.forEach((line, i) => {
    const la = Math.max(0, Math.min(1, (levelTransitionTimer - 0.5 - i * 0.3) / 0.6));
    ctx.fillStyle = `rgba(79,195,247,${la})`;
    ctx.font = (i === 0 ? 'bold 18px' : '14px') + ' monospace';
    ctx.fillText(line, CANVAS_W/2, CANVAS_H/2 - (lines.length-1)*18 + i*36);
  });
  if (levelTransitionTimer > 3.0) {
    ctx.fillStyle = `rgba(150,150,150,${Math.min(1,(levelTransitionTimer-3.0)/0.5)})`;
    ctx.font = '11px monospace';
    ctx.fillText('continuing...', CANVAS_W/2, CANVAS_H*0.8);
  }
  ctx.textAlign = 'left';
}

// ============================================================
// Endings & state screens
// ============================================================
let endingType = '';
let endingTimer = 0;
let deadTimer = 0;

function enterEnding(type) {
  endingType = type;
  endingTimer = 0;
  STATE = 'ENDING';
}

function enterDead() {
  STATE = 'DEAD';
  deadTimer = 0;
}

function updateDead(dt) {
  deadTimer += dt;
  if (deadTimer > 6.0 && (keys['Space'] || keys['Enter'] || deadTimer > 14.0)) resetGame();
}

function resetGame() {
  player.health = player.maxHealth;
  player.stamina = 1.0;
  player.tracking = 0;
  player.hasPhone = true;
  player.phoneDropped = false;
  player.phoneIsBurner = false;
  player.invincible = 0;
  inventory.burner = 1;
  inventory.jammer = 0;
  inventory.fakeId = 0;
  inventory.distraction = 0;
  fakeIdReady = false;
  jammerActive = 0;
  endingTimer = 0;
  deadTimer = 0;
  loadLevel(0);
  STATE = 'TITLE';
}

function renderTitle() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 36px monospace';
  ctx.fillText('DROP YOUR PHONE', CANVAS_W/2, CANVAS_H/2 - 70);
  ctx.fillStyle = '#e53935';
  ctx.font = '13px monospace';
  ctx.fillText('An expressive piece about surveillance, data brokers, and ICE deportation.', CANVAS_W/2, CANVAS_H/2 - 30);
  ctx.fillStyle = '#888';
  ctx.font = '11px monospace';
  ctx.fillText('WASD / Arrow keys to move and turn  |  SHIFT to sprint  |  SPACE to drop phone  |  1-4 to use items', CANVAS_W/2, CANVAS_H/2 + 10);
  ctx.fillStyle = '#aaa';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('Press SPACE or ENTER to begin', CANVAS_W/2, CANVAS_H/2 + 52);
  ctx.fillStyle = '#444';
  ctx.font = '10px monospace';
  ctx.fillText('"In 2025, ICE deported 319,980 people. Most had no criminal record."', CANVAS_W/2, CANVAS_H - 20);
  ctx.textAlign = 'left';
}

const LOSS_ITEMS = [
  'Your calls with family',
  'Your digital transit pass',
  'Your bank app access',
  'Your job application status',
  'Your prescription refill',
  'Your child\'s school login',
];

function renderLossScreen() {
  const alpha = Math.min(1, lossScreenTimer / 0.8);
  ctx.fillStyle = `rgba(0,0,0,${alpha * 0.96})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.font = 'bold 20px monospace';
  ctx.fillText('You dropped the phone.', CANVAS_W/2, 60);
  ctx.font = '13px monospace';
  ctx.fillStyle = `rgba(180,180,180,${alpha})`;
  ctx.fillText('What you just gave up:', CANVAS_W/2, 96);
  LOSS_ITEMS.forEach((item, i) => {
    const delay = 0.3 + i * 0.4;
    const ia = Math.max(0, Math.min(1, (lossScreenTimer - delay) / 0.4)) * alpha;
    ctx.fillStyle = `rgba(229,57,53,${ia})`;
    ctx.font = '12px monospace';
    ctx.fillText(`— ${item}`, CANVAS_W/2, 126 + i * 24);
  });
  if (lossScreenTimer > 3.5) {
    ctx.fillStyle = `rgba(79,195,247,${Math.min(1,(lossScreenTimer-3.5)/0.5)})`;
    ctx.font = '11px monospace';
    ctx.fillText('A burner phone is on the ground ahead.  Press SPACE to continue.', CANVAS_W/2, CANVAS_H - 28);
  }
  ctx.textAlign = 'left';
}

function renderDead() {
  ctx.fillStyle = '#080000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const alpha = Math.min(1, deadTimer / 1.5);
  ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(229,57,53,${alpha})`;
  ctx.font = 'bold 32px monospace';
  ctx.fillText('CAUGHT', CANVAS_W/2, CANVAS_H/2 - 50);
  ctx.fillStyle = `rgba(200,200,200,${alpha})`;
  ctx.font = '13px monospace';
  ctx.fillText('In 2025, ICE deported 319,980 people.', CANVAS_W/2, CANVAS_H/2 + 10);
  ctx.fillText('Most had no criminal record.', CANVAS_W/2, CANVAS_H/2 + 34);
  if (deadTimer > 4.0) {
    ctx.fillStyle = `rgba(130,130,130,${Math.min(1,(deadTimer-4.0)/0.5)})`;
    ctx.font = '11px monospace';
    ctx.fillText('Press SPACE to return to title', CANVAS_W/2, CANVAS_H - 24);
  }
  ctx.textAlign = 'left';
}

function renderEnding() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const alpha = Math.min(1, endingTimer / 1.5);
  ctx.textAlign = 'center';

  if (endingType === 'caught') {
    ctx.fillStyle = `rgba(229,57,53,${alpha})`;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CAUGHT', CANVAS_W/2, CANVAS_H/2 - 60);
    ctx.fillStyle = `rgba(200,200,200,${alpha})`;
    ctx.font = '13px monospace';
    ctx.fillText('In 2025, ICE deported 319,980 people.', CANVAS_W/2, CANVAS_H/2);
    ctx.fillText('Most had no criminal record.', CANVAS_W/2, CANVAS_H/2 + 24);
  } else if (endingType === 'escaped_with_phone') {
    ctx.fillStyle = `rgba(79,195,247,${alpha})`;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('You made it home.', CANVAS_W/2, CANVAS_H/2 - 60);
    ctx.fillStyle = `rgba(200,200,200,${alpha})`;
    ctx.font = '13px monospace';
    ctx.fillText('ICE purchased your location data for $0.0003.', CANVAS_W/2, CANVAS_H/2);
    ctx.fillText('They know where you are. They always did.', CANVAS_W/2, CANVAS_H/2 + 24);
  } else if (endingType === 'escaped_no_phone') {
    ctx.fillStyle = `rgba(140,200,140,${alpha})`;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('You made it.', CANVAS_W/2, CANVAS_H/2 - 90);
    const lines = [
      'Without your calls. Without your card.',
      'Without your apps, your records, your digital life.',
      'You are safe. But the cost was everything else.',
      '',
      '"Privacy shouldn\'t cost this much."',
    ];
    lines.forEach((line, i) => {
      const la = Math.max(0, Math.min(1, (endingTimer - 1.5 - i*0.7) / 0.5));
      ctx.fillStyle = line.startsWith('"') ? `rgba(79,195,247,${la})` : `rgba(200,200,200,${la})`;
      ctx.font = line.startsWith('"') ? `bold 14px monospace` : `13px monospace`;
      ctx.fillText(line, CANVAS_W/2, CANVAS_H/2 - 40 + i * 28);
    });
  }

  if (endingTimer > 5.0) {
    ctx.fillStyle = `rgba(130,130,130,${Math.min(1,(endingTimer-5.0)/0.5)})`;
    ctx.font = '11px monospace';
    ctx.fillText('Press SPACE to return to title', CANVAS_W/2, CANVAS_H - 20);
  }
  ctx.textAlign = 'left';
}

// ============================================================
// Entry point
// ============================================================
function initGame() {
  buildTextures();
  buildAgentSprites();
  buildItemIcons();
  loadLevel(0);
  STATE = 'TITLE';
  requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(gameLoop); });
}

window.addEventListener('load', initGame);
