import { useEffect, useRef, useState } from "react";

type Pt = [number, number];
type Seg = [Pt, Pt];

const M = 0.08; // print-area margin (fraction of canvas)
const LO = M;
const HI = 1 - M;

const inside = (p: Pt) => p[0] >= LO - 1e-6 && p[0] <= HI + 1e-6 && p[1] >= LO - 1e-6 && p[1] <= HI + 1e-6;

/** Parallel lines at `angle`, clipped to the print area, serpentine order. */
function lines(angle: number, gap: number): Seg[] {
  const out: Seg[] = [];
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const c = 0.5;
  let flip = false;
  for (let o = -1; o <= 1; o += gap) {
    // clip the infinite line (c + n*o + d*t) against the square
    let t0 = -2;
    let t1 = 2;
    const px = c + nx * o;
    const py = c + ny * o;
    for (const [p, d] of [[px, dx], [py, dy]] as [number, number][]) {
      if (Math.abs(d) < 1e-9) {
        if (p < LO || p > HI) { t0 = 1; t1 = 0; }
        continue;
      }
      const a = (LO - p) / d;
      const b = (HI - p) / d;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    }
    if (t0 >= t1) continue;
    const a: Pt = [px + dx * t0, py + dy * t0];
    const b: Pt = [px + dx * t1, py + dy * t1];
    out.push(flip ? [b, a] : [a, b]);
    flip = !flip;
  }
  return out;
}

function honeycomb(r: number): Seg[] {
  const out: Seg[] = [];
  const w = Math.sqrt(3) * r;
  for (let row = -1, y = LO; y < HI + r; row++, y += 1.5 * r) {
    for (let x = LO + (row % 2 ? w / 2 : 0); x < HI + w; x += w) {
      const pts: Pt[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 180) * (60 * k - 30);
        pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
      }
      for (let k = 0; k < 6; k++) {
        const s: Seg = [pts[k], pts[(k + 1) % 6]];
        if (inside(s[0]) && inside(s[1])) out.push(s);
      }
    }
  }
  return out;
}

const PATTERNS: { name: string; segs: Seg[] }[] = [
  { name: "Rectilinear", segs: lines(Math.PI / 4, 0.045) },
  { name: "Grid", segs: [...lines(0, 0.1), ...lines(Math.PI / 2, 0.1)] },
  { name: "Honeycomb", segs: honeycomb(0.07) },
  { name: "2D Lattice", segs: [...lines(Math.PI / 4, 0.12), ...lines(-Math.PI / 4, 0.12)] },
  { name: "Cubic", segs: [...lines(0, 0.09), ...lines(Math.PI / 3, 0.09), ...lines(-Math.PI / 3, 0.09)] },
];

const DRAW_MS = 4200;
const HOLD_MS = 1100;
const FADE_MS = 500;
const CYCLE = DRAW_MS + HOLD_MS + FADE_MS;

const segLen = ([a, b]: Seg) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function InfillAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [label, setLabel] = useState(PATTERNS[0].name);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--color-accent-primary").trim() || "#1e3a8a";
    const secondary = css.getPropertyValue("--color-accent-secondary").trim() || "#0f766e";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let size = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const lens = PATTERNS.map((p) => p.segs.map(segLen));
    const totals = lens.map((l) => l.reduce((a, b) => a + b, 0));

    let idx = -1;
    let raf = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = Math.max(now - start, 0); // rAF's first timestamp can precede `start`
      const cycle = Math.floor(elapsed / CYCLE);
      const local = elapsed - cycle * CYCLE;
      const pi = cycle % PATTERNS.length;
      if (pi !== idx) {
        idx = pi;
        setLabel(PATTERNS[pi].name);
      }

      const progress = reduced ? 1 : Math.min(local / DRAW_MS, 1);
      const alpha = !reduced && local > DRAW_MS + HOLD_MS ? 1 - (local - DRAW_MS - HOLD_MS) / FADE_MS : 1;
      const S = size;
      const P = (p: Pt): Pt => [p[0] * S, p[1] * S];

      ctx.clearRect(0, 0, S, S);

      // bed grid
      ctx.strokeStyle = "rgba(100,116,139,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 10; i++) {
        ctx.moveTo((i / 10) * S, 0);
        ctx.lineTo((i / 10) * S, S);
        ctx.moveTo(0, (i / 10) * S);
        ctx.lineTo(S, (i / 10) * S);
      }
      ctx.stroke();

      // perimeter walls
      ctx.strokeStyle = primary;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.85;
      ctx.strokeRect(LO * S, LO * S, (HI - LO) * S, (HI - LO) * S);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      const inset = 0.02 * S;
      ctx.strokeRect(LO * S + inset, LO * S + inset, (HI - LO) * S - 2 * inset, (HI - LO) * S - 2 * inset);

      // infill toolpath
      const { segs } = PATTERNS[pi];
      const target = progress * totals[pi];
      let acc = 0;
      let nozzle: Pt | null = null;
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = secondary;
      ctx.beginPath();
      for (let i = 0; i < segs.length; i++) {
        const l = lens[pi][i];
        if (acc >= target) break;
        const f = Math.min((target - acc) / l, 1);
        const [a, b] = segs[i];
        const end: Pt = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        const A = P(a);
        const E = P(end);
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(E[0], E[1]);
        nozzle = end;
        acc += l;
      }
      ctx.stroke();

      // nozzle head
      if (nozzle && progress < 1) {
        const [nx, ny] = P(nozzle);
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, 22);
        g.addColorStop(0, "rgba(180,83,9,0.55)");
        g.addColorStop(1, "rgba(180,83,9,0)");
        ctx.fillStyle = g;
        ctx.fillRect(nx - 22, ny - 22, 44, 44);
        ctx.fillStyle = "#b45309";
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <div className="absolute bottom-3 right-3 rounded-md bg-bg/85 px-3 py-1.5 font-body text-[11px] font-semibold text-text-primary shadow-lg shadow-black/10 backdrop-blur-sm">
        <span className="text-text-secondary">Infill · </span>
        {label}
      </div>
    </div>
  );
}
