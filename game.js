// ============================================================
// CONSTANTS
// ============================================================
const CANVAS_W = 800;
const CANVAS_H = 400;
const GROUND_Y = 300;
const PLAYER_W = 12;
const PLAYER_H = 28;
const PLAYER_SCREEN_X = 140; // player's preferred screen x position
const LEVEL_WIDTH = 5000;    // total world width in pixels

const COLORS = {
  bg:           '#080a0f',
  sky1:         '#05070d',
  sky2:         '#0a0c16',
  ground:       '#0f1117',
  groundLine:   '#1a1d27',
  groundGrid:   '#0d0f18',
  building:     '#0d0f18',
  buildingEdge: '#1a1d27',
  windowDim:    '#1e3a4a',
  windowLit:    '#4fc3f7',
  player:       '#c9d1d9',
  playerHead:   '#b0bec5',
  phone:        '#4fc3f7',
  ice:          '#ef5350',
  signal:       '#4fc3f7',
  signalDanger: '#ef5350',
  text:         '#c9d1d9',
  textDim:      '#555',
  textFaint:    '#333',
  accent:       '#4fc3f7',
  hudBg:        '#0d0f18',
  hudBorder:    '#1e2030',
};

const State = {
  TITLE:       'title',
  PLAYING:     'playing',
  DROP_MOMENT: 'drop_moment',
  LOSS_SCREEN: 'loss_screen',
  CAUGHT:      'caught',
  ENDING:      'ending',
};

// ============================================================
// GAME VARIABLES (reset on initGame)
// ============================================================
let canvas, ctx;
let gameState = State.TITLE;
let lastTime = 0;

let player, signal, iceAgents, obstacles;
let scrollX;         // how far the world has scrolled left
let hasPhone;        // player currently holding phone
let phoneDropped;    // phone has been dropped at least once
let burnerPickedUp;  // player picked up a burner
let connections;     // max 3, decremented on missed calls
let missedItems;     // string[] — items lost for ending 3
let phoneOnGround;   // { worldX, isBurner } or null
let dropMoment;      // { active, timer, duration, lostItems }
let buildings;       // pre-generated city geometry

const keys = {};

// ============================================================
// INIT
// ============================================================
function initGame() {
  player = {
    x: PLAYER_SCREEN_X,  // screen x
    y: GROUND_Y - PLAYER_H,
    speed: 2.5,
    frame: 0,
    frameTimer: 0,
    frameDuration: 130,
    moving: false,
  };

  signal = {
    value: 0,           // 0.0 – 1.0
    fillRate: 0.00014,  // per ms while holding phone
    drainRate: 0.0001,  // per ms after dropping phone
  };

  iceAgents = [
    { slot: 0 },
    { slot: 1 },
  ];

  obstacles = [
    { type: 'door', worldX: 750,  passed: false, blocked: false, bypassTimer: 0 },
    { type: 'call', worldX: 1350, passed: false, blocked: false },
    { type: 'bus',  worldX: 2150, passed: false, blocked: false, bypassTimer: 0 },
    { type: 'door', worldX: 2850, passed: false, blocked: false, bypassTimer: 0 },
    { type: 'call', worldX: 3500, passed: false, blocked: false },
  ];

  scrollX = 0;
  hasPhone = true;
  phoneDropped = false;
  burnerPickedUp = false;
  connections = 3;
  missedItems = [];
  phoneOnGround = null;
  dropMoment = { active: false, timer: 0, duration: 2600, lostItems: [] };

  buildings = generateBuildings();
}

function generateBuildings() {
  // Deterministic-ish generation using fixed seed pattern
  const blds = [];
  let x = 0;
  // Use a simple LCG for reproducible "random" buildings
  let seed = 42;
  function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }

  while (x < LEVEL_WIDTH + 500) {
    const w = Math.floor(40 + rng() * 80);
    const h = Math.floor(60 + rng() * 140);
    const windows = [];
    for (let wy = h - 18; wy > 12; wy -= 20) {
      for (let wx = 6; wx < w - 6; wx += 14) {
        windows.push({ x: wx, y: wy, lit: rng() < 0.18 });
      }
    }
    blds.push({ x, y: GROUND_Y - h, w, h, windows });
    x += w + 2 + Math.floor(rng() * 8);
  }
  return blds;
}

// ============================================================
// INPUT
// ============================================================
document.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = true;

  if (e.code === 'Space') {
    handleSpacebar();
  }

  if (e.code === 'Enter' || e.code === 'Space') {
    if (gameState === State.TITLE) {
      gameState = State.PLAYING;
    } else if (gameState === State.LOSS_SCREEN) {
      gameState = State.PLAYING;
    } else if (gameState === State.CAUGHT || gameState === State.ENDING) {
      initGame();
      gameState = State.TITLE;
    }
  }
});

document.addEventListener('keyup', (e) => { keys[e.code] = false; });

function handleSpacebar() {
  if (gameState !== State.PLAYING) return;
  if (hasPhone) {
    dropPhone();
  } else if (phoneOnGround) {
    // Pick up burner if player is close enough
    const screenX = phoneOnGround.worldX - scrollX;
    if (Math.abs(screenX - player.x) < 50) {
      pickUpBurner();
    }
  }
}

function dropPhone() {
  hasPhone = false;
  phoneDropped = true;

  // Build list of what will be lost based on unpassed obstacles
  const lost = [];
  obstacles.forEach(obs => {
    if (!obs.passed) {
      if (obs.type === 'door') lost.push('Digital key — locked door ahead');
      if (obs.type === 'call') lost.push('Incoming contact — no way to answer');
      if (obs.type === 'bus')  lost.push('Bus ticket — digital only');
    }
  });
  if (lost.length === 0) lost.push('Your location history');

  dropMoment = {
    active: true,
    timer: 0,
    duration: 2600,
    lostItems: lost,
  };

  // Drop phone just ahead of player in world coordinates
  phoneOnGround = { worldX: player.x + scrollX + 30, isBurner: false };

  gameState = State.DROP_MOMENT;
}

function pickUpBurner() {
  hasPhone = true;
  burnerPickedUp = true;
  phoneOnGround = null;
  signal.value = 0.5; // starts at half
}

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  if (gameState === State.PLAYING) {
    updatePlayer(dt);
    updateSignal(dt);
    checkObstacles(dt);
    checkEndReached();
  } else if (gameState === State.DROP_MOMENT) {
    // Player can still move slowly during drop moment
    updatePlayer(dt);
    dropMoment.timer += dt;
    if (dropMoment.timer >= dropMoment.duration) {
      gameState = State.LOSS_SCREEN;
      // Place burner phone ahead of player for when they continue
      if (!phoneOnGround || !phoneOnGround.isBurner) {
        phoneOnGround = { worldX: scrollX + player.x + 140, isBurner: true };
      }
    }
  }
}

function updatePlayer(dt) {
  player.moving = false;

  const speed = dt * 0.06 * player.speed;

  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.x = Math.max(40, player.x - speed);
    player.moving = true;
  }
  if (keys['ArrowRight'] || keys['KeyD']) {
    player.x += speed;
    player.moving = true;
  }

  // Once player goes past preferred screen x, scroll the world
  if (player.x > PLAYER_SCREEN_X) {
    const excess = player.x - PLAYER_SCREEN_X;
    scrollX += excess;
    player.x = PLAYER_SCREEN_X;
  }

  // Walk animation
  if (player.moving) {
    player.frameTimer += dt;
    if (player.frameTimer >= player.frameDuration) {
      player.frame = (player.frame + 1) % 4;
      player.frameTimer = 0;
    }
  } else {
    player.frame = 0;
    player.frameTimer = 0;
  }
}

function updateSignal(dt) {
  if (hasPhone) {
    signal.value = Math.min(1.0, signal.value + signal.fillRate * dt);
    if (signal.value >= 1.0) {
      gameState = State.CAUGHT;
    }
  } else {
    signal.value = Math.max(0.0, signal.value - signal.drainRate * dt);
  }
}

function checkObstacles(dt) {
  for (const obs of obstacles) {
    if (obs.passed) continue;
    const screenX = obs.worldX - scrollX;

    if (obs.type === 'call') {
      // When player walks into range, auto-resolve
      if (Math.abs(screenX - player.x) < 60) {
        if (!hasPhone && !obs.blocked) {
          obs.blocked = true;
          connections = Math.max(0, connections - 1);
          missedItems.push('family call — unanswered');
        }
        obs.passed = true;
      }
    }

    if (obs.type === 'door' || obs.type === 'bus') {
      if (player.x >= screenX - 12) {
        if (hasPhone) {
          obs.passed = true; // open automatically
        } else {
          // Block movement — player can't pass
          player.x = screenX - 13;
          if (!obs.blocked) {
            obs.blocked = true;
            missedItems.push(obs.type === 'door' ? 'locked door — no digital key' : 'bus stop — no digital ticket');
          }
          // After 4 seconds of being blocked, obstacle gives way (player finds another route)
          obs.bypassTimer = (obs.bypassTimer || 0) + dt;
          if (obs.bypassTimer > 4000) { // 4 seconds in ms
            obs.passed = true;
          }
        }
      }
    }
  }
}

function checkEndReached() {
  // Player's world position approaches end of level
  if (scrollX + player.x >= LEVEL_WIDTH - 200) {
    gameState = State.ENDING;
  }
}

// ============================================================
// DRAW — WORLD
// ============================================================
function draw() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (gameState === State.TITLE) {
    drawTitle();
    return;
  }

  if (gameState === State.CAUGHT) {
    drawCaughtEnding();
    return;
  }

  if (gameState === State.ENDING) {
    drawFinalEnding();
    return;
  }

  // PLAYING, DROP_MOMENT, LOSS_SCREEN all show the world
  drawWorld();
  drawPhoneOnGround();
  drawObstacles();
  drawIceAgents();
  drawPlayer();
  drawHUD();

  if (gameState === State.DROP_MOMENT) {
    drawDropMomentOverlay();
  }

  if (gameState === State.LOSS_SCREEN) {
    drawLossScreen();
  }
}

function drawWorld() {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, COLORS.sky1);
  sky.addColorStop(1, COLORS.sky2);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

  // Buildings
  for (const b of buildings) {
    const sx = b.x - scrollX;
    if (sx + b.w < -10 || sx > CANVAS_W + 10) continue;

    ctx.fillStyle = COLORS.building;
    ctx.fillRect(sx, b.y, b.w, b.h);
    ctx.strokeStyle = COLORS.buildingEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, b.y, b.w, b.h);

    for (const w of b.windows) {
      ctx.fillStyle = w.lit ? COLORS.windowLit : COLORS.windowDim;
      ctx.fillRect(sx + w.x, b.y + w.y, 5, 7);
    }
  }

  // Ground
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
  ctx.strokeStyle = COLORS.groundLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_W, GROUND_Y);
  ctx.stroke();

  // Ground grid lines (subtle texture)
  ctx.strokeStyle = COLORS.groundGrid;
  for (let gx = (-(scrollX % 40) + 40) % 40; gx < CANVAS_W; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(gx, CANVAS_H);
    ctx.stroke();
  }
}

// ============================================================
// DRAW — PLAYER
// ============================================================
function drawPlayer() {
  const x = Math.floor(player.x);
  const y = Math.floor(player.y);

  // Walk animation offsets for legs
  const legOffsets = [0, 4, 0, -4];
  const lo = legOffsets[player.frame];

  // Left leg
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(x - 5, y + 24, 5, 4 + lo);
  // Right leg
  ctx.fillRect(x, y + 24, 5, 4 - lo);
  // Body
  ctx.fillRect(x - 4, y + 8, 8, 16);
  // Head
  ctx.fillStyle = COLORS.playerHead;
  ctx.fillRect(x - 3, y, 6, 7);

  // Phone in hand
  if (hasPhone) {
    ctx.fillStyle = COLORS.phone;
    ctx.fillRect(x + 4, y + 12, 4, 6);
    // Glow
    ctx.shadowColor = COLORS.phone;
    ctx.shadowBlur = 10;
    ctx.fillRect(x + 4, y + 12, 4, 6);
    ctx.shadowBlur = 0;
  }
}

// ============================================================
// DRAW — ICE AGENTS
// ============================================================
function drawIceAgents() {
  const prox = signal.value;

  // Two agents in background-right, drift toward player as signal rises
  const slots = [
    { baseScreenX: CANVAS_W - 70,  baseY: GROUND_Y - 58, scaleBase: 0.45 },
    { baseScreenX: CANVAS_W - 150, baseY: GROUND_Y - 44, scaleBase: 0.35 },
  ];

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const drift = prox * (220 + i * 80);
    const sx = s.baseScreenX - drift;
    const scale = s.scaleBase + prox * 0.55;

    const h = 60 * scale;
    const w = 20 * scale;
    const x = sx;
    const y = GROUND_Y - h;

    ctx.globalAlpha = 0.45 + prox * 0.5;
    ctx.fillStyle = COLORS.ice;

    // Head
    ctx.fillRect(x - w * 0.35, y, w * 0.7, h * 0.22);
    // Body
    ctx.fillRect(x - w * 0.5, y + h * 0.22, w, h * 0.5);
    // Left leg
    ctx.fillRect(x - w * 0.5, y + h * 0.72, w * 0.42, h * 0.28);
    // Right leg
    ctx.fillRect(x + w * 0.08, y + h * 0.72, w * 0.42, h * 0.28);

    // Red glow when close
    if (prox > 0.65) {
      const glowAlpha = (prox - 0.65) / 0.35 * 0.25;
      ctx.globalAlpha = glowAlpha;
      ctx.shadowColor = COLORS.ice;
      ctx.shadowBlur = 20;
      ctx.fillStyle = COLORS.ice;
      ctx.fillRect(x - w * 2, y - h * 0.3, w * 4, h * 1.6);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1.0;
  }
}

// ============================================================
// DRAW — PHONE ON GROUND
// ============================================================
function drawPhoneOnGround() {
  if (!phoneOnGround) return;
  const sx = phoneOnGround.worldX - scrollX;
  if (sx < -20 || sx > CANVAS_W + 20) return;

  const col = phoneOnGround.isBurner ? '#aaaaaa' : COLORS.phone;
  ctx.fillStyle = col;
  ctx.fillRect(sx - 2, GROUND_Y - 9, 5, 8);

  if (phoneOnGround.isBurner) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    ctx.shadowColor = '#aaa';
    ctx.shadowBlur = 8 * pulse;
    ctx.fillRect(sx - 2, GROUND_Y - 9, 5, 8);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#777';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BURNER', sx, GROUND_Y - 13);
    ctx.fillText('[SPACE]', sx, GROUND_Y - 2);
  }
}

// ============================================================
// DRAW — OBSTACLES
// ============================================================
function drawObstacles() {
  for (const obs of obstacles) {
    if (obs.passed) continue;
    const sx = obs.worldX - scrollX;
    if (sx < -30 || sx > CANVAS_W + 30) continue;

    const nearPlayer = Math.abs(sx - player.x) < 80;
    const canPass = hasPhone;

    if (obs.type === 'door') {
      ctx.fillStyle = canPass ? '#0d2a1a' : '#2a0d0d';
      ctx.fillRect(sx - 16, GROUND_Y - 52, 32, 52);
      ctx.strokeStyle = canPass ? COLORS.accent : COLORS.ice;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 16, GROUND_Y - 52, 32, 52);
      // Lock icon (drawn as shapes — no emoji dependency)
      ctx.fillStyle = canPass ? COLORS.accent : COLORS.ice;
      ctx.fillRect(sx - 5, GROUND_Y - 28, 10, 10); // lock body
      ctx.strokeStyle = canPass ? COLORS.accent : COLORS.ice;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, GROUND_Y - 32, 5, Math.PI, 0);
      ctx.stroke();
      if (nearPlayer && !canPass) {
        ctx.fillStyle = COLORS.ice;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO ACCESS', sx, GROUND_Y - 58);
      }
    }

    if (obs.type === 'bus') {
      ctx.fillStyle = '#12141e';
      ctx.fillRect(sx - 28, GROUND_Y - 62, 56, 62);
      ctx.strokeStyle = canPass ? COLORS.accent : COLORS.ice;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 28, GROUND_Y - 62, 56, 62);
      ctx.fillStyle = canPass ? COLORS.accent : COLORS.ice;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BUS', sx, GROUND_Y - 44);
      ctx.fillText(canPass ? 'TICKET OK' : 'NO TICKET', sx, GROUND_Y - 28);
    }

    if (obs.type === 'call' && nearPlayer) {
      const blink = Math.floor(Date.now() / 500) % 2;
      ctx.fillStyle = blink ? '#0d2233' : COLORS.bg;
      ctx.fillRect(sx - 45, GROUND_Y - 102, 90, 32);
      ctx.strokeStyle = canPass ? COLORS.accent : COLORS.ice;
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 45, GROUND_Y - 102, 90, 32);
      ctx.fillStyle = COLORS.text;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(canPass ? 'INCOMING CALL' : 'MISSED CALL', sx, GROUND_Y - 82);
    }
  }
}

// ============================================================
// DRAW — HUD
// ============================================================
function drawHUD() {
  const mx = 20, my = 16, mw = 190, mh = 11;

  // Signal meter background
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = COLORS.hudBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, mw, mh);

  // Signal fill
  const fillW = mw * signal.value;
  ctx.fillStyle = lerpColor(COLORS.signal, COLORS.signalDanger, signal.value);
  ctx.fillRect(mx, my, fillW, mh);

  if (signal.value > 0.7) {
    ctx.shadowColor = COLORS.ice;
    ctx.shadowBlur = 10;
    ctx.fillRect(mx, my, fillW, mh);
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SIGNAL', mx, my - 4);

  // Phone status
  ctx.fillStyle = hasPhone ? COLORS.phone : COLORS.textFaint;
  ctx.font = '10px monospace';
  ctx.fillText(hasPhone ? 'HOLDING PHONE' : 'NO PHONE', mx + mw + 14, my + 9);

  // Connections indicators
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '8px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('CONNECTIONS', CANVAS_W - 20, my - 4);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < connections ? COLORS.accent : COLORS.hudBorder;
    ctx.beginPath();
    ctx.arc(CANVAS_W - 22 - i * 16, my + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Controls hint at bottom
  ctx.fillStyle = COLORS.textFaint;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ARROW KEYS: MOVE     SPACE: DROP PHONE', CANVAS_W / 2, CANVAS_H - 8);
}

// ============================================================
// DRAW — DROP MOMENT OVERLAY
// ============================================================
function drawDropMomentOverlay() {
  const progress = dropMoment.timer / dropMoment.duration;

  ctx.fillStyle = `rgba(0,0,0,${Math.min(0.88, progress * 2.2)})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (progress > 0.25) {
    const alpha = Math.min(1, (progress - 0.25) / 0.3);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DROPPED THE PHONE.', CANVAS_W / 2, CANVAS_H / 2 - 50);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('THE SIGNAL STOPS.', CANVAS_W / 2, CANVAS_H / 2 - 26);
    ctx.fillText('BUT SO DOES EVERYTHING ELSE.', CANVAS_W / 2, CANVAS_H / 2 - 10);

    ctx.globalAlpha = 1.0;
  }
}

// ============================================================
// DRAW — LOSS SCREEN
// ============================================================
function drawLossScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.93)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('YOU DROPPED THE PHONE.', CANVAS_W / 2, 68);
  ctx.fillText('YOU ARE SAFE FROM TRACKING.', CANVAS_W / 2, 88);

  ctx.fillStyle = COLORS.ice;
  ctx.font = '11px monospace';
  ctx.fillText('BUT YOU LOST:', CANVAS_W / 2, 118);

  const lostList = [...dropMoment.lostItems];

  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  lostList.forEach((item, i) => {
    ctx.fillText('— ' + item, CANVAS_W / 2, 142 + i * 18);
  });

  const afterY = 142 + lostList.length * 18 + 24;

  ctx.fillStyle = '#999';
  ctx.font = '11px monospace';
  ctx.fillText('A BURNER PHONE IS ON THE GROUND AHEAD.', CANVAS_W / 2, afterY);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '10px monospace';
  ctx.fillText('PICK IT UP TO STAY CONNECTED.', CANVAS_W / 2, afterY + 18);
  ctx.fillText('YOUR SIGNAL WILL START AT 50%.', CANVAS_W / 2, afterY + 34);

  ctx.fillStyle = COLORS.accent;
  ctx.font = '10px monospace';
  ctx.fillText('[ENTER] CONTINUE', CANVAS_W / 2, CANVAS_H - 30);
}

// ============================================================
// DRAW — TITLE SCREEN
// ============================================================
function drawTitle() {
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Silhouetted buildings
  let seed2 = 7;
  function rng2() { seed2 = (seed2 * 1664525 + 1013904223) & 0xffffffff; return (seed2 >>> 0) / 0xffffffff; }
  for (let i = 0; i < 14; i++) {
    const w = 30 + i * 14;
    const h = 50 + rng2() * 90 + 40;
    const x = i * (CANVAS_W / 13);
    ctx.fillStyle = '#080a10';
    ctx.fillRect(x, GROUND_Y - h, w, h);
  }

  // Ground
  ctx.fillStyle = '#0d0f16';
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

  // ICE silhouettes (distant, barely visible)
  [180, 380, 580, 720].forEach((sx) => {
    ctx.fillStyle = '#180808';
    ctx.fillRect(sx - 7, GROUND_Y - 44, 14, 35);
    ctx.fillRect(sx - 4, GROUND_Y - 58, 8, 15);
  });

  // Title
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 38px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = COLORS.accent;
  ctx.shadowBlur = 16;
  ctx.fillText('DROP YOUR PHONE', CANVAS_W / 2, 138);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px monospace';
  ctx.fillText('a surveillance art piece', CANVAS_W / 2, 166);

  ctx.fillStyle = '#2a2d3e';
  ctx.font = '10px monospace';
  ctx.fillText('ICE agents track immigrants through location data', CANVAS_W / 2, 202);
  ctx.fillText('sold by apps to data brokers. For $0.0003 per record.', CANVAS_W / 2, 218);
  ctx.fillText('You are about to feel what it costs to escape that.', CANVAS_W / 2, 234);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 11px monospace';
  if (Math.floor(Date.now() / 700) % 2) {
    ctx.fillText('PRESS ENTER OR SPACE TO BEGIN', CANVAS_W / 2, 288);
  }

  ctx.fillStyle = COLORS.textFaint;
  ctx.font = '9px monospace';
  ctx.fillText('← → to move   SPACE to drop your phone', CANVAS_W / 2, 314);
}

// ============================================================
// DRAW — CAUGHT ENDING
// ============================================================
function drawCaughtEnding() {
  ctx.fillStyle = '#08000a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const grad = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 40, CANVAS_W/2, CANVAS_H/2, 420);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(239,83,80,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = COLORS.ice;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LOCATED.  DETAINED.', CANVAS_W / 2, CANVAS_H / 2 - 70);

  ctx.fillStyle = '#777';
  ctx.font = '11px monospace';
  ctx.fillText('ICE purchased your real-time location from a data broker.', CANVAS_W / 2, CANVAS_H / 2 - 28);
  ctx.fillText('The data came from an app you installed for free.', CANVAS_W / 2, CANVAS_H / 2 - 10);
  ctx.fillText('The app sold it without telling you.', CANVAS_W / 2, CANVAS_H / 2 + 8);

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px monospace';
  ctx.fillText('"In FY2025, ICE deported 319,980 people.', CANVAS_W / 2, CANVAS_H / 2 + 52);
  ctx.fillText(' Most had no criminal record."', CANVAS_W / 2, CANVAS_H / 2 + 70);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '9px monospace';
  ctx.fillText('— ICE Annual Report / Deportation Data Project, 2025', CANVAS_W / 2, CANVAS_H / 2 + 88);

  ctx.fillStyle = COLORS.textFaint;
  ctx.font = '10px monospace';
  ctx.fillText('[ENTER] TRY AGAIN', CANVAS_W / 2, CANVAS_H - 28);
}

// ============================================================
// DRAW — FINAL ENDING (escape with or without phone)
// ============================================================
function drawFinalEnding() {
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (hasPhone) {
    // Ending 2: escaped with phone
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = COLORS.accent;
    ctx.shadowBlur = 10;
    ctx.fillText('YOU MADE IT HOME.', CANVAS_W / 2, 110);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('ICE purchased your location data from a data broker.', CANVAS_W / 2, 158);
    ctx.fillText('The broker purchased it from an app on your phone.', CANVAS_W / 2, 176);
    ctx.fillText('You installed the app for free.', CANVAS_W / 2, 194);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('Your location was sold for $0.0003 per record.', CANVAS_W / 2, 232);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '10px monospace';
    ctx.fillText('You are safe tonight.', CANVAS_W / 2, 262);
    ctx.fillText('But the data is still out there.', CANVAS_W / 2, 278);
    ctx.fillText('And there is still no federal law to stop this.', CANVAS_W / 2, 294);

  } else {
    // Ending 3: escaped without phone (or with burner after dropping)
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ESCAPED THE SIGNAL.', CANVAS_W / 2, 88);

    ctx.fillStyle = COLORS.ice;
    ctx.font = '12px monospace';
    ctx.fillText('BUT YOU PAID FOR IT.', CANVAS_W / 2, 116);

    const items = [...missedItems];
    if (connections < 3) items.unshift(`${3 - connections} family call(s) — unanswered`);
    items.push("Your daughter's school called twice.");
    items.push("Your lawyer couldn't reach you.");

    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    items.forEach((item, i) => {
      ctx.fillText('— ' + item, CANVAS_W / 2, 148 + i * 18);
    });

    const bottomY = 148 + items.length * 18 + 22;
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('"Privacy shouldn\'t cost this much."', CANVAS_W / 2, bottomY);

    ctx.fillStyle = '#3a3d4e';
    ctx.font = '10px monospace';
    ctx.fillText('For millions of immigrants, this is not a game.', CANVAS_W / 2, bottomY + 24);
    ctx.fillText('It is every day.', CANVAS_W / 2, bottomY + 40);
  }

  ctx.fillStyle = COLORS.textFaint;
  ctx.font = '10px monospace';
  ctx.fillText('[ENTER] PLAY AGAIN', CANVAS_W / 2, CANVAS_H - 28);
}

// ============================================================
// HELPERS
// ============================================================
function lerpColor(a, b, t) {
  // Parse hex colors and interpolate
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab2 = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb2 = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab2 + (bb2 - ab2) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b2.toString(16).padStart(2,'0')}`;
}

// ============================================================
// GAME LOOP
// ============================================================
function gameLoop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 50); // cap delta at 50ms
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// ============================================================
// ENTRY POINT
// ============================================================
function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  function resize() {
    const scaleX = window.innerWidth / CANVAS_W;
    const scaleY = window.innerHeight / CANVAS_H;
    const scale = Math.min(scaleX, scaleY);
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    canvas.style.width  = (CANVAS_W * scale) + 'px';
    canvas.style.height = (CANVAS_H * scale) + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = ((window.innerWidth  - CANVAS_W * scale) / 2) + 'px';
    canvas.style.top  = ((window.innerHeight - CANVAS_H * scale) / 2) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  initGame();
  requestAnimationFrame((ts) => { lastTime = ts; gameLoop(ts); });
}

window.addEventListener('load', init);
