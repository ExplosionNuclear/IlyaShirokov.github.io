const canvas = document.getElementById("saw");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restart");
const stepsInput = document.getElementById("steps");
const speedInput = document.getElementById("speed");

function key(x, y) { return `${x},${y}`; }

function generateSAW(maxSteps) {
  // Simple kinetic growth: at each step choose uniformly among free neighbors.
  // If stuck, stop early.
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  let x = 0, y = 0;
  const path = [[0,0]];
  const used = new Set([key(0,0)]);

  for (let i = 0; i < maxSteps; i++) {
    const options = [];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (!used.has(key(nx, ny))) options.push([nx, ny]);
    }
    if (options.length === 0) break;
    const [nx, ny] = options[(Math.random() * options.length) | 0];
    x = nx; y = ny;
    used.add(key(x,y));
    path.push([x,y]);
  }
  return path;
}

function fitToCanvas(path) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x,y] of path) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  const pad = 20;
  const scale = Math.max(2, Math.floor(Math.min(
    (canvas.width - 2*pad) / w,
    (canvas.height - 2*pad) / h
  )));
  const ox = Math.floor((canvas.width  - scale*w)/2) - scale*minX;
  const oy = Math.floor((canvas.height - scale*h)/2) - scale*minY;
  return { scale, ox, oy };
}

let path = [];
let t = 0;
let raf = null;
let fit = null;

function clear() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function drawFrame(upto) {
  clear();

  // grid points
  fit = fit || fitToCanvas(path);
  const { scale, ox, oy } = fit;

  // line
  ctx.lineWidth = Math.max(1, Math.floor(scale / 3));
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  for (let i = 0; i <= upto && i < path.length; i++) {
    const [x,y] = path[i];
    const px = ox + x*scale;
    const py = oy + y*scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "rgba(125,211,252,0.95)";
  ctx.stroke();

  // head dot
  if (upto >= 0) {
    const [hx, hy] = path[Math.min(upto, path.length-1)];
    const px = ox + hx*scale, py = oy + hy*scale;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, Math.floor(scale/2.2)), 0, Math.PI*2);
    ctx.fillStyle = "rgba(167,139,250,0.95)";
    ctx.fill();
  }

  // text
  ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
  ctx.fillStyle = "rgba(229,231,235,0.8)";
  ctx.fillText(`steps drawn: ${Math.min(upto, path.length-1)} / ${path.length-1}`, 12, 18);
}

function loop() {
  const speed = parseInt(speedInput.value, 10); // frames per second target-ish
  const stepPerFrame = Math.max(1, Math.floor(60 / Math.max(1, speed)));
  t += stepPerFrame;

  drawFrame(t);

  if (t < path.length-1) raf = requestAnimationFrame(loop);
}

function start() {
  cancelAnimationFrame(raf);
  t = 0;
  fit = null;
  const maxSteps = parseInt(stepsInput.value, 10);
  path = generateSAW(maxSteps);
  drawFrame(0);
  raf = requestAnimationFrame(loop);
}

restartBtn.addEventListener("click", start);
start();
