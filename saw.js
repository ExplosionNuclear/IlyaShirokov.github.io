const canvas = document.getElementById("saw");
const ctx = canvas.getContext("2d");

function key(x, y) { return `${x},${y}`; }

function randomColor() {
  // Nice bright-ish HSL color
  const h = Math.floor(Math.random() * 360);
  const s = 85;
  const l = 60;
  return `hsl(${h} ${s}% ${l}%)`;
}

function generateSAW(maxSteps) {
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
    if (options.length === 0) break; // stuck
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

  const pad = 24;
  const scale = Math.max(2, Math.floor(Math.min(
    (canvas.width - 2*pad) / w,
    (canvas.height - 2*pad) / h
  )));
  const ox = Math.floor((canvas.width  - scale*w)/2) - scale*minX;
  const oy = Math.floor((canvas.height - scale*h)/2) - scale*minY;
  return { scale, ox, oy };
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Settings
const MAX_STEPS = 900;          // length of each walk
const FPS = 60;                // drawing speed
const PAUSE_MS = 700;          // pause between runs
const BG_ALPHA = 0.00;         // set to >0 if you want motion trails

let path = [];
let t = 0;
let raf = null;
let fit = null;
let stroke = randomColor();

function draw(upto) {
  if (BG_ALPHA > 0) {
    ctx.fillStyle = `rgba(0,0,0,${BG_ALPHA})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  } else {
    clear();
  }

  fit = fit || fitToCanvas(path);
  const { scale, ox, oy } = fit;

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

  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function loop() {
  // advance by ~1 step per frame (can tweak)
  t += 1;
  draw(t);

  if (t < path.length - 1) {
    raf = requestAnimationFrame(loop);
  } else {
    // finished: restart after a short pause
    setTimeout(startNewRun, PAUSE_MS);
  }
}

function startNewRun() {
  cancelAnimationFrame(raf);
  t = 0;
  fit = null;
  stroke = randomColor();
  path = generateSAW(MAX_STEPS);

  // optional: clear once at start so each run is clean
  clear();

  raf = requestAnimationFrame(loop);
}

startNewRun();
