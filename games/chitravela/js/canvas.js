import { db, ref, push, remove, set, onValue, onChildAdded, onChildRemoved, get } from "./firebase-config.js";

// Classic Skribbl 18-color palette (2 rows of 9)
export const COLORS = [
  "#ffffff", "#c1c1c1", "#ef130b", "#ff7100", "#ffe400", "#00cc00", "#00b2ff", "#231fd3", "#a300ba",
  "#000000", "#4c4c4c", "#740b07", "#c23800", "#e8a200", "#005510", "#00569e", "#0e0865", "#550069"
];

export function initCanvas({ canvasEl, roomId, isDrawer, uid }) {
  const ctx = canvasEl.getContext("2d");
  const strokesRef = ref(db, `rooms/${roomId}/strokes`);
  const liveRef = ref(db, `rooms/${roomId}/liveStroke`);
  const locallyPushedKeys = new Set();

  let currentColor = "#000000";
  let currentTool = "pen"; // pen | fill | eraser
  let currentSize = 4;
  let drawing = false;
  let currentPoints = [];
  let currentStrokeId = null;
  let rafPending = false;
  let activePointerId = null;

  let liveSeenStrokeId = null;
  let liveDrawnCount = 0;

  function scheduleLiveFlush() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (!drawing || !currentStrokeId) return;
      set(liveRef, {
        uid: uid || null,
        tool: currentTool,
        color: currentColor,
        size: currentSize,
        strokeId: currentStrokeId,
        points: currentPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
        t: Date.now()
      }).catch(() => {});
    });
  }

  function drawLiveSegment(val) {
    const pts = val.points || [];
    if (!pts.length) return;
    if (val.strokeId !== liveSeenStrokeId) {
      liveSeenStrokeId = val.strokeId;
      liveDrawnCount = 0;
    }
    if (pts.length <= liveDrawnCount) return;

    ctx.strokeStyle = val.tool === "eraser" ? "#ffffff" : val.color;
    ctx.fillStyle = val.tool === "eraser" ? "#ffffff" : val.color;
    ctx.lineWidth = val.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (liveDrawnCount === 0) {
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, val.size / 2, 0, Math.PI * 2);
        ctx.fill();
        liveDrawnCount = 1;
        return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2;
        const yc = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(pts[liveDrawnCount - 1].x, pts[liveDrawnCount - 1].y);
      for (let i = liveDrawnCount; i < pts.length; i++) {
        const xc = (pts[i - 1].x + pts[i].x) / 2;
        const yc = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
    liveDrawnCount = pts.length;
  }

  onValue(liveRef, (snap) => {
    if (isDrawer()) return;
    const val = snap.val();
    if (!val) return;
    drawLiveSegment(val);
  });

  function clearCanvasVisual() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  }
  clearCanvasVisual();

  function drawPenStroke(stroke) {
    const pts = stroke.points;
    if (!pts || pts.length === 0) return;
    ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
    ctx.fillStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  function floodFill(x, y, hexColor) {
    x = Math.round(x);
    y = Math.round(y);
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
      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = 255;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function hexToRgba(hex) {
    const v = hex.replace("#", "");
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 255];
  }

  function colorsMatch(a, b) {
    return Math.abs(a[0] - b[0]) < 12 && Math.abs(a[1] - b[1]) < 12 && Math.abs(a[2] - b[2]) < 12 && Math.abs(a[3] - b[3]) < 12;
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
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function pointerDown(e) {
    if (!isDrawer()) return;
    e.preventDefault();
    activePointerId = e.pointerId;
    if (canvasEl.setPointerCapture) {
      try { canvasEl.setPointerCapture(e.pointerId); } catch (_) {}
    }

    const pos = getPos(e);

    if (currentTool === "fill") {
      const strokeObj = { tool: "fill", x: pos.x, y: pos.y, color: currentColor, t: Date.now() };
      floodFill(pos.x, pos.y, currentColor);
      const newRef = push(strokesRef, strokeObj);
      locallyPushedKeys.add(newRef.key);
      return;
    }

    drawing = true;
    currentStrokeId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    currentPoints = [pos];

    ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
    ctx.fillStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, currentSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    scheduleLiveFlush();
  }

  function pointerMove(e) {
    if (!drawing || !isDrawer()) return;
    e.preventDefault();
    const pos = getPos(e);
    currentPoints.push(pos);

    const len = currentPoints.length;
    if (len >= 3) {
      const p1 = currentPoints[len - 2];
      const p2 = currentPoints[len - 1];
      const xc = (p1.x + p2.x) / 2;
      const yc = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xc, yc);
    } else if (len === 2) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    scheduleLiveFlush();
  }

  function pointerUp(e) {
    if (!drawing || !isDrawer()) return;
    drawing = false;
    if (activePointerId !== null && canvasEl.releasePointerCapture) {
      try { canvasEl.releasePointerCapture(activePointerId); } catch (_) {}
      activePointerId = null;
    }

    set(liveRef, null).catch(() => {});
    if (currentPoints.length < 1) {
      currentStrokeId = null;
      return;
    }

    if (currentPoints.length >= 2) {
      const last = currentPoints[currentPoints.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }

    const strokeObj = {
      tool: currentTool,
      color: currentColor,
      size: currentSize,
      strokeId: currentStrokeId,
      points: currentPoints.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      t: Date.now()
    };
    const newRef = push(strokesRef, strokeObj);
    locallyPushedKeys.add(newRef.key);
    currentPoints = [];
    currentStrokeId = null;
  }

  canvasEl.addEventListener("pointerdown", pointerDown);
  canvasEl.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);
  canvasEl.addEventListener("pointercancel", pointerUp);

  return {
    setColor: (c) => currentColor = c,
    setTool: (t) => currentTool = t,
    setSize: (s) => currentSize = s,
    clearAll: async () => {
      await remove(strokesRef);
      await set(liveRef, null);
      clearCanvasVisual();
    },
    undoLast: async () => {
      const snap = await get(strokesRef);
      if (!snap.exists()) return;
      let lastKey = null;
      snap.forEach(child => { lastKey = child.key; });
      if (lastKey) await remove(ref(db, `rooms/${roomId}/strokes/${lastKey}`));
    },
    resetLocalCanvas: () => {
      clearCanvasVisual();
      liveSeenStrokeId = null;
      liveDrawnCount = 0;
    },
    COLORS
  };
}
