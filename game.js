// game.js — temporary stub to verify canvas setup
const CANVAS_W = 800;
const CANVAS_H = 400;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  const scaleX = window.innerWidth / CANVAS_W;
  const scaleY = window.innerHeight / CANVAS_H;
  const scale = Math.min(scaleX, scaleY);
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.style.width = (CANVAS_W * scale) + 'px';
  canvas.style.height = (CANVAS_H * scale) + 'px';
  canvas.style.position = 'absolute';
  canvas.style.left = ((window.innerWidth - CANVAS_W * scale) / 2) + 'px';
  canvas.style.top = ((window.innerHeight - CANVAS_H * scale) / 2) + 'px';
}

window.addEventListener('resize', resize);
resize();

// Draw a placeholder
ctx.fillStyle = '#0f1117';
ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
ctx.fillStyle = '#4fc3f7';
ctx.font = '20px monospace';
ctx.textAlign = 'center';
ctx.fillText('CANVAS OK', CANVAS_W / 2, CANVAS_H / 2);
