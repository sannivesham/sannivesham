import { db, ref, push, remove, set, onValue, onChildAdded, onChildRemoved, get } from "./firebase-config.js";

const COLORS = [
  "#000000","#ffffff","#ff6b6b","#ff922b","#ffe66d","#51cf66",
  "#4ecdc4","#339af0","#845ef7","#f06595","#8d6e63","#adb5bd"
];

export function initCanvas({ canvasEl, roomId, isDrawer, uid }) {
  const ctx = canvasEl.getContext("2d");
  const strokesRef = ref(db, `rooms/${roomId}/strokes`);
  const liveRef = ref(db, `rooms/${roomId}/liveStroke`);
  const locallyPushedKeys = new Set();

  let currentColor = "#000000";
  let currentTool = "pen"; // pen | fill | eraser
  let currentSize = 6;
  let drawing = false;
  let currentPoints = [];
  let currentStrokeId = null;
  let rafPending = false;

  // ---- Live (in-progress) stroke sync, so other players see the line
  // being drawn point-by-point in real time instead of only after the
  // drawer lifts their pen. ----
  let liveSeenStrokeId = null;
  let liveDrawnCount = 0;

  function scheduleLiveFlush() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (!drawing || !currentStrokeId) return;
      set(liveRef, {
        uid: uid || null, tool: currentTool, color: currentColor, size: currentSize,
        strokeId: currentStrokeId,
        points: currentPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
        t: Date.now()
      }).catch(() => {});
    });
  }

  function drawLiveSegment(val) {
    const pts = val.points || [];
    if (!pts.length) return;
    if (val.strokeId !== liveSeenStrokeId) { liveSeenStrokeId = val.strokeId; liveDrawnCount = 0; }
    if (pts.length <= liveDrawnCount) return;
    ctx.strokeStyle = val.tool === "eraser" ? "#ffffff" : val.color;
    ctx.lineWidth = val.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (liveDrawnCount === 0) {
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    } else {
      ctx.moveTo(pts[liveDrawnCount - 1].x, pts[liveDrawnCount - 1].y);
    }
    for (let i = Math.max(liveDrawnCount, 1); i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    liveDrawnCount = pts.length;
  }

  onValue(liveRef, (snap) => {
    if (isDrawer()) return; // the drawer already renders their own strokes locally
    const val = snap.val();
    if (!val) return;
    drawLiveSegment(val);
  });

  function resizeCanvas() {
    // Keep internal resolution fixed (800x600), CSS handles responsive scaling.
  }
  resizeCanvas();

  function clearCanvasVisual() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  }
  clearCanvasVisual();

  function drawPenStroke(stroke) {
    if (!stroke.points || stroke.points.length < 1) return;
    ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const pts = stroke.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    ctx.stroke();
  }

  function floodFill(x, y, hexColor) {
    x = Math.round(x); y = Math.round(y);
    const w = canvasEl.width, h = canvasEl.height;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const idx = (px, py) => (py * w + px) * 4;
    const target = data.slice(idx(x, y), idx(x, y) + 4);
    const fill = hexToRgba(hexColor);
    if (colorsMatch(target, fill)) return;
    const stack = [[x, y]];
    let guard = 0;
    while (stack.length && guard < 2000000) {
      guard++;
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const i = idx(cx, cy);
      if (!colorsMatch(data.slice(i, i + 4), target)) continue;
      data[i] = fill[0]; data[i+1] = fill[1]; data[i+2] = fill[2]; data[i+3] = 255;
      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }
  function hexToRgba(hex) {
    const v = hex.replace("#", "");
    return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16), 255];
  }
  function colorsMatch(a, b) {
    return Math.abs(a[0]-b[0]) < 10 && Math.abs(a[1]-b[1]) < 10 && Math.abs(a[2]-b[2]) < 10 && Math.abs(a[3]-b[3]) < 10;
  }

  function applyStroke(stroke) {
    if (stroke.tool === "fill") floodFill(stroke.x, stroke.y, stroke.color);
    else drawPenStroke(stroke);
  }

  async function fullRedraw() {
    clearCanvasVisual();
    const snap = await get(strokesRef);
    if (!snap.exists()) return;
    snap.forEach(child => { applyStroke(child.val()); });
  }

  onChildAdded(strokesRef, (snap) => {
    if (locallyPushedKeys.has(snap.key)) return;
    applyStroke(snap.val());
  });
  onChildRemoved(strokesRef, () => { fullRedraw(); });

  function getPos(e) {
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function pointerDown(e) {
    if (!isDrawer()) return;
    e.preventDefault();
    if (currentTool === "fill") {
      const pos = getPos(e);
      const strokeObj = { tool: "fill", x: pos.x, y: pos.y, color: currentColor, t: Date.now() };
      floodFill(pos.x, pos.y, currentColor);
      const newRef = push(strokesRef, strokeObj);
      locallyPushedKeys.add(newRef.key);
      return;
    }
    drawing = true;
    currentStrokeId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const pos = getPos(e);
    currentPoints = [pos];
    ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    scheduleLiveFlush();
  }
  function pointerMove(e) {
    if (!drawing || !isDrawer()) return;
    e.preventDefault();
    const pos = getPos(e);
    currentPoints.push(pos);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    scheduleLiveFlush();
  }
  function pointerUp() {
    if (!drawing || !isDrawer()) return;
    drawing = false;
    set(liveRef, null).catch(() => {});
    if (currentPoints.length < 1) { currentStrokeId = null; return; }
    const strokeObj = {
      tool: currentTool, color: currentColor, size: currentSize, strokeId: currentStrokeId,
      points: currentPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })), t: Date.now()
    };
    const newRef = push(strokesRef, strokeObj);
    locallyPushedKeys.add(newRef.key);
    currentPoints = [];
    currentStrokeId = null;
  }

  canvasEl.addEventListener("mousedown", pointerDown);
  canvasEl.addEventListener("mousemove", pointerMove);
  window.addEventListener("mouseup", pointerUp);
  canvasEl.addEventListener("touchstart", pointerDown, { passive: false });
  canvasEl.addEventListener("touchmove", pointerMove, { passive: false });
  canvasEl.addEventListener("touchend", pointerUp);

  return {
    setColor: (c) => currentColor = c,
    setTool: (t) => currentTool = t,
    setSize: (s) => currentSize = s,
    clearAll: async () => { await remove(strokesRef); await set(liveRef, null); clearCanvasVisual(); },
    undoLast: async () => {
      const snap = await get(strokesRef);
      if (!snap.exists()) return;
      let lastKey = null;
      snap.forEach(child => { lastKey = child.key; });
      if (lastKey) await remove(ref(db, `rooms/${roomId}/strokes/${lastKey}`));
    },
    resetLocalCanvas: () => { clearCanvasVisual(); liveSeenStrokeId = null; liveDrawnCount = 0; },
    COLORS
  };
}
