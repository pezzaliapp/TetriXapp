// TetriXapp — Vanilla JS PWA (hotfix)
// © 2025 PezzaliAPP — MIT License

(() => {
  'use strict';

  // Canvas setup with DPR scaling
  const canvas = document.getElementById('game');
  const nextCanvas = document.getElementById('next');
  const ctx = canvas.getContext('2d');
  const nctx = nextCanvas.getContext('2d');
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const COLS = 10, ROWS = 20, SIZE = 30;
  canvas.width = COLS * SIZE * DPR;
  canvas.height = ROWS * SIZE * DPR;
  canvas.style.width = (COLS * SIZE) + 'px';
  canvas.style.height = (ROWS * SIZE) + 'px';
  ctx.scale(DPR, DPR);

  const NEXT_SIZE = 4 * SIZE;
  nextCanvas.width = NEXT_SIZE * DPR;
  nextCanvas.height = NEXT_SIZE * DPR;
  nextCanvas.style.width = NEXT_SIZE + 'px';
  nextCanvas.style.height = NEXT_SIZE + 'px';
  nctx.scale(DPR, DPR);

  // Colors per tetromino
  const COLORS = {
    I: '#60a5fa',
    J: '#93c5fd',
    L: '#f59e0b',
    O: '#fbbf24',
    S: '#22c55e',
    T: '#a78bfa',
    Z: '#ef4444'
  };

  // Shapes
  const SHAPES = {
    I: [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0],
    ],
    J: [
      [1,0,0],
      [1,1,1],
      [0,0,0],
    ],
    L: [
      [0,0,1],
      [1,1,1],
      [0,0,0],
    ],
    O: [
      [1,1],
      [1,1],
    ],
    S: [
      [0,1,1],
      [1,1,0],
      [0,0,0],
    ],
    T: [
      [0,1,0],
      [1,1,1],
      [0,0,0],
    ],
    Z: [
      [1,1,0],
      [0,1,1],
      [0,0,0],
    ],
  };

  // 7-bag randomizer
  class Bag {
    constructor(){ this.bag = []; }
    next(){
      if (this.bag.length === 0) {
        this.bag = Object.keys(SHAPES);
        for (let i = this.bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
      }
      return this.bag.pop();
    }
  }
  const bag = new Bag();

  // Arena (board)
  function createMatrix(w, h){
    return Array.from({length:h}, () => Array(w).fill(0));
  }
  const arena = createMatrix(COLS, ROWS);

  // Safer rotate that also works for rectangular matrices
  function rotate(matrix){
    const h = matrix.length;
    const w = matrix[0].length;
    const res = Array.from({length:w}, () => Array(h).fill(0));
    for (let y=0;y<h;y++){
      for (let x=0;x<w;x++){
        res[x][h-1-y] = matrix[y][x];
      }
    }
    return res;
  }

  // Explicit collision with bounds + existing cells
  function collide(arena, piece){
    const m = piece.matrix;
    const o = piece.pos;
    for (let y=0; y<m.length; y++){
      for (let x=0; x<m[y].length; x++){
        if (!m[y][x]) continue;
        const ax = o.x + x;
        const ay = o.y + y;
        // bounds: left/right/bottom block movement
        if (ax < 0 || ax >= COLS || ay >= ROWS) return true;
        // top outside is allowed while spawning (ay < 0)
        if (ay >= 0 && arena[ay][ax]) return true;
      }
    }
    return false;
  }

  function merge(arena, piece){
    piece.matrix.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val && piece.pos.y + y >= 0){
          arena[piece.pos.y + y][piece.pos.x + x] = piece.color;
        }
      });
    });
  }

  function clearLines(){
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y >= 0; y--){
      for (let x = 0; x < arena[y].length; x++){
        if (arena[y][x] === 0) continue outer;
      }
      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      y++;
      rowCount++;
    }
    return rowCount;
  }

  function createPiece(type){
    return {
      type,
      matrix: SHAPES[type].map(row => row.slice()),
      color: COLORS[type],
      pos: {x: 0, y: 0},
    };
  }

  let dropCounter = 0;
  let dropInterval = 1000;
  let lastTime = 0;

  let score = 0, lines = 0, level = 1, best = +localStorage.getItem('tetrixapp_best') || 0;

  const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    color: '#fff',
    type: null,
    next: createPiece(bag.next()),
  };

  function playerReset(){
    const t = bag.next();
    player.matrix = SHAPES[t].map(r => r.slice());
    player.type = t;
    player.color = COLORS[t];
    player.pos.y = 0;
    player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length/2) | 0);
    if (collide(arena, player)) {
      for (let y=0;y<arena.length;y++) arena[y].fill(0);
      score = 0; lines = 0; level = 1; dropInterval = 1000;
      updateHUD();
    }
    player.next = createPiece(bag.next());
    drawNext();
  }

  function drawCell(x, y, color){
    const s = SIZE;
    ctx.fillStyle = color;
    ctx.fillRect(x*s, y*s, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x*s+2, y*s+2, s-4, s-4);
  }

  function draw(){
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, COLS*SIZE, ROWS*SIZE);

    // arena
    for (let y=0;y<arena.length;y++){
      for (let x=0;x<arena[y].length;x++){
        const v = arena[y][x];
        if (v) drawCell(x,y,v);
      }
    }

    // ghost
    const gy = ghostDropY();
    drawPiece(player, gy, true);

    // current
    drawPiece(player, player.pos.y, false);
  }

  function drawPiece(p, yOverride, ghost){
    const {matrix, pos, color} = p;
    const yBase = yOverride != null ? yOverride : pos.y;
    for (let y=0;y<matrix.length;y++){
      for (let x=0;x<matrix[y].length;x++){
        if (matrix[y][x]){
          if (ghost) {
            ctx.globalAlpha = 0.25;
            drawCell(x + pos.x, y + yBase, color);
            ctx.globalAlpha = 1;
          } else {
            drawCell(x + pos.x, y + yBase, color);
          }
        }
      }
    }
  }

  function drawNext(){
    nctx.clearRect(0,0,NEXT_SIZE,NEXT_SIZE);
    const m = player.next.matrix;
    const c = player.next.color;
    const offsetX = Math.floor((4 - m[0].length)/2);
    const offsetY = Math.floor((4 - m.length)/2);
    for (let y=0;y<m.length;y++){
      for (let x=0;x<m[y].length;x++){
        if (m[y][x]) {
          nctx.fillStyle = c;
          nctx.fillRect((x+offsetX)*SIZE, (y+offsetY)*SIZE, SIZE, SIZE);
          nctx.fillStyle = 'rgba(255,255,255,0.06)';
          nctx.fillRect((x+offsetX)*SIZE+2, (y+offsetY)*SIZE+2, SIZE-4, SIZE-4);
        }
      }
    }
  }

  function update(time = 0){
    if (paused) {
      lastTime = time;
      requestAnimationFrame(update);
      return;
    }
    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;
    if (dropCounter > dropInterval){
      playerDrop();
    }
    draw();
    requestAnimationFrame(update);
  }

  function playerDrop(){
    player.pos.y++;
    if (collide(arena, player)){
      player.pos.y--;
      merge(arena, player);
      const cleared = clearLines();
      if (cleared > 0){
        lines += cleared;
        const base = [0, 100, 300, 500, 800][cleared];
        score += (base * level);
        if (lines >= level * 10){
          level++;
          dropInterval = Math.max(100, 1000 - (level-1)*75);
        }
        if (score > best){ best = score; localStorage.setItem('tetrixapp_best', best); }
        updateHUD();
      }
      // spawn next
      const next = player.next;
      player.matrix = next.matrix.map(r => r.slice());
      player.color = next.color;
      player.type = next.type;
      player.pos.y = 0;
      player.pos.x = ((COLS / 2) | 0) - ((player.matrix[0].length/2) | 0);
      player.next = createPiece(bag.next());
      drawNext();
      if (collide(arena, player)){
        playerReset();
      }
    }
    dropCounter = 0;
  }

  function ghostDropY(){
    const g = {
      matrix: player.matrix,
      pos: { x: player.pos.x, y: player.pos.y },
      color: player.color
    };
    while (!collide(arena, g)) {
      g.pos.y++;
    }
    return g.pos.y - 1;
  }

  function playerMove(dir){
    player.pos.x += dir;
    if (collide(arena, player)){
      player.pos.x -= dir;
    }
  }

  function playerRotate(){
    const prev = player.matrix;
    const rotated = rotate(prev);
    const oldX = player.pos.x;
    player.matrix = rotated;
    // basic SRS-like kicks
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks){
      player.pos.x = oldX + k;
      if (!collide(arena, player)) return;
    }
    // no fit, revert
    player.matrix = prev;
    player.pos.x = oldX;
  }

  function hardDrop(){ while (!collide(arena, player)) player.pos.y++; player.pos.y--; playerDrop(); }
  function softDrop(){
    player.pos.y++;
    if (collide(arena, player)){
      player.pos.y--;
    }
  }

  function updateHUD(){
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
    document.getElementById('best').textContent = best;
  }

  // Input
  // ===== Touch controls =====
  // Press-and-hold repeat for on-screen buttons
  const startRepeater = (fn) => {
    fn();
    let t = setInterval(fn, 110);
    return () => clearInterval(t);
  };
  document.querySelectorAll('.btn').forEach(b => {
    let stop = null;
    const act = b.dataset.act;
    const run = () => {
      if (act === 'left') playerMove(-1);
      else if (act === 'right') playerMove(1);
      else if (act === 'down') softDrop();
      else if (act === 'rotate') playerRotate();
      else if (act === 'drop') hardDrop();
      else if (act === 'pause') paused = !paused;
      else if (act === 'reset') initGame(true);
    };
    b.addEventListener('touchstart', (e) => { e.preventDefault(); stop = startRepeater(run); }, {passive:false});
    b.addEventListener('touchend', () => { if (stop) stop(); stop=null; }, {passive:true});
  });

  // Swipe/drag gestures on the board
  let touchStart = null;
  const minSwipe = 18; // px threshold
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    e.preventDefault();
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY, moved:false, lastX:t.clientX, lastY:t.clientY };
  }, {passive:false});

  canvas.addEventListener('touchmove', (e) => {
    if (!touchStart || e.touches.length > 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchStart.lastX;
    const dy = t.clientY - touchStart.lastY;
    // Horizontal step movement in grid-like increments
    if (Math.abs(dx) >= minSwipe) {
      playerMove(dx > 0 ? 1 : -1);
      touchStart.lastX = t.clientX;
      touchStart.moved = true;
    }
    // Soft drop when dragging down
    if (dy >= minSwipe) {
      softDrop();
      touchStart.lastY = t.clientY;
      touchStart.moved = true;
    }
  }, {passive:false});

  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    // Tap (no swipe): rotate
    if (!touchStart.moved) {
      playerRotate();
    } else {
      // Quick upward swipe => hard drop
      const totalDy = (touchStart.lastY - touchStart.y);
      if (totalDy <= -40) {
        hardDrop();
      }
    }
    touchStart = null;
  }, {passive:true});

  let paused = false;
  document.addEventListener('keydown', (e) => {
    switch(e.code){
      case 'ArrowLeft': e.preventDefault(); playerMove(-1); break;
      case 'ArrowRight': e.preventDefault(); playerMove(1); break;
      case 'ArrowDown': e.preventDefault(); softDrop(); break;
      case 'ArrowUp':
      case 'KeyW':
      case 'KeyZ': e.preventDefault(); playerRotate(); break;
      case 'Space': e.preventDefault(); hardDrop(); break;
      case 'KeyP': paused = !paused; break;
      case 'KeyR': initGame(true); break;
    }
  });

  // Buttons
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'left') playerMove(-1);
      else if (act === 'right') playerMove(1);
      else if (act === 'down') softDrop();
      else if (act === 'rotate') playerRotate();
      else if (act === 'drop') hardDrop();
      else if (act === 'pause') paused = !paused;
      else if (act === 'reset') initGame(true);
    });
  });

  
  // Install prompt
  let deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  function initGame(reset=false){
    if (reset){
      for (let y=0;y<arena.length;y++) arena[y].fill(0);
      score = 0; lines = 0; level = 1; dropInterval = 1000; updateHUD();
    }
    playerReset();
    draw();
  }

  
  // ===== Tutorial Overlay =====
  const overlay = document.getElementById('tutorialOverlay');
  const closeBtn = document.getElementById('closeTutorial');
  if (overlay && closeBtn && /Mobi|Android/i.test(navigator.userAgent)) {
    const seen = localStorage.getItem('tetrixapp_tutorial_seen');
    if (!seen) {
      overlay.hidden = false;
      closeBtn.addEventListener('click', () => {
        overlay.hidden = true;
        localStorage.setItem('tetrixapp_tutorial_seen','1');
      });
    }
  }


  // SW registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    });
  }

  initGame();
  update();
})();
